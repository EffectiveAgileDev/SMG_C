import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIKey, PlatformType } from '../../../lib/apiKeys/types';
import { APIKeyService } from '../../../lib/apiKeys/apiKeyService';
import type { EncryptionService } from '../../../lib/encryption/encryptionService';

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

const mockEncryptionService: MockEncryptionService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
};

describe('APIKeyService Expiration', () => {
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

  it('should add a key with expiration date', async () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now

    const mockResponse = {
      data: {
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: expirationDate.toISOString(),
        is_active: true
      },
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce(mockResponse),
      limit: vi.fn().mockReturnThis()
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    const result = await apiKeyService.addKey(testPlatform, testApiKey, testKeyName, expirationDate);

    expect(mockChain.insert).toHaveBeenCalledWith({
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      expires_at: expirationDate.toISOString(),
      is_active: true
    });

    expect(result.expiresAt).toEqual(expirationDate);
  });

  it('should not return expired keys when getting active key', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    const mockResponse = {
      data: [{
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: expiredDate.toISOString(),
        is_active: true
      }],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    await expect(apiKeyService.getActiveKey(testPlatform))
      .rejects
      .toThrow('No active API key found for platform: twitter');
  });

  it('should return valid non-expired key', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    const mockResponse = {
      data: [{
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: futureDate.toISOString(),
        is_active: true
      }],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);
    expect(result).toBe(testApiKey);
  });

  it('should handle keys with no expiration date', async () => {
    const mockResponse = {
      data: [{
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        is_active: true
      }],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);
    expect(result).toBe(testApiKey);
  });
}); 