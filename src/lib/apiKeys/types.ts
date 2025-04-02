export type PlatformType = 'twitter' | 'linkedin' | 'openai';

export interface APIKey {
  id: string;
  platformType: PlatformType;
  keyName: string;
  encryptedKey: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface KeyValidationResult {
  isValid: boolean;
  error?: string;
}

export interface APIKeyService {
  // Key Management
  addKey(platform: PlatformType, key: string, name: string): Promise<APIKey>;
  rotateKey(keyId: string, newKey: string): Promise<APIKey>;
  deactivateKey(keyId: string): Promise<void>;
  listKeys(platform?: PlatformType): Promise<APIKey[]>;
  
  // Key Usage
  getActiveKey(platform: PlatformType): Promise<string>;
  validateKey(platform: PlatformType, key: string): Promise<KeyValidationResult>;
} 