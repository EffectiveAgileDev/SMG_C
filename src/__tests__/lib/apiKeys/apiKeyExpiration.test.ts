import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIKey, PlatformType } from '../../../lib/apiKeys/types';
import { APIKeyService } from '../../../lib/apiKeys/apiKeyService';
import type { EncryptionService } from '../../../lib/encryption/encryptionService';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

// Mock encryption service
const mockEncryptionService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
};

describe('APIKeyService Expiration', () => {
  let apiKeyService: APIKeyService;
  const testPlatform: PlatformType = 'twitter';
  const testKeyName = 'Test API Key';
  const testApiKey = 'raw-api-key-12345';
  const encryptedKey = 'encrypted-key-data';
  const expirationDate = new Date('2024-12-31T00:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    mockEncryptionService.encrypt.mockResolvedValue(encryptedKey);
    mockEncryptionService.decrypt.mockResolvedValue(testApiKey);
    apiKeyService = new APIKeyService(mockSupabaseClient as any, mockEncryptionService as unknown as EncryptionService);
  });

  it('should add a key with expiration date', async () => {
    const mockInsertResponse = {
      data: {
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: expirationDate.toISOString(),
        is_active: true,
        metadata: null
      },
      error: null
    };

    // Mock the checkPlatformKeyLimit method
    const mockCheckLimit = vi.fn().mockResolvedValue(true);
    apiKeyService['checkPlatformKeyLimit'] = mockCheckLimit;

    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockInsertResponse)
    };

    // Set up the mock chain
    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.addKey(testPlatform, testApiKey, testKeyName, expirationDate);

    expect(mockCheckLimit).toHaveBeenCalledWith(testPlatform);
    expect(mockChain.insert).toHaveBeenCalledWith({
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      expires_at: expirationDate.toISOString(),
      is_active: true
    });

    expect(result).toEqual({
      data: {
        id: '1',
        platformType: testPlatform,
        keyName: testKeyName,
        encryptedKey: encryptedKey,
        expiresAt: expirationDate,
        isActive: true,
        metadata: null
      },
      error: null
    });
  });

  it('should not return expired keys when getting active key', async () => {
    const mockResponse = {
      data: [],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);

    expect(result).toEqual({
      data: null,
      error: {
        code: 'KEY_NOT_FOUND',
        message: `No active API key found for platform: ${testPlatform}`
      }
    });
  });

  it('should return valid non-expired key', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

    const mockResponse = {
      data: [{
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: futureDate.toISOString(),
        is_active: true,
        metadata: null
      }],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);

    expect(result).toEqual({
      data: testApiKey,
      error: null
    });
  });

  it('should handle keys with no expiration date', async () => {
    const mockResponse = {
      data: [{
        id: '1',
        platform_type: testPlatform,
        key_name: testKeyName,
        encrypted_key: encryptedKey,
        expires_at: null,
        is_active: true,
        metadata: null
      }],
      error: null
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);

    expect(result).toEqual({
      data: testApiKey,
      error: null
    });
  });
}); 