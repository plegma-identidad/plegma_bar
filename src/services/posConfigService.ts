import { supabase } from '../lib/supabase';
import { SiteConfig, RestaurantTableConfig, SaleTypeConfig } from '../types';

export const posConfigService = {
  // ----------------------------------------------------
  // 1. SITIOS / SECTORES (site_configs)
  // ----------------------------------------------------
  async getSites(): Promise<SiteConfig[]> {
    try {
      const { data, error } = await supabase
        .from('site_configs')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error al obtener sectores desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        active: row.active ?? true,
        order: row.sort_order ?? 1,
      }));
    } catch (err) {
      console.error('Exception al obtener sectores:', err);
      return [];
    }
  },

  async createSite(site: Omit<SiteConfig, 'id'>): Promise<SiteConfig | null> {
    try {
      const payload = {
        name: site.name,
        description: site.description || null,
        active: site.active ?? true,
        sort_order: site.order ?? 1,
      };

      const { data, error } = await supabase
        .from('site_configs')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al crear sector en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        active: data.active ?? true,
        order: data.sort_order ?? 1,
      };
    } catch (err) {
      console.error('Exception al crear sector:', err);
      return null;
    }
  },

  async updateSite(id: string, site: Partial<SiteConfig>): Promise<SiteConfig | null> {
    try {
      const payload: Record<string, any> = {};
      if (site.name !== undefined) payload.name = site.name;
      if (site.description !== undefined) payload.description = site.description;
      if (site.active !== undefined) payload.active = site.active;
      if (site.order !== undefined) payload.sort_order = site.order;

      const { data, error } = await supabase
        .from('site_configs')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error al actualizar sector en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        active: data.active ?? true,
        order: data.sort_order ?? 1,
      };
    } catch (err) {
      console.error('Exception al actualizar sector:', err);
      return null;
    }
  },

  async deleteSite(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('site_configs').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar sector en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar sector:', err);
      return false;
    }
  },

  // ----------------------------------------------------
  // 2. MESAS FÍSICAS (restaurant_tables)
  // ----------------------------------------------------
  async getTables(): Promise<RestaurantTableConfig[]> {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        console.error('Error al obtener mesas desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        number: row.number,
        capacity: row.capacity,
        siteId: row.site_id || '',
        siteName: row.site_name || '',
        name: row.name || `Mesa ${row.number}`,
        isFree: row.is_free ?? true,
        active: row.active ?? true,
      }));
    } catch (err) {
      console.error('Exception al obtener mesas:', err);
      return [];
    }
  },

  async createTable(table: Omit<RestaurantTableConfig, 'id'>): Promise<RestaurantTableConfig | null> {
    try {
      const payload = {
        number: table.number,
        capacity: table.capacity,
        site_id: table.siteId || null,
        site_name: table.siteName || null,
        name: table.name || `Mesa ${table.number}`,
        is_free: table.isFree ?? true,
        active: table.active ?? true,
      };

      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al crear mesa en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        number: data.number,
        capacity: data.capacity,
        siteId: data.site_id || '',
        siteName: data.site_name || '',
        name: data.name || `Mesa ${data.number}`,
        isFree: data.is_free ?? true,
        active: data.active ?? true,
      };
    } catch (err) {
      console.error('Exception al crear mesa:', err);
      return null;
    }
  },

  async updateTable(id: string, table: Partial<RestaurantTableConfig>): Promise<RestaurantTableConfig | null> {
    try {
      const payload: Record<string, any> = {};
      if (table.number !== undefined) payload.number = table.number;
      if (table.capacity !== undefined) payload.capacity = table.capacity;
      if (table.siteId !== undefined) payload.site_id = table.siteId;
      if (table.siteName !== undefined) payload.site_name = table.siteName;
      if (table.name !== undefined) payload.name = table.name;
      if (table.isFree !== undefined) payload.is_free = table.isFree;
      if (table.active !== undefined) payload.active = table.active;

      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error al actualizar mesa en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        number: data.number,
        capacity: data.capacity,
        siteId: data.site_id || '',
        siteName: data.site_name || '',
        name: data.name || `Mesa ${data.number}`,
        isFree: data.is_free ?? true,
        active: data.active ?? true,
      };
    } catch (err) {
      console.error('Exception al actualizar mesa:', err);
      return null;
    }
  },

  async deleteTable(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar mesa en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar mesa:', err);
      return false;
    }
  },

  // ----------------------------------------------------
  // 3. CANALES / TIPOS DE VENTA (sale_type_configs)
  // ----------------------------------------------------
  async getSaleTypes(): Promise<SaleTypeConfig[]> {
    try {
      const { data, error } = await supabase
        .from('sale_type_configs')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener tipos de venta desde Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        isSalonSale: row.is_salon_sale ?? true,
        requiresTable: row.requires_table ?? false,
        requiresClient: row.requires_client ?? false,
        initialOrderStatus: row.initial_order_status || 'Pendiente',
        finalOrderStatus: row.final_order_status || 'Facturado',
        autoPrintTicket: row.auto_print_ticket ?? true,
        kitchenPrinter: row.kitchen_printer || '',
        active: row.active ?? true,
      }));
    } catch (err) {
      console.error('Exception al obtener tipos de venta:', err);
      return [];
    }
  },

  async createSaleType(saleType: Omit<SaleTypeConfig, 'id'>): Promise<SaleTypeConfig | null> {
    try {
      const payload = {
        name: saleType.name,
        is_salon_sale: saleType.isSalonSale ?? true,
        requires_table: saleType.requiresTable ?? false,
        requires_client: saleType.requiresClient ?? false,
        initial_order_status: saleType.initialOrderStatus || 'Pendiente',
        final_order_status: saleType.finalOrderStatus || 'Facturado',
        auto_print_ticket: saleType.autoPrintTicket ?? true,
        kitchen_printer: saleType.kitchenPrinter || null,
        active: saleType.active ?? true,
      };

      const { data, error } = await supabase
        .from('sale_type_configs')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al crear tipo de venta en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isSalonSale: data.is_salon_sale ?? true,
        requiresTable: data.requires_table ?? false,
        requiresClient: data.requires_client ?? false,
        initialOrderStatus: data.initial_order_status || 'Pendiente',
        finalOrderStatus: data.final_order_status || 'Facturado',
        autoPrintTicket: data.auto_print_ticket ?? true,
        kitchenPrinter: data.kitchen_printer || '',
        active: data.active ?? true,
      };
    } catch (err) {
      console.error('Exception al crear tipo de venta:', err);
      return null;
    }
  },

  async updateSaleType(id: string, saleType: Partial<SaleTypeConfig>): Promise<SaleTypeConfig | null> {
    try {
      const payload: Record<string, any> = {};
      if (saleType.name !== undefined) payload.name = saleType.name;
      if (saleType.isSalonSale !== undefined) payload.is_salon_sale = saleType.isSalonSale;
      if (saleType.requiresTable !== undefined) payload.requires_table = saleType.requiresTable;
      if (saleType.requiresClient !== undefined) payload.requires_client = saleType.requiresClient;
      if (saleType.initialOrderStatus !== undefined) payload.initial_order_status = saleType.initialOrderStatus;
      if (saleType.finalOrderStatus !== undefined) payload.final_order_status = saleType.finalOrderStatus;
      if (saleType.autoPrintTicket !== undefined) payload.auto_print_ticket = saleType.autoPrintTicket;
      if (saleType.kitchenPrinter !== undefined) payload.kitchen_printer = saleType.kitchenPrinter;
      if (saleType.active !== undefined) payload.active = saleType.active;

      const { data, error } = await supabase
        .from('sale_type_configs')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error al actualizar tipo de venta en Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        isSalonSale: data.is_salon_sale ?? true,
        requiresTable: data.requires_table ?? false,
        requiresClient: data.requires_client ?? false,
        initialOrderStatus: data.initial_order_status || 'Pendiente',
        finalOrderStatus: data.final_order_status || 'Facturado',
        autoPrintTicket: data.auto_print_ticket ?? true,
        kitchenPrinter: data.kitchen_printer || '',
        active: data.active ?? true,
      };
    } catch (err) {
      console.error('Exception al actualizar tipo de venta:', err);
      return null;
    }
  },

  async deleteSaleType(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sale_type_configs').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar tipo de venta en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception al eliminar tipo de venta:', err);
      return false;
    }
  },
};
