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
