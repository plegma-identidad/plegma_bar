import React, { useState } from 'react';
import { Expense, OperativeCashBox } from '../../types';
import { useApp } from '../../context/AppContext';
import { expensesService } from '../../services/expensesService';
import {
  X,
  CheckCircle2,
  DollarSign,
  Calendar,
  Wallet,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ExpensePaymentModalProps {
  expense: Expense;
  cashBoxes: OperativeCashBox[];
  onClose: () => void;
  onSuccess: (updatedExpense: Expense) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExpensePaymentModal: React.FC<ExpensePaymentModalProps> = ({
  expense,
  cashBoxes,
  onClose,
  onSuccess,
  showToast,
}) => {
  const { cashLines, cashShifts, recordCashMovement } = useApp();
  const [amount, setAmount] = useState<number>(expense.amount || 0);

  // Cajas del turno abierto actual
  const activeShift = cashShifts.find((s) => s.status === 'Abierta');
  const activeTurnLines = activeShift
    ? cashLines.filter((l) => l.shiftId === activeShift.id && l.status === 'Abierta')
    : [];

  const activeCashBoxes = cashBoxes.filter((c) => c.active);

  // Selección por defecto: si hay cajas de turno abiertas, sugerir la primera del turno
  const [selectedCashTarget, setSelectedCashTarget] = useState<string>(() => {
    if (activeTurnLines.length > 0) {
      return `line:${activeTurnLines[0].id}`;
    }
    return activeCashBoxes[0] ? `box:${activeCashBoxes[0].id}` : '';
  });

  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(expense.notes || '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      showToast('El importe a pagar debe ser mayor a 0.', 'error');
      return;
    }

    if (!selectedCashTarget) {
      showToast('Debe seleccionar una caja activa para efectuar el pago.', 'error');
      return;
    }

    let resolvedBoxId = '';
    let resolvedBoxName = '';
    let targetTurnLine: typeof activeTurnLines[0] | undefined;

    if (selectedCashTarget.startsWith('line:')) {
      const lineId = selectedCashTarget.replace('line:', '');
      targetTurnLine = activeTurnLines.find((l) => l.id === lineId);
      if (!targetTurnLine) {
        showToast('La caja del turno seleccionada ya no está abierta.', 'error');
        return;
      }
      // Buscar la caja operativa correspondiente para la foreign key de operative_cash_boxes
      const matchingOperativeBox = cashBoxes.find(
        (b) => b.name.trim().toLowerCase() === targetTurnLine!.boxType.trim().toLowerCase() || b.id === targetTurnLine!.boxType
      );
      resolvedBoxId = matchingOperativeBox?.id || '';
      resolvedBoxName = `${targetTurnLine.boxType} (${activeShift?.name || 'Turno Abierto'})`;
    } else {
      const boxId = selectedCashTarget.replace('box:', '');
      const generalBox = cashBoxes.find((b) => b.id === boxId);
      if (!generalBox) {
        showToast('La caja seleccionada no es válida.', 'error');
        return;
      }
      resolvedBoxId = generalBox.id;
      resolvedBoxName = generalBox.name;

      // Si existe línea abierta con el mismo nombre en el turno actual, vincularla también
      targetTurnLine = activeTurnLines.find(
        (l) => l.boxType.trim().toLowerCase() === generalBox.name.trim().toLowerCase()
      );
    }

    setIsSubmitting(true);

    try {
      // 1. Si hay línea de turno activa, registrar el movimiento directo en el turno de caja
      if (targetTurnLine && activeShift) {
        await recordCashMovement({
          lineId: targetTurnLine.id,
          shiftId: activeShift.id,
          type: 'Gasto',
          category: 'Gasto ' + expense.origin,
          categoryType: 'Salida',
          origin: `Gasto #${expense.expenseNumber} - ${expense.concept}`,
          voucherNumber: `EXP-${expense.expenseNumber}`,
          amount: amount,
          notes: notes || `Pago a proveedor ${expense.providerName}`,
        });
      }

      // 2. Actualizar el gasto en la bandeja
      const res = await expensesService.payExpense(expense, {
        cashBoxId: resolvedBoxId,
        cashBoxName: resolvedBoxName,
        paymentDate: new Date(`${paymentDate}T12:00:00`).toISOString(),
        amount,
        notes,
        file: file || undefined,
        paidByUserName: 'Usuario Autenticado',
      });

      if (res.success && res.expense) {
        showToast(
          targetTurnLine
            ? `Pago de $ ${amount.toLocaleString('es-AR')} descontado de ${targetTurnLine.boxType} en el turno actual.`
            : 'Pago registrado exitosamente.',
          'success'
        );
        onSuccess(res.expense);
        onClose();
      } else {
        showToast(res.message || 'Error al procesar el pago.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error inesperado al pagar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Pagar Gasto #{expense.expenseNumber}
              </h3>
              <p className="text-xs text-slate-400">
                {expense.concept} • Proveedor: <strong className="text-white">{expense.providerName}</strong>
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-slate-50">
          {/* Monto a pagar */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Importe a Pagar ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Puedes ajustar el importe final según la factura o comprobante recibido.
            </p>
          </div>

          {/* Caja activa de egreso */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Caja de Egreso *
            </label>
            <div className="relative">
              <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                required
                value={selectedCashTarget}
                onChange={(e) => setSelectedCashTarget(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Seleccione una caja de egreso --</option>

                {/* GRUPO 1: Cajas del Turno Activo */}
                {activeTurnLines.length > 0 && (
                  <optgroup label={`🟢 Cajas del Turno Abierto (${activeShift?.name || 'Turno Actual'})`}>
                    {activeTurnLines.map((line) => (
                      <option key={line.id} value={`line:${line.id}`}>
                        🟢 {line.boxType} — Saldo Disponible: $ {line.theoreticalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* GRUPO 2: Cajas Maestras / Generales */}
                <optgroup label="📁 Cajas Maestras / Generales">
                  {activeCashBoxes.map((box) => (
                    <option key={box.id} value={`box:${box.id}`}>
                      📁 {box.name} ({box.location || 'Local'})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {activeTurnLines.length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1.5 font-medium flex items-center gap-1 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                No hay un turno de caja abierto en este momento. El pago se registrará en la caja general.
              </p>
            )}
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Fecha de Pago *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Comprobante / Archivo adjunto */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Comprobante / Factura (Opcional)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-500 transition bg-white cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf,image/*,video/mp4"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 font-bold">
                    Haz clic o arrastra el comprobante aquí
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Formatos admitidos: PDF, JPG, PNG, WEBP, MP4 (máx 15MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Detalle / Notas */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Observaciones del Pago (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Ej: Transferencia Bancaria N° 994821..."
            />
          </div>

          {/* Footer botones */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

