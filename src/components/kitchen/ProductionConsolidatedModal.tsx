import React from 'react';
import { ConsolidatedProductionItem } from '../../types';
import {
  Flame,
  X,
  Layers,
  AlertCircle,
  FileText,
  Printer,
  CheckCircle,
} from 'lucide-react';

interface ProductionConsolidatedModalProps {
  items: ConsolidatedProductionItem[];
  selectedBatchCount?: number;
  onClose: () => void;
}

export const ProductionConsolidatedModal: React.FC<ProductionConsolidatedModalProps> = ({
  items,
  selectedBatchCount,
  onClose,
}) => {
  const totalDishes = items.reduce((acc, i) => acc + i.totalQuantity, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Resumen Consolidado de Producción</span>
              </h2>
              <p className="text-xs text-slate-400">
                {selectedBatchCount
                  ? `Agrupación de ${selectedBatchCount} comanda(s) en preparación`
                  : 'Total consolidado de platos activos en cocina'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Superior */}
        <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-bold">Variedades únicas:</span>
            <span className="font-mono font-black text-amber-400">{items.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold">Total Platos a Elaborar:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-sm">
              {totalDishes} u
            </span>
          </div>
        </div>

        {/* Contenido / Listado Consolidado */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="font-bold text-sm">No hay preparaciones pendientes de consolidar.</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.key || idx}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-600 transition"
              >
                <div className="flex items-start gap-3">
                  {/* Cantidad Total destacada */}
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                    {item.totalQuantity}×
                  </div>

                  <div>
                    {/* Nombre del Plato */}
                    <h3 className="font-black text-base text-white tracking-tight">
                      {item.productName}
                    </h3>

                    {/* Opciones / Variantes */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedOptions.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-700 text-amber-200 border border-slate-600"
                          >
                            {opt.optionName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Observación en Alto Contraste (Aislamiento) */}
                    {item.lineComment && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black border border-yellow-400 text-yellow-300 text-xs font-black">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span className="uppercase">{item.lineComment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comandas Involucradas */}
                <div className="text-left sm:text-right shrink-0 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Comandas:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5 justify-start sm:justify-end">
                    {item.orderNumbers.map((num) => (
                      <span
                        key={num}
                        className="font-mono text-xs font-black text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700"
                      >
                        #{num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie de Modal */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-700/60 text-slate-200 hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Resumen</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Entendido / Volver al Monitor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
