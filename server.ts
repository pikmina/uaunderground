import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initialData } from "./src/data/initialData";
import { AppStateData, Character, RankingAttribute, Rumor, CharacterComment, AdminUser } from "./src/types";
import { hashSecret, verifySecret, isHashed } from "./server/security";

dotenv.config();

const app = express();
const PORT = 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const BUNDLED_DB_FILE = path.join(process.cwd(), "data", "db.json");

const DEFAULT_SUPERADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@ua-underground.org").toLowerCase().trim();
const DEFAULT_SUPERADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin_secure_key";
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

      // 2. Asegurar que el SuperAdmin exista y esté protegido
      let superAdmin = parsed.admins.find((a: AdminUser) => a.role === "superadmin");
      if (!superAdmin) {
        superAdmin = {
          id: "admin-super",
          email: DEFAULT_SUPERADMIN_EMAIL,
          username: "SuperAdmin UA",
          role: "superadmin",
          password: hashSecret(DEFAULT_SUPERADMIN_PASSWORD),
          createdAt: new Date().toISOString(),
        };
        parsed.admins.unshift(superAdmin);
      } else {
        // Si el usuario configuró ADMIN_EMAIL por variable de entorno, sincronizar
        if (process.env.ADMIN_EMAIL && superAdmin.email.toLowerCase() !== DEFAULT_SUPERADMIN_EMAIL) {
          superAdmin.email = DEFAULT_SUPERADMIN_EMAIL;
        }
        // Asegurar que la contraseña esté cifrada con hash
        if (!superAdmin.password || !isHashed(superAdmin.password)) {
          superAdmin.password = hashSecret(superAdmin.password || DEFAULT_SUPERADMIN_PASSWORD);
        }
      }

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
  seededData.admins = [
    {
      id: "admin-super",
      email: DEFAULT_SUPERADMIN_EMAIL,
      username: "SuperAdmin UA",
      role: "superadmin",
      password: hashSecret(DEFAULT_SUPERADMIN_PASSWORD),
      createdAt: new Date().toISOString(),
    },
  ];

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
  if (!req.url.startsWith("/api") && !req.url.startsWith("/@") && !req.url.startsWith("/src")) {
    const apiPaths = ["/state", "/auth", "/characters", "/rumors", "/comments", "/admin"];
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
app.post("/api/auth/community", (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Ingresa la contraseña de acceso." });
  }

  const stored = dbState.config.communityPassword || "";
  const matches = verifySecret(password.trim().toLowerCase(), stored) || verifySecret(password.trim(), stored);
  if (matches) {
    if (!isHashed(stored)) {
      dbState.config.communityPassword = hashSecret(password.trim().toLowerCase());
      saveDb(dbState);
    }
    return res.json({ success: true, message: "¡Acceso concedido a UA Underground!" });
  } else {
    return res.status(401).json({
      success: false,
      message: "Contraseña incorrecta. Consulta el servidor de Discord o la pista del campus.",
    });
  }
});

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

// Login de Administrador
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Ingresa correo y contraseña de administrador." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = dbState.admins.find(
    (a) => a.email.toLowerCase() === normalizedEmail && verifySecret(password, a.password || "")
  );

  if (!user) {
    return res.status(401).json({ error: "Credenciales de administrador inválidas." });
  }

  if (user.password && !isHashed(user.password)) {
    user.password = hashSecret(password);
    saveDb(dbState);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
});

// Actualizar configuración (contraseña comunitaria, pista, aviso, palabras prohibidas)
app.post("/api/admin/config", (req: Request, res: Response) => {
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

// Obtener configuración completa (solo para admin logueado)
app.get("/api/admin/config-full", (req: Request, res: Response) => {
  const { communityPassword: _, ...safeConfig } = dbState.config;
  res.json({
    config: {
      ...safeConfig,
      hasCommunityPassword: Boolean(dbState.config.communityPassword),
    },
  });
});

// CRUD de Personajes
app.post("/api/admin/characters", (req: Request, res: Response) => {
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

app.put("/api/admin/characters/:id", (req: Request, res: Response) => {
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

app.post("/api/admin/characters/:id/duplicate", (req: Request, res: Response) => {
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

app.delete("/api/admin/characters/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.characters = dbState.characters.filter((c) => c.id !== id);
  // Limpiar comentarios asociados
  dbState.comments = dbState.comments.filter((c) => c.characterId !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Personaje eliminado." });
});

// CRUD de Atributos de Ranking Dinámicos
app.post("/api/admin/attributes", (req: Request, res: Response) => {
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

app.put("/api/admin/attributes/:id", (req: Request, res: Response) => {
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

app.post("/api/admin/attributes/:id/duplicate", (req: Request, res: Response) => {
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

app.delete("/api/admin/attributes/:id", (req: Request, res: Response) => {
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

// Gestión de Administradores
app.get("/api/admin/users", (req: Request, res: Response) => {
  const list = dbState.admins.map(({ password, ...u }) => u);
  res.json(list);
});

app.post("/api/admin/users", (req: Request, res: Response) => {
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

app.delete("/api/admin/users/:id", (req: Request, res: Response) => {
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

// Moderación: Eliminar rumor o comentario
app.delete("/api/admin/rumors/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.rumors = dbState.rumors.filter((r) => r.id !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Rumor eliminado por moderación." });
});

app.delete("/api/admin/comments/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  dbState.comments = dbState.comments.filter((c) => c.id !== id);
  saveDb(dbState);
  res.json({ success: true, message: "Comentario eliminado por moderación." });
});

// Moderación: Auditoría completa con emails para el administrador
app.get("/api/admin/audit", (req: Request, res: Response) => {
  res.json({
    rumors: dbState.rumors,
    comments: dbState.comments,
  });
});

// ==================== VITE MIDDLEWARE (DEV & PROD) ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
