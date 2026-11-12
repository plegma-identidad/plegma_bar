import React, { useState, useMemo } from 'react';
import { SaleProduct, SaleOrderItem } from '../../types';
import { Pizza, X, Check, Search, Plus, Minus, AlertCircle } from 'lucide-react';

interface PizzaSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: SaleOrderItem) => void;
  saleProducts: SaleProduct[];
}

export const PizzaSplitModal: React.FC<PizzaSplitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  saleProducts,
}) => {
  // Cantidad de pizzas enteras combinadas a pedir
  const [quantity, setQuantity] = useState<number>(1);

  // Mitades seleccionadas
  const [half1, setHalf1] = useState<SaleProduct | null>(null);
  const [half2, setHalf2] = useState<SaleProduct | null>(null);

  // Aclaraciones específicas por mitad
  const [half1Notes, setHalf1Notes] = useState<string>('');
  const [half2Notes, setHalf2Notes] = useState<string>('');

  // Paso activo de selección: 'half1' | 'half2'
  const [activeStep, setActiveStep] = useState<'half1' | 'half2'>('half1');

  // Buscador de variedades
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtrar productos de venta que correspondan a Pizzas
  const pizzaCatalog = useMemo(() => {
    const isPizza = (p: SaleProduct) => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('pizza') || sub.includes('pizza') || name.includes('pizza');
    };

    const filtered = saleProducts.filter((p) => p.active !== false && isPizza(p));
    // Fallback: si no hay productos con etiqueta "pizza", mostramos todos los activos para no bloquear al usuario
    return filtered.length > 0 ? filtered : saleProducts.filter((p) => p.active !== false);
  }, [saleProducts]);

  // Lista filtrada por el buscador
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return pizzaCatalog;
    const q = searchQuery.toLowerCase().trim();
    return pizzaCatalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }, [pizzaCatalog, searchQuery]);

  // Cálculo de Precios (50% de la variedad entera por cada mitad)
  const half1Price = useMemo(() => (half1 ? (Number(half1.sellingPrice) || 0) / 2 : 0), [half1]);
  const half2Price = useMemo(() => (half2 ? (Number(half2.sellingPrice) || 0) / 2 : 0), [half2]);
  const unitPrice = useMemo(() => Math.round((half1Price + half2Price) * 100) / 100, [half1Price, half2Price]);
  const totalPrice = useMemo(() => Math.round(unitPrice * quantity * 100) / 100, [unitPrice, quantity]);

  // Cálculo de Costos proporcionales (50% de la receta de cada variedad)
  const half1Cost = useMemo(() => (half1 ? (Number(half1.costPrice) || 0) / 2 : 0), [half1]);
  const half2Cost = useMemo(() => (half2 ? (Number(half2.costPrice) || 0) / 2 : 0), [half2]);
  const unitCost = useMemo(() => Math.round((half1Cost + half2Cost) * 100) / 100, [half1Cost, half2Cost]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

  const handleSelectPizza = (pizza: SaleProduct) => {
    if (activeStep === 'half1') {
      setHalf1(pizza);
      setActiveStep('half2'); // Avanzar automáticamente a la segunda mitad
    } else {
      setHalf2(pizza);
    }
  };

  const handleConfirmOrder = () => {
    if (!half1 || !half2) return;

    const notes1 = half1Notes.trim() ? ` (${half1Notes.trim()})` : '';
    const notes2 = half2Notes.trim() ? ` (${half2Notes.trim()})` : '';
    const lineComment = `1/2 ${half1.name}${notes1} | 1/2 ${half2.name}${notes2}`;

    const orderItem: SaleOrderItem = {
      id: `pizza-split-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: half1.id,
      productName: `Pizza 1/2 ${half1.name} + 1/2 ${half2.name}`,
      category: half1.category || 'Pizzas',
      unitPrice,
      costPrice: unitCost,
      quantity,
      subtotal: totalPrice,
      sideOption: 'Mitad y Mitad',
      lineComment,
      selectedOptions: [
        {
          groupId: 'half-1',
          groupName: 'Mitad 1 (50%)',
          optionId: half1.id,
          optionName: `1/2 ${half1.name}${notes1}`,
          priceModifier: half1Price,
        },
        {
          groupId: 'half-2',
          groupName: 'Mitad 2 (50%)',
          optionId: half2.id,
          optionName: `1/2 ${half2.name}${notes2}`,
          priceModifier: half2Price,
        },
      ],
    };

    onConfirm(orderItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* ENCABEZADO */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Armar Pizza Combinada (Mitad y Mitad)
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona 2 variedades. El precio y costo de cada mitad equivale al 50% de la variedad entera.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">

          {/* CONTROL DE CANTIDAD DE PIZZAS ENTERAS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 shadow-2xs">
            <div>
              <span className="text-xs font-black uppercase text-slate-400 block tracking-wider">
                Cantidad de Pizzas Enteras
              </span>
              <p className="text-xs text-slate-600">
                ¿Cuántas pizzas iguales con esta misma combinación deseas agregar?
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center shadow-xs transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-sm text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TARJETAS RESUMEN DE LAS DOS MITADES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* MITAD 1 */}
            <div
              onClick={() => setActiveStep('half1')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                activeStep === 'half1'
                  ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-300 shadow-sm'
                  : half1
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-white border-dashed border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  1° Mitad (50%)
                </span>
                {half1 && (
                  <span className="text-xs font-black text-slate-900">{fmt(half1Price)}</span>
                )}
              </div>

              {half1 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {half1.imageUrl && (
                      <img
                        src={half1.imageUrl}
                        alt={half1.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{half1.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Entera: {fmt(Number(half1.sellingPrice) || 0)} → 1/2: {fmt(half1Price)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={half1Notes}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setHalf1Notes(e.target.value)}
                    placeholder="Aclaración mitad 1 (ej: bien dorada, sin orégano)..."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  Toca aquí y selecciona la primera variedad abajo 👇
                </p>
              )}
            </div>

            {/* MITAD 2 */}
            <div
              onClick={() => setActiveStep('half2')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                activeStep === 'half2'
                  ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-300 shadow-sm'
                  : half2
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-white border-dashed border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  2° Mitad (50%)
                </span>
                {half2 && (
                  <span className="text-xs font-black text-slate-900">{fmt(half2Price)}</span>
                )}
              </div>

              {half2 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {half2.imageUrl && (
                      <img
                        src={half2.imageUrl}
                        alt={half2.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{half2.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Entera: {fmt(Number(half2.sellingPrice) || 0)} → 1/2: {fmt(half2Price)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={half2Notes}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setHalf2Notes(e.target.value)}
                    placeholder="Aclaración mitad 2 (ej: sin aceitunas, sin ajo)..."
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  Toca aquí y selecciona la segunda variedad abajo 👇
                </p>
              )}
            </div>

          </div>

          {/* CATÁLOGO DE PIZZAS DISPONIBLES */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-700">
                  Elige para la {activeStep === 'half1' ? '1° Mitad' : '2° Mitad'}:
                </span>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {activeStep === 'half1' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar pizza..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                No se encontraron variedades de pizza con ese criterio de búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                {filteredCatalog.map((pizza) => {
                  const currentSelected = activeStep === 'half1' ? half1?.id === pizza.id : half2?.id === pizza.id;
                  const halfPrice = (Number(pizza.sellingPrice) || 0) / 2;

                  return (
                    <button
                      type="button"
                      key={pizza.id}
                      onClick={() => handleSelectPizza(pizza)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer group ${
                        currentSelected
                          ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-slate-50'
                      }`}
                    >
                      {pizza.imageUrl && (
                        <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                          <img
                            src={pizza.imageUrl}
                            alt={pizza.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-xs text-slate-900 group-hover:text-rose-700 transition leading-tight line-clamp-2">
                          {pizza.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Entera: {fmt(Number(pizza.sellingPrice) || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                        <span className="text-[10px] font-black text-rose-600">
                          1/2: {fmt(halfPrice)}
                        </span>
                        {currentSelected && (
                          <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* PIE CON TOTAL Y CONFIRMACIÓN */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Pizza Combinada
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-rose-400">
                {fmt(totalPrice)}
              </span>
              {quantity > 1 && (
                <span className="text-xs text-slate-300">
                  ({fmt(unitPrice)} c/u × {quantity})
                </span>
              )}
            </div>
            {(!half1 || !half2) && (
              <span className="text-[11px] text-amber-400 font-bold block">
                ⚠️ Selecciona ambas mitades para confirmar el pedido.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={!half1 || !half2}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Pizza className="w-4 h-4" />
              <span>Agregar a la Comanda ({fmt(totalPrice)})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

