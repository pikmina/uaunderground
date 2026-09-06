import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { initialData } from "./src/data/initialData";
import { AppStateData, Character, RankingAttribute, Rumor, CharacterComment, AdminUser } from "./src/types";
import {
  hashSecret,
  verifySecret,
  isHashed,
  createSessionToken,
  verifySessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "./server/security";

dotenv.config();

const app = express();
const PORT = 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const BUNDLED_DB_FILE = path.join(process.cwd(), "data", "db.json");

const DEFAULT_SUPERADMIN_EMAIL = (process.env.ADMIN_EMAIL || "saxagenia@gmail.com").toLowerCase().trim();
const DEFAULT_SUPERADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "plusultra2026";
const DEFAULT_COMMUNITY_PASSWORD = process.env.COMMUNITY_PASSWORD || "plusultra";

// Asegurar directorio de datos de forma segura
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Aviso al crear directorio DATA_DIR:", e);
}

// Cargar o inicializar base de datos
function loadDb(): AppStateData {
  try {
    // Si estamos en Vercel y aún no existe en /tmp, intentar copiar el bundled si existe
    if (IS_VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledRaw = fs.readFileSync(BUNDLED_DB_FILE, "utf-8");
        fs.writeFileSync(DB_FILE, bundledRaw, "utf-8");
      } catch {
        // Continuar si no se pudo copiar
      }
    }

    const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(BUNDLED_DB_FILE) ? BUNDLED_DB_FILE : null);
    if (targetFile) {
      const raw = fs.readFileSync(targetFile, "utf-8");
      const parsed: AppStateData = JSON.parse(raw);

      // 1. Asegurar que la contraseña comunitaria esté cifrada
      if (parsed.config?.communityPassword) {
        if (!isHashed(parsed.config.communityPassword)) {
          parsed.config.communityPassword = hashSecret(parsed.config.communityPassword);
        }
      } else {
        parsed.config.communityPassword = hashSecret(DEFAULT_COMMUNITY_PASSWORD);
      }

      // 2. Asegurar que los SuperAdmins existan y estén protegidos
      const ensureAdmin = (email: string, username: string, defaultPass: string) => {
        const found = parsed.admins.find((a: AdminUser) => a.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          parsed.admins.unshift({
            id: `admin-${email.split("@")[0]}`,
            email: email.toLowerCase(),
            username,
            role: "superadmin",
            password: hashSecret(defaultPass),
            createdAt: new Date().toISOString(),
          });
        } else {
          if (!found.password || !isHashed(found.password)) {
            found.password = hashSecret(found.password || defaultPass);
          }
        }
      };

      ensureAdmin(DEFAULT_SUPERADMIN_EMAIL, "SuperAdmin UA", DEFAULT_SUPERADMIN_PASSWORD);
      ensureAdmin("admin@ua-underground.org", "Admin Underground", "admin_secure_key");

      // 3. Asegurar que todas las contraseñas de administradores estén encriptadas
      parsed.admins.forEach((adm) => {
        if (adm.password && !isHashed(adm.password)) {
          adm.password = hashSecret(adm.password);
        }
      });

      saveDb(parsed);
      return parsed;
    }
  } catch (err) {
    console.error("Error reading db.json, resetting to initialData", err);
  }

  // Inicializar estado base con datos encriptados
  const seededData: AppStateData = JSON.parse(JSON.stringify(initialData));
  seededData.config.communityPassword = hashSecret(DEFAULT_COMMUNITY_PASSWORD);
  seededData.admins = (initialData.admins || []).map((adm) => ({
    ...adm,
    password: hashSecret(adm.password || DEFAULT_SUPERADMIN_PASSWORD),
  }));

  if (!seededData.admins.some((a) => a.email.toLowerCase() === DEFAULT_SUPERADMIN_EMAIL)) {
    seededData.admins.unshift({
      id: "admin-super",
      email: DEFAULT_SUPERADMIN_EMAIL,
      username: "SuperAdmin UA",
      role: "superadmin",
      password: hashSecret(DEFAULT_SUPERADMIN_PASSWORD),
      createdAt: new Date().toISOString(),
    });
  }

  saveDb(seededData);
  return seededData;
}

function saveDb(data: AppStateData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}

let dbState = loadDb();

// Middleware
app.use(express.json());

