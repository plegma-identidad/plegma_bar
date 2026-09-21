import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Layers, CheckCircle2, AlertCircle, Plus, Trash2, Split } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { SaleOrder, SaleOrderItem, SplitPaymentLine, Client } from '../../types';

interface SplitBillingModalProps {
  order: SaleOrder;
  clients?: Client[];
  onClose: () => void;
  onConfirmBilling: (billingData: {
    paymentCondition: 'Contado' | 'Cuenta Corriente' | 'Invitación' | 'Gift Card' | 'Consumo Empleado';
    paymentMethod: string;
    splitPayments?: SplitPaymentLine[];
    billedItems?: SaleOrderItem[];
    billedAmount: number;
    notes?: string;
  }) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

const AVAILABLE_PAYMENT_METHODS = [
  { id: 'efectivo', name: 'Efectivo Caja Principal' },
  { id: 'mp_franco', name: 'Mercado Pago Franco' },
  { id: 'mp_fer', name: 'Mercado Pago Fer' },
  { id: 'posnet_debito', name: 'Tarjeta Débito (Posnet)' },
  { id: 'posnet_credito', name: 'Tarjeta Crédito (Posnet)' },
  { id: 'transferencia', name: 'Transferencia Bancaria' },
  { id: 'cuenta_corriente', name: 'Pago Cuenta Corriente (Fiado)' },
];

export const SplitBillingModal: React.FC<SplitBillingModalProps> = ({ order, clients = [], onClose, onConfirmBilling }) => {
  const [billingMode, setBillingMode] = useState<'total' | 'parcial_productos' | 'parcial_monto' | 'multiples_medios'>('total');
  
  // Independent Condition & Method
  const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Cuenta Corriente' | 'Invitación' | 'Gift Card' | 'Consumo Empleado'>('Contado');
  const [primaryMethodId, setPrimaryMethodId] = useState('efectivo');

  const handleConditionChange = (cond: 'Contado' | 'Cuenta Corriente' | 'Invitación' | 'Gift Card' | 'Consumo Empleado') => {
    setPaymentCondition(cond);
    if (cond === 'Cuenta Corriente') {
      setPrimaryMethodId('cuenta_corriente');
    } else if (primaryMethodId === 'cuenta_corriente') {
      setPrimaryMethodId('efectivo');
    }
  };

  const handlePrimaryMethodChange = (methodId: string) => {
    setPrimaryMethodId(methodId);
    if (methodId === 'cuenta_corriente') {
      setPaymentCondition('Cuenta Corriente');
    } else if (paymentCondition === 'Cuenta Corriente') {
      setPaymentCondition('Contado');
    }
  };

  // Parcial por Productos selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(order.items.map((i) => i.id));

  // Parcial por Monto state
  const [customAmount, setCustomAmount] = useState<string>(String(order.totalAmount));

  // Múltiples Medios state
  const [splitLines, setSplitLines] = useState<SplitPaymentLine[]>([
    { id: 'split-1', paymentMethodId: 'efectivo', paymentMethodName: 'Efectivo Caja Principal', amount: Math.round(order.totalAmount / 2) },
    { id: 'split-2', paymentMethodId: 'mp_franco', paymentMethodName: 'Mercado Pago Franco', amount: Math.round(order.totalAmount / 2) },
  ]);

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Calculate totals based on mode
  const calculatedTotal = React.useMemo(() => {
    if (billingMode === 'total') return order.totalAmount;
    if (billingMode === 'parcial_productos') {
      return order.items
        .filter((i) => selectedItemIds.includes(i.id))
        .reduce((acc, i) => acc + i.subtotal, 0);
    }
    if (billingMode === 'parcial_monto') {
      const val = parseFloat(customAmount);
      return isNaN(val) ? 0 : val;
    }
    if (billingMode === 'multiples_medios') {
      return splitLines.reduce((acc, l) => acc + l.amount, 0);
    }
    return order.totalAmount;
  }, [billingMode, order.totalAmount, order.items, selectedItemIds, customAmount, splitLines]);

  const toggleItemSelection = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleAddSplitLine = () => {
    const defaultMethod = AVAILABLE_PAYMENT_METHODS[0];
    const newLine: SplitPaymentLine = {
      id: 'split-' + Date.now(),
      paymentMethodId: defaultMethod.id,
      paymentMethodName: defaultMethod.name,
      amount: 0,
    };
    setSplitLines([...splitLines, newLine]);
  };

  const handleUpdateSplitLine = (id: string, field: keyof SplitPaymentLine, value: any) => {
    setSplitLines(
      splitLines.map((l) => {
        if (l.id === id) {
          if (field === 'paymentMethodId') {
            const m = AVAILABLE_PAYMENT_METHODS.find((met) => met.id === value);
            return { ...l, paymentMethodId: value, paymentMethodName: m?.name || value };
          }
          return { ...l, [field]: value };
        }
        return l;
      })
    );
  };

  const handleRemoveSplitLine = (id: string) => {
    setSplitLines(splitLines.filter((l) => l.id !== id));
  };

  const handleSubmit = () => {
    setError('');

    if (calculatedTotal <= 0) {
      setError('El monto a cobrar debe ser mayor a $0.');
      return;
    }

    if (calculatedTotal > order.totalAmount + 0.01) {
      setError(`El importe a cobrar (${fmt(calculatedTotal)}) no puede superar el total de la comanda (${fmt(order.totalAmount)}).`);
      return;
    }

    const primaryMethodName =
      paymentCondition === 'Cuenta Corriente'
        ? 'Cuenta Corriente'
        : AVAILABLE_PAYMENT_METHODS.find((m) => m.id === primaryMethodId)?.name || 'Efectivo';

    onConfirmBilling({
      paymentCondition,
      paymentMethod: billingMode === 'multiples_medios' ? 'Múltiples Medios' : primaryMethodName,
      splitPayments: billingMode === 'multiples_medios' ? splitLines : undefined,
      billedItems: billingMode === 'parcial_productos' ? order.items.filter((i) => selectedItemIds.includes(i.id)) : order.items,
      billedAmount: calculatedTotal,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header estilo PLEGMA */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Cobro & Cierre de Comanda #{order.orderNumber}</h2>
              <p className="text-xs text-slate-400 font-medium">
                {order.saleTypeName} — {order.tableName || order.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="bg-slate-950 text-white p-4 flex items-center justify-between px-6 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Total Comanda</span>
            <p className="text-2xl font-black text-amber-400">{fmt(order.totalAmount)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Importe a Cobrar</span>
            <p className="text-2xl font-black text-emerald-400">{fmt(calculatedTotal)}</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          {[
            { id: 'total', label: '1. Pago Total', icon: DollarSign },
            { id: 'parcial_productos', label: '2. Por Productos', icon: Split },
            { id: 'parcial_monto', label: '3. Por Monto', icon: Layers },
            { id: 'multiples_medios', label: '4. Múltiples Medios', icon: CreditCard },
          ].map((mode) => {
            const active = billingMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setBillingMode(mode.id as any)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Condition and Primary Method Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <FormField label="Condición Comercial de Pago">
              <SelectInput
                value={paymentCondition}
                onChange={(e) => handleConditionChange(e.target.value as any)}
                options={[
                  { value: 'Contado', label: 'Contado (Inmediato)' },
                  { value: 'Cuenta Corriente', label: 'Pago Cuenta Corriente (Fiado)' },
                  { value: 'Invitación', label: 'Invitación / Sin Cargo' },
                  { value: 'Gift Card', label: 'Gift Card / Voucher' },
                ]}
              />
            </FormField>

            {billingMode !== 'multiples_medios' && (
              <FormField label="Medio de Pago / Cuenta">
                <SelectInput
                  value={primaryMethodId}
                  onChange={(e) => handlePrimaryMethodChange(e.target.value)}
                  options={AVAILABLE_PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.name }))}
                />
              </FormField>
            )}
          </div>

          {paymentCondition === 'Cuenta Corriente' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cobro imputado a la Cuenta Corriente de: <strong>{order.clientName || 'Consumidor Final'}</strong></span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 font-black shrink-0">Cobro Diferido</span>
            </div>
          )}

          {/* Mode 2: Parcial por Productos */}
          {billingMode === 'parcial_productos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Seleccionar productos a cobrar en este pago:</span>
                <span className="text-slate-500">{selectedItemIds.length} de {order.items.length} ítems</span>
              </div>
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
                {order.items.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`flex items-center justify-between p-3.5 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-xs text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900">{item.quantity}x {item.productName}</p>
                          {item.lineComment && <p className="text-[11px] text-slate-500">Obs: {item.lineComment}</p>}
                        </div>
                      </div>
                      <span className="font-black text-slate-900">{fmt(item.subtotal)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 3: Parcial por Monto */}
          {billingMode === 'parcial_monto' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <FormField label="Ingresar Monto a Cobrar en este Pago ($)">
                <TextInput
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Importe ARS"
                />
              </FormField>
              <p className="text-[11px] font-bold text-slate-500">
                Saldo pendiente que quedará en la comanda: <span className="text-rose-600 font-extrabold">{fmt(Math.max(0, order.totalAmount - (parseFloat(customAmount) || 0)))}</span>
              </p>
            </div>
          )}

          {/* Mode 4: Múltiples Medios de Pago */}
          {billingMode === 'multiples_medios' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Desglose de Medios de Pago Combinados:</span>
                <Button variant="secondary" size="sm" onClick={handleAddSplitLine} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Añadir Medio
                </Button>
              </div>

              <div className="space-y-2">
                {splitLines.map((line) => (
                  <div key={line.id} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <SelectInput
                        value={line.paymentMethodId}
                        onChange={(e) => handleUpdateSplitLine(line.id, 'paymentMethodId', e.target.value)}
                        options={AVAILABLE_PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.name }))}
                      />
                    </div>
                    <div className="w-32">
                      <TextInput
                        type="number"
                        value={String(line.amount)}
                        onChange={(e) => handleUpdateSplitLine(line.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Monto"
                      />
                    </div>
                    {splitLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitLine(line.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <FormField label="Observaciones o Comprobante de Cobro">
            <TextInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Transf. N° 4910283, Pago compartido..."
            />
          </FormField>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} leftIcon={<CheckCircle2 className="w-5 h-5" />}>
            Confirmar Cobro ({fmt(calculatedTotal)})
          </Button>
        </div>
      </div>
    </div>
  );
};
