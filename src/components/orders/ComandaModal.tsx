import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { SaleOrder } from '../../types';

interface ComandaModalProps {
  order: SaleOrder;
  onClose: () => void;
  onConfirmSendComanda?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export const ComandaModal: React.FC<ComandaModalProps> = ({ order, onClose, onConfirmSendComanda }) => {
  const handlePrint = async () => {
    if (onConfirmSendComanda) {
      await onConfirmSendComanda();
    }
    window.print();
  };

  // Group items by Kitchen / Bar category
  const kitchenItems = order.items.filter((i) => i.category !== 'Bebidas');
  const barItems = order.items.filter((i) => i.category === 'Bebidas');

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn print:static print:bg-transparent print:p-0 print:block">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-[80mm] print:mx-auto print:block print:rounded-none">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Comanda de Producción (Cocina / Barra)</h3>
              <p className="text-xs text-slate-400">Emisión de comprobante PDF y registro T2 (A05)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Comanda Document */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-900 font-sans print:p-0 print:space-y-4 print:overflow-visible print:block print:font-mono print:text-black">
          {/* Top Banner */}
          <div className="border-b-2 border-slate-900 print:border-black print:border-dashed pb-3 flex items-center justify-between print:flex-col print:text-center print:justify-center">
            <div className="print:w-full">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 print:text-black print:text-xs">PLEGMA RESTO BAR</span>
              <h2 className="text-xl font-black text-slate-900 print:text-2xl print:mt-1">COMANDA</h2>
            </div>
            <div className="text-right print:text-center print:mt-2">
              <span className="text-2xl font-black font-mono text-slate-900 print:text-3xl">#{order.orderNumber}</span>
              <p className="text-[10px] text-slate-500 font-mono print:text-black print:text-xs">{order.createdAt}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-100 p-3 rounded-xl text-xs font-bold print:block print:bg-transparent print:p-0 print:border-b print:border-black print:border-dashed print:pb-3 print:space-y-1">
            <div className="print:flex print:justify-between">
              <span className="text-slate-400 text-[10px] block uppercase print:text-black print:text-xs print:inline">Canal:</span>
              <span className="text-slate-800 print:text-black print:text-xs print:inline"> {order.saleTypeName}</span>
            </div>
            <div className="print:flex print:justify-between">
              <span className="text-slate-400 text-[10px] block uppercase print:text-black print:text-xs print:inline">Mesa:</span>
              <span className="text-amber-700 print:text-black print:text-xs print:inline"> {order.tableName || 'N/A'}</span>
            </div>
            <div className="print:flex print:justify-between">
              <span className="text-slate-400 text-[10px] block uppercase print:text-black print:text-xs print:inline">Mozo:</span>
              <span className="text-slate-800 print:text-black print:text-xs print:inline"> {order.createdByUserName}</span>
            </div>
          </div>

          {/* Kitchen Items Section */}
          {kitchenItems.length > 0 && (
            <div className="space-y-2 print:space-y-1">
              <h4 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1 print:text-black print:border-black print:text-sm print:text-center">
                -- COCINA --
              </h4>
              <div className="space-y-2 print:space-y-0">
                {kitchenItems.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-start print:p-1 print:bg-transparent print:border-0 print:border-b print:border-dashed print:border-slate-300 print:rounded-none">
                    <div className="w-full">
                      <p className="font-black text-slate-900 text-sm print:text-base print:flex print:items-start">
                        <span className="inline-block w-6 h-6 bg-slate-900 text-white rounded-lg text-center leading-6 font-mono text-xs mr-2 print:w-auto print:h-auto print:bg-transparent print:text-black print:text-lg print:border-none print:mr-3">
                          {item.quantity}x
                        </span>
                        <span className="print:mt-0.5">{item.productName}</span>
                      </p>
                      {item.sideOption && (
                        <p className="text-xs text-indigo-700 font-bold ml-8 mt-0.5 print:text-black print:ml-8 print:text-sm">
                          + Acomp: {item.sideOption}
                        </p>
                      )}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="ml-8 mt-0.5 text-xs text-indigo-700 font-bold print:text-black print:ml-8 print:text-sm">
                          {item.selectedOptions.map((opt, idx) => (
                            <p key={idx}>+ {opt.groupName}: {opt.optionName}</p>
                          ))}
                        </div>
                      )}
                      {item.lineComment && (
                        <p className="text-xs text-amber-700 font-bold ml-8 mt-0.5 italic print:text-black print:ml-8 print:text-sm">
                          * {item.lineComment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar Items Section */}
          {barItems.length > 0 && (
            <div className="space-y-2 print:space-y-1 print:mt-4">
              <h4 className="text-xs font-black uppercase text-emerald-900 border-b border-emerald-200 pb-1 print:text-black print:border-black print:text-sm print:text-center">
                -- BARRA --
              </h4>
              <div className="space-y-2 print:space-y-0">
                {barItems.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-start print:p-1 print:bg-transparent print:border-0 print:border-b print:border-dashed print:border-slate-300 print:rounded-none">
                    <div className="w-full">
                      <p className="font-black text-slate-900 text-sm print:text-base print:flex print:items-start">
                        <span className="inline-block w-6 h-6 bg-emerald-700 text-white rounded-lg text-center leading-6 font-mono text-xs mr-2 print:w-auto print:h-auto print:bg-transparent print:text-black print:text-lg print:border-none print:mr-3">
                          {item.quantity}x
                        </span>
                        <span className="print:mt-0.5">{item.productName}</span>
                      </p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="ml-8 mt-0.5 text-xs text-emerald-700 font-bold print:text-black print:ml-8 print:text-sm">
                          {item.selectedOptions.map((opt, idx) => (
                            <p key={idx}>+ {opt.groupName}: {opt.optionName}</p>
                          ))}
                        </div>
                      )}
                      {item.lineComment && (
                        <p className="text-xs text-amber-700 font-bold ml-8 mt-0.5 italic print:text-black print:ml-8 print:text-sm">
                          * {item.lineComment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.generalNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 print:bg-transparent print:border-black print:border-dashed print:p-2 print:mt-4 print:rounded-none">
              <span className="font-bold uppercase block text-[10px] print:text-black print:text-xs">Observación General:</span>
              <p className="print:text-black print:text-sm print:font-bold">{order.generalNotes}</p>
            </div>
          )}

          {/* Timestamp Footer */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex items-center justify-between font-mono print:border-black print:border-t-2 print:pt-4 print:text-black print:flex-col print:items-center print:gap-1">
            <span>Inicio: {order.t1CreatedAt}</span>
            <span>Impreso: {order.t2ComandaAt || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Imprimir & Enviar Comanda (A05)
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
