/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { PlatformType, KeyValidationResult } from '../../../lib/apiKeys/types';

vi.mock('../../../lib/apiKeys/apiKeyService', () => {
  const mockApiKeyService = {
    validateKey: vi.fn(),
    getActiveKey: vi.fn()
  };
  return { apiKeyService: mockApiKeyService };
});

// Import after mocking
import { validateApiKey } from '../../../lib/middleware/apiKeyValidation';
import { apiKeyService } from '../../../lib/apiKeys/apiKeyService';

describe('API Key Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      headers: {},
      query: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  it('should reject requests without an API key header', async () => {
    await validateApiKey('twitter')(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'API key is required'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject requests with invalid API key', async () => {
    mockReq.headers = { 'x-api-key': 'invalid-key' };
    (apiKeyService.validateKey as any).mockResolvedValueOnce({
      isValid: false,
      error: 'Invalid API key'
    });

    await validateApiKey('twitter')(mockReq as Request, mockRes as Response, mockNext);

    expect(apiKeyService.validateKey).toHaveBeenCalledWith('twitter', 'invalid-key');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid API key'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow requests with valid API key', async () => {
    mockReq.headers = { 'x-api-key': 'valid-key' };
    (apiKeyService.validateKey as any).mockResolvedValueOnce({
      isValid: true,
      error: undefined
    });

    await validateApiKey('twitter')(mockReq as Request, mockRes as Response, mockNext);

    expect(apiKeyService.validateKey).toHaveBeenCalledWith('twitter', 'valid-key');
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle API key validation errors gracefully', async () => {
    mockReq.headers = { 'x-api-key': 'valid-key' };
    (apiKeyService.validateKey as any).mockRejectedValueOnce(new Error('Validation failed'));

    await validateApiKey('twitter')(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Error validating API key'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should support different platform types', async () => {
    const platforms: PlatformType[] = ['twitter', 'linkedin', 'openai'];
    mockReq.headers = { 'x-api-key': 'valid-key' };
    (apiKeyService.validateKey as any).mockResolvedValue({ 
      isValid: true,
      error: undefined
    });

    for (const platform of platforms) {
      await validateApiKey(platform)(mockReq as Request, mockRes as Response, mockNext);
      expect(apiKeyService.validateKey).toHaveBeenCalledWith(platform, 'valid-key');
    }
  });
}); 