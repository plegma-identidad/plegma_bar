import { supabase } from '../lib/supabase';
import {
  KitchenBatch,
  KitchenBatchItem,
  KitchenBatchStatus,
  SaleOrder,
  SaleOrderItem,
  SaleProduct,
  ConsolidatedProductionItem,
} from '../types';

/**
 * Helper para verificar si un producto de la carta corresponde a Fabricación (cocina)
 */
export const isManufacturingProduct = (
  productId: string,
  productName: string,
  category: string,
  catalog: SaleProduct[]
): boolean => {
  const normName = (productName || '').trim().toLowerCase();
  
  // Buscar en el maestro de productos de venta
  const matched = catalog.find(
    (p) => p.id === productId || (p.name && p.name.trim().toLowerCase() === normName)
  );

  if (matched) {
    const pType = String(matched.productType || '').toLowerCase();
    if (pType.includes('reventa')) {
      return false; // Excluido: producto envasado / reventa directa
    }
    if (pType.includes('fab') || (matched.recipeComponents && matched.recipeComponents.length > 0)) {
      return true; // Incluido: elaboración en cocina
    }
  }

  // Si no está explícito en el maestro, evaluar por categoría
  const normCat = (category || '').trim().toLowerCase();
  const reventaCategories = ['bebidas', 'gaseosas', 'cervezas', 'vinos', 'tragos', 'kiosco', 'almacen'];
  if (reventaCategories.some((c) => normCat.includes(c))) {
    // Si contiene mención a comida o elaboración, puede ser preparación de barra o cocina
    if (normName.includes('licuado') || normName.includes('jugo natural') || normName.includes('trago')) {
      return true;
    }
    return false;
  }

  // Por defecto, platos y comidas son de fabricación
  return true;
};

// Helper para normalizar la clave de comparación de un plato para evitar duplicados en lotes
const getNormalizedItemKey = (name: string, comment?: string, options?: any[]): string => {
  const normName = (name || '').trim().toLowerCase();
  const normComment = (comment || '').trim().toLowerCase();
  const normOpts = (options || [])
    .map((o: any) => `${(o.groupName || '').trim()}:${(o.optionName || '').trim()}`)
    .sort()
    .join('|')
    .toLowerCase();
  return `${normName}___${normComment}___${normOpts}`;
};

