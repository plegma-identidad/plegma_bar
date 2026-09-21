import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Eye,
  Printer,
  DollarSign,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  Users,
  MapPin,
  Utensils,
  ChevronRight,
  Receipt,
  Kanban,
  LayoutGrid,
  List,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { StandardDataTable } from './ui/DataTable';
import { ConfirmModal } from './ui/ConfirmModal';
import { useApp } from '../context/AppContext';
import { SaleOrder, OrderStatus, RestaurantTableConfig } from '../types';
import { OrderEditorModal } from './orders/OrderEditorModal';
import { ComandaModal } from './orders/ComandaModal';
import { OrderBillingModal } from './orders/OrderBillingModal';
import { OrderTimeAuditModal } from './orders/OrderTimeAuditModal';
import { SaleTicketModal } from './orders/SaleTicketModal';
import { OrdersHelpModal } from './orders/OrdersHelpModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cfg: Record<OrderStatus, string> = {
    Pendiente: 'bg-slate-100 text-slate-800 border-slate-300',
    Comandado: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'En Cocina': 'bg-amber-100 text-amber-800 border-amber-300',
    Listo: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Entregado: 'bg-blue-100 text-blue-800 border-blue-300',
    Cerrado: 'bg-purple-100 text-purple-800 border-purple-300',
    Facturado: 'bg-emerald-500 text-white border-emerald-600 font-black',
    Cancelado: 'bg-rose-100 text-rose-800 border-rose-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
        cfg[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
};

