import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Provider, DayOfWeek, ProcessState } from '../types';
import { DEFAULT_RUBROS } from '../data/initialData';
import {
  Calendar,
  GripVertical,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  PackageCheck,
  DollarSign,
  Truck,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  X,
  HelpCircle,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ModuleHelpModal } from './ui/ModuleHelpModal';

interface KanbanBoardProps {
  onSelectProvider: (provider: Provider) => void;
  onStartStockCount: (provider: Provider) => void;
  onStartOrderReview: (provider: Provider) => void;
  onReceiveGoods: (provider: Provider) => void;
  onRecordPayment: (provider: Provider) => void;
  onNewProvider?: () => void;
  onOpenSettings?: () => void;
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Spanish current day helper
const getCurrentDayName = (): DayOfWeek => {
  const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const map: DayOfWeek[] = ['Sábado', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return map[dayIndex] || 'Lunes';
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectProvider,
  onStartStockCount,
  onStartOrderReview,
  onReceiveGoods,
  onRecordPayment,
  onOpenSettings,
}) => {
  const {
    providers,
    orders,
    getProviderState,
    getProviderActiveOrder,
    moveProviderToPosition,
    updateProviderDays,
    userRole,
    receptionHours,
    branding,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedRubro, setSelectedRubro] = useState<string>('todos');
  const [selectedDayMobile, setSelectedDayMobile] = useState<DayOfWeek>(getCurrentDayName());

  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<{ providerId: string; sourceDay: DayOfWeek } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [addProviderDay, setAddProviderDay] = useState<DayOfWeek | null>(null);
  const [providerToAdd, setProviderToAdd] = useState<string>('');

  const currentDay = getCurrentDayName();

  // Extract unique rubros for filter matching DEFAULT_RUBROS catalog
  const rubros = Array.from(
    new Set([...DEFAULT_RUBROS, ...(providers || []).filter(Boolean).map((p) => p?.rubro).filter(Boolean)])
  ) as string[];

  // Helper for status badge colors & text
  const getStatusBadge = (state: ProcessState) => {
    switch (state) {
      case 'Pendiente de conteo':
        return {
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
          dot: 'bg-indigo-600',
          label: 'Pendiente de Conteo',
          action: 'Realizar Conteo',
          btnBg: 'bg-slate-900 hover:bg-slate-800 text-white',
          icon: ClipboardList,
          color: 'text-indigo-600',
        };
      case 'Conteo finalizado':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Conteo Finalizado',
          action: 'Revisar Pedido',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: CheckCircle2,
          color: 'text-blue-600',
        };
      case 'Pedido confirmado':
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Pedido Confirmado',
          action: 'Confirmar Pedido',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
          icon: Truck,
          color: 'text-purple-600',
        };
      case 'Pendiente de entrega':
        return {
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Pendiente de Entrega',
          action: 'Registrar Ingreso',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          icon: Truck,
          color: 'text-indigo-600',
        };
      case 'Entregado / Ingresado':
        return {
          bg: 'bg-teal-100 text-teal-900 border-teal-200',
          dot: 'bg-teal-500',
          label: 'Ingresado en Stock',
          action: 'Registrar Pago',
          btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
          icon: PackageCheck,
          color: 'text-teal-600',
        };
      case 'Pendiente de pago':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Pendiente de Pago',
          action: 'Registrar Pago',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          icon: DollarSign,
          color: 'text-rose-600',
        };
      case 'Pagado':
      case 'Finalizado':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Finalizado / Pagado',
          action: 'Ver Ficha',
          btnBg: 'bg-slate-800 hover:bg-slate-900 text-white',
          icon: CheckCircle2,
          color: 'text-emerald-600',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-900 border-slate-200',
          dot: 'bg-slate-500',
          label: state,
          action: 'Ver Ficha',
          btnBg: 'bg-slate-800 hover:bg-slate-900 text-white',
          icon: ArrowRight,
          color: 'text-slate-600',
        };
    }
  };

  const getProviderPriorityForDay = (provider: Provider, day: DayOfWeek) => {
    if (provider.dayPriorities && provider.dayPriorities[day] !== undefined) {
      return provider.dayPriorities[day]!;
    }
    return provider.priority || 999;
  };

  // Filter providers function
  const filterProvidersForDay = (day: DayOfWeek) => {
    return (providers || [])
      .filter((p) => p && p.active && p.orderDays && p.orderDays.includes(day))
      .filter((p) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = (p.name || '').toLowerCase().includes(q) || (p.commercialName || '').toLowerCase().includes(q);
          const matchRubro = (p.rubro || '').toLowerCase().includes(q);
          if (!matchName && !matchRubro) return false;
        }
        if (selectedRubro !== 'todos' && p.rubro !== selectedRubro) return false;
        return true;
      })
      .sort((a, b) => getProviderPriorityForDay(a, day) - getProviderPriorityForDay(b, day));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Banner */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" style={{ color: branding?.primaryHex || undefined }} />
            <span>Tablero Semanal de Proveedores</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planificación diaria de controles, conteos de stock y pedidos. Día de hoy: {' '}
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200" style={{ color: branding?.primaryHex || undefined }}>
              {currentDay}
            </span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Action: Guía de uso */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition w-full sm:w-auto"
            title="Ver guía de uso de este módulo"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guía de Uso</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar proveedor o rubro..."
              className="w-full pl-3 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Rubro Selector */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs w-full sm:w-auto">
            <div className="flex items-center gap-1.5 w-full">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedRubro}
                onChange={(e) => setSelectedRubro(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer w-full"
              >
                <option value="todos">Todos los rubros</option>
                {rubros.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horarios de Recepción Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-xs transition w-full sm:w-auto"
              title="Configurar horarios de recepción de proveedores"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Horarios Recepción</span>
              <span className="font-mono text-[10px] text-slate-500 font-normal">
                ({receptionHours.morningStart}-{receptionHours.morningEnd})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Day Switcher Tabs (Only visible on small screens) */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none w-full touch-pan-x min-w-0 flex-nowrap">
        {DAYS.map((day) => {
          const isToday = day === currentDay;
          const count = filterProvidersForDay(day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDayMobile(day)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border shrink-0 ${
                selectedDayMobile === day
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  selectedDayMobile === day
                    ? 'bg-indigo-600 text-white'
                    : isToday
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
        {DAYS.map((day) => {
          const isToday = day === currentDay;
          const dayProviders = filterProvidersForDay(day);

          // On mobile, show only the selected day column; on desktop show all 6 columns
          const isMobileHidden = selectedDayMobile !== day;

          return (
            <div
              key={day}
              style={{
                backgroundColor: branding?.kanbanColumnBgHex || undefined,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const pId = e.dataTransfer.getData('providerId') || draggedCard?.providerId;
                const srcDay = (e.dataTransfer.getData('sourceDay') as DayOfWeek) || draggedCard?.sourceDay;
                if (pId && srcDay) {
                  moveProviderToPosition(pId, srcDay, day);
                }
                setDraggedCard(null);
                setDragOverTarget(null);
              }}
              className={`flex flex-col bg-slate-100/90 rounded-2xl p-3 border transition-colors ${
                isToday
                  ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-400/20'
                  : 'border-slate-200'
              } ${isMobileHidden ? 'hidden lg:flex' : 'flex'}`}
            >
              {/* Column Header */}
              <div
                style={{
                  backgroundColor: branding?.kanbanHeaderBgHex || undefined,
                }}
                className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80 p-1.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-extrabold text-sm ${
                      isToday ? 'text-orange-700' : 'text-slate-800'
                    }`}
                  >
                    {day}
                  </h3>
                  {isToday && (
                    <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-xs" style={{ backgroundColor: branding?.primaryHex || undefined }}>
                      HOY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {(userRole === 'admin' || userRole === 'compras') && (
                    <button
                      onClick={() => setAddProviderDay(day)}
                      className="w-5 h-5 flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                      title={`Agregar proveedor al día ${day}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                    {dayProviders.length}
                  </span>
                </div>
              </div>

              {/* Provider Cards Container */}
              <div className="space-y-3 min-h-[300px]">
                {dayProviders.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                    Sin pedidos previstos para el {day.toLowerCase()}
                  </div>
                ) : (
                  dayProviders.map((provider, index) => {
                    const state = getProviderState(provider.id);
                    const activeOrder = getProviderActiveOrder(provider.id);
                    const badgeInfo = getStatusBadge(state);
                    const BadgeIcon = badgeInfo.icon;

                    const providerOrders = orders.filter((o) => o.providerId === provider.id);
                    const pendingDebt = providerOrders.reduce((sum, o) => sum + (o.remainingDebt || 0), 0);
                    const hasAlert = pendingDebt > 0 || state === 'Pendiente de pago';

                    const isBeingDragged = draggedCard?.providerId === provider.id;
                    const isTarget = dragOverTarget === `${day}-${provider.id}`;

                    return (
                      <div
                        key={`${provider.id}-${day}`}
                        draggable={userRole === 'admin' || userRole === 'compras'}
                        style={{
                          backgroundColor: branding?.kanbanCardBgHex || undefined,
                          borderColor: branding?.kanbanCardBorderHex || undefined,
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('providerId', provider.id);
                          e.dataTransfer.setData('sourceDay', day);
                          setDraggedCard({ providerId: provider.id, sourceDay: day });
                        }}
                        onDragEnd={() => {
                          setDraggedCard(null);
                          setDragOverTarget(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverTarget(`${day}-${provider.id}`);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const pId = e.dataTransfer.getData('providerId') || draggedCard?.providerId;
                          const srcDay = (e.dataTransfer.getData('sourceDay') as DayOfWeek) || draggedCard?.sourceDay;
                          if (pId && srcDay) {
                            moveProviderToPosition(pId, srcDay, day, provider.id);
                          }
                          setDraggedCard(null);
                          setDragOverTarget(null);
                        }}
                        className={`bg-white rounded-2xl p-3 shadow-xs border transition-all cursor-pointer relative group flex flex-col justify-between overflow-hidden ${
                          isTarget ? 'border-orange-500 ring-2 ring-orange-400/40 scale-[1.02]' : 'border-slate-200/90 hover:shadow-md hover:border-slate-300'
                        } ${isBeingDragged ? 'opacity-40 border-dashed border-orange-400' : 'opacity-100'}`}
                        onClick={() => onSelectProvider(provider)}
                      >
                        {/* Top Card Row: Priority Rank, Rubro, Alert & Controls Toolbar */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {/* Priority Rank Pill */}
                              <span
                                className="w-5 h-5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] inline-flex items-center justify-center shrink-0 leading-none shadow-xs"
                                title={`Posición ${index + 1}`}
                              >
                                {index + 1}
                              </span>

                              {/* Rubro Badge */}
                              <span
                                className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 truncate max-w-[70px] shrink"
                                title={provider.rubro || 'General'}
                              >
                                {provider.rubro || 'General'}
                              </span>

                              {/* Alert Badge */}
                              {hasAlert && (
                                <span
                                  className="p-0.5 text-rose-600 bg-rose-50 rounded border border-rose-200 shrink-0 flex items-center gap-0.5"
                                  title={`Alerta: Deuda pendiente $${pendingDebt.toLocaleString('es-AR')}`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                </span>
                              )}
                            </div>

                            {/* Actions Toolbar */}
                            {(userRole === 'admin' || userRole === 'compras') && (
                              <div
                                className="flex items-center gap-0.5 bg-slate-50 border border-slate-200/90 rounded-lg p-0.5 shrink-0 shadow-2xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const prevProvider = dayProviders[index - 1];
                                    if (prevProvider) {
                                      moveProviderToPosition(provider.id, day, day, prevProvider.id);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition disabled:opacity-20 shrink-0"
                                  title="Subir posición"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === dayProviders.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextProvider = dayProviders[index + 1];
                                    if (nextProvider) {
                                      moveProviderToPosition(nextProvider.id, day, day, provider.id);
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition disabled:opacity-20 shrink-0"
                                  title="Bajar posición"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                                <button
                                  type="button"
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                                  title="Quitar de este día"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newOrderDays = (provider.orderDays || []).filter((d) => d !== day);
                                    updateProviderDays(provider.id, newOrderDays, provider.deliveryDays || []);
                                  }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <div
                                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-grab active:cursor-grabbing transition shrink-0"
                                  title="Mantén presionado para arrastrar"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Provider Header (Logo & Name) */}
                          <div className="flex items-center gap-2.5 my-1">
                            {provider.logoUrl ? (
                              <img
                                src={provider.logoUrl}
                                alt={provider.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div
                                style={{
                                  backgroundColor: branding?.buttonBgHex || undefined,
                                }}
                                className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-700/60"
                              >
                                {(provider.name || 'P').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="overflow-hidden min-w-0 flex-1">
                              <h4 className="font-extrabold text-xs text-slate-900 leading-snug truncate" title={provider.name}>
                                {provider.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 truncate" title={`${provider.contactName || ''} ${provider.phone || ''}`}>
                                {provider.contactName || provider.phone ? `${provider.contactName || ''} ${provider.phone ? '• ' + provider.phone : ''}` : 'Proveedor Registrado'}
                              </p>
                            </div>
                          </div>

                          {/* Schedule Info (Día Pedido & Entrega Esperada) */}
                          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                            <div className="truncate">
                              <span className="text-slate-400 block">Día Pedido:</span>
                              <strong className="text-slate-800 font-bold">{day}</strong>
                            </div>
                            <div className="truncate text-right">
                              <span className="text-slate-400 block">Entrega:</span>
                              <strong className="text-slate-800 font-bold" title={(provider.deliveryDays || []).join(', ')}>
                                {(provider.deliveryDays || []).slice(0, 2).join(', ')}
                                {(provider.deliveryDays || []).length > 2 ? '...' : ''}
                              </strong>
                            </div>
                          </div>

                          {/* Importe Estimado o Pendiente */}
                          {(activeOrder || pendingDebt > 0) && (
                            <div className="mt-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium truncate">
                                {activeOrder ? `#${activeOrder.orderNumber}` : 'Saldo Pendiente'}:
                              </span>
                              <strong className={`font-mono font-black ${pendingDebt > 0 && !activeOrder ? 'text-rose-600' : 'text-slate-900'}`}>
                                ${(activeOrder ? (activeOrder.finalReceivedTotal || activeOrder.estimatedTotal) : pendingDebt).toLocaleString('es-AR')}
                              </strong>
                            </div>
                          )}

                          {/* Estado del Proceso */}
                          <div className="mt-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${badgeInfo.bg} w-full justify-center truncate`}
                              title={badgeInfo.label}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeInfo.dot}`} />
                              <span className="truncate">{badgeInfo.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Próxima Acción Recomendada (Botón Acción Directa) */}
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (state === 'Pendiente de conteo') {
                                onStartStockCount(provider);
                              } else if (state === 'Conteo finalizado') {
                                onStartOrderReview(provider);
                              } else if (state === 'Pedido confirmado' || state === 'Pendiente de entrega') {
                                onReceiveGoods(provider);
                              } else if (state === 'Entregado / Ingresado' || state === 'Pendiente de pago') {
                                onRecordPayment(provider);
                              } else {
                                onSelectProvider(provider);
                              }
                            }}
                            className={`w-full flex items-center justify-center gap-1.5 ${badgeInfo.btnBg || 'bg-slate-900 hover:bg-orange-600 text-white'} text-xs font-bold py-1.5 px-2 rounded-xl transition-all shadow-xs truncate`}
                            title={badgeInfo.action}
                          >
                            <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{badgeInfo.action}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider to Day Modal Overlay */}
      {addProviderDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Agregar Proveedor a {addProviderDay}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Seleccionar Proveedor
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={providerToAdd}
                onChange={(e) => setProviderToAdd(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {(providers || [])
                  .filter(p => p && p.active && !(p.orderDays || []).includes(addProviderDay!))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                }
              </select>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setAddProviderDay(null);
                  setProviderToAdd('');
                }}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                disabled={!providerToAdd}
                onClick={() => {
                  const p = providers.find(p => p.id === providerToAdd);
                  if (p) {
                    const newOrderDays = Array.from(new Set([...(p.orderDays || []), addProviderDay]));
                    updateProviderDays(p.id, newOrderDays, p.deliveryDays || []);
                  }
                  setAddProviderDay(null);
                  setProviderToAdd('');
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
                style={{ backgroundColor: branding?.primaryHex || undefined }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <ModuleHelpModal
          module="kanban"
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
};
