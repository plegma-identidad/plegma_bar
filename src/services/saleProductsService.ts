import { supabase } from '../lib/supabase';
import { SaleProduct, RecipeComponent, ProductionProduct } from '../types';

export const saleProductsService = {
  /**
   * Obtiene todos los productos de venta (Carta) junto con sus componentes de receta
   */
  async getAll(): Promise<SaleProduct[]> {
    try {
      const { data: productsData, error: prodError } = await supabase
        .from('sale_products')
        .select('*')
        .order('name', { ascending: true });

      if (prodError) {
        console.warn('Error al obtener productos de venta de Supabase:', prodError.message);
        return [];
      }

      if (!productsData || productsData.length === 0) {
        return [];
      }

      // Obtener todas las recetas de una sola vez
      const { data: recipesData, error: recError } = await supabase
        .from('sale_product_recipes')
        .select('*');

      if (recError) {
        console.warn('Error al obtener recetas de Supabase:', recError.message);
      }

      const recipesByProduct = new Map<string, RecipeComponent[]>();
      (recipesData || []).forEach((row: any) => {
        const component: RecipeComponent = {
          id: row.id,
          saleProductId: row.sale_product_id,
          componentType: row.component_type,
          componentId: row.component_id,
          componentName: row.component_name,
          quantity: Number(row.quantity) || 1,
          unit: row.unit || 'u',
          unitCost: Number(row.unit_cost) || 0,
          subtotal: Number(row.subtotal) || 0,
        };
        const list = recipesByProduct.get(row.sale_product_id) || [];
        list.push(component);
        recipesByProduct.set(row.sale_product_id, list);
      });

      return productsData.map((row: any) => {
        const isFab = String(row.product_type || '').toLowerCase().includes('fab');
        const productRecipes = recipesByProduct.get(row.id) || [];
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          productType: (isFab ? 'FABRICACION' : 'REVENTA') as any,
          category: row.category,
          subcategory: row.subcategory,
          sellingPrice: Number(row.selling_price) || 0,
          costPrice: Number(row.cost_price) || 0,
          profitMargin: Number(row.profit_margin) || 0,
          linkedItemId: row.linked_item_id || undefined,
          imageUrl: row.image_url || undefined,
          recipeFileUrl: row.recipe_file_url || undefined,
          recipeFileName: row.recipe_file_name || undefined,
          videoUrl: row.video_url || undefined,
          active: row.active ?? true,
          recipe: productRecipes,
          recipeComponents: productRecipes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch (err) {
      console.error('Error inesperado en saleProductsService.getAll:', err);
      return [];
    }
  },

  /**
   * Obtiene todos los productos de producción (semielaborados para recetas)
   */
  async getProductionProducts(): Promise<ProductionProduct[]> {
    try {
      const { data, error } = await supabase
        .from('production_products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Error al obtener producciones de Supabase:', error.message);
      }

      if (data && data.length > 0) {
        return data.map((row: any) => {
          const cost = Number(row.unit_cost ?? row.cost_price ?? 0);
          return {
            id: row.id,
            code: row.code,
            name: row.name,
            category: row.category || 'Elaborados',
            unit: row.unit || 'u',
            costPrice: cost,
            unitCost: cost,
            description: row.notes || row.description || '',
            active: row.active ?? true,
            createdAt: row.created_at,
          };
        });
      }

      // Si aún no hay filas en Supabase, proveemos los semielaborados base con UUIDs válidos para testing
      return [
        {
          id: 'd1111111-1111-4111-8111-111111111111',
          code: 'PROD-001',
          name: 'Medallón de Carne 120g',
          category: 'Elaborados',
          unit: 'u',
          costPrice: 950,
          unitCost: 950,
          description: 'Medallón de carne picada blend 120g moldeado',
          active: true,
        },
        {
          id: 'd2222222-2222-4222-8222-222222222222',
          code: 'PROD-002',
          name: 'Salsa Barbacoa Casera',
          category: 'Salsas',
          unit: 'kg',
          costPrice: 1800,
          unitCost: 1800,
          description: 'Salsa barbacoa ahumada artesanal reducida',
          active: true,
        },
        {
          id: 'd3333333-3333-4333-8333-333333333333',
          code: 'PROD-003',
          name: 'Pan de Papa Artesanal',
          category: 'Panificados',
          unit: 'u',
          costPrice: 420,
          unitCost: 420,
          description: 'Pan brioche de papa glaseado con sésamo',
          active: true,
        },
      ];
    } catch (err) {
      console.error('Error en getProductionProducts:', err);
      return [];
    }
  },

  /**
   * Guarda o actualiza un producto de venta y sincroniza sus componentes de receta
   */
  async save(product: SaleProduct): Promise<SaleProduct | null> {
    try {
      const isUuid = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const isNew = !product.id || !isUuid(product.id) || product.id.startsWith('prod-sale-') || product.id.startsWith('temp-');

      // Normalizar product_type exactamente según el CHECK constraint de Supabase ('Fabricación' o 'Reventa')
      const normalizedType = String(product.productType || '').toLowerCase().includes('fab')
        ? 'Fabricación'
        : 'Reventa';

      const validLinkedItemId =
        normalizedType === 'Reventa' && product.linkedItemId && isUuid(product.linkedItemId)
          ? product.linkedItemId
          : null;

      const rawMargin = Number(product.profitMargin) || 0;
      const clampedMargin = Math.max(-999.99, Math.min(999.99, Number(rawMargin.toFixed(2))));

      const dbPayload: any = {
        code: product.code.trim(),
        name: product.name.trim(),
        product_type: normalizedType,
        category: product.category,
        subcategory: product.subcategory?.trim() || 'General',
        selling_price: Number(product.sellingPrice) || 0,
        cost_price: Number(product.costPrice) || 0,
        profit_margin: clampedMargin,
        linked_item_id: validLinkedItemId,
        image_url: product.imageUrl || null,
        recipe_file_url: product.recipeFileUrl || null,
        recipe_file_name: product.recipeFileName || null,
        video_url: product.videoUrl || null,
        active: product.active ?? true,
        updated_at: new Date().toISOString(),
      };

      if (!isNew) {
        dbPayload.id = product.id;
      }

      const { data: savedProd, error: saveErr } = await supabase
        .from('sale_products')
        .upsert(dbPayload)
        .select('*')
        .single();

      if (saveErr) {
        console.error('Error al guardar producto de venta en Supabase:', saveErr);
        return null;
      }

      const savedId = savedProd.id;

      // Sincronizar componentes de receta si es Fabricación
      let savedComponents: RecipeComponent[] = [];
      const componentsToSync = product.recipeComponents || product.recipe || [];

      if (normalizedType === 'Fabricación') {
        try {
          // 1. Eliminar componentes anteriores
          const { error: delErr } = await supabase
            .from('sale_product_recipes')
            .delete()
            .eq('sale_product_id', savedId);

          if (delErr) {
            console.warn('Advertencia al eliminar componentes previos de receta:', delErr.message);
          }
        } catch (delCatch) {
          console.warn('Error delete sale_product_recipes:', delCatch);
        }

        // 2. Insertar componentes nuevos si existen
        if (componentsToSync.length > 0) {
          const recipePayload = componentsToSync.map((comp) => {
            const compType = String(comp.componentType || '').toLowerCase().includes('prod')
              ? 'Producción'
              : 'Insumo';

            // Asegurar que component_id sea un UUID válido
            let validCompId = comp.componentId;
            if (!isUuid(validCompId)) {
              if (validCompId === 'prd-sem-01') validCompId = 'd1111111-1111-4111-8111-111111111111';
              else if (validCompId === 'prd-sem-02') validCompId = 'd2222222-2222-4222-8222-222222222222';
              else if (validCompId === 'prd-sem-03') validCompId = 'd3333333-3333-4333-8333-333333333333';
              else validCompId = '00000000-0000-0000-0000-000000000000';
            }

            return {
              sale_product_id: savedId,
              component_type: compType,
              component_id: validCompId,
              component_name: comp.componentName,
              quantity: Number(comp.quantity) || 1,
              unit: comp.unit || 'u',
              unit_cost: Number(comp.unitCost) || 0,
              subtotal: Number(comp.subtotal) || 0,
            };
          });

          const { data: insertedRecipes, error: recInsertErr } = await supabase
            .from('sale_product_recipes')
            .insert(recipePayload)
            .select('*');

          if (recInsertErr) {
            console.error('Error al guardar componentes de receta en Supabase:', recInsertErr);
            // Fallback: conservar componentes en memoria para que no se pierdan en la sesión
            savedComponents = componentsToSync;
          } else if (insertedRecipes && insertedRecipes.length > 0) {
            savedComponents = insertedRecipes.map((row: any) => ({
              id: row.id,
              saleProductId: row.sale_product_id,
              componentType: row.component_type,
              componentId: row.component_id,
              componentName: row.component_name,
              quantity: Number(row.quantity),
              unit: row.unit,
              unitCost: Number(row.unit_cost),
              subtotal: Number(row.subtotal),
            }));
          } else {
            savedComponents = componentsToSync;
          }
        }
      }

      const finalRecipes = savedComponents.length > 0 ? savedComponents : (normalizedType === 'Fabricación' ? componentsToSync : []);

      return {
        id: savedProd.id,
        code: savedProd.code,
        name: savedProd.name,
        productType: savedProd.product_type,
        category: savedProd.category,
        subcategory: savedProd.subcategory,
        sellingPrice: Number(savedProd.selling_price) || 0,
        costPrice: Number(savedProd.cost_price) || 0,
        profitMargin: Number(savedProd.profit_margin) || 0,
        linkedItemId: savedProd.linked_item_id || undefined,
        imageUrl: savedProd.image_url || undefined,
        recipeFileUrl: savedProd.recipe_file_url || undefined,
        recipeFileName: savedProd.recipe_file_name || undefined,
        videoUrl: savedProd.video_url || undefined,
        active: savedProd.active ?? true,
        recipe: finalRecipes,
        recipeComponents: finalRecipes,
        createdAt: savedProd.created_at,
        updatedAt: savedProd.updated_at,
      };
    } catch (err) {
      console.error('Error inesperado en saleProductsService.save:', err);
      return null;
    }
  },

  /**
   * Cambia el estado activo / inactivo de un producto de venta
   */
  async toggleActive(id: string, active: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sale_products')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error(`Error al cambiar estado de producto (${id}):`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error en toggleActive:', err);
      return false;
    }
  },

  /**
   * Elimina un producto de venta y en cascada sus recetas
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sale_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error al eliminar producto (${id}):`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error en delete:', err);
      return false;
    }
  },

  /**
   * Guarda un producto de producción
   */
  async saveProductionProduct(prod: ProductionProduct): Promise<ProductionProduct | null> {
    try {
      const isNew = !prod.id || prod.id.startsWith('prd-sem-');
      const payload: any = {
        code: prod.code,
        name: prod.name,
        unit: prod.unit,
        cost_price: prod.costPrice,
        description: prod.description || null,
        active: prod.active ?? true,
      };

      if (!isNew) {
        payload.id = prod.id;
      }

      const { data, error } = await supabase
        .from('production_products')
        .upsert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Error al guardar producción:', error);
        return null;
      }

      return {
        id: data.id,
        code: data.code,
        name: data.name,
        category: data.category || 'Elaborados',
        unit: data.unit,
        costPrice: Number(data.cost_price),
        description: data.description || '',
        active: data.active ?? true,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Error en saveProductionProduct:', err);
      return null;
    }
  },
};
