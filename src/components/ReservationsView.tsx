import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  FileText,
  UserCheck,
  HelpCircle,
  Printer,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { StandardDataTable } from './ui/DataTable';
import { ModuleHelpModal } from './ui/ModuleHelpModal';
import { useApp } from '../context/AppContext';
import { Reservation, RestaurantTable } from '../types';
import { ReservationModal } from './reservations/ReservationModal';
import { ReservationDetailModal } from './reservations/ReservationDetailModal';
import { ReservationReceiptModal } from './reservations/ReservationReceiptModal';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    Confirmada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cumplida: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Cancelada: 'bg-rose-100 text-rose-800 border-rose-300',
    Histórica: 'bg-slate-100 text-slate-800 border-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
        cfg[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

export function ReservationsView() {
  const {
    reservations,
    restaurantTables,
    clients,
    addReservation,
    updateReservation,
    cancelReservation,
    markReservationFulfilled,
    checkOverbooking,
    userRole,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'proximas' | 'historial' | 'canceladas'>('proximas');

  // Today's date string YYYY-MM-DD
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Observación 1: Date filters (Sincronizados)
  const [statsDate, setStatsDate] = useState<string>(todayStr);
  const [filterDate, setFilterDate] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTableId, setFilterTableId] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [printingReservation, setPrintingReservation] = useState<Reservation | null>(null);

  // Observación 4: Modal OK de Cumplimiento / Check-in
  const [fulfillmentModalRes, setFulfillmentModalRes] = useState<Reservation | null>(null);
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

  // Observación 1: Handle synchronized date filtering
  const handleDateFilterChange = (dateVal: string) => {
    setFilterDate(dateVal);
    // When date filter is changed, sync top stats date as well
    if (dateVal) {
      setStatsDate(dateVal);
    } else {
      setStatsDate(todayStr);
    }
  };

  const handleStatsDateChange = (dateVal: string) => {
    setStatsDate(dateVal);
    setFilterDate(dateVal);
  };

  const handleResetDateToToday = () => {
    setStatsDate(todayStr);
    setFilterDate('');
  };

  // Filter reservations according to active tab and search filters
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Tab filter
      if (activeTab === 'proximas' && r.status !== 'Confirmada') return false;
      if (activeTab === 'historial' && r.status !== 'Histórica' && r.status !== 'Cumplida') return false;
      if (activeTab === 'canceladas' && r.status !== 'Cancelada') return false;

      // Date filter
      if (filterDate && !r.dateTime.startsWith(filterDate)) return false;

      // Table filter
      if (filterTableId && r.tableId !== filterTableId) return false;

      // Search query (Client name, phone, table name or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = r.clientName.toLowerCase().includes(q);
        const matchesPhone = (r.clientPhone || '').toLowerCase().includes(q);
        const matchesTable = r.tableName.toLowerCase().includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);
        if (!matchesClient && !matchesPhone && !matchesTable && !matchesNotes) return false;
      }

      return true;
    });
  }, [reservations, activeTab, filterDate, filterTableId, searchQuery]);

  // Observación 1: Summaries calculated dynamically for chosen statsDate
  const statsReservations = useMemo(() => {
    if (!statsDate) return reservations;
    return reservations.filter((r) => r.dateTime.startsWith(statsDate));
  }, [reservations, statsDate]);

  const upcomingTodayCount = useMemo(
    () => statsReservations.filter((r) => r.status === 'Confirmada').length,
    [statsReservations]
  );
  const fulfilledTodayCount = useMemo(
    () => statsReservations.filter((r) => r.status === 'Cumplida' || r.status === 'Histórica').length,
    [statsReservations]
  );
  const cancelledTodayCount = useMemo(
    () => statsReservations.filter((r) => r.status === 'Cancelada').length,
    [statsReservations]
  );
  const totalGuestsToday = useMemo(
    () => statsReservations.filter((r) => r.status === 'Confirmada').reduce((acc, r) => acc + r.guestsCount, 0),
    [statsReservations]
  );

  // Tab count badges
  const totalUpcoming = useMemo(() => reservations.filter((r) => r.status === 'Confirmada').length, [reservations]);
  const totalHistory = useMemo(
    () => reservations.filter((r) => r.status === 'Histórica' || r.status === 'Cumplida').length,
    [reservations]
  );
  const totalCancelled = useMemo(() => reservations.filter((r) => r.status === 'Cancelada').length, [reservations]);

  // Handlers
  const handleCreateNew = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (res: Reservation) => {
    if (res.status === 'Histórica' && userRole !== 'admin') {
      showToast('Las reservas históricas no se pueden editar (R05).', 'error');
      return;
    }
    setEditingReservation(res);
    setIsModalOpen(true);
  };

  const handleCancelClick = (res: Reservation) => {
    if (res.status === 'Cancelada') return;
    const reason = prompt(`Motivo de cancelación para la reserva de ${res.clientName}:`);
    if (reason === null) return;
    const resCancel = cancelReservation(res.id, reason.trim() || 'Cancelación directa por usuario');
    if (resCancel.success) {
      showToast(resCancel.message, 'warning');
    } else {
      showToast(resCancel.message, 'error');
    }
  };

  // Observación 4: Marcar Cumplida con Modal de OK de Trazabilidad
  const handleOpenFulfillmentModal = (res: Reservation) => {
    setFulfillmentModalRes(res);
    setFulfillmentNotes('');
  };

  const handleConfirmFulfillmentOK = () => {
    if (!fulfillmentModalRes) return;
    const resFulfilled = markReservationFulfilled(fulfillmentModalRes.id, fulfillmentNotes);
    if (resFulfilled.success) {
      showToast(resFulfilled.message, 'success');
      if (viewingReservation?.id === fulfillmentModalRes.id) {
        setViewingReservation(null);
      }
      setFulfillmentModalRes(null);
    } else {
      showToast(resFulfilled.message, 'error');
    }
  };

  // Observación 2: Emitir comprobante/imagen WhatsApp al guardar reserva
  const handleSaveModal = (payload: any) => {
    if (editingReservation) {
      const res = updateReservation(payload as Reservation);
      if (res.success) {
        showToast(res.message, 'success');
        setIsModalOpen(false);
        setPrintingReservation(payload as Reservation);
      }
      return res;
    } else {
      const res = addReservation(payload);
      if (res.success) {
        showToast(res.message, 'success');
        setIsModalOpen(false);
        if (res.reservation) {
          setPrintingReservation(res.reservation);
        }
      }
      return res;
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'dateTime',
      header: 'Fecha y Hora',
      sortable: true,
      render: (r: Reservation) => (
        <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold text-xs">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{r.dateTime}</span>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Cliente',
      sortable: true,
      render: (r: Reservation) => (
        <div>
          <p className="font-extrabold text-slate-900 text-xs">{r.clientName}</p>
          {r.clientPhone && <p className="text-[10px] text-slate-400">{r.clientPhone}</p>}
        </div>
      ),
    },
    {
      key: 'guestsCount',
      header: 'Personas',
      sortable: true,
      align: 'center' as const,
      render: (r: Reservation) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
          <Users className="w-3 h-3 text-slate-500" />
          {r.guestsCount} pax
        </span>
      ),
    },
    {
      key: 'tableName',
      header: 'Mesa',
      sortable: true,
      render: (r: Reservation) => (
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {r.tableName}
        </span>
      ),
    },
    // Observación 3: Trazabilidad de Usuario que Registro / Modificó / dio OK
    {
      key: 'traceability',
      header: 'Trazabilidad (Usuario)',
      sortable: true,
      render: (r: Reservation) => (
        <div className="text-[11px] leading-tight space-y-0.5">
          <p className="text-slate-600 font-medium">
            Reg: <span className="font-bold text-slate-800">{r.createdByUserName}</span>
          </p>
          {r.updatedByUserName && (
            <p className="text-amber-800 font-semibold text-[10px]">
              Mod: <span className="font-bold">{r.updatedByUserName}</span>
            </p>
          )}
          {r.fulfilledByUserName && (
            <p className="text-emerald-800 font-semibold text-[10px]">
              OK: <span className="font-bold">{r.fulfilledByUserName}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (r: Reservation) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center' as const,
      render: (r: Reservation) => (
        <div className="flex items-center justify-center gap-1">
          {/* Action: EYE - Ver detalle */}
          <button
            type="button"
            onClick={() => setViewingReservation(r)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver detalle de la reserva y log de modificaciones"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Observación 2: PRINTER / WhatsApp Image Card */}
          {r.status === 'Confirmada' && (
            <button
              type="button"
              onClick={() => setPrintingReservation(r)}
              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Emitir Imagen / Mensaje para WhatsApp"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Observación 4: USERCHECK - OK de Cumplimiento */}
          {r.status === 'Confirmada' && (
            <button
              type="button"
              onClick={() => handleOpenFulfillmentModal(r)}
              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
              title="Registrar OK de Cumplimiento (Cliente asistió)"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}

          {/* Action: EDIT - Editar reserva */}
          {r.status !== 'Cancelada' && (r.status !== 'Histórica' || userRole === 'admin') && (
            <button
              type="button"
              onClick={() => handleEditClick(r)}
              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title="Editar reserva"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Action: CANCEL - Cancelar reserva */}
          {r.status === 'Confirmada' && (
            <button
              type="button"
              onClick={() => handleCancelClick(r)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Cancelar reserva"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

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
            <span className="text-slate-800 font-semibold">Reservas de Mesas</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Reservas de Mesas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organización de disponibilidad, comensales esperados, trazabilidad y comprobantes para WhatsApp
          </p>
        </div>

        {/* Action: Crear reserva */}
        <div className="flex items-center gap-2">
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
            onClick={handleCreateNew}
          >
            Crear Reserva
          </Button>
        </div>
      </div>

      {/* Observación 1: SUMMARY KPI CARDS FILTERED BY EITHER STATS DATE OR MAIN DATE FILTER */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-indigo-600" />
            Estadísticas Operativas &bull; {statsDate === todayStr ? 'Día Actual (Hoy)' : `Fecha: ${statsDate}`}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Filtrar Fecha Estadísticas:</span>
            <input
              type="date"
              value={statsDate}
              onChange={(e) => handleStatsDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
            />
            {statsDate !== todayStr && (
              <button
                type="button"
                onClick={handleResetDateToToday}
                className="text-[11px] text-indigo-600 hover:underline font-bold"
              >
                Volver a Hoy
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Próximas Reservas</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{upcomingTodayCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Comensales Esperados</p>
              <p className="text-base font-black text-indigo-700 mt-0.5">{totalGuestsToday} pax</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Reservas Cumplidas</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{fulfilledTodayCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Reservas Canceladas</p>
              <p className="text-base font-black text-rose-600 mt-0.5">{cancelledTodayCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filtering Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            <button
              onClick={() => setActiveTab('proximas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'proximas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Próximas Confirmadas ({totalUpcoming})
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'historial'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Historial & Cumplidas ({totalHistory})
            </button>

            <button
              onClick={() => setActiveTab('canceladas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'canceladas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Reservas Canceladas ({totalCancelled})
            </button>
          </div>
        </div>

        {/* Observación 1: Filter controls with synchronized date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, teléfono o nota..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 font-bold"
              placeholder="Filtrar por día..."
            />
          </div>

          <div>
            <select
              value={filterTableId}
              onChange={(e) => setFilterTableId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
            >
              <option value="">Todas las Mesas / Sectores</option>
              {restaurantTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sector})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <StandardDataTable
        data={filteredReservations}
        columns={columns}
        keyExtractor={(r) => r.id}
        title={
          activeTab === 'proximas'
            ? 'Próximas Reservas Confirmadas'
            : activeTab === 'historial'
            ? 'Historial de Reservas Cumplidas y Pasadas'
            : 'Registro de Reservas Canceladas'
        }
        subtitle="Listado de reservas con trazabilidad auditada de creación, edición y OK de cumplimiento"
        emptyMessage={
          activeTab === 'proximas'
            ? 'No hay reservas próximas confirmadas.'
            : activeTab === 'historial'
            ? 'No hay reservas en el historial cumplido.'
            : 'No hay reservas canceladas registradas.'
        }
        emptyIcon={<Calendar className="w-8 h-8 text-slate-300" />}
      />

      {/* Modal: Crear / Editar Reserva */}
      {isModalOpen && (
        <ReservationModal
          reservationToEdit={editingReservation}
          tables={restaurantTables}
          clients={clients}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
          checkOverbooking={checkOverbooking}
        />
      )}

      {/* Modal: Ayuda */}
      {isHelpOpen && (
        <ModuleHelpModal
          module="reservations"
          onClose={() => setIsHelpOpen(false)}
        />
      )}

      {/* Modal: Ver Detalle de Reserva */}
      {viewingReservation && (
        <ReservationDetailModal
          reservation={viewingReservation}
          onClose={() => setViewingReservation(null)}
          onMarkFulfilled={handleOpenFulfillmentModal}
        />
      )}

      {/* Observación 2: Modal PDF Comprobante / WhatsApp Image Card */}
      {printingReservation && (
        <ReservationReceiptModal
          reservation={printingReservation}
          onClose={() => setPrintingReservation(null)}
        />
      )}

      {/* Observación 4: Modal OK de Cumplimiento / Check-in */}
      {fulfillmentModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">OK de Cumplimiento</h3>
                  <p className="text-xs text-indigo-200">Verificación de asistencia del cliente</p>
                </div>
              </div>
              <button
                onClick={() => setFulfillmentModalRes(null)}
                type="button"
                className="p-1.5 rounded-xl hover:bg-white/10 text-indigo-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-xs font-black text-slate-900">{fulfillmentModalRes.clientName}</p>
                <p className="text-xs text-slate-600 font-semibold">
                  Mesa: <span className="text-indigo-600">{fulfillmentModalRes.tableName}</span> &bull; Pax: {fulfillmentModalRes.guestsCount}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Fecha/Hora: {fulfillmentModalRes.dateTime}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Observación de Asistencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Llegó a tiempo, consumo iniciado..."
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Se registrará la trazabilidad con su usuario autenticado y timestamp inmutable.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setFulfillmentModalRes(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={handleConfirmFulfillmentOK}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  Registrar OK
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
