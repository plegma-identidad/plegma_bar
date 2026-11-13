import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Provider, Order, OrderItem, Item } from '../types';
import {
  X,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface OrderReviewModalProps {
  provider: Provider;
  onClose: () => void;
  onOrderConfirmed: (order: Order) => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  provider,
  onClose,
  onOrderConfirmed,
}) => {
  const { items, providerItems, createOrder, receptionHours, userRole } = useApp();

  // Find provider items
  const pItemRels = providerItems.filter((pi) => pi.providerId === provider.id && pi.active);
  const pItems = items.filter((item) => pItemRels.some((rel) => rel.itemId === item.id));

  // Current items included in order review (allows adding extra items)
  const [currentItems, setCurrentItems] = useState<Item[]>(pItems);
  const [selectedExtraItemId, setSelectedExtraItemId] = useState<string>('');

  // Initialize order items with calculated suggested quantities
  const [orderItemsMap, setOrderItemsMap] = useState<{
    [itemId: string]: {
      suggestedQty: number;
      finalQty: number;
      refPrice: number;
      notes: string;
      active: boolean;
    };
  }>(() => {
    const initial: {
      [itemId: string]: {
        suggestedQty: number;
        finalQty: number;
        refPrice: number;
        notes: string;
        active: boolean;
      };
    } = {};

    pItems.forEach((item) => {
      const diffToMax = Math.max(0, item.maxStock - item.currentStock);
      const suggestedPacks = Math.ceil(diffToMax / (item.packQuantity || 1));

      initial[item.id] = {
        suggestedQty: Math.max(1, suggestedPacks),
        finalQty: Math.max(1, suggestedPacks),
        refPrice: (item.currentPrice || 0) * (item.packQuantity || 1), // Reference price per purchase unit
        notes: '',
        active: true,
      };
    });

    return initial;
  });

  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (provider.habitualLeadTimeDays || 1));
    return d.toISOString().split('T')[0];
  });

  const [generalNotes, setGeneralNotes] = useState<string>('');

  const handleQtyChange = (itemId: string, newQty: number) => {
    setOrderItemsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        finalQty: Math.max(1, newQty),
      },
    }));
  };

  const handleToggleItem = (itemId: string) => {
    setOrderItemsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        active: !prev[itemId].active,
      },
    }));
  };

  const handleAddExtraItem = (itemId: string) => {
    if (!itemId) return;
    const itemToAdd = items.find((it) => it.id === itemId);
    if (!itemToAdd) return;

    if (!currentItems.some((it) => it.id === itemId)) {
      setCurrentItems((prev) => [...prev, itemToAdd]);
    }

    setOrderItemsMap((prev) => ({
      ...prev,
      [itemId]: {
        suggestedQty: 1,
        finalQty: 1,
        refPrice: (itemToAdd.currentPrice || 0) * (itemToAdd.packQuantity || 1),
        notes: '',
        active: true,
      },
    }));
    setSelectedExtraItemId('');
  };

  // Calculate estimated order total
  const selectedItemsList = currentItems.filter((item) => orderItemsMap[item.id]?.active);

  const estimatedTotalSum = selectedItemsList.reduce((sum, item) => {
    const entry = orderItemsMap[item.id];
    return sum + (entry ? entry.finalQty * entry.refPrice : 0);
  }, 0);

  const handleConfirmOrder = () => {
    if (selectedItemsList.length === 0) {
      alert('Debe incluir al menos un insumo en el pedido.');
      return;
    }

    const orderItems: OrderItem[] = selectedItemsList.map((item) => {
      const entry = orderItemsMap[item.id];
      return {
        itemId: item.id,
        itemName: item.name,
        unit: item.purchaseUnit,
        suggestedQty: entry.suggestedQty,
        finalQty: entry.finalQty,
        referencePrice: entry.refPrice,
        itemNotes: entry.notes,
      };
    });

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ord-' + Date.now();

    const newOrder: Order = {
      id: newId,
      orderNumber: 'PED-2026-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      providerId: provider.id,
      expectedDeliveryDate,
      userId: `usr-${userRole}`,
      userName: `Usuario (${userRole.toUpperCase()})`,
      status: 'Pendiente de entrega',
      items: orderItems,
      generalNotes,
      receptionHoursSnapshot: receptionHours,
      estimatedTotal: estimatedTotalSum,
      paymentStatus: 'Pendiente de pago',
      paidAmount: 0,
      remainingDebt: estimatedTotalSum,
    };

    createOrder(newOrder);
    onOrderConfirmed(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Generación y Revisión de Pedido a Proveedor
              </h3>
              <p className="text-xs text-orange-300 font-medium">
                Proveedor: {provider.name} • Cierre: {provider.cutoffTime} hs
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
          {/* Header Info & Expected Delivery Date Picker */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Fecha Estimada de Entrega:
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Condición de Pago Habitual:
              </label>
              <div className="py-1.5 px-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
                {provider.paymentCondition}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Importe Total Estimado:
              </label>
              <div className="py-1.5 px-3 bg-orange-50 rounded-xl text-sm font-black text-orange-700 border border-orange-200">
                $ {estimatedTotalSum.toLocaleString('es-AR')}
              </div>
            </div>
          </div>

          {/* Editable Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span>Listado de Insumos del Pedido</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {selectedItemsList.length} de {currentItems.length} seleccionados
                </span>
              </div>

              {/* Selector para agregar insumos adicionales */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedExtraItemId}
                  onChange={(e) => setSelectedExtraItemId(e.target.value)}
                  className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 max-w-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Agregar otro insumo al pedido --</option>
                  {items
                    .filter((it) => !selectedItemsList.some((sel) => sel.id === it.id))
                    .map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.purchaseUnit})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddExtraItem(selectedExtraItemId)}
                  disabled={!selectedExtraItemId}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sumar</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3 w-10 text-center">Quitar</th>
                    <th className="p-3">Insumo</th>
                    <th className="p-3">Unidad de Compra</th>
                    <th className="p-3 text-center">Sugerido</th>
                    <th className="p-3 text-center w-32">Cantidad Final</th>
                    <th className="p-3 text-right">Precio Ref. Unid.</th>
                    <th className="p-3 text-right">Subtotal Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.length === 0 || selectedItemsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500 opacity-80" />
                        <p className="font-bold text-slate-700 text-xs">
                          No hay insumos cargados en este pedido todavía.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Seleccioná un insumo del desplegable superior y hacé clic en "Sumar" para incluirlo.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => {
                      const entry = orderItemsMap[item.id];
                      if (!entry || !entry.active) return null;

                      const subtotal = entry.finalQty * entry.refPrice;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleItem(item.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Quitar del pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Presentación: {item.purchaseUnit}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{item.purchaseUnit}</td>
                          <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/50">
                            {entry.suggestedQty}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              disabled={!entry.active}
                              value={entry.finalQty}
                              onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                              className="w-20 py-1 px-2 text-center text-xs font-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            $ {entry.refPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Order Notes Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Observaciones Generales para el Proveedor:
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ej.: Por favor entregar antes de las 11:00 hs. Facturar a la razón social habitual."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 text-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition text-center"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmOrder}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar y Emitir Pedido al Proveedor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
