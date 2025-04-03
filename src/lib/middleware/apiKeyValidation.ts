import type { Request, Response, NextFunction } from 'express';
import type { PlatformType } from '../apiKeys/types';
import { apiKeyService } from '../apiKeys/apiKeyService';

export const validateApiKey = (platform: PlatformType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(401).json({ error: 'API key is required' });
    }

    try {
      const validationResult = await apiKeyService.validateKey(platform, apiKey);
      
      if (!validationResult.isValid) {
        return res.status(401).json({ 
          error: validationResult.error || 'Invalid API key' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error validating API key' });
    }
  };
}; 