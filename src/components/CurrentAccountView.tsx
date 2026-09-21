import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  Receipt,
  CreditCard,
  CheckSquare,
  FileText,
  Trash2,
  FileBadge,
  AlertCircle,
  TrendingUp,
  Clock,
  UserCheck,
  Edit,
  Eye,
  HelpCircle,
  Printer,
} from 'lucide-react';
import { Button } from './ui/Button';
import { StandardDataTable } from './ui/DataTable';
import { ModuleHelpModal } from './ui/ModuleHelpModal';
import { useApp } from '../context/AppContext';
import { Client, CurrentAccountMovement, Receipt as ReceiptType, EmployeeConsumption } from '../types';
import {
  INITIAL_CC_MOVEMENTS,
  INITIAL_RECEIPTS,
  EMPLOYEE_CLIENT_IDS,
} from '../data/currentAccountData';
import { BillReceiptModal } from './BillReceiptModal';
import { EditReceiptModal } from './EditReceiptModal';
import { TicketDetailModal } from './TicketDetailModal';
import { CCReceiptPreviewModal } from './CCReceiptPreviewModal';

// -----------------------------------------------
// HELPERS
// -----------------------------------------------
const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const getNowWithSeconds = () => {
  const d = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const generateNextReceiptNumber = (existingReceipts: ReceiptType[]): string => {
  let maxNum = 0;
  existingReceipts.forEach((r) => {
    const match = r.receiptNumber.match(/REC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `REC-${String(maxNum + 1).padStart(5, '0')}`;
};

// -----------------------------------------------
// BADGE COMPONENTS
// -----------------------------------------------
const StateBadge: React.FC<{ state: string }> = ({ state }) => {
  const cfg: Record<string, string> = {
    'Con recibo': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Sin recibo': 'bg-amber-100 text-amber-700 border-amber-200',
    Pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
    Facturado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
        cfg[state] || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {state}
    </span>
  );
};

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}> = ({ icon, label, value, accent = 'bg-amber-50 text-amber-600' }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-base font-black text-slate-900 leading-tight mt-0.5">{value}</p>
    </div>
  </div>
);

// -----------------------------------------------
// VISTA DETALLE DEL CLIENTE
// -----------------------------------------------
interface ClientDetailProps {
  client: Client;
  movements: CurrentAccountMovement[];
  receipts: ReceiptType[];
  isEmployee: boolean;
  onBack: () => void;
  onDataChange: (movements: CurrentAccountMovement[], receipts: ReceiptType[]) => void;
}

function ClientDetailView({
  client,
  movements,
  receipts,
  isEmployee,
  onBack,
  onDataChange,
}: ClientDetailProps) {
  const { showToast, users, activeUserId, employees, addEmployeeConsumptionFromReceipt } = useApp();
  const [activeTab, setActiveTab] = useState<'consumos' | 'recibos'>('consumos');
  const [selectedMovIds, setSelectedMovIds] = useState<string[]>([]);
  const [selectedRecIds, setSelectedRecIds] = useState<string[]>([]);

  // Modals state
  const [billingReceipt, setBillingReceipt] = useState<ReceiptType | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptType | null>(null);
  const [viewingMovement, setViewingMovement] = useState<CurrentAccountMovement | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptType | null>(null);

  const clientMovements = useMemo(
    () => movements.filter((m) => m.clientId === client.id),
    [movements, client.id]
  );
  const clientReceipts = useMemo(
    () => receipts.filter((r) => r.clientId === client.id),
    [receipts, client.id]
  );

  // DEBT RULE: Debt is calculated strictly by movements whose lineState !== 'Pagada'
  // (A receipt in Pendiente status DOES NOT subtract debt yet; only Facturado receipts do)
  const totalDebt = useMemo(() => {
    return clientMovements
      .filter((m) => m.lineState === 'Pendiente')
      .reduce((acc, m) => acc + m.total, 0);
  }, [clientMovements]);

  const activeUser = users.find((u) => u.id === activeUserId);

  // Determine movement display state
  const getMovState = (mov: CurrentAccountMovement): string => {
    const linkedReceipt = clientReceipts.find((r) => r.movementIds.includes(mov.id));
    if (linkedReceipt || mov.lineState === 'Pagada') return 'Con recibo';
    return 'Sin recibo';
  };

  const getLinkedReceiptNumber = (mov: CurrentAccountMovement): string | undefined => {
    const linkedReceipt = clientReceipts.find((r) => r.movementIds.includes(mov.id));
    return linkedReceipt?.receiptNumber;
  };

  const isMovSelectable = (mov: CurrentAccountMovement) => {
    const state = getMovState(mov);
    return state === 'Sin recibo';
  };

  const toggleMovSelection = (id: string) => {
    setSelectedMovIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleRecSelection = (id: string) => {
    setSelectedRecIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // 1. GENERAR RECIBO (PENDIENTE)
  const handleGenerateReceipt = () => {
    if (selectedMovIds.length === 0) return;

    const amount = clientMovements
      .filter((m) => selectedMovIds.includes(m.id))
      .reduce((acc, m) => acc + m.total, 0);

    const nextReceiptNum = generateNextReceiptNumber(receipts);

    const newReceipt: ReceiptType = {
      id: `rec-${Date.now()}`,
      receiptNumber: nextReceiptNum,
      clientId: client.id,
      dateTime: getNowWithSeconds(),
      totalAmount: amount,
      status: 'Pendiente',
      userName: activeUser?.name || 'Admin General',
      movementIds: [...selectedMovIds],
    };

    // Keep movements lineState as 'Pendiente' (they do NOT discount debt yet until billed)
    onDataChange(movements, [...receipts, newReceipt]);
    setSelectedMovIds([]);
    showToast(`Recibo ${newReceipt.receiptNumber} generado en estado Pendiente.`, 'success');
  };

  // 2. ELIMINAR RECIBO PENDIENTE
  const handleDeleteReceipts = () => {
    if (selectedRecIds.length === 0) return;

    const updatedReceipts = receipts.filter((r) => !selectedRecIds.includes(r.id));
    onDataChange(movements, updatedReceipts);
    setSelectedRecIds([]);
    showToast(`${selectedRecIds.length} recibo(s) eliminado(s) correctamente.`, 'success');
  };

  // 3. FACTURAR RECIBO (ABRE MODAL)
  const handleOpenBillModal = () => {
    if (selectedRecIds.length !== 1) return;
    const targetRec = clientReceipts.find((r) => r.id === selectedRecIds[0]);
    if (targetRec && targetRec.status === 'Pendiente') {
      setBillingReceipt(targetRec);
    }
  };

  const handleConfirmBilling = ({
    paymentMethod,
    cashRegister,
    applyToPayroll,
  }: {
    paymentMethod: string;
    cashRegister: string;
    applyToPayroll: boolean;
  }) => {
    if (!billingReceipt) return;

    const nowWithSec = getNowWithSeconds();

    // 1. Update receipt status to Facturado
    const updatedReceipts = receipts.map((r) =>
      r.id === billingReceipt.id
        ? {
            ...r,
            status: 'Facturado' as const,
            paymentMethod,
            cashRegister,
            appliedToPayroll: applyToPayroll,
            billedAt: nowWithSec,
          }
        : r
    );

    // 2. NOW update associated movements lineState to 'Pagada' -> DEBT DISCOUNTS NOW!
    const updatedMovements = movements.map((m) =>
      billingReceipt.movementIds.includes(m.id) ? { ...m, lineState: 'Pagada' as const } : m
    );

    onDataChange(updatedMovements, updatedReceipts);

    // 3. If applied to Payroll (for employee), add EmployeeConsumption to RRHH
    if (applyToPayroll && isEmployee) {
      const emp = employees.find(
        (e) =>
          e.name.toLowerCase() === client.name.toLowerCase() ||
          client.name.toLowerCase().includes(e.name.toLowerCase())
      );

      const newConsumption: EmployeeConsumption = {
        id: 'ec-' + Date.now(),
        employeeId: emp?.id || client.id,
        employeeName: client.name,
        dni: emp?.dni || 'SN',
        date: nowWithSec.substring(0, 16),
        orderNumber: billingReceipt.receiptNumber,
        amount: billingReceipt.totalAmount,
        detail: `Descuento Cuenta Corriente Recibo #${billingReceipt.receiptNumber}`,
        status: 'Pendiente',
      };

      addEmployeeConsumptionFromReceipt(newConsumption);
      showToast(
        `Recibo ${billingReceipt.receiptNumber} facturado y derivado a Liquidación de Sueldos.`,
        'success'
      );
    } else {
      showToast(`Recibo ${billingReceipt.receiptNumber} facturado correctamente.`, 'success');
    }

    setBillingReceipt(null);
    setSelectedRecIds([]);
  };

  // 4. EDITAR RECIBO PENDIENTE (ABRE MODAL)
  const handleOpenEditModal = () => {
    if (selectedRecIds.length !== 1) return;
    const targetRec = clientReceipts.find((r) => r.id === selectedRecIds[0]);
    if (targetRec && targetRec.status === 'Pendiente') {
      setEditingReceipt(targetRec);
    }
  };

  const handleSaveEditReceipt = (
    updatedReceipt: ReceiptType,
    updatedMovements: CurrentAccountMovement[]
  ) => {
    const updatedReceipts = receipts.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r));
    onDataChange(updatedMovements, updatedReceipts);
    setEditingReceipt(null);
    setSelectedRecIds([]);
    showToast(`Recibo ${updatedReceipt.receiptNumber} actualizado.`, 'success');
  };

  const pendingReceiptsSelected = selectedRecIds.every((id) => {
    const r = clientReceipts.find((rec) => rec.id === id);
    return r && r.status === 'Pendiente';
  });

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver a Cuenta Corriente
      </button>

      {/* Client Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <span className="text-white text-lg font-black">{client.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900">{client.name}</h2>
                {isEmployee ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200">
                    <UserCheck className="w-3 h-3" /> Empleado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                    Cliente Regular (No Empleado)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {client.code} &bull; {client.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">
              Total cuenta corriente
            </p>
            <p className="text-xl font-black text-rose-600">{fmt(totalDebt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['consumos', 'recibos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedMovIds([]);
              setSelectedRecIds([]);
            }}
            className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'consumos' ? (
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Consumos ({clientMovements.length})
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Recibos ({clientReceipts.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: CONSUMOS */}
      {activeTab === 'consumos' && (
        <div className="space-y-3">
          {selectedMovIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">
                <CheckSquare className="w-4 h-4 inline mr-1 text-amber-600" />
                {selectedMovIds.length} ticket(s) seleccionado(s) &bull; Total:{' '}
                <strong>
                  {fmt(
                    clientMovements
                      .filter((m) => selectedMovIds.includes(m.id))
                      .reduce((a, m) => a + m.total, 0)
                  )}
                </strong>
              </p>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Receipt className="w-3.5 h-3.5" />}
                onClick={handleGenerateReceipt}
              >
                Generar Recibo
              </Button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Consumos / Tickets</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selecciona tickets sin recibo para generar uno
                </p>
              </div>
              {selectedMovIds.length === 0 && (
                <span className="text-[11px] text-slate-400">Clic en casilla para seleccionar</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-8"></th>
                    <th className="py-3 px-4 text-left">Fecha y Hora</th>
                    <th className="py-3 px-4 text-left">N° Ticket</th>
                    <th className="py-3 px-4 text-right">Monto Total</th>
                    <th className="py-3 px-4 text-left">Detalle de Ticket</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center w-12">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No hay consumos registrados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clientMovements.map((mov) => {
                      const selectable = isMovSelectable(mov);
                      const isSelected = selectedMovIds.includes(mov.id);
                      const state = getMovState(mov);
                      return (
                        <tr
                          key={mov.id}
                          className={`transition-colors ${
                            selectable ? 'hover:bg-indigo-50/50' : 'opacity-70 bg-slate-50/40'
                          } ${isSelected ? 'bg-indigo-50 border-l-2 border-indigo-400' : ''}`}
                        >
                          <td
                            className="py-3.5 px-4 cursor-pointer"
                            onClick={() => selectable && toggleMovSelection(mov.id)}
                          >
                            {selectable && (
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {mov.dateTime}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                            {mov.ticketNumber || mov.id}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {fmt(mov.total)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {mov.ticketDetail || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StateBadge state={state} />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingMovement(mov)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Ver detalle del ticket"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>
                Mostrando <strong>{clientMovements.length}</strong> registros
              </span>
              <span className="font-medium">
                Total pendiente:{' '}
                <strong className="text-rose-600">{fmt(totalDebt)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RECIBOS */}
      {activeTab === 'recibos' && (
        <div className="space-y-3">
          {selectedRecIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-wrap">
              <p className="text-xs font-semibold text-slate-700">
                <CheckSquare className="w-4 h-4 inline mr-1 text-indigo-500" />
                {selectedRecIds.length} recibo(s) seleccionado(s)
              </p>
              <div className="flex items-center gap-2">
                {selectedRecIds.length === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const rec = clientReceipts.find((r) => r.id === selectedRecIds[0]);
                      if (rec) setViewingReceipt(rec);
                    }}
                  >
                    Ver / Imprimir
                  </Button>
                )}
                {pendingReceiptsSelected && (
                  <>
                    {selectedRecIds.length === 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        onClick={handleOpenEditModal}
                      >
                        Editar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<FileBadge className="w-3.5 h-3.5" />}
                      onClick={handleOpenBillModal}
                    >
                      Facturar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={handleDeleteReceipts}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">Recibos emitidos</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Solo recibos en estado Pendiente son editables y facturables
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-8"></th>
                    <th className="py-3 px-4 text-left">Fecha y Hora Emisión</th>
                    <th className="py-3 px-4 text-left">N° Recibo</th>
                    <th className="py-3 px-4 text-right">Monto Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-left">Usuario</th>
                    <th className="py-3 px-4 text-center w-12">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No hay recibos generados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clientReceipts.map((rec) => {
                      const selectable = rec.status === 'Pendiente';
                      const isSelected = selectedRecIds.includes(rec.id);
                      return (
                        <tr
                          key={rec.id}
                          onClick={() => toggleRecSelection(rec.id)}
                          className={`transition-colors ${
                            selectable ? 'cursor-pointer hover:bg-emerald-50/50' : 'cursor-not-allowed opacity-60'
                          } ${isSelected ? 'bg-emerald-50 border-l-2 border-emerald-400' : ''}`}
                        >
                          <td className="py-3.5 px-4">
                            {selectable && (
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium whitespace-nowrap">{rec.dateTime}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                            {rec.receiptNumber}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {fmt(rec.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StateBadge state={rec.status} />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{rec.userName}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReceipt(rec);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Ver / Imprimir recibo"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              <span>
                Mostrando <strong>{clientReceipts.length}</strong> registros
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FACTURAR RECIBO */}
      {billingReceipt && (
        <BillReceiptModal
          receipt={billingReceipt}
          client={client}
          isEmployee={isEmployee}
          onClose={() => setBillingReceipt(null)}
          onConfirm={handleConfirmBilling}
        />
      )}

      {/* MODAL: EDITAR RECIBO PENDIENTE */}
      {editingReceipt && (
        <EditReceiptModal
          receipt={editingReceipt}
          client={client}
          movements={movements}
          onClose={() => setEditingReceipt(null)}
          onSave={handleSaveEditReceipt}
        />
      )}

      {/* MODAL: DETALLE DE TICKET */}
      {viewingMovement && (
        <TicketDetailModal
          movement={viewingMovement}
          client={client}
          receiptNumber={getLinkedReceiptNumber(viewingMovement)}
          onClose={() => setViewingMovement(null)}
        />
      )}

      {/* MODAL: PREVISUALIZAR / IMPRIMIR RECIBO */}
      {viewingReceipt && (
        <CCReceiptPreviewModal
          receipt={viewingReceipt}
          client={client}
          movements={movements}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}

// -----------------------------------------------
// VISTA PRINCIPAL - LISTADO DE CLIENTES
// -----------------------------------------------
export function CurrentAccountView() {
  const { clients, ccMovements, setCcMovements, ccReceipts, setCcReceipts } = useApp();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const ccClients = useMemo(() => clients.filter((c) => c.hasCurrentAccount), [clients]);

  const movements = ccMovements;
  const receipts = ccReceipts;

  const handleDataChange = (
    newMovements: CurrentAccountMovement[],
    newReceipts: ReceiptType[]
  ) => {
    setCcMovements(newMovements);
    setCcReceipts(newReceipts);
  };

  // Debt Rule: Movements with lineState === 'Pendiente' contribute to Total Debt
  const totalDebt = useMemo(
    () =>
      ccClients.reduce((acc, c) => {
        const pending = movements
          .filter((m) => m.clientId === c.id && m.lineState === 'Pendiente')
          .reduce((s, m) => s + m.total, 0);
        return acc + pending;
      }, 0),
    [ccClients, movements]
  );

  const pendingReceipts = receipts.filter((r) => r.status === 'Pendiente').length;
  const billedReceipts = receipts.filter((r) => r.status === 'Facturado').length;

  const getClientDebt = (clientId: string) =>
    movements
      .filter((m) => m.clientId === clientId && m.lineState === 'Pendiente')
      .reduce((acc, m) => acc + m.total, 0);

  const getLastMovement = (clientId: string) => {
    const clientMovs = movements.filter((m) => m.clientId === clientId);
    if (clientMovs.length === 0) return '-';
    return clientMovs.sort((a, b) => b.dateTime.localeCompare(a.dateTime))[0].dateTime;
  };

  const columns = [
    {
      key: 'code',
      header: 'ID Cliente',
      sortable: true,
      render: (c: Client) => <span className="font-mono text-slate-500 text-[11px]">{c.code}</span>,
    },
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      render: (c: Client) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">{c.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{c.name}</p>
            {c.phone && <p className="text-[10px] text-slate-400">{c.phone}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'debt',
      header: 'Total Acumulado',
      sortable: true,
      align: 'right' as const,
      render: (c: Client) => {
        const debt = getClientDebt(c.id);
        return (
          <span className={`font-black text-sm ${debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {fmt(debt)}
          </span>
        );
      },
    },
    {
      key: 'lastMovement',
      header: 'Último Movimiento',
      render: (c: Client) => (
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {getLastMovement(c.id)}
        </span>
      ),
    },
    {
      key: 'isEmployee',
      header: 'Es Empleado',
      align: 'center' as const,
      render: (c: Client) =>
        (c.isEmployee || EMPLOYEE_CLIENT_IDS.includes(c.id)) ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200">
            <UserCheck className="w-3 h-3" /> Sí
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
            No
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center' as const,
      render: (c: Client) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedClient(c);
          }}
        >
          Ver Detalle
        </Button>
      ),
    },
  ];

  if (selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        movements={movements}
        receipts={receipts}
        isEmployee={!!selectedClient.isEmployee || EMPLOYEE_CLIENT_IDS.includes(selectedClient.id)}
        onBack={() => setSelectedClient(null)}
        onDataChange={handleDataChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-indigo-600 font-semibold">Ventas</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Cuenta Corriente</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Cuenta Corriente
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de cuentas corrientes de clientes, consumos y recibos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setIsHelpOpen(true)}
            className="hidden sm:flex"
          >
            Guía de Uso
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          label="Clientes CC"
          value={ccClients.length}
          accent="bg-indigo-50 text-indigo-600"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Pendiente"
          value={fmt(totalDebt)}
          accent="bg-rose-50 text-rose-600"
        />
        <SummaryCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Recibos Pendientes"
          value={pendingReceipts}
          accent="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          icon={<FileBadge className="w-5 h-5" />}
          label="Recibos Facturados"
          value={billedReceipts}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Clients Table */}
      <StandardDataTable
        data={ccClients}
        columns={columns}
        keyExtractor={(c) => c.id}
        onRowClick={(client) => setSelectedClient(client)}
        title="Clientes con Cuenta Corriente"
        subtitle="Haga clic en un cliente o en 'Ver Detalle' para acceder a su cuenta corriente"
        searchFilterKey={(c) => `${c.name} ${c.code} ${c.phone}`}
        searchPlaceholder="Buscar cliente..."
        emptyMessage="No hay clientes con cuenta corriente habilitada."
      />

      {isHelpOpen && (
        <ModuleHelpModal
          module="currentAccount"
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
