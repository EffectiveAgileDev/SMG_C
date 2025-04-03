import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase module first
vi.mock('@supabase/supabase-js', () => {
  class MockAuthError extends Error {
    name = 'AuthError';
    status: number;
    code: string;

    constructor(message: string, status: number, code: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    createClient: vi.fn(() => mockSupabaseClient),
    AuthError: MockAuthError
  };
});

// Then import from the mocked module
import { AuthError, User } from '@supabase/supabase-js';

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

// Mock auth responses
const mockAuthResponse = {
  data: {
    user: mockUser,
    session: {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      user: mockUser
    }
  },
  error: null
};

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    getUser: vi.fn()
  }
};

describe('Auth Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockAuthResponse);
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
    mockSupabaseClient.auth.getSession.mockResolvedValue(mockAuthResponse);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully create a new user', async () => {
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.signUp('test@example.com', 'password123');
      
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle signup errors', async () => {
      const mockError = new AuthError(
        'Email already registered',
        400,
        'auth/email-already-in-use'
      );
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: mockError });
      
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.signUp('test@example.com', 'password123');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Email already registered');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in an existing user', async () => {
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.signIn('test@example.com', 'password123');
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle signin errors', async () => {
      const mockError = new AuthError(
        'Invalid credentials',
        401,
        'auth/invalid-credentials'
      );
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null }, error: mockError });
      
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.signIn('test@example.com', 'wrongpassword');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.signOut();
      
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user when authenticated', async () => {
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.getCurrentUser();
      
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      
      const { authService } = await import('../../../lib/auth/authService');
      const result = await authService.getCurrentUser();
      
      expect(result.user).toBeNull();
      expect(result.error).toBeNull();
    });
  });
}); 