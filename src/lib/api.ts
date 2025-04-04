import { APIKey, APIKeyFormData } from '../components/apiKeys/types';

export async function fetchApiKeys(): Promise<APIKey[]> {
  const response = await fetch('/api/keys');
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }
  return response.json();
}

export async function createApiKey(data: APIKeyFormData): Promise<APIKey> {
  const response = await fetch('/api/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create API key');
  }
  
  return response.json();
}

export async function rotateApiKey(keyId: string, newKey: string): Promise<APIKey> {
  const response = await fetch(`/api/keys/${keyId}/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newKey }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to rotate API key');
  }
  
  return response.json();
}

export async function deactivateApiKey(keyId: string): Promise<void> {
  const response = await fetch(`/api/keys/${keyId}/deactivate`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to deactivate API key');
  }
} 