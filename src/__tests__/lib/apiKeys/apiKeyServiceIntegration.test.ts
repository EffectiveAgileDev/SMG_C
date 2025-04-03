import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIKey, PlatformType } from '../../../lib/apiKeys/types';
import { APIKeyService } from '../../../lib/apiKeys/apiKeyService';
import type { EncryptionService } from '../../../lib/encryption/encryptionService';

// Mock Supabase client with properly chained methods
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
};

type MockEncryptionService = {
  encrypt: ReturnType<typeof vi.fn>;
  decrypt: ReturnType<typeof vi.fn>;
};

// Mock encryption service
const mockEncryptionService: MockEncryptionService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
};

describe('APIKeyService with Encryption', () => {
  let apiKeyService: APIKeyService;
  const testPlatform: PlatformType = 'twitter';
  const testKeyName = 'Test API Key';
  const testApiKey = 'raw-api-key-12345';
  const encryptedKey = 'encrypted-key-data';

  beforeEach(() => {
    vi.clearAllMocks();
    mockEncryptionService.encrypt.mockResolvedValue(encryptedKey);
    mockEncryptionService.decrypt.mockResolvedValue(testApiKey);
    apiKeyService = new APIKeyService(mockSupabaseClient as any, mockEncryptionService as unknown as EncryptionService);
  });

  it('should encrypt API key before storing', async () => {
    const mockInsertResponse = {
      data: {
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        is_active: true
      },
      error: null
    };

    // Create a mock chain that returns itself for all methods except the final one
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce(mockInsertResponse),
      limit: vi.fn().mockReturnThis()
    };

    // Set up the mock chain
    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    const result = await apiKeyService.addKey(testPlatform, testApiKey, testKeyName);

    expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(testApiKey);
    expect(mockChain.insert).toHaveBeenCalledWith({
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      is_active: true
    });
    expect(mockChain.select).toHaveBeenCalled();
    expect(mockChain.single).toHaveBeenCalled();
    expect(result).toEqual({
      id: '1',
      platformType: testPlatform,
      keyName: testKeyName,
      encryptedKey: encryptedKey,
      isActive: true
    });
  });

  it('should decrypt API key when retrieving', async () => {
    const storedKey = {
      id: '1',
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      is_active: true
    };

    const mockResponse = {
      data: [storedKey],
      error: null
    };

    // Create a mock chain that returns itself for all methods except the final one
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce(mockResponse)
    };

    // Set up the mock chain
    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);

    expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedKey);
    expect(result).toBe(testApiKey);
    expect(mockChain.select).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('platform_type', testPlatform);
    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockChain.limit).toHaveBeenCalledWith(1);
  });

  it('should handle encryption errors gracefully', async () => {
    const mockFrom = mockSupabaseClient.from();
    mockFrom.insert.mockReturnThis();
    mockFrom.select.mockReturnThis();
    mockFrom.single.mockResolvedValueOnce({ data: null, error: null });

    mockEncryptionService.encrypt.mockRejectedValueOnce(new Error('Failed to encrypt API key'));

    await expect(apiKeyService.addKey(testPlatform, testApiKey, testKeyName))
      .rejects.toThrow('Failed to encrypt API key');
  });

  it('should handle decryption errors gracefully', async () => {
    const storedKey = {
      id: '1',
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      is_active: true
    };

    const mockResponse = {
      data: [storedKey],
      error: null
    };

    // Create a mock chain that returns itself for all methods except the final one
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce(mockResponse)
    };

    // Set up the mock chain
    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    mockEncryptionService.decrypt.mockRejectedValueOnce(new Error('Failed to decrypt API key'));

    await expect(apiKeyService.getActiveKey(testPlatform))
      .rejects.toThrow('Failed to decrypt API key');
  });
}); 