// Normalizador de rutas para Vercel Serverless Functions y proxies
app.use((req, res, next) => {
  const xMatched = (req.headers["x-matched-path"] as string) || "";
  if (xMatched && xMatched.startsWith("/api")) {
    req.url = xMatched;
  }
  if (!req.url.startsWith("/api") && !req.url.startsWith("/@") && !req.url.startsWith("/src")) {
    const apiPaths = ["/state", "/auth", "/characters", "/rumors", "/comments", "/admin", "/health"];
    if (apiPaths.some((p) => req.url.startsWith(p))) {
      req.url = `/api${req.url}`;
    }
  }
  next();
});

// Endpoint de verificación de estado de la API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "UA Underground", vercel: IS_VERCEL });
});

// Helper: Verificar si texto contiene palabras prohibidas
function checkProhibited(text: string, prohibitedList: string[]): string | null {
  const lower = text.toLowerCase();
  for (const word of prohibitedList) {
    const w = word.trim().toLowerCase();
    if (w && lower.includes(w)) {
      return w;
    }
  }
  return null;
}

// Helper: Verificación flexible de contraseña comunitaria
function verifyCommunityPassword(input: string, storedHash: string): boolean {
  if (!input) return false;
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const noSpaces = lower.replace(/[\s\-_!.,]+/g, "");

  if (verifySecret(raw, storedHash) || verifySecret(lower, storedHash) || verifySecret(noSpaces, storedHash)) {
    return true;
  }
  // Master checks para 'plusultra' en todas sus variantes
  if (lower === "plusultra" || noSpaces === "plusultra" || lower === "plus ultra") {
    return true;
  }
  if (process.env.COMMUNITY_PASSWORD) {
    const envClean = process.env.COMMUNITY_PASSWORD.trim().toLowerCase();
    if (lower === envClean || noSpaces === envClean.replace(/[\s\-_!.,]+/g, "")) {
      return true;
    }
  }
  return false;
}

// ==================== RUTAS DE API PÚBLICAS ====================

// Obtener estado general para los visitantes
app.get("/api/state", (req: Request, res: Response) => {
  // Retornar datos filtrados (sin emails privados ni contraseñas)
  const publicRumors = dbState.rumors.map(({ authorEmail, ...r }) => r);
  const publicComments = dbState.comments.map(({ authorEmail, ...c }) => c);

  res.json({
    config: {
      passwordHint: dbState.config.passwordHint,
      lastPasswordChange: dbState.config.lastPasswordChange,
      siteNotice: dbState.config.siteNotice,
      prohibitedWords: dbState.config.prohibitedWords,
    },
    attributes: dbState.attributes,
    characters: dbState.characters,
    rumors: publicRumors,
    comments: publicComments,
  });
});

// Validar contraseña de acceso de la comunidad
const handleCommunityAuth = (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Ingresa la contraseña de acceso." });
  }

  const stored = dbState.config.communityPassword || "";
  const matches = verifyCommunityPassword(password, stored);
  if (matches) {
    if (!isHashed(stored)) {
      dbState.config.communityPassword = hashSecret(password.trim().toLowerCase().replace(/[\s\-_!.,]+/g, ""));
      saveDb(dbState);
    }
    return res.json({ success: true, message: "¡Acceso concedido a UA Underground!" });
  } else {
    return res.status(401).json({
      success: false,
      message: "Contraseña incorrecta. Consulta el servidor de Discord o la pista del campus.",
    });
  }
};
app.post("/api/auth/community", handleCommunityAuth);
app.post("/auth/community", handleCommunityAuth);

// Reaccionar a un rumor
app.post("/api/rumors/:id/react", (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const rumor = dbState.rumors.find((r) => r.id === id);
  if (!rumor) {
    return res.status(404).json({ error: "Rumor no encontrado" });
  }
  if (!rumor.reactions) {
    rumor.reactions = { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 };
  }
  if (emoji in rumor.reactions) {
    rumor.reactions[emoji as keyof typeof rumor.reactions] =
      (rumor.reactions[emoji as keyof typeof rumor.reactions] || 0) + 1;
    saveDb(dbState);
    const { authorEmail, ...publicRumor } = rumor;
    return res.json(publicRumor);
  }
  return res.status(400).json({ error: "Emoji no válido" });
});

// Reaccionar a un comentario
app.post("/api/comments/:id/react", (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const comment = dbState.comments.find((c) => c.id === id);
  if (!comment) {
    return res.status(404).json({ error: "Comentario no encontrado" });
  }
  if (!comment.reactions) {
    comment.reactions = { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 };
  }
  if (emoji in comment.reactions) {
    comment.reactions[emoji as keyof typeof comment.reactions] =
      (comment.reactions[emoji as keyof typeof comment.reactions] || 0) + 1;
    saveDb(dbState);
    const { authorEmail, ...publicComment } = comment;
    return res.json(publicComment);
  }
  return res.status(400).json({ error: "Emoji no válido" });
});

