import { supabase } from '../supabase';
import { EncryptionService } from '../encryption/encryptionService';
import { APIKeyErrorCode } from './types';
import type { 
  APIKey, 
  APIKeyService as APIKeyServiceInterface, 
  KeyValidationResult, 
  PlatformType,
  APIKeyConfig,
  APIKeyError,
  APIKeyResult
} from './types';

export class APIKeyService implements APIKeyServiceInterface {
  private readonly supabase = supabase;
  private readonly encryptionService: EncryptionService;
  private readonly config: APIKeyConfig;

  constructor(
    supabaseClient = supabase, 
    encryptionService = new EncryptionService(),
    config: Partial<APIKeyConfig> = {}
  ) {
    this.supabase = supabaseClient;
    this.encryptionService = encryptionService;
    this.config = {
      minKeyNameLength: 3,
      maxKeyNameLength: 50,
      allowMultipleActiveKeys: false,
      maxKeysPerPlatform: 5,
      ...config
    };
  }

  async addKey(
    platform: PlatformType, 
    key: string, 
    name: string, 
    expiresAt?: Date
  ): Promise<APIKeyResult<APIKey>> {
    // Validate inputs
    const validationError = this.validateKeyInput(name);
    if (validationError) {
      return this.createErrorResponse(validationError);
    }

    try {
      // Encrypt key first to catch encryption errors before checking limits
      let encryptedKey: string;
      try {
        encryptedKey = await this.encryptionService.encrypt(key);
      } catch (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.ENCRYPTION_FAILED,
          message: 'Failed to encrypt API key'
        });
      }

      // Check platform key limits
      if (!await this.checkPlatformKeyLimit(platform)) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.VALIDATION_ERROR,
          message: `Maximum number of keys (${this.config.maxKeysPerPlatform}) reached for platform ${platform}`
        });
      }
      
      // Insert into database
      const { data, error } = await this.supabase
        .from('api_keys')
        .insert({
          platform_type: platform,
          key_name: name,
          encrypted_key: encryptedKey,
          expires_at: expiresAt?.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.DATABASE_ERROR,
          message: 'Failed to save API key',
          details: { error: error.message }
        });
      }

      return {
        data: this.mapDatabaseKeyToAPIKey(data),
        error: null
      };
    } catch (error) {
      return this.createErrorResponse({
        code: APIKeyErrorCode.DATABASE_ERROR,
        message: 'Unexpected error adding key',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async rotateKey(keyId: string, newKey: string): Promise<APIKeyResult<APIKey>> {
    try {
      const encryptedKey = await this.encryptionService.encrypt(newKey);
      
      const { data, error } = await this.supabase
        .from('api_keys')
        .update({ 
          encrypted_key: encryptedKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.DATABASE_ERROR,
          message: 'Failed to rotate API key',
          details: { error: error.message }
        });
      }

      return {
        data: this.mapDatabaseKeyToAPIKey(data),
        error: null
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('encrypt')) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.ENCRYPTION_FAILED,
          message: 'Failed to encrypt new API key'
        });
      }
      return this.createErrorResponse({
        code: APIKeyErrorCode.DATABASE_ERROR,
        message: 'Unexpected error rotating key',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async deactivateKey(keyId: string): Promise<APIKeyResult<boolean>> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) {
      return this.createErrorResponse({
        code: APIKeyErrorCode.DATABASE_ERROR,
        message: 'Failed to deactivate API key',
        details: { error: error.message }
      });
    }

    return { data: true, error: null };
  }

  async listKeys(platform?: PlatformType): Promise<APIKeyResult<APIKey[]>> {
    try {
      let query = this.supabase
        .from('api_keys')
        .select();

      if (platform) {
        query = query.eq('platform_type', platform);
      }

      const { data, error } = await query;

      if (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.DATABASE_ERROR,
          message: 'Failed to list API keys',
          details: { error: error.message }
        });
      }

      return {
        data: data.map(this.mapDatabaseKeyToAPIKey),
        error: null
      };
    } catch (error) {
      return this.createErrorResponse({
        code: APIKeyErrorCode.DATABASE_ERROR,
        message: 'Unexpected error listing keys',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async getActiveKey(platform: PlatformType): Promise<APIKeyResult<string>> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select()
        .eq('platform_type', platform)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.DATABASE_ERROR,
          message: 'Failed to retrieve active API key',
          details: { error: error.message }
        });
      }

      if (!data || data.length === 0) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.KEY_NOT_FOUND,
          message: `No active API key found for platform: ${platform}`
        });
      }

      const key = data[0];
      const now = new Date();

      // Check if key is expired
      if (key.expires_at) {
        const expirationDate = new Date(key.expires_at);
        if (expirationDate <= now) {
          return this.createErrorResponse({
            code: APIKeyErrorCode.KEY_EXPIRED,
            message: `API key for platform ${platform} has expired`,
            details: { expiredAt: expirationDate }
          });
        }
      }

      try {
        const decryptedKey = await this.encryptionService.decrypt(key.encrypted_key);
        return {
          data: decryptedKey,
          error: null
        };
      } catch (error) {
        return this.createErrorResponse({
          code: APIKeyErrorCode.DECRYPTION_FAILED,
          message: 'Failed to decrypt API key'
        });
      }
    } catch (error) {
      return this.createErrorResponse({
        code: APIKeyErrorCode.DATABASE_ERROR,
        message: 'Unexpected error getting active key',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async validateKey(platform: PlatformType, key: string): Promise<KeyValidationResult> {
    const activeKeyResult = await this.getActiveKey(platform);

    if (activeKeyResult.error) {
      return {
        isValid: false,
        error: activeKeyResult.error
      };
    }

    return {
      isValid: activeKeyResult.data === key,
      error: activeKeyResult.data !== key ? {
        code: APIKeyErrorCode.INVALID_KEY,
        message: 'Invalid API key'
      } : undefined
    };
  }

  private validateKeyInput(name: string): APIKeyError | null {
    if (name.length < this.config.minKeyNameLength) {
      return {
        code: APIKeyErrorCode.VALIDATION_ERROR,
        message: `Key name must be at least ${this.config.minKeyNameLength} characters long`
      };
    }

    if (name.length > this.config.maxKeyNameLength) {
      return {
        code: APIKeyErrorCode.VALIDATION_ERROR,
        message: `Key name cannot exceed ${this.config.maxKeyNameLength} characters`
      };
    }

    return null;
  }

  private async checkPlatformKeyLimit(platform: PlatformType): Promise<boolean> {
    if (!this.config.maxKeysPerPlatform) {
      return true;
    }

    const result = await this.listKeys(platform);
    if (result.error || !result.data) {
      return false;
    }

    return result.data.length < this.config.maxKeysPerPlatform;
  }

  private createErrorResponse<T>(error: APIKeyError): APIKeyResult<T> {
    return {
      data: null,
      error
    };
  }

  private mapDatabaseKeyToAPIKey(dbKey: any): APIKey {
    return {
      id: dbKey.id,
      platformType: dbKey.platform_type,
      keyName: dbKey.key_name,
      encryptedKey: dbKey.encrypted_key,
      expiresAt: dbKey.expires_at ? new Date(dbKey.expires_at) : undefined,
      isActive: dbKey.is_active,
      metadata: dbKey.metadata
    };
  }
}
