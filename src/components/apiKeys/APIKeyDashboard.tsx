import { useState, useEffect } from 'react';
import { APIKey, APIKeyDashboardProps } from './types';
import { APIKeyCard } from './APIKeyCard';
import { APIKeyForm } from './APIKeyForm';
import { Button } from '../ui/button';
import { fetchApiKeys, createApiKey } from '../../lib/api';

export function APIKeyDashboard({ initialPlatformFilter }: APIKeyDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const keys = await fetchApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError('Error loading API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (formData: any) => {
    try {
      await createApiKey(formData);
      setShowCreateForm(false);
      await loadApiKeys();
    } catch (err) {
      setError('Error creating API key');
    }
  };

  if (isLoading) {
    return <div data-testid="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <Button onClick={() => setShowCreateForm(true)}>Add API Key</Button>
      </div>

      {showCreateForm && (
        <div className="mb-4">
          <APIKeyForm onSubmit={handleCreateKey} />
        </div>
      )}

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <APIKeyCard
            key={apiKey.id}
            apiKey={apiKey}
            onRotate={async () => {}}
            onDeactivate={async () => {}}
          />
        ))}
      </div>
    </div>
  );
} 