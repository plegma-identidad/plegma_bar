import { supabase } from '../lib/supabase';
import { Client } from '../types';

export const clientsService = {
  /**
   * Obtiene todos los clientes desde Supabase ordenados por nombre.
   */
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes de Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      phone: row.phone || '',
      address: row.address || '',
      hasCurrentAccount: row.has_current_account ?? false,
      differentiatedBilling: row.differentiated_billing ?? false,
      isDefault: row.is_default ?? false,
      isEmployee: row.is_employee ?? false,
      isGeneric: row.is_generic ?? false,
      debt: Number(row.debt) || 0,
      clientType: row.client_type || 'Salon',
      cuit: row.cuit || '',
      email: row.email || '',
      active: row.active ?? true,
    }));
  },

  /**
   * Guarda o actualiza un cliente en Supabase.
   */
  async save(client: Client): Promise<Client | null> {
    const isNew = !client.id || client.id.startsWith('cli-');

    const dbPayload: any = {
      code: client.code,
      name: client.name,
      phone: client.phone,
      address: client.address,
      has_current_account: client.hasCurrentAccount ?? false,
      differentiated_billing: client.differentiatedBilling ?? false,
      is_default: client.isDefault ?? false,
      is_employee: client.isEmployee ?? false,
      is_generic: client.isGeneric ?? false,
      debt: client.debt || 0,
      client_type: client.clientType || 'Salon',
      cuit: client.cuit || '',
      email: client.email || '',
      active: client.active ?? true,
    };

    if (!isNew) {
      dbPayload.id = client.id;
    }

    const { data, error } = await supabase
      .from('clients')
      .upsert(dbPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Error al guardar cliente en Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      phone: data.phone || '',
      address: data.address || '',
      hasCurrentAccount: data.has_current_account ?? false,
      differentiatedBilling: data.differentiated_billing ?? false,
      isDefault: data.is_default ?? false,
      isEmployee: data.is_employee ?? false,
      isGeneric: data.is_generic ?? false,
      debt: Number(data.debt) || 0,
      clientType: data.client_type || 'Salon',
      cuit: data.cuit || '',
      email: data.email || '',
      active: data.active ?? true,
    };
  },

  /**
   * Elimina un cliente de Supabase.
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error al eliminar cliente (${id}) de Supabase:`, error);
      return false;
    }

    return true;
  }
};
