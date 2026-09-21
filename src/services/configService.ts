import { supabase } from '../lib/supabase';
import { ConfigOption } from '../types';

export type ConfigOptionType = 'category' | 'subcategory' | 'unit' | 'rubro' | 'position' | 'profile';

export const configService = {
  /**
   * Obtiene todas las opciones de configuración registradas en Supabase filtradas por tipo.
   */
  async getByType(type: ConfigOptionType): Promise<ConfigOption[]> {
    const { data, error } = await supabase
      .from('config_options')
      .select('id, name, active')
      .eq('type', type)
      .order('name', { ascending: true });

    if (error) {
      console.error(`Error al obtener config_options (${type}) de Supabase:`, error);
      return [];
    }

    // Deduplicar por nombre por seguridad técnica en UI
    const uniqueMap = new Map<string, ConfigOption>();
    (data || []).forEach((row) => {
      if (!uniqueMap.has(row.name)) {
        uniqueMap.set(row.name, {
          id: row.id,
          name: row.name,
          active: row.active ?? true,
        });
      }
    });

    return Array.from(uniqueMap.values());
  },

  /**
   * Crea una nueva opción de configuración en Supabase.
   */
  async create(type: ConfigOptionType, name: string, active: boolean = true): Promise<ConfigOption | null> {
    const { data, error } = await supabase
      .from('config_options')
      .insert([{ type, name, active }])
      .select('id, name, active')
      .single();

    if (error) {
      console.error(`Error al crear config_option (${type}) en Supabase:`, error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      active: data.active ?? true,
    };
  },

  /**
   * Actualiza el nombre o el estado activo de una opción en Supabase.
   */
  async update(id: string, updates: Partial<{ name: string; active: boolean }>): Promise<ConfigOption | null> {
    const { data, error } = await supabase
      .from('config_options')
      .update(updates)
      .eq('id', id)
      .select('id, name, active')
      .single();

    if (error) {
      console.error(`Error al actualizar config_option (${id}) en Supabase:`, error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      active: data.active ?? true,
    };
  },

  /**
   * Elimina una opción de configuración de Supabase.
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('config_options')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error al eliminar config_option (${id}) de Supabase:`, error);
      return false;
    }

    return true;
  }
};
