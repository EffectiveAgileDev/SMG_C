import { supabase } from '../supabase';
import { EncryptionService } from '../encryption/encryptionService';
import type { APIKey, APIKeyService as APIKeyServiceInterface, KeyValidationResult, PlatformType } from './types';

export class APIKeyService implements APIKeyServiceInterface {
  private supabase = supabase;
  private encryptionService: EncryptionService;

  constructor(supabaseClient = supabase, encryptionService = new EncryptionService()) {
    this.supabase = supabaseClient;
    this.encryptionService = encryptionService;
  }

  async addKey(platform: PlatformType, key: string, name: string, expiresAt?: Date): Promise<APIKey> {
    try {
      const encryptedKey = await this.encryptionService.encrypt(key);
      
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

      if (error) throw error;
      return this.mapDatabaseKeyToAPIKey(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('encrypt')) {
        throw new Error('Failed to encrypt API key');
      }
      throw error;
    }
  }

  async rotateKey(keyId: string, newKey: string): Promise<APIKey> {
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

      if (error) throw error;
      return this.mapDatabaseKeyToAPIKey(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('encrypt')) {
        throw new Error('Failed to encrypt API key');
      }
      throw error;
    }
  }

  async deactivateKey(keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) throw error;
  }

  async listKeys(platform?: PlatformType): Promise<APIKey[]> {
    let query = this.supabase
      .from('api_keys')
      .select();

    if (platform) {
      query = query.eq('platform_type', platform);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(this.mapDatabaseKeyToAPIKey);
  }

  async getActiveKey(platform: PlatformType): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select()
        .eq('platform_type', platform)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`No active API key found for platform: ${platform}`);
      }

      const key = data[0];
      const now = new Date();

      // Check if key is expired
      if (key.expires_at) {
        const expirationDate = new Date(key.expires_at);
        if (expirationDate <= now) {
          throw new Error(`No active API key found for platform: ${platform}`);
        }
      }

      const decryptedKey = await this.encryptionService.decrypt(key.encrypted_key);
      return decryptedKey;
    } catch (error) {
      if (error instanceof Error && error.message.includes('decrypt')) {
        throw new Error('Failed to decrypt API key');
      }
      throw error;
    }
  }

  async validateKey(platform: PlatformType, key: string): Promise<KeyValidationResult> {
    try {
      const activeKey = await this.getActiveKey(platform);
      return {
        isValid: activeKey === key,
        error: activeKey !== key ? 'Invalid API key' : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error validating key'
      };
    }
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

export const apiKeyService = new APIKeyService();
