import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

export function hashPhoneNumber(normalizedPhone: string) {
  const secret = process.env.PHONE_HASH_SECRET;

  if (!secret) {
    throw new Error("PHONE_HASH_SECRET is not configured.");
  }

  return createHmac("sha256", secret).update(normalizedPhone).digest("hex");
}

export function encryptPhoneNumber(normalizedPhone: string) {
  const key = getEncryptionKey();

  if (!key) {
    return null;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(normalizedPhone, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptPhoneNumber(encryptedPhone: string | null) {
  const key = getEncryptionKey();

  if (!key || !encryptedPhone) {
    return null;
  }

  const [version, ivValue, authTagValue, encryptedValue] = encryptedPhone.split(".");

  if (version !== "v1" || !ivValue || !authTagValue || !encryptedValue) {
    return null;
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function getEncryptionKey() {
  const secret = process.env.PHONE_ENCRYPTION_KEY;

  if (!secret) {
    return null;
  }

  if (/^[0-9a-f]{64}$/i.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  return createHash("sha256").update(secret).digest();
}
