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

    // Mock the checkPlatformKeyLimit method
    const mockCheckLimit = vi.fn().mockResolvedValue(true);
    apiKeyService['checkPlatformKeyLimit'] = mockCheckLimit;

    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockInsertResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.addKey(testPlatform, testApiKey, testKeyName);

    expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(testApiKey);
    expect(mockCheckLimit).toHaveBeenCalledWith(testPlatform);
    expect(mockChain.insert).toHaveBeenCalledWith({
      platform_type: testPlatform,
      key_name: testKeyName,
      encrypted_key: encryptedKey,
      is_active: true
    });
    expect(mockChain.select).toHaveBeenCalled();
    expect(mockChain.single).toHaveBeenCalled();
    expect(result).toEqual({
      data: {
        id: '1',
        platformType: testPlatform,
        keyName: testKeyName,
        encryptedKey: encryptedKey,
        isActive: true
      },
      error: null
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

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    const result = await apiKeyService.getActiveKey(testPlatform);

    expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedKey);
    expect(result).toEqual({
      data: testApiKey,
      error: null
    });
    expect(mockChain.select).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('platform_type', testPlatform);
    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockChain.limit).toHaveBeenCalledWith(1);
  });

  it('should handle encryption errors gracefully', async () => {
    mockEncryptionService.encrypt.mockRejectedValueOnce(new Error('Failed to encrypt API key'));

    const result = await apiKeyService.addKey(testPlatform, testApiKey, testKeyName);
    expect(result).toEqual({
      data: null,
      error: {
        code: 'ENCRYPTION_FAILED',
        message: 'Failed to encrypt API key'
      }
    });
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

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResponse)
    };

    mockSupabaseClient.from.mockReturnValue(mockChain);

    mockEncryptionService.decrypt.mockRejectedValueOnce(new Error('Failed to decrypt API key'));

    const result = await apiKeyService.getActiveKey(testPlatform);
    expect(result).toEqual({
      data: null,
      error: {
        code: 'DECRYPTION_FAILED',
        message: 'Failed to decrypt API key'
      }
    });
  });
}); 