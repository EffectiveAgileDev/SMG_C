import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private readonly keyLength = 32; // 256 bits
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly saltLength = 16;
  private readonly tagLength = 16;

  constructor(private readonly masterKey: string) {}

  private async deriveKey(salt: Buffer): Promise<Buffer> {
    return scryptAsync(
      this.masterKey,
      salt,
      this.keyLength
    ) as Promise<Buffer>;
  }

  async encrypt(plaintext: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const key = await this.deriveKey(salt);
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    // Format: base64(salt + iv + tag + ciphertext)
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64');
  }

  async decrypt(ciphertext: string): Promise<string> {
    if (!this.isValidCiphertext(ciphertext)) {
      throw new Error('Invalid ciphertext format');
    }

    try {
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);

      const key = await this.deriveKey(salt);
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  isValidCiphertext(ciphertext: string): boolean {
    try {
      const buffer = Buffer.from(ciphertext, 'base64');
      // Minimum length = Salt (16) + IV (12) + Tag (16) + At least 1 byte of ciphertext
      return buffer.length >= this.saltLength + this.ivLength + this.tagLength + 1;
    } catch {
      return false;
    }
  }

  async rotateMasterKey(ciphertext: string, newMasterKey: string): Promise<string> {
    // Decrypt with current key
    const plaintext = await this.decrypt(ciphertext);
    
    // Create new service with new master key
    const newService = new EncryptionService(newMasterKey);
    
    // Re-encrypt with new key
    return newService.encrypt(plaintext);
  }
} 