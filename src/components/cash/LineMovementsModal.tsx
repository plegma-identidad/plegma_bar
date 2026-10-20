import React, { useState } from 'react';
import {
  X,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StandardDataTable } from '../ui/DataTable';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import {
  CashLine,
  CashMovement,
  CashMovementType,
  CashIncomeCategory,
  CashExpenseCategory,
} from '../../types';
import { useApp } from '../../context/AppContext';

interface LineMovementsModalProps {
  line: CashLine;
  movements: CashMovement[];
  onClose: () => void;
  onAddMovement: (mov: Omit<CashMovement, 'id' | 'dateTime' | 'userId' | 'userName'>) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const INCOME_CATEGORIES: { value: CashIncomeCategory; label: string }[] = [
  { value: 'Cobro de Ticket / Venta POS', label: '🟢 Cobro de Ticket / Venta POS' },
  { value: 'Aporte de Cambio / Fondo Extra', label: '💵 Aporte de Cambio / Fondo Extra' },
  { value: 'Cobro de Cuenta Corriente', label: '💳 Cobro de Cuenta Corriente' },
  { value: 'Traspaso Entrante de otra Caja', label: '🔄 Traspaso Entrante de otra Caja' },
  { value: 'Ingreso Varios / Ajuste Positivo', label: '➕ Ingreso Varios / Ajuste Positivo' },
];

const EXPENSE_CATEGORIES: { value: CashExpenseCategory; label: string }[] = [
  { value: 'Gasto Operativo / Compras Menores', label: '🔴 Gasto Operativo / Compras Menores' },
  { value: 'Pago a Proveedor', label: '📦 Pago a Proveedor' },
  { value: 'Consumo Interno', label: '☕ Consumo Interno' },
  { value: 'Retiro a Caja Fuerte / Maestra', label: '🏛️ Retiro a Caja Fuerte / Maestra' },
  { value: 'Traspaso Saliente a otra Caja', label: '🔄 Traspaso Saliente a otra Caja' },
  { value: 'Adelanto de Sueldo / Vale', label: '👤 Adelanto de Sueldo / Vale' },
  { value: 'Salida Varios / Ajuste Negativo', label: '➖ Salida Varios / Ajuste Negativo' },
];

export const LineMovementsModal: React.FC<LineMovementsModalProps> = ({
  line,
  movements,
  onClose,
  onAddMovement,
}) => {
  const { masterCashBoxes, cashLines, withdrawCashToMaster, transferCashBetweenLines, showToast } = useApp();

  // Resolve current line dynamically from live context state
  const currentLine = cashLines.find((l) => l.id === line.id) || line;

  const [isAdding, setIsAdding] = useState(false);
  const [nature, setNature] = useState<'Ingreso' | 'Salida'>('Ingreso');
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0].value);
  const [origin, setOrigin] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [targetMasterId, setTargetMasterId] = useState<string>(
    masterCashBoxes.find((mb) => mb.active !== false)?.id || masterCashBoxes[0]?.id || ''
  );
  const [targetLineId, setTargetLineId] = useState<string>('');
  const [error, setError] = useState('');

  const lineMovements = movements.filter((m) => m.lineId === currentLine.id);
  const otherLinesInShift = cashLines.filter((l) => l.shiftId === currentLine.shiftId && l.id !== currentLine.id && l.status === 'Abierta');

  const handleNatureChange = (newNature: 'Ingreso' | 'Salida') => {
    setNature(newNature);
    if (newNature === 'Ingreso') {
      setCategory(INCOME_CATEGORIES[0].value);
    } else {
      setCategory(EXPENSE_CATEGORIES[0].value);
    }
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountStr);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Ingrese un monto válido superior a cero.');
      return;
    }

    // Special cases: Retiro a Caja Maestra o Traspaso entre Cajas
    if (nature === 'Salida' && category === 'Retiro a Caja Fuerte / Maestra') {
      if (!targetMasterId) {
        setError('Debe seleccionar una Caja Maestra de destino.');
        return;
      }
      const res = withdrawCashToMaster({
        lineId: currentLine.id,
        amount: amountVal,
        masterBoxId: targetMasterId,
        notes: notes.trim() || origin.trim() || undefined,
      });
      if (res.success) {
        showToast(res.message, 'success');
        resetForm();
      } else {
        setError(res.message);
      }
      return;
    }

    if (nature === 'Salida' && category === 'Traspaso Saliente a otra Caja') {
      if (!targetLineId) {
        setError('Debe seleccionar una caja operativa de destino.');
        return;
      }
      const res = transferCashBetweenLines({
        sourceLineId: currentLine.id,
        targetLineId: targetLineId,
        amount: amountVal,
        notes: notes.trim() || origin.trim() || undefined,
      });
      if (res.success) {
        showToast(res.message, 'success');
        resetForm();
      } else {
        setError(res.message);
      }
      return;
    }

    // Standard Ingreso or Salida movement
    if (!origin.trim()) {
      setError('Ingrese la referencia u origen del movimiento.');
      return;
    }

    const movType: CashMovementType = nature === 'Ingreso' ? 'Ingreso' : 'Salida';
    const finalAmount = nature === 'Ingreso' ? Math.abs(amountVal) : -Math.abs(amountVal);

    onAddMovement({
      lineId: currentLine.id,
      shiftId: currentLine.shiftId,
      type: movType,
      category,
      categoryType: nature,
      origin: origin.trim(),
      voucherNumber: voucherNumber.trim() || undefined,
      amount: finalAmount,
      notes: notes.trim() || undefined,
    });

    showToast(`Movimiento de ${nature} registrado con éxito en ${currentLine.boxType}.`, 'success');
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setOrigin('');
    setVoucherNumber('');
    setAmountStr('');
    setNotes('');
    setError('');
  };

  const columns = [
    {
      key: 'dateTime',
      header: 'Fecha y Hora',
      sortable: true,
      render: (m: CashMovement) => <span className="font-mono text-slate-600 text-xs">{m.dateTime}</span>,
    },
    {
      key: 'type',
      header: 'Tipo y Categoría',
      sortable: true,
      render: (m: CashMovement) => {
        const isPos = m.amount > 0;
        return (
          <div className="space-y-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isPos
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isPos ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
              {m.type}
            </span>
            {m.category && <p className="text-[10px] text-slate-500 font-semibold">{m.category}</p>}
          </div>
        );
      },
    },
    {
      key: 'origin',
      header: 'Origen / Referencia',
      sortable: true,
      render: (m: CashMovement) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{m.origin}</p>
          {m.voucherNumber && <p className="text-[10px] text-slate-400 font-mono">N° {m.voucherNumber}</p>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Importe',
      sortable: true,
      align: 'right' as const,
      render: (m: CashMovement) => (
        <span className={`font-black text-xs ${m.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {m.amount >= 0 ? `+${fmt(m.amount)}` : fmt(m.amount)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Usuario',
      render: (m: CashMovement) => <span className="text-slate-600 text-xs font-medium">{m.userName}</span>,
    },
    {
      key: 'notes',
      header: 'Observación',
      render: (m: CashMovement) => <span className="text-slate-500 text-xs max-w-xs truncate">{m.notes || '-'}</span>,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                Movimientos de Línea: <span className="text-amber-400">{currentLine.boxType}</span>
              </h3>
              <p className="text-xs text-slate-400">Historial completo, ingresos, salidas y retiros</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Monto Inicio</p>
              <p className="text-sm font-black text-slate-900">{fmt(currentLine.initialAmount)}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <p className="text-[10px] text-emerald-600 uppercase font-bold">+ Total Ingresos</p>
              <p className="text-sm font-black text-emerald-700">+{fmt(currentLine.ticketsTotal)}</p>
            </div>
            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-2xl">
              <p className="text-[10px] text-rose-600 uppercase font-bold">- Total Salidas / Retiros</p>
              <p className="text-sm font-black text-rose-700">-{fmt(currentLine.expensesTotal + currentLine.withdrawalsTotal)}</p>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl">
              <p className="text-[10px] text-amber-600 uppercase font-bold">Monto Teórico Actual</p>
              <p className="text-sm font-black text-amber-700">{fmt(currentLine.theoreticalAmount)}</p>
            </div>
          </div>

          {/* Inline Add Movement Form if Line is open */}
          {currentLine.status === 'Abierta' && (
            <div>
              {!isAdding ? (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs"
                  >
                    Registrar Ingreso / Salida / Retiro
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateMovement}
                  className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                      <Plus className="w-4 h-4 text-indigo-600" /> Registrar Nuevo Movimiento en {line.boxType}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {error}
                    </p>
                  )}

                  {/* Selector de Naturaleza (Ingreso vs Salida) */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleNatureChange('Ingreso')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                        nature === 'Ingreso'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      🟢 INGRESO DE DINERO (+)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNatureChange('Salida')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                        nature === 'Salida'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      🔴 SALIDA / RETIRO (-)
                    </button>
                  </div>

                  {/* Dynamic Category Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label={nature === 'Ingreso' ? 'Tipo de Ingreso' : 'Tipo de Salida'} required>
                      <SelectInput
                        options={nature === 'Ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </FormField>

                    {/* Conditional Target Selectors for Retiro or Transfer */}
                    {nature === 'Salida' && category === 'Retiro a Caja Fuerte / Maestra' ? (
                      <FormField label="Caja Maestra de Destino" required hint="Destino del retiro">
                        <SelectInput
                          options={masterCashBoxes
                            .filter((mb) => mb.active !== false)
                            .map((mb) => ({
                              value: mb.id,
                              label: `🏛️ ${mb.name} (${mb.boxType})`,
                            }))}
                          value={targetMasterId}
                          onChange={(e) => setTargetMasterId(e.target.value)}
                        />
                      </FormField>
                    ) : nature === 'Salida' && category === 'Traspaso Saliente a otra Caja' ? (
                      <FormField label="Caja Operativa de Destino" required hint="Caja receptora">
                        <SelectInput
                          options={
                            otherLinesInShift.length > 0
                              ? otherLinesInShift.map((l) => ({
                                  value: l.id,
                                  label: `💳 ${l.boxType} (Turno Activo)`,
                                }))
                              : [{ value: '', label: 'No hay otras cajas abiertas' }]
                          }
                          value={targetLineId}
                          onChange={(e) => setTargetLineId(e.target.value)}
                        />
                      </FormField>
                    ) : (
                      <FormField label="Origen / Referencia" required hint="Ej. Cobro Mesa 4, Pago Prov.">
                        <TextInput
                          placeholder="Ej. Cobro Mesa 10, Aporte de cambio..."
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                        />
                      </FormField>
                    )}

                    <FormField label="Monto ($)" required hint="Importe positivo a aplicar">
                      <TextInput
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="N° Comprobante / Recibo (opcional)">
                      <TextInput
                        placeholder="Ej. TKT-00109 / FAC-441"
                        value={voucherNumber}
                        onChange={(e) => setVoucherNumber(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Observaciones o Notas Adicionales">
                      <TextInput
                        placeholder="Detalle explicativo del movimiento"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className={nature === 'Ingreso' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}
                    >
                      Confirmar {nature}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Table */}
          <StandardDataTable
            data={lineMovements}
            columns={columns}
            keyExtractor={(m) => m.id}
            title="Trazabilidad Auditora de Movimientos"
            searchFilterKey={(m) => `${m.origin} ${m.type} ${m.category || ''} ${m.userName} ${m.voucherNumber || ''}`}
            searchPlaceholder="Buscar por origen, tipo, categoría, comprobante o usuario..."
            emptyMessage="No se han registrado movimientos en esta línea de caja."
            emptyIcon={<FileText className="w-8 h-8 text-slate-300" />}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
