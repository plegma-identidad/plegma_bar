import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleProduct, SaleProductType, RecipeComponent, RecipeComponentType } from '../../types';
import { Button } from '../ui/Button';
import { FormField, TextInput, SelectInput } from '../ui/Form';
import {
  X,
  ChefHat,
  ShoppingBag,
  Plus,
  Trash2,
  Percent,
  Layers,
  FileText,
  Video,
  AlertCircle,
  CheckCircle2,
  Package,
  TrendingUp,
} from 'lucide-react';

interface SaleProductModalProps {
  productToEdit?: SaleProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_DEFAULT = [
  'Hamburguesas',
  'Pizzas',
  'Cafetería',
  'Bebidas',
  'Pastas',
  'Entradas & Minutas',
  'Postres',
  'Combos & Promos',
  'Varios',
];

const SUBCATEGORIES_DEFAULT: Record<string, string[]> = {
  'Hamburguesas': ['Clásicas', 'Especiales', 'Smash Burgers', 'Veggie'],
  'Pizzas': ['Tradicionales', 'Especiales', 'Rellenas'],
  'Cafetería': ['Cafés', 'Especialidades', 'Tés & Infusiones', 'Licuados & Jugos'],
  'Bebidas': ['Gaseosas', 'Aguas', 'Cervezas', 'Tragos & Coctelería', 'Vinos'],
  'Pastas': ['Caseras', 'Rellenas', 'Salsas'],
  'Entradas & Minutas': ['Fritos & Snacks', 'Picadas', 'Sandwiches'],
  'Postres': ['Tortas', 'Helados', 'Postres de autor'],
  'Combos & Promos': ['Almuerzos', 'Meriendas', 'Cenas'],
  'Varios': ['General'],
};

export const SaleProductModal: React.FC<SaleProductModalProps> = ({
  productToEdit,
  isOpen,
  onClose,
}) => {
  const {
    items,
    productionProducts,
    addOrUpdateSaleProduct,
    showToast,
  } = useApp();

  // Estados del Formulario
  const [productType, setProductType] = useState<SaleProductType>('FABRICACION');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES_DEFAULT[0]);
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES_DEFAULT[CATEGORIES_DEFAULT[0]][0]);
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [imageUrl, setImageUrl] = useState('');
  const [recipeFileUrl, setRecipeFileUrl] = useState('');
  const [recipeFileName, setRecipeFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [active, setActive] = useState(true);

  // Reventa
  const [linkedItemId, setLinkedItemId] = useState<string>('');

  // Fabricación (Receta / Escandallo)
  const [recipeComponents, setRecipeComponents] = useState<RecipeComponent[]>([]);

  // Estado para agregar un componente a la receta
  const [newComponentType, setNewComponentType] = useState<RecipeComponentType>('INSUMO');
  const [newComponentId, setNewComponentId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('1');

  const [formError, setFormError] = useState<string>('');

  // Inicializar o resetear cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setProductType(productToEdit.productType);
      setCode(productToEdit.code);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setSubcategory(productToEdit.subcategory || '');
      setSellingPrice(productToEdit.sellingPrice.toString());
      setImageUrl(productToEdit.imageUrl || '');
      setRecipeFileUrl(productToEdit.recipeFileUrl || '');
      setRecipeFileName(productToEdit.recipeFileName || '');
      setVideoUrl(productToEdit.videoUrl || '');
      setActive(productToEdit.active);
      setLinkedItemId(productToEdit.linkedItemId || '');
      const existingRecipe = productToEdit.recipe || productToEdit.recipeComponents || [];
      setRecipeComponents([...existingRecipe]);
    } else {
      // Nuevo producto
      setProductType('FABRICACION');
      setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(CATEGORIES_DEFAULT[0]);
      setSubcategory(SUBCATEGORIES_DEFAULT[CATEGORIES_DEFAULT[0]][0]);
      setSellingPrice('0');
      setImageUrl('');
      setRecipeFileUrl('');
      setRecipeFileName('');
      setVideoUrl('');
      setActive(true);
      setLinkedItemId('');
      setRecipeComponents([]);
    }
    setFormError('');
    setNewComponentId('');
    setNewQuantity('1');
  }, [isOpen, productToEdit]);

  // Actualizar subcategoría cuando cambia categoría
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const subcats = SUBCATEGORIES_DEFAULT[newCat];
    if (subcats && subcats.length > 0) {
      setSubcategory(subcats[0]);
    } else {
      setSubcategory('');
    }
  };

  // Costo calculado
  const calculatedCost = useMemo(() => {
    if (productType === 'REVENTA') {
      if (!linkedItemId) return 0;
      const item = items.find((i) => i.id === linkedItemId);
      return item ? item.currentPrice : 0;
    } else {
      return recipeComponents.reduce((acc, c) => acc + c.subtotal, 0);
    }
  }, [productType, linkedItemId, items, recipeComponents]);

  // Margen de ganancia calculado: ((Venta - Costo) / Venta) * 100
  const profitMargin = useMemo(() => {
    const sell = parseFloat(sellingPrice) || 0;
    if (sell <= 0) return 0;
    return ((sell - calculatedCost) / sell) * 100;
  }, [sellingPrice, calculatedCost]);

  // Ganancia neta monetaria
  const netProfit = useMemo(() => {
    const sell = parseFloat(sellingPrice) || 0;
    return sell - calculatedCost;
  }, [sellingPrice, calculatedCost]);

  // Opciones para el selector de componentes según newComponentType
  const availableComponentOptions = useMemo(() => {
    if (newComponentType === 'INSUMO') {
      return items.map((i) => ({
        value: i.id,
        label: `${i.name} (${i.storageUnit}) - Costo: $${i.currentPrice}`,
        name: i.name,
        unit: i.storageUnit,
        unitCost: i.currentPrice,
      }));
    } else {
      return productionProducts.map((p) => {
        const cost = Number(p.costPrice ?? (p as any).unitCost ?? (p as any).unit_cost ?? 0);
        return {
          value: p.id,
          label: `${p.name} (${p.unit || 'u'}) - Costo: $${cost}`,
          name: p.name,
          unit: p.unit || 'u',
          unitCost: cost,
        };
      });
    }
  }, [newComponentType, items, productionProducts]);

  // Agregar componente a la receta
  const handleAddComponent = () => {
    if (!newComponentId) {
      setFormError('Por favor selecciona un insumo o producción para agregar a la receta.');
      return;
    }
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('La cantidad ingresada debe ser mayor a 0.');
      return;
    }

    const selectedOption = availableComponentOptions.find((o) => o.value === newComponentId);
    if (!selectedOption) return;

    const unitCost = Number(selectedOption.unitCost) || 0;
    const subtotal = qty * unitCost;

    const newComp: RecipeComponent = {
      id: `rc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      saleProductId: productToEdit ? productToEdit.id : '',
      componentType: newComponentType,
      componentId: newComponentId,
      componentName: selectedOption.name,
      quantity: qty,
      unit: selectedOption.unit || 'u',
      unitCost,
      subtotal,
    };

    setRecipeComponents((prev) => [...prev, newComp]);
    setNewComponentId('');
    setNewQuantity('1');
    setFormError('');
  };

  // Quitar componente de la receta
  const handleRemoveComponent = (id: string) => {
    setRecipeComponents((prev) => prev.filter((c) => c.id !== id));
  };

  // Guardar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setFormError('El código del producto es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('El precio de venta debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (productType === 'REVENTA' && !linkedItemId) {
      setFormError('Para productos de Reventa debes seleccionar un insumo vinculado.');
      return;
    }

    if (productType === 'FABRICACION' && recipeComponents.length === 0) {
      setFormError('Para productos de Fabricación debes armar la receta con al menos un componente (insumo o producción).');
      return;
    }

    const isFab = productType === 'FABRICACION';

    const payload: Partial<SaleProduct> = {
      id: productToEdit ? productToEdit.id : undefined,
      code: code.trim(),
      name: name.trim(),
      productType,
      category,
      subcategory: subcategory || undefined,
      sellingPrice: priceNum,
      costPrice: calculatedCost,
      profitMargin,
      linkedItemId: !isFab ? linkedItemId : undefined,
      imageUrl: imageUrl.trim() || undefined,
      recipeFileUrl: isFab ? (recipeFileUrl.trim() || undefined) : undefined,
      recipeFileName: isFab ? (recipeFileName.trim() || undefined) : undefined,
      videoUrl: isFab ? (videoUrl.trim() || undefined) : undefined,
      active,
      recipe: isFab ? recipeComponents : [],
      recipeComponents: isFab ? recipeComponents : [],
    };

    const res = await addOrUpdateSaleProduct(payload);
    if (res.success) {
      showToast(res.message, 'success');
      onClose();
    } else {
      setFormError(res.message);
      showToast(res.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              {productType === 'FABRICACION' ? (
                <ChefHat className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {productToEdit ? 'Editar Producto de Venta' : 'Nuevo Producto para la Carta'}
              </h3>
              <p className="text-xs text-slate-500">
                Configura precios, escandallos con insumos/producciones y documentación
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

          {/* 1. Selector de Tipo: Fabricación vs Reventa */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tipo de Producto <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProductType('FABRICACION')}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${productType === 'FABRICACION'
                    ? 'bg-indigo-50/70 border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-80'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${productType === 'FABRICACION'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    Fabricación
                    {productType === 'FABRICACION' && (
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Elaborado en cocina o barra. Requiere armar receta obligatoria (insumos y producciones).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProductType('REVENTA')}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${productType === 'REVENTA'
                    ? 'bg-emerald-50/70 border-emerald-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-80'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${productType === 'REVENTA'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    Reventa Directa
                    {productType === 'REVENTA' && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Artículo comprado listo para vender (gaseosas, cervezas). Lee costo y stock del insumo.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Datos Generales del Producto */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-indigo-600" />
              Información General del Producto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Código de Carta" required hint="Ej: PRD-101">
                <TextInput
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código identificador..."
                  className="font-mono font-bold"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Nombre Comercial" required hint="Ej: Hamburguesa Plegma Doble">
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del producto que verá el mozo y cliente..."
                    className="font-bold"
                  />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Categoría" required>
                <SelectInput
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={CATEGORIES_DEFAULT.map((c) => ({ value: c, label: c }))}
                />
              </FormField>

              <FormField label="Subcategoría">
                <SelectInput
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  options={(SUBCATEGORIES_DEFAULT[category] || ['General']).map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              </FormField>
            </div>

            <FormField label="URL de Imagen de Portada (Opcional)" hint="Enlace directo a imagen para catálogo y comandas táctiles">
              <TextInput
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/fotos/producto.jpg"
              />
            </FormField>
          </div>

          {/* 3. Sección Específica según Tipo */}
          {productType === 'REVENTA' ? (
            /* SECCIÓN REVENTA */
            <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Insumo Vinculado para Reventa Directa
                </h4>
                <span className="text-[10px] text-emerald-800 font-bold uppercase">
                  * Obligatorio
                </span>
              </div>

              <FormField
                label="Seleccionar Insumo del Inventario"
                required
                hint="El producto leerá automáticamente el costo actual y el stock disponible desde este insumo."
              >
                <SelectInput
                  value={linkedItemId}
                  onChange={(e) => setLinkedItemId(e.target.value)}
                  options={[
                    { value: '', label: '-- Selecciona un insumo --' },
                    ...items.map((i) => ({
                      value: i.id,
                      label: `${i.name} (${i.storageUnit}) - Costo: $${i.currentPrice} - Stock: ${i.currentStock}`,
                    })),
                  ]}
                />
              </FormField>

              {linkedItemId && (
                (() => {
                  const selItem = items.find((i) => i.id === linkedItemId);
                  if (!selItem) return null;
                  return (
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{selItem.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Código: {selItem.code} | Depósito: {selItem.location || 'General'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-[10px] uppercase font-bold">Costo Unitario:</p>
                        <p className="text-base font-black text-emerald-700">${selItem.currentPrice}</p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : (
            /* SECCIÓN FABRICACIÓN (RECETA / ESCANDALLO) */
            <div className="bg-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-indigo-600" />
                    Constructor de Receta / Escandallo (Obligatorio)
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Agrega los insumos y productos de producción (semielaborados) que componen este plato o bebida.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                  {recipeComponents.length} ingredientes
                </span>
              </div>

              {/* Agregar nuevo ingrediente */}
              <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  + Agregar Componente a la Receta
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tipo de Origen
                    </label>
                    <SelectInput
                      value={newComponentType}
                      onChange={(e) => {
                        setNewComponentType(e.target.value as RecipeComponentType);
                        setNewComponentId('');
                      }}
                      options={[
                        { value: 'INSUMO', label: 'Insumo (Inventario)' },
                        { value: 'PRODUCCION', label: 'Producción (Semielaborado)' },
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Seleccionar Componente
                    </label>
                    <SelectInput
                      value={newComponentId}
                      onChange={(e) => setNewComponentId(e.target.value)}
                      options={[
                        { value: '', label: '-- Seleccionar --' },
                        ...availableComponentOptions.map((o) => ({
                          value: o.value,
                          label: o.label,
                        })),
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Cantidad
                    </label>
                    <TextInput
                      type="number"
                      step="any"
                      min="0.0001"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="Ej: 0.25"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddComponent}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla de componentes agregados */}
              {recipeComponents.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-dashed border-indigo-300 text-center text-slate-500 text-xs">
                  <Layers className="w-8 h-8 text-indigo-400 mx-auto mb-1 opacity-70" />
                  <p className="font-bold text-slate-700">Aún no hay componentes en el escandallo.</p>
                  <p className="text-[11px] text-slate-500">Selecciona arriba insumos o producciones y presiona "Añadir".</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">Componente</th>
                        <th className="p-2.5 text-right">Cantidad</th>
                        <th className="p-2.5 text-right">Costo Unit.</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                        <th className="p-2.5 text-center">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {recipeComponents.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5">
                            {comp.componentType === 'INSUMO' ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                Insumo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                                Producción
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">{comp.componentName}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {comp.quantity} {comp.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            ${(Number(comp.unitCost) || 0).toLocaleString('es-AR')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ${(Number(comp.subtotal) || 0).toLocaleString('es-AR')}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(comp.id)}
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
                          Costo Total de la Receta:
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-900 text-sm">
                          ${(Number(calculatedCost) || 0).toLocaleString('es-AR')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. Precios, Costos y Margen de Rentabilidad */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Precios y Análisis de Rentabilidad
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField label="Costo Calculado" hint="Suma de ingredientes o insumo">
                <TextInput
                  value={`$ ${calculatedCost.toLocaleString('es-AR')}`}
                  readOnly
                  disabled
                  className="bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              <FormField label="Precio de Venta ($)" required hint="Precio en carta al público">
                <TextInput
                  type="number"
                  step="any"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="font-mono font-black text-base text-slate-900"
                />
              </FormField>

              <FormField label="Margen Rentabilidad (%)" hint="((Venta - Costo) / Venta) * 100">
                <div className="h-10 px-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between font-mono font-bold">
                  <span
                    className={`text-sm ${profitMargin >= 60
                        ? 'text-emerald-600'
                        : profitMargin >= 35
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                  >
                    {profitMargin.toFixed(1)}%
                  </span>
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </FormField>

              <FormField label="Ganancia Neta ($)" hint="Venta menos Costo">
                <TextInput
                  value={`$ ${netProfit.toLocaleString('es-AR')}`}
                  readOnly
                  disabled
                  className="bg-slate-100 font-mono font-bold text-emerald-700 cursor-not-allowed"
                />
              </FormField>
            </div>
          </div>

          {/* 5. Documentación Adjunta (PDF de Receta & Video Tutorial) - Solo Fabricación */}
          {productType === 'FABRICACION' ? (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Recursos de Cocina & Capacitación (Fabricación)
                </h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                  Ficha Técnica & Video
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="URL Ficha Técnica / Receta (PDF)" hint="Paso a paso para elaboración en cocina o barra">
                  <TextInput
                    value={recipeFileUrl}
                    onChange={(e) => setRecipeFileUrl(e.target.value)}
                    placeholder="https://ejemplo.com/fichas/receta.pdf"
                  />
                </FormField>

                <FormField label="Nombre Descriptivo del Archivo" hint="Ej: Ficha_Hamburguesa_v1.pdf">
                  <TextInput
                    value={recipeFileName}
                    onChange={(e) => setRecipeFileName(e.target.value)}
                    placeholder="Ficha técnica de cocina..."
                  />
                </FormField>
              </div>

              <FormField label="URL Video de Preparación (YouTube o Vimeo)" hint="Para capacitación del personal de cocina y barra">
                <TextInput
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </FormField>
            </div>
          ) : (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Reventa:</strong> No aplica receta paso a paso ni video de preparación. El producto se vende en el mismo estado en que se adquiere.
              </span>
            </div>
          )}
        </form>

        {/* Footer del Modal con Botones del Sistema UI */}
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
            {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </div>
    </div>
  );
};
