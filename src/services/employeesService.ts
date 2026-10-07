import { supabase } from '../lib/supabase';
import { Employee } from '../types';

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener empleados desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        dni: row.dni,
        name: row.name,
        address: row.address,
        phone: row.phone,
        birthDate: row.birth_date || undefined,
        gender: row.gender || undefined,
        position: row.position,
        profile: row.profile,
        loginEmail: row.login_email || undefined,
        enableClockIn: row.enable_clock_in ?? true,
        hourlyRate: row.hourly_rate ?? 0,
        isPartner: row.is_partner ?? false,
        relatedProviderId: row.related_provider_id || undefined,
        bankCompany: row.bank_company || undefined,
        accountType: row.account_type || undefined,
        cbuCvu: row.cbu_cvu || undefined,
        alias: row.alias || undefined,
        active: row.active ?? true,
      }));
    } catch (err) {
      console.error('Exception al obtener empleados:', err);
      return [];
    }
  },

  async save(employee: Employee): Promise<Employee | null> {
    try {
      const isExistingUuid =
        employee.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employee.id);

      const payload = {
        dni: employee.dni,
        name: employee.name,
        address: employee.address || '',
        phone: employee.phone || '',
        birth_date: employee.birthDate || null,
        gender: employee.gender || null,
        position: employee.position || 'Operativo',
        profile: employee.profile || 'Operativo',
        login_email: employee.loginEmail || null,
        enable_clock_in: employee.enableClockIn ?? true,
        hourly_rate: employee.hourlyRate ?? 0,
        is_partner: employee.isPartner ?? false,
        related_provider_id: employee.relatedProviderId || null,
        bank_company: employee.bankCompany || null,
        account_type: employee.accountType || null,
        cbu_cvu: employee.cbuCvu || null,
        alias: employee.alias || null,
        active: employee.active ?? true,
      };

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', employee.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar empleado en Supabase:', error);
          return null;
        }

        return {
          id: data.id,
          dni: data.dni,
          name: data.name,
          address: data.address,
          phone: data.phone,
          birthDate: data.birth_date || undefined,
          gender: data.gender || undefined,
          position: data.position,
          profile: data.profile,
          loginEmail: data.login_email || undefined,
          enableClockIn: data.enable_clock_in ?? true,
          hourlyRate: data.hourly_rate ?? 0,
          isPartner: data.is_partner ?? false,
          relatedProviderId: data.related_provider_id || undefined,
          bankCompany: data.bank_company || undefined,
          accountType: data.account_type || undefined,
          cbuCvu: data.cbu_cvu || undefined,
          alias: data.alias || undefined,
          active: data.active ?? true,
          schedule: employee.schedule,
          hourlyRateLogs: employee.hourlyRateLogs,
        };
      } else {
        const { data, error } = await supabase
          .from('employees')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al insertar empleado en Supabase:', error);
          return null;
        }

        return {
          id: data.id,
          dni: data.dni,
          name: data.name,
          address: data.address,
          phone: data.phone,
          birthDate: data.birth_date || undefined,
          gender: data.gender || undefined,
          position: data.position,
          profile: data.profile,
          loginEmail: data.login_email || undefined,
          enableClockIn: data.enable_clock_in ?? true,
          hourlyRate: data.hourly_rate ?? 0,
          isPartner: data.is_partner ?? false,
          relatedProviderId: data.related_provider_id || undefined,
          bankCompany: data.bank_company || undefined,
          accountType: data.account_type || undefined,
          cbuCvu: data.cbu_cvu || undefined,
          alias: data.alias || undefined,
          active: data.active ?? true,
          schedule: employee.schedule,
          hourlyRateLogs: employee.hourlyRateLogs,
        };
      }
    } catch (err) {
      console.error('Exception al guardar empleado:', err);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar empleado en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar empleado:', err);
      return false;
    }
  },
};
