import { supabase } from '../lib/supabase';
import { AppUser, GranularRole } from '../types';

export const usersService = {
  // ----------------------------------------------------
  // 1. USUARIOS DE LA APLICACIÓN (app_users)
  // ----------------------------------------------------
  async getUsers(): Promise<AppUser[]> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener usuarios desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        dni: row.dni,
        name: row.name,
        email: row.email,
        phone: row.phone || undefined,
        address: row.address || undefined,
        profileName: row.profile_name || undefined,
        role: row.role || 'operador',
        assignedRoleIds: row.assigned_role_ids || [],
        status: (row.status as 'Activo' | 'Inactivo') || 'Activo',
        lastAccess: row.last_access || undefined,
        customPermissions: row.custom_permissions || undefined,
      }));
    } catch (err) {
      console.error('Exception al obtener usuarios:', err);
      return [];
    }
  },

  async saveUser(user: AppUser): Promise<AppUser | null> {
    try {
      const isExistingUuid =
        user.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

      const validRoleIds = (user.assignedRoleIds || []).filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );

      const payload = {
        dni: user.dni,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        address: user.address || null,
        profile_name: user.profileName || null,
        role: user.role || 'operador',
        assigned_role_ids: validRoleIds.length > 0 ? validRoleIds : null,
        status: user.status || 'Activo',
        custom_permissions: user.customPermissions || null,
      };

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('app_users')
          .update(payload)
          .eq('id', user.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar usuario en Supabase:', error.message || error);
          return null;
        }

        return {
          id: data.id,
          dni: data.dni,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          address: data.address || undefined,
          profileName: data.profile_name || undefined,
          role: data.role || 'operador',
          assignedRoleIds: data.assigned_role_ids || [],
          status: (data.status as 'Activo' | 'Inactivo') || 'Activo',
          lastAccess: data.last_access || undefined,
          customPermissions: data.custom_permissions || undefined,
        };
      } else {
        const { data, error } = await supabase
          .from('app_users')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al insertar usuario en Supabase:', error.message || error);
          return null;
        }

        return {
          id: data.id,
          dni: data.dni,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          address: data.address || undefined,
          profileName: data.profile_name || undefined,
          role: data.role || 'operador',
          assignedRoleIds: data.assigned_role_ids || [],
          status: (data.status as 'Activo' | 'Inactivo') || 'Activo',
          lastAccess: data.last_access || undefined,
          customPermissions: data.custom_permissions || undefined,
        };
      }
    } catch (err) {
      console.error('Exception al guardar usuario:', err);
      return null;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar usuario en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar usuario:', err);
      return false;
    }
  },

  // ----------------------------------------------------
  // 2. ROLES GRANULARES (granular_roles)
  // ----------------------------------------------------
  async getGranularRoles(): Promise<GranularRole[]> {
    try {
      const { data, error } = await supabase
        .from('granular_roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener roles granulares desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        moduleAccess: row.module_access || {
          kanban: 'view',
          inbox: 'view',
          items: 'view',
          dashboard: 'view',
          audit: 'view',
          maestros: 'view',
        },
      }));
    } catch (err) {
      console.error('Exception al obtener roles granulares:', err);
      return [];
    }
  },
};
