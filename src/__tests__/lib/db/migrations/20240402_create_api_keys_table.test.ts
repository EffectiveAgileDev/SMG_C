import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../../../../lib/supabase';
import { up, down } from '../../../../lib/db/migrations/20240402_create_api_keys_table';

describe('API Keys Table Migration', () => {
  beforeAll(async () => {
    // Run down first to ensure clean state
    await down(supabase);
  });

  afterAll(async () => {
    // Clean up after tests
    await down(supabase);
  });

  it('should create api_keys table with correct schema', async () => {
    await up(supabase);

    // Check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'api_keys')
      .single();

    expect(tableError).toBeNull();
    expect(tables).toBeDefined();
    expect(tables?.table_name).toBe('api_keys');

    // Check columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'api_keys');

    expect(columnError).toBeNull();
    expect(columns).toBeDefined();
    
    const columnMap = columns?.reduce((acc, col) => {
      acc[col.column_name] = {
        data_type: col.data_type,
        is_nullable: col.is_nullable === 'YES'
      };
      return acc;
    }, {} as Record<string, { data_type: string, is_nullable: boolean }>);

    // Verify required columns
    expect(columnMap?.id.data_type).toBe('uuid');
    expect(columnMap?.platform_type.data_type).toBe('text');
    expect(columnMap?.platform_type.is_nullable).toBe(false);
    expect(columnMap?.key_name.data_type).toBe('text');
    expect(columnMap?.key_name.is_nullable).toBe(false);
    expect(columnMap?.encrypted_key.data_type).toBe('text');
    expect(columnMap?.encrypted_key.is_nullable).toBe(false);
    expect(columnMap?.is_active.data_type).toBe('boolean');
    expect(columnMap?.metadata.data_type).toBe('jsonb');
    expect(columnMap?.metadata.is_nullable).toBe(true);
  });

  it('should enforce unique constraint on user_id, platform_type, and key_name', async () => {
    // Insert test user
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(userError).toBeNull();
    const userId = userData?.user?.id;

    // Insert first key
    const { error: insertError1 } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'test-key-1'
      });
    expect(insertError1).toBeNull();

    // Try to insert duplicate key
    const { error: insertError2 } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'test-key-2'
      });
    expect(insertError2).toBeDefined();
    expect(insertError2?.message).toContain('unique constraint');
  });

  it('should enforce row level security policies', async () => {
    // Create two test users
    const { data: user1Data } = await supabase.auth.signUp({
      email: 'user1@example.com',
      password: 'password123'
    });
    const { data: user2Data } = await supabase.auth.signUp({
      email: 'user2@example.com',
      password: 'password123'
    });

    const user1Id = user1Data?.user?.id;
    const user2Id = user2Data?.user?.id;

    // Insert key for user1
    await supabase
      .from('api_keys')
      .insert({
        user_id: user1Id,
        platform_type: 'twitter',
        key_name: 'User 1 Key',
        encrypted_key: 'test-key-1'
      });

    // Try to read user1's key as user2
    const { data: keys, error: selectError } = await supabase
      .from('api_keys')
      .select()
      .eq('user_id', user1Id);

    // Should return empty array due to RLS
    expect(selectError).toBeNull();
    expect(keys).toHaveLength(0);
  });
}); 