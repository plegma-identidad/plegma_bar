import React, { useState } from 'react';
import { X, DollarSign, ArrowRightLeft, Building2, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { CashLine, MasterCashBox, CashWithdrawalPayload } from '../../types';

interface TransferPayload {
  sourceLineId: string;
  targetType: 'MasterBox' | 'OperationalLine';
  targetId: string;
  amount: number;
  notes?: string;
}

interface WithdrawalModalProps {
  line: CashLine;
  allLines: CashLine[];
  masterBoxes: MasterCashBox[];
  onClose: () => void;
  onConfirmWithdrawal: (payload: CashWithdrawalPayload) => void;
  onConfirmTransfer?: (payload: { sourceLineId: string; targetLineId: string; amount: number; notes?: string }) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  line,
  allLines,
  masterBoxes,
  onClose,
  onConfirmWithdrawal,
  onConfirmTransfer,
}) => {
  const [destinationType, setDestinationType] = useState<'MasterBox' | 'OperationalLine'>('MasterBox');
  const [amountStr, setAmountStr] = useState('');
  const [targetId, setTargetId] = useState(masterBoxes[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Other open lines for inter-line transfer
  const otherLines = allLines.filter((l) => l.id !== line.id && l.status === 'Abierta');

  const activeMasterBoxes = masterBoxes.filter((mb) => mb.active !== false);

  const masterBoxOptions = activeMasterBoxes.map((mb) => ({
    value: mb.id,
    label: `${mb.name} (Saldo: ${fmt(mb.currentBalance)})`,
  }));

  const otherLineOptions = otherLines.map((l) => ({
    value: l.id,
    label: `${l.boxType} (Teórico: ${fmt(l.theoreticalAmount)})`,
  }));

  const handleDestinationTypeChange = (type: 'MasterBox' | 'OperationalLine') => {
    setDestinationType(type);
    setError('');
    if (type === 'MasterBox') {
      setTargetId(activeMasterBoxes[0]?.id || '');
    } else {
      setTargetId(otherLines[0]?.id || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      setError('Ingrese un monto de retiro/movimiento válido superior a cero.');
      return;
    }
    if (!targetId) {
      setError('Seleccione un destino válido para el movimiento de dinero.');
      return;
    }

    if (destinationType === 'MasterBox') {
      if (amount > line.theoreticalAmount && line.boxType === 'Efectivo') {
        if (
          !confirm(
            `El monto a retirar (${fmt(amount)}) supera el saldo teórico en la línea (${fmt(line.theoreticalAmount)}). ¿Desea continuar de todos modos?`
          )
        ) {
          return;
        }
      }
      onConfirmWithdrawal({
        lineId: line.id,
        amount,
        masterBoxId: targetId,
        notes,
      });
    } else {
      if (onConfirmTransfer) {
        onConfirmTransfer({
          sourceLineId: line.id,
          targetLineId: targetId,
          amount,
          notes,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Movimiento / Retiro de Dinero</h3>
              <p className="text-xs text-slate-400">Traspaso desde {line.boxType} a Caja Maestra u otra línea</p>
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
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Line summary pill */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Línea Operativa Origen</p>
              <p className="text-xs font-black text-slate-800">{line.boxType}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Monto Teórico Actual</p>
              <p className="text-sm font-black text-emerald-600">{fmt(line.theoreticalAmount)}</p>
            </div>
          </div>

          {/* Destination Type Toggle */}
          <FormField label="Tipo de Movimiento / Destino" required>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleDestinationTypeChange('MasterBox')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  destinationType === 'MasterBox'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Caja Maestra
              </button>
              <button
                type="button"
                onClick={() => handleDestinationTypeChange('OperationalLine')}
                disabled={otherLines.length === 0}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  destinationType === 'OperationalLine'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                } ${otherLines.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Otra Línea Caja
              </button>
            </div>
          </FormField>

          <FormField label="Monto a Movilizar ($)" required hint="Importe que se descontará de esta línea">
            <TextInput
              type="number"
              min="1"
              step="any"
              placeholder="Ej. 10000"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError('');
              }}
            />
          </FormField>

          {destinationType === 'MasterBox' ? (
            <FormField label="Caja Maestra Destino" required hint="Caja maestra para depositar el retiro">
              <SelectInput
                options={masterBoxOptions}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              />
            </FormField>
          ) : (
            <FormField label="Línea Operativa Destino" required hint="Línea de turno abierta que recibirá los fondos">
              {otherLines.length === 0 ? (
                <p className="text-xs text-rose-600 font-semibold p-2 bg-rose-50 rounded-xl">
                  No hay otras líneas abiertas disponibles en este turno.
                </p>
              ) : (
                <SelectInput
                  options={otherLineOptions}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              )}
            </FormField>
          )}

          <FormField label="Observaciones / Justificación" hint="Motivo del movimiento o transporte de dinero">
            <TextInput
              placeholder="Ej. Retiro parcial de seguridad / Traspaso de cambio a caja principal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<DollarSign className="w-4 h-4" />}>
              Confirmar Movimiento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
