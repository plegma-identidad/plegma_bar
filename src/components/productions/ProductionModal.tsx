import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductionProduct, ProductionRecipeItem } from '../../types';
import { Button } from '../ui/Button';
import { FormField, TextInput, SelectInput } from '../ui/Form';
import {
  X,
  ChefHat,
  Plus,
  Trash2,
  Edit2,
  Check,
  Layers,
  FileText,
  Video,
  AlertCircle,
  CheckCircle2,
  Package,
  Building,
  Info,
  Upload,
  Image,
  Film,
  FileUp,
  Loader2,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { ConfigManagerModal } from '../ui/ConfigManagerModal';
import { SearchableSelect } from '../ui/SearchableSelect';

interface ProductionModalProps {
  productToEdit?: ProductionProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper para convertir URLs de YouTube o Vimeo a URLs embebibles
const getEmbedVideoUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }
    return null;
  } catch {
    return null;
  }
};

// Helper para obtener un nombre legible del archivo a partir de su URL
const getFileNameFromUrl = (url?: string, defaultName = 'Ficha Técnica de Receta'): string => {
  if (!url) return defaultName;
  try {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/');
    const last = segments[segments.length - 1];
    if (last) {
      const decoded = decodeURIComponent(last);
      return decoded.replace(/^[a-z]+_/i, '');
    }
    return defaultName;
  } catch {
    return defaultName;
  }
};

