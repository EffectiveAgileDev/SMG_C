import { supabase } from '../supabase';
import type { APIKey, APIKeyService as APIKeyServiceInterface, KeyValidationResult, PlatformType } from './types';

export class APIKeyService implements APIKeyServiceInterface {
  private supabase = supabase;

  async addKey(platform: PlatformType, key: string, name: string): Promise<APIKey> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .insert({
        platform_type: platform,
        key_name: name,
        encrypted_key: key, // TODO: Add encryption
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDatabaseKeyToAPIKey(data);
  }

  async rotateKey(keyId: string, newKey: string): Promise<APIKey> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .update({ 
        encrypted_key: newKey, // TODO: Add encryption
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .select()
      .single();

    if (error) throw error;
    return this.mapDatabaseKeyToAPIKey(data);
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

    return data[0].encrypted_key;
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