export const kitchenService = {
  /**
   * Obtiene todos los lotes de cocina activos (Pendiente o En preparación) o según filtros
   */
  async getBatches(options?: {
    activeOnly?: boolean;
    orderId?: string;
    saleTypeName?: string;
  }): Promise<KitchenBatch[]> {
    try {
      let query = supabase
        .from('kitchen_batches')
        .select('*')
        .order('created_at', { ascending: true }); // Estricto orden cronológico

      if (options?.orderId) {
        query = query.eq('order_id', options.orderId);
      } else if (options?.activeOnly !== false) {
        query = query.in('status', ['Pendiente', 'En preparación']);
      }

      if (options?.saleTypeName && options.saleTypeName !== 'TODOS') {
        query = query.ilike('sale_type_name', `%${options.saleTypeName}%`);
      }

      const { data: batchesData, error: batchesError } = await query;

      if (batchesError) {
        console.error('Error al obtener lotes de cocina de Supabase:', batchesError);
        return [];
      }

      if (!batchesData || batchesData.length === 0) {
        return [];
      }

      const batchIds = batchesData.map((b) => b.id);

      // Cargar ítems asociados a los lotes
      const { data: itemsData, error: itemsError } = await supabase
        .from('kitchen_batch_items')
        .select('*')
        .in('batch_id', batchIds)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Error al obtener ítems de cocina de Supabase:', itemsError);
      }

      const itemsByBatch = new Map<string, KitchenBatchItem[]>();
      (itemsData || []).forEach((row: any) => {
        const item: KitchenBatchItem = {
          id: row.id,
          batchId: row.batch_id,
          saleOrderItemId: row.sale_order_item_id || undefined,
          productId: row.product_id || '',
          productName: row.product_name,
          category: row.category || undefined,
          quantity: Number(row.quantity) || 1,
          selectedOptions: row.selected_options || [],
          lineComment: row.line_comment || undefined,
          itemStatus: (row.item_status as any) || 'Activo',
          alertMessage: row.alert_message || undefined,
          createdAt: row.created_at,
        };
        const list = itemsByBatch.get(row.batch_id) || [];
        list.push(item);
        itemsByBatch.set(row.batch_id, list);
      });

      return batchesData.map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        orderNumber: row.order_number,
        batchNumber: row.batch_number || 1,
        status: (row.status as KitchenBatchStatus) || 'Pendiente',
        saleTypeName: row.sale_type_name || 'Salón',
        tableName: row.table_name || undefined,
        clientName: row.client_name || undefined,
        generalNotes: row.general_notes || undefined,
        deliveryAddress: row.delivery_address || undefined,
        createdAt: row.created_at,
        startedAt: row.started_at || undefined,
        startedByUserId: row.started_by_user_id || undefined,
        startedByUserName: row.started_by_user_name || undefined,
        finishedAt: row.finished_at || undefined,
        finishedByUserId: row.finished_by_user_id || undefined,
        finishedByUserName: row.finished_by_user_name || undefined,
        deliveredAt: row.delivered_at || undefined,
        waitMinutes: Number(row.wait_minutes) || 0,
        prepMinutes: Number(row.prep_minutes) || 0,
        deliveryMinutes: Number(row.delivery_minutes) || 0,
        totalMinutes: Number(row.total_minutes) || 0,
        items: itemsByBatch.get(row.id) || [],
      }));
    } catch (err) {
      console.error('Exception en kitchenService.getBatches:', err);
      return [];
    }
  },

  /**
   * Crea o actualiza lotes de cocina desde una Comanda de Ventas POS
   * - Filtra únicamente productos de FABRICACIÓN (excluye Reventa)
   * - Si es un agregado posterior, genera un nuevo lote (batch_number = N)
   * - Si un ítem fue cancelado desde POS y ya estaba en preparación, lo marca con alerta
   */
  async syncOrderToKitchen(
    order: SaleOrder,
    catalog: SaleProduct[],
    currentUserId?: string,
    currentUserName?: string
  ): Promise<{ success: boolean; batchCreated?: boolean; message: string }> {
    try {
      if (!order.id) {
        return { success: false, message: 'La comanda no posee ID válido para cocina.' };
      }

      // 1. Filtrar solo ítems de Fabricación
      const kitchenItems = (order.items || []).filter((item) =>
        isManufacturingProduct(item.productId, item.productName, item.category, catalog)
      );

      // Si la comanda no tiene ningún producto de elaboración (ej: solo bebidas envasadas)
      if (kitchenItems.length === 0) {
        return {
          success: true,
          batchCreated: false,
          message: 'La comanda solo contiene productos de reventa. No requiere envío a cocina.',
        };
      }

      // 2. Obtener lotes previos existentes de esta comanda
      const existingBatches = await this.getBatches({ activeOnly: false, orderId: order.id });

      // Calcular qué ítems ya fueron enviados en lotes anteriores
      const previouslySentItemKeys = new Map<string, number>();
      existingBatches.forEach((batch) => {
        batch.items.forEach((it) => {
          if (it.itemStatus !== 'Cancelado') {
            const key = getNormalizedItemKey(it.productName, it.lineComment, it.selectedOptions);
            const currentQty = previouslySentItemKeys.get(key) || 0;
            previouslySentItemKeys.set(key, currentQty + it.quantity);
          }
        });
      });

      // 3. Determinar si hay ítems NUEVOS o incrementales
      const newItemsToSend: SaleOrderItem[] = [];
      const currentItemKeys = new Map<string, number>();

      kitchenItems.forEach((item) => {
        const key = getNormalizedItemKey(item.productName, item.lineComment, item.selectedOptions);
        const previousQty = previouslySentItemKeys.get(key) || 0;
        const seenInThisPass = currentItemKeys.get(key) || 0;

        if (seenInThisPass + item.quantity > previousQty) {
          const incrementalQty = seenInThisPass + item.quantity - previousQty;
          newItemsToSend.push({
            ...item,
            quantity: incrementalQty,
          });
          currentItemKeys.set(key, previousQty + incrementalQty);
        } else {
          currentItemKeys.set(key, seenInThisPass + item.quantity);
        }
      });

      // 4. Verificar cancelaciones desde POS de ítems que ya estaban enviados
      if (existingBatches.length > 0) {
        for (const batch of existingBatches) {
          if (batch.status === 'Pendiente' || batch.status === 'En preparación') {
            for (const bItem of batch.items) {
              if (bItem.itemStatus === 'Activo') {
                const stillExists = kitchenItems.some(
                  (ki) =>
                    (ki.id && ki.id === bItem.saleOrderItemId) ||
                    (ki.productName === bItem.productName && (ki.lineComment || '') === (bItem.lineComment || ''))
                );

                if (!stillExists) {
                  // El ítem fue retirado/cancelado en la comanda del POS
                  await supabase
                    .from('kitchen_batch_items')
                    .update({
                      item_status: 'Cancelado',
                      alert_message: '🚫 CANCELADO EN SALÓN — NO PREPARAR',
                    })
                    .eq('id', bItem.id);
                }
              }
            }
          }
        }
      }

      // 5. Si no hay ítems nuevos que cocinar, terminamos
      if (newItemsToSend.length === 0) {
        return {
          success: true,
          batchCreated: false,
          message: 'Los productos de fabricación ya se encuentran registrados en cocina.',
        };
      }

      // 6. Determinar número de lote (Lote 1 para inicial, Lote 2+ para agregados)
      const nextBatchNumber =
        existingBatches.length > 0
          ? Math.max(...existingBatches.map((b) => b.batchNumber || 1)) + 1
          : 1;

      const batchPayload: Record<string, any> = {
        order_id: order.id,
        order_number: order.orderNumber,
        batch_number: nextBatchNumber,
        status: 'Pendiente',
        sale_type_name: order.saleTypeName || 'Salón',
        table_name: order.tableName || null,
        client_name: order.clientName || 'Consumidor Final',
        general_notes: order.generalNotes || null,
        delivery_address: order.deliveryAddress || null,
        created_at: new Date().toISOString(),
      };

      const { data: insertedBatch, error: batchError } = await supabase
        .from('kitchen_batches')
        .insert(batchPayload)
        .select('*')
        .single();

      if (batchError || !insertedBatch) {
        console.error('Error al crear lote de cocina:', batchError);
        return { success: false, message: 'No se pudo crear el lote de cocina en Supabase.' };
      }

      // 7. Insertar ítems del lote
      const itemsPayload = newItemsToSend.map((item) => ({
        batch_id: insertedBatch.id,
        sale_order_item_id: item.id || null,
        product_id: item.productId || null,
        product_name: item.productName,
        category: item.category || 'Cocina',
        quantity: item.quantity,
        selected_options: item.selectedOptions || [],
        line_comment: item.lineComment || null,
        item_status: 'Activo',
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('kitchen_batch_items')
        .insert(itemsPayload);

      if (itemsError) {
        console.error('Error al insertar ítems de lote en cocina:', itemsError);
      }

      // 8. Actualizar trazabilidad de cocina en la comanda madre
      await supabase
        .from('sale_orders')
        .update({
          kitchen_status: 'Pendiente',
          t2_comanda_at: order.t2ComandaAt || new Date().toISOString(),
        })
        .eq('id', order.id);

      return {
        success: true,
        batchCreated: true,
        message:
          nextBatchNumber === 1
            ? `Comanda #${order.orderNumber} enviada a Cocina.`
            : `Agregado (Lote #${nextBatchNumber}) enviado a Cocina para Comanda #${order.orderNumber}.`,
      };
    } catch (err) {
      console.error('Exception en syncOrderToKitchen:', err);
      return { success: false, message: 'Error inesperado al sincronizar comanda con cocina.' };
    }
  },

  /**
   * Inicia la preparación de un lote de cocina
   * Cambia estado a 'En preparación', guarda timestamp de inicio, usuario y calcula wait_minutes
   */
  async startBatch(
    batchId: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();
      const nowIso = now.toISOString();

      // Obtener el lote para calcular el tiempo de espera
      const { data: batch, error: getError } = await supabase
        .from('kitchen_batches')
        .select('id, order_id, order_number, status, created_at')
        .eq('id', batchId)
        .single();

      if (getError || !batch) {
        return { success: false, message: 'Lote de cocina no encontrado.' };
      }

      if (batch.status === 'En preparación') {
        return { success: false, message: 'Este pedido ya se encuentra en preparación.' };
      }

      // Tiempo de espera en minutos
      const createdDate = new Date(batch.created_at);
      const waitMinutes = Math.max(0, Math.round((now.getTime() - createdDate.getTime()) / 60000));

      const payload = {
        status: 'En preparación',
        started_at: nowIso,
        started_by_user_id: userId && /^[0-9a-f-]{36}$/i.test(userId) ? userId : null,
        started_by_user_name: userName || 'Cocina',
        wait_minutes: waitMinutes,
      };

      const { error: updateError } = await supabase
        .from('kitchen_batches')
        .update(payload)
        .eq('id', batchId);

      if (updateError) {
        console.error('Error al iniciar preparación en cocina:', updateError);
        return { success: false, message: 'Error al actualizar estado en Supabase.' };
      }

      // Sincronizar estado en Comandas POS
      if (batch.order_id) {
        await supabase
          .from('sale_orders')
          .update({
            kitchen_status: 'En preparación',
            t_kitchen_start: nowIso,
          })
          .eq('id', batch.order_id);
      }

      return {
        success: true,
        message: `Preparación iniciada para Comanda #${batch.order_number}.`,
      };
    } catch (err) {
      console.error('Exception en startBatch:', err);
      return { success: false, message: 'Error inesperado al iniciar preparación.' };
    }
  },

  /**
   * Inicia en lote múltiples comandas seleccionadas vía checkbox
   */
  async startMultipleBatches(
    batchIds: string[],
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; startedCount: number; message: string }> {
    try {
      let startedCount = 0;
      for (const id of batchIds) {
        const res = await this.startBatch(id, userId, userName);
        if (res.success) startedCount++;
      }
      return {
        success: true,
        startedCount,
        message: `Se inició la preparación de ${startedCount} comanda(s).`,
      };
    } catch (err) {
      console.error('Exception en startMultipleBatches:', err);
      return { success: false, startedCount: 0, message: 'Error al iniciar comandas múltiples.' };
    }
  },

  /**
   * Marca como 'Listo' un lote finalizado en cocina
   * Guarda timestamp de fin, usuario, calcula prep_minutes y sincroniza con Comandas POS
   */
  async finishBatch(
    batchId: string,
    userId?: string,
    userName?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();
      const nowIso = now.toISOString();

      const { data: batch, error: getError } = await supabase
        .from('kitchen_batches')
        .select('id, order_id, order_number, status, created_at, started_at')
        .eq('id', batchId)
        .single();

      if (getError || !batch) {
        return { success: false, message: 'Lote de cocina no encontrado.' };
      }

      // Regla de negocio: preferentemente debe haber pasado por 'En preparación'
      const startedAt = batch.started_at ? new Date(batch.started_at) : new Date(batch.created_at);
      const prepMinutes = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 60000));

      const payload = {
        status: 'Listo',
        finished_at: nowIso,
        finished_by_user_id: userId && /^[0-9a-f-]{36}$/i.test(userId) ? userId : null,
        finished_by_user_name: userName || 'Cocina',
        prep_minutes: prepMinutes,
      };

      const { error: updateError } = await supabase
        .from('kitchen_batches')
        .update(payload)
        .eq('id', batchId);

      if (updateError) {
        console.error('Error al finalizar lote en cocina:', updateError);
        return { success: false, message: 'Error al actualizar lote en Supabase.' };
      }

      // Sincronizar con Comandas POS para que pase a 'Listo' (azul)
      if (batch.order_id) {
        await supabase
          .from('sale_orders')
          .update({
            status: 'Listo',
            kitchen_status: 'Listo',
            t3_kitchen_output_at: nowIso,
            t_kitchen_end: nowIso,
          })
          .eq('id', batch.order_id);
      }

      return {
        success: true,
        message: `Comanda #${batch.order_number} finalizada y marcada como Lista 🔵.`,
      };
    } catch (err) {
      console.error('Exception en finishBatch:', err);
      return { success: false, message: 'Error inesperado al finalizar comanda.' };
    }
  },

  /**
   * Elimina un lote de cocina (útil para pruebas o descarte de lotes)
   */
  async deleteBatch(batchId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('kitchen_batches').delete().eq('id', batchId);
      if (error) {
        console.error('Error al eliminar lote en cocina:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception en deleteBatch:', err);
      return false;
    }
  },

  /**
   * Suscribe en tiempo real a cambios en lotes e ítems de cocina mediante Supabase Realtime
   */
  subscribeToChanges(onUpdate: () => void): () => void {
    try {
      const channel = supabase
        .channel('kds_realtime_channel_' + Math.random().toString(36).substring(7))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kitchen_batches' },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kitchen_batch_items' },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sale_orders' },
          () => onUpdate()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Advertencia al suscribir canal Realtime de cocina:', err);
      return () => {};
    }
  },

  /**
   * Genera el Resumen Consolidado de Producción sumando cantidades por producto
   * pero aislando estrictamente por variantes (selectedOptions) y observaciones de línea
   */
  getConsolidatedProduction(batches: KitchenBatch[]): ConsolidatedProductionItem[] {
    const map = new Map<string, ConsolidatedProductionItem>();

    batches.forEach((batch) => {
      // Solo considerar lotes pendientes o en preparación
      if (batch.status !== 'Pendiente' && batch.status !== 'En preparación') return;

      batch.items.forEach((item) => {
        // Excluir ítems cancelados
        if (item.itemStatus === 'Cancelado') return;

        // Normalizar opciones para ordenar y construir clave única
        const sortedOptions = (item.selectedOptions || [])
          .map((o) => `${o.groupName || ''}:${o.optionName || ''}`)
          .sort()
          .join('|');

        const normComment = (item.lineComment || '').trim().toUpperCase();

        // Clave única discriminando producto + variantes + observación
        const uniqueKey = `${item.productName.trim().toUpperCase()}___OPT[${sortedOptions}]___OBS[${normComment}]`;

        if (!map.has(uniqueKey)) {
          map.set(uniqueKey, {
            key: uniqueKey,
            productName: item.productName,
            totalQuantity: item.quantity,
            selectedOptions: item.selectedOptions,
            lineComment: item.lineComment,
            orderNumbers: [batch.orderNumber],
            batchIds: [batch.id],
          });
        } else {
          const existing = map.get(uniqueKey)!;
          existing.totalQuantity += item.quantity;
          if (!existing.orderNumbers.includes(batch.orderNumber)) {
            existing.orderNumbers.push(batch.orderNumber);
          }
          if (!existing.batchIds.includes(batch.id)) {
            existing.batchIds.push(batch.id);
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  },
};
