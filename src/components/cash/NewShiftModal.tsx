import React, { useState } from 'react';
import { X, Plus, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { TurnoType } from '../../types';

interface InitialLineConfig {
  boxType: string;
  initialAmount: number;
}

interface NewShiftModalProps {
  onClose: () => void;
  onConfirm: (
    shift: TurnoType,
    initialLines: { boxType: string; initialAmount: number }[],
    notes?: string
  ) => void;
}

const SHIFT_OPTIONS = [
  { value: 'Mañana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
];

import { useApp } from '../../context/AppContext';

export const NewShiftModal: React.FC<NewShiftModalProps> = ({ onClose, onConfirm }) => {
  const { operativeCashBoxes } = useApp();

  const activeBoxes = React.useMemo(() => {
    const list = operativeCashBoxes.filter((b) => b.active);
    return list.length > 0
      ? list
      : [
          { id: '1', name: 'Efectivo', defaultInitialAmount: 50000, active: true },
          { id: '2', name: 'Mercado Pago 1', defaultInitialAmount: 0, active: true },
          { id: '3', name: 'Cuenta Corriente', defaultInitialAmount: 0, active: true },
          { id: '4', name: 'Tarjeta Posnet', defaultInitialAmount: 0, active: true },
        ];
  }, [operativeCashBoxes]);

  const [shift, setShift] = useState<TurnoType>('Mañana');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Initial amounts map per box type (mandatory input for each active line)
  const [initialAmounts, setInitialAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activeBoxes.forEach((b) => {
      init[b.name] = String(b.defaultInitialAmount || 0);
    });
    return init;
  });

  React.useEffect(() => {
    setInitialAmounts((prev) => {
      const updated = { ...prev };
      activeBoxes.forEach((b) => {
        if (updated[b.name] === undefined) {
          updated[b.name] = String(b.defaultInitialAmount || 0);
        }
      });
      return updated;
    });
  }, [activeBoxes]);

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const generatedName = `${shift.toUpperCase()} ${dateStr}`;

  const handleAmountChange = (boxName: string, value: string) => {
    setInitialAmounts((prev) => ({
      ...prev,
      [boxName]: value,
    }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preparedLines: InitialLineConfig[] = [];
    for (const box of activeBoxes) {
      const valStr = initialAmounts[box.name];
      if (valStr === undefined || valStr.trim() === '') {
        setError(`Debe ingresar un monto inicial para la caja "${box.name}".`);
        return;
      }
      const num = parseFloat(valStr);
      if (isNaN(num) || num < 0) {
        setError(`El monto inicial para "${box.name}" debe ser un valor numérico válido mayor o igual a cero.`);
        return;
      }
      preparedLines.push({
        boxType: box.name,
        initialAmount: num,
      });
    }

    onConfirm(shift, preparedLines, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Apertura de Caja de Turno</h3>
              <p className="text-xs text-slate-400">
                Defina el turno y cargue de forma obligatoria los montos iniciales por caja
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Turno de Caja" required hint="Seleccione el turno a operar">
              <SelectInput
                options={SHIFT_OPTIONS}
                value={shift}
                onChange={(e) => setShift(e.target.value as TurnoType)}
              />
            </FormField>

            <FormField label="Nombre Autogenerado de Caja">
              <TextInput
                value={generatedName}
                readOnly
                disabled
                className="bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed"
              />
            </FormField>
          </div>

          {/* Preloaded Boxes Initial Amount Inputs */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Cajas y Medios Operativos Precargados
              </span>
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                * Carga de Monto Inicial Obligatoria
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeBoxes.map((box) => (
                <div
                  key={box.id || box.name}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-1.5"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-800 leading-tight block">
                      {box.name}
                    </label>
                    {box.description && (
                      <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                        {box.description}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0"
                      value={initialAmounts[box.name] ?? ''}
                      onChange={(e) => handleAmountChange(box.name, e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Observaciones de Apertura" hint="Notas operativas adicionales para el turno (opcional)">
            <TextInput
              placeholder="Ej. Apertura con cambio preparado para salón y barra..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleSubmit}
          >
            Abrir Caja de Turno
          </Button>
        </div>
      </div>
    </div>
  );
};
