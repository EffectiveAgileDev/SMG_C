import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIKey } from '../../../lib/apiKeys/types';
import { APIKeyService } from '../../../lib/apiKeys/apiKeyService';
import type { EncryptionService } from '../../../lib/encryption/encryptionService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Set expiration date to 1 day in the future
const now = new Date();
const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

// API format (camelCase)
const mockApiKey: APIKey = {
  id: '123',
  platformType: 'twitter',
  keyName: 'Test Key',
  encryptedKey: 'encrypted-key-123',
  isActive: true,
  expiresAt: futureDate,
  metadata: { lastUsed: now.toISOString() }
};

// Database format (snake_case)
const mockDbKey = {
  id: '123',
  platform_type: 'twitter',
  key_name: 'Test Key',
  encrypted_key: 'encrypted-key-123',
  is_active: true,
  expires_at: futureDate.toISOString(),
  metadata: { lastUsed: now.toISOString() }
};

// Mock encryption service
type MockEncryptionService = {
  encrypt: ReturnType<typeof vi.fn>;
  decrypt: ReturnType<typeof vi.fn>;
};

const mockEncryptionService: MockEncryptionService = {
  encrypt: vi.fn(),
  decrypt: vi.fn()
};

mockEncryptionService.encrypt.mockResolvedValue('encrypted-key-123');
mockEncryptionService.decrypt.mockResolvedValue('decrypted-key-123');

describe('API Key Service', () => {
  let apiKeyService: APIKeyService;
  let mockChain: any;
  
  beforeEach(() => {
    vi.clearAllMocks();

    // Create a chainable mock query builder
    const createMockChain = () => {
      let currentOperation = '';
      
      const chain = {
        select: vi.fn(() => { currentOperation = 'select'; return chain; }),
        insert: vi.fn(() => { currentOperation = 'insert'; return chain; }),
        update: vi.fn(() => { currentOperation = 'update'; return chain; }),
        eq: vi.fn(() => chain),
        single: vi.fn(() => {
          return Promise.resolve({
            data: currentOperation === 'insert' ? mockDbKey : null,
            error: null
          });
        }),
        limit: vi.fn(() => {
          return Promise.resolve({
            data: [mockDbKey],
            error: null
          });
        }),
        then: vi.fn((onfulfilled) => {
          let responseData;
          switch (currentOperation) {
            case 'select':
              responseData = { data: [mockDbKey], error: null };
              break;
            case 'update':
              responseData = { data: null, error: null };
              break;
            default:
              responseData = { data: null, error: null };
          }
          return Promise.resolve(responseData).then(onfulfilled);
        })
      };

      return chain;
    };

    mockChain = createMockChain();

    // Mock Supabase client
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue(mockChain)
    } as unknown as SupabaseClient;

    apiKeyService = new APIKeyService(mockSupabaseClient, mockEncryptionService as any);
  });

  describe('Basic CRUD Operations', () => {
    it('should add a new API key', async () => {
      const rawKey = 'test-key';
      mockEncryptionService.encrypt.mockResolvedValueOnce('encrypted-key-123');
      
      // Override single response for insert
      mockChain.single.mockImplementation(() => Promise.resolve({
        data: mockDbKey,
        error: null
      }));
      
      const result = await apiKeyService.addKey('twitter', rawKey, 'Test Key');
      
      expect(mockChain.insert).toHaveBeenCalledWith({
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'encrypted-key-123',
        is_active: true
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockApiKey);
    });

    it('should list API keys for a platform', async () => {
      // Override then response for select
      mockChain.then.mockImplementation((onfulfilled) => 
        Promise.resolve().then(() => onfulfilled?.({ 
          data: [mockDbKey],
          error: null 
        }))
      );
      
      const result = await apiKeyService.listKeys('twitter');
      
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('platform_type', 'twitter');
      expect(result).toEqual([mockApiKey]);
    });

    it('should deactivate an API key', async () => {
      // Override then response for update
      mockChain.then.mockImplementation((onfulfilled) => 
        Promise.resolve().then(() => onfulfilled?.({ 
          data: null,
          error: null 
        }))
      );
      
      await apiKeyService.deactivateKey('123');
      
      expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockChain.eq).toHaveBeenCalledWith('id', '123');
    });

    it('should get an active key for a platform', async () => {
      mockEncryptionService.decrypt.mockResolvedValueOnce('decrypted-key-123');
      
      // Override limit response for select
      mockChain.limit.mockImplementation(() => Promise.resolve({
        data: [mockDbKey],
        error: null
      }));

      const result = await apiKeyService.getActiveKey('twitter');
      
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('platform_type', 'twitter');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.limit).toHaveBeenCalledWith(1);
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(mockDbKey.encrypted_key);
      expect(result).toBe('decrypted-key-123');
    });

    it('should throw error when no active key found', async () => {
      // Override limit response for select with empty data
      mockChain.limit.mockImplementation(() => Promise.resolve({
        data: [],
        error: null
      }));

      await expect(apiKeyService.getActiveKey('twitter'))
        .rejects
        .toThrow('No active API key found for platform: twitter');
    });
  });
}); 