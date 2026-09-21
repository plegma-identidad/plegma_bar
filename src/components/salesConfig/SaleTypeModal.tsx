import React, { useState } from 'react';
import { X, Save, ShoppingBag, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { SaleTypeConfig } from '../../types';

interface SaleTypeModalProps {
  saleTypeToEdit?: SaleTypeConfig | null;
  onClose: () => void;
  onSave: (data: any) => { success: boolean; message: string };
}

const ORDER_STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Comandado', label: 'Comandado' },
  { value: 'En Cocina', label: 'En Cocina' },
  { value: 'Listo', label: 'Listo' },
  { value: 'Entregado', label: 'Entregado' },
  { value: 'Cerrado', label: 'Cerrado' },
  { value: 'Facturado', label: 'Facturado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

const PRINTER_OPTIONS = [
  { value: '', label: 'Sin Impresora Seleccionada' },
  { value: 'Impresora Cocina Salón', label: 'Impresora Cocina Salón' },
  { value: 'Impresora Despacho Delivery', label: 'Impresora Despacho Delivery' },
  { value: 'Impresora Barra', label: 'Impresora Barra' },
  { value: 'Impresora Caja Principal', label: 'Impresora Caja Principal' },
];

export const SaleTypeModal: React.FC<SaleTypeModalProps> = ({
  saleTypeToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(saleTypeToEdit?.name || '');
  const [isSalonSale, setIsSalonSale] = useState(saleTypeToEdit ? saleTypeToEdit.isSalonSale : true);
  const [requiresTable, setRequiresTable] = useState(saleTypeToEdit ? saleTypeToEdit.requiresTable : true);
  const [requiresClient, setRequiresClient] = useState(saleTypeToEdit ? saleTypeToEdit.requiresClient : false);
  const [initialOrderStatus, setInitialOrderStatus] = useState(
    saleTypeToEdit?.initialOrderStatus || 'Pendiente'
  );
  const [finalOrderStatus, setFinalOrderStatus] = useState(
    saleTypeToEdit?.finalOrderStatus || 'Facturado'
  );
  const [autoPrintTicket, setAutoPrintTicket] = useState(
    saleTypeToEdit ? saleTypeToEdit.autoPrintTicket : true
  );
  const [kitchenPrinter, setKitchenPrinter] = useState(saleTypeToEdit?.kitchenPrinter || 'Impresora Cocina Salón');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del canal / tipo de venta es obligatorio (R-TV01).');
      return;
    }

    const payload = {
      ...(saleTypeToEdit ? saleTypeToEdit : {}),
      name: name.trim(),
      isSalonSale,
      requiresTable,
      requiresClient,
      initialOrderStatus,
      finalOrderStatus,
      autoPrintTicket,
      kitchenPrinter: kitchenPrinter || undefined,
      active: saleTypeToEdit ? saleTypeToEdit.active : true,
    };

    const res = await onSave(payload);
    if (res && !res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {saleTypeToEdit ? 'Editar Tipo de Venta' : 'Crear Tipo de Venta'}
              </h3>
              <p className="text-xs text-slate-400">Canal comercializador y reglas operativas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <FormField label="Nombre del Canal de Venta" required hint="Ej. Salón, Delivery, Takeaway (R-TV01)">
            <TextInput
              placeholder="Ej. Delivery App / PedidosYa"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          </FormField>

          {/* Operational Switches */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Reglas de Operación Comercial</p>
            
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
              <span>Venta en el Salón (Consumo dentro del local)</span>
              <input
                type="checkbox"
                checked={isSalonSale}
                onChange={(e) => setIsSalonSale(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
              <span>Requiere Mesa Obligatoria (R-TV03)</span>
              <input
                type="checkbox"
                checked={requiresTable}
                onChange={(e) => setRequiresTable(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
              <span>Requiere Cliente Asociado</span>
              <input
                type="checkbox"
                checked={requiresClient}
                onChange={(e) => setRequiresClient(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
              <span>Imprime Ticket Automático al Cierre</span>
              <input
                type="checkbox"
                checked={autoPrintTicket}
                onChange={(e) => setAutoPrintTicket(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estado Inicial del Pedido" required hint="Al crear pedido (R-TV02)">
              <SelectInput
                options={ORDER_STATUS_OPTIONS}
                value={initialOrderStatus}
                onChange={(e) => setInitialOrderStatus(e.target.value)}
              />
            </FormField>

            <FormField label="Estado Final del Pedido" required hint="Al cerrar ticket (A-TV02)">
              <SelectInput
                options={ORDER_STATUS_OPTIONS}
                value={finalOrderStatus}
                onChange={(e) => setFinalOrderStatus(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Comanda en Impresora (Opcional)" hint="Dispositivo asignado para comanda">
            <SelectInput
              options={PRINTER_OPTIONS}
              value={kitchenPrinter}
              onChange={(e) => setKitchenPrinter(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              {saleTypeToEdit ? 'Guardar Cambios' : 'Crear Canal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