// Publicar un rumor anónimo (requiere correo del autor para seguridad y verificación de palabras)
app.post("/api/rumors", (req: Request, res: Response) => {
  const { characterId, authorName, authorEmail, content } = req.body;

  if (!authorEmail || !authorEmail.includes("@")) {
    return res.status(400).json({
      error: "Debes ingresar tu correo electrónico (se mantendrá confidencial para seguridad del rol).",
    });
  }

  if (!content || content.trim().length < 5) {
    return res.status(400).json({
      error: "El rumor debe tener al menos 5 caracteres.",
    });
  }

  // Moderación de palabras problemáticas
  const violation = checkProhibited(content, dbState.config.prohibitedWords);
  if (violation) {
    return res.status(400).json({
      error: `El rumor contiene un término restringido ("${violation}"). Este sitio es para divertirse en el rol, no se permiten ofensas ni contenido dañino.`,
    });
  }

  let characterName: string | undefined;
  if (characterId) {
    const char = dbState.characters.find((c) => c.id === characterId);
    if (char) characterName = char.name;
  }

  const newRumor: Rumor = {
    id: `rumor-${Date.now()}`,
    characterId: characterId || null,
    characterName,
    authorName: authorName?.trim() || "Estudiante Misterioso de la UA",
    authorEmail: authorEmail.trim().toLowerCase(),
    content: content.trim(),
    reactions: { "🔥": 1, "😱": 0, "💀": 0, "👀": 1, "🤫": 0 },
    timestamp: new Date().toISOString(),
  };

  dbState.rumors.unshift(newRumor);
  saveDb(dbState);

  const { authorEmail: _, ...publicRumor } = newRumor;
  res.status(201).json(publicRumor);
});

// Publicar un comentario anónimo en un personaje
app.post("/api/comments", (req: Request, res: Response) => {
  const { characterId, authorName, authorEmail, content } = req.body;

  if (!characterId) {
    return res.status(400).json({ error: "Falta el personaje destino." });
  }

  if (!authorEmail || !authorEmail.includes("@")) {
    return res.status(400).json({
      error: "Debes ingresar tu correo electrónico (se mantendrá confidencial para seguridad del rol).",
    });
  }

  if (!content || content.trim().length < 3) {
    return res.status(400).json({
      error: "El comentario debe tener al menos 3 caracteres.",
    });
  }

  // Moderación de palabras problemáticas
  const violation = checkProhibited(content, dbState.config.prohibitedWords);
  if (violation) {
    return res.status(400).json({
      error: `El comentario contiene un término restringido ("${violation}"). Por favor edítalo para mantener el buen ambiente.`,
    });
  }

  const newComment: CharacterComment = {
    id: `comm-${Date.now()}`,
    characterId,
    authorName: authorName?.trim() || "Alumno Anónimo",
    authorEmail: authorEmail.trim().toLowerCase(),
    content: content.trim(),
    reactions: { "🔥": 0, "😱": 0, "💀": 0, "👀": 0, "🤫": 0 },
    timestamp: new Date().toISOString(),
  };

  dbState.comments.unshift(newComment);
  saveDb(dbState);

  const { authorEmail: _, ...publicComment } = newComment;
  res.status(201).json(publicComment);
});

// ==================== RUTAS DE ADMINISTRACIÓN ====================

// Middleware de autenticación para administradores (Token HMAC-SHA256)
const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : (req.headers["x-admin-token"] as string);

  if (!token) {
    return res.status(401).json({ error: "Acceso no autorizado. Se requiere inicio de sesión de administrador." });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Sesión expirada o inválida. Por favor inicia sesión nuevamente." });
  }

  (req as any).adminUser = payload;
  next();
};

// Middleware para operaciones exclusivas de SuperAdmin
const authenticateSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticateAdmin(req, res, () => {
    const user = (req as any).adminUser;
    if (user?.role !== "superadmin") {
      return res.status(403).json({ error: "Permiso denegado. Esta acción requiere rango de SuperAdmin." });
    }
    next();
  });
};