export function OrdersView() {
  const {
    saleOrders,
    saleTypeConfigs,
    tableConfigs,
    clients,
    cashShifts,
    cashLines,
    employees,
    createSaleOrder,
    updateSaleOrder,
    generateComandaPDF,
    updateSaleOrderStatus,
    processOrderBilling,
    cancelSaleOrder,
    userRole,
    showToast,
  } = useApp();

  // Profile View Mode
  const [profileMode, setProfileMode] = useState<'admin' | 'mozo' | 'delivery'>('admin');

  // Filters (Admin view)
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [channelFilter, setChannelFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SaleOrder | null>(null);
  const [comandaOrder, setComandaOrder] = useState<SaleOrder | null>(null);
  const [billingOrder, setBillingOrder] = useState<SaleOrder | null>(null);
  const [timeAuditOrder, setTimeAuditOrder] = useState<SaleOrder | null>(null);
  const [ticketOrder, setTicketOrder] = useState<SaleOrder | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<SaleOrder | null>(null);

  // Active Cash Shift
  const activeShift = useMemo(() => cashShifts.find((s) => s.status === 'Abierta'), [cashShifts]);

  // Filtered Orders for Admin List
  const filteredOrders = useMemo(() => {
    return saleOrders.filter((o) => {
      if (statusFilter !== 'Todos' && o.status !== statusFilter) return false;
      if (channelFilter !== 'Todos' && o.saleTypeId !== channelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = String(o.orderNumber).includes(q);
        const matchesClient = o.clientName.toLowerCase().includes(q);
        const matchesTable = (o.tableName || '').toLowerCase().includes(q);
        if (!matchesNum && !matchesClient && !matchesTable) return false;
      }
      return true;
    });
  }, [saleOrders, statusFilter, channelFilter, searchQuery]);

  // Mozo View: Table Map & Active Orders
  const openOrdersByTable = useMemo(() => {
    const map: Record<string, SaleOrder> = {};
    saleOrders.forEach((o) => {
      if (o.tableId && o.status !== 'Facturado' && o.status !== 'Cancelado') {
        map[o.tableId] = o;
      }
    });
    return map;
  }, [saleOrders]);

  // Handlers
  const handleSaveEditor = async (payload: any) => {
    if (editingOrder) {
      const res = await updateSaleOrder(payload as SaleOrder);
      if (res.success) {
        showToast(res.message, 'success');
        setIsEditorOpen(false);
      }
      return res;
    } else {
      const res = await createSaleOrder(payload);
      if (res.success) {
        showToast(res.message, 'success');
        setIsEditorOpen(false);
      }
      return res;
    }
  };

  const handleConfirmSendComanda = async () => {
    if (!comandaOrder) return;
    const res = await generateComandaPDF(comandaOrder.id);
    if (res.success) {
      showToast(res.message, 'success');
      setComandaOrder(null);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmBilling = async (billingPayload: any) => {
    if (!billingOrder) return { success: false, message: 'Pedido no seleccionado.' };
    const res = await processOrderBilling(billingOrder.id, billingPayload);
    if (res.success) {
      showToast(res.message, 'success');
      
      // Update order data with billing info to show accurate ticket
      const billedOrder = {
        ...billingOrder,
        status: 'Facturado',
        paymentCondition: billingPayload.paymentCondition,
        paymentMethod: billingPayload.paymentMethod,
        discountAmount: billingPayload.discountAmount,
        subtotalAmount: billingPayload.subtotalAmount,
        finalTotal: billingPayload.finalTotal
      };
      
      setBillingOrder(null);
      // Auto-open ticket modal so user can print immediately
      setTicketOrder(billedOrder as any);
    }
    return res;
  };

  const handleConfirmCancelOrder = async (reason: string = '') => {
    if (!orderToCancel) return;
    const res = await cancelSaleOrder(orderToCancel.id, reason.trim());
    if (res.success) {
      showToast(res.message, 'warning');
    } else {
      showToast(res.message, 'error');
    }
    setOrderToCancel(null);
  };

  // Columns for Admin Table
  const adminColumns = [
    {
      key: 'orderNumber',
      header: 'Pedido #',
      sortable: true,
      render: (o: SaleOrder) => (
        <div>
          <span className="font-black text-slate-900 text-xs font-mono">#{o.orderNumber}</span>
          <p className="text-[10px] text-slate-400 font-mono">{o.createdAt}</p>
        </div>
      ),
    },
    {
      key: 'saleTypeName',
      header: 'Canal / Mesa',
      sortable: true,
      render: (o: SaleOrder) => (
        <div>
          <span className="font-extrabold text-indigo-700 text-xs">{o.saleTypeName}</span>
          {o.tableName && <p className="text-[10px] font-bold text-slate-700">{o.tableName}</p>}
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Cliente',
      sortable: true,
      render: (o: SaleOrder) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.clientName}</p>
          {o.clientPhone && <p className="text-[10px] text-slate-400">{o.clientPhone}</p>}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      align: 'right' as const,
      render: (o: SaleOrder) => <span className="font-black text-slate-900 text-xs">{fmt(o.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (o: SaleOrder) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones Operativas',
      align: 'center' as const,
      render: (o: SaleOrder) => (
        <div className="flex items-center justify-center gap-1">
          {/* Tiempos del pedido (T1-T4) */}
          <button
            type="button"
            onClick={() => setTimeAuditOrder(o)}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver trazabilidad de tiempos T1-T4"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Generar Comanda */}
          {o.status !== 'Facturado' && o.status !== 'Cancelado' && (
            <button
              type="button"
              onClick={() => setComandaOrder(o)}
              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title="Generar / Imprimir Comanda (A05)"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Reimprimir Ticket */}
          {(o.status === 'Facturado' || o.status === 'Cerrado') && (
            <button
              type="button"
              onClick={() => setTicketOrder(o)}
              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Ver / Reimprimir Ticket"
            >
              <Receipt className="w-4 h-4" />
            </button>
          )}

          {/* Cambiar Estado a Listo */}
          {o.status === 'En Cocina' && (
            <button
              type="button"
              onClick={async () => {
                const res = await updateSaleOrderStatus(o.id, 'Listo');
                showToast(res.message, 'success');
              }}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Marcar Salida de Cocina / Listo (T3)"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {/* Cambiar Estado a Entregado */}
          {o.status === 'Listo' && (
            <button
              type="button"
              onClick={async () => {
                const res = await updateSaleOrderStatus(o.id, 'Entregado');
                showToast(res.message, 'success');
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Marcar Entregado (T4)"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}

          {/* Facturar Pedido */}
          {o.status !== 'Facturado' && o.status !== 'Cancelado' && (
            <button
              type="button"
              onClick={() => setBillingOrder(o)}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
              title="Emitir Ticket / Facturar Pedido (A07)"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          {/* Editar Pedido */}
          {o.status !== 'Facturado' && (
            <button
              type="button"
              onClick={() => {
                setEditingOrder(o);
                setIsEditorOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title="Editar Pedido"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Anular Pedido */}
          {o.status !== 'Facturado' && o.status !== 'Cancelado' && (
            <button
              type="button"
              onClick={() => setOrderToCancel(o)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Cancelar Pedido"
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-indigo-600 font-semibold">Ventas</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Pedidos & Facturación</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Núcleo Comercial de Pedidos & Ventas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Carga rápida, comandas a cocina, trazabilidad T1-T4 y facturación con caja activa
          </p>
        </div>

        {/* Actions */}
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
            onClick={() => {
              setEditingOrder(null);
              setIsEditorOpen(true);
            }}
          >
            Crear Pedido
          </Button>
        </div>
      </div>

      {/* Profile Selector & Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Profile Toggles */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            <button
              onClick={() => setProfileMode('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                profileMode === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5 text-indigo-600" />
              Vista Administrador (Tabla Global)
            </button>

            <button
              onClick={() => setProfileMode('mozo')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                profileMode === 'mozo'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              Vista Mozo / Salón (Mesas)
            </button>

            <button
              onClick={() => setProfileMode('delivery')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                profileMode === 'delivery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-emerald-600" />
              Vista Delivery / Takeaway (Kanban)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por #pedido, cliente o mesa..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Filters for Admin Mode */}
        {profileMode === 'admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Filtrar Canal:</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Todos">Todos los Canales Comercializadores</option>
                {saleTypeConfigs.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Filtrar Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Comandado">Comandado</option>
                <option value="En Cocina">En Cocina</option>
                <option value="Listo">Listo</option>
                <option value="Entregado">Entregado</option>
                <option value="Cerrado">Cerrado</option>
                <option value="Facturado">Facturado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* RENDER PROFILE VIEWS */}

      {/* PROFILE 1: ADMIN GLOBAL TABLE */}
      {profileMode === 'admin' && (
        <StandardDataTable
          data={filteredOrders}
          columns={adminColumns}
          keyExtractor={(o) => o.id}
          title="Consola Multicanal de Pedidos"
          subtitle="Trazabilidad completa, emisión de comanda y cobranza"
          emptyMessage="No hay pedidos registrados con los filtros seleccionados."
          emptyIcon={<ShoppingCart className="w-8 h-8 text-slate-300" />}
        />
      )}

      {/* PROFILE 2: MOZO / SALÓN GRID */}
      {profileMode === 'mozo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              Operativa de Mesas del Salón
            </h3>
            <span className="text-xs text-slate-500">
              Haga clic en una mesa para abrir pedido o facturar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tableConfigs.map((table) => {
              const activeOrder = openOrdersByTable[table.id];
              const isOccupied = !!activeOrder;

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    isOccupied
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{table.number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isOccupied ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOccupied ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>

                  {isOccupied ? (
                    <div className="space-y-1 text-xs">
                      <p className="font-extrabold text-slate-900">Pedido #{activeOrder.orderNumber}</p>
                      <p className="text-slate-600 truncate">{activeOrder.clientName}</p>
                      <p className="font-black text-amber-700 text-sm">{fmt(activeOrder.totalAmount)}</p>
                      <OrderStatusBadge status={activeOrder.status} />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin pedido activo. Cap: {table.capacity} pax.</p>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-1">
                    {isOccupied ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setComandaOrder(activeOrder)}
                        >
                          Comanda
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                          onClick={() => setBillingOrder(activeOrder)}
                        >
                          Cobrar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingOrder(null);
                          setIsEditorOpen(true);
                        }}
                      >
                        Abrir Pedido
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROFILE 3: DELIVERY / TAKEAWAY LOGISTICAL KANBAN */}
      {profileMode === 'delivery' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Column 1: Pendientes */}
          <div className="bg-slate-100 p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-xs text-slate-700">
              <span>1. Pendientes de Producción</span>
              <span className="bg-slate-200 px-2 py-0.5 rounded-full font-mono">
                {saleOrders.filter((o) => o.status === 'Pendiente').length}
              </span>
            </div>
            <div className="space-y-2">
              {saleOrders
                .filter((o) => o.status === 'Pendiente')
                .map((o) => (
                  <div key={o.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>#{o.orderNumber} ({o.saleTypeName})</span>
                      <span className="text-slate-900 font-mono">{fmt(o.totalAmount)}</span>
                    </div>
                    <p className="text-slate-600">{o.clientName}</p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                      onClick={() => setComandaOrder(o)}
                    >
                      Enviar Comanda (T2)
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: En preparación / Cocina */}
          <div className="bg-amber-50 p-3 rounded-2xl space-y-3 border border-amber-200">
            <div className="flex items-center justify-between font-bold text-xs text-amber-900">
              <span>2. En Elaboración / Cocina</span>
              <span className="bg-amber-200 px-2 py-0.5 rounded-full font-mono">
                {saleOrders.filter((o) => o.status === 'Comandado' || o.status === 'En Cocina').length}
              </span>
            </div>
            <div className="space-y-2">
              {saleOrders
                .filter((o) => o.status === 'Comandado' || o.status === 'En Cocina')
                .map((o) => (
                  <div key={o.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>#{o.orderNumber}</span>
                      <span className="text-amber-700 font-mono">{fmt(o.totalAmount)}</span>
                    </div>
                    <p className="text-slate-600">{o.clientName}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={async () => {
                        const res = await updateSaleOrderStatus(o.id, 'Listo');
                        showToast(res.message, 'success');
                      }}
                    >
                      Marcar Listo (T3)
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: Listos para entrega */}
          <div className="bg-emerald-50 p-3 rounded-2xl space-y-3 border border-emerald-200">
            <div className="flex items-center justify-between font-bold text-xs text-emerald-900">
              <span>3. Listos para Despacho</span>
              <span className="bg-emerald-200 px-2 py-0.5 rounded-full font-mono">
                {saleOrders.filter((o) => o.status === 'Listo').length}
              </span>
            </div>
            <div className="space-y-2">
              {saleOrders
                .filter((o) => o.status === 'Listo')
                .map((o) => (
                  <div key={o.id} className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>#{o.orderNumber}</span>
                      <span className="text-emerald-700 font-mono">{fmt(o.totalAmount)}</span>
                    </div>
                    <p className="text-slate-600">{o.clientName}</p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                      onClick={async () => {
                        const res = await updateSaleOrderStatus(o.id, 'Entregado');
                        showToast(res.message, 'success');
                      }}
                    >
                      Marcar Entregado (T4)
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 4: Entregados / Pendientes Facturación */}
          <div className="bg-blue-50 p-3 rounded-2xl space-y-3 border border-blue-200">
            <div className="flex items-center justify-between font-bold text-xs text-blue-900">
              <span>4. Entregados / Cobranza</span>
              <span className="bg-blue-200 px-2 py-0.5 rounded-full font-mono">
                {saleOrders.filter((o) => o.status === 'Entregado').length}
              </span>
            </div>
            <div className="space-y-2">
              {saleOrders
                .filter((o) => o.status === 'Entregado')
                .map((o) => (
                  <div key={o.id} className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>#{o.orderNumber}</span>
                      <span className="text-slate-900 font-mono">{fmt(o.totalAmount)}</span>
                    </div>
                    <p className="text-slate-600">{o.clientName}</p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                      onClick={() => setBillingOrder(o)}
                    >
                      Facturar Pedido
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MODALS */}
      {isEditorOpen && (
        <OrderEditorModal
          orderToEdit={editingOrder}
          saleTypes={saleTypeConfigs}
          tables={tableConfigs}
          clients={clients}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveEditor}
        />
      )}

      {comandaOrder && (
        <ComandaModal
          order={comandaOrder}
          onClose={() => setComandaOrder(null)}
          onConfirmSendComanda={handleConfirmSendComanda}
        />
      )}

      {billingOrder && (
        <OrderBillingModal
          order={billingOrder}
          clients={clients}
          employees={employees}
          activeCashShift={activeShift}
          activeCashLines={cashLines}
          onClose={() => setBillingOrder(null)}
          onConfirmBilling={handleConfirmBilling}
        />
      )}

      {timeAuditOrder && (
        <OrderTimeAuditModal
          order={timeAuditOrder}
          onClose={() => setTimeAuditOrder(null)}
        />
      )}

      {ticketOrder && (
        <SaleTicketModal
          order={ticketOrder}
          onClose={() => setTicketOrder(null)}
        />
      )}

      {isHelpOpen && (
        <OrdersHelpModal onClose={() => setIsHelpOpen(false)} />
      )}

      <ConfirmModal
        isOpen={!!orderToCancel}
        title="Anular Pedido"
        message={`¿Estás seguro que deseas anular el pedido #${orderToCancel?.orderNumber}? Esta acción no se puede deshacer y el pedido pasará a estado Cancelado.`}
        confirmText="Anular Pedido"
        cancelText="Volver"
        type="danger"
        requiresInput={true}
        inputLabel="Motivo de Anulación"
        inputPlaceholder="Ej: Cliente se arrepintió, error de carga..."
        onConfirm={(reason) => {
          handleConfirmCancelOrder(reason);
          setOrderToCancel(null);
        }}
        onCancel={() => setOrderToCancel(null)}
      />
    </div>
  );
}
