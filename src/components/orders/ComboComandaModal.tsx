import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Layers,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Combo, ComboSection, ComboSectionItem, SaleOrderItem, SelectedOptionDetail } from '../../types';

export const DEMO_COMBO_MERIENDA_CLASICO: Combo = {
  id: 'prod-combo-01',
  code: 'CMB-001',
  name: 'Combo Merienda Clásico',
  category: 'Combos',
  sellingPrice: 7500,
  costPrice: 2800,
  profitMargin: 62.67,
  description: 'Café a elección + 2 acompañamientos + dip + opción de adicionales',
  imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
  active: true,
  sections: [
    {
      id: 'sec-cafe',
      comboId: 'prod-combo-01',
      name: 'Tipo de café',
      minQuantity: 1,
      maxQuantity: 1,
      required: true,
      allowRepeat: false,
      sortOrder: 1,
      items: [
        {
          id: 'it-cortado',
          sectionId: 'sec-cafe',
          componentType: 'INSUMO',
          componentId: 'ins-cortado',
          componentName: 'Cortado',
          extraPrice: 0,
          isDefault: true,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'it-americano',
          sectionId: 'sec-cafe',
          componentType: 'INSUMO',
          componentId: 'ins-americano',
          componentName: 'Americano',
          extraPrice: 0,
          isDefault: false,
          available: true,
        },
        {
          id: 'it-lagrima',
          sectionId: 'sec-cafe',
          componentType: 'INSUMO',
          componentId: 'ins-lagrima',
          componentName: 'Lágrima',
          extraPrice: 0,
          isDefault: false,
          available: true,
        },
        {
          id: 'it-capuchino',
          sectionId: 'sec-cafe',
          componentType: 'INSUMO',
          componentId: 'ins-capuchino',
          componentName: 'Capuchino',
          extraPrice: 0,
          isDefault: false,
          available: true,
        },
      ],
    },
    {
      id: 'sec-acomp',
      comboId: 'prod-combo-01',
      name: 'Acompañamiento',
      minQuantity: 2,
      maxQuantity: 2,
      required: true,
      allowRepeat: true,
      sortOrder: 2,
      items: [
        {
          id: 'it-medialuna',
          sectionId: 'sec-acomp',
          componentType: 'PRODUCCION',
          componentId: 'prod-medialuna',
          componentName: 'Medialuna',
          extraPrice: 0,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'it-criollo',
          sectionId: 'sec-acomp',
          componentType: 'PRODUCCION',
          componentId: 'prod-criollo',
          componentName: 'Criollo',
          extraPrice: 0,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'it-tostada',
          sectionId: 'sec-acomp',
          componentType: 'PRODUCCION',
          componentId: 'prod-tostada',
          componentName: 'Tostada',
          extraPrice: 0,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'it-chipa',
          sectionId: 'sec-acomp',
          componentType: 'PRODUCCION',
          componentId: 'prod-chipa',
          componentName: 'Chipá',
          extraPrice: 0,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80',
        },
      ],
    },
    {
      id: 'sec-dips',
      comboId: 'prod-combo-01',
      name: 'Dips',
      minQuantity: 1,
      maxQuantity: 1,
      required: true,
      allowRepeat: false,
      sortOrder: 3,
      items: [
        {
          id: 'it-mermelada',
          sectionId: 'sec-dips',
          componentType: 'INSUMO',
          componentId: 'ins-mermelada',
          componentName: 'Mermelada',
          extraPrice: 0,
          isDefault: true,
          available: true,
          imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'it-ddl',
          sectionId: 'sec-dips',
          componentType: 'INSUMO',
          componentId: 'ins-ddl',
          componentName: 'Dulce de leche',
          extraPrice: 0,
          available: true,
        },
        {
          id: 'it-queso',
          sectionId: 'sec-dips',
          componentType: 'INSUMO',
          componentId: 'ins-queso',
          componentName: 'Queso crema',
          extraPrice: 0,
          available: true,
        },
      ],
    },
    {
      id: 'sec-adicionales',
      comboId: 'prod-combo-01',
      name: 'Adicionales',
      minQuantity: 0,
      maxQuantity: 10,
      required: false,
      allowRepeat: true,
      sortOrder: 4,
      items: [
        {
          id: 'it-extra-medialuna',
          sectionId: 'sec-adicionales',
          componentType: 'PRODUCCION',
          componentId: 'prod-extra-medialuna',
          componentName: 'Medialuna extra',
          extraPrice: 800,
          available: true,
        },
        {
          id: 'it-cafe-doble',
          sectionId: 'sec-adicionales',
          componentType: 'INSUMO',
          componentId: 'ins-cafe-doble',
          componentName: 'Café doble',
          extraPrice: 600,
          available: true,
        },
        {
          id: 'it-jugo',
          sectionId: 'sec-adicionales',
          componentType: 'PRODUCTO_VENTA',
          componentId: 'prd-jugo',
          componentName: 'Jugo de naranja',
          extraPrice: 1200,
          available: true,
        },
      ],
    },
  ],
};

