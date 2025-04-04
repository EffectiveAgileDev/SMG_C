import { Database } from '../../types/supabase';

export type PlatformType = 'twitter' | 'linkedin' | 'openai';

/**
 * Enumeration of possible API key error codes
 */
export enum APIKeyErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_EXPIRED = 'KEY_EXPIRED',
  INVALID_KEY = 'INVALID_KEY',
}

/**
 * Interface for structured API key errors
 */
export interface APIKeyError {
  code: APIKeyErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Interface for API key service configuration parameters
 */
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

/**
 * Generic result interface for API key operations
 */
export interface APIKeyResult<T> {
  data: T | null;
  error: APIKeyError | null;
}

export interface APIKey {
  id: string;
  platformType: string;
  keyName: string;
  encryptedKey: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface KeyValidationResult {
  isValid: boolean;
  error?: APIKeyError;
}

/**
 * Interface for API key service
 */
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

/**
 * Default configuration for API key service
 */
export const DEFAULT_API_KEY_CONFIG: APIKeyConfig = {
  minKeyNameLength: 3,
  maxKeyNameLength: 64,
  maxKeysPerPlatform: 5,
  defaultExpirationDays: 30, // days
  allowMultipleActiveKeys: false,
}; 