import React from 'react';
import { LogIn, LogOut, CheckCircle2, X, Clock, User, ShieldCheck } from 'lucide-react';

interface ClockConfirmModalProps {
  isOpen: boolean;
  type: 'in' | 'out';
  employeeName: string;
  dni: string;
  position?: string;
  checkInTime?: string;
  currentTimeStr: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ClockConfirmModal: React.FC<ClockConfirmModalProps> = ({
  isOpen,
  type,
  employeeName,
  dni,
  position,
  checkInTime,
  currentTimeStr,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const isEntry = type === 'in';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Top Header */}
        <div
          className={`p-5 text-white flex items-center justify-between border-b ${
            isEntry
              ? 'bg-gradient-to-r from-emerald-700 to-teal-800 border-emerald-800'
              : 'bg-gradient-to-r from-indigo-800 to-slate-900 border-indigo-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                isEntry ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
              }`}
            >
              {isEntry ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {isEntry ? 'Confirmación de Ingreso' : 'Confirmación de Salida'}
              </h3>
              <p className="text-[11px] text-slate-200">
                {isEntry ? 'Registrar asistencia de entrada' : 'Cierre de marcación de jornada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl transition hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Employee Card Preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
              {employeeName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-slate-900 text-sm truncate">{employeeName}</h4>
              <p className="text-xs text-slate-500 font-mono">DNI: {dni}</p>
              {position && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {position}
                </span>
              )}
            </div>
          </div>

          {/* Time Summary Box */}
          <div
            className={`p-4 rounded-2xl border space-y-2 text-xs font-semibold ${
              isEntry
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Hora de {isEntry ? 'Ingreso' : 'Salida'}:</span>
              <span className="font-mono font-black text-sm text-slate-900 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-600" />
                {currentTimeStr.substring(11)} hs
              </span>
            </div>

            {!isEntry && checkInTime && (
              <div className="flex items-center justify-between pt-2 border-t border-indigo-200/70">
                <span className="text-slate-500 font-medium">Entrada Registrada:</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {checkInTime.substring(11)} hs ({checkInTime.substring(0, 10)})
                </span>
              </div>
            )}
          </div>

          {/* Confirmation Question */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-600 font-medium">
              {isEntry
                ? '¿Confirma que desea registrar el ingreso para este empleado?'
                : '¿Confirma que desea cerrar la jornada y registrar la salida para este empleado?'}
            </p>
            <p className="text-[11px] text-slate-400 italic">
              Esta acción guardará la hora en la terminal operativa.
            </p>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-lg transition ${
              isEntry
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEntry ? 'Sí, Confirmar Ingreso (OK)' : 'Sí, Registrar Salida (OK)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
