import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../../../lib/apiKeys/encryption';

describe('API Key Encryption Service', () => {
  let encryptionService: EncryptionService;
  const testKey = 'test-api-key-123';
  const masterKey = 'master-key-456';

  beforeEach(() => {
    // Create new instance for each test
    encryptionService = new EncryptionService(masterKey);
  });

  describe('Key Encryption', () => {
    it('should encrypt an API key', async () => {
      const encrypted = await encryptionService.encrypt(testKey);
      
      // Encrypted value should be different from original
      expect(encrypted).not.toBe(testKey);
      // Should be base64 encoded
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
      // Should include initialization vector (IV)
      expect(encrypted.length).toBeGreaterThan(24);
    });

    it('should decrypt an encrypted API key', async () => {
      const encrypted = await encryptionService.encrypt(testKey);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(testKey);
    });

    it('should generate different ciphertexts for same input', async () => {
      const encrypted1 = await encryptionService.encrypt(testKey);
      const encrypted2 = await encryptionService.encrypt(testKey);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      const decrypted1 = await encryptionService.decrypt(encrypted1);
      const decrypted2 = await encryptionService.decrypt(encrypted2);
      expect(decrypted1).toBe(decrypted2);
    });
  });

  describe('Key Validation', () => {
    it('should throw error when decrypting with wrong master key', async () => {
      const encrypted = await encryptionService.encrypt(testKey);
      
      // Create new service with different master key
      const wrongService = new EncryptionService('wrong-master-key');
      
      await expect(wrongService.decrypt(encrypted))
        .rejects
        .toThrow('Decryption failed');
    });

    it('should throw error when decrypting invalid ciphertext', async () => {
      await expect(encryptionService.decrypt('invalid-ciphertext'))
        .rejects
        .toThrow('Invalid ciphertext format');
    });

    it('should validate ciphertext format', async () => {
      const encrypted = await encryptionService.encrypt(testKey);
      
      expect(encryptionService.isValidCiphertext(encrypted)).toBe(true);
      expect(encryptionService.isValidCiphertext('invalid')).toBe(false);
    });
  });

  describe('Key Rotation', () => {
    it('should rotate encryption key', async () => {
      // Encrypt with original key
      const encrypted = await encryptionService.encrypt(testKey);
      
      // Rotate to new master key
      const newMasterKey = 'new-master-key-789';
      const rotatedCiphertext = await encryptionService.rotateMasterKey(encrypted, newMasterKey);
      
      // Original service shouldn't be able to decrypt rotated ciphertext
      await expect(encryptionService.decrypt(rotatedCiphertext))
        .rejects
        .toThrow('Decryption failed');
      
      // New service should be able to decrypt
      const newService = new EncryptionService(newMasterKey);
      const decrypted = await newService.decrypt(rotatedCiphertext);
      expect(decrypted).toBe(testKey);
    });
  });
}); 