export const ProductionModal: React.FC<ProductionModalProps> = ({
  productToEdit,
  isOpen,
  onClose,
}) => {
  const {
    items,
    addOrUpdateProductionProduct,
    productionCategories,
    productionSubcategories,
    productionUnits,
    productionWarehouses,
    setProductionCategories,
    setProductionSubcategories,
    setProductionUnits,
    setProductionWarehouses,
    showToast,
  } = useApp();

  // Modal de configuración dinámica de Categorías, Subcategorías, Unidades y Almacenes
  const [configModalType, setConfigModalType] = useState<'category' | 'subcategory' | 'unit' | 'warehouse' | null>(null);

  // Estados de progreso de subida a Storage
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingRecipe, setUploadingRecipe] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Estados del Formulario
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [unit, setUnit] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeFileUrl, setRecipeFileUrl] = useState('');
  const [recipeFileName, setRecipeFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [active, setActive] = useState(true);

  // Receta de Producción (SOLO INSUMOS)
  const [recipeItems, setRecipeItems] = useState<ProductionRecipeItem[]>([]);

  // Estados para edición en línea de un ítem de la receta
  const [editingRecipeItemId, setEditingRecipeItemId] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editUnitCost, setEditUnitCost] = useState<string>('0');

  // Estados para agregar un insumo a la receta
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('1');
  const [formError, setFormError] = useState<string>('');

  // Inicializar o resetear cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setCode(productToEdit.code || '');
      setName(productToEdit.name || '');
      setCategory(productToEdit.category || (productionCategories.find((c) => c.active)?.name || 'Producciones cárnicas'));
      setSubcategory(productToEdit.subcategory || (productionSubcategories.find((s) => s.active)?.name || 'General'));
      setUnit(productToEdit.unit || (productionUnits.find((u) => u.active)?.name || 'kg'));
      setWarehouse(productToEdit.warehouse || (productionWarehouses.find((w) => w.active)?.name || 'Freezer Producción'));
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.imageUrl || '');
      setRecipeFileUrl(productToEdit.recipeFileUrl || '');

      const resolvedFileName = productToEdit.recipeFileName ||
        (productToEdit.recipeFileUrl ? getFileNameFromUrl(productToEdit.recipeFileUrl) : '');
      setRecipeFileName(resolvedFileName);

      setVideoUrl(productToEdit.videoUrl || '');
      setActive(productToEdit.active ?? true);
      setRecipeItems(productToEdit.recipe ? [...productToEdit.recipe] : []);

      // Auto-recuperación de seguridad: Si falta receta, video o foto, revisar si ya existen en Storage
      if (productToEdit.code && (!productToEdit.recipeFileUrl || !productToEdit.videoUrl || !productToEdit.imageUrl)) {
        storageService.getProductionFiles(productToEdit.code).then((files) => {
          if (files.recipeFileUrl) {
            setRecipeFileUrl((prev) => prev || files.recipeFileUrl!);
            setRecipeFileName((prev) => prev || files.recipeFileName || 'Ficha Técnica de Receta');
          }
          if (files.videoUrl) {
            setVideoUrl((prev) => prev || files.videoUrl!);
          }
          if (files.imageUrl) {
            setImageUrl((prev) => prev || files.imageUrl!);
          }
        });
      }
    } else {
      // Nueva producción
      setCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      const defaultCat = productionCategories.find((c) => c.active)?.name || 'Producciones cárnicas';
      const defaultSub = productionSubcategories.find((s) => s.active)?.name || 'General';
      const defaultUnit = productionUnits.find((u) => u.active)?.name || 'kg';
      const defaultWh = productionWarehouses.find((w) => w.active)?.name || 'Freezer Producción';
      setCategory(defaultCat);
      setSubcategory(defaultSub);
      setUnit(defaultUnit);
      setWarehouse(defaultWh);
      setDescription('');
      setImageUrl('');
      setRecipeFileUrl('');
      setRecipeFileName('');
      setVideoUrl('');
      setActive(true);
      setRecipeItems([]);
    }
    setEditingRecipeItemId(null);
    setFormError('');
    setSelectedItemId('');
    setNewQuantity('1');
  }, [isOpen, productToEdit, productionCategories, productionSubcategories, productionUnits, productionWarehouses]);

  // Manejo de Subida de Foto a Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!code.trim()) {
      showToast('Por favor asigna un Código de Producción antes de subir la foto.', 'warning');
      return;
    }

    setUploadingImage(true);
    try {
      if (imageUrl && storageService.extractPathFromUrl(imageUrl)) {
        await storageService.deleteProductMedia(imageUrl);
      }

      const res = await storageService.uploadProductionMedia(code.trim(), 'foto', file);
      if (res) {
        setImageUrl(res.url);

        if (productToEdit?.id) {
          await supabase
            .from('production_products')
            .update({ image_url: res.url, updated_at: new Date().toISOString() })
            .eq('id', productToEdit.id);
        }

        showToast('Foto subida exitosamente a Supabase Storage.', 'success');
      } else {
        showToast('Error al subir la foto a Supabase Storage.', 'error');
      }
    } catch (err: any) {
      showToast('Error al subir foto: ' + (err.message || ''), 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl && storageService.extractPathFromUrl(imageUrl)) {
      await storageService.deleteProductMedia(imageUrl);
    }
    setImageUrl('');
    if (productToEdit?.id) {
      await supabase
        .from('production_products')
        .update({ image_url: null, updated_at: new Date().toISOString() })
        .eq('id', productToEdit.id);
    }
    showToast('Foto quitada de Storage.', 'info');
  };

  // Manejo de Subida de Archivo de Receta a Storage
  const handleRecipeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!code.trim()) {
      showToast('Por favor asigna un Código de Producción antes de subir el archivo.', 'warning');
      return;
    }

    setUploadingRecipe(true);
    try {
      if (recipeFileUrl && storageService.extractPathFromUrl(recipeFileUrl)) {
        await storageService.deleteProductMedia(recipeFileUrl);
      }

      const res = await storageService.uploadProductionMedia(code.trim(), 'receta', file);
      if (res) {
        setRecipeFileUrl(res.url);
        setRecipeFileName(res.name);

        if (productToEdit?.id) {
          await supabase
            .from('production_products')
            .update({
              recipe_file_url: res.url,
              recipe_file_name: res.name,
              updated_at: new Date().toISOString()
            })
            .eq('id', productToEdit.id);
        }

        showToast('Archivo de receta subido a Supabase Storage.', 'success');
      } else {
        showToast('Error al subir archivo de receta.', 'error');
      }
    } catch (err: any) {
      showToast('Error al subir receta: ' + (err.message || ''), 'error');
    } finally {
      setUploadingRecipe(false);
      e.target.value = '';
    }
  };

  const handleRemoveRecipeFile = async () => {
    if (recipeFileUrl && storageService.extractPathFromUrl(recipeFileUrl)) {
      await storageService.deleteProductMedia(recipeFileUrl);
    }
    setRecipeFileUrl('');
    setRecipeFileName('');
    if (productToEdit?.id) {
      await supabase
        .from('production_products')
        .update({
          recipe_file_url: null,
          recipe_file_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productToEdit.id);
    }
    showToast('Archivo de receta quitado.', 'info');
  };

  // Manejo de Subida de Video a Storage
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!code.trim()) {
      showToast('Por favor asigna un Código de Producción antes de subir el video.', 'warning');
      return;
    }

    setUploadingVideo(true);
    try {
      if (videoUrl && storageService.extractPathFromUrl(videoUrl)) {
        await storageService.deleteProductMedia(videoUrl);
      }

      const res = await storageService.uploadProductionMedia(code.trim(), 'video', file);
      if (res) {
        setVideoUrl(res.url);

        if (productToEdit?.id) {
          await supabase
            .from('production_products')
            .update({
              video_url: res.url,
              updated_at: new Date().toISOString()
            })
            .eq('id', productToEdit.id);
        }

        showToast('Video subido exitosamente a Supabase Storage.', 'success');
      } else {
        showToast('Error al subir el video a Supabase Storage.', 'error');
      }
    } catch (err: any) {
      showToast('Error al subir video: ' + (err.message || ''), 'error');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleRemoveVideo = async () => {
    if (videoUrl && storageService.extractPathFromUrl(videoUrl)) {
      await storageService.deleteProductMedia(videoUrl);
    }
    setVideoUrl('');
    if (productToEdit?.id) {
      await supabase
        .from('production_products')
        .update({
          video_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productToEdit.id);
    }
    showToast('Video quitado.', 'info');
  };

  // Costo total calculado sumando subtotales de insumos
  const calculatedCost = useMemo(() => {
    return recipeItems.reduce((acc, r) => acc + (Number(r.subtotal) || 0), 0);
  }, [recipeItems]);

  // Lista de insumos activos disponibles para agregar a la receta
  const activeItems = useMemo(() => {
    return items.filter((i) => i.active !== false);
  }, [items]);

  // Insumo seleccionado actualmente en el selector de agregación
  const selectedItemObj = useMemo(() => {
    return activeItems.find((i) => i.id === selectedItemId);
  }, [activeItems, selectedItemId]);

  // Agregar insumo a la receta
  const handleAddRecipeItem = () => {
    if (!selectedItemId) {
      setFormError('Por favor selecciona un insumo del catálogo para agregar a la receta.');
      return;
    }
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('La cantidad del insumo debe ser un número mayor a 0.');
      return;
    }

    if (!selectedItemObj) return;

    // Verificar si ya está en la receta
    const existingIndex = recipeItems.findIndex((r) => r.itemId === selectedItemId);
    const unitCost = Number(selectedItemObj.currentPrice) || 0;
    const subtotal = qty * unitCost;

    if (existingIndex >= 0) {
      // Actualizar cantidad y subtotal
      const updated = [...recipeItems];
      const newTotalQty = updated[existingIndex].quantity + qty;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newTotalQty,
        subtotal: newTotalQty * unitCost,
      };
      setRecipeItems(updated);
    } else {
      const newItem: ProductionRecipeItem = {
        id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productionProductId: productToEdit ? productToEdit.id : '',
        itemId: selectedItemObj.id,
        itemName: selectedItemObj.name,
        quantity: qty,
        unit: selectedItemObj.storageUnit || 'u',
        unitCost,
        subtotal,
      };
      setRecipeItems((prev) => [...prev, newItem]);
    }

    setSelectedItemId('');
    setNewQuantity('1');
    setFormError('');
  };

  // Manejadores para edición en línea de un ítem de la receta
  const handleStartEditRecipeItem = (item: ProductionRecipeItem) => {
    setEditingRecipeItemId(item.id);
    setEditItemId(item.itemId);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit || '');
    setEditUnitCost(String(item.unitCost || 0));
  };

  const handleCancelEditRecipeItem = () => {
    setEditingRecipeItemId(null);
  };

  const handleEditItemChange = (newItemId: string) => {
    setEditItemId(newItemId);
    const found = activeItems.find((i) => i.id === newItemId);
    if (found) {
      setEditUnit(found.storageUnit || 'u');
      setEditUnitCost(String(found.currentPrice || 0));
    }
  };

  const handleSaveEditRecipeItem = (recipeId: string) => {
    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('La cantidad del insumo debe ser mayor a 0.', 'warning');
      return;
    }
    const cost = parseFloat(editUnitCost);
    if (isNaN(cost) || cost < 0) {
      showToast('El costo unitario debe ser mayor o igual a 0.', 'warning');
      return;
    }

    const foundItem = activeItems.find((i) => i.id === editItemId);
    const currentItem = recipeItems.find((r) => r.id === recipeId);
    const itemName = foundItem ? foundItem.name : (currentItem?.itemName || 'Insumo');
    const unitToSave = editUnit.trim() || foundItem?.storageUnit || currentItem?.unit || 'u';

    setRecipeItems((prev) =>
      prev.map((r) => {
        if (r.id === recipeId) {
          return {
            ...r,
            itemId: editItemId || r.itemId,
            itemName,
            quantity: qty,
            unit: unitToSave,
            unitCost: cost,
            subtotal: qty * cost,
          };
        }
        return r;
      })
    );

    setEditingRecipeItemId(null);
    showToast('Insumo de la receta actualizado correctamente.', 'success');
  };

  // Quitar insumo de la receta
  const handleRemoveRecipeItem = (id: string) => {
    setRecipeItems((prev) => prev.filter((r) => r.id !== id));
  };

  // Guardar producción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setFormError('El código de la producción es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setFormError('El nombre de la preparación es obligatorio.');
      return;
    }
    if (!unit.trim()) {
      setFormError('La unidad de medida es obligatoria.');
      return;
    }
    if (recipeItems.length === 0) {
      setFormError('Para definir una producción debes agregar al menos un insumo a la receta.');
      return;
    }

    const payload: Partial<ProductionProduct> = {
      id: productToEdit ? productToEdit.id : undefined,
      code: code.trim(),
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory.trim() || 'General',
      unit: unit.trim(),
      costPrice: calculatedCost,
      unitCost: calculatedCost,
      warehouse: warehouse.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      recipeFileUrl: recipeFileUrl.trim() || undefined,
      recipeFileName: recipeFileName.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      active,
      recipe: recipeItems,
    };

    const res = await addOrUpdateProductionProduct(payload);
    if (res.success) {
      onClose();
    } else {
      setFormError(res.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {productToEdit ? 'Editar Producto de Producción' : 'Nueva Preparación / Producción Interna'}
              </h3>
              <p className="text-xs text-slate-500">
                Pre-elaboración para uso como componente en cartas de venta u otras producciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Datos Principales */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              Datos Principales de la Preparación
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Código de Producción" required hint="Ej: PROD-001">
                <TextInput
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código identificador..."
                  className="font-mono font-bold"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Nombre de la Producción" required hint="Ej: Milanesa de Pollo, Medallón de Carne">
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre que identificarán cocineros y recetas..."
                    className="font-bold"
                  />
                </FormField>
              </div>
            </div>

            {/* Categoría, Subcategoría, Unidad y Almacén con Botón Gestionar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Categoría <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfigModalType('category')}
                    className="text-[11px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                    title="Configurar Categorías de Producción"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <SelectInput
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={productionCategories.filter((c) => c.active).map((c) => ({ value: c.name, label: c.name }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subcategoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfigModalType('subcategory')}
                    className="text-[11px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                    title="Configurar Subcategorías de Producción"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <SelectInput
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  options={productionSubcategories.filter((s) => s.active).map((s) => ({ value: s.name, label: s.name }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Unidad Medida <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfigModalType('unit')}
                    className="text-[11px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                    title="Configurar Unidades de Medida"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <SelectInput
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  options={productionUnits.filter((u) => u.active).map((u) => ({ value: u.name, label: u.name }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Almacén Guarda <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfigModalType('warehouse')}
                    className="text-[11px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                    title="Configurar Almacenes de Guardado"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <SelectInput
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  options={productionWarehouses.filter((w) => w.active).map((w) => ({ value: w.name, label: w.name }))}
                />
              </div>
            </div>

            <FormField label="Descripción o Notas Internas (Opcional)" hint="Rendimiento estimado, indicaciones técnicas o especificación de cocción">
              <TextInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Rendimiento aprox. 10 porciones de 120g. Mantener a -18°C..."
              />
            </FormField>

            {/* Subida de Foto de la Preparación a Storage */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Foto de la Preparación</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Ventas/Producciones/{code || '[código]'}/foto_...
                </span>
              </label>

              {imageUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video sm:aspect-21/9 max-h-52 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Foto de la preparación"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Reemplazar Foto</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition ${
                  uploadingImage
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-amber-600 py-2">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-xs font-bold">Subiendo foto a Supabase Storage...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500 text-center py-2">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-1">
                        <Image className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Selecciona o arrastra una foto de la preparación
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Formatos: JPG, PNG o WebP (Se elimina la anterior automáticamente al editar)
                      </span>
                    </div>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* 2. Receta de Producción (SOLO INSUMOS) */}
          <div className="bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  Receta de Producción (Obligatoria)
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Define los insumos necesarios para elaborar esta preparación y calcula automáticamente su costo.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-white px-2.5 py-1 rounded-full border border-amber-200">
                {recipeItems.length} insumos en receta
              </span>
            </div>

            {/* Banner Informativo Exclusivo de Insumos */}
            <div className="p-3 bg-white/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Regla de negocio:</strong> En las recetas de producciones <strong>solo se pueden utilizar insumos</strong> del maestro de Insumos. No se pueden agregar productos de producción.
              </span>
            </div>

            {/* Formulario para agregar insumo */}
            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase">
                + Agregar Insumo a la Receta
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Seleccionar Insumo del Inventario
                  </label>
                  <SearchableSelect
                    options={activeItems.map((i) => ({
                      value: i.id,
                      label: i.name,
                      sublabel: `${i.storageUnit || 'u'} • Costo: $${(Number(i.currentPrice) || 0).toLocaleString('es-AR')}`,
                    }))}
                    value={selectedItemId}
                    onChange={(val) => setSelectedItemId(val)}
                    placeholder="-- Buscar y seleccionar insumo --"
                    searchPlaceholder="Escribe el nombre del insumo..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Cantidad {selectedItemObj ? `(${selectedItemObj.storageUnit})` : ''}
                  </label>
                  <TextInput
                    type="number"
                    step="any"
                    min="0.0001"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="Ej: 0.200"
                    className="h-10"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddRecipeItem}
                    leftIcon={<Plus className="w-4 h-4 shrink-0" />}
                    className="w-full h-10 whitespace-nowrap font-bold text-xs md:text-sm px-3 flex items-center justify-center shadow-xs"
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de Insumos Agregados */}
            {recipeItems.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-amber-300 text-center text-slate-500 text-xs">
                <Layers className="w-8 h-8 text-amber-400 mx-auto mb-1 opacity-70" />
                <p className="font-bold text-slate-700">Aún no hay insumos cargados en la receta.</p>
                <p className="text-[11px] text-slate-500">
                  Selecciona arriba un insumo del maestro, indica la cantidad y presiona "Añadir".
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 min-w-[200px]">Insumo</th>
                      <th className="p-2.5 text-right w-24">Cantidad</th>
                      <th className="p-2.5 text-right w-20">Unidad</th>
                      <th className="p-2.5 text-right w-28">Costo Unit.</th>
                      <th className="p-2.5 text-right w-28">Subtotal</th>
                      <th className="p-2.5 text-center w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recipeItems.map((item) => {
                      const isEditing = editingRecipeItemId === item.id;
                      if (isEditing) {
                        const curSubtotal = (parseFloat(editQuantity) || 0) * (parseFloat(editUnitCost) || 0);
                        return (
                          <tr key={item.id} className="bg-amber-50/60 transition-colors">
                            <td className="p-2">
                              <SearchableSelect
                                options={activeItems.map((i) => ({
                                  value: i.id,
                                  label: i.name,
                                  sublabel: `${i.storageUnit || 'u'} • Costo: $${(Number(i.currentPrice) || 0).toLocaleString('es-AR')}`,
                                }))}
                                value={editItemId}
                                onChange={handleEditItemChange}
                                placeholder="Seleccionar..."
                                searchPlaceholder="Buscar insumo..."
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0.0001"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-right border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white font-bold"
                                placeholder="Cant."
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="text"
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-right border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                                placeholder="Unidad"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={editUnitCost}
                                onChange={(e) => setEditUnitCost(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-right border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold bg-white"
                                placeholder="Costo"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-amber-900 text-xs">
                              $${curSubtotal.toLocaleString('es-AR')}
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditRecipeItem(item.id)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
                                  title="Guardar cambios"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditRecipeItem}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                                  title="Cancelar edición"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 font-bold text-slate-800">{item.itemName}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700 font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right text-slate-500 font-bold">{item.unit}</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            ${(Number(item.unitCost) || 0).toLocaleString('es-AR')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ${(Number(item.subtotal) || 0).toLocaleString('es-AR')}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditRecipeItem(item)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Editar ítem de la receta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Quitar de receta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right text-slate-500 uppercase text-[10px]">
                        Costo Total Calculado:
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-700 text-sm font-black">
                        ${calculatedCost.toLocaleString('es-AR')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* 3. Costo y Estado */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" />
              Costo y Disponibilidad Operativa
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Costo de Producción (Calculado Automático)" hint="Suma de subtotales de la receta">
                <TextInput
                  value={`$ ${calculatedCost.toLocaleString('es-AR')}`}
                  readOnly
                  disabled
                  className="bg-slate-100 font-mono font-black text-amber-700 cursor-not-allowed text-base"
                />
              </FormField>

              <div className="flex flex-col justify-end">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estado Operativo
                </label>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`h-10 px-4 rounded-xl border flex items-center justify-between font-bold text-xs transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span>{active ? '✓ Producción Activa' : '✕ Producción Pausada / Inactiva'}</span>
                  <span className="text-[10px] uppercase underline">Hacer clic para cambiar</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Recursos de Cocina & Capacitación (Receta / Archivo y Video en Storage) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Documentación de Elaboración & Capacitación
              </h4>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                Paso a Paso & Video en Storage
              </span>
            </div>

            {/* Subida de Archivo de Receta / Ficha Técnica */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Ficha Técnica / Archivo de Receta</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Ventas/Producciones/{code || '[código]'}/receta_...
                </span>
              </label>

              {recipeFileUrl ? (
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {recipeFileName || getFileNameFromUrl(recipeFileUrl)}
                      </p>
                      <a
                        href={recipeFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Abrir / Descargar Ficha</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Reemplazar</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleRecipeFileUpload}
                        disabled={uploadingRecipe}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveRecipeFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar archivo de Storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition ${
                  uploadingRecipe
                    ? 'border-indigo-400 bg-indigo-50/30'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleRecipeFileUpload}
                    disabled={uploadingRecipe}
                  />
                  {uploadingRecipe ? (
                    <div className="flex items-center gap-2 text-indigo-600 py-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-bold">Subiendo archivo a Storage...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600 py-1">
                      <FileUp className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-bold">Subir archivo de receta (PDF / Documento)</span>
                      <span className="text-[10px] text-slate-400">(Ventas/Producciones/{code || '[código]'})</span>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* Subida de Video a Storage */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Video de Preparación / Capacitación</span>
                <span className="text-[10px] text-slate-400 font-normal">MP4, WebM, MOV o enlace externo</span>
              </label>

              {videoUrl ? (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  {/* Si es video embebible (YouTube / Vimeo) */}
                  {getEmbedVideoUrl(videoUrl) ? (
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={getEmbedVideoUrl(videoUrl)!}
                        title="Video de Preparación"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      >
                        Tu navegador no soporta el reproductor de video.
                      </video>
                    </div>
                  )}

                  <div className="p-3 bg-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate max-w-xs text-[11px] font-mono text-slate-400">
                      {videoUrl}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Reemplazar Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/*"
                          className="hidden"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition"
                        title="Quitar video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition ${
                    uploadingVideo
                      ? 'border-indigo-400 bg-indigo-50/30'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                    />
                    {uploadingVideo ? (
                      <div className="flex flex-col items-center gap-2 text-indigo-600 py-2">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="text-xs font-bold">Subiendo video a Supabase Storage...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500 text-center py-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
                          <Film className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Subir archivo de video a Storage
                        </span>
                        <span className="text-[11px] text-slate-400">
                          MP4, WebM o MOV (Ventas/Producciones/{code || '[código]'})
                        </span>
                      </div>
                    )}
                  </label>

                  {/* Alternativa: Ingresar enlace externo si no se quiere subir archivo */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase shrink-0">O ingresar URL externa:</span>
                    <TextInput
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtu.be/xxxxxx o enlace web..."
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer del Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {productToEdit ? 'Guardar Cambios' : 'Crear Producción'}
          </Button>
        </div>
      </div>

      {/* Modal de Configuración Dinámica para Categorías, Subcategorías, Unidades y Almacenes */}
      {configModalType && (
        <ConfigManagerModal
          title={
            configModalType === 'category' ? 'Categorías de Producción' :
            configModalType === 'subcategory' ? 'Subcategorías de Producción' :
            configModalType === 'unit' ? 'Unidades de Medida' : 'Almacenes de Guardado'
          }
          options={
            configModalType === 'category' ? productionCategories :
            configModalType === 'subcategory' ? productionSubcategories :
            configModalType === 'unit' ? productionUnits : productionWarehouses
          }
          onClose={() => setConfigModalType(null)}
          onUpdate={(newOpts) => {
            if (configModalType === 'category') {
              setProductionCategories(newOpts);
            } else if (configModalType === 'subcategory') {
              setProductionSubcategories(newOpts);
            } else if (configModalType === 'unit') {
              setProductionUnits(newOpts);
            } else {
              setProductionWarehouses(newOpts);
            }
          }}
        />
      )}
    </div>
  );
};
