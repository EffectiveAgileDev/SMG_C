import { supabase } from '../supabase';

type Role = 'admin' | 'content_creator' | 'basic';
type Permission = 'manage_users' | 'create_content';

const VALID_ROLES: Role[] = ['admin', 'content_creator', 'basic'];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['manage_users', 'create_content'],
  content_creator: ['create_content'],
  basic: []
};

class RoleAccess {
  async assignRole(userId: string, role: string): Promise<{ error: Error | null }> {
    if (!VALID_ROLES.includes(role as Role)) {
      return { error: new Error('Invalid role specified') };
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    return { error };
  }

  async hasPermission(permission: Permission): Promise<boolean> {
    const { user } = await this.getCurrentUser();
    if (!user || !user.app_metadata?.role) return false;

    const role = user.app_metadata.role as Role;
    if (!VALID_ROLES.includes(role)) return false;

    return ROLE_PERMISSIONS[role].includes(permission);
  }

  async getCurrentUserRole(): Promise<string | null> {
    const { user } = await this.getCurrentUser();
    return user?.app_metadata?.role ?? null;
  }

  private async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user ?? null, error };
  }
}

export const roleAccess = new RoleAccess(); 