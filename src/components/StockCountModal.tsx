import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Provider, StockCount, StockCountItem } from '../types';
import {
  X,
  ClipboardList,
  CheckCircle2,
  Save,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface StockCountModalProps {
  provider: Provider;
  onClose: () => void;
  onProceedToOrder: (count: StockCount) => void;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({
  provider,
  onClose,
  onProceedToOrder,
}) => {
  const { items, providerItems, saveStockCount, userRole } = useApp();

  // Find associated items for this provider
  const pItemRels = providerItems.filter((pi) => pi.providerId === provider.id && pi.active);
  const pItems = items.filter((item) => pItemRels.some((rel) => rel.itemId === item.id));

  // Initialize counting state per item
  const [countsMap, setCountsMap] = useState<{
    [itemId: string]: { currentStock: string; notes: string };
  }>(() => {
    const initial: { [itemId: string]: { currentStock: string; notes: string } } = {};
    pItems.forEach((item) => {
      initial[item.id] = {
        currentStock: item.currentStock.toString(),
        notes: '',
      };
    });
    return initial;
  });

  const [step, setStep] = useState<'counting' | 'summary'>('counting');
  const [completedCount, setCompletedCount] = useState<StockCount | null>(null);

  // Calculate count progress
  const totalCount = pItems.length;
  const countedCount = Object.values(countsMap).filter(
    (val: { currentStock: string; notes: string }) => val.currentStock !== '' && !isNaN(Number(val.currentStock))
  ).length;

  const handleStockChange = (itemId: string, val: string) => {
    setCountsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        currentStock: val,
      },
    }));
  };

  const handleSaveDraft = () => {
    const stockItems: StockCountItem[] = pItems.map((item) => {
      const entry = countsMap[item.id];
      const parsedStock = entry && entry.currentStock !== '' ? Number(entry.currentStock) : item.currentStock;
      const prevStock = item.currentStock;
      const received = 0; // Simulated received
      const estConsumption = Math.max(0, prevStock + received - parsedStock);

      return {
        itemId: item.id,
        previousStock: prevStock,
        currentStock: parsedStock,
        receivedSinceLastCount: received,
        estimatedConsumption: estConsumption,
        notes: entry?.notes,
      };
    });

    const newCount: StockCount = {
      id: 'cnt-' + Date.now(),
      countNumber: 'CNT-' + Math.floor(1000 + Math.random() * 9000),
      providerId: provider.id,
      date: new Date().toISOString(),
      userId: `usr-${userRole}`,
      userName: `Usuario (${userRole.toUpperCase()})`,
      status: 'borrador',
      items: stockItems,
    };

    saveStockCount(newCount);
    alert('Borrador de conteo guardado exitosamente.');
    onClose();
  };

  const handleFinishCount = () => {
    const stockItems: StockCountItem[] = pItems.map((item) => {
      const entry = countsMap[item.id];
      const parsedStock = entry && entry.currentStock !== '' ? Number(entry.currentStock) : 0;
      const prevStock = item.currentStock;
      const received = 0;
      const estConsumption = Math.max(0, prevStock + received - parsedStock);

      return {
        itemId: item.id,
        previousStock: prevStock,
        currentStock: parsedStock,
        receivedSinceLastCount: received,
        estimatedConsumption: estConsumption,
        notes: entry?.notes,
      };
    });

    const finalCountObj: StockCount = {
      id: 'cnt-' + Date.now(),
      countNumber: 'CNT-' + Math.floor(1000 + Math.random() * 9000),
      providerId: provider.id,
      date: new Date().toISOString(),
      userId: `usr-${userRole}`,
      userName: `Usuario (${userRole.toUpperCase()})`,
      status: 'finalizado',
      items: stockItems,
    };

    saveStockCount(finalCountObj);
    setCompletedCount(finalCountObj);
    setStep('summary');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {step === 'counting' ? 'Conteo Físico de Stock' : 'Resumen Post-Conteo & Sugerido'}
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                Proveedor: {provider?.name} ({provider?.rubro || 'General'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: ACTIVE STREAMLINED COUNTING VIEW */}
        {step === 'counting' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
            {/* Progress Bar & Instructions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Avance del Conteo:</span>
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {countedCount} de {totalCount} insumos completados
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(countedCount / Math.max(1, totalCount)) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                💡 <em>Vista simplificada para depósito: Ingrese la cantidad contada en la unidad correspondiente.</em>
              </p>
            </div>

            {/* List of Simplified Item Cards */}
            <div className="space-y-3">
              {pItems.map((item) => {
                const currentVal = countsMap[item.id]?.currentStock ?? '';
                const numVal = Number(currentVal);
                const prevStock = item.currentStock;
                const consumption = !isNaN(numVal) ? Math.max(0, prevStock - numVal) : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.storageUnit}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>
                          Stock registrado anterior: <strong className="text-slate-800">{prevStock} {item.storageUnit}</strong>
                        </span>
                        {currentVal !== '' && !isNaN(numVal) && (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Consumo est.: {consumption} {item.storageUnit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Streamlined Numeric Input Box */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-slate-400">Stock Actual:</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={currentVal}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-28 py-2 px-3 text-center text-lg font-black bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-inner"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {item.storageUnit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: POST-COUNT SUMMARY & SUGGESTED ORDER PREVIEW */}
        {step === 'summary' && completedCount && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Conteo #{completedCount.countNumber} Finalizado Correctamente
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Se han actualizado los niveles de stock físico y se calculó la recomendación teórica.
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Insumo</th>
                      <th className="p-3 text-center">Stock Mín.</th>
                      <th className="p-3 text-center">Stock Máx.</th>
                      <th className="p-3 text-center">Stock Ant.</th>
                      <th className="p-3 text-center">Stock Contado</th>
                      <th className="p-3 text-center">Consumo Est.</th>
                      <th className="p-3 text-center">Estado Stock</th>
                      <th className="p-3 text-center">Pedido Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedCount.items.map((ci) => {
                      const itemObj = items.find((i) => i.id === ci.itemId);
                      if (!itemObj) return null;

                      // Formula: Suggested Order = Max Stock - Current Stock
                      const diffToMax = Math.max(0, itemObj.maxStock - ci.currentStock);
                      // Pack rounding if packQuantity > 1
                      const suggestedPacks = Math.ceil(diffToMax / itemObj.packQuantity);

                      const isOut = ci.currentStock === 0;
                      const isLow = ci.currentStock < itemObj.minStock;

                      return (
                        <tr key={ci.itemId} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">
                            {itemObj.name}
                          </td>
                          <td className="p-3 text-center text-slate-500">
                            {itemObj.minStock} {itemObj.storageUnit}
                          </td>
                          <td className="p-3 text-center text-slate-500">
                            {itemObj.maxStock} {itemObj.storageUnit}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-medium">
                            {ci.previousStock} {itemObj.storageUnit}
                          </td>
                          <td className="p-3 text-center font-extrabold text-slate-900">
                            {ci.currentStock} {itemObj.storageUnit}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-700">
                            {ci.estimatedConsumption} {itemObj.storageUnit}
                          </td>
                          <td className="p-3 text-center">
                            {isOut ? (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                Sin Stock
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                Bajo Mínimo
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                En Rango
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-black text-orange-600 bg-orange-50/50">
                            {suggestedPacks} {itemObj.purchaseUnit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 text-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition text-center"
          >
            Cancelar
          </button>

          {step === 'counting' ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Borrador</span>
              </button>

              <button
                onClick={handleFinishCount}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Conteo</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (completedCount) onProceedToOrder(completedCount);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition w-full sm:w-auto"
            >
              <span>Proceder a Revisar y Generar Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
