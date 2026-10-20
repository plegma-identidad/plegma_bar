import { supabase } from '../lib/supabase';
import { Combo, ComboSection, ComboSectionItem } from '../types';
import { storageService } from './storageService';

// Mock inicial basado en el ejemplo oficial de la infografía del Maestro de Combos
const MOCK_COMBOS: Combo[] = [
  {
    id: 'combo-merienda-clasico',
    code: 'CMB-001',
    name: 'Combo Merienda Clásico',
    category: 'Combos',
    subcategory: 'Meriendas',
    sellingPrice: 7500,
    costPrice: 2850,
    profitMargin: 62.0,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=800',
    description: 'Café a elección + 2 acompañamientos + dip + opción de adicionales.',
    active: true,
    sections: [
      {
        id: 'sec-cafe',
        name: 'Tipo de café',
        sortOrder: 1,
        required: true,
        minQuantity: 1,
        maxQuantity: 1,
        allowRepeat: false,
        componentTypeAllowed: 'PRODUCTOS_VENTA',
        items: [
          {
            id: 'item-cortado',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-cortado',
            componentName: 'Cortado',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 650,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-americano',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-americano',
            componentName: 'Americano',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 600,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-lagrima',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-lagrima',
            componentName: 'Lágrima',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 650,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-capuchino',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-capuchino',
            componentName: 'Capuchino',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 850,
            extraPrice: 300,
            available: true,
          },
        ],
      },
      {
        id: 'sec-acomp',
        name: 'Acompañamiento',
        sortOrder: 2,
        required: true,
        minQuantity: 2,
        maxQuantity: 2,
        allowRepeat: true,
        componentTypeAllowed: 'PRODUCTOS_VENTA',
        items: [
          {
            id: 'item-medialuna',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-medialuna',
            componentName: 'Medialuna',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 450,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-criollo',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-criollo',
            componentName: 'Criollo',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 400,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-tostada',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-tostada',
            componentName: 'Tostada de Pan de Campo',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 550,
            extraPrice: 200,
            available: true,
          },
          {
            id: 'item-chipa',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-chipa',
            componentName: 'Chipá Casero',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 600,
            extraPrice: 200,
            available: true,
          },
        ],
      },
      {
        id: 'sec-dips',
        name: 'Dips',
        sortOrder: 3,
        required: true,
        minQuantity: 1,
        maxQuantity: 1,
        allowRepeat: false,
        componentTypeAllowed: 'INSUMOS_PRODUCCIONES',
        items: [
          {
            id: 'item-mermelada',
            componentType: 'INSUMO',
            componentId: 'ins-mermelada',
            componentName: 'Mermelada de Frutos Rojos',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 250,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-ddl',
            componentType: 'INSUMO',
            componentId: 'ins-ddl',
            componentName: 'Dulce de Leche Colonial',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 300,
            extraPrice: 0,
            available: true,
          },
          {
            id: 'item-queso',
            componentType: 'INSUMO',
            componentId: 'ins-queso',
            componentName: 'Queso Crema Finas Hierbas',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 350,
            extraPrice: 0,
            available: true,
          },
        ],
      },
      {
        id: 'sec-adicionales',
        name: 'Adicionales',
        sortOrder: 4,
        required: false,
        minQuantity: 0,
        maxQuantity: 5,
        allowRepeat: true,
        componentTypeAllowed: 'ALL',
        items: [
          {
            id: 'item-extra-medialuna',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-extra-medialuna',
            componentName: 'Medialuna Extra',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 450,
            extraPrice: 800,
            available: true,
          },
          {
            id: 'item-extra-cafe',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-extra-cafe',
            componentName: 'Café Doble Shot',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 400,
            extraPrice: 600,
            available: true,
          },
          {
            id: 'item-extra-jugo',
            componentType: 'PRODUCTO_VENTA',
            componentId: 'prod-extra-jugo',
            componentName: 'Jugo de Naranja Exprimido',
            defaultQuantity: 1,
            unit: 'u',
            unitCost: 700,
            extraPrice: 1200,
            available: true,
          },
        ],
      },
    ],
  },
];

