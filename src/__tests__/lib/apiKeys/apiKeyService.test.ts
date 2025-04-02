import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIKey } from '../../../lib/apiKeys/types';
import { APIKeyService } from '../../../lib/apiKeys/apiKeyService';

const mockApiKey: APIKey = {
  id: '123',
  platformType: 'twitter',
  keyName: 'Test Key',
  encryptedKey: 'encrypted-key-123',
  isActive: true,
  metadata: { lastUsed: new Date().toISOString() }
};

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ 
      data: {
        id: mockApiKey.id,
        platform_type: mockApiKey.platformType,
        key_name: mockApiKey.keyName,
        encrypted_key: mockApiKey.encryptedKey,
        is_active: mockApiKey.isActive,
        metadata: mockApiKey.metadata
      }, 
      error: null 
    }),
    limit: vi.fn().mockReturnThis()
  }))
};

// Mock the supabase module
vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('API Key Service', () => {
  let apiKeyService: APIKeyService;
  const selectSpy = vi.fn().mockReturnThis();
  const insertSpy = vi.fn().mockReturnThis();
  const updateSpy = vi.fn().mockReturnThis();
  const eqSpy = vi.fn().mockReturnThis();
  const limitSpy = vi.fn().mockReturnThis();
  const singleSpy = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue({
      select: selectSpy,
      insert: insertSpy,
      update: updateSpy,
      eq: eqSpy,
      limit: limitSpy,
      single: singleSpy.mockResolvedValue({ 
        data: {
          id: mockApiKey.id,
          platform_type: mockApiKey.platformType,
          key_name: mockApiKey.keyName,
          encrypted_key: mockApiKey.encryptedKey,
          is_active: mockApiKey.isActive,
          metadata: mockApiKey.metadata
        }, 
        error: null 
      })
    });
    apiKeyService = new APIKeyService();
  });

  describe('Basic CRUD Operations', () => {
    it('should add a new API key', async () => {
      const result = await apiKeyService.addKey('twitter', 'test-key', 'Test Key');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_keys');
      expect(insertSpy).toHaveBeenCalledWith({
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'test-key',
        is_active: true
      });
      expect(result).toEqual(mockApiKey);
    });

    it('should list API keys for a platform', async () => {
      selectSpy.mockResolvedValueOnce({ 
        data: [{
          id: mockApiKey.id,
          platform_type: mockApiKey.platformType,
          key_name: mockApiKey.keyName,
          encrypted_key: mockApiKey.encryptedKey,
          is_active: mockApiKey.isActive,
          metadata: mockApiKey.metadata
        }],
        error: null 
      });

      const result = await apiKeyService.listKeys('twitter');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_keys');
      expect(selectSpy).toHaveBeenCalled();
      expect(eqSpy).toHaveBeenCalledWith('platform_type', 'twitter');
      expect(result).toEqual([mockApiKey]);
    });

    it('should deactivate an API key', async () => {
      updateSpy.mockResolvedValueOnce({ data: null, error: null });

      await apiKeyService.deactivateKey('123');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_keys');
      expect(updateSpy).toHaveBeenCalledWith({ is_active: false });
      expect(eqSpy).toHaveBeenCalledWith('id', '123');
    });

    it('should get an active key for a platform', async () => {
      selectSpy.mockResolvedValueOnce({ 
        data: [{
          id: mockApiKey.id,
          platform_type: mockApiKey.platformType,
          key_name: mockApiKey.keyName,
          encrypted_key: mockApiKey.encryptedKey,
          is_active: true,
          metadata: mockApiKey.metadata
        }],
        error: null 
      });

      const result = await apiKeyService.getActiveKey('twitter');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_keys');
      expect(selectSpy).toHaveBeenCalled();
      expect(eqSpy).toHaveBeenCalledWith('platform_type', 'twitter');
      expect(eqSpy).toHaveBeenCalledWith('is_active', true);
      expect(limitSpy).toHaveBeenCalledWith(1);
      expect(result).toBe(mockApiKey.encryptedKey);
    });

    it('should throw error when no active key found', async () => {
      selectSpy.mockResolvedValueOnce({ data: [], error: null });

      await expect(apiKeyService.getActiveKey('twitter'))
        .rejects
        .toThrow('No active API key found for platform: twitter');
    });
  });
}); 