import { supabase } from '../lib/supabase';
import { ProductionProduct, ProductionRecipeItem } from '../types';

export const productionsService = {
  /**
   * Obtiene todos los productos de producción (semielaborados) junto con sus recetas de insumos
   */
  async getAll(): Promise<ProductionProduct[]> {
    try {
      const { data: prodsData, error: prodErr } = await supabase
        .from('production_products')
        .select('*')
        .order('name', { ascending: true });

      if (prodErr) {
        console.warn('Advertencia al consultar production_products de Supabase:', prodErr.message);
      }

      // Si hay datos en Supabase, buscamos sus recetas
      if (prodsData && prodsData.length > 0) {
        const { data: recipesData, error: recErr } = await supabase
          .from('production_product_recipes')
          .select('*');

        if (recErr) {
          console.warn('Advertencia al consultar production_product_recipes:', recErr.message);
        }

        const recipesByProduct = new Map<string, ProductionRecipeItem[]>();
        (recipesData || []).forEach((row: any) => {
          const item: ProductionRecipeItem = {
            id: row.id,
            productionProductId: row.production_product_id,
            itemId: row.item_id,
            itemName: row.item_name,
            quantity: Number(row.quantity) || 1,
            unit: row.unit || 'kg',
            unitCost: Number(row.unit_cost) || 0,
            subtotal: Number(row.subtotal) || 0,
          };
          const list = recipesByProduct.get(row.production_product_id) || [];
          list.push(item);
          recipesByProduct.set(row.production_product_id, list);
        });

        return prodsData.map((row: any) => {
          const cost = Number(row.cost_price ?? row.unit_cost ?? 0);
          return {
            id: row.id,
            code: row.code,
            name: row.name,
            category: row.category || 'Elaborados',
            subcategory: row.subcategory || 'General',
            unit: row.unit || 'kg',
            costPrice: cost,
            unitCost: cost,
            warehouse: row.warehouse || 'Freezer Producción',
            imageUrl: row.image_url || undefined,
            recipeFileUrl: row.recipe_file_url || undefined,
            recipeFileName: row.recipe_file_name || undefined,
            videoUrl: row.video_url || undefined,
            description: row.description || row.notes || '',
            active: row.active ?? true,
            recipe: recipesByProduct.get(row.id) || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });
      }

      // Si aún no hay registros en Supabase, devolvemos producciones modelo predefinidas
      return [
        {
          id: 'd1111111-1111-4111-8111-111111111111',
          code: 'PROD-001',
          name: 'Medallón de Carne Blend 120g',
          category: 'Producciones cárnicas',
          subcategory: 'Hamburguesas',
          unit: 'u',
          costPrice: 950,
          unitCost: 950,
          warehouse: 'Freezer Producción',
          description: 'Medallón de carne picada blend 120g moldeado y congelado',
          active: true,
          recipe: [],
        },
        {
          id: 'd2222222-2222-4222-8222-222222222222',
          code: 'PROD-002',
          name: 'Salsa Barbacoa Casera Ahumada',
          category: 'Salsas',
          subcategory: 'Salsas Especiales',
          unit: 'kg',
          costPrice: 1800,
          unitCost: 1800,
          warehouse: 'Cámara Fría',
          description: 'Salsa barbacoa artesanal con reducción de especias',
          active: true,
          recipe: [],
        },
        {
          id: 'd3333333-3333-4333-8333-333333333333',
          code: 'PROD-003',
          name: 'Masa de Pizza Fermentación Fría',
          category: 'Panadería',
          subcategory: 'Pizzas',
          unit: 'kg',
          costPrice: 1450,
          unitCost: 1450,
          warehouse: 'Cámara Fría',
          description: 'Bollo de masa madre hidratada al 65% para pizza',
          active: true,
          recipe: [],
        },
      ];
    } catch (err) {
      console.error('Error inesperado en productionsService.getAll:', err);
      return [];
    }
  },

  /**
   * Guarda o actualiza un producto de producción y sincroniza su receta de insumos
   */
  async save(prod: Partial<ProductionProduct>): Promise<ProductionProduct | null> {
    try {
      const isUuid = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const isNew = !prod.id || !isUuid(prod.id) || prod.id.startsWith('prod-') || prod.id.startsWith('temp-');
      const calculatedCost = Number(prod.costPrice ?? prod.unitCost ?? 0);

      const dbPayload: any = {
        code: prod.code?.trim(),
        name: prod.name?.trim(),
        category: prod.category?.trim() || 'Elaborados',
        subcategory: prod.subcategory?.trim() || 'General',
        unit: prod.unit || 'kg',
        cost_price: calculatedCost,
        unit_cost: calculatedCost,
        warehouse: prod.warehouse?.trim() || 'Freezer Producción',
        image_url: prod.imageUrl?.trim() || null,
        recipe_file_url: prod.recipeFileUrl?.trim() || null,
        recipe_file_name: prod.recipeFileName?.trim() || null,
        video_url: prod.videoUrl?.trim() || null,
        description: prod.description?.trim() || null,
        active: prod.active ?? true,
      };

      let savedProd: any = null;

      if (isNew) {
        const { data, error } = await supabase
          .from('production_products')
          .insert(dbPayload)
          .select('*')
          .single();

        if (error) {
          console.error('Error al insertar producción en Supabase:', error.message, error.details, error);
          throw new Error(`Error en Supabase: ${error.message || 'Verifica los campos ingresados.'}`);
        }
        savedProd = data;
      } else {
        const { data, error } = await supabase
          .from('production_products')
          .update(dbPayload)
          .eq('id', prod.id)
          .select('*')
          .single();

        if (error) {
          console.error('Error al actualizar producción en Supabase:', error.message, error.details, error);
          throw new Error(`Error en Supabase: ${error.message || 'Verifica los campos ingresados.'}`);
        }
        savedProd = data;
      }

      if (!savedProd) {
        throw new Error('No se recibió la producción guardada desde Supabase.');
      }

      const savedId = savedProd.id;
      const recipeToSync = prod.recipe || [];

      // 1. Eliminar recetas anteriores para esta producción
      await supabase
        .from('production_product_recipes')
        .delete()
        .eq('production_product_id', savedId);

      // 2. Insertar los nuevos insumos de la receta
      let savedRecipeItems: ProductionRecipeItem[] = [];
      if (recipeToSync.length > 0) {
        const recipePayload = recipeToSync.map((item) => ({
          production_product_id: savedId,
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'kg',
          unit_cost: Number(item.unitCost) || 0,
          subtotal: Number(item.subtotal) || 0,
        }));

        const { data: insertedRecipes, error: recInsertErr } = await supabase
          .from('production_product_recipes')
          .insert(recipePayload)
          .select('*');

        if (recInsertErr) {
          console.error('Error al insertar líneas de receta de producción:', recInsertErr.message, recInsertErr.details, recInsertErr);
          throw new Error(`Error en receta: ${recInsertErr.message}`);
        } else if (insertedRecipes) {
          savedRecipeItems = insertedRecipes.map((r: any) => ({
            id: r.id,
            productionProductId: r.production_product_id,
            itemId: r.item_id,
            itemName: r.item_name,
            quantity: Number(r.quantity),
            unit: r.unit,
            unitCost: Number(r.unit_cost),
            subtotal: Number(r.subtotal),
          }));
        }
      }

      return {
        id: savedId,
        code: savedProd.code,
        name: savedProd.name,
        category: savedProd.category,
        subcategory: savedProd.subcategory,
        unit: savedProd.unit,
        costPrice: Number(savedProd.cost_price ?? savedProd.unit_cost ?? 0),
        unitCost: Number(savedProd.cost_price ?? savedProd.unit_cost ?? 0),
        warehouse: savedProd.warehouse,
        imageUrl: savedProd.image_url || undefined,
        recipeFileUrl: savedProd.recipe_file_url || undefined,
        recipeFileName: savedProd.recipe_file_name || undefined,
        videoUrl: savedProd.video_url || undefined,
        description: savedProd.description || '',
        active: savedProd.active ?? true,
        recipe: savedRecipeItems.length > 0 ? savedRecipeItems : recipeToSync,
        createdAt: savedProd.created_at,
        updatedAt: savedProd.updated_at,
      };
    } catch (err) {
      console.error('Error inesperado en productionsService.save:', err);
      return null;
    }
  },

  /**
   * Elimina un producto de producción y sus recetas asociadas
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('production_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar producción de Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error inesperado en productionsService.delete:', err);
      return false;
    }
  },

  /**
   * Cambia el estado activo / pausado de una producción
   */
  async toggleActive(id: string, currentActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('production_products')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) {
        console.error('Error al alternar estado de producción:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error en productionsService.toggleActive:', err);
      return false;
    }
  },

  /**
   * Clona una producción con un nuevo código identificador y su receta de insumos
   */
  async duplicate(id: string, original: ProductionProduct): Promise<ProductionProduct | null> {
    try {
      const newCode = `${original.code}-COPIA-${Math.floor(100 + Math.random() * 900)}`;
      const newName = `${original.name} (Copia)`;

      const clonedPayload: Partial<ProductionProduct> = {
        code: newCode,
        name: newName,
        category: original.category,
        subcategory: original.subcategory,
        unit: original.unit,
        costPrice: original.costPrice,
        warehouse: original.warehouse,
        imageUrl: original.imageUrl,
        recipeFileUrl: original.recipeFileUrl,
        recipeFileName: original.recipeFileName,
        videoUrl: original.videoUrl,
        description: original.description,
        active: true,
        recipe: original.recipe ? [...original.recipe] : [],
      };

      return await this.save(clonedPayload);
    } catch (err) {
      console.error('Error al duplicar producción:', err);
      return null;
    }
  },
};
