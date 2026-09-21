import { supabase } from '../lib/supabase';
import { Provider } from '../types';

export const providersService = {
  /**
   * Obtiene todos los proveedores desde Supabase ordenados por nombre.
   */
  async getAll(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener proveedores de Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      commercialName: row.commercial_name || '',
      rubro: row.rubro || '',
      subrubro: row.subrubro || '',
      cuit: row.cuit || '',
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      address: row.address || '',
      orderDays: row.order_days || [],
      deliveryDays: row.delivery_days || [],
      priority: row.priority || 1,
      purchaseFrequency: row.purchase_frequency || 'Semanal',
      cutoffTime: row.cutoff_time || '14:00',
      habitualLeadTimeDays: row.habitual_lead_time_days || 1,
      paymentCondition: row.payment_condition || 'Contado',
      paymentTermDays: row.payment_term_days || 0,
      currentAccount: row.current_account ?? false,
      bankName: row.bank_name || '',
      accountOwner: row.account_owner || '',
      alias: row.alias || '',
      cbuCvu: row.cbu_cvu || '',
      active: row.active ?? true,
    }));
  },

  /**
   * Guarda o actualiza un proveedor en Supabase.
   */
  async save(provider: Provider): Promise<Provider | null> {
    const isNew = !provider.id || provider.id.startsWith('prov-');
    
    const dbPayload: any = {
      code: provider.code,
      name: provider.name,
      commercial_name: provider.commercialName,
      rubro: provider.rubro,
      subrubro: provider.subrubro,
      cuit: provider.cuit,
      phone: provider.phone,
      whatsapp: provider.whatsapp,
      email: provider.email,
      address: provider.address,
      order_days: provider.orderDays,
      delivery_days: provider.deliveryDays,
      priority: provider.priority,
      purchase_frequency: provider.purchaseFrequency,
      cutoff_time: provider.cutoffTime,
      habitual_lead_time_days: provider.habitualLeadTimeDays,
      payment_condition: provider.paymentCondition,
      payment_term_days: provider.paymentTermDays,
      current_account: provider.currentAccount,
      bank_name: provider.bankName,
      account_owner: provider.accountOwner,
      alias: provider.alias,
      cbu_cvu: provider.cbuCvu,
      active: provider.active ?? true,
    };

    if (!isNew) {
      dbPayload.id = provider.id;
    }

    const { data, error } = await supabase
      .from('providers')
      .upsert(dbPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Error al guardar proveedor en Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      commercialName: data.commercial_name || '',
      rubro: data.rubro || '',
      subrubro: data.subrubro || '',
      cuit: data.cuit || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      address: data.address || '',
      orderDays: data.order_days || [],
      deliveryDays: data.delivery_days || [],
      priority: data.priority || 1,
      purchaseFrequency: data.purchase_frequency || 'Semanal',
      cutoffTime: data.cutoff_time || '14:00',
      habitualLeadTimeDays: data.habitual_lead_time_days || 1,
      paymentCondition: data.payment_condition || 'Contado',
      paymentTermDays: data.payment_term_days || 0,
      currentAccount: data.current_account ?? false,
      bankName: data.bank_name || '',
      accountOwner: data.account_owner || '',
      alias: data.alias || '',
      cbuCvu: data.cbu_cvu || '',
      active: data.active ?? true,
    };
  },

  /**
   * Cambia el estado activo / inactivo de un proveedor en Supabase.
   */
  async toggleActive(id: string, active: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('providers')
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error(`Error al cambiar estado de proveedor (${id}) en Supabase:`, error);
      return false;
    }

    return true;
  },

  /**
   * Elimina un proveedor de Supabase.
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error al eliminar proveedor (${id}) de Supabase:`, error);
      return false;
    }

    return true;
  }
};
