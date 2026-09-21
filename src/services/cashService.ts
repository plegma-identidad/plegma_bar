import { supabase } from '../lib/supabase';
import { MasterCashBox, CashShift, CashLine, CashMovement } from '../types';

export const cashService = {
  // ----------------------------------------------------
  // MASTER CASH BOXES
  // ----------------------------------------------------
  async getMasterCashBoxes(): Promise<MasterCashBox[]> {
    try {
      const { data, error } = await supabase
        .from('master_cash_boxes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error al obtener cajas maestras desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        boxType: row.box_type || row.name,
        status: (row.status as any) || 'Siempre Abierta',
        currentBalance: row.current_balance || 0,
      }));
    } catch (err) {
      console.error('Exception al obtener cajas maestras:', err);
      return [];
    }
  },

  async updateMasterCashBoxBalance(id: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('master_cash_boxes')
        .update({ current_balance: newBalance })
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar saldo de caja maestra:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al actualizar saldo de caja maestra:', err);
      return false;
    }
  },

  // ----------------------------------------------------
  // CASH SHIFTS
  // ----------------------------------------------------
  async getShifts(): Promise<CashShift[]> {
    try {
      const { data, error } = await supabase
        .from('cash_shifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener cajas de turno desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        shift: row.shift,
        createdAt: row.created_at || new Date().toISOString(),
        name: row.name,
        status: row.status,
        openedByUserId: row.opened_by_user_id || '',
        openedByUserName: row.opened_by_user_name || 'Usuario Autenticado',
        notes: row.notes || undefined,
        closedAt: row.closed_at || undefined,
        reconciledAt: row.reconciled_at || undefined,
        reconciledByUserName: row.reconciled_by_user_name || undefined,
        totalDifference: row.total_difference || 0,
        voidReason: row.void_reason || undefined,
      }));
    } catch (err) {
      console.error('Exception al obtener cajas de turno:', err);
      return [];
    }
  },

  async saveShift(shift: CashShift): Promise<CashShift | null> {
    try {
      const isExistingUuid =
        shift.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shift.id);

      const isValidUserUuid =
        shift.openedByUserId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shift.openedByUserId);

      const payload: Record<string, any> = {
        shift: shift.shift,
        name: shift.name,
        status: shift.status,
        opened_by_user_id: isValidUserUuid ? shift.openedByUserId : null,
        opened_by_user_name: shift.openedByUserName,
        notes: shift.notes || null,
        closed_at: shift.closedAt || null,
        reconciled_at: shift.reconciledAt || null,
        reconciled_by_user_name: shift.reconciledByUserName || null,
        total_difference: shift.totalDifference || 0,
        void_reason: shift.voidReason || null,
      };

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('cash_shifts')
          .update(payload)
          .eq('id', shift.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar turno en Supabase:', error);
          return null;
        }

        return {
          ...shift,
          id: data.id,
          createdAt: data.created_at,
        };
      } else {
        const { data, error } = await supabase
          .from('cash_shifts')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al crear turno en Supabase:', error);
          return null;
        }

        return {
          ...shift,
          id: data.id,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.error('Exception al guardar turno:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // CASH LINES
  // ----------------------------------------------------
  async getLines(): Promise<CashLine[]> {
    try {
      const { data, error } = await supabase
        .from('cash_lines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener líneas de caja desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        shiftId: row.shift_id,
        boxType: row.box_type,
        initialAmount: row.initial_amount || 0,
        ticketsTotal: row.tickets_total || 0,
        expensesTotal: row.expenses_total || 0,
        withdrawalsTotal: row.withdrawals_total || 0,
        theoreticalAmount: row.theoretical_amount || 0,
        realAmount: row.real_amount ?? undefined,
        difference: row.difference ?? undefined,
        differenceNotes: row.difference_notes || undefined,
        status: row.status,
        openedByUserId: row.opened_by_user_id || undefined,
        openedByUserName: row.opened_by_user_name || undefined,
        closedAt: row.closed_at || undefined,
      }));
    } catch (err) {
      console.error('Exception al obtener líneas de caja:', err);
      return [];
    }
  },

  async saveLine(line: CashLine): Promise<CashLine | null> {
    try {
      const isExistingUuid =
        line.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line.id);

      const isValidShiftUuid =
        line.shiftId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line.shiftId);

      const isValidUserUuid =
        line.openedByUserId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line.openedByUserId);

      const payload: Record<string, any> = {
        shift_id: isValidShiftUuid ? line.shiftId : null,
        box_type: line.boxType,
        initial_amount: line.initialAmount || 0,
        tickets_total: line.ticketsTotal || 0,
        expenses_total: line.expensesTotal || 0,
        withdrawals_total: line.withdrawalsTotal || 0,
        theoretical_amount: line.theoreticalAmount || 0,
        real_amount: line.realAmount ?? null,
        difference: line.difference ?? null,
        difference_notes: line.differenceNotes || null,
        status: line.status,
        opened_by_user_id: isValidUserUuid ? line.openedByUserId : null,
        opened_by_user_name: line.openedByUserName || null,
        closed_at: line.closedAt || null,
      };

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('cash_lines')
          .update(payload)
          .eq('id', line.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar línea de caja en Supabase:', error);
          return null;
        }

        return { ...line, id: data.id };
      } else {
        const { data, error } = await supabase
          .from('cash_lines')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al crear línea de caja en Supabase:', error);
          return null;
        }

        return { ...line, id: data.id };
      }
    } catch (err) {
      console.error('Exception al guardar línea de caja:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // CASH MOVEMENTS
  // ----------------------------------------------------
  async getMovements(): Promise<CashMovement[]> {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error al obtener movimientos de caja desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        lineId: row.line_id,
        shiftId: row.shift_id,
        dateTime: row.date_time,
        type: row.type,
        category: row.category || undefined,
        categoryType: row.category_type || undefined,
        origin: row.origin,
        voucherNumber: row.voucher_number || undefined,
        amount: row.amount || 0,
        userId: row.user_id || '',
        userName: row.user_name || 'Usuario Autenticado',
        notes: row.notes || undefined,
        targetLineId: row.target_line_id || undefined,
        targetMasterBoxId: row.target_master_box_id || undefined,
      }));
    } catch (err) {
      console.error('Exception al obtener movimientos de caja:', err);
      return [];
    }
  },

  async addMovement(movement: Omit<CashMovement, 'id'> | CashMovement): Promise<CashMovement | null> {
    try {
      const isValidLineUuid =
        movement.lineId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.lineId);

      const isValidShiftUuid =
        movement.shiftId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.shiftId);

      const isValidUserUuid =
        movement.userId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.userId);

      const isValidTargetLineUuid =
        movement.targetLineId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.targetLineId);

      const isValidTargetMasterUuid =
        movement.targetMasterBoxId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.targetMasterBoxId);

      const payload: Record<string, any> = {
        line_id: isValidLineUuid ? movement.lineId : null,
        shift_id: isValidShiftUuid ? movement.shiftId : null,
        date_time: movement.dateTime || new Date().toISOString(),
        type: movement.type,
        category: movement.category || null,
        category_type: movement.categoryType || null,
        origin: movement.origin,
        voucher_number: movement.voucherNumber || null,
        amount: movement.amount || 0,
        user_id: isValidUserUuid ? movement.userId : null,
        user_name: movement.userName || 'Usuario Autenticado',
        notes: movement.notes || null,
        target_line_id: isValidTargetLineUuid ? movement.targetLineId : null,
        target_master_box_id: isValidTargetMasterUuid ? movement.targetMasterBoxId : null,
      };

      const { data, error } = await supabase
        .from('cash_movements')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al insertar movimiento de caja en Supabase:', error);
        return null;
      }

      return {
        ...movement,
        id: data.id,
        dateTime: data.date_time,
      };
    } catch (err) {
      console.error('Exception al crear movimiento de caja:', err);
      return null;
    }
  },
};
