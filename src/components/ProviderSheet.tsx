import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Provider, ProcessState, DayOfWeek } from '../types';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building2,
  ClipboardList,
  ShoppingCart,
  Truck,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Edit2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface ProviderSheetProps {
  provider: Provider;
  onClose: () => void;
  onStartStockCount: () => void;
  onStartOrderReview: () => void;
  onReceiveGoods: () => void;
  onRecordPayment: () => void;
  onViewOrderDocument: (orderId: string) => void;
}

export const ProviderSheet: React.FC<ProviderSheetProps> = ({
  provider,
  onClose,
  onStartStockCount,
  onStartOrderReview,
  onReceiveGoods,
  onRecordPayment,
  onViewOrderDocument,
}) => {
  const {
    getProviderState,
    getProviderActiveOrder,
    getProviderActiveCount,
    items,
    providerItems,
    orders,
    priceHistory,
    expenses,
    updateProviderDays,
    addOrUpdateProvider,
    userRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'insumos' | 'pedidos' | 'precios' | 'comercial' | 'editar'
  >('resumen');

  // Provider items calculation
  const pItemRels = providerItems.filter((pi) => pi.providerId === provider.id && pi.active);
  const pItems = items.filter((item) => pItemRels.some((rel) => rel.itemId === item.id));

  // Provider orders calculation
  const pOrders = orders
    .filter((o) => o.providerId === provider.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeOrder = getProviderActiveOrder(provider.id);
  const activeCount = getProviderActiveCount(provider.id);
  const currentState = getProviderState(provider.id);

  // Total pending debt calculation for this provider
  const pendingDebtTotal = pOrders.reduce((sum, o) => sum + (o.remainingDebt || 0), 0);

  // Price history entries for items of this provider
  const pPriceHistory = priceHistory.filter((ph) => ph.providerId === provider.id);

  // Editing state for provider details
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [editOrderDays, setEditOrderDays] = useState<DayOfWeek[]>(provider.orderDays || []);
  const [editDeliveryDays, setEditDeliveryDays] = useState<DayOfWeek[]>(provider.deliveryDays || []);

  const handleSaveDays = () => {
    updateProviderDays(provider.id, editOrderDays, editDeliveryDays);
    setIsEditingDays(false);
  };

  const DAYS_LIST: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end print:hidden">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-orange-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                {provider.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{provider.name}</h2>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  {provider.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {provider?.rubro || 'General'} • {provider?.commercialName || ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Quick Bar & WhatsApp / Phone Buttons */}
        <div className="bg-slate-800 text-white px-5 py-2.5 flex items-center justify-between text-xs border-b border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Contacto: <strong>{provider.contactName}</strong></span>
            <span className="text-slate-400 hidden sm:inline">CUIT: {provider.cuit}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${provider.whatsapp}?text=Hola%20${encodeURIComponent(
                provider.contactName
              )},%20te%20escribo%20del%20local%20gastronómico.`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Llamar</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex overflow-x-auto bg-slate-100 border-b border-slate-200 px-5 gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'resumen'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Resumen Operativo
          </button>
          <button
            onClick={() => setActiveTab('insumos')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'insumos'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Insumos ({pItems.length})
          </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'pedidos'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Pedidos ({pOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('precios')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'precios'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Historial Precios ({pPriceHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('comercial')}
            className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'comercial'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Datos Bancarios & Pagos
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* TAB 1: RESUMEN OPERATIVO */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Primary Operational Action Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    Estado Actual
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-lg font-black text-slate-900">{currentState}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Último conteo registrado:{' '}
                    {activeCount ? new Date(activeCount.date).toLocaleDateString('es-AR') : 'Sin registro reciente'}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onStartStockCount}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Realizar Conteo</span>
                  </button>

                  <button
                    onClick={onStartOrderReview}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Generar Pedido</span>
                  </button>

                  {activeOrder && (activeOrder.status === 'Pendiente de entrega' || activeOrder.status === 'Pedido confirmado') && (
                    <button
                      onClick={onReceiveGoods}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Registrar Ingreso</span>
                    </button>
                  )}

                  {pendingDebtTotal > 0 && (
                    <button
                      onClick={onRecordPayment}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Saldar Deuda</span>
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Mini-Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Insumos Asociados</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{pItems.length} insumos</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Deuda Pendiente</span>
                  <div
                    className={`text-lg font-black mt-0.5 ${
                      pendingDebtTotal > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    $ {pendingDebtTotal.toLocaleString('es-AR')}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Cierre de Pedido</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{provider.cutoffTime} hs</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Plazo de Pago</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{provider.paymentCondition}</div>
                </div>
              </div>

              {/* Schedule & Days Configuration Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>Planificación Semanal de Pedidos y Entregas</span>
                  </h4>
                  {(userRole === 'admin' || userRole === 'compras') && (
                    <button
                      onClick={() => setIsEditingDays(!isEditingDays)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditingDays ? 'Cancelar' : 'Modificar Días'}</span>
                    </button>
                  )}
                </div>

                {isEditingDays ? (
                  <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-200">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        Días de Pedido (Realizar control / pedido):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_LIST.map((day) => (
                          <button
                            key={day}
                            onClick={() =>
                              setEditOrderDays((prev) =>
                                prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              editOrderDays.includes(day)
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        Días Habituales de Entrega:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_LIST.map((day) => (
                          <button
                            key={day}
                            onClick={() =>
                              setEditDeliveryDays((prev) =>
                                prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              editDeliveryDays.includes(day)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveDays}
                      className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 shadow-sm"
                    >
                      Guardar Configuración de Días
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium block">Días de Pedido (Control):</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-1">
                        {(provider.orderDays || []).join(', ') || 'No especificados'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium block">Días de Entrega Estimados:</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-1">
                        {(provider.deliveryDays || []).join(', ') || 'No especificados'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Order Summary Card (if exists) */}
              {activeOrder && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <h4 className="font-bold text-sm text-slate-900">
                        Pedido Activo: #{activeOrder.orderNumber}
                      </h4>
                    </div>
                    <button
                      onClick={() => onViewOrderDocument(activeOrder.id)}
                      className="text-xs text-orange-600 hover:underline font-bold"
                    >
                      Ver PDF / Documento
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Fecha Emisión:</span>
                      <p className="font-bold text-slate-800">
                        {new Date(activeOrder.date).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Monto Estimado:</span>
                      <p className="font-bold text-slate-800">
                        $ {activeOrder.estimatedTotal.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Estado Pago:</span>
                      <p className="font-bold text-rose-600">{activeOrder.paymentStatus}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSUMOS ASOCIADOS */}
          {activeTab === 'insumos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  Insumos Comercializados por {provider.name}
                </h4>
                <span className="text-xs text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full font-bold">
                  {pItems.length} productos
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">Código</th>
                        <th className="p-3">Insumo</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Unid. Compra</th>
                        <th className="p-3 text-center">Stock Actual</th>
                        <th className="p-3 text-center">Min / Max</th>
                        <th className="p-3 text-right">Precio Vigente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pItems.map((item) => {
                        const isLow = item.currentStock < item.minStock;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold text-slate-500">{item.code}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{item.name}</span>
                              <span className="text-[10px] text-slate-400">{item.brand}</span>
                            </td>
                            <td className="p-3 text-slate-600">{item.category}</td>
                            <td className="p-3 font-semibold text-slate-700">{item.purchaseUnit}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`font-black px-2 py-0.5 rounded-full text-xs ${
                                  isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {item.currentStock} {item.storageUnit}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-500 font-medium">
                              {item.minStock} / {item.maxStock} {item.storageUnit}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              $ {item.currentPrice.toLocaleString('es-AR')} / {item.storageUnit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL DE PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Historial de Pedidos Realizados</h4>

              {pOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Aún no existen pedidos registrados con este proveedor.
                </div>
              ) : (
                <div className="space-y-3">
                  {pOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">#{ord.orderNumber}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(ord.date).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {ord.items.length} ítems • Usuario: {ord.userName}
                        </p>
                        {ord.invoiceOrReceiptNumber && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Comprobante: {ord.invoiceOrReceiptNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-slate-900 block">
                            $ {(ord.finalReceivedTotal || ord.estimatedTotal).toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {ord.status}
                          </span>
                        </div>

                        <button
                          onClick={() => onViewOrderDocument(ord.id)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition"
                        >
                          Ver PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORIAL DE PRECIOS */}
          {activeTab === 'precios' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Evolución de Precios del Proveedor</h4>

              {pPriceHistory.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No se han registrado variaciones de precio para este proveedor.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Insumo</th>
                        <th className="p-3 text-right">Precio Anter.</th>
                        <th className="p-3 text-right">Precio Nuevo</th>
                        <th className="p-3 text-right">Aumento %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pPriceHistory.map((ph) => {
                        const itemObj = items.find((i) => i.id === ph.itemId);
                        return (
                          <tr key={ph.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500 font-mono">{ph.date}</td>
                            <td className="p-3 font-bold text-slate-800">{itemObj?.name || 'Insumo'}</td>
                            <td className="p-3 text-right text-slate-500">$ {ph.oldPrice.toLocaleString('es-AR')}</td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              $ {ph.newPrice.toLocaleString('es-AR')}
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                +{ph.variationPercentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATOS COMERCIALES Y BANCARIOS */}
          {activeTab === 'comercial' && (
            <div className="space-y-6">
              {/* Commercial Conditions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>Condiciones Comerciales y Medios de Pago</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Cuenta Corriente:</span>
                    <p className="font-bold text-slate-800">
                      {provider.currentAccount ? '✅ Habilitada' : '❌ No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Plazo de Pago:</span>
                    <p className="font-bold text-slate-800">{provider.paymentTermDays} días</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Condición Habitual:</span>
                    <p className="font-bold text-slate-800">{provider.paymentCondition}</p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Medios Aceptados:</span>
                  {provider.acceptsCash && (
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Efectivo
                    </span>
                  )}
                  {provider.acceptsTransfer && (
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                      Transferencia
                    </span>
                  )}
                  {provider.acceptsCheque && (
                    <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                      Cheque
                    </span>
                  )}
                </div>
              </div>

              {/* Banking Details Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  <span>Datos Bancarios para Transferencias</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">Banco:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{provider.bankName || 'N/D'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">Titular de la Cuenta:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{provider.accountOwner || provider.commercialName}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">Alias CBU/CVU:</span>
                    <span className="font-mono font-extrabold text-orange-600 text-sm select-all">
                      {provider.alias || 'N/D'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">CBU / CVU:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-xs select-all">
                      {provider.cbuCvu || 'N/D'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
