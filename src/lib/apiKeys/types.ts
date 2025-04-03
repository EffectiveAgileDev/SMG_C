export type PlatformType = 'twitter' | 'linkedin' | 'openai';

export enum APIKeyErrorCode {
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_EXPIRED = 'KEY_EXPIRED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_KEY = 'INVALID_KEY',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface APIKeyError {
  message: string;
  code: APIKeyErrorCode;
  details?: Record<string, unknown>;
}

export interface APIKeyConfig {
  // Default expiration time in days (undefined means no expiration)
  defaultExpirationDays?: number;
  // Maximum allowed keys per platform
  maxKeysPerPlatform?: number;
  // Minimum key name length
  minKeyNameLength: number;
  // Maximum key name length
  maxKeyNameLength: number;
  // Whether to allow multiple active keys per platform
  allowMultipleActiveKeys: boolean;
}

export interface APIKeyResult<T> {
  data: T | null;
  error: APIKeyError | null;
}

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
  error?: APIKeyError;
}

export interface APIKeyService {
  // Key Management
  addKey(platform: PlatformType, key: string, name: string, expiresAt?: Date): Promise<APIKeyResult<APIKey>>;
  rotateKey(keyId: string, newKey: string): Promise<APIKeyResult<APIKey>>;
  deactivateKey(keyId: string): Promise<APIKeyResult<boolean>>;
  listKeys(platform?: PlatformType): Promise<APIKeyResult<APIKey[]>>;
  
  // Key Usage
  getActiveKey(platform: PlatformType): Promise<APIKeyResult<string>>;
  validateKey(platform: PlatformType, key: string): Promise<KeyValidationResult>;
} 