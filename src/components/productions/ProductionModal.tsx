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
  Layers,
  FileText,
  Video,
  AlertCircle,
  CheckCircle2,
  Package,
  Building,
  Info,
} from 'lucide-react';

interface ProductionModalProps {
  productToEdit?: ProductionProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_DEFAULT = [
  'Producciones cárnicas',
  'Panadería',
  'Salsas',
  'Guarniciones',
  'Pastas',
  'Cafetería & Barra',
  'Postres & Dulces',
  'Varios',
];

const SUBCATEGORIES_DEFAULT: Record<string, string[]> = {
  'Producciones cárnicas': ['Milanesas', 'Hamburguesas', 'Carnes Braseadas', 'Pollo', 'Pescados'],
  'Panadería': ['Pizzas', 'Panes Brioche', 'Focaccias', 'Masas Quebradas'],
  'Salsas': ['Salsas Caseras', 'Emulsiones & Mayonesas', 'Reducciones & Fondos', 'Aderezos'],
  'Guarniciones': ['Papas & Fritos', 'Verduras Cocidas', 'Purés', 'Ensaladas'],
  'Pastas': ['Rellenas', 'Largas', 'Ñoquis'],
  'Cafetería & Barra': ['Jarabes & Almíbares', 'Infusiones', 'Bases de Tragos'],
  'Postres & Dulces': ['Tortas', 'Cremas & Rellenos', 'Flanes & Postres'],
  'Varios': ['General'],
};

const UNITS_DEFAULT = ['kg', 'u', 'lt', 'g', 'ml', 'porción'];

const WAREHOUSES_DEFAULT = [
  'Freezer Producción',
  'Cámara Fría',
  'Depósito Seco',
  'Cocina Principal',
  'Barra',
  'Almacén General',
];

export const ProductionModal: React.FC<ProductionModalProps> = ({
  productToEdit,
  isOpen,
  onClose,
}) => {
  const {
    items,
    addOrUpdateProductionProduct,
    showToast,
  } = useApp();

  // Estados del Formulario
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES_DEFAULT[0]);
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES_DEFAULT[CATEGORIES_DEFAULT[0]][0]);
  const [unit, setUnit] = useState(UNITS_DEFAULT[0]);
  const [warehouse, setWarehouse] = useState(WAREHOUSES_DEFAULT[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeFileUrl, setRecipeFileUrl] = useState('');
  const [recipeFileName, setRecipeFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [active, setActive] = useState(true);

  // Receta de Producción (SOLO INSUMOS)
  const [recipeItems, setRecipeItems] = useState<ProductionRecipeItem[]>([]);

  // Estados para agregar un insumo a la receta
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('1');
  const [formError, setFormError] = useState<string>('');

  // Inicializar o resetear cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setCode(productToEdit.code);
      setName(productToEdit.name);
      setCategory(productToEdit.category || CATEGORIES_DEFAULT[0]);
      setSubcategory(productToEdit.subcategory || SUBCATEGORIES_DEFAULT[CATEGORIES_DEFAULT[0]][0]);
      setUnit(productToEdit.unit || UNITS_DEFAULT[0]);
      setWarehouse(productToEdit.warehouse || WAREHOUSES_DEFAULT[0]);
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.imageUrl || '');
      setRecipeFileUrl(productToEdit.recipeFileUrl || '');
      setRecipeFileName(productToEdit.recipeFileName || '');
      setVideoUrl(productToEdit.videoUrl || '');
      setActive(productToEdit.active);
      setRecipeItems(productToEdit.recipe ? [...productToEdit.recipe] : []);
    } else {
      // Nueva producción
      setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(CATEGORIES_DEFAULT[0]);
      setSubcategory(SUBCATEGORIES_DEFAULT[CATEGORIES_DEFAULT[0]][0]);
      setUnit(UNITS_DEFAULT[0]);
      setWarehouse(WAREHOUSES_DEFAULT[0]);
      setDescription('');
      setImageUrl('');
      setRecipeFileUrl('');
      setRecipeFileName('');
      setVideoUrl('');
      setActive(true);
      setRecipeItems([]);
    }
    setFormError('');
    setSelectedItemId('');
    setNewQuantity('1');
  }, [isOpen, productToEdit]);

  // Manejar cambio de categoría para actualizar subcategorías
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const subcats = SUBCATEGORIES_DEFAULT[newCat];
    if (subcats && subcats.length > 0) {
      setSubcategory(subcats[0]);
    } else {
      setSubcategory('General');
    }
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField label="Categoría" required>
                <SelectInput
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={CATEGORIES_DEFAULT.map((c) => ({ value: c, label: c }))}
                />
              </FormField>

              <FormField label="Subcategoría" required>
                <SelectInput
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  options={(SUBCATEGORIES_DEFAULT[category] || ['General']).map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              </FormField>

              <FormField label="Unidad de Medida" required hint="Unidad elaborada">
                <SelectInput
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  options={UNITS_DEFAULT.map((u) => ({ value: u, label: u }))}
                />
              </FormField>

              <FormField label="Almacén de Guardado" required hint="Depósito o freezer">
                <SelectInput
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  options={WAREHOUSES_DEFAULT.map((w) => ({ value: w, label: w }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="URL de Foto de la Preparación (Opcional)" hint="Enlace directo a imagen para referencia visual">
                <TextInput
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/fotos/preparacion.jpg"
                />
              </FormField>

              <FormField label="Descripción o Notas Internas (Opcional)" hint="Rendimiento estimado o especificación">
                <TextInput
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Rendimiento aprox. 10 unidades de 120g..."
                />
              </FormField>
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
                  <SelectInput
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    options={[
                      { value: '', label: '-- Selecciona un insumo --' },
                      ...activeItems.map((i) => ({
                        value: i.id,
                        label: `${i.name} (${i.storageUnit}) - Costo: $${(Number(i.currentPrice) || 0).toLocaleString('es-AR')}`,
                      })),
                    ]}
                  />
                </div>

                <div className="sm:col-span-3">
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
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddRecipeItem}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
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
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5 text-right">Cantidad</th>
                      <th className="p-2.5 text-right">Unidad</th>
                      <th className="p-2.5 text-right">Costo Unit.</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recipeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-800">{item.itemName}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-500 font-bold">{item.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          ${(Number(item.unitCost) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ${(Number(item.subtotal) || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Quitar de receta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
                  <span>{active ? '● Producción Activa' : '○ Producción Pausada / Inactiva'}</span>
                  <span className="text-[10px] uppercase underline">Hacer clic para cambiar</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Recursos de Cocina & Capacitación (PDF y Video) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Documentación de Elaboración & Capacitación
              </h4>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                Paso a Paso & Video
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="URL Ficha Técnica / Receta (PDF)" hint="Enlace a archivo en Google Drive o servidor web">
                <TextInput
                  value={recipeFileUrl}
                  onChange={(e) => setRecipeFileUrl(e.target.value)}
                  placeholder="https://ejemplo.com/fichas/receta_milanesa.pdf"
                />
              </FormField>

              <FormField label="Nombre Descriptivo del Archivo" hint="Ej: Receta_Milanesa.pdf">
                <TextInput
                  value={recipeFileName}
                  onChange={(e) => setRecipeFileName(e.target.value)}
                  placeholder="Nombre de la ficha paso a paso..."
                />
              </FormField>
            </div>

            <FormField label="URL Video de Preparación (YouTube o Vimeo)" hint="Enlace al video demostrativo para cocina">
              <TextInput
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/xxxxxxx"
              />
            </FormField>
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
    </div>
  );
};