export const combosService = {
  /**
   * Obtiene todos los combos con sus secciones y componentes anidados
   */
  async getAll(): Promise<Combo[]> {
    try {
      const { data: combosData, error: comboErr } = await supabase
        .from('combos')
        .select('*')
        .order('name', { ascending: true });

      if (comboErr) {
        console.warn('Advertencia al consultar combos de Supabase:', comboErr.message);
      }

      if (combosData && combosData.length > 0) {
        // Consultar secciones
        const { data: sectionsData, error: secErr } = await supabase
          .from('combo_sections')
          .select('*')
          .order('sort_order', { ascending: true });

        if (secErr) {
          console.warn('Advertencia al consultar combo_sections:', secErr.message);
        }

        // Consultar items de sección
        const { data: itemsData, error: itemsErr } = await supabase
          .from('combo_section_items')
          .select('*')
          .order('sort_order', { ascending: true });

        if (itemsErr) {
          console.warn('Advertencia al consultar combo_section_items:', itemsErr.message);
        }

        // Agrupar items por sección
        const itemsBySection = new Map<string, ComboSectionItem[]>();
        (itemsData || []).forEach((row: any) => {
          const it: ComboSectionItem = {
            id: row.id,
            sectionId: row.section_id,
            comboId: row.combo_id,
            componentType: row.component_type,
            componentId: row.component_id,
            componentName: row.component_name,
            defaultQuantity: Number(row.default_quantity) || 1,
            unit: row.unit || 'u',
            unitCost: Number(row.unit_cost) || 0,
            extraPrice: Number(row.extra_price) || 0,
            available: row.available ?? true,
            sortOrder: Number(row.sort_order) || 1,
          };
          const list = itemsBySection.get(row.section_id) || [];
          list.push(it);
          itemsBySection.set(row.section_id, list);
        });

        // Agrupar secciones por combo
        const sectionsByCombo = new Map<string, ComboSection[]>();
        (sectionsData || []).forEach((row: any) => {
          const sec: ComboSection = {
            id: row.id,
            comboId: row.combo_id,
            name: row.name,
            sortOrder: Number(row.sort_order) || 1,
            required: row.required ?? true,
            minQuantity: Number(row.min_quantity) || 1,
            maxQuantity: Number(row.max_quantity) || 1,
            allowRepeat: row.allow_repeat ?? false,
            componentTypeAllowed: row.component_type_allowed || 'ALL',
            items: itemsBySection.get(row.id) || [],
          };
          const list = sectionsByCombo.get(row.combo_id) || [];
          list.push(sec);
          sectionsByCombo.set(row.combo_id, list);
        });

        return combosData.map((row: any) => {
          const cost = Number(row.cost_price ?? 0);
          const price = Number(row.selling_price ?? 0);
          const margin = Number(row.profit_margin ?? (price > 0 ? ((price - cost) / price) * 100 : 0));

          return {
            id: row.id,
            code: row.code,
            name: row.name,
            category: row.category || 'Combos',
            subcategory: row.subcategory || 'General',
            sellingPrice: price,
            costPrice: cost,
            profitMargin: margin,
            imageUrl: row.image_url || undefined,
            imageName: row.image_name || undefined,
            description: row.description || '',
            active: row.active ?? true,
            sections: sectionsByCombo.get(row.id) || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });
      }

      // Si no hay combos registrados en Supabase, retornamos array vacío para comenzar desde cero
      return [];
    } catch (err) {
      console.error('Error inesperado en combosService.getAll:', err);
      return [];
    }
  },

  /**
   * Guarda o actualiza un combo completo con sus secciones y componentes
   */
  async save(combo: Partial<Combo>): Promise<Combo | null> {
    try {
      const isUuid = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const isNew = !combo.id || !isUuid(combo.id) || combo.id.startsWith('combo-') || combo.id.startsWith('temp-');

      const price = Number(combo.sellingPrice ?? 0);
      const cost = Number(combo.costPrice ?? 0);
      const margin = Number(combo.profitMargin ?? (price > 0 ? ((price - cost) / price) * 100 : 0));

      const comboPayload: any = {
        code: combo.code?.trim(),
        name: combo.name?.trim(),
        category: combo.category?.trim() || 'Combos',
        subcategory: combo.subcategory?.trim() || 'General',
        selling_price: price,
        cost_price: cost,
        profit_margin: margin,
        image_url: combo.imageUrl?.trim() || null,
        image_name: combo.imageName?.trim() || null,
        description: combo.description?.trim() || null,
        active: combo.active ?? true,
        updated_at: new Date().toISOString(),
      };

      let savedComboRow: any = null;

      if (isNew) {
        // Verificar si ya existe un combo con este código (por si quedó un registro previo)
        const { data: existingByCode } = await supabase
          .from('combos')
          .select('id')
          .eq('code', comboPayload.code)
          .maybeSingle();

        if (existingByCode?.id) {
          const { data, error } = await supabase
            .from('combos')
            .update(comboPayload)
            .eq('id', existingByCode.id)
            .select('*')
            .single();

          if (error) {
            console.error('Error al actualizar combo existente por código en Supabase:', error);
            throw new Error(`Error en Supabase: ${error.message}`);
          }
          savedComboRow = data;
        } else {
          const { data, error } = await supabase
            .from('combos')
            .insert(comboPayload)
            .select('*')
            .single();

          if (error) {
            console.error('Error al insertar combo en Supabase:', error);
            throw new Error(`Error en Supabase: ${error.message}`);
          }
          savedComboRow = data;
        }
      } else {
        const { data, error } = await supabase
          .from('combos')
          .update(comboPayload)
          .eq('id', combo.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar combo en Supabase:', error);
          throw new Error(`Error en Supabase: ${error.message}`);
        }
        savedComboRow = data;
      }

      const comboId = savedComboRow.id;

      // Sincronizar secciones y sus items si vienen provistos
      if (combo.sections && Array.isArray(combo.sections)) {
        // Borramos las secciones anteriores del combo (en cascada elimina combo_section_items)
        await supabase.from('combo_sections').delete().eq('combo_id', comboId);

        // Helpers para mapear a las restricciones CHECK de Postgres en Supabase
        const toDbComponentType = (type?: string): 'PRODUCTO_VENTA' | 'PRODUCCION' | 'INSUMO' => {
          const t = String(type || '').toUpperCase();
          if (t.includes('SALE') || t.includes('VENTA') || t.includes('CARTA')) return 'PRODUCTO_VENTA';
          if (t.includes('PROD')) return 'PRODUCCION';
          return 'INSUMO';
        };

        const toDbAllowedType = (type?: string): 'ALL' | 'PRODUCTOS_VENTA' | 'INSUMOS_PRODUCCIONES' => {
          const t = String(type || '').toUpperCase();
          if (t.includes('VENTA') || t.includes('SALE') || t.includes('CARTA')) return 'PRODUCTOS_VENTA';
          if (t.includes('INS') || t.includes('PROD')) return 'INSUMOS_PRODUCCIONES';
          return 'ALL';
        };

        for (let sIdx = 0; sIdx < combo.sections.length; sIdx++) {
          const sec = combo.sections[sIdx];
          const secPayload = {
            combo_id: comboId,
            name: sec.name.trim(),
            sort_order: sec.sortOrder ?? sec.orderIndex ?? sIdx + 1,
            required: sec.required ?? true,
            min_quantity: Number(sec.minQuantity) || 1,
            max_quantity: Number(sec.maxQuantity) || 1,
            allow_repeat: sec.allowRepeat ?? false,
            component_type_allowed: toDbAllowedType(sec.componentTypeAllowed),
          };

          const { data: savedSec, error: secErr } = await supabase
            .from('combo_sections')
            .insert(secPayload)
            .select('*')
            .single();

          if (secErr || !savedSec) {
            console.error('Error al guardar sección del combo:', secErr);
            continue;
          }

          // Insertar items de la sección
          if (sec.items && sec.items.length > 0) {
            const itemsPayload = sec.items.map((it, itIdx) => ({
              section_id: savedSec.id,
              combo_id: comboId,
              component_type: toDbComponentType(it.componentType),
              component_id: it.componentId,
              component_name: it.componentName,
              default_quantity: Number(it.defaultQuantity ?? it.quantity) || 1,
              unit: it.unit || 'u',
              unit_cost: Number(it.unitCost) || 0,
              extra_price: Number(it.extraPrice) || 0,
              available: it.available !== undefined ? it.available : (it.isAvailable !== undefined ? it.isAvailable : true),
              sort_order: it.sortOrder ?? itIdx + 1,
            }));

            const { error: itemsErr } = await supabase
              .from('combo_section_items')
              .insert(itemsPayload);

            if (itemsErr) {
              console.error('Error al guardar items de la sección:', itemsErr);
            }
          }
        }
      }

      return {
        id: comboId,
        code: savedComboRow.code,
        name: savedComboRow.name,
        category: savedComboRow.category,
        subcategory: savedComboRow.subcategory,
        sellingPrice: Number(savedComboRow.selling_price) || 0,
        costPrice: Number(savedComboRow.cost_price) || 0,
        profitMargin: Number(savedComboRow.profit_margin) || 0,
        imageUrl: savedComboRow.image_url,
        imageName: savedComboRow.image_name,
        description: savedComboRow.description,
        active: savedComboRow.active,
        sections: combo.sections || [],
        createdAt: savedComboRow.created_at,
        updatedAt: savedComboRow.updated_at,
      };
    } catch (err: any) {
      console.error('Error en combosService.save:', err);
      throw err;
    }
  },

  /**
   * Elimina un combo y sus archivos físicos en Storage
   */
  async delete(id: string, code?: string): Promise<boolean> {
    try {
      // 1. Eliminar carpeta física en Storage
      if (code) {
        await storageService.deleteComboFolder(code);
      } else {
        const { data: combo } = await supabase
          .from('combos')
          .select('code, image_url')
          .eq('id', id)
          .single();

        if (combo?.code) {
          await storageService.deleteComboFolder(combo.code);
        } else if (combo?.image_url) {
          await storageService.deleteComboMedia(combo.image_url);
        }
      }

      // 2. Eliminar en Supabase (en cascada elimina combo_sections y combo_section_items)
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar combo en Supabase:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error en combosService.delete:', err);
      return false;
    }
  },

  /**
   * Activa o pausa un combo
   */
  async toggleActive(id: string, currentActive: boolean): Promise<boolean> {
    try {
      const nextActive = !currentActive;
      const { error } = await supabase
        .from('combos')
        .update({ active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error al alternar estado de combo:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error en combosService.toggleActive:', err);
      return false;
    }
  },

  /**
   * Duplica un combo existente
   */
  async duplicate(originalCombo: Combo): Promise<Combo | null> {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const duplicated: Partial<Combo> = {
      ...originalCombo,
      id: undefined,
      code: `${originalCombo.code}-C${randomSuffix}`,
      name: `${originalCombo.name} (Copia)`,
      imageUrl: originalCombo.imageUrl,
      active: true,
      sections: (originalCombo.sections || []).map((sec, sIdx) => ({
        ...sec,
        id: `sec-dup-${Date.now()}-${sIdx}`,
        items: (sec.items || []).map((it, itIdx) => ({
          ...it,
          id: `item-dup-${Date.now()}-${itIdx}`,
        })),
      })),
    };

    return this.save(duplicated);
  },
};
