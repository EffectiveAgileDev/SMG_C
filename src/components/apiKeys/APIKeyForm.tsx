import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { APIKeyFormProps, APIKeyFormData } from './types';
import type { PlatformType } from '../../lib/apiKeys/types';

// GREEN Phase: Minimum implementation to make tests pass
export function APIKeyForm({ onSubmit, initialData, isRotating = false }: APIKeyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<APIKeyFormData>>({
    platformType: initialData?.platformType || 'twitter',
    keyName: initialData?.keyName || '',
    keyValue: '',
    expiresAt: initialData?.expiresAt,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.keyName) {
      setError('Key name is required');
      return;
    }

    if (!isRotating && !formData.keyValue) {
      setError('API key value is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        platformType: formData.platformType as PlatformType,
        keyName: formData.keyName as string,
        keyValue: formData.keyValue as string,
        expiresAt: formData.expiresAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
      setIsSubmitting(false);
    }
  };

  const handleExpirationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      expiresAt: value ? new Date(value) : undefined
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="platformType">Platform</label>
        <Select
          defaultValue={formData.platformType}
          value={formData.platformType}
          onValueChange={(value: PlatformType) => {
            setFormData(prev => ({ ...prev, platformType: value }));
          }}
          disabled={isRotating || isSubmitting}
          name="platformType"
        >
          <SelectTrigger 
            id="platformType" 
            aria-label="Platform"
            className="w-full"
            data-testid="platform-select"
          >
            <SelectValue>
              {formData.platformType === 'twitter' && 'Twitter'}
              {formData.platformType === 'linkedin' && 'LinkedIn'}
              {formData.platformType === 'openai' && 'OpenAI'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="keyName">Key Name</label>
        <Input
          id="keyName"
          name="keyName"
          value={formData.keyName}
          onChange={(e) => setFormData(prev => ({ ...prev, keyName: e.target.value }))}
          disabled={isRotating || isSubmitting}
          placeholder="Enter a name for this API key"
          aria-label="Key Name"
          data-testid="key-name-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="keyValue">{isRotating ? 'New API Key' : 'API Key'}</label>
        <Input
          id="keyValue"
          name="keyValue"
          type="text"
          value={formData.keyValue || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, keyValue: e.target.value }))}
          disabled={isSubmitting}
          placeholder="Enter your API key"
          aria-label={isRotating ? 'New API Key' : 'API Key'}
          data-testid="key-value-input"
        />
      </div>

      {!isRotating && (
        <div className="space-y-2">
          <label htmlFor="expiresAt">Expiration Date (Optional)</label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            onChange={(e) => handleExpirationChange(e.target.value)}
            value={formData.expiresAt?.toISOString().slice(0, 16) || ''}
            disabled={isSubmitting}
            aria-label="Expiration Date"
            data-testid="expiration-date-input"
          />
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm" role="alert" data-testid="error-message">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isSubmitting}
        data-testid="submit-button"
      >
        {isSubmitting ? 'Saving...' : isRotating ? 'Rotate Key' : 'Save Key'}
      </Button>
    </form>
  );
} 