import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { User } from '@supabase/supabase-js';

// Mock user data with roles
const mockAdminUser: User = {
  id: 'admin-id',
  email: 'admin@example.com',
  created_at: new Date().toISOString(),
  app_metadata: { role: 'admin' },
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

const mockContentCreatorUser: User = {
  id: 'creator-id',
  email: 'creator@example.com',
  created_at: new Date().toISOString(),
  app_metadata: { role: 'content_creator' },
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

const mockBasicUser: User = {
  id: 'basic-id',
  email: 'user@example.com',
  created_at: new Date().toISOString(),
  app_metadata: { role: 'basic' },
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    })),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    updateUser: vi.fn()
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Assignment', () => {
    it('should assign a role to a user', async () => {
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const result = await roleAccess.assignRole('user-id', 'content_creator');
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles');
      expect(result.error).toBeNull();
    });

    it('should validate role before assignment', async () => {
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const result = await roleAccess.assignRole('user-id', 'invalid_role');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid role specified');
    });
  });

  describe('Permission Checking', () => {
    beforeEach(() => {
      // Reset the getUser mock before each test
      mockSupabaseClient.auth.getUser.mockReset();
    });

    it('should allow admin access to all operations', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: mockAdminUser }, 
        error: null 
      });
      
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const canManageUsers = await roleAccess.hasPermission('manage_users');
      const canCreateContent = await roleAccess.hasPermission('create_content');
      
      expect(canManageUsers).toBe(true);
      expect(canCreateContent).toBe(true);
    });

    it('should restrict content creator permissions appropriately', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: mockContentCreatorUser }, 
        error: null 
      });
      
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const canManageUsers = await roleAccess.hasPermission('manage_users');
      const canCreateContent = await roleAccess.hasPermission('create_content');
      
      expect(canManageUsers).toBe(false);
      expect(canCreateContent).toBe(true);
    });

    it('should restrict basic user permissions appropriately', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ 
        data: { user: mockBasicUser }, 
        error: null 
      });
      
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const canManageUsers = await roleAccess.hasPermission('manage_users');
      const canCreateContent = await roleAccess.hasPermission('create_content');
      
      expect(canManageUsers).toBe(false);
      expect(canCreateContent).toBe(false);
    });
  });

  describe('Role Retrieval', () => {
    it('should get current user role', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: mockAdminUser }, error: null });
      
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const role = await roleAccess.getCurrentUserRole();
      
      expect(role).toBe('admin');
    });

    it('should handle user not found error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      
      const { roleAccess } = await import('../../../lib/auth/roleAccess');
      const result = await roleAccess.getCurrentUserRole();
      
      expect(result).toBeNull();
    });
  });
}); 