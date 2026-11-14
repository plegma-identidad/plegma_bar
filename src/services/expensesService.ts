import { supabase } from '../lib/supabase';
import { Expense, RecurringExpense, ExpenseFilters } from '../types';
import { cashService } from './cashService';

const BUCKET_NAME = 'gastos';
const FALLBACK_BUCKET = 'ventas';

/**
 * Sanitiza una cadena para usarla en nombres de carpetas o archivos en Storage
 */
const sanitizePathSegment = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Caracteres seguros
    .replace(/_+/g, '_')
    .trim();
};

export const expensesService = {
  // ----------------------------------------------------
  // SUBIDA Y GESTIÓN DE ADJUNTOS EN SUPABASE STORAGE
  // ----------------------------------------------------
  /**
   * Sube un archivo a Supabase Storage según la jerarquía requerida:
   * gastos/{año}/{mes}/{origen}/{id_gasto}/{timestamp}_{nombre_archivo_sanitizado}
   */
  async uploadExpenseAttachment(
    file: File,
    origin: string,
    expenseId: string
  ): Promise<{ url: string; path: string; name: string; mime: string } | null> {
    try {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const cleanOrigin = sanitizePathSegment(origin.toLowerCase() || 'eventual');
      const cleanId = sanitizePathSegment(expenseId || 'temp_' + Date.now());
      
      const ext = file.name.split('.').pop() || '';
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanBaseName = sanitizePathSegment(baseName);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${cleanBaseName}.${ext.toLowerCase()}`;

      // Jerarquía: gastos/{año}/{mes}/{origen}/{id_gasto}/{timestamp}_{nombre_archivo_sanitizado}
      const filePath = `gastos/${year}/${month}/${cleanOrigin}/${cleanId}/${fileName}`;

      // Intentar primero en bucket 'gastos', con fallback a 'ventas'
      let uploadTargetBucket = BUCKET_NAME;
      let uploadRes = await supabase.storage
        .from(uploadTargetBucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadRes.error) {
        console.warn(`Fallo al subir a bucket '${BUCKET_NAME}', intentando en '${FALLBACK_BUCKET}'...`, uploadRes.error);
        uploadTargetBucket = FALLBACK_BUCKET;
        uploadRes = await supabase.storage
          .from(uploadTargetBucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: true });
      }

      if (uploadRes.error) {
        console.error('Error al subir archivo de gasto a Supabase Storage:', uploadRes.error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(uploadTargetBucket)
        .getPublicUrl(uploadRes.data.path);

      return {
        url: publicUrlData.publicUrl,
        path: uploadRes.data.path,
        name: file.name,
        mime: file.type || 'application/octet-stream',
      };
    } catch (err) {
      console.error('Excepción en uploadExpenseAttachment:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // GASTOS (CRUD & BANDEJA)
  // ----------------------------------------------------
  async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.providerId) {
        query = query.eq('provider_id', filters.providerId);
      }
      if (filters?.origin && filters.origin !== 'TODOS') {
        query = query.eq('origin', filters.origin);
      }
      if (filters?.status && filters.status !== 'TODOS') {
        query = query.eq('status', filters.status);
      }
      if (filters?.cashBoxId) {
        query = query.eq('cash_box_id', filters.cashBoxId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Aviso al consultar gastos en Supabase (usando caché local si existe):', error.message || error);
        const cached = localStorage.getItem('plegma_cached_expenses');
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
        return [];
      }

      if (!data) return [];

      let result: Expense[] = data.map((row) => ({
        id: row.id,
        expenseNumber: row.expense_number,
        date: row.date,
        concept: row.concept,
        providerId: row.provider_id || undefined,
        providerName: row.provider_name || 'Sin Proveedor',
        origin: row.origin,
        amount: Number(row.amount || 0),
        cashBoxId: row.cash_box_id || undefined,
        cashBoxName: row.cash_box_name || undefined,
        cashMovementId: row.cash_movement_id || undefined,
        status: row.status,
        paymentDate: row.payment_date || undefined,
        paidByUserId: row.paid_by_user_id || undefined,
        paidByUserName: row.paid_by_user_name || undefined,
        notes: row.notes || undefined,
        attachmentUrl: row.attachment_url || undefined,
        attachmentPath: row.attachment_path || undefined,
        attachmentName: row.attachment_name || undefined,
        attachmentMime: row.attachment_mime || undefined,
        referenceId: row.reference_id || undefined,
        recurringExpenseId: row.recurring_expense_id || undefined,
        cancellationReason: row.cancellation_reason || undefined,
        cancelledAt: row.cancelled_at || undefined,
        cancelledByUserName: row.cancelled_by_user_name || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Búsqueda por concepto / detalle en memoria si hay término
      if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase();
        result = result.filter(
          (e) =>
            e.concept.toLowerCase().includes(term) ||
            (e.notes && e.notes.toLowerCase().includes(term)) ||
            e.providerName.toLowerCase().includes(term) ||
            String(e.expenseNumber).includes(term)
        );
      }

      try {
        localStorage.setItem('plegma_cached_expenses', JSON.stringify(result));
      } catch {}

      return result;
    } catch (err: any) {
      console.warn('Excepción al conectar con Supabase para gastos (usando fallback):', err?.message || err);
      const cached = localStorage.getItem('plegma_cached_expenses');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      return [];
    }
  },

  /**
   * Crea un gasto eventual o directo.
   * Si viene con status 'Pagado' y caja seleccionada, genera el impacto en caja.
   */
  async createExpense(
    expenseData: Partial<Expense>,
    file?: File
  ): Promise<Expense | null> {
    try {
      const tempId = crypto.randomUUID ? crypto.randomUUID() : 'exp-' + Date.now();
      let attachmentInfo: { url: string; path: string; name: string; mime: string } | null = null;

      if (file) {
        attachmentInfo = await this.uploadExpenseAttachment(
          file,
          expenseData.origin || 'Eventual',
          tempId
        );
      }

      const isValidCashBoxUuid =
        expenseData.cashBoxId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expenseData.cashBoxId);

      const payload: Record<string, any> = {
        date: expenseData.date || new Date().toISOString().split('T')[0],
        concept: expenseData.concept || 'Gasto General',
        provider_id: expenseData.providerId || null,
        provider_name: expenseData.providerName || 'Sin Proveedor',
        origin: expenseData.origin || 'Eventual',
        amount: Number(expenseData.amount || 0),
        cash_box_id: isValidCashBoxUuid ? expenseData.cashBoxId : null,
        cash_box_name: expenseData.cashBoxName || null,
        status: expenseData.status || 'Pendiente',
        notes: expenseData.notes || null,
        attachment_url: attachmentInfo ? attachmentInfo.url : (expenseData.attachmentUrl || null),
        attachment_path: attachmentInfo ? attachmentInfo.path : (expenseData.attachmentPath || null),
        attachment_name: attachmentInfo ? attachmentInfo.name : (expenseData.attachmentName || null),
        attachment_mime: attachmentInfo ? attachmentInfo.mime : (expenseData.attachmentMime || null),
        reference_id: expenseData.referenceId || null,
        recurring_expense_id: expenseData.recurringExpenseId || null,
      };

      if (expenseData.status === 'Pagado') {
        payload.payment_date = expenseData.paymentDate || new Date().toISOString();
        payload.paid_by_user_id = expenseData.paidByUserId || null;
        payload.paid_by_user_name = expenseData.paidByUserName || 'Usuario';
      }

      let { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('*')
        .single();

      // Si falla por foreign key (23503), reintentar sin cash_box_id estricto
      if (error && (error.code === '23503' || error.message?.includes('violates foreign key constraint'))) {
        payload.cash_box_id = null;
        const retry = await supabase
          .from('expenses')
          .insert(payload)
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Error al insertar gasto:', error);
        return null;
      }

      let createdExpense: Expense = {
        id: data.id,
        expenseNumber: data.expense_number,
        date: data.date,
        concept: data.concept,
        providerId: data.provider_id || undefined,
        providerName: data.provider_name,
        origin: data.origin,
        amount: Number(data.amount),
        cashBoxId: data.cash_box_id || undefined,
        cashBoxName: data.cash_box_name || undefined,
        cashMovementId: data.cash_movement_id || undefined,
        status: data.status,
        paymentDate: data.payment_date || undefined,
        paidByUserId: data.paid_by_user_id || undefined,
        paidByUserName: data.paid_by_user_name || undefined,
        notes: data.notes || undefined,
        attachmentUrl: data.attachment_url || undefined,
        attachmentPath: data.attachment_path || undefined,
        attachmentName: data.attachment_name || undefined,
        attachmentMime: data.attachment_mime || undefined,
        referenceId: data.reference_id || undefined,
        recurringExpenseId: data.recurring_expense_id || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Si se creó directamente como Pagado y tiene caja, vincular movimiento de caja
      if (createdExpense.status === 'Pagado' && createdExpense.cashBoxId) {
        const cashMov = await cashService.addMovement({
          lineId: '',
          shiftId: '',
          dateTime: createdExpense.paymentDate || new Date().toISOString(),
          type: 'Gasto',
          category: 'Gasto ' + createdExpense.origin,
          categoryType: 'Salida',
          origin: `Gasto #${createdExpense.expenseNumber} - ${createdExpense.concept}`,
          voucherNumber: `EXP-${createdExpense.expenseNumber}`,
          amount: createdExpense.amount,
          userId: createdExpense.paidByUserId || '',
          userName: createdExpense.paidByUserName || 'Usuario',
          notes: createdExpense.notes || `Pago de gasto a ${createdExpense.providerName}`,
        });

        if (cashMov?.id) {
          await supabase
            .from('expenses')
            .update({ cash_movement_id: cashMov.id })
            .eq('id', createdExpense.id);
          createdExpense.cashMovementId = cashMov.id;
        }
      }

      return createdExpense;
    } catch (err) {
      console.error('Excepción en createExpense:', err);
      return null;
    }
  },

  /**
   * Actualiza los datos de un gasto en estado 'Pendiente' (concepto, monto, fecha, notas, proveedor)
   */
  async updateExpense(
    expenseId: string,
    updates: {
      concept?: string;
      date?: string;
      amount?: number;
      providerId?: string;
      providerName?: string;
      cashBoxId?: string;
      cashBoxName?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string; expense?: Expense }> {
    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.concept !== undefined) payload.concept = updates.concept.trim();
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.amount !== undefined) payload.amount = Number(updates.amount);
      if (updates.providerId !== undefined) payload.provider_id = updates.providerId || null;
      if (updates.providerName !== undefined) payload.provider_name = updates.providerName.trim();
      if (updates.cashBoxId !== undefined) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.cashBoxId);
        payload.cash_box_id = isUUID ? updates.cashBoxId : null;
      }
      if (updates.cashBoxName !== undefined) payload.cash_box_name = updates.cashBoxName || null;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { data, error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expenseId)
        .eq('status', 'Pendiente')
        .select('*')
        .single();

      if (error) {
        console.error('Error al editar gasto pendiente:', error);
        return { success: false, message: 'No se pudo actualizar el gasto en base de datos.' };
      }

      return { success: true, message: 'Gasto actualizado correctamente.', expense: data as Expense };
    } catch (err: any) {
      console.error('Excepción al editar gasto:', err);
      return { success: false, message: err?.message || 'Error inesperado al actualizar gasto.' };
    }
  },

  /**
   * Anula un gasto buscando por su reference_id (usado en desmarcado de sueldos o anulación de pedidos)
   */
  async voidExpenseByReferenceId(
    referenceId: string,
    reason: string,
    cancelledByUserName?: string
  ): Promise<boolean> {
    try {
      const { data: exp } = await supabase
        .from('expenses')
        .select('*')
        .eq('reference_id', referenceId)
        .maybeSingle();

      if (!exp || exp.status === 'Anulado') {
        return false;
      }

      const res = await this.voidExpense(exp as Expense, reason, cancelledByUserName);
      return res.success;
    } catch (err) {
      console.warn('Error al anular gasto por reference_id:', err);
      return false;
    }
  },

  /**
   * Paga un gasto pendiente con una caja activa y archivo opcional
   */
  async payExpense(
    expense: Expense,
    paymentData: {
      cashBoxId: string;
      cashBoxName: string;
      paymentDate?: string;
      amount?: number;
      paidByUserId?: string;
      paidByUserName?: string;
      notes?: string;
      file?: File;
    }
  ): Promise<{ success: boolean; message: string; expense?: Expense }> {
    try {
      if (expense.status === 'Pagado') {
        return { success: false, message: 'El gasto ya se encuentra pagado.' };
      }
      if (expense.status === 'Anulado') {
        return { success: false, message: 'No se puede pagar un gasto anulado.' };
      }

      const finalAmount = Number(paymentData.amount !== undefined ? paymentData.amount : expense.amount);
      if (finalAmount <= 0) {
        return { success: false, message: 'El importe del pago debe ser mayor a 0.' };
      }

      let attachmentInfo: { url: string; path: string; name: string; mime: string } | null = null;
      if (paymentData.file) {
        attachmentInfo = await this.uploadExpenseAttachment(
          paymentData.file,
          expense.origin,
          expense.id
        );
      }

      const payDate = paymentData.paymentDate || new Date().toISOString();

      // 1. Generar movimiento en caja
      const cashMov = await cashService.addMovement({
        lineId: '',
        shiftId: '',
        dateTime: payDate,
        type: 'Gasto',
        category: 'Gasto ' + expense.origin,
        categoryType: 'Salida',
        origin: `Gasto #${expense.expenseNumber} - ${expense.concept}`,
        voucherNumber: `EXP-${expense.expenseNumber}`,
        amount: finalAmount,
        userId: paymentData.paidByUserId || '',
        userName: paymentData.paidByUserName || 'Usuario',
        notes: paymentData.notes || `Pago a proveedor ${expense.providerName}`,
      });

      // 2. Actualizar gasto a 'Pagado'
      const isValidCashBoxUuid =
        paymentData.cashBoxId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentData.cashBoxId);

      const updatePayload: Record<string, any> = {
        status: 'Pagado',
        amount: finalAmount,
        cash_box_id: isValidCashBoxUuid ? paymentData.cashBoxId : null,
        cash_box_name: paymentData.cashBoxName || null,
        payment_date: payDate,
        paid_by_user_id: paymentData.paidByUserId || null,
        paid_by_user_name: paymentData.paidByUserName || 'Usuario',
        cash_movement_id: cashMov?.id || null,
        updated_at: new Date().toISOString(),
      };

      if (paymentData.notes) {
        updatePayload.notes = paymentData.notes;
      }
      if (attachmentInfo) {
        updatePayload.attachment_url = attachmentInfo.url;
        updatePayload.attachment_path = attachmentInfo.path;
        updatePayload.attachment_name = attachmentInfo.name;
        updatePayload.attachment_mime = attachmentInfo.mime;
      }

      let { data, error } = await supabase
        .from('expenses')
        .update(updatePayload)
        .eq('id', expense.id)
        .select('*')
        .single();

      // Si falla por foreign key (23503), reintentar sin cash_box_id estricto
      if (error && (error.code === '23503' || error.message?.includes('violates foreign key constraint'))) {
        updatePayload.cash_box_id = null;
        const retry = await supabase
          .from('expenses')
          .update(updatePayload)
          .eq('id', expense.id)
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Error al actualizar gasto pagado:', error);
        return { success: false, message: 'Error al actualizar el estado del gasto en base de datos.' };
      }

      const updatedExpense: Expense = {
        ...expense,
        amount: finalAmount,
        status: 'Pagado',
        cashBoxId: paymentData.cashBoxId,
        cashBoxName: paymentData.cashBoxName,
        paymentDate: payDate,
        paidByUserId: paymentData.paidByUserId,
        paidByUserName: paymentData.paidByUserName,
        cashMovementId: cashMov?.id || undefined,
        attachmentUrl: attachmentInfo?.url || expense.attachmentUrl,
        attachmentPath: attachmentInfo?.path || expense.attachmentPath,
        attachmentName: attachmentInfo?.name || expense.attachmentName,
        attachmentMime: attachmentInfo?.mime || expense.attachmentMime,
        notes: paymentData.notes || expense.notes,
        updatedAt: data.updated_at,
      };

      return { success: true, message: 'Gasto pagado e imputado en caja con éxito.', expense: updatedExpense };
    } catch (err: any) {
      console.error('Excepción en payExpense:', err);
      return { success: false, message: err.message || 'Error al procesar el pago del gasto.' };
    }
  },

  /**
   * Anula un gasto. Si estaba pagado, reversa el egreso financiero en caja.
   * NUNCA elimina físicamente el registro ni el archivo en Storage.
   */
  async voidExpense(
    expense: Expense,
    reason: string,
    cancelledByUserName?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (expense.status === 'Anulado') {
        return { success: false, message: 'El gasto ya se encuentra anulado.' };
      }

      const nowIso = new Date().toISOString();

      // Si estaba pagado, reversar el movimiento de caja con un contra-asiento
      if (expense.status === 'Pagado') {
        await cashService.addMovement({
          lineId: '',
          shiftId: '',
          dateTime: nowIso,
          type: 'Ajuste',
          category: 'Reverso Gasto',
          categoryType: 'Ingreso',
          origin: `Reverso Gasto #${expense.expenseNumber} - ${expense.concept}`,
          voucherNumber: `REV-EXP-${expense.expenseNumber}`,
          amount: expense.amount,
          userId: '',
          userName: cancelledByUserName || 'Usuario',
          notes: `Anulación de gasto: ${reason}`,
        });
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'Anulado',
          cancellation_reason: reason,
          cancelled_at: nowIso,
          cancelled_by_user_name: cancelledByUserName || 'Usuario',
          updated_at: nowIso,
        })
        .eq('id', expense.id);

      if (error) {
        console.error('Error al anular gasto:', error);
        return { success: false, message: 'Error al anular el gasto en base de datos.' };
      }

      return { success: true, message: 'Gasto anulado exitosamente.' };
    } catch (err: any) {
      console.error('Excepción en voidExpense:', err);
      return { success: false, message: err.message || 'Error inesperado al anular el gasto.' };
    }
  },

  // ----------------------------------------------------
  // GASTOS RECURRENTES (MAESTRO & AUTOMATIZACIÓN)
  // ----------------------------------------------------
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Aviso al consultar recurrentes en Supabase (usando caché):', error.message || error);
        const cached = localStorage.getItem('plegma_cached_recurring');
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
        return [];
      }

      if (!data) return [];

      const result: RecurringExpense[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        providerId: row.provider_id,
        providerName: row.provider_name,
        frequency: row.frequency,
        scheduledDay: row.scheduled_day,
        habitualAmount: Number(row.habitual_amount || 0),
        defaultCashBoxId: row.default_cash_box_id || undefined,
        notes: row.notes || undefined,
        active: Boolean(row.active),
        lastGeneratedPeriod: row.last_generated_period || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      try {
        localStorage.setItem('plegma_cached_recurring', JSON.stringify(result));
      } catch {}

      return result;
    } catch (err: any) {
      console.warn('Excepción al conectar recurrentes con Supabase:', err?.message || err);
      const cached = localStorage.getItem('plegma_cached_recurring');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      return [];
    }
  },

  async saveRecurringExpense(
    rec: Partial<RecurringExpense>
  ): Promise<RecurringExpense | null> {
    try {
      const payload: Record<string, any> = {
        name: rec.name,
        provider_id: rec.providerId,
        provider_name: rec.providerName,
        frequency: rec.frequency || 'Mensual',
        scheduled_day: rec.scheduledDay || 1,
        habitual_amount: Number(rec.habitualAmount || 0),
        default_cash_box_id: rec.defaultCashBoxId || null,
        notes: rec.notes || null,
        active: rec.active !== undefined ? rec.active : true,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (rec.id) {
        result = await supabase
          .from('recurring_expenses')
          .update(payload)
          .eq('id', rec.id)
          .select('*')
          .single();
      } else {
        result = await supabase
          .from('recurring_expenses')
          .insert(payload)
          .select('*')
          .single();
      }

      if (result.error) {
        console.error('Error al guardar gasto recurrente:', result.error);
        return null;
      }

      const row = result.data;
      return {
        id: row.id,
        name: row.name,
        providerId: row.provider_id,
        providerName: row.provider_name,
        frequency: row.frequency,
        scheduledDay: row.scheduled_day,
        habitualAmount: Number(row.habitual_amount || 0),
        defaultCashBoxId: row.default_cash_box_id || undefined,
        notes: row.notes || undefined,
        active: Boolean(row.active),
        lastGeneratedPeriod: row.last_generated_period || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (err) {
      console.error('Excepción en saveRecurringExpense:', err);
      return null;
    }
  },

  async toggleRecurringExpense(id: string, active: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);

      return !error;
    } catch (err) {
      console.error('Excepción en toggleRecurringExpense:', err);
      return false;
    }
  },

  /**
   * Job/Evaluador de Gastos Recurrentes:
   * Revisa los maestros activos y, si para el período actual no se ha generado
   * y ya se alcanzó o superó el día estipulado, crea el gasto en estado 'Pendiente' (0 impacto en caja).
   */
  async checkAndGeneratePendingRecurringExpenses(): Promise<number> {
    try {
      const recurringList = await this.getRecurringExpenses();
      const activeList = recurringList.filter((r) => r.active);
      if (activeList.length === 0) return 0;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = now.getDate();
      const currentPeriodMonth = `${currentYear}-${currentMonth}`;

      let generatedCount = 0;

      for (const rec of activeList) {
        // Para frecuencia 'Mensual' (la más común)
        let targetPeriod = currentPeriodMonth;

        if (rec.frequency === 'Quincenal') {
          const quincena = currentDay <= 15 ? 'Q1' : 'Q2';
          targetPeriod = `${currentPeriodMonth}-${quincena}`;
        }

        // Si ya se generó para este período, no duplicar
        if (rec.lastGeneratedPeriod === targetPeriod) {
          continue;
        }

        // Si hoy aún no llegó al día programado
        if (currentDay < rec.scheduledDay && rec.frequency === 'Mensual') {
          continue;
        }

        // Determinar fecha del gasto programado
        const expenseDate = `${currentYear}-${currentMonth}-${String(Math.min(rec.scheduledDay, 28)).padStart(2, '0')}`;

        // Crear gasto en estado Pendiente (sin impacto en caja)
        const payload: Record<string, any> = {
          date: expenseDate,
          concept: rec.name,
          provider_id: rec.providerId || null,
          provider_name: rec.providerName,
          origin: 'Recurrente',
          amount: rec.habitualAmount || 0,
          cash_box_id: rec.defaultCashBoxId || null,
          status: 'Pendiente',
          notes: rec.notes ? `[Recurrente] ${rec.notes}` : '[Generación automática recurrente]',
          recurring_expense_id: rec.id,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('expenses')
          .insert(payload)
          .select('id')
          .single();

        if (!insertError && inserted) {
          // Actualizar período generado en el maestro
          await supabase
            .from('recurring_expenses')
            .update({
              last_generated_period: targetPeriod,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rec.id);

          generatedCount++;
        }
      }

      return generatedCount;
    } catch (err) {
      console.error('Excepción en checkAndGeneratePendingRecurringExpenses:', err);
      return 0;
    }
  },

  // ----------------------------------------------------
  // INTEGRACIONES: RRHH Y PROVEEDORES SIN DUPLICAR CAJA
  // ----------------------------------------------------
  /**
   * Registra un gasto originado en RRHH (Sueldos) asociado al comprobante de liquidación
   */
  async recordSalaryExpense(params: {
    payrunId: string;
    employeeId: string;
    employeeName: string;
    amount: number;
    paymentDate: string;
    cashBoxId?: string;
    cashBoxName?: string;
    cashMovementId?: string;
    paidByUserName?: string;
    notes?: string;
  }): Promise<Expense | null> {
    try {
      const refId = `salary_${params.payrunId}_${params.employeeId}`;

      // Verificar si ya existe para evitar duplicar
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('reference_id', refId)
        .maybeSingle();

      if (existing) {
        return null;
      }

      const isBoxUUID =
        params.cashBoxId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.cashBoxId);
      const isMovUUID =
        params.cashMovementId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.cashMovementId);

      const payload: Record<string, any> = {
        date: params.paymentDate.split('T')[0] || new Date().toISOString().split('T')[0],
        concept: `Pago de Haberes - ${params.employeeName}`,
        provider_name: `Empleado: ${params.employeeName}`,
        origin: 'Sueldos',
        amount: params.amount,
        cash_box_id: isBoxUUID ? params.cashBoxId : null,
        cash_box_name: params.cashBoxName || null,
        cash_movement_id: isMovUUID ? params.cashMovementId : null,
        status: 'Pagado',
        payment_date: params.paymentDate,
        paid_by_user_name: params.paidByUserName || 'RRHH',
        notes: params.notes || `Liquidación ${params.payrunId}`,
        reference_id: refId,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al registrar gasto de sueldo:', error);
        return null;
      }

      return data as Expense;
    } catch (err) {
      console.error('Excepción en recordSalaryExpense:', err);
      return null;
    }
  },

  /**
   * Registra un gasto originado en Proveedores / Compras asociado al comprobante
   */
  async recordPurchaseExpense(params: {
    orderId?: string;
    invoiceNumber?: string;
    providerId: string;
    providerName: string;
    amount: number;
    paymentDate: string;
    cashBoxId?: string;
    cashBoxName?: string;
    cashMovementId?: string;
    paidByUserName?: string;
    notes?: string;
    attachmentUrl?: string;
  }): Promise<Expense | null> {
    try {
      const refId = `purchase_${params.orderId || params.invoiceNumber || Date.now()}`;

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('reference_id', refId)
        .maybeSingle();

      if (existing) {
        return null;
      }

      const isProvUUID =
        params.providerId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.providerId);
      const isBoxUUID =
        params.cashBoxId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.cashBoxId);
      const isMovUUID =
        params.cashMovementId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.cashMovementId);

      const payload: Record<string, any> = {
        date: params.paymentDate.split('T')[0] || new Date().toISOString().split('T')[0],
        concept: `Compra / Comprobante ${params.invoiceNumber || ''}`.trim(),
        provider_id: isProvUUID ? params.providerId : null,
        provider_name: params.providerName,
        origin: 'Proveedores',
        amount: params.amount,
        cash_box_id: isBoxUUID ? params.cashBoxId : null,
        cash_box_name: params.cashBoxName || null,
        cash_movement_id: isMovUUID ? params.cashMovementId : null,
        status: 'Pagado',
        payment_date: params.paymentDate,
        paid_by_user_name: params.paidByUserName || 'Compras',
        notes: params.notes || `Orden de compra ${params.orderId || ''}`,
        reference_id: refId,
        attachment_url: params.attachmentUrl || null,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al registrar gasto de compras:', error);
        return null;
      }

      return data as Expense;
    } catch (err) {
      console.error('Excepción en recordPurchaseExpense:', err);
      return null;
    }
  },
};

