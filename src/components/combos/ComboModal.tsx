import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Combo,
  ComboSection,
  ComboSectionItem,
  ComboComponentType,
  ComboSectionAllowedType,
} from '../../types';
import { Button } from '../ui/Button';
import { FormField, TextInput, SelectInput } from '../ui/Form';
import { SearchableSelect } from '../ui/SearchableSelect';
import { ConfigManagerModal } from '../ui/ConfigManagerModal';
import { storageService } from '../../services/storageService';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Check,
  Percent,
  Package,
  ChefHat,
  Utensils,
  Upload,
  Image as ImageIcon,
  Loader2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  ShoppingCart,
  AlertCircle,
  HelpCircle,
  Settings,
} from 'lucide-react';

interface ComboModalProps {
  comboToEdit?: Combo | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_DEFAULT = [
  'Hamburguesas & Combos',
  'Pizzas & Promos',
  'Almuerzos Ejecutivos',
  'Meriendas & Cafetería',
  'Combos Familiares',
  'Especiales del Chef',
  'Bebidas & Tragos',
  'Varios',
];

export const ComboModal: React.FC<ComboModalProps> = ({
  comboToEdit,
  isOpen,
  onClose,
}) => {
  const {
    items,
    productionProducts,
    saleProducts,
    combos,
    addOrUpdateCombo,
    saleCategories,
    saleSubcategories,
    setSaleCategories,
    setSaleSubcategories,
    saveSaleCategories,
    saveSaleSubcategories,
    showToast,
  } = useApp();

  // Estados de Ficha General
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [active, setActive] = useState(true);

  // Storage / Foto
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Secciones
  const [sections, setSections] = useState<ComboSection[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Modal de Categorías
  const [configModalType, setConfigModalType] = useState<'category' | 'subcategory' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados interactivos para la Vista Previa de POS (Comanda en vivo)
  const [previewSelections, setPreviewSelections] = useState<Record<string, string[]>>({});

  // Carga o Inicialización del Formulario
  useEffect(() => {
    if (isOpen) {
      if (comboToEdit) {
        setCode(comboToEdit.code || '');
        setName(comboToEdit.name || '');
        setCategory(comboToEdit.category || '');
        setSubcategory(comboToEdit.subcategory || '');
        setDescription(comboToEdit.description || '');
        setSellingPrice(Number(comboToEdit.sellingPrice) || 0);
        setActive(comboToEdit.active !== undefined ? comboToEdit.active : true);
        setImageUrl(comboToEdit.imageUrl || '');

        // Secciones clonadas profundamente
        const clonedSections: ComboSection[] = (comboToEdit.sections || []).map((s, idx) => ({
          ...s,
          id: s.id || `sec-${Date.now()}-${idx}`,
          orderIndex: s.orderIndex || idx + 1,
          items: (s.items || []).map((item, iIdx) => ({
            ...item,
            id: item.id || `item-${Date.now()}-${iIdx}`,
          })),
        }));
        setSections(clonedSections);
      } else {
        // Nuevo Combo: Autogenerar Código CMB-XXX
        const maxCodeNum = combos.reduce((max, c) => {
          const match = c.code.match(/^CMB-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        const nextCode = `CMB-${String(maxCodeNum + 1).padStart(3, '0')}`;

        setCode(nextCode);
        setName('');
        setCategory(saleCategories[0]?.name || CATEGORIES_DEFAULT[0]);
        setSubcategory('');
        setDescription('');
        setSellingPrice(0);
        setActive(true);
        setImageUrl('');

        // Sección inicial sugerida (el usuario puede agregar más con "+ Agregar Sección")
        setSections([
          {
            id: `sec-${Date.now()}-1`,
            name: 'Plato o Producto Principal',
            description: 'Selecciona la opción principal del combo',
            orderIndex: 1,
            required: true,
            minQuantity: 1,
            maxQuantity: 1,
            allowRepeat: false,
            componentTypeAllowed: 'ALL',
            items: [],
          },
        ]);
      }
      setActiveTab('editor');
      setPreviewSelections({});
    }
  }, [isOpen, comboToEdit, combos, saleCategories]);

  // Cálculo del Costo Base estimado (suma del costo unitario de la primera opción de cada sección obligatoria)
  const estimatedCost = useMemo(() => {
    let totalCost = 0;
    sections.forEach((sec) => {
      if (sec.items && sec.items.length > 0) {
        // Tomar la primera opción disponible como default
        const defaultItem = sec.items.find((i) => i.isAvailable !== false) || sec.items[0];
        if (defaultItem) {
          totalCost += (Number(defaultItem.unitCost) || 0) * (Number(defaultItem.quantity) || 1);
        }
      }
    });
    return totalCost;
  }, [sections]);

  // Cálculo de Margen Bruto
  const profitMargin = useMemo(() => {
    const price = Number(sellingPrice) || 0;
    if (price <= 0) return 0;
    const margin = ((price - estimatedCost) / price) * 100;
    return Math.max(0, margin);
  }, [sellingPrice, estimatedCost]);

  // Manejo de Subida de Imagen a Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!code.trim()) {
      showToast('Por favor asigna un Código antes de subir la foto.', 'warning');
      return;
    }

    setUploadingImage(true);
    try {
      // Si ya existía una imagen anterior, borrarla físicamente para evitar acumulación
      if (imageUrl && storageService.extractPathFromUrl(imageUrl)) {
        await storageService.deleteComboMedia(imageUrl);
      }

      const res = await storageService.uploadComboMedia(code.trim(), file);
      if (res) {
        setImageUrl(res.url);
        showToast('Foto de combo subida correctamente a Supabase Storage.', 'success');
      } else {
        showToast('Error al subir imagen a Supabase Storage.', 'error');
      }
    } catch (err: any) {
      showToast('Error al subir imagen: ' + (err.message || ''), 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl && storageService.extractPathFromUrl(imageUrl)) {
      await storageService.deleteComboMedia(imageUrl);
    }
    setImageUrl('');
    showToast('Foto quitada de Storage.', 'info');
  };

  // Gestión de Secciones
  const handleAddSection = () => {
    const newSec: ComboSection = {
      id: `sec-${Date.now()}-${sections.length + 1}`,
      name: `Paso ${sections.length + 1}: Nueva Sección`,
      description: '',
      orderIndex: sections.length + 1,
      required: true,
      minQuantity: 1,
      maxQuantity: 1,
      allowRepeat: false,
      componentTypeAllowed: 'ALL',
      items: [],
    };
    setSections([...sections, newSec]);
  };

  const handleUpdateSection = (idx: number, updates: Partial<ComboSection>) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const handleDeleteSection = (idx: number) => {
    setSections((prev) => {
      const copy = prev.filter((_, i) => i !== idx);
      return copy.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
  };

  // Gestión de Componentes / Opciones dentro de una Sección
  const handleAddItemToSection = (sectionIdx: number) => {
    const newItem: ComboSectionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      componentType: 'sale_product',
      componentId: '',
      componentName: '',
      quantity: 1,
      unit: 'u',
      unitCost: 0,
      extraPrice: 0,
      isAvailable: true,
      sortOrder: (sections[sectionIdx].items?.length || 0) + 1,
    };

    setSections((prev) => {
      const copy = [...prev];
      copy[sectionIdx] = {
        ...copy[sectionIdx],
        items: [...(copy[sectionIdx].items || []), newItem],
      };
      return copy;
    });
  };

  const handleUpdateItem = (
    sectionIdx: number,
    itemIdx: number,
    updates: Partial<ComboSectionItem>
  ) => {
    setSections((prev) => {
      const copy = [...prev];
      const items = [...(copy[sectionIdx].items || [])];
      items[itemIdx] = { ...items[itemIdx], ...updates };
      copy[sectionIdx] = { ...copy[sectionIdx], items };
      return copy;
    });
  };

  const handleDeleteItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) => {
      const copy = [...prev];
      const items = (copy[sectionIdx].items || []).filter((_, i) => i !== itemIdx);
      copy[sectionIdx] = { ...copy[sectionIdx], items };
      return copy;
    });
  };

  // Opciones disponibles para el selector SearchableSelect según el tipo permitido en la sección
  const getSelectableOptionsForSection = (allowedType: ComboSectionAllowedType) => {
    const list: Array<{
      value: string;
      label: string;
      type: ComboComponentType;
      unit: string;
      cost: number;
    }> = [];

    // 1. Insumos (items)
    if (allowedType === 'ALL' || allowedType === 'item') {
      items.forEach((item) => {
        list.push({
          value: `item:${item.id}`,
          label: `[Insumo] ${item.name} (${item.unit || 'u'}) - Costo: $${(Number(item.price) || 0).toLocaleString('es-AR')}`,
          type: 'item',
          unit: item.unit || 'u',
          cost: Number(item.price) || 0,
        });
      });
    }

    // 2. Producciones (production_products)
    if (allowedType === 'ALL' || allowedType === 'production') {
      productionProducts.forEach((prod) => {
        list.push({
          value: `production:${prod.id}`,
          label: `[Producción] ${prod.name} (${prod.yieldUnit || 'u'}) - Costo: $${(Number(prod.costPrice) || 0).toLocaleString('es-AR')}`,
          type: 'production',
          unit: prod.yieldUnit || 'u',
          cost: Number(prod.costPrice) || 0,
        });
      });
    }

    // 3. Productos de Venta / Carta (sale_products)
    if (allowedType === 'ALL' || allowedType === 'sale_product') {
      saleProducts.forEach((sp) => {
        list.push({
          value: `sale_product:${sp.id}`,
          label: `[Carta] ${sp.name} - Costo: $${(Number(sp.costPrice) || 0).toLocaleString('es-AR')} (Venta: $${(Number(sp.sellingPrice) || 0).toLocaleString('es-AR')})`,
          type: 'sale_product',
          unit: 'u',
          cost: Number(sp.costPrice) || 0,
        });
      });
    }

    return list;
  };

  // Selección de un componente en una fila
  const handleSelectComponent = (
    sectionIdx: number,
    itemIdx: number,
    selectedValue: string
  ) => {
    if (!selectedValue) return;
    const [typePrefix, rawId] = selectedValue.split(':');
    const compType = typePrefix as ComboComponentType;

    let compName = '';
    let unit = 'u';
    let unitCost = 0;

    if (compType === 'item') {
      const it = items.find((i) => i.id === rawId);
      if (it) {
        compName = it.name;
        unit = it.unit || 'u';
        unitCost = Number(it.price) || 0;
      }
    } else if (compType === 'production') {
      const pr = productionProducts.find((p) => p.id === rawId);
      if (pr) {
        compName = pr.name;
        unit = pr.yieldUnit || 'u';
        unitCost = Number(pr.costPrice) || 0;
      }
    } else if (compType === 'sale_product') {
      const sp = saleProducts.find((p) => p.id === rawId);
      if (sp) {
        compName = sp.name;
        unit = 'u';
        unitCost = Number(sp.costPrice) || 0;
      }
    }

    handleUpdateItem(sectionIdx, itemIdx, {
      componentType: compType,
      componentId: rawId,
      componentName: compName,
      unit,
      unitCost,
    });
  };

  // Guardado Final
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      showToast('El código de combo es obligatorio.', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('El nombre del combo es obligatorio.', 'error');
      return;
    }
    if (Number(sellingPrice) <= 0) {
      showToast('El precio de venta debe ser mayor a 0.', 'error');
      return;
    }

    // Validar secciones
    if (sections.length === 0) {
      showToast('Debes configurar al menos una sección en el combo.', 'error');
      return;
    }

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec.name.trim()) {
        showToast(`La sección #${i + 1} debe tener un nombre.`, 'error');
        return;
      }
      if (!sec.items || sec.items.length === 0) {
        showToast(`La sección "${sec.name}" no tiene opciones cargadas. Agrega al menos una opción o elimina la sección.`, 'error');
        return;
      }
      for (let j = 0; j < (sec.items || []).length; j++) {
        const it = sec.items![j];
        if (!it.componentId || !it.componentName) {
          showToast(`En "${sec.name}", la opción #${j + 1} no tiene componente seleccionado.`, 'error');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const payload: Partial<Combo> = {
        id: comboToEdit?.id,
        code: code.trim(),
        name: name.trim(),
        category: category.trim(),
        subcategory: subcategory.trim() || undefined,
        description: description.trim() || undefined,
        sellingPrice: Number(sellingPrice) || 0,
        costPrice: estimatedCost,
        profitMargin,
        active,
        imageUrl: imageUrl.trim() || undefined,
        sections: sections.map((s, sIdx) => ({
          ...s,
          orderIndex: sIdx + 1,
          items: (s.items || []).map((it, iIdx) => ({
            ...it,
            sortOrder: iIdx + 1,
          })),
        })),
      };

      const result = await addOrUpdateCombo(payload);
      if (result.success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Helper para la vista previa de Comanda / POS
  const togglePreviewSelection = (sectionId: string, itemId: string, maxQty: number) => {
    setPreviewSelections((prev) => {
      const current = prev[sectionId] || [];
      if (current.includes(itemId)) {
        return {
          ...prev,
          [sectionId]: current.filter((id) => id !== itemId),
        };
      } else {
        if (maxQty === 1) {
          // Reemplazo directo
          return {
            ...prev,
            [sectionId]: [itemId],
          };
        } else if (current.length < maxQty) {
          return {
            ...prev,
            [sectionId]: [...current, itemId],
          };
        }
        return prev;
      }
    });
  };

  // Cálculo del precio total en la vista previa del POS (precio base + recargos seleccionados)
  const previewTotalPrice = useMemo(() => {
    let extraTotal = 0;
    sections.forEach((sec) => {
      const selectedItemIds = previewSelections[sec.id] || [];
      (sec.items || []).forEach((it) => {
        if (selectedItemIds.includes(it.id)) {
          extraTotal += Number(it.extraPrice) || 0;
        }
      });
    });
    return (Number(sellingPrice) || 0) + extraTotal;
  }, [sellingPrice, sections, previewSelections]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {comboToEdit ? `Editar Combo: ${comboToEdit.name}` : 'Crear Nuevo Combo Configurable'}
              </h3>
              <p className="text-xs text-slate-300">
                Armado por insumos, producciones o productos de carta con secciones y recargos
              </p>
            </div>
          </div>

          {/* Selector de Pestañas: Editor vs Preview POS */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Configuración
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Simulador POS
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'preview' ? (
            /* TAB 2: SIMULADOR POS / COMANDA EN VIVO */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <ShoppingCart className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Simulador Interactivo de Comanda POS
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Así interactúa el cajero o mozo al ingresar este combo en una comanda. Selecciona opciones en cada paso para verificar las cantidades mínimas/máximas y el recálculo dinámico de recargos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Opciones Interactivas */}
                <div className="lg:col-span-2 space-y-4">
                  {sections.map((sec, sIdx) => {
                    const selected = previewSelections[sec.id] || [];
                    const isMinFulfilled = selected.length >= sec.minQuantity;

                    return (
                      <div
                        key={sec.id}
                        className={`p-4 rounded-2xl border transition ${
                          sec.required && !isMinFulfilled
                            ? 'bg-white border-amber-300 shadow-xs'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                              {sIdx + 1}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{sec.name}</span>
                          </div>
                          <div className="text-xs">
                            {sec.required ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Obligatorio (Elige {sec.minQuantity})
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">Opcional (Máx {sec.maxQuantity})</span>
                            )}
                          </div>
                        </div>

                        {(!sec.items || sec.items.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No hay opciones cargadas en esta sección.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {sec.items.map((it) => {
                              const isSelected = selected.includes(it.id);
                              return (
                                <button
                                  type="button"
                                  key={it.id}
                                  onClick={() => togglePreviewSelection(sec.id, it.id, sec.maxQuantity)}
                                  disabled={it.isAvailable === false}
                                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : it.isAvailable === false
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate">{it.componentName}</p>
                                    <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      {it.quantity} {it.unit || 'u'}
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {Number(it.extraPrice) > 0 ? (
                                      <span
                                        className={`text-xs font-black ${
                                          isSelected ? 'text-amber-300' : 'text-amber-600'
                                        }`}
                                      >
                                        +${Number(it.extraPrice).toLocaleString('es-AR')}
                                      </span>
                                    ) : (
                                      <span className={`text-[11px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        Incluido
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ticket / Comanda Simulada en tiempo real */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 sticky top-0">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-400">Previsualización Ticket POS</p>
                        <h4 className="text-base font-black text-white">{name || 'Combo Sin Nombre'}</h4>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-amber-300">
                        {code || 'CMB-XXX'}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>1x {name || 'Combo Base'}</span>
                        <span className="font-mono">${(Number(sellingPrice) || 0).toLocaleString('es-AR')}</span>
                      </div>

                      {sections.map((sec) => {
                        const selected = previewSelections[sec.id] || [];
                        if (selected.length === 0) return null;

                        return (
                          <div key={sec.id} className="pl-3 border-l-2 border-indigo-500/50 space-y-1">
                            <p className="text-[10px] text-indigo-400 uppercase font-bold">{sec.name}:</p>
                            {sec.items
                              ?.filter((it) => selected.includes(it.id))
                              .map((it) => (
                                <div key={it.id} className="flex justify-between text-slate-200">
                                  <span>↳ {it.componentName}</span>
                                  {Number(it.extraPrice) > 0 ? (
                                    <span className="font-mono text-amber-400">
                                      +${Number(it.extraPrice).toLocaleString('es-AR')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">$0</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total a Cobrar</p>
                        <p className="text-2xl font-black text-amber-400">
                          ${previewTotalPrice.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400">IVA incl.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 1: CONFIGURACIÓN Y EDITOR DEL COMBO */
            <div className="space-y-6">
              {/* Bloque 1: Ficha General y Multimedia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subida de Imagen a Storage */}
                <div className="md:col-span-1 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Foto del Combo (Supabase Storage)
                  </label>
                  <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 relative group flex items-center justify-center">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        <span className="text-xs text-slate-500 font-bold">Subiendo a Ventas/Combos...</span>
                      </div>
                    ) : imageUrl ? (
                      <>
                        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100 transition shadow-xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" /> Cambiar
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                            title="Eliminar foto físicamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-slate-100/70 transition text-center">
                        <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Subir imagen</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG o WEBP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Ruta física: <span className="font-mono">Ventas/Combos/{code || '[codigo]'}/</span>
                  </p>
                </div>

                {/* Campos de texto principales */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Código Combo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="CMB-001"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Nombre Comercial del Combo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Combo Cuarto de Libra con Fritas & Bebida"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Categoría</label>
                        <button
                          type="button"
                          onClick={() => setConfigModalType('category')}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <Settings className="w-2.5 h-2.5" /> Administrar
                        </button>
                      </div>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden bg-white"
                      >
                        {saleCategories.length > 0
                          ? saleCategories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))
                          : CATEGORIES_DEFAULT.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Subcategoría</label>
                        <button
                          type="button"
                          onClick={() => setConfigModalType('subcategory')}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <Settings className="w-2.5 h-2.5" /> Administrar
                        </button>
                      </div>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden bg-white"
                      >
                        <option value="">(Sin subcategoría / General)</option>
                        {saleSubcategories.length > 0 ? (
                          saleSubcategories
                            .filter((s) => s.active)
                            .map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="Clásicos">Clásicos</option>
                            <option value="Especiales">Especiales</option>
                            <option value="Dobles & Triples">Dobles & Triples</option>
                            <option value="Promociones">Promociones</option>
                            <option value="Familiares">Familiares</option>
                            <option value="Ejecutivos">Ejecutivos</option>
                            <option value="Infantiles">Infantiles</option>
                          </>
                        )}
                        {subcategory &&
                          !saleSubcategories.some((s) => s.name === subcategory) &&
                          !['Clásicos', 'Especiales', 'Dobles & Triples', 'Promociones', 'Familiares', 'Ejecutivos', 'Infantiles'].includes(subcategory) && (
                            <option value={subcategory}>{subcategory}</option>
                          )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Descripción para la Carta / POS
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Breve reseña del combo o instrucciones para los mozos/cocina..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Precios, Costos y Margen */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Precio de Venta ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sellingPrice || ''}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-black text-slate-900 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Costo Base Estimado
                  </span>
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-sm font-black text-slate-700">
                      ${estimatedCost.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Suma opciones default</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Margen Bruto
                  </span>
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-700">
                      {profitMargin.toFixed(1)}%
                    </span>
                    <Percent className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Estado en el Menú
                  </span>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {active ? 'Activo (En Carta)' : 'Pausado (No visible)'}
                  </button>
                </div>
              </div>

              {/* Bloque 3: Gestión de Secciones y Componentes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Secciones / Pasos Configurables del Combo
                    </h4>
                    <p className="text-xs text-slate-500">
                      Define los pasos obligatorios u opcionales (Hamburguesas, Guarniciones, Bebidas, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Agregar Sección
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No hay secciones en este combo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Haz clic en "Agregar Sección" para configurar las opciones elegibles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {sections.map((section, sIdx) => {
                      const selectableOptions = getSelectableOptionsForSection(
                        section.componentTypeAllowed || 'ALL'
                      );

                      return (
                        <div
                          key={section.id}
                          className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-4"
                        >
                          {/* Cabecera de la Sección */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={section.name}
                                onChange={(e) => handleUpdateSection(sIdx, { name: e.target.value })}
                                placeholder="Nombre de la sección (Ej: Selección de Hamburguesa)"
                                className="font-black text-slate-900 text-sm px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-hidden"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleMoveSection(sIdx, 'up')}
                                disabled={sIdx === 0}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                                title="Mover arriba"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSection(sIdx, 'down')}
                                disabled={sIdx === sections.length - 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                                title="Mover abajo"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(sIdx)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                title="Eliminar sección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Parámetros de la Sección */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>
                              <label className="font-bold text-slate-600 block mb-1">Obligatoriedad</label>
                              <select
                                value={section.required ? 'true' : 'false'}
                                onChange={(e) =>
                                  handleUpdateSection(sIdx, { required: e.target.value === 'true' })
                                }
                                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                              >
                                <option value="true">Obligatorio</option>
                                <option value="false">Opcional</option>
                              </select>
                            </div>

                            <div>
                              <label className="font-bold text-slate-600 block mb-1">Cant. Mínima</label>
                              <input
                                type="number"
                                min="0"
                                value={section.minQuantity}
                                onChange={(e) =>
                                  handleUpdateSection(sIdx, {
                                    minQuantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-600 block mb-1">Cant. Máxima</label>
                              <input
                                type="number"
                                min="1"
                                value={section.maxQuantity}
                                onChange={(e) =>
                                  handleUpdateSection(sIdx, {
                                    maxQuantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-600 block mb-1">Repetición</label>
                              <select
                                value={section.allowRepeat ? 'true' : 'false'}
                                onChange={(e) =>
                                  handleUpdateSection(sIdx, { allowRepeat: e.target.value === 'true' })
                                }
                                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                              >
                                <option value="false">No permitir</option>
                                <option value="true">Permitir repetir</option>
                              </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                              <label className="font-bold text-slate-600 block mb-1">Tipo Permitido</label>
                              <select
                                value={section.componentTypeAllowed || 'ALL'}
                                onChange={(e) =>
                                  handleUpdateSection(sIdx, {
                                    componentTypeAllowed: e.target.value as ComboSectionAllowedType,
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                              >
                                <option value="ALL">Cualquier Tipo</option>
                                <option value="sale_product">Solo Carta</option>
                                <option value="production">Solo Producción</option>
                                <option value="item">Solo Insumo</option>
                              </select>
                            </div>
                          </div>

                          {/* Lista de Componentes / Opciones de esta sección */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase">
                                Opciones Disponibles en este paso ({(section.items || []).length})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItemToSection(sIdx)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Opción
                              </button>
                            </div>

                            {(!section.items || section.items.length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-2">
                                No has agregado opciones a esta sección. Haz clic en "+ Agregar Opción".
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {section.items.map((it, iIdx) => {
                                  const selectCurrentValue = it.componentId
                                    ? `${it.componentType}:${it.componentId}`
                                    : '';

                                  return (
                                    <div
                                      key={it.id || iIdx}
                                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                                    >
                                      {/* Selector Multi-origen SearchableSelect */}
                                      <div className="flex-1 min-w-[240px]">
                                        <SearchableSelect
                                          value={selectCurrentValue}
                                          onChange={(val) => handleSelectComponent(sIdx, iIdx, val)}
                                          placeholder="Buscar insumo, producción o producto de carta..."
                                          options={selectableOptions}
                                        />
                                      </div>

                                      {/* Cantidad */}
                                      <div className="w-24 shrink-0 flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-300">
                                        <span className="text-[10px] text-slate-400 font-bold">Cant:</span>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0.01"
                                          value={it.quantity || ''}
                                          onChange={(e) =>
                                            handleUpdateItem(sIdx, iIdx, {
                                              quantity: parseFloat(e.target.value) || 1,
                                            })
                                          }
                                          className="w-full text-right font-mono font-bold text-xs outline-hidden"
                                        />
                                        <span className="text-[10px] text-slate-500 font-medium">
                                          {it.unit || 'u'}
                                        </span>
                                      </div>

                                      {/* Recargo de Precio extra ($) */}
                                      <div className="w-28 shrink-0 flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-300">
                                        <span className="text-[10px] text-slate-400 font-bold">+$</span>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          value={it.extraPrice !== undefined ? it.extraPrice : ''}
                                          onChange={(e) =>
                                            handleUpdateItem(sIdx, iIdx, {
                                              extraPrice: parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          placeholder="0"
                                          className="w-full text-right font-mono font-bold text-xs outline-hidden text-amber-700"
                                          title="Recargo extra si el cliente elige esta opción"
                                        />
                                      </div>

                                      {/* Costo Unitario informativo */}
                                      <div className="w-24 shrink-0 text-right pr-2">
                                        <span className="text-[10px] text-slate-400 block uppercase">Costo ref.</span>
                                        <span className="font-mono text-slate-600 font-bold text-xs">
                                          ${(Number(it.unitCost) || 0).toLocaleString('es-AR')}
                                        </span>
                                      </div>

                                      {/* Toggle Disponible */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateItem(sIdx, iIdx, {
                                            isAvailable: it.isAvailable === false ? true : false,
                                          })
                                        }
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                          it.isAvailable !== false
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                        }`}
                                      >
                                        {it.isAvailable !== false ? 'Activo' : 'Agotado'}
                                      </button>

                                      {/* Eliminar Opción */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItem(sIdx, iIdx)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                        title="Quitar opción"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              * Los cambios en secciones impactan de inmediato en la comanda de venta.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-amber-500/20 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> {comboToEdit ? 'Guardar Cambios' : 'Crear Combo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Configuración Dinámica de Categorías y Subcategorías */}
      {configModalType && (
        <ConfigManagerModal
          title={
            configModalType === 'category'
              ? 'Categorías de Carta'
              : 'Subcategorías de Carta'
          }
          options={configModalType === 'category' ? saleCategories : saleSubcategories}
          onClose={() => setConfigModalType(null)}
          onUpdate={async (newOpts) => {
            if (configModalType === 'category') {
              if (saveSaleCategories) {
                await saveSaleCategories(newOpts);
              } else {
                setSaleCategories(newOpts);
              }
              const lastAdded = newOpts[newOpts.length - 1];
              if (lastAdded?.name) setCategory(lastAdded.name);
            } else {
              if (saveSaleSubcategories) {
                await saveSaleSubcategories(newOpts);
              } else {
                setSaleSubcategories(newOpts);
              }
              const lastAdded = newOpts[newOpts.length - 1];
              if (lastAdded?.name) setSubcategory(lastAdded.name);
            }
            setConfigModalType(null);
          }}
        />
      )}
    </div>
  );
};
