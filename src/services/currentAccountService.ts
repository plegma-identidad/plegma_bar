import { supabase } from '../lib/supabase';
import { CurrentAccountMovement, Receipt, EmployeeConsumption } from '../types';

export const currentAccountService = {
  // ----------------------------------------------------
  // CURRENT ACCOUNT MOVEMENTS
  // ----------------------------------------------------
  async getMovements(): Promise<CurrentAccountMovement[]> {
    try {
      const { data, error } = await supabase
        .from('current_account_movements')
        .select('*')
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error al obtener movimientos de cuenta corriente desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        dateTime: row.date_time,
        voucherType: row.voucher_type || 'Ticket',
        type: row.type || 'Venta',
        total: row.total || 0,
        ticketDetail: row.ticket_detail || undefined,
        ticketNumber: row.ticket_number || undefined,
        lineState: row.line_state || 'Pendiente',
      }));
    } catch (err) {
      console.error('Exception al obtener movimientos de CC:', err);
      return [];
    }
  },

  async addMovement(mov: CurrentAccountMovement): Promise<CurrentAccountMovement | null> {
    try {
      const isValidClientUuid =
        mov.clientId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mov.clientId);

      const payload: Record<string, any> = {
        client_id: isValidClientUuid ? mov.clientId : null,
        date_time: mov.dateTime || new Date().toISOString(),
        voucher_type: mov.voucherType || 'Ticket',
        type: mov.type || 'Venta',
        total: mov.total || 0,
        ticket_detail: mov.ticketDetail || null,
        ticket_number: mov.ticketNumber || null,
        line_state: mov.lineState || 'Pendiente',
      };

      const { data, error } = await supabase
        .from('current_account_movements')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al guardar movimiento de CC en Supabase:', error);
        return null;
      }

      return {
        ...mov,
        id: data.id,
        dateTime: data.date_time,
      };
    } catch (err) {
      console.error('Exception al guardar movimiento de CC:', err);
      return null;
    }
  },

  async updateMovementState(id: string, lineState: CurrentAccountMovement['lineState']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('current_account_movements')
        .update({ line_state: lineState })
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar estado de movimiento CC:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al actualizar estado de movimiento CC:', err);
      return false;
    }
  },

  // ----------------------------------------------------
  // RECEIPTS
  // ----------------------------------------------------
  async getReceipts(): Promise<Receipt[]> {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error al obtener recibos desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        receiptNumber: row.receipt_number,
        clientId: row.client_id || '',
        dateTime: row.date_time,
        totalAmount: row.total_amount || 0,
        status: row.status || 'Pendiente',
        userName: row.user_name || 'Usuario Autenticado',
        movementIds: row.movement_ids || [],
        paymentMethod: row.payment_method || undefined,
        cashRegister: row.cash_register || undefined,
        appliedToPayroll: row.applied_to_payroll || false,
        billedAt: row.billed_at || undefined,
      }));
    } catch (err) {
      console.error('Exception al obtener recibos:', err);
      return [];
    }
  },

  async saveReceipt(receipt: Receipt): Promise<Receipt | null> {
    try {
      const isExistingUuid =
        receipt.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.id);

      const isValidClientUuid =
        receipt.clientId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.clientId);

      const validMovementUuids = (receipt.movementIds || []).filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );

      const payload: Record<string, any> = {
        receipt_number: receipt.receiptNumber,
        client_id: isValidClientUuid ? receipt.clientId : null,
        date_time: receipt.dateTime || new Date().toISOString(),
        total_amount: receipt.totalAmount || 0,
        status: receipt.status || 'Pendiente',
        user_name: receipt.userName || 'Usuario Autenticado',
        movement_ids: validMovementUuids,
        payment_method: receipt.paymentMethod || null,
        cash_register: receipt.cashRegister || null,
        applied_to_payroll: receipt.appliedToPayroll || false,
        billed_at: receipt.billedAt || null,
      };

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('receipts')
          .update(payload)
          .eq('id', receipt.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar recibo en Supabase:', error);
          return null;
        }

        return { ...receipt, id: data.id };
      } else {
        const { data, error } = await supabase
          .from('receipts')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al crear recibo en Supabase:', error);
          return null;
        }

        return { ...receipt, id: data.id, dateTime: data.date_time };
      }
    } catch (err) {
      console.error('Exception al guardar recibo:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // EMPLOYEE CONSUMPTIONS
  // ----------------------------------------------------
  async getEmployeeConsumptions(): Promise<EmployeeConsumption[]> {
    try {
      const { data, error } = await supabase
        .from('employee_consumptions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error al obtener consumos de empleados desde Supabase:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row) => ({
        id: row.id,
        employeeId: row.employee_id || '',
        employeeName: row.employee_name,
        dni: row.dni || 'N/A',
        date: row.date,
        orderNumber: row.order_number,
        amount: row.amount || 0,
        detail: row.detail || '',
        liquidationPeriod: row.liquidation_period || undefined,
        status: row.status || 'Pendiente',
      }));
    } catch (err) {
      console.error('Exception al obtener consumos de empleados:', err);
      return [];
    }
  },

  async addEmployeeConsumption(ec: EmployeeConsumption): Promise<EmployeeConsumption | null> {
    try {
      const isValidEmpUuid =
        ec.employeeId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ec.employeeId);

      const payload: Record<string, any> = {
        employee_id: isValidEmpUuid ? ec.employeeId : null,
        employee_name: ec.employeeName,
        dni: ec.dni || 'N/A',
        date: ec.date || new Date().toISOString(),
        order_number: ec.orderNumber || '',
        amount: ec.amount || 0,
        detail: ec.detail || '',
        liquidation_period: ec.liquidationPeriod || null,
        status: ec.status || 'Pendiente',
      };

      const { data, error } = await supabase
        .from('employee_consumptions')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al guardar consumo de empleado en Supabase:', error);
        return null;
      }

      return { ...ec, id: data.id, date: data.date };
    } catch (err) {
      console.error('Exception al guardar consumo de empleado:', err);
      return null;
    }
  },
};