interface ComboComandaModalProps {
  combo: Combo;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCombo: (orderItem: SaleOrderItem) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);

const fmtExtra = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export const ComboComandaModal: React.FC<ComboComandaModalProps> = ({
  combo: initialCombo,
  isOpen,
  onClose,
  onConfirmCombo,
}) => {
  // Si el combo no tiene secciones configuradas o es el combo por defecto, usamos el modelo de ejemplo
  const activeCombo = useMemo(() => {
    if (!initialCombo.sections || initialCombo.sections.length === 0) {
      return {
        ...DEMO_COMBO_MERIENDA_CLASICO,
        id: initialCombo.id || DEMO_COMBO_MERIENDA_CLASICO.id,
        name: initialCombo.name || DEMO_COMBO_MERIENDA_CLASICO.name,
        sellingPrice: initialCombo.sellingPrice || DEMO_COMBO_MERIENDA_CLASICO.sellingPrice,
      };
    }
    return initialCombo;
  }, [initialCombo]);

  const sections = activeCombo.sections || [];

  // Estado de selecciones por sección e ítem: Map de sectionId -> { [itemId]: number }
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});

  // Inicialización de cantidades cuando cambia el combo o se abre
  useEffect(() => {
    if (!isOpen) return;

    const init: Record<string, Record<string, number>> = {};
    sections.forEach((sec) => {
      init[sec.id] = {};
      const max = sec.maxQuantity || 1;
      const items = sec.items || [];

      if (max === 1 && sec.required && items.length > 0) {
        // Por defecto seleccionar el ítem marcado como default o el primero disponible
        const defaultItem = items.find((i) => i.isDefault) || items.find((i) => i.available !== false) || items[0];
        if (defaultItem) {
          init[sec.id][defaultItem.id] = 1;
        }
      } else if (sec.id === 'sec-acomp' || (max === 2 && items.length >= 2)) {
        // En el ejemplo de la infografía: Medialuna = 1, Criollo = 1
        if (items[0]) init[sec.id][items[0].id] = 1;
        if (items[1]) init[sec.id][items[1].id] = 1;
      }
    });

    setQuantities(init);
    setValidationError('');
  }, [isOpen, activeCombo]);

  const [validationError, setValidationError] = useState<string>('');

  // Manejo de Radio Button (Selección única, maxQuantity === 1)
  const handleSelectRadio = (sectionId: string, itemId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [sectionId]: {
        [itemId]: 1,
      },
    }));
    setValidationError('');
  };

  // Manejo de Contador [-] [cant] [+] (Selección múltiple / cantidades)
  const handleUpdateQuantity = (
    section: ComboSection,
    itemId: string,
    delta: number
  ) => {
    const secId = section.id;
    const currentMap = quantities[secId] || {};
    const currentQty = currentMap[itemId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    // Calcular suma total actual de la sección
    const totalInSec: number = (Object.values(currentMap) as number[]).reduce((acc: number, q: number) => acc + (Number(q) || 0), 0);
    const newTotalInSec: number = totalInSec - Number(currentQty) + Number(newQty);

    if (delta > 0 && newTotalInSec > section.maxQuantity) {
      setValidationError(`En "${section.name}" el máximo permitido es ${section.maxQuantity}.`);
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [secId]: {
        ...currentMap,
        [itemId]: newQty,
      },
    }));
    setValidationError('');
  };

  // Manejo de Checkbox (Opcionales con recargo)
  const handleToggleCheckbox = (sectionId: string, itemId: string) => {
    const currentMap = quantities[sectionId] || {};
    const currentVal = currentMap[itemId] || 0;
    const newVal = currentVal > 0 ? 0 : 1;

    setQuantities((prev) => ({
      ...prev,
      [sectionId]: {
        ...currentMap,
        [itemId]: newVal,
      },
    }));
    setValidationError('');
  };

  // Cálculo del precio total: Base + Recargos de opciones seleccionadas
  const totalPrice = useMemo(() => {
    let extra = 0;
    sections.forEach((sec) => {
      const itemMap = quantities[sec.id] || {};
      (sec.items || []).forEach((it) => {
        const qty = itemMap[it.id] || 0;
        if (qty > 0) {
          extra += (Number(it.extraPrice) || 0) * qty;
        }
      });
    });
    return (Number(activeCombo.sellingPrice) || 0) + extra;
  }, [activeCombo.sellingPrice, sections, quantities]);

  // Validar y Confirmar adición a la comanda
  const handleConfirm = () => {
    setValidationError('');

    // Validar mínimos de cada sección obligatoria
    for (const sec of sections) {
      const itemMap = quantities[sec.id] || {};
      const totalInSec: number = (Object.values(itemMap) as number[]).reduce((acc: number, q: number) => acc + (Number(q) || 0), 0);

      if (sec.required && totalInSec < sec.minQuantity) {
        setValidationError(
          `Debes seleccionar ${sec.minQuantity} opción${sec.minQuantity > 1 ? 'es' : ''} en "${sec.name}".`
        );
        return;
      }
    }

    // Construir desglose de opciones seleccionadas (SelectedOptionDetail)
    const selectedOptionDetails: SelectedOptionDetail[] = [];
    const breakdownTexts: string[] = [];

    sections.forEach((sec) => {
      const itemMap = quantities[sec.id] || {};
      const chosenItems: string[] = [];

      (sec.items || []).forEach((it) => {
        const qty = itemMap[it.id] || 0;
        if (qty > 0) {
          const extraText = Number(it.extraPrice) > 0 ? ` (+${fmt(it.extraPrice)})` : '';
          const qtyText = qty > 1 ? `${qty}x ` : '';
          chosenItems.push(`${qtyText}${it.componentName}${extraText}`);

          selectedOptionDetails.push({
            groupId: sec.id,
            groupName: sec.name,
            optionId: it.id,
            optionName: `${qtyText}${it.componentName}`,
            priceModifier: (Number(it.extraPrice) || 0) * qty,
          });
        }
      });

      if (chosenItems.length > 0) {
        breakdownTexts.push(`${sec.name}: ${chosenItems.join(', ')}`);
      }
    });

    // Crear el SaleOrderItem formateado para la comanda
    const orderItem: SaleOrderItem = {
      id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: activeCombo.id,
      productName: activeCombo.name,
      category: activeCombo.category || 'Combos',
      unitPrice: totalPrice,
      costPrice: Number(activeCombo.costPrice) || 0,
      quantity: 1,
      subtotal: totalPrice,
      selectedOptions: selectedOptionDetails,
      lineComment: breakdownTexts.join(' | '),
    };

    onConfirmCombo(orderItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[1240px] overflow-hidden my-4 flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Encabezado Estilo UI de Plegma */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight">
                Configuración del Combo
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Personaliza las opciones y adicionales de <span className="text-slate-800 font-bold">{activeCombo.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal: Grilla Horizontal de 5 Tarjetas */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-auto flex-1 space-y-4 bg-slate-50/40">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Fila Horizontal de Tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch min-w-[780px] lg:min-w-0">
            
            {/* TARJETA 0: Vista General del Combo (Izquierda) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="aspect-16/11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center shadow-inner">
                  {activeCombo.imageUrl ? (
                    <img
                      src={activeCombo.imageUrl}
                      alt={activeCombo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-300">
                      <Layers className="w-10 h-10 mx-auto mb-1 stroke-1" />
                      <span className="text-[10px] font-bold text-slate-400">Combo Plegma</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mb-1">
                    {activeCombo.category || 'Combos'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {activeCombo.name}
                  </h4>
                  <p className="text-lg font-black text-slate-900 mt-1 font-mono tracking-tight">
                    {fmt(activeCombo.sellingPrice)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                    {activeCombo.description ||
                      sections.map((s) => s.name).join(' + ') ||
                      'Selección completa de pasos y opciones'}
                  </p>
                </div>
              </div>

              {activeCombo.code && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Código:</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {activeCombo.code}
                  </span>
                </div>
              )}
            </div>

            {/* SECCIONES CONFIGURABLES 1, 2, 3 y 4 */}
            {sections.map((sec, sIdx) => {
              const max = sec.maxQuantity || 1;
              const isSingle = max === 1 && sec.required;
              const isCounter = max > 1;
              const isOptional = !sec.required;
              const itemMap = quantities[sec.id] || {};

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Encabezado de la Columna */}
                    <div className="flex items-baseline justify-between gap-1 pb-2.5 border-b border-slate-100">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-xs font-black text-amber-600">
                          {sIdx + 1}.
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 truncate" title={sec.name}>
                          {sec.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                        {isOptional ? '(Opcional)' : `(Elegí ${max})`}
                      </span>
                    </div>

                    {/* Lista de Opciones de la Sección */}
                    <div className="space-y-2 mt-3">
                      {(!sec.items || sec.items.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          Sin opciones
                        </p>
                      ) : (
                        sec.items.map((it) => {
                          const isAvail = it.available !== false && it.isAvailable !== false;
                          const currentQty = itemMap[it.id] || 0;
                          const isSelected = currentQty > 0;

                          // CASO 1: Radio Buttons (maxQuantity === 1) ej. Tipo de café, Dips
                          if (isSingle) {
                            return (
                              <button
                                type="button"
                                key={it.id}
                                onClick={() => isAvail && handleSelectRadio(sec.id, it.id)}
                                disabled={!isAvail}
                                className={`w-full py-2 px-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold shadow-2xs'
                                    : !isAvail
                                    ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Radio Button Azul con Punto Blanco como en la Imagen */}
                                  <span
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    )}
                                  </span>
                                  <span className="text-xs truncate">{it.componentName}</span>
                                </div>

                                {/* Foto Miniatura a la derecha */}
                                {it.imageUrl && (
                                  <img
                                    src={it.imageUrl}
                                    alt={it.componentName}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          }

                          // CASO 2: Contadores [-] [cant] [+] para Acompañamiento (Elegí 2)
                          if (isCounter) {
                            return (
                              <div
                                key={it.id}
                                className={`p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'border-amber-300 bg-amber-50/30 text-slate-900 font-bold'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {it.imageUrl ? (
                                    <img
                                      src={it.imageUrl}
                                      alt={it.componentName}
                                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                  ) : (
                                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-[10px] font-black shrink-0">
                                      🥐
                                    </span>
                                  )}
                                  <span className="text-xs font-medium text-slate-800 truncate">
                                    {it.componentName}
                                  </span>
                                </div>

                                {/* Controles [-] [cant] [+] con estilo Fiel a la Captura */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(sec, it.id, -1)}
                                    disabled={currentQty === 0}
                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black transition cursor-pointer ${
                                      currentQty > 0
                                        ? 'border-rose-400 bg-white text-rose-600 hover:bg-rose-50'
                                        : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                                  >
                                    -
                                  </button>
                                  <span className="w-4 text-center font-bold text-xs text-slate-900">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(sec, it.id, 1)}
                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black transition cursor-pointer ${
                                      currentQty > 0
                                        ? 'border-rose-400 bg-white text-rose-600 hover:bg-rose-50'
                                        : 'border-slate-200 bg-slate-100 text-slate-400 hover:border-rose-400 hover:text-rose-600'
                                    }`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // CASO 3: Checkboxes Cuadrados para Adicionales (Opcional)
                          return (
                            <button
                              type="button"
                              key={it.id}
                              onClick={() => isAvail && handleToggleCheckbox(sec.id, it.id)}
                              disabled={!isAvail}
                              className={`w-full py-2 px-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50/40 text-slate-950 font-bold'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Checkbox cuadrado */}
                                <span
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                                <span className="text-xs truncate">{it.componentName}</span>
                              </div>

                              <span className="font-semibold text-xs text-slate-900 shrink-0">
                                {Number(it.extraPrice) > 0 ? `+ ${fmtExtra(it.extraPrice)}` : 'Incluido'}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer con Resumen de Precio y Botones de la Carpeta UI */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-baseline gap-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total del Combo
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {fmt(totalPrice)}
              </p>
            </div>
            {totalPrice > activeCombo.sellingPrice && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300">
                (+ {fmt(totalPrice - activeCombo.sellingPrice)} recargos)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              leftIcon={<ShoppingBag className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Confirmar & Agregar a Comanda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
