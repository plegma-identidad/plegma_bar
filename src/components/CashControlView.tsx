import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Lock,
  CheckCircle2,
  Printer,
  Ban,
  Eye,
  DollarSign,
  Edit,
  SlidersHorizontal,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ArrowRightLeft,
  Calendar,
  CheckSquare,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { StandardDataTable } from './ui/DataTable';
import { useApp } from '../context/AppContext';
import { CashShift, CashLine, TurnoType, CashWithdrawalPayload } from '../types';
import { NewShiftModal } from './cash/NewShiftModal';
import { AddLineModal } from './cash/AddLineModal';
import { WithdrawalModal } from './cash/WithdrawalModal';
import { CloseLineModal } from './cash/CloseLineModal';
import { LineMovementsModal } from './cash/LineMovementsModal';
import { PrintSummaryModal } from './cash/PrintSummaryModal';
import { ShiftHistoryModal } from './cash/ShiftHistoryModal';
import { ModuleHelpModal } from './ui/ModuleHelpModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const ShiftStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    Abierta: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cerrada: 'bg-amber-100 text-amber-800 border-amber-300',
    Conciliada: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Anulada: 'bg-rose-100 text-rose-800 border-rose-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
        cfg[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

const LineStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    Abierta: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Cerrada: 'bg-amber-100 text-amber-700 border-amber-200',
    Conciliada: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        cfg[status] || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

export function CashControlView() {
  const {
    cashShifts,
    cashLines,
    cashMovements,
    masterCashBoxes,
    openCashShift,
    addCashLine,
    recordCashMovement,
    withdrawCashToMaster,
    transferCashBetweenLines,
    closeCashLine,
    closeCashShift,
    reconcileCashShift,
    voidCashShift,
    showToast,
  } = useApp();

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(() => {
    const active = cashShifts.find((s) => s.status === 'Abierta');
    return active ? active.id : cashShifts[0]?.id || null;
  });

  // Modals state
  const [isNewShiftOpen, setIsNewShiftOpen] = useState(false);
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [withdrawalLine, setWithdrawalLine] = useState<CashLine | null>(null);
  const [closingLine, setClosingLine] = useState<CashLine | null>(null);
  const [viewingMovementsLine, setViewingMovementsLine] = useState<CashLine | null>(null);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [historyShiftToView, setHistoryShiftToView] = useState<CashShift | null>(null);

  // Active shift resolution
  const activeShift = useMemo(() => {
    return cashShifts.find((s) => s.id === selectedShiftId) || cashShifts[0] || null;
  }, [cashShifts, selectedShiftId]);

  const activeLines = useMemo(() => {
    if (!activeShift) return [];
    return cashLines.filter((l) => l.shiftId === activeShift.id);
  }, [cashLines, activeShift]);

  // Consolidations for cards
  const totalInitial = activeLines.reduce((acc, l) => acc + l.initialAmount, 0);
  const totalTickets = activeLines.reduce((acc, l) => acc + l.ticketsTotal, 0);
  const totalExpenses = activeLines.reduce((acc, l) => acc + l.expensesTotal, 0);
  const totalWithdrawals = activeLines.reduce((acc, l) => acc + l.withdrawalsTotal, 0);
  const totalTheoretical = activeLines.reduce((acc, l) => acc + l.theoreticalAmount, 0);
  const totalDifference = activeLines.reduce((acc, l) => acc + (l.difference || 0), 0);

  // Handlers
  const handleOpenShiftConfirm = async (
    shiftType: TurnoType,
    initialLines: { boxType: string; initialAmount: number }[],
    notes?: string
  ) => {
    const res = await openCashShift(shiftType, initialLines, notes);
    if (res.success && res.shift) {
      setSelectedShiftId(res.shift.id);
      showToast(res.message, 'success');
      setIsNewShiftOpen(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleAddLineConfirm = async (boxType: string, initialAmount: number) => {
    if (!activeShift) return;
    const res = await addCashLine(activeShift.id, boxType, initialAmount);
    if (res.success) {
      showToast(res.message, 'success');
      setIsAddLineOpen(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleWithdrawalConfirm = async (payload: CashWithdrawalPayload) => {
    const res = await withdrawCashToMaster(payload);
    if (res.success) {
      showToast(res.message, 'success');
      setWithdrawalLine(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTransferConfirm = async (payload: { sourceLineId: string; targetLineId: string; amount: number; notes?: string }) => {
    const res = await transferCashBetweenLines(payload);
    if (res.success) {
      showToast(res.message, 'success');
      setWithdrawalLine(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCloseLineConfirm = async (realAmount: number, differenceNotes?: string) => {
    if (!closingLine) return;
    const res = await closeCashLine(closingLine.id, realAmount, differenceNotes);
    if (res.success) {
      showToast(res.message, 'success');
      setClosingLine(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCloseShiftAction = async () => {
    if (!activeShift) return;
    const res = await closeCashShift(activeShift.id);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleReconcileShiftAction = async () => {
    if (!activeShift) return;
    const res = await reconcileCashShift(activeShift.id);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleVoidShiftAction = async () => {
    if (!activeShift) return;
    const reason = prompt(`Ingrese el motivo para anular la caja de turno "${activeShift.name}":`);
    if (!reason || !reason.trim()) return;

    const res = await voidCashShift(activeShift.id, reason.trim());
    if (res.success) {
      showToast(res.message, 'warning');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Table columns for Lines
  const lineColumns = [
    {
      key: 'boxType',
      header: 'Medio de Pago / Tipo',
      sortable: true,
      render: (l: CashLine) => (
        <span className="font-extrabold text-slate-900 text-xs">{l.boxType}</span>
      ),
    },
    {
      key: 'initialAmount',
      header: 'Monto Inicio',
      sortable: true,
      align: 'right' as const,
      render: (l: CashLine) => <span className="font-medium text-slate-700">{fmt(l.initialAmount)}</span>,
    },
    {
      key: 'ticketsTotal',
      header: 'Tickets (+)',
      sortable: true,
      align: 'right' as const,
      render: (l: CashLine) => (
        <span className="font-bold text-emerald-600">+{fmt(l.ticketsTotal)}</span>
      ),
    },
    {
      key: 'expensesTotal',
      header: 'Gastos (-)',
      sortable: true,
      align: 'right' as const,
      render: (l: CashLine) => (
        <span className="font-bold text-rose-600">-{fmt(l.expensesTotal)}</span>
      ),
    },
    {
      key: 'withdrawalsTotal',
      header: 'Retiros (-)',
      sortable: true,
      align: 'right' as const,
      render: (l: CashLine) => (
        <span className="font-bold text-amber-600">-{fmt(l.withdrawalsTotal)}</span>
      ),
    },
    {
      key: 'theoreticalAmount',
      header: 'Monto Teórico',
      sortable: true,
      align: 'right' as const,
      render: (l: CashLine) => (
        <span className="font-black text-slate-900 text-xs">{fmt(l.theoreticalAmount)}</span>
      ),
    },
    {
      key: 'realAmount',
      header: 'Real Cierre',
      align: 'right' as const,
      render: (l: CashLine) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          {l.realAmount !== undefined ? fmt(l.realAmount) : '-'}
        </span>
      ),
    },
    {
      key: 'difference',
      header: 'Diferencia',
      align: 'right' as const,
      render: (l: CashLine) => {
        if (l.difference === undefined) return <span className="text-slate-400">-</span>;
        const diff = l.difference;
        return (
          <span
            className={`font-black text-xs font-mono ${
              diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {diff >= 0 ? `+${fmt(diff)}` : fmt(diff)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (l: CashLine) => <LineStatusBadge status={l.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center' as const,
      render: (l: CashLine) => (
        <div className="flex items-center justify-center gap-1">
          {/* Action: EYE - Ver movimientos */}
          <button
            type="button"
            onClick={() => setViewingMovementsLine(l)}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver movimientos de la línea"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action: $ - Registrar retiro o transferencia */}
          {l.status === 'Abierta' && (
            <button
              type="button"
              onClick={() => setWithdrawalLine(l)}
              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
              title="Registrar retiro / movimiento entre cajas"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}

          {/* Action: EDIT / CLOSE - Cargar monto real y cerrar línea */}
          {l.status === 'Abierta' && (
            <button
              type="button"
              onClick={() => setClosingLine(l)}
              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition flex items-center gap-0.5"
              title="Cargar Monto Real y Cerrar Línea"
            >
              <Edit className="w-3.5 h-3.5" />
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Table columns for Shift History Maestro
  const historyColumns = [
    {
      key: 'name',
      header: 'Caja de Turno',
      sortable: true,
      render: (s: CashShift) => (
        <div>
          <p className="font-extrabold text-slate-900 text-xs">{s.name}</p>
          <p className="text-[10px] text-slate-400">Creada: {s.createdAt}</p>
        </div>
      ),
    },
    {
      key: 'openedByUserName',
      header: 'Usuario Apertura',
      sortable: true,
      render: (s: CashShift) => <span className="font-medium text-slate-700 text-xs">{s.openedByUserName}</span>,
    },
    {
      key: 'linesCount',
      header: 'Líneas',
      align: 'center' as const,
      render: (s: CashShift) => {
        const count = cashLines.filter((l) => l.shiftId === s.id).length;
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[11px]">{count}</span>;
      },
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (s: CashShift) => <ShiftStatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Auditoría',
      align: 'center' as const,
      render: (s: CashShift) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setHistoryShiftToView(s)}
        >
          Ver Detalle Audit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-indigo-600 font-semibold">Ventas</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Control de Caja</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            Control & Conciliación de Cajas de Turno
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Apertura, arqueo, retiros a Cajas Maestras y conciliación por turno
          </p>
        </div>

        {/* Action 1: [ + ] Crear caja de turno */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            leftIcon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setIsHelpOpen(true)}
            className="hidden sm:flex"
          >
            Guía de Uso
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewShiftOpen(true)}
          >
            Apertura de Turno [1]
          </Button>
        </div>
      </div>

      {/* Shifts Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Selección de Caja de Turno</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedShiftId || ''}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="text-xs font-black text-slate-900 bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {cashShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
              {activeShift && <ShiftStatusBadge status={activeShift.status} />}
            </div>
          </div>
        </div>

        {/* Global Shift Actions (Actions 7, 8, 9, 10) */}
        {activeShift && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Action 2: Add Line */}
            {activeShift.status === 'Abierta' && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddLineOpen(true)}
              >
                Agregar Línea [2]
              </Button>
            )}

            {/* Action 7: Close Shift */}
            {activeShift.status === 'Abierta' && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                onClick={handleCloseShiftAction}
              >
                Cerrar Turno [7]
              </Button>
            )}

            {/* Action 8: Reconcile Shift */}
            {activeShift.status === 'Cerrada' && (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={handleReconcileShiftAction}
              >
                Conciliar Turno [8]
              </Button>
            )}

            {/* Action 9: Print Summary */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => setIsPrintSummaryOpen(true)}
            >
              Imprimir Resumen [9]
            </Button>

            {/* Action 10: Void Shift */}
            {activeShift.status !== 'Conciliada' && activeShift.status !== 'Anulada' && (
              <Button
                size="sm"
                variant="danger"
                leftIcon={<Ban className="w-3.5 h-3.5" />}
                onClick={handleVoidShiftAction}
              >
                Anular [10]
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards for Active Shift */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Monto Inicio Total</p>
          <p className="text-base font-black text-slate-900 mt-1">{fmt(totalInitial)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-emerald-600 font-bold uppercase">+ Tickets Facturados</p>
          <p className="text-base font-black text-emerald-700 mt-1">+{fmt(totalTickets)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-rose-600 font-bold uppercase">- Gastos & Consumos</p>
          <p className="text-base font-black text-rose-700 mt-1">-{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-amber-600 font-bold uppercase">- Retiros A Cajas Maestras</p>
          <p className="text-base font-black text-amber-700 mt-1">-{fmt(totalWithdrawals)}</p>
        </div>
        <div className="bg-white border border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-indigo-700 font-black uppercase">Monto Teórico Consolidado</p>
          <p className="text-base font-black text-indigo-900 mt-1">{fmt(totalTheoretical)}</p>
        </div>
      </div>

      {/* Observación 3: LINES TABLE IMMEDIATELY BELOW SHIFT APERTURA BURBUJAS */}
      {activeShift && (
        <StandardDataTable
          data={activeLines}
          columns={lineColumns}
          keyExtractor={(l) => l.id}
          title={`Líneas de Caja de Turno — ${activeShift.name}`}
          subtitle="Detalle visual por cada medio de pago precargado y control de arqueo"
          searchFilterKey={(l) => `${l.boxType} ${l.status}`}
          searchPlaceholder="Buscar por medio de pago o estado..."
          emptyMessage="No hay líneas agregadas a este turno. Utilice el botón [Agregar Línea] para iniciar."
          emptyIcon={<CreditCard className="w-8 h-8 text-slate-300" />}
        />
      )}

      {/* Master Cash Boxes Cards Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Cajas Maestras ("Siempre Abiertas")</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Destino permanente de retiros operacionales
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {masterCashBoxes.map((mb) => (
            <div
              key={mb.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold mb-1">
                  {mb.status}
                </span>
                <p className="font-extrabold text-slate-800 text-xs">{mb.name}</p>
                <p className="text-[10px] text-slate-400">{mb.boxType}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Saldo Actual</p>
                <p className="text-sm font-black text-emerald-700">{fmt(mb.currentBalance)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observación 7: MAESTRO CON HISTORIAL DE CAJAS DE TURNO */}
      <StandardDataTable
        data={cashShifts}
        columns={historyColumns}
        keyExtractor={(s) => s.id}
        title="Maestro & Historial de Cajas de Turno"
        subtitle="Registro histórico completo de turnos abiertos, cerrados, conciliados y anulados"
        searchFilterKey={(s) => `${s.name} ${s.status} ${s.openedByUserName}`}
        searchPlaceholder="Buscar por fecha, turno o usuario..."
        emptyMessage="No hay registros históricos de cajas de turno."
        emptyIcon={<Clock className="w-8 h-8 text-slate-300" />}
      />

      {/* Render Active Modals */}
      {isNewShiftOpen && (
        <NewShiftModal
          onClose={() => setIsNewShiftOpen(false)}
          onConfirm={handleOpenShiftConfirm}
        />
      )}

      {isAddLineOpen && activeShift && (
        <AddLineModal
          onClose={() => setIsAddLineOpen(false)}
          onConfirm={handleAddLineConfirm}
        />
      )}

      {withdrawalLine && (
        <WithdrawalModal
          line={withdrawalLine}
          allLines={activeLines}
          masterBoxes={masterCashBoxes}
          onClose={() => setWithdrawalLine(null)}
          onConfirmWithdrawal={handleWithdrawalConfirm}
          onConfirmTransfer={handleTransferConfirm}
        />
      )}

      {closingLine && (
        <CloseLineModal
          line={closingLine}
          onClose={() => setClosingLine(null)}
          onConfirm={handleCloseLineConfirm}
        />
      )}

      {viewingMovementsLine && (
        <LineMovementsModal
          line={viewingMovementsLine}
          movements={cashMovements}
          onClose={() => setViewingMovementsLine(null)}
          onAddMovement={recordCashMovement}
        />
      )}

      {isPrintSummaryOpen && activeShift && (
        <PrintSummaryModal
          shift={activeShift}
          lines={activeLines}
          masterBoxes={masterCashBoxes}
          onClose={() => setIsPrintSummaryOpen(false)}
        />
      )}

      {historyShiftToView && (
        <ShiftHistoryModal
          shift={historyShiftToView}
          lines={cashLines}
          movements={cashMovements}
          onClose={() => setHistoryShiftToView(null)}
        />
      )}

      {isHelpOpen && (
        <ModuleHelpModal
          module="cash"
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
