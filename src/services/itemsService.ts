import { supabase } from '../lib/supabase';
import { Item, ProviderItemRelation } from '../types';

export const itemsService = {
  /**
   * Obtiene todos los insumos desde Supabase ordenados por nombre.
   */
  async getAll(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener insumos de Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || '',
      category: row.category,
      subcategory: row.subcategory || '',
      brand: row.brand || '',
      storageUnit: row.storage_unit || 'un',
      purchaseUnit: row.purchase_unit || 'un',
      packQuantity: Number(row.pack_quantity) || 1,
      location: row.location || 'Depósito',
      currentStock: Number(row.current_stock) || 0,
      minStock: Number(row.min_stock) || 0,
      maxStock: Number(row.max_stock) || 0,
      currentPrice: Number(row.current_price) || 0,
      active: row.active ?? true,
    }));
  },

  /**
   * Guarda o actualiza un insumo en Supabase.
   */
  async save(item: Item): Promise<Item | null> {
    const isNew = !item.id || item.id.startsWith('item-') || item.id.startsWith('ins-');

    const dbPayload: any = {
      code: item.code,
      name: item.name,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      brand: item.brand,
      storage_unit: item.storageUnit,
      purchase_unit: item.purchaseUnit,
      pack_quantity: item.packQuantity,
      location: item.location,
      current_stock: item.currentStock,
      min_stock: item.minStock,
      max_stock: item.maxStock,
      current_price: item.currentPrice,
      active: item.active ?? true,
    };

    if (!isNew) {
      dbPayload.id = item.id;
    }

    const { data, error } = await supabase
      .from('items')
      .upsert(dbPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Error al guardar insumo en Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || '',
      category: data.category,
      subcategory: data.subcategory || '',
      brand: data.brand || '',
      storageUnit: data.storage_unit || 'un',
      purchaseUnit: data.purchase_unit || 'un',
      packQuantity: Number(data.pack_quantity) || 1,
      location: data.location || 'Depósito',
      currentStock: Number(data.current_stock) || 0,
      minStock: Number(data.min_stock) || 0,
      maxStock: Number(data.max_stock) || 0,
      currentPrice: Number(data.current_price) || 0,
      active: data.active ?? true,
    };
  },

  /**
   * Elimina un insumo de Supabase.
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error al eliminar insumo (${id}) de Supabase:`, error);
      return false;
    }

    return true;
  },

  /**
   * Obtiene todas las relaciones proveedor <-> insumo.
   */
  async getProviderRelations(): Promise<ProviderItemRelation[]> {
    const { data, error } = await supabase
      .from('provider_items')
      .select('*');

    if (error) {
      console.error('Error al obtener relaciones proveedor-insumo de Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      providerId: row.provider_id,
      itemId: row.item_id,
      supplierProductCode: row.supplier_product_code || '',
      purchaseUnit: row.purchase_unit || '',
      packQuantity: Number(row.pack_quantity) || 1,
      minStock: Number(row.min_stock) || 0,
      maxStock: Number(row.max_stock) || 0,
      lastPurchasePrice: Number(row.last_purchase_price) || 0,
      lastPurchaseDate: row.last_purchase_date || undefined,
      isPrimarySupplier: row.is_primary_supplier ?? false,
      active: row.active ?? true,
    }));
  },

  /**
   * Guarda o actualiza una relación proveedor-insumo.
   */
  async saveProviderRelation(rel: Partial<ProviderItemRelation>): Promise<ProviderItemRelation | null> {
    const dbPayload: any = {
      provider_id: rel.providerId,
      item_id: rel.itemId,
      supplier_product_code: rel.supplierProductCode,
      purchase_unit: rel.purchaseUnit,
      pack_quantity: rel.packQuantity,
      min_stock: rel.minStock,
      max_stock: rel.maxStock,
      last_purchase_price: rel.lastPurchasePrice,
      is_primary_supplier: rel.isPrimarySupplier ?? false,
      active: rel.active ?? true,
    };

    if (rel.id && !rel.id.startsWith('pir-')) {
      dbPayload.id = rel.id;
    }

    const { data, error } = await supabase
      .from('provider_items')
      .upsert(dbPayload, { onConflict: 'provider_id,item_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Error al guardar relacion proveedor-insumo en Supabase:', error);
      return null;
    }

    return {
      id: data.id,
      providerId: data.provider_id,
      itemId: data.item_id,
      supplierProductCode: data.supplier_product_code || '',
      purchaseUnit: data.purchase_unit || '',
      packQuantity: Number(data.pack_quantity) || 1,
      minStock: Number(data.min_stock) || 0,
      maxStock: Number(data.max_stock) || 0,
      lastPurchasePrice: Number(data.last_purchase_price) || 0,
      lastPurchaseDate: data.last_purchase_date || undefined,
      isPrimarySupplier: data.is_primary_supplier ?? false,
      active: data.active ?? true,
    };
  }
};
