import React, { useState, useEffect } from 'react';
import { RecurringExpense, Provider, OperativeCashBox, RecurringFrequency } from '../../types';
import { expensesService } from '../../services/expensesService';
import {
  X,
  Plus,
  Repeat,
  Building2,
  Calendar,
  DollarSign,
  Wallet,
  Power,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
} from 'lucide-react';

interface RecurringExpensesModalProps {
  providers: Provider[];
  cashBoxes: OperativeCashBox[];
  onClose: () => void;
  onRefreshExpenses: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
  providers,
  cashBoxes,
  onClose,
  onRefreshExpenses,
  showToast,
}) => {
  const [recurringList, setRecurringList] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('Mensual');
  const [scheduledDay, setScheduledDay] = useState<number>(1);
  const [habitualAmount, setHabitualAmount] = useState<number>(0);
  const [defaultCashBoxId, setDefaultCashBoxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const activeProviders = providers.filter((p) => p.active !== false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await expensesService.getRecurringExpenses();
      setRecurringList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setProviderId(activeProviders[0]?.id || '');
    setFrequency('Mensual');
    setScheduledDay(1);
    setHabitualAmount(0);
    setDefaultCashBoxId('');
    setNotes('');
    setIsEditing(true);
  };

  const handleOpenEdit = (rec: RecurringExpense) => {
    setEditingId(rec.id);
    setName(rec.name);
    setProviderId(rec.providerId);
    setFrequency(rec.frequency);
    setScheduledDay(rec.scheduledDay);
    setHabitualAmount(rec.habitualAmount || 0);
    setDefaultCashBoxId(rec.defaultCashBoxId || '');
    setNotes(rec.notes || '');
    setIsEditing(true);
  };

  const handleToggleActive = async (rec: RecurringExpense) => {
    const newStatus = !rec.active;
    const ok = await expensesService.toggleRecurringExpense(rec.id, newStatus);
    if (ok) {
      setRecurringList((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, active: newStatus } : r))
      );
      showToast(
        newStatus
          ? `Gasto recurrente "${rec.name}" activado.`
          : `Gasto recurrente "${rec.name}" pausado (no generará futuros gastos).`,
        'info'
      );
    } else {
      showToast('Error al actualizar el estado.', 'error');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('El nombre del servicio o concepto es obligatorio.', 'error');
      return;
    }

    if (!providerId) {
      showToast('Debe vincular un proveedor del maestro.', 'error');
      return;
    }

    const prov = providers.find((p) => p.id === providerId);

    setIsSubmitting(true);
    try {
      const saved = await expensesService.saveRecurringExpense({
        id: editingId || undefined,
        name: name.trim(),
        providerId,
        providerName: prov?.name || 'Proveedor General',
        frequency,
        scheduledDay: Number(scheduledDay),
        habitualAmount: Number(habitualAmount) || 0,
        defaultCashBoxId: defaultCashBoxId || undefined,
        notes: notes.trim() || undefined,
        active: true,
      });

      if (saved) {
        showToast(
          editingId
            ? 'Gasto recurrente actualizado. Los cambios aplicarán a futuras generaciones.'
            : 'Gasto recurrente creado con éxito.',
          'success'
        );
        setIsEditing(false);
        loadData();
      } else {
        showToast('Error al guardar el gasto recurrente.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error inesperado.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunGeneratorNow = async () => {
    setIsGenerating(true);
    try {
      const generated = await expensesService.checkAndGeneratePendingRecurringExpenses();
      if (generated > 0) {
        showToast(
          `Se generaron ${generated} gasto(s) recurrente(s) en estado Pendiente para hoy.`,
          'success'
        );
        onRefreshExpenses();
        loadData();
      } else {
        showToast(
          'No hay nuevos gastos pendientes para generar en la fecha actual.',
          'info'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar generación.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Maestro de Gastos Recurrentes
              </h3>
              <p className="text-xs text-slate-400">
                Automatización de servicios periódicos (Alquiler, Luz, Internet, Abonos)
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

        {/* Toolbar & Actions */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Nuevo Gasto Recurrente
            </button>
            <button
              type="button"
              onClick={handleRunGeneratorNow}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
              title="Evaluar y generar pendientes para el día de hoy"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Play className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Verificar Generación Hoy</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {recurringList.filter((r) => r.active).length} activos de {recurringList.length} configurados
          </span>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {isEditing ? (
            /* FORMULARIO DE ALTA / EDICIÓN */
            <form onSubmit={handleSaveForm} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-indigo-600" />
                  {editingId ? 'Editar Gasto Recurrente' : 'Configurar Nuevo Gasto Recurrente'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Volver al Listado
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                    Nombre del Servicio / Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Fibertel Internet 300MB, Alquiler Local, EPEC..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                    Proveedor del Maestro *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {activeProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.commercialName ? `(${p.commercialName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                    Frecuencia *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                    Día Programado (1 al 31) *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={scheduledDay}
                      onChange={(e) => setScheduledDay(parseInt(e.target.value) || 1)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                    Importe Habitual ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={habitualAmount}
                      onChange={(e) => setHabitualAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      placeholder="0.00 (opcional)"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dejar en 0 si es variable (Luz, Gas, etc.)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                  Caja Habitual Sugerida (Opcional)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={defaultCashBoxId}
                    onChange={(e) => setDefaultCashBoxId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Sin caja predeterminada --</option>
                    {cashBoxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1.5 uppercase tracking-wider text-[11px]">
                  Detalle / Número de Cliente / Referencia
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: N° de cliente 0049281, debito automático en cuenta o pago por ventanilla..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>
          ) : (
            /* LISTADO DE RECURRENTES */
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Cargando maestros recurrentes...
                </div>
              ) : recurringList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Repeat className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">
                    No tienes gastos recurrentes configurados
                  </p>
                  <p className="text-slate-400 text-xs">
                    Crea servicios como Alquiler, Internet o Servicios Públicos para que el sistema cree automáticamente los registros en su fecha programada.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNew}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-2xs"
                  >
                    Crear Primer Gasto Recurrente
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recurringList.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-2xl border transition shadow-2xs flex flex-col justify-between ${
                        rec.active
                          ? 'bg-white border-slate-200 hover:border-indigo-300'
                          : 'bg-slate-100/70 border-slate-300 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                            {rec.name}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              rec.active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {rec.active ? 'Activo' : 'Pausado'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {rec.providerName}
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {rec.frequency} • Día programado: <strong>{rec.scheduledDay}</strong>
                          </p>
                          <p className="flex items-center gap-1.5 text-xs font-mono font-black text-slate-900">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {rec.habitualAmount > 0
                              ? `$ ${rec.habitualAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                              : 'Importe Variable (a facturar)'}
                          </p>
                          {rec.notes && (
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 mt-2">
                              {rec.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rec)}
                          className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition ${
                            rec.active
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{rec.active ? 'Pausar' : 'Reactivar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" /> Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Regla: Desactivar un maestro frena futuras generaciones pero conserva el historial de gastos.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