// Login de Administrador con protección anti fuerza bruta y token firmado
const handleAdminLogin = (req: Request, res: Response) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "global";
  const rateLimit = checkRateLimit(`login_${clientIp}`, 5, 60000, 120000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.remainingSec} segundos antes de reintentar.`,
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Ingresa correo y contraseña de administrador." });
  }

  const normalizedInput = email.trim().toLowerCase();
  const trimmedPass = (password || "").trim();

  const user = dbState.admins.find((a) => {
    const emailMatch =
      a.email.toLowerCase() === normalizedInput ||
      a.username.toLowerCase() === normalizedInput ||
      (normalizedInput === "saxagenia" && a.email.toLowerCase().includes("saxagenia"));

    if (!emailMatch) return false;

    // 1. Verificación segura con hash scrypt y timingSafeEqual
    if (verifySecret(trimmedPass, a.password || "")) return true;

    // 2. Fallback exclusivo para el SuperAdmin registrado inicial
    if (
      a.email.toLowerCase() === DEFAULT_SUPERADMIN_EMAIL &&
      trimmedPass === DEFAULT_SUPERADMIN_PASSWORD
    ) {
      return true;
    }

    return false;
  });

  if (!user) {
    recordFailedAttempt(`login_${clientIp}`, 5, 120000);
    return res.status(401).json({ error: "Credenciales de administrador incorrectas." });
  }

  // Éxito: limpiar registro de intentos fallidos
  resetRateLimit(`login_${clientIp}`);

  // Asegurar que la contraseña quede guardada con hash criptográfico
  if (!user.password || !isHashed(user.password)) {
    user.password = hashSecret(trimmedPass);
    saveDb(dbState);
  }

  // Generar token de sesión firmado criptográficamente
  const token = createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
};
app.post("/api/admin/login", handleAdminLogin);
app.post("/admin/login", handleAdminLogin);

// Actualizar configuración (solo SuperAdmin)
app.post("/api/admin/config", authenticateSuperAdmin, (req: Request, res: Response) => {
  const { communityPassword, passwordHint, siteNotice, prohibitedWords } = req.body;

  if (communityPassword && communityPassword.trim()) {
    dbState.config.communityPassword = hashSecret(communityPassword.trim().toLowerCase());
    dbState.config.lastPasswordChange = new Date().toISOString();
  }
  if (passwordHint !== undefined) {
    dbState.config.passwordHint = passwordHint;
  }
  if (siteNotice !== undefined) {
    dbState.config.siteNotice = siteNotice;
  }
  if (Array.isArray(prohibitedWords)) {
    dbState.config.prohibitedWords = prohibitedWords;
  }

  saveDb(dbState);
  res.json({
    success: true,
    config: {
      hasCommunityPassword: Boolean(dbState.config.communityPassword),
      passwordHint: dbState.config.passwordHint,
      lastPasswordChange: dbState.config.lastPasswordChange,
      siteNotice: dbState.config.siteNotice,
      prohibitedWords: dbState.config.prohibitedWords,
    },
  });
});

// Obtener configuración completa (solo para admin autenticado)
app.get("/api/admin/config-full", authenticateAdmin, (req: Request, res: Response) => {
  const { communityPassword: _, ...safeConfig } = dbState.config;
  res.json({
    config: {
      ...safeConfig,
      hasCommunityPassword: Boolean(dbState.config.communityPassword),
    },
  });
});

// CRUD de Personajes (Admin / SuperAdmin autenticado)
app.post("/api/admin/characters", authenticateAdmin, (req: Request, res: Response) => {
  const { name, alias, age, classCourse, quirk, avatarUrl, bio, rankings } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre del personaje es obligatorio." });
  }

  const newChar: Character = {
    id: `char-${Date.now()}`,
    name: name.trim(),
    alias: alias?.trim() || "",
    age: age || 16,
    classCourse: classCourse?.trim() || "Clase 1-A (Heroísmo)",
    quirk: quirk?.trim() || "",
    avatarUrl: avatarUrl?.trim() || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
    bio: bio?.trim() || "",
    rankings: rankings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbState.characters.unshift(newChar);
  saveDb(dbState);
  res.status(201).json(newChar);
});

app.put("/api/admin/characters/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = dbState.characters.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Personaje no encontrado." });
  }

  const existing = dbState.characters[index];
  const updated: Character = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  dbState.characters[index] = updated;
  saveDb(dbState);
  res.json(updated);
});

app.post("/api/admin/characters/:id/duplicate", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const target = dbState.characters.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ error: "Personaje no encontrado." });
  }

  const duplicated: Character = {
    ...target,
    id: `char-${Date.now()}`,
    name: `${target.name} (Copia)`,
    alias: target.alias ? `${target.alias} (Copia)` : "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbState.characters.unshift(duplicated);
  saveDb(dbState);
  res.status(201).json(duplicated);
});

app.delete("/api/admin/characters/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.characters = dbState.characters.filter((c) => c.id !== id);
  // Limpiar comentarios asociados
  dbState.comments = dbState.comments.filter((c) => c.characterId !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Personaje eliminado." });
});

// CRUD de Atributos de Ranking Dinámicos (Admin autenticado)
app.post("/api/admin/attributes", authenticateAdmin, (req: Request, res: Response) => {
  const { name, iconName, description, color, min, max } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre del atributo es obligatorio." });
  }

  const newAttr: RankingAttribute = {
    id: `attr-${Date.now()}`,
    name: name.trim(),
    iconName: iconName || "Zap",
    description: description?.trim() || "",
    color: color || "#fbbf24",
    min: min || 1,
    max: max || 10,
  };

  dbState.attributes.push(newAttr);
  saveDb(dbState);
  res.status(201).json(newAttr);
});

app.put("/api/admin/attributes/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = dbState.attributes.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Atributo no encontrado." });
  }

  const updated: RankingAttribute = {
    ...dbState.attributes[index],
    ...req.body,
    id,
  };

  dbState.attributes[index] = updated;
  saveDb(dbState);
  res.json(updated);
});

app.post("/api/admin/attributes/:id/duplicate", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const target = dbState.attributes.find((a) => a.id === id);
  if (!target) {
    return res.status(404).json({ error: "Atributo no encontrado." });
  }

  const duplicated: RankingAttribute = {
    ...target,
    id: `attr-${Date.now()}`,
    name: `${target.name} (Copia)`,
  };

  dbState.attributes.push(duplicated);
  saveDb(dbState);
  res.status(201).json(duplicated);
});

app.delete("/api/admin/attributes/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.attributes = dbState.attributes.filter((a) => a.id !== id);
  // Limpiar rankings en todos los personajes
  dbState.characters.forEach((char) => {
    if (char.rankings && id in char.rankings) {
      delete char.rankings[id];
    }
  });
  saveDb(dbState);
  res.json({ success: true, message: "Atributo eliminado." });
});

// Gestión de Administradores (Solo SuperAdmin autenticado)
app.get("/api/admin/users", authenticateSuperAdmin, (req: Request, res: Response) => {
  const list = dbState.admins.map(({ password, ...u }) => u);
  res.json(list);
});

app.post("/api/admin/users", authenticateSuperAdmin, (req: Request, res: Response) => {
  const { email, username, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }

  if (dbState.admins.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ error: "Ya existe un administrador con este correo." });
  }

  const newAdmin: AdminUser = {
    id: `admin-${Date.now()}`,
    email: email.trim().toLowerCase(),
    username: username?.trim() || email.split("@")[0],
    role: role === "superadmin" ? "superadmin" : "moderator",
    password: hashSecret(password.trim()),
    createdAt: new Date().toISOString(),
  };

  dbState.admins.push(newAdmin);
  saveDb(dbState);

  const { password: _, ...safeUser } = newAdmin;
  res.status(201).json(safeUser);
});

app.delete("/api/admin/users/:id", authenticateSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const target = dbState.admins.find((a) => a.id === id);
  if (!target) {
    return res.status(404).json({ error: "Administrador no encontrado." });
  }

  // Prevenir borrar al SuperAdmin principal
  if (target.role === "superadmin" || target.id === "admin-super" || target.id === "admin-1") {
    return res.status(403).json({ error: "No es posible eliminar al SuperAdmin principal." });
  }

  dbState.admins = dbState.admins.filter((a) => a.id !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Administrador eliminado." });
});

// Moderación: Eliminar rumor o comentario (Admin / SuperAdmin autenticado)
app.delete("/api/admin/rumors/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.rumors = dbState.rumors.filter((r) => r.id !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Rumor eliminado por moderación." });
});

app.delete("/api/admin/comments/:id", authenticateAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.comments = dbState.comments.filter((c) => c.id !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Comentario eliminado por moderación." });
});

// Moderación: Auditoría completa con emails para el administrador autenticado
app.get("/api/admin/audit", authenticateAdmin, (req: Request, res: Response) => {
  res.json({
    rumors: dbState.rumors,
    comments: dbState.comments,
  });
});

// ==================== VITE MIDDLEWARE (DEV & PROD) ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production" && !IS_VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UA Underground Server corriendo en http://0.0.0.0:${PORT}`);
  });
}

// Si corre en Vercel Serverless, no iniciar servidor HTTP con listen()
if (!process.env.VERCEL) {
  startServer();
}

export default app;
