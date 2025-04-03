import { Buffer } from 'buffer';
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly saltLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly masterKey: Buffer;

  constructor(masterKey = process.env.VITE_ENCRYPTION_KEY || 'default-master-key-for-development-only') {
    this.masterKey = Buffer.from(masterKey);
  }

  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate a random salt and IV
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);

      // Derive a key using the salt
      const key = scryptSync(this.masterKey, salt, this.keyLength);

      // Create cipher and encrypt
      const cipher = createCipheriv(this.algorithm, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(plaintext)),
        cipher.final()
      ]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components: salt (16) + iv (12) + tag (16) + ciphertext
      const result = Buffer.concat([salt, iv, tag, encrypted]);

      // Return as base64 string
      return result.toString('base64');
    } catch (error) {
      throw new Error(`Failed to encrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(ciphertext: string): Promise<string> {
    try {
      // Convert base64 to buffer
      const data = Buffer.from(ciphertext, 'base64');

      // Extract components
      const salt = data.subarray(0, this.saltLength);
      const iv = data.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = data.subarray(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = data.subarray(this.saltLength + this.ivLength + this.tagLength);

      // Derive key using the same salt
      const key = scryptSync(this.masterKey, salt, this.keyLength);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString();
    } catch (error) {
      throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 