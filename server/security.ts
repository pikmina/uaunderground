import crypto from "crypto";

/**
 * Genera un hash criptográfico irreversible utilizando scrypt con salt aleatorio de 16 bytes.
 * Formato resultante: "<salt_hex>:<derived_key_hex>"
 */
export function hashSecret(secret: string): string {
  if (!secret) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(secret, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Comprueba si una cadena ya tiene el formato de hash seguro "<salt>:<hex>"
 */
export function isHashed(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const parts = str.split(":");
  return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
}

/**
 * Verifica una contraseña en texto plano contra el hash guardado (o texto plano legado para migración transparente).
 * Utiliza comparación de tiempo constante (timingSafeEqual) para prevenir ataques de temporización.
 */
export function verifySecret(secret: string, storedHashOrPlain: string): boolean {
  if (!secret || !storedHashOrPlain) return false;

  // Si ya está hasheada como salt:hash
  if (storedHashOrPlain.includes(":")) {
    const parts = storedHashOrPlain.split(":");
    if (parts.length !== 2) return false;
    const [salt, expectedHash] = parts;
    try {
      const expectedBuffer = Buffer.from(expectedHash, "hex");
      const derivedKey = crypto.scryptSync(secret, salt, 64);
      if (expectedBuffer.length !== derivedKey.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuffer, derivedKey);
    } catch {
      return false;
    }
  }

  // Compatibilidad hacia atrás para migración inmediata de registros antiguos
  return secret.trim() === storedHashOrPlain.trim();
}

// Clave para firma de tokens de sesión
const SESSION_SECRET = process.env.SESSION_SECRET || "ua_session_secret_key_fixed_salt_2026_plusultra";

export interface SessionPayload {
  id: string;
  email: string;
  role: "superadmin" | "moderator";
  exp: number;
}

/**
 * Crea un token de sesión firmado criptográficamente (HMAC-SHA256)
 */
export function createSessionToken(user: { id: string; email: string; role: "superadmin" | "moderator" }): string {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días de validez
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Valida la firma del token de sesión y comprueba que no haya expirado
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;

  try {
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) {
      return null; // Expirado
    }
    return payload;
  } catch {
    return null;
  }
}

// In-memory rate limiting para prevenir ataques de fuerza bruta
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60000, blockDurationMs = 120000): { allowed: boolean; remainingSec: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record && record.blockedUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  return { allowed: true, remainingSec: 0 };
}

export function recordFailedAttempt(key: string, maxAttempts = 5, blockDurationMs = 120000) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    record.count = 0;
  }
  loginAttempts.set(key, record);
}

export function resetRateLimit(key: string) {
  loginAttempts.delete(key);
}
