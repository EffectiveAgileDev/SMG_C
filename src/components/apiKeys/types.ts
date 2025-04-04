import type { APIKey as BaseAPIKey, PlatformType } from '../../lib/apiKeys/types';

export interface APIKey extends BaseAPIKey {
  id: string;
  keyName: string;
  platformType: 'twitter' | 'linkedin' | 'openai';
  isActive: boolean;
  createdAt: string;
  encryptedKey: string;
  lastUsed?: string;
}

export interface APIKeyDisplayProps {
  apiKey: APIKey;
  onRotate: (keyId: string) => Promise<void>;
  onDeactivate: (keyId: string) => Promise<void>;
}

export interface APIKeyFormProps {
  onSubmit: (data: APIKeyFormData) => Promise<void>;
  initialData?: Partial<APIKeyFormData>;
  isRotating?: boolean;
}

export interface APIKeyFormData {
  platformType: PlatformType;
  keyName: string;
  keyValue?: string;
  expiresAt?: Date;
}

export interface APIKeyMetricsProps {
  apiKey: APIKey;
  usageCount: number;
  errorRate: number;
  lastUsed?: Date;
}

export interface APIKeyDashboardProps {
  initialPlatformFilter?: PlatformType;
}

export type APIKeySort = 'name' | 'platform' | 'created' | 'expires' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface APIKeySortConfig {
  field: APIKeySort;
  direction: SortDirection;
}

export interface APIKeyFilter {
  platform?: PlatformType;
  search?: string;
  showInactive?: boolean;
} 