import React, { useState } from 'react';
import { Expense, Provider, OperativeCashBox } from '../../types';
import { useApp } from '../../context/AppContext';
import { expensesService } from '../../services/expensesService';
import {
  X,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  Wallet,
  Tag,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface ExpenseModalProps {
  providers: Provider[];
  cashBoxes: OperativeCashBox[];
  onClose: () => void;
  onSuccess: (newExpense: Expense) => void;
  onNewProvider?: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  providers,
  cashBoxes,
  onClose,
  onSuccess,
  onNewProvider,
  showToast,
}) => {
  const { cashLines, cashShifts, recordCashMovement } = useApp();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [providerId, setProviderId] = useState<string>('');
  const [concept, setConcept] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<'Pendiente' | 'Pagado'>('Pendiente');

  // Cajas del turno abierto actual
  const activeShift = cashShifts.find((s) => s.status === 'Abierta');
  const activeTurnLines = activeShift
    ? cashLines.filter((l) => l.shiftId === activeShift.id && l.status === 'Abierta')
    : [];

  const activeCashBoxes = cashBoxes.filter((c) => c.active);

  // Selección de caja (turno o general)
  const [selectedCashTarget, setSelectedCashTarget] = useState<string>(() => {
    if (activeTurnLines.length > 0) {
      return `line:${activeTurnLines[0].id}`;
    }
    return activeCashBoxes[0] ? `box:${activeCashBoxes[0].id}` : '';
  });

  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeProviders = providers.filter((p) => p.active !== false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concept.trim()) {
      showToast('El concepto del gasto es obligatorio.', 'error');
      return;
    }

    if (!providerId) {
      showToast('Debe seleccionar un proveedor del maestro.', 'error');
      return;
    }

    if (amount <= 0 && status === 'Pagado') {
      showToast('El importe debe ser mayor a 0 para guardar como Pagado.', 'error');
      return;
    }

    if (status === 'Pagado' && !selectedCashTarget) {
      showToast('Debe seleccionar la caja de donde sale el dinero.', 'error');
      return;
    }

    const selectedProv = providers.find((p) => p.id === providerId);
    
    let resolvedBoxId = '';
    let resolvedBoxName = '';
    let targetTurnLine: typeof activeTurnLines[0] | undefined;

    if (status === 'Pagado') {
      if (selectedCashTarget.startsWith('line:')) {
        const lineId = selectedCashTarget.replace('line:', '');
        targetTurnLine = activeTurnLines.find((l) => l.id === lineId);
        const matchingOperativeBox = cashBoxes.find(
          (b) => targetTurnLine && (b.name.trim().toLowerCase() === targetTurnLine.boxType.trim().toLowerCase() || b.id === targetTurnLine.boxType)
        );
        resolvedBoxId = matchingOperativeBox ? matchingOperativeBox.id : '';
        resolvedBoxName = targetTurnLine ? `${targetTurnLine.boxType} (${activeShift?.name || 'Turno Actual'})` : '';
      } else {
        const boxId = selectedCashTarget.replace('box:', '');
        const generalBox = cashBoxes.find((b) => b.id === boxId);
        resolvedBoxId = generalBox?.id || '';
        resolvedBoxName = generalBox?.name || '';
        targetTurnLine = activeTurnLines.find(
          (l) => generalBox && l.boxType.trim().toLowerCase() === generalBox.name.trim().toLowerCase()
        );
      }
    }

    setIsSubmitting(true);

    try {
      const created = await expensesService.createExpense(
        {
          date,
          concept: concept.trim(),
          providerId,
          providerName: selectedProv?.name || 'Proveedor General',
          origin: 'Eventual',
          amount,
          status,
          cashBoxId: resolvedBoxId || undefined,
          cashBoxName: resolvedBoxName || undefined,
          paymentDate: status === 'Pagado' ? new Date(`${date}T12:00:00`).toISOString() : undefined,
          paidByUserName: status === 'Pagado' ? 'Usuario Autenticado' : undefined,
          notes: notes.trim() || undefined,
        },
        file || undefined
      );

      if (created) {
        // Si se guardó como Pagado y hay una línea de caja abierta, impactar en la caja y turno actual
        if (created.status === 'Pagado' && targetTurnLine && activeShift) {
          await recordCashMovement({
            lineId: targetTurnLine.id,
            shiftId: activeShift.id,
            type: 'Gasto',
            category: 'Gasto ' + created.origin,
            categoryType: 'Salida',
            origin: `Gasto #${created.expenseNumber} - ${created.concept}`,
            voucherNumber: `EXP-${created.expenseNumber}`,
            amount: created.amount,
            notes: created.notes || `Pago a ${created.providerName}`,
          });
        }

        showToast(
          status === 'Pagado'
            ? 'Gasto eventual registrado e impactado en caja con éxito.'
            : 'Gasto eventual guardado como Pendiente (0 impacto en caja).',
          'success'
        );
        onSuccess(created);
        onClose();
      } else {
        showToast('Error al guardar el gasto.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error inesperado al guardar.', 'error');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Registrar Gasto Eventual
              </h3>
              <p className="text-xs text-slate-400">
                Egresos extraordinarios, mantenimiento o compras eventuales
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
          {/* Fila 1: Fecha y Estado */}
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
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Estado Inicial *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Pendiente')}
                  className={`py-2 text-center rounded-xl font-extrabold border transition ${
                    status === 'Pendiente'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Pagado')}
                  className={`py-2 text-center rounded-xl font-extrabold border transition ${
                    status === 'Pagado'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Pagado
                </button>
              </div>
            </div>
          </div>

          {/* Proveedor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                Proveedor *
              </label>
              {onNewProvider && (
                <button
                  type="button"
                  onClick={onNewProvider}
                  className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nuevo Proveedor
                </button>
              )}
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                required
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="">-- Seleccionar proveedor del maestro --</option>
                {activeProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.commercialName ? `(${p.commercialName})` : ''} — {p.rubro || 'General'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Concepto / Título del Gasto *
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Reparación cañería cocina, Flete insumos, etc."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
            />
          </div>

          {/* Fila Importe y Caja (si está Pagado) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                Importe ($) {status === 'Pagado' ? '*' : '(Opcional)'}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required={status === 'Pagado'}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="0.00"
                />
              </div>
            </div>

            {status === 'Pagado' && (
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
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- Seleccionar caja de egreso --</option>
                    
                    {/* GRUPO 1: Cajas del Turno Activo */}
                    {activeTurnLines.length > 0 && (
                      <optgroup label={`🟢 Cajas del Turno Abierto (${activeShift?.name || 'Turno Actual'})`}>
                        {activeTurnLines.map((line) => (
                          <option key={line.id} value={`line:${line.id}`}>
                            🟢 {line.boxType} (Saldo: $ {line.theoreticalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0 })})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* GRUPO 2: Cajas Maestras / Generales */}
                    <optgroup label="📁 Cajas Maestras / Generales">
                      {activeCashBoxes.map((box) => (
                        <option key={box.id} value={`box:${box.id}`}>
                          📁 {box.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Adjunto comprobante */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Comprobante / Factura (Opcional)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-3.5 text-center hover:border-amber-500 transition bg-white cursor-pointer relative">
              <input
                type="file"
                accept="application/pdf,image/*,video/mp4"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-amber-700 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 font-bold text-[11px]">
                    Haz clic o arrastra un archivo aquí (PDF, JPG, PNG, MP4)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Se almacena de forma segura en Supabase Storage
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Detalle */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
              Detalle / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales sobre el gasto..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
              className="px-5 py-2 font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Guardar Gasto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

