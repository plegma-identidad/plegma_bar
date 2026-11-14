import React, { useState } from 'react';
import { Expense, Provider, OperativeCashBox } from '../../types';
import { expensesService } from '../../services/expensesService';
import {
  X,
  Edit2,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface ExpenseEditModalProps {
  expense: Expense;
  providers: Provider[];
  cashBoxes: OperativeCashBox[];
  onClose: () => void;
  onSuccess: (updatedExpense: Expense) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  expense,
  providers,
  cashBoxes,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [date, setDate] = useState<string>(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [providerId, setProviderId] = useState<string>(expense.providerId || '');
  const [concept, setConcept] = useState<string>(expense.concept);
  const [amount, setAmount] = useState<number>(expense.amount);
  const [cashBoxId, setCashBoxId] = useState<string>(expense.cashBoxId || '');
  const [notes, setNotes] = useState<string>(expense.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeProviders = providers.filter((p) => p.active !== false);
  const activeCashBoxes = cashBoxes.filter((c) => c.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concept.trim()) {
      showToast('El concepto del gasto es obligatorio.', 'error');
      return;
    }

    if (amount <= 0) {
      showToast('El monto debe ser mayor a 0.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProvider = providers.find((p) => p.id === providerId);
      const selectedBox = cashBoxes.find((b) => b.id === cashBoxId);

      const res = await expensesService.updateExpense(expense.id, {
        concept: concept.trim(),
        date,
        amount,
        providerId: selectedProvider?.id,
        providerName: selectedProvider?.name || expense.providerName,
        cashBoxId: selectedBox?.id,
        cashBoxName: selectedBox?.name,
        notes: notes.trim(),
      });

      if (res.success && res.expense) {
        showToast('Gasto pendiente modificado exitosamente.', 'success');
        onSuccess(res.expense);
        onClose();
      } else {
        showToast(res.message || 'Error al actualizar gasto.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error inesperado al guardar cambios.', 'error');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Editar Gasto #{expense.expenseNumber} (Pendiente)
              </h3>
              <p className="text-xs text-slate-400">
                Origen: <strong className="text-amber-300">{expense.origin}</strong> • Modificación de datos previos al pago
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
          {/* Concepto */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Concepto / Descripción del Gasto *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej.: Reparación de heladera exhibidora..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Fila Fecha y Monto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Fecha *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Importe ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Proveedor Asignado
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Proveedor eventual / sin asignar --</option>
                {activeProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.rubro ? `(${p.rubro})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caja Sugerida */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Caja Operativa Sugerida
            </label>
            <select
              value={cashBoxId}
              onChange={(e) => setCashBoxId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Sin caja predeterminada --</option>
              {activeCashBoxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.type})
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Observaciones / Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el gasto, presupuesto o número de remito..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Botones */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

