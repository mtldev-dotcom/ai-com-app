/**
 * Encryption Utility
 * Handles encryption and decryption of sensitive data (API tokens)
 * Uses Node.js built-in crypto module with AES-256-GCM
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (should be set in production)
 */
function getEncryptionKey(): Buffer {
  const key =
    process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production";

  // Derive a 32-byte key using scrypt
  return scryptSync(key, "salt", 32);
}

/**
 * Encrypts a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted string (base64 encoded IV + encrypted data + auth tag)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(16); // Initialization vector

    const cipher = createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    // Format: iv:authTag:encryptedData (all base64)
    const ivBase64 = iv.toString("base64");
    const authTagBase64 = authTag.toString("base64");

    return `${ivBase64}:${authTagBase64}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string value
 * @param encryptedText - Encrypted string (format: iv:authTag:encryptedData)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted text into IV, auth tag, and encrypted data
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Masks a token value for display (shows first 4 and last 4 characters)
 * @param token - Token value to mask
 * @returns Masked token string
 */
export function maskToken(token: string): string {
  if (token.length <= 8) {
    return "****";
  }
  return `${token.substring(0, 4)}****${token.substring(token.length - 4)}`;
}
