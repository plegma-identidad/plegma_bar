import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClockRecord } from '../types';
import { X, Edit3, Save, Ban, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ui/ConfirmModal';

interface ClockCorrectionModalProps {
  record: ClockRecord;
  onClose: () => void;
}

type ConfirmState = {
  isOpen: boolean;
  step: 'confirm' | 'success';
  type: 'danger' | 'warning' | 'success';
  title: string;
  message: string;
};

export const ClockCorrectionModal: React.FC<ClockCorrectionModalProps> = ({ record, onClose }) => {
  const { correctClockRecord, voidClockRecord, deleteClockRecord, showToast } = useApp();

  const handleDeleteRecord = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar definitivamente la marcación de ${record.employeeName} (${record.checkIn})?`)) {
      deleteClockRecord(record.id);
      showToast('Marcación eliminada correctamente.', 'info');
      onClose();
    }
  };

  const formatForInput = (str?: string) => {
    if (!str) return '';
    return str.replace(' ', 'T');
  };

  const formatForStorage = (str: string) => {
    return str.replace('T', ' ');
  };

  const [checkIn, setCheckIn] = useState(formatForInput(record.checkIn));
  const [checkOut, setCheckOut] = useState(formatForInput(record.checkOut));
  const [isVoiding, setIsVoiding] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<ConfirmState>({
    isOpen: false,
    step: 'confirm',
    type: 'warning',
    title: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isVoiding) {
      setConfirmConfig({
        isOpen: true,
        step: 'confirm',
        type: 'danger',
        title: 'Confirmar Anulación',
        message: `¿Está seguro de ANULAR la marcación de ${record.employeeName}? Se requiere justificación.`
      });
      return;
    }

    if (!checkIn) {
      alert('La fecha y hora de entrada es obligatoria.');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      step: 'confirm',
      type: 'warning',
      title: 'Confirmar Modificación',
      message: `¿Está seguro de modificar los horarios de esta marcación? Se requiere justificación.`
    });
  };

  const handleConfirmAction = (inputValue?: string) => {
    if (confirmConfig.step === 'success') {
      onClose();
      return;
    }

    const reason = inputValue?.trim() || '';

    if (isVoiding) {
      voidClockRecord(record.id, reason);
      setConfirmConfig({
        isOpen: true,
        step: 'success',
        type: 'success',
        title: 'Anulación Exitosa',
        message: 'La marcación ha sido anulada correctamente.'
      });
    } else {
      correctClockRecord(
        record.id,
        formatForStorage(checkIn),
        checkOut ? formatForStorage(checkOut) : '',
        reason
      );
      setConfirmConfig({
        isOpen: true,
        step: 'success',
        type: 'success',
        title: 'Modificación Exitosa',
        message: 'La marcación ha sido corregida correctamente.'
      });
    }
  };

  return (
    <>
      {confirmConfig.step !== 'success' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black shadow-md">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">Corregir / Auditar Marcación</h3>
                <p className="text-xs text-slate-400">
                  Ajuste manual de horas trabajadas para {record.employeeName}
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

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
            {/* Employee Readonly Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">{record.employeeName}</span>
                <span className="font-mono text-slate-500 text-xs">DNI: {record.dni}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Valor Hora Congelado</span>
                <span className="font-mono font-black text-slate-900 text-xs">
                  $ {record.hourlyRate.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha & Hora Entrada (*):</label>
                <input
                  type="datetime-local"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha & Hora Salida:</label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            {/* Action options */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsVoiding(!isVoiding)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  isVoiding
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isVoiding ? 'Modo Anulación Activo' : 'Anular Marcación'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteRecord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-rose-600 hover:text-white border border-slate-200 transition"
                title="Eliminar esta marcación de la aplicación"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Definitivamente</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={`flex items-center justify-center gap-2 px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition text-white ${
                  isVoiding ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isVoiding ? 'Confirmar Anulación' : 'Guardar Corrección'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        requiresInput={confirmConfig.step === 'confirm'}
        inputLabel="Motivo de la corrección / auditoría"
        inputPlaceholder="Ej.: Ajuste por marcación omitida"
        confirmText={confirmConfig.step === 'success' ? 'Aceptar' : 'Confirmar'}
        showCancel={confirmConfig.step === 'confirm'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </>
  );
};

