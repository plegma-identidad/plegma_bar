import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Sliders,
  Clock,
  Search,
  Coffee,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Printer,
  ChevronLeft,
  Filter,
  User,
  Tag,
  Truck,
  Check,
  MessageSquare,
} from 'lucide-react';
import { Button } from './ui/Button';
import { TextInput } from './ui/Form';
import { useApp } from '../context/AppContext';
import { SaleOrder, SaleOrderItem, OrderStatus } from '../types';
import { SALE_PRODUCT_CATALOG, SaleProductCatalogItem } from '../data/ordersData';
import { ComandasConfigModal } from './salesConfig/ComandasConfigModal';
import { ProductConfiguratorModal } from './orders/ProductConfiguratorModal';
import { SplitBillingModal } from './orders/SplitBillingModal';
import { ComandaModal } from './orders/ComandaModal';
import { NewComandaModal } from './orders/NewComandaModal';
import { OrderItemCommentModal } from './orders/OrderItemCommentModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

// Helper to calculate elapsed time in minutes from T1
const getElapsedMinutes = (createdAt: string): number => {
  const createdDate = new Date(createdAt.replace(' ', 'T')).getTime();
  if (isNaN(createdDate)) return 5;
  const now = new Date().getTime();
  return Math.max(0, Math.floor((now - createdDate) / 60000));
};

// Semáforo Badge Component (Estilo UI PLEGMA)
const SemaforoBadge: React.FC<{ elapsedMin: number; status: OrderStatus }> = ({ elapsedMin, status }) => {
  if (status === 'Cerrado' || status === 'Facturado') {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">Cerrada</span>;
  }
  if (status === 'Listo') {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 shrink-0">🔵 Lista</span>;
  }
  if (status === 'Entregado') {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300 shrink-0">🟠 Entregada</span>;
  }
  const displayMin = elapsedMin > 999 ? `+999` : `${elapsedMin}`;
  if (elapsedMin <= 15) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">🟢 {displayMin} min</span>;
  }
  if (elapsedMin <= 20) {
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 font-bold shrink-0">🟡 {displayMin} min</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse shrink-0">🔴 {displayMin} min</span>;
};

