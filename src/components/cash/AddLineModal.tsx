import React, { useState } from 'react';
import { X, CreditCard, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';

interface AddLineModalProps {
  onClose: () => void;
  onConfirm: (boxType: string, initialAmount: number) => void;
}

import { useApp } from '../../context/AppContext';

export const AddLineModal: React.FC<AddLineModalProps> = ({ onClose, onConfirm }) => {
  const { operativeCashBoxes } = useApp();

  const options = React.useMemo(() => {
    const list = operativeCashBoxes.filter((b) => b.active);
    if (list.length === 0) {
      return [{ value: 'Efectivo', label: 'Efectivo (Caja Chica)' }];
    }
    return list.map((b) => ({
      value: b.name,
      label: b.description ? `${b.name} — ${b.description}` : b.name,
    }));
  }, [operativeCashBoxes]);

  const [boxType, setBoxType] = useState(() => options[0]?.value || 'Efectivo');
  const [initialAmountStr, setInitialAmountStr] = useState(() => {
    const match = operativeCashBoxes.find((b) => b.name === (options[0]?.value || 'Efectivo'));
    return String(match?.defaultInitialAmount || 0);
  });

  const handleBoxTypeChange = (selectedName: string) => {
    setBoxType(selectedName);
    const match = operativeCashBoxes.find((b) => b.name === selectedName);
    if (match) {
      setInitialAmountStr(String(match.defaultInitialAmount || 0));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(initialAmountStr) || 0;
    onConfirm(boxType, amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Agregar Línea de Caja</h3>
              <p className="text-xs text-slate-400">Seleccione el medio de pago e importe inicial</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Tipo de Caja / Medio de Pago" required hint="Defina el medio operativo a controlar">
            <SelectInput
              options={options}
              value={boxType}
              onChange={(e) => handleBoxTypeChange(e.target.value)}
            />
          </FormField>

          <FormField label="Monto Inicio Caja ($)" required hint="Ingrese el saldo inicial/cambio de esta línea">
            <TextInput
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={initialAmountStr}
              onChange={(e) => setInitialAmountStr(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Agregar Línea
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
