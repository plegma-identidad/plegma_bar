import React from 'react';
import { Expense } from '../../types';
import {
  X,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Wallet,
  Tag,
  AlertTriangle,
  Download,
  ExternalLink,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: Expense;
  onClose: () => void;
  onPay?: () => void;
  onVoid?: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
  onPay,
  onVoid,
}) => {
  const isPdf =
    expense.attachmentMime?.includes('pdf') ||
    expense.attachmentUrl?.toLowerCase().endsWith('.pdf') ||
    expense.attachmentName?.toLowerCase().endsWith('.pdf');

  const isVideo =
    expense.attachmentMime?.includes('video') ||
    expense.attachmentUrl?.toLowerCase().endsWith('.mp4') ||
    expense.attachmentName?.toLowerCase().endsWith('.mp4');

  const isImage =
    expense.attachmentMime?.includes('image') ||
    expense.attachmentUrl?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ||
    expense.attachmentName?.match(/\.(jpeg|jpg|png|webp|gif)$/i);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Gasto #{expense.expenseNumber} — {expense.concept}
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    expense.status === 'Pagado'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : expense.status === 'Pendiente'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {expense.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Origen: <strong className="text-white">{expense.origin}</strong> • Fecha:{' '}
                {expense.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con 2 columnas (Info & Visor) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Columna Izquierda: Datos del Gasto */}
          <div className="md:col-span-5 space-y-4">
            {/* Monto Principal */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Importe Total
              </span>
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                $ {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Datos Clave */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Proveedor
                </span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {expense.providerName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha Emisión
                  </span>
                  <span className="font-bold text-slate-700">{expense.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500" /> Origen
                  </span>
                  <span className="font-bold text-slate-700">{expense.origin}</span>
                </div>
              </div>

              {expense.cashBoxName && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[11px] flex items-center gap-1.5 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" /> Caja de Pago
                  </span>
                  <span className="font-bold text-slate-800">{expense.cashBoxName}</span>
                </div>
              )}

              {expense.paymentDate && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[11px] flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Fecha & Hora de Pago
                  </span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {new Date(expense.paymentDate).toLocaleString('es-AR')}
                  </span>
                  {expense.paidByUserName && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Registrado por: <strong>{expense.paidByUserName}</strong>
                    </span>
                  )}
                </div>
              )}

              {expense.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[11px] mb-1">
                    Detalle / Notas
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 whitespace-pre-wrap text-[11px]">
                    {expense.notes}
                  </p>
                </div>
              )}

              {/* Si está Anulado, mostrar motivo */}
              {expense.status === 'Anulado' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <div className="flex items-center gap-1.5 font-black text-rose-700 mb-1">
                    <AlertTriangle className="w-4 h-4" /> Registro Anulado
                  </div>
                  {expense.cancellationReason && (
                    <p className="text-[11px] font-medium">{expense.cancellationReason}</p>
                  )}
                  {expense.cancelledAt && (
                    <span className="text-[10px] text-rose-500 block mt-1">
                      Fecha: {new Date(expense.cancelledAt).toLocaleString('es-AR')} • Por:{' '}
                      {expense.cancelledByUserName || 'Usuario'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Visor de Archivo Adjunto */}
          <div className="md:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" /> Comprobante / Factura Adjunta
              </span>
              {expense.attachmentUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={expense.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" /> Abrir
                  </a>
                  <a
                    href={expense.attachmentUrl}
                    download={expense.attachmentName || 'comprobante'}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition shadow-2xs"
                  >
                    <Download className="w-3 h-3" /> Descargar
                  </a>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 flex items-center justify-center min-h-[340px] bg-slate-900/5">
              {expense.attachmentUrl ? (
                <>
                  {isPdf && (
                    <iframe
                      src={expense.attachmentUrl}
                      title="Comprobante PDF"
                      className="w-full h-full min-h-[380px] rounded-xl border border-slate-200 bg-white"
                    />
                  )}

                  {isImage && (
                    <div className="max-w-full max-h-[400px] flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      <img
                        src={expense.attachmentUrl}
                        alt="Comprobante"
                        className="max-h-[380px] max-w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {isVideo && (
                    <div className="w-full flex items-center justify-center p-2 bg-black rounded-xl">
                      <video
                        src={expense.attachmentUrl}
                        controls
                        className="max-h-[380px] max-w-full rounded-lg"
                      >
                        Tu navegador no soporta el formato de video.
                      </video>
                    </div>
                  )}

                  {!isPdf && !isImage && !isVideo && (
                    <div className="text-center p-6 space-y-3">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600 font-bold">
                        {expense.attachmentName || 'Archivo adjunto disponible'}
                      </p>
                      <a
                        href={expense.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir Comprobante
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">
                    No hay ningún comprobante adjunto a este gasto.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Puedes adjuntar facturas o tickets al registrar o pagar el gasto.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {expense.status !== 'Anulado' && onVoid && (
              <button
                type="button"
                onClick={onVoid}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
              >
                Anular Gasto
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cerrar
            </button>
            {expense.status === 'Pendiente' && onPay && (
              <button
                type="button"
                onClick={onPay}
                className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Proceder al Pago
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

