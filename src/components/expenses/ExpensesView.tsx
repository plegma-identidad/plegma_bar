import React, { useState, useEffect, useMemo } from 'react';
import {
  Expense,
  ExpenseOrigin,
  ExpenseStatus,
  ExpenseFilters,
  Provider,
  OperativeCashBox,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { expensesService } from '../../services/expensesService';
import { ExpenseModal } from './ExpenseModal';
import { ExpensePaymentModal } from './ExpensePaymentModal';
import { RecurringExpensesModal } from './RecurringExpensesModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import {
  Plus,
  Repeat,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  XCircle,
  Paperclip,
  Download,
  RefreshCw,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const {
    providers,
    operativeCashBoxes,
    cashLines,
    cashShifts,
    recordCashMovement,
    showToast,
  } = useApp();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filtros
  const [startDate, setStartDate] = useState<string>(() => {
    // Primer día del mes corriente
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Último día del mes corriente
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<ExpenseOrigin | 'TODOS'>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'TODOS'>('TODOS');
  const [selectedCashBoxId, setSelectedCashBoxId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState<boolean>(false);
  const [paymentTargetExpense, setPaymentTargetExpense] = useState<Expense | null>(null);
  const [detailTargetExpense, setDetailTargetExpense] = useState<Expense | null>(null);
  const [voidTargetExpense, setVoidTargetExpense] = useState<Expense | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  // Carga de gastos
  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const filters: ExpenseFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        providerId: selectedProviderId || undefined,
        origin: selectedOrigin,
        status: selectedStatus,
        cashBoxId: selectedCashBoxId || undefined,
        searchTerm: searchTerm.trim() || undefined,
      };
      const data = await expensesService.getExpenses(filters);
      setExpenses(data);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar la bandeja de gastos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Al montar: verificar recurrentes automáticamente y cargar datos
  useEffect(() => {
    const init = async () => {
      try {
        await expensesService.checkAndGeneratePendingRecurringExpenses();
      } catch (err) {
        console.error('Error al evaluar recurrentes automáticos:', err);
      }
      loadExpenses();
    };
    init();
  }, []);

  // Recargar al cambiar filtros clave
  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate, selectedProviderId, selectedOrigin, selectedStatus, selectedCashBoxId]);

  // Manejo de búsqueda con debounce manual
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadExpenses();
    }
  };

  // KPIs calculados sobre la lista actual
  const kpis = useMemo(() => {
    const totalAmount = expenses.reduce((sum, e) => sum + (e.status !== 'Anulado' ? e.amount : 0), 0);
    const paidAmount = expenses
      .filter((e) => e.status === 'Pagado')
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = expenses
      .filter((e) => e.status === 'Pendiente')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCount = expenses.length;

    return { totalAmount, paidAmount, pendingAmount, totalCount };
  }, [expenses]);

  // Shortcuts de fecha
  const setQuickDateRange = (preset: 'today' | 'thisMonth' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Confirmar Anulación
  const handleConfirmVoid = async () => {
    if (!voidTargetExpense) return;
    if (!voidReason.trim()) {
      showToast('Debe ingresar el motivo de anulación.', 'error');
      return;
    }

    // Si estaba pagado y hay una línea de caja abierta, reversar en la caja activa del turno
    if (voidTargetExpense.status === 'Pagado') {
      const activeShift = cashShifts.find((s) => s.status === 'Abierta');
      const activeLine = cashLines.find(
        (l) =>
          l.shiftId === activeShift?.id &&
          ((voidTargetExpense.cashBoxName &&
            l.boxType.trim().toLowerCase() === voidTargetExpense.cashBoxName.trim().toLowerCase()) ||
            l.boxType === voidTargetExpense.cashBoxId) &&
          l.status === 'Abierta'
      );

      if (activeLine && activeShift) {
        await recordCashMovement({
          lineId: activeLine.id,
          shiftId: activeShift.id,
          type: 'Ajuste',
          category: 'Reverso Gasto',
          categoryType: 'Ingreso',
          origin: `Reverso Gasto #${voidTargetExpense.expenseNumber} - ${voidTargetExpense.concept}`,
          voucherNumber: `REV-EXP-${voidTargetExpense.expenseNumber}`,
          amount: voidTargetExpense.amount,
          notes: `Anulación de gasto: ${voidReason.trim()}`,
        });
      }
    }

    const res = await expensesService.voidExpense(
      voidTargetExpense,
      voidReason.trim(),
      'Usuario Autenticado'
    );

    if (res.success) {
      showToast('Gasto anulado y reverso imputado si correspondía.', 'success');
      setVoidTargetExpense(null);
      setVoidReason('');
      loadExpenses();
    } else {
      showToast(res.message || 'Error al anular gasto.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Módulo de Finanzas & Compras
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Bandeja Unificada de Gastos
          </h1>
          <p className="text-xs text-slate-500">
            Consolidación de egresos: Recurrentes, Eventuales, Sueldos y Pagos a Proveedores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRecurringModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-2xl text-xs font-black shadow-2xs transition"
          >
            <Repeat className="w-4 h-4 text-indigo-600" />
            <span>Maestro Recurrentes</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-md transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Gasto Eventual</span>
          </button>
        </div>
      </div>

      {/* KPIS SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Período */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Período (Neto)
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight mt-2">
            $ {kpis.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Egresos activos en el filtro
          </span>
        </div>

        {/* KPI 2: Total Pagado */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Pagado
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono tracking-tight mt-2">
            $ {kpis.paidAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
            Impactado en caja
          </span>
        </div>

        {/* KPI 3: Total Pendiente */}
        <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-2xs flex flex-col justify-between bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Total Pendiente
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono tracking-tight mt-2">
            $ {kpis.pendingAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block font-semibold">
            Por vencer / pagar
          </span>
        </div>

        {/* KPI 4: Registros */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Comprobantes
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight mt-2">
            {kpis.totalCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Registros en la bandeja
          </span>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        {/* Fila 1: Fechas & Presets & Buscador */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Shortcuts y Rango de Fechas */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Período:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />
            <span className="text-slate-400 font-bold">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />

            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => setQuickDateRange('today')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange('thisMonth')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => setQuickDateRange('all')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
              >
                Todo
              </button>
            </div>
          </div>

          {/* Buscador de texto */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por concepto, detalle o N°..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  loadExpenses();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Selectores combinados (Proveedor, Origen, Estado, Caja) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
          {/* Proveedor */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Proveedor
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="">Todos los Proveedores</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Origen */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Origen
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="TODOS">Todos los Orígenes</option>
              <option value="Recurrente">Recurrente</option>
              <option value="Eventual">Eventual</option>
              <option value="Sueldos">Sueldos (RRHH)</option>
              <option value="Proveedores">Proveedores (Compras)</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Pagado">Pagados</option>
              <option value="Anulado">Anulados</option>
            </select>
          </div>

          {/* Caja */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Caja
            </label>
            <select
              value={selectedCashBoxId}
              onChange={(e) => setSelectedCashBoxId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="">Todas las Cajas</option>
              {cashLines.filter((l) => l.status === 'Abierta').length > 0 && (
                <optgroup label="🟢 Cajas del Turno Activo">
                  {cashLines
                    .filter((l) => l.status === 'Abierta')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        🟢 {l.boxType}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="📁 Cajas Generales">
                {operativeCashBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    📁 {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE GASTOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="font-extrabold text-xs text-slate-800">
              Registros de Egresos ({expenses.length})
            </span>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-xl transition shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="p-3.5">N°</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Concepto</th>
                <th className="p-3.5">Proveedor</th>
                <th className="p-3.5">Origen</th>
                <th className="p-3.5 text-right">Importe</th>
                <th className="p-3.5">Caja</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Adjunto</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Cargando gastos...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No se encontraron gastos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const hasAttachment = Boolean(expense.attachmentUrl);

                  return (
                    <tr
                      key={expense.id}
                      className={`hover:bg-slate-50/80 transition ${
                        expense.status === 'Anulado' ? 'opacity-50 line-through bg-rose-50/20' : ''
                      }`}
                    >
                      {/* N° */}
                      <td className="p-3.5 font-mono font-bold text-slate-500 text-[11px]">
                        #{expense.expenseNumber}
                      </td>

                      {/* Fecha */}
                      <td className="p-3.5 text-slate-700 whitespace-nowrap font-bold">
                        {expense.date}
                      </td>

                      {/* Concepto */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 tracking-tight">
                          {expense.concept}
                        </div>
                        {expense.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs font-normal">
                            {expense.notes}
                          </div>
                        )}
                      </td>

                      {/* Proveedor */}
                      <td className="p-3.5 text-slate-800 font-bold">
                        {expense.providerName}
                      </td>

                      {/* Origen */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            expense.origin === 'Recurrente'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : expense.origin === 'Eventual'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : expense.origin === 'Sueldos'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {expense.origin}
                        </span>
                      </td>

                      {/* Importe */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                        $ {expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Caja */}
                      <td className="p-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {expense.cashBoxName ? (
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-slate-400" />
                            {expense.cashBoxName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                            expense.status === 'Pagado'
                              ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-300'
                              : expense.status === 'Pendiente'
                              ? 'bg-amber-500/15 text-amber-800 border border-amber-300'
                              : 'bg-rose-500/15 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {expense.status}
                        </span>
                      </td>

                      {/* Adjunto */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {hasAttachment ? (
                          <button
                            type="button"
                            onClick={() => setDetailTargetExpense(expense)}
                            title="Ver comprobante adjunto"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-2xs"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Pagar si está Pendiente */}
                          {expense.status === 'Pendiente' && (
                            <button
                              type="button"
                              onClick={() => setPaymentTargetExpense(expense)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black shadow-2xs transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Pagar
                            </button>
                          )}

                          {/* Botón Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => setDetailTargetExpense(expense)}
                            title="Ver Detalle y Auditoría"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Botón Anular si no está ya anulado */}
                          {expense.status !== 'Anulado' && (
                            <button
                              type="button"
                              onClick={() => setVoidTargetExpense(expense)}
                              title="Anular Gasto"
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ALTA DE GASTO EVENTUAL */}
      {isExpenseModalOpen && (
        <ExpenseModal
          providers={providers}
          cashBoxes={operativeCashBoxes}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => loadExpenses()}
          showToast={showToast}
        />
      )}

      {/* MODAL 2: MAESTRO DE RECURRENTES */}
      {isRecurringModalOpen && (
        <RecurringExpensesModal
          providers={providers}
          cashBoxes={operativeCashBoxes}
          onClose={() => setIsRecurringModalOpen(false)}
          onRefreshExpenses={() => loadExpenses()}
          showToast={showToast}
        />
      )}

      {/* MODAL 3: PAGO DE GASTO PENDIENTE */}
      {paymentTargetExpense && (
        <ExpensePaymentModal
          expense={paymentTargetExpense}
          cashBoxes={operativeCashBoxes}
          onClose={() => setPaymentTargetExpense(null)}
          onSuccess={() => loadExpenses()}
          showToast={showToast}
        />
      )}

      {/* MODAL 4: DETALLE & COMPROBANTE */}
      {detailTargetExpense && (
        <ExpenseDetailModal
          expense={detailTargetExpense}
          onClose={() => setDetailTargetExpense(null)}
          onPay={() => {
            const exp = detailTargetExpense;
            setDetailTargetExpense(null);
            setPaymentTargetExpense(exp);
          }}
          onVoid={() => {
            const exp = detailTargetExpense;
            setDetailTargetExpense(null);
            setVoidTargetExpense(exp);
          }}
        />
      )}

      {/* MODAL 5: CONFIRMACIÓN DE ANULACIÓN */}
      {voidTargetExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  ¿Anular Gasto #{voidTargetExpense.expenseNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  {voidTargetExpense.concept} • ${voidTargetExpense.amount.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {voidTargetExpense.status === 'Pagado'
                ? 'Este gasto ya fue PAGADO e impactó en caja. Al anularlo, se creará un contra-asiento de ajuste en caja para restituir el dinero.'
                : 'Este gasto está PENDIENTE. Al anularlo, se cancelará sin impacto financiero.'}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Motivo de anulación *
              </label>
              <textarea
                required
                rows={2}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ej: Factura duplicada, error en importe, servicio cancelado..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVoidTargetExpense(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 font-bold text-xs text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-4 py-2 font-black text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

