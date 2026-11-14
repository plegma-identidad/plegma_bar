import { supabase } from '../lib/supabase';
import { Order } from '../types';

const STORAGE_KEY = 'plegma_orders';
const LEGACY_STORAGE_KEY = 'gastronomic_erp_state_clean_v1';

export const purchaseOrdersService = {
  /**
   * Obtiene las órdenes guardadas en localStorage de forma síncrona para inicializar estado
   */
  getAllLocal(): Order[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo orders desde localStorage:', e);
    }
    return [];
  },

  /**
   * Guarda todas las órdenes en localStorage de forma síncrona
   */
  saveAllLocal(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error guardando orders en localStorage:', e);
    }
  },

  /**
   * Obtiene todas las órdenes combinando Supabase y localStorage
   */
  async getAll(): Promise<Order[]> {
    const local = this.getAllLocal();

    try {
      const { data: dbOrders, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          items:purchase_order_items(*)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.warn('Aviso: No se pudieron obtener purchase_orders de Supabase. Usando local.', error.message);
        return local;
      }

      if (dbOrders && dbOrders.length > 0) {
        const mappedOrders: Order[] = dbOrders.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          date: row.date,
          providerId: row.provider_id,
          expectedDeliveryDate: row.expected_delivery_date,
          userId: row.user_id || 'usr-gerente',
          userName: row.user_name || 'Usuario',
          status: row.status,
          generalNotes: row.general_notes || '',
          receptionHoursSnapshot: row.reception_hours_snapshot || {
            morningStart: '08:00',
            morningEnd: '12:00',
            afternoonStart: '16:00',
            afternoonEnd: '19:00',
          },
          estimatedTotal: Number(row.estimated_total) || 0,
          finalReceivedTotal: row.final_received_total != null ? Number(row.final_received_total) : undefined,
          receptionDate: row.reception_date || undefined,
          invoiceOrReceiptNumber: row.invoice_or_receipt_number || undefined,
          deliveryType: row.delivery_type || undefined,
          paymentStatus: row.payment_status || 'Pendiente de pago',
          paidAmount: Number(row.paid_amount) || 0,
          remainingDebt: row.remaining_debt != null ? Number(row.remaining_debt) : Number(row.estimated_total) || 0,
          paymentMethod: row.payment_method || undefined,
          items: (row.items || []).map((it: any) => ({
            itemId: it.item_id,
            itemName: it.item_name,
            unit: it.unit,
            suggestedQty: Number(it.suggested_qty) || 0,
            finalQty: Number(it.final_qty) || 0,
            receivedQty: it.received_qty != null ? Number(it.received_qty) : undefined,
            referencePrice: Number(it.reference_price) || 0,
            itemNotes: it.item_notes || '',
          })),
        }));

        // Sincronizar órdenes locales que falten en Supabase
        const localOnly = local.filter((l) => !mappedOrders.some((m) => m.id === l.id || m.orderNumber === l.orderNumber));
        if (localOnly.length > 0) {
          for (const loc of localOnly) {
            await this.syncToSupabase(loc);
          }
        }
        const combined = [...mappedOrders, ...localOnly];
        this.saveAllLocal(combined);
        return combined;
      } else if (local.length > 0) {
        // La tabla de Supabase está vacía pero hay pedidos locales: sincronizarlos
        for (const loc of local) {
          await this.syncToSupabase(loc);
        }
      }
    } catch (err) {
      console.warn('Excepción al cargar purchase_orders de Supabase:', err);
    }

    return local;
  },

  /**
   * Sincroniza una orden local con Supabase
   */
  async syncToSupabase(order: Order): Promise<void> {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      const isProviderUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.providerId);

      // Verificar si ya existe por order_number
      const { data: existing } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('order_number', order.orderNumber)
        .maybeSingle();

      if (existing) return;

      const dbPayload: any = {
        order_number: order.orderNumber,
        date: order.date,
        provider_id: isProviderUUID ? order.providerId : null,
        expected_delivery_date: order.expectedDeliveryDate,
        user_name: order.userName,
        status: order.status,
        general_notes: order.generalNotes,
        reception_hours_snapshot: order.receptionHoursSnapshot,
        estimated_total: order.estimatedTotal,
        payment_status: order.paymentStatus,
        paid_amount: order.paidAmount || 0,
        remaining_debt: order.remainingDebt != null ? order.remainingDebt : order.estimatedTotal,
      };

      if (isUUID) {
        dbPayload.id = order.id;
      }

      const { data: insertedOrder, error: orderErr } = await supabase
        .from('purchase_orders')
        .insert(dbPayload)
        .select()
        .single();

      if (orderErr || !insertedOrder) return;

      if (order.items && order.items.length > 0) {
        const itemsPayload = order.items.map((it) => {
          const isItemUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(it.itemId);
          return {
            order_id: insertedOrder.id,
            item_id: isItemUUID ? it.itemId : null,
            item_name: it.itemName,
            unit: it.unit,
            suggested_qty: it.suggestedQty,
            final_qty: it.finalQty,
            reference_price: it.referencePrice,
            item_notes: it.itemNotes || '',
          };
        });

        await supabase.from('purchase_order_items').insert(itemsPayload);
      }
    } catch (e) {
      console.warn('Aviso sincronizando orden a Supabase:', e);
    }
  },

  /**
   * Guarda un nuevo pedido
   */
  async create(order: Order): Promise<void> {
    // 1. Guardado local inmediato para garantizar persistencia
    const local = this.getAllLocal();
    const updated = [order, ...local.filter((o) => o.id !== order.id)];
    this.saveAllLocal(updated);

    // 2. Intentar guardar en Supabase de forma segura
    try {
      await this.syncToSupabase(order);
    } catch (e) {
      console.warn('Excepción guardando purchase_order en Supabase:', e);
    }
  },

  /**
   * Actualiza un pedido existente
   */
  async update(order: Order): Promise<void> {
    // 1. Guardar en local primero
    const local = this.getAllLocal();
    const updated = local.map((o) => (o.id === order.id ? order : o));
    this.saveAllLocal(updated);

    // 2. Intentar actualizar en Supabase
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      if (!isUUID) return;

      await supabase
        .from('purchase_orders')
        .update({
          status: order.status,
          final_received_total: order.finalReceivedTotal,
          reception_date: order.receptionDate,
          invoice_or_receipt_number: order.invoiceOrReceiptNumber,
          delivery_type: order.deliveryType,
          payment_status: order.paymentStatus,
          paid_amount: order.paidAmount,
          remaining_debt: order.remainingDebt,
          payment_method: order.paymentMethod,
        })
        .eq('id', order.id);
    } catch (e) {
      console.warn('Excepción actualizando purchase_order en Supabase:', e);
    }
  },

  /**
   * Elimina un pedido local y en Supabase
   */
  async delete(orderId: string): Promise<void> {
    const local = this.getAllLocal();
    const updated = local.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    this.saveAllLocal(updated);

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isUUID) {
        await supabase.from('purchase_order_items').delete().eq('order_id', orderId);
        await supabase.from('purchase_orders').delete().eq('id', orderId);
      } else {
        await supabase.from('purchase_orders').delete().eq('order_number', orderId);
      }
    } catch (e) {
      console.warn('Excepción eliminando purchase_order en Supabase:', e);
    }
  },

  /**
   * Vacía todos los pedidos en local y en Supabase
   */
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem('plegma_orders');
    } catch {}

    try {
      // Eliminar registros de Supabase
      await supabase.from('purchase_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Error clearing purchase_orders in Supabase:', e);
    }
  },
};
