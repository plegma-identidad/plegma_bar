import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Receipt } from 'lucide-react';
import { SaleOrder } from '../../types';
import { useApp } from '../../context/AppContext';

interface SaleTicketModalProps {
  order: SaleOrder;
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export const SaleTicketModal: React.FC<SaleTicketModalProps> = ({ order, onClose }) => {
  const { branding } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn print:static print:bg-transparent print:p-0 print:block">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-h-none print:w-[80mm] print:mx-auto print:block print:rounded-none">
        
        {/* Header no-imprimible */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Ticket de Venta</h3>
              <p className="text-xs text-slate-400">Reimpresión de comprobante</p>
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

        {/* Action Bar no-imprimible */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-end print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </button>
        </div>

        {/* Ticket imprimible */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-900 font-sans print:p-0 print:overflow-visible print:block print:font-mono print:text-black print:text-sm">
          
          <div className="text-center border-b-2 border-slate-900 print:border-black print:border-dashed pb-4 mb-4">
            <h2 className="text-xl font-black uppercase print:text-2xl">{branding?.companyName || 'PLEGMA RESTO BAR'}</h2>
            <p className="text-xs text-slate-500 print:text-black mt-1">
              {branding?.companySubtitle || 'Ticket de Venta Interno'}
            </p>
            {branding?.cuit && (
              <p className="text-xs text-slate-500 print:text-black">CUIT: {branding.cuit}</p>
            )}
            {branding?.address && (
              <p className="text-xs text-slate-500 print:text-black">{branding.address}</p>
            )}
          </div>

          <div className="space-y-1 mb-4 print:text-xs">
            <div className="flex justify-between">
              <span>Ticket #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span className="font-bold">{order.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-bold">{order.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Canal / Mesa:</span>
              <span className="font-bold">{order.saleTypeName} {order.tableName ? `/ ${order.tableName}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Mozo:</span>
              <span className="font-bold">{order.createdByUserName}</span>
            </div>
          </div>

          <div className="border-t border-b border-slate-300 print:border-black print:border-dashed py-2 mb-4 space-y-2 print:text-xs">
            <div className="flex justify-between font-bold pb-1 border-b border-slate-200 print:border-black">
              <span>Cant x Item</span>
              <span>Total</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="w-2/3">
                  <span className="font-bold">{item.quantity}x</span> {item.productName}
                  {item.lineComment && (
                    <p className="text-[10px] text-slate-500 print:text-black italic pl-4">{item.lineComment}</p>
                  )}
                </div>
                <div className="w-1/3 text-right">
                  {fmt(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-right print:text-xs mb-4">
            <div className="flex justify-between text-slate-600 print:text-black">
              <span>Subtotal:</span>
              <span>{fmt(order.subtotalAmount || order.totalAmount)}</span>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-slate-600 print:text-black">
                <span>Descuento:</span>
                <span>-{fmt(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-300 print:border-black">
              <span>TOTAL:</span>
              <span>{fmt(order.finalTotal || order.totalAmount)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 print:text-black space-y-1 pt-4 border-t-2 border-slate-900 print:border-black print:border-dashed">
            <p className="font-bold uppercase">*** GRACIAS POR SU COMPRA ***</p>
            <p>Ticket No Fiscal</p>
            {order.paymentCondition && (
              <p>Pago: {order.paymentCondition} {order.paymentMethod ? `(${order.paymentMethod})` : ''}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
