# API Key Management Technical Design

## Overview
Technical implementation details for secure API key management in the Social Media Content Generation Assistant.

## Database Schema

```sql
-- API Keys table
create table api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  platform_type text not null,  -- 'twitter', 'linkedin', 'openai', etc.
  key_name text not null,       -- user-provided name for the key
  encrypted_key text not null,  -- encrypted API key
  encryption_version int not null default 1,
  created_at timestamptz not null default now(),
  expires_at timestamptz,       -- null for non-expiring keys
  last_used_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb               -- platform-specific metadata
);

-- Row Level Security
alter table api_keys enable row level security;

-- Policies
create policy "Users can only view their own API keys"
  on api_keys for select
  using (auth.uid() = user_id);

create policy "Users can only insert their own API keys"
  on api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can only update their own API keys"
  on api_keys for update
  using (auth.uid() = user_id);
```

## Security Implementation

### Key Encryption
1. Client-side encryption using Web Crypto API:
```typescript
class KeyEncryption {
  // Derive encryption key from user's master key
  async deriveKey(masterKey: string): Promise<CryptoKey>;
  
  // Encrypt API key before storage
  async encryptKey(apiKey: string, masterKey: string): Promise<string>;
  
  // Decrypt API key for use
  async decryptKey(encryptedKey: string, masterKey: string): Promise<string>;
}
```

### Master Key Management
1. User provides master password during setup
2. Derive master key using PBKDF2
3. Store master key in secure session storage only
4. Never persist master key to disk

## API Design

### Types
```typescript
interface APIKey {
  id: string;
  platformType: PlatformType;
  keyName: string;
  encryptedKey: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

type PlatformType = 'twitter' | 'linkedin' | 'openai';

interface KeyValidationResult {
  isValid: boolean;
  error?: string;
}
```

### Service Interface
```typescript
interface APIKeyService {
  // Key Management
  addKey(platform: PlatformType, key: string, name: string): Promise<APIKey>;
  rotateKey(keyId: string, newKey: string): Promise<APIKey>;
  deactivateKey(keyId: string): Promise<void>;
  listKeys(platform?: PlatformType): Promise<APIKey[]>;
  
  // Key Usage
  getActiveKey(platform: PlatformType): Promise<string>;
  validateKey(platform: PlatformType, key: string): Promise<KeyValidationResult>;
}
```

## Testing Strategy

### Unit Tests
1. Key Encryption
   - Test encryption/decryption cycle
   - Test with various key lengths
   - Test invalid master keys
   - Test encryption version handling

2. Key Management
   - Test CRUD operations
   - Test key rotation
   - Test key validation
   - Test expiration handling

3. Access Control
   - Test RLS policies
   - Test user isolation
   - Test permission checks

### Integration Tests
1. Platform Integration
   - Test key validation with actual APIs
   - Test error handling
   - Test rate limiting

2. User Workflows
   - Test key addition flow
   - Test key rotation flow
   - Test multiple keys per platform

### Security Tests
1. Encryption
   - Test key material handling
   - Test secure memory cleanup
   - Test encryption at rest

2. Access Control
   - Test unauthorized access attempts
   - Test cross-user access attempts
   - Test policy enforcement

## Error Handling

### Error Types
```typescript
enum APIKeyError {
  INVALID_KEY = 'invalid_key',
  KEY_EXPIRED = 'key_expired',
  ENCRYPTION_FAILED = 'encryption_failed',
  DECRYPTION_FAILED = 'decryption_failed',
  UNAUTHORIZED = 'unauthorized',
  VALIDATION_FAILED = 'validation_failed'
}
```

### Error Responses
- Clear error messages
- No sensitive data in errors
- Appropriate HTTP status codes
- Detailed logging (without keys)

## Implementation Phases

1. Basic Infrastructure
   - Database schema
   - RLS policies
   - Basic CRUD operations

2. Security Layer
   - Encryption implementation
   - Master key management
   - Secure storage

3. Key Management
   - Key rotation
   - Expiration handling
   - Validation logic

4. Platform Integration
   - Platform-specific validation
   - Error handling
   - Rate limiting

5. User Interface
   - Key management UI
   - Error displays
   - Validation feedback 