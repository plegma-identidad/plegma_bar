import { supabase } from '../lib/supabase';
import { SaleOrder, SaleOrderItem } from '../types';

export const saleOrdersService = {
  async getAll(): Promise<SaleOrder[]> {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('sale_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error al obtener pedidos desde Supabase:', ordersError);
        return [];
      }

      if (!ordersData || ordersData.length === 0) return [];

      const orderIds = ordersData.map((o) => o.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error al obtener ítems de pedidos desde Supabase:', itemsError);
      }

      const itemsByOrderId = new Map<string, SaleOrderItem[]>();
      (itemsData || []).forEach((itemRow) => {
        const list = itemsByOrderId.get(itemRow.order_id) || [];
        list.push({
          id: itemRow.id,
          productId: itemRow.product_id || '',
          productName: itemRow.product_name,
          category: itemRow.category || 'General',
          unitPrice: itemRow.unit_price,
          costPrice: itemRow.cost_price || undefined,
          quantity: itemRow.quantity,
          sideOption: itemRow.side_option || undefined,
          selectedOptions: itemRow.selected_options || undefined,
          subtotal: itemRow.subtotal,
          lineComment: itemRow.line_comment || undefined,
        });
        itemsByOrderId.set(itemRow.order_id, list);
      });

      return ordersData.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        createdAt: row.created_at || row.t1_created_at,
        saleTypeId: row.sale_type_id || '',
        saleTypeName: row.sale_type_name || '',
        clientId: row.client_id || '',
        clientName: row.client_name || '',
        clientPhone: row.client_phone || undefined,
        tableId: row.table_id || undefined,
        tableName: row.table_name || undefined,
        totalAmount: row.total_amount,
        status: row.status || 'Pendiente',
        createdByUserId: row.created_by_user_id || '',
        createdByUserName: row.created_by_user_name || '',
        generalNotes: row.general_notes || undefined,
        t1CreatedAt: row.t1_created_at || row.created_at,
        t2ComandaAt: row.t2_comanda_at || undefined,
        t3KitchenOutputAt: row.t3_kitchen_output_at || undefined,
        t4DeliveredAt: row.t4_delivered_at || undefined,
        billingDetails: row.billing_details || undefined,
        items: itemsByOrderId.get(row.id) || [],
      }));
    } catch (err) {
      console.error('Exception al obtener pedidos:', err);
      return [];
    }
  },

  async save(order: SaleOrder): Promise<SaleOrder | null> {
    try {
      const isExistingUuid =
        order.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);

      const isValidSaleTypeUuid =
        order.saleTypeId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.saleTypeId);

      const isValidClientUuid =
        order.clientId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.clientId);

      const isValidTableUuid =
        order.tableId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.tableId);

      const isValidUserUuid =
        order.createdByUserId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.createdByUserId);

      const orderPayload: Record<string, any> = {
        sale_type_id: isValidSaleTypeUuid ? order.saleTypeId : null,
        sale_type_name: order.saleTypeName || 'Salón',
        client_id: isValidClientUuid ? order.clientId : null,
        client_name: order.clientName || 'Consumidor Final',
        client_phone: order.clientPhone || null,
        table_id: isValidTableUuid ? order.tableId : null,
        table_name: order.tableName || null,
        total_amount: order.totalAmount || 0,
        status: order.status || 'Pendiente',
        created_by_user_id: isValidUserUuid ? order.createdByUserId : null,
        created_by_user_name: order.createdByUserName || 'Administrador',
        general_notes: order.generalNotes || null,
        t1_created_at: order.t1CreatedAt || new Date().toISOString(),
        t2_comanda_at: order.t2ComandaAt || null,
        t3_kitchen_output_at: order.t3KitchenOutputAt || null,
        t4_delivered_at: order.t4DeliveredAt || null,
        billing_details: order.billingDetails || null,
      };

      let savedOrderId = order.id;
      let savedOrderNumber = order.orderNumber;
      let savedCreatedAt = order.createdAt;

      if (isExistingUuid) {
        const { data, error } = await supabase
          .from('sale_orders')
          .update(orderPayload)
          .eq('id', order.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar pedido en Supabase:', error.message || error);
          return null;
        }

        savedOrderId = data.id;
        savedOrderNumber = data.order_number;
        savedCreatedAt = data.created_at;
      } else {
        const { data, error } = await supabase
          .from('sale_orders')
          .insert(orderPayload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al crear pedido en Supabase:', error.message || error);
          return null;
        }

        savedOrderId = data.id;
        savedOrderNumber = data.order_number;
        savedCreatedAt = data.created_at;
      }

      // Re-insert order items for savedOrderId
      await supabase.from('sale_order_items').delete().eq('order_id', savedOrderId);

      if (order.items && order.items.length > 0) {
        const itemsPayload = order.items.map((item) => {
          const isValidProductUuid =
            item.productId &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);

          return {
            order_id: savedOrderId,
            product_id: isValidProductUuid ? item.productId : null,
            product_name: item.productName,
            category: item.category || 'General',
            unit_price: item.unitPrice,
            cost_price: item.costPrice || null,
            quantity: item.quantity,
            side_option: item.sideOption || null,
            selected_options: item.selectedOptions || null,
            subtotal: item.subtotal,
            line_comment: item.lineComment || null,
          };
        });

        const { data: savedItemsData, error: itemsInsertError } = await supabase
          .from('sale_order_items')
          .insert(itemsPayload)
          .select('*');

        if (itemsInsertError) {
          console.error('Error al guardar ítems del pedido en Supabase:', itemsInsertError);
        }

        const savedItems: SaleOrderItem[] = (savedItemsData || []).map((itemRow) => ({
          id: itemRow.id,
          productId: itemRow.product_id || '',
          productName: itemRow.product_name,
          category: itemRow.category || 'General',
          unitPrice: itemRow.unit_price,
          costPrice: itemRow.cost_price || undefined,
          quantity: itemRow.quantity,
          sideOption: itemRow.side_option || undefined,
          selectedOptions: itemRow.selected_options || undefined,
          subtotal: itemRow.subtotal,
          lineComment: itemRow.line_comment || undefined,
        }));

        return {
          ...order,
          id: savedOrderId,
          orderNumber: savedOrderNumber,
          createdAt: savedCreatedAt,
          items: savedItems,
        };
      }

      return {
        ...order,
        id: savedOrderId,
        orderNumber: savedOrderNumber,
        createdAt: savedCreatedAt,
        items: [],
      };
    } catch (err) {
      console.error('Exception al guardar pedido:', err);
      return null;
    }
  },

  async updateStatus(
    orderId: string,
    status: string,
    timestamps?: { t2ComandaAt?: string; t3KitchenOutputAt?: string; t4DeliveredAt?: string }
  ): Promise<boolean> {
    try {
      const payload: Record<string, any> = { status };
      if (timestamps?.t2ComandaAt) payload.t2_comanda_at = timestamps.t2ComandaAt;
      if (timestamps?.t3KitchenOutputAt) payload.t3_kitchen_output_at = timestamps.t3KitchenOutputAt;
      if (timestamps?.t4DeliveredAt) payload.t4_delivered_at = timestamps.t4DeliveredAt;

      const { error } = await supabase
        .from('sale_orders')
        .update(payload)
        .eq('id', orderId);

      if (error) {
        console.error('Error al actualizar estado del pedido en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al actualizar estado del pedido:', err);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sale_orders').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar pedido en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar pedido:', err);
      return false;
    }
  },
};
