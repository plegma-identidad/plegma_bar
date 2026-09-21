import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';

export const auditLogsService = {
  /**
   * Obtiene el historial completo de registros de auditoría desde Supabase
   */
  async getAll(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs from Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id || '',
      userName: row.user_name,
      action: row.action,
      entityType: row.entity_type as AuditLog['entityType'],
      entityId: row.entity_id || '',
      oldValue: row.old_value || undefined,
      newValue: row.new_value || undefined,
      details: row.details || undefined,
    }));
  },

  /**
   * Registra un nuevo evento de auditoría en Supabase
   */
  async create(log: Omit<AuditLog, 'id' | 'timestamp'> & { timestamp?: string }): Promise<AuditLog | null> {
    const payload = {
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      old_value: log.oldValue || null,
      new_value: log.newValue || null,
      details: log.details || null,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log in Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      timestamp: data.timestamp,
      userId: data.user_id || '',
      userName: data.user_name,
      action: data.action,
      entityType: data.entity_type as AuditLog['entityType'],
      entityId: data.entity_id || '',
      oldValue: data.old_value || undefined,
      newValue: data.new_value || undefined,
      details: data.details || undefined,
    };
  },
};