export function ComandasPosView() {
  const {
    saleOrders,
    saleTypeConfigs,
    tableConfigs,
    clients,
    cashShifts,
    createSaleOrder,
    updateSaleOrder,
    updateSaleOrderStatus,
    generateComandaPDF,
    processOrderBilling,
    showToast,
  } = useApp();

  // Active View Mode: 'bandeja' (Pantalla 1) or 'edicion' (Pantalla 3 Columnas)
  const [viewMode, setViewMode] = useState<'bandeja' | 'edicion'>('bandeja');

  // Active editing order
  const [activeOrder, setActiveOrder] = useState<SaleOrder | null>(null);

  // Modals state
  const [isNewComandaModalOpen, setIsNewComandaModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SaleProductCatalogItem | null>(null);
  const [billingOrder, setBillingOrder] = useState<SaleOrder | null>(null);
  const [comandaOrderPreview, setComandaOrderPreview] = useState<SaleOrder | null>(null);
  const [editingCommentItem, setEditingCommentItem] = useState<SaleOrderItem | null>(null);

  // Save comment on specific line item
  const handleSaveItemComment = (itemId: string, comment?: string) => {
    if (!activeOrder) return;
    const updatedItems = activeOrder.items.map((i) => (i.id === itemId ? { ...i, lineComment: comment } : i));
    const updatedOrder = { ...activeOrder, items: updatedItems };
    updateSaleOrder(updatedOrder);
    setActiveOrder(updatedOrder);
    setEditingCommentItem(null);
    showToast('Comentario de ítem actualizado', 'success');
  };

  // Filters for Bandeja
  const [bandejaFilter, setBandejaFilter] = useState<'Todas' | 'Salón' | 'Take Away' | 'Delivery' | 'Demoradas'>('Todas');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // 1-Click vs 2-Click state tracking
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Categories for Columna Central
  const categories = ['Todos', 'Combos', 'Cafetería', 'Hamburguesas', 'Entradas & Minutas', 'Bebidas', 'Postres'];

  // Active Cash Shift
  const activeShift = useMemo(() => cashShifts.find((s) => s.status === 'Abierta'), [cashShifts]);

  // Filtered Orders for Bandeja
  const filteredBandejaOrders = useMemo(() => {
    return saleOrders.filter((o) => {
      if (o.status === 'Facturado' || o.status === 'Cancelado') return false;
      if (bandejaFilter === 'Salón' && !o.saleTypeName.toLowerCase().includes('salón')) return false;
      if (bandejaFilter === 'Take Away' && !o.saleTypeName.toLowerCase().includes('take')) return false;
      if (bandejaFilter === 'Delivery' && !o.saleTypeName.toLowerCase().includes('delivery')) return false;
      if (bandejaFilter === 'Demoradas' && getElapsedMinutes(o.createdAt) <= 20) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = String(o.orderNumber).includes(q);
        const matchesClient = o.clientName.toLowerCase().includes(q);
        const matchesTable = (o.tableName || '').toLowerCase().includes(q);
        if (!matchesNum && !matchesClient && !matchesTable) return false;
      }
      return true;
    });
  }, [saleOrders, bandejaFilter, searchQuery]);

  // Filtered catalog items for Columna Central
  const filteredCatalog = useMemo(() => {
    return SALE_PRODUCT_CATALOG.filter((item) => {
      if (categoryFilter !== 'Todos' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Handle Card Click (Click en tarjeta = Consulta preview)
  const handleOrderCardClick = (order: SaleOrder) => {
    setComandaOrderPreview(order);
  };

  // Start New Comanda (Guided 2-step modal trigger)
  const handleConfirmNewComanda = async (payload: {
    saleTypeId: string;
    saleTypeName: string;
    clientId: string;
    clientName: string;
    tableId?: string;
    tableName?: string;
    deliveryAddress?: string;
  }) => {
    const newOrderPayload: Partial<SaleOrder> = {
      saleTypeId: payload.saleTypeId,
      saleTypeName: payload.saleTypeName,
      clientId: payload.clientId,
      clientName: payload.clientName,
      tableId: payload.tableId,
      tableName: payload.tableName,
      generalNotes: payload.deliveryAddress ? `Delivery: ${payload.deliveryAddress}` : undefined,
      totalAmount: 0,
      items: [],
    };

    const res = await createSaleOrder(newOrderPayload as any);
    if (res.success && res.order) {
      setIsNewComandaModalOpen(false);
      setActiveOrder(res.order);
      setViewMode('edicion');
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'danger');
    }
  };

  // Add Item to Active Order
  const handleSelectProductFromCatalog = async (prod: SaleProductCatalogItem) => {
    if (!activeOrder) return;

    if (prod.isConfigurable || prod.requiresSideOption) {
      setSelectedCatalogItem(prod);
    } else {
      // Add simple item directly
      const newItem: SaleOrderItem = {
        id: 'item-' + Date.now() + Math.random(),
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        unitPrice: prod.unitPrice,
        costPrice: prod.costPrice,
        quantity: 1,
        subtotal: prod.unitPrice,
      };

      const updatedItems = [...activeOrder.items, newItem];
      const updatedTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);

      const updatedOrder: SaleOrder = {
        ...activeOrder,
        items: updatedItems,
        totalAmount: updatedTotal,
      };

      await updateSaleOrder(updatedOrder);
      setActiveOrder(updatedOrder);
    }
  };

  // Confirm item from ProductConfiguratorModal
  const handleConfirmConfiguredItem = async (newItem: SaleOrderItem) => {
    if (!activeOrder) return;
    const updatedItems = [...activeOrder.items, newItem];
    const updatedTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);

    const updatedOrder: SaleOrder = {
      ...activeOrder,
      items: updatedItems,
      totalAmount: updatedTotal,
    };

    await updateSaleOrder(updatedOrder);
    setActiveOrder(updatedOrder);
    setSelectedCatalogItem(null);
    showToast(`Ítem "${newItem.productName}" agregado`, 'success');
  };

  // Update item quantity in active order
  const handleUpdateItemQuantity = async (itemId: string, delta: number) => {
    if (!activeOrder) return;
    const updatedItems = activeOrder.items
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const unitP = item.unitPrice;
          return { ...item, quantity: newQty, subtotal: unitP * newQty };
        }
        return item;
      })
      .filter(Boolean) as SaleOrderItem[];

    const updatedTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const updatedOrder = { ...activeOrder, items: updatedItems, totalAmount: updatedTotal };

    await updateSaleOrder(updatedOrder);
    setActiveOrder(updatedOrder);
  };

  // Remove line item
  const handleRemoveItem = async (itemId: string) => {
    if (!activeOrder) return;
    const updatedItems = activeOrder.items.filter((i) => i.id !== itemId);
    const updatedTotal = updatedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const updatedOrder = { ...activeOrder, items: updatedItems, totalAmount: updatedTotal };

    await updateSaleOrder(updatedOrder);
    setActiveOrder(updatedOrder);
  };

  // Print / Send Comanda to Kitchen
  const handlePrintComanda = async (order: SaleOrder) => {
    const res = await generateComandaPDF(order.id);
    if (res.success) {
      setComandaOrderPreview(order);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'danger');
    }
  };

  // Confirm billing
  const handleConfirmBilling = async (billingData: any) => {
    if (!billingOrder) return;
    const res = await processOrderBilling(billingOrder.id, {
      clientId: billingOrder.clientId,
      clientName: billingOrder.clientName,
      paymentCondition: billingData.paymentCondition,
      paymentMethod: billingData.paymentMethod,
      discountPercentage: 0,
      subtotalAmount: billingOrder.totalAmount,
      finalTotal: billingData.billedAmount,
      notes: billingData.notes,
    });

    if (res.success) {
      showToast('Comanda cobrada y cerrada exitosamente', 'success');
      setBillingOrder(null);
      if (activeOrder?.id === billingOrder.id) {
        setViewMode('bandeja');
        setActiveOrder(null);
      }
    } else {
      showToast(res.message, 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Header Banner estilo PLEGMA */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-black">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Módulo Ventas</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">v2.0 Bistrosoft</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">Función Comandas POS</h1>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center space-x-3">
          {activeShift && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-300">Caja: {activeShift.shiftNumber}</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsConfigOpen(true)}
            leftIcon={<Sliders className="w-4 h-4 text-amber-400" />}
          >
            ⚙️ Configuración
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewComandaModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Nueva Comanda
          </Button>
        </div>
      </header>

      {/* Main View Switcher */}
      {viewMode === 'bandeja' ? (
        <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Bandeja Controls & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-black text-slate-900">Bandeja de Comandas Activas</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                {filteredBandejaOrders.length} Comandas
              </span>
            </div>

            {/* Channel Filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {(['Todas', 'Salón', 'Take Away', 'Delivery', 'Demoradas'] as const).map((filter) => {
                const active = bandejaFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setBandejaFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* Instruction legend */}
            <div className="hidden lg:flex items-center space-x-4 text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1 text-slate-700" /> Clic en tarjeta: Consulta vista previa</span>
            </div>
          </div>

          {/* Cards Grid con distribución amplia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {filteredBandejaOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderCardClick(order)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:border-amber-400 relative overflow-hidden"
                >
                  {/* Card Header Limpio */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-black text-lg text-slate-900 shrink-0">#{String(order.orderNumber).padStart(4, '0')}</span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 truncate">
                        {order.saleTypeName}
                      </span>
                    </div>

                    <SemaforoBadge elapsedMin={elapsed} status={order.status} />
                  </div>

                  {/* Body Info */}
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{order.tableName || order.clientName}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">
                      📦 {order.items.length} {order.items.length === 1 ? 'ítem cargado' : 'ítems cargados'}
                    </p>
                  </div>

                  {/* Botones de Acción de la Tarjeta en 4 Columnas */}
                  <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setActiveOrder(order);
                        setViewMode('edicion');
                      }}
                      className="py-2 px-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1 shadow-2xs transition-all"
                      title="Abrir toma de pedido en 3 columnas"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handlePrintComanda(order)}
                      className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
                      title="Imprimir comanda de cocina"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Cocina</span>
                    </button>

                    <button
                      onClick={() => {
                        updateSaleOrderStatus(order.id, 'Listo');
                        showToast(`Comanda #${order.orderNumber} marcada como Lista 🔵`, 'success');
                      }}
                      className="py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-all"
                      title="Marcar comanda como lista"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lista</span>
                    </button>

                    <button
                      onClick={() => setBillingOrder(order)}
                      className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center space-x-1 transition-all"
                      title="Cobrar comanda"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cobrar</span>
                    </button>
                  </div>

                  {/* Card Footer Price */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/70">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Comanda</span>
                    <span className="text-lg font-black text-slate-900">{fmt(order.totalAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Modo Edición en 3 Columnas */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-73px)]">
          {/* COLUMNA 1 (Izquierda): COMANDA ACTUAL */}
          <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-md z-10">
            {/* Header Columna 1 */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('bandeja')}
                  className="px-0 py-0 text-amber-600 hover:text-amber-700 font-extrabold mb-1"
                >
                  ← Volver a Bandeja
                </Button>
                <h3 className="font-black text-slate-900 text-sm">
                  Comanda #{activeOrder ? String(activeOrder.orderNumber).padStart(4, '0') : ''}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                {activeOrder?.saleTypeName}
              </span>
            </div>

            {/* Campo Comentario General de Comanda (Ubicado ARRIBA de donde va poniendo el detalle de artículos) */}
            <div className="p-3 bg-amber-50/70 border-b border-amber-200 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-between">
                <span className="flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Comentario General de Comanda
                </span>
                <span className="text-[10px] font-medium text-amber-700">(Cocina / Mozo)</span>
              </label>
              <TextInput
                value={activeOrder?.generalNotes || ''}
                onChange={(e) => {
                  if (!activeOrder) return;
                  const updatedOrder = { ...activeOrder, generalNotes: e.target.value };
                  setActiveOrder(updatedOrder);
                  updateSaleOrder(updatedOrder);
                }}
                placeholder="Ej: Mesas pegadas, sin cubiertos, marchado urgente..."
                className="bg-white border-amber-200 text-xs text-slate-800 focus:ring-amber-500"
              />
            </div>

            {/* Line Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeOrder?.items.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Comanda vacía</p>
                  <p className="text-[11px]">Selecciona productos de la carta central para agregar.</p>
                </div>
              ) : (
                activeOrder?.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
                    onClick={() => setEditingCommentItem(item)}
                    title="Haz clic para agregar o modificar comentario en este artículo"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5">
                          <p className="font-black text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                            {item.productName}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCommentItem(item);
                            }}
                            className="p-0.5 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Editar comentario de ítem"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="text-[11px] text-slate-500 font-medium space-y-0.5 mt-0.5">
                            {item.selectedOptions.map((opt, idx) => (
                              <p key={idx}>• {opt.groupName}: <span className="font-bold text-slate-700">{opt.optionName}</span></p>
                            ))}
                          </div>
                        )}
                        {item.lineComment ? (
                          <p className="text-[11px] text-amber-700 font-extrabold italic mt-1 bg-amber-100/80 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                            💬 "{item.lineComment}"
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium mt-1 italic group-hover:text-amber-600">
                            + Agregar comentario a este artículo...
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors ml-2"
                        title="Quitar artículo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-0.5">
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-black text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-black text-xs text-slate-900">{fmt(item.subtotal)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total and Action Buttons Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-slate-400">Total Comanda</span>
                <span className="text-2xl font-black text-amber-400">{fmt(activeOrder?.totalAmount || 0)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => activeOrder && setBillingOrder(activeOrder)}
                  disabled={!activeOrder || activeOrder.items.length === 0}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                >
                  Cobrar
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => activeOrder && handlePrintComanda(activeOrder)}
                  disabled={!activeOrder || activeOrder.items.length === 0}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Imprimir
                </Button>
              </div>
            </div>
          </div>

          {/* COLUMNA 2 (Centro): CARTA VISUAL POR CATEGORÍAS */}
          <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden">
            {/* Filter Pills Header */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                        active
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre o código en la carta..."
              />
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredCatalog.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProductFromCatalog(prod)}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{prod.category}</span>
                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                      {prod.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-black text-sm text-slate-900">{fmt(prod.unitPrice)}</span>
                    {prod.isConfigurable && (
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                        Configurable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Modal 1: Apertura Guiada en 2 Pasos */}
      {isNewComandaModalOpen && (
        <NewComandaModal
          saleTypes={saleTypeConfigs}
          tables={tableConfigs}
          clients={clients}
          onClose={() => setIsNewComandaModalOpen(false)}
          onConfirmCreate={handleConfirmNewComanda}
        />
      )}

      {/* Modal 2: Configuración de Maestros (Drawer ⚙️) */}
      {isConfigOpen && <ComandasConfigModal onClose={() => setIsConfigOpen(false)} />}

      {/* Modal 3: Configurador de Producto (Combo Merienda / Opciones) */}
      {selectedCatalogItem && (
        <ProductConfiguratorModal
          product={selectedCatalogItem}
          onClose={() => setSelectedCatalogItem(null)}
          onConfirmItem={handleConfirmConfiguredItem}
        />
      )}

      {/* Modal 4: Cobro Dividido */}
      {billingOrder && (
        <SplitBillingModal
          order={billingOrder}
          clients={clients}
          onClose={() => setBillingOrder(null)}
          onConfirmBilling={handleConfirmBilling}
        />
      )}

      {/* Modal 5: Visor de Comanda de Cocina / Impresión A4 */}
      {comandaOrderPreview && (
        <ComandaModal
          order={comandaOrderPreview}
          onClose={() => setComandaOrderPreview(null)}
          onConfirmSendComanda={() => handlePrintComanda(comandaOrderPreview)}
        />
      )}

      {/* Modal 6: Edición de Comentario por Ítem Cargado */}
      {editingCommentItem && (
        <OrderItemCommentModal
          item={editingCommentItem}
          onClose={() => setEditingCommentItem(null)}
          onSaveComment={handleSaveItemComment}
        />
      )}
    </div>
  );
}
