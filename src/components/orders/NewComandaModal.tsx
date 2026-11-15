import React, { useState } from 'react';
import { X, Utensils, MapPin, User, ArrowRight, CheckCircle2, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { SaleTypeConfig, RestaurantTableConfig, Client, SaleOrder } from '../../types';

interface NewComandaModalProps {
  saleTypes?: SaleTypeConfig[];
  tables?: RestaurantTableConfig[];
  clients?: Client[];
  existingOrders?: SaleOrder[];
  onClose: () => void;
  onSelectExistingOrder?: (order: SaleOrder) => void;
  onConfirmCreate: (payload: {
    saleTypeId: string;
    saleTypeName: string;
    clientId: string;
    clientName: string;
    tableId?: string;
    tableName?: string;
    deliveryAddress?: string;
  }) => void;
}

export const NewComandaModal: React.FC<NewComandaModalProps> = ({
  saleTypes = [],
  tables = [],
  clients = [],
  existingOrders = [],
  onClose,
  onSelectExistingOrder,
  onConfirmCreate,
}) => {
  const safeClients = clients || [];
  const activeSaleTypes = (saleTypes || []).filter((st) => st && st.active);
  const activeTables = (tables || []).filter((t) => t && t.active);

  const [step, setStep] = useState<1 | 2>(1);

  // Selected Sale Type
  const [selectedSaleTypeId, setSelectedSaleTypeId] = useState<string>(activeSaleTypes[0]?.id || '');
  const selectedSaleType = activeSaleTypes.find((st) => st.id === selectedSaleTypeId) || activeSaleTypes[0];

  // Step 2 Form States
  const [tableId, setTableId] = useState<string>(activeTables[0]?.id || '');
  const [clientId, setClientId] = useState<string>(safeClients[0]?.id || '');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedTable = activeTables.find((t) => t.id === tableId);
  const selectedClient = safeClients.find((c) => c.id === clientId) || safeClients[0];

  // Función robusta para comprobar si una orden pertenece a la mesa seleccionada
  const isOrderMatchingSelectedTable = (o: SaleOrder) => {
    if (!o || o.status === 'Facturado' || o.status === 'Cancelado') return false;

    // 1. Coincidencia directa por ID de mesa
    if (o.tableId && (o.tableId === tableId || (selectedTable && o.tableId === selectedTable.id))) {
      return true;
    }

    if (!selectedTable) return false;

    // 2. Coincidencia por nombre completo de mesa (case insensitive)
    if (o.tableName && selectedTable.name) {
      if (o.tableName.toLowerCase().trim() === selectedTable.name.toLowerCase().trim()) {
        return true;
      }
    }

    // 3. Extracción de dígitos de número de mesa (ej: "Mesa 01", "1", "01", "TBL-01")
    const extractDigits = (val?: string) => {
      if (!val) return null;
      const m = val.match(/\d+/);
      return m ? parseInt(m[0], 10) : null;
    };

    const orderDigits = extractDigits(o.tableName) ?? extractDigits(o.tableId);
    const tableDigits = extractDigits(selectedTable.number) ?? extractDigits(selectedTable.name) ?? extractDigits(selectedTable.id);

    if (orderDigits !== null && tableDigits !== null && orderDigits === tableDigits) {
      return true;
    }

    return false;
  };

  // Detectar si la mesa seleccionada ya tiene una comanda activa en curso
  const existingTableOrder =
    selectedSaleType?.requiresTable && selectedTable
      ? (existingOrders || []).find((o) => isOrderMatchingSelectedTable(o))
      : undefined;

  const isDelivery = Boolean(
    selectedSaleType?.name?.toLowerCase().includes('delivery') ||
    selectedSaleType?.id === 'st-002'
  );

  // Auto-cargar dirección del cliente al seleccionar canal Delivery o cambiar de cliente
  React.useEffect(() => {
    if (isDelivery && selectedClient) {
      setDeliveryAddress(selectedClient.address || '');
    }
  }, [clientId, isDelivery, selectedSaleTypeId]);

  // Auto-seleccionar primera mesa si no hay ninguna seleccionada
  React.useEffect(() => {
    if (activeTables.length > 0 && (!tableId || !activeTables.some((t) => t.id === tableId))) {
      setTableId(activeTables[0].id);
    }
  }, [activeTables, tableId]);

  const handleNextStep = () => {
    if (!selectedSaleType) return;
    setStep(2);
  };

  const handleSubmit = () => {
    setError('');

    if (!selectedSaleType) {
      setError('Debe seleccionar un tipo de venta.');
      return;
    }

    // Validation: Mesa required for Salon sale
    if (selectedSaleType.requiresTable && (!tableId || !tableId.trim())) {
      setError(`El canal "${selectedSaleType.name}" requiere la asignación obligatoria de una mesa.`);
      return;
    }

    // Validation: Client required for Delivery sale
    if (selectedSaleType.requiresClient && (!clientId || !clientId.trim())) {
      setError(`El canal "${selectedSaleType.name}" requiere la selección obligatoria de un cliente.`);
      return;
    }

    // Validation: Dirección obligatoria para Delivery
    if (isDelivery && (!deliveryAddress || !deliveryAddress.trim())) {
      setError('Para comandas de tipo Delivery, la dirección de entrega es obligatoria. Por favor ingrésela.');
      return;
    }

    const formattedTableName = selectedSaleType.requiresTable && selectedTable
      ? (selectedTable.name || `${selectedTable.number.toLowerCase().startsWith('mesa') ? selectedTable.number : `Mesa ${selectedTable.number}`} (${selectedTable.siteName || 'Salón'})`)
      : selectedSaleType.requiresTable
      ? 'Mesa 01'
      : undefined;

    onConfirmCreate({
      saleTypeId: selectedSaleType.id,
      saleTypeName: selectedSaleType.name,
      clientId: selectedClient ? selectedClient.id : 'cli-001',
      clientName: selectedClient ? selectedClient.name : 'Consumidor Final',
      tableId: selectedSaleType.requiresTable ? selectedTable?.id : undefined,
      tableName: formattedTableName,
      deliveryAddress: isDelivery ? deliveryAddress.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Paso {step} de 2
              </span>
              <h2 className="text-lg font-black tracking-tight">
                {step === 1 ? 'Apertura de Nueva Comanda' : `Asignar Datos (${selectedSaleType?.name || 'Venta'})`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* PASO 1: SELECCIONAR TIPO DE VENTA */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Paso 1: Seleccione la modalidad comercial para la nueva comanda:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {activeSaleTypes.map((st) => {
                  const isSelected = selectedSaleTypeId === st.id;
                  const Icon = st.isSalonSale ? Utensils : st.name.toLowerCase().includes('delivery') ? Truck : ShoppingBag;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedSaleTypeId(st.id)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-sm text-slate-950 font-black'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 font-bold'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black">{st.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {st.requiresTable ? 'Requiere Mesa' : st.requiresClient ? 'Requiere Cliente' : 'Carga Rápida'}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PASO 2: ASIGNAR MESA / CLIENTE SEGÚN TIPO */
            <div className="space-y-4">
              {selectedSaleType?.requiresTable && (
                <FormField label="Seleccionar Mesa en Salón" required>
                  <SelectInput
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    options={activeTables.map((t) => {
                      const displayLabel = t.name
                        ? `${t.name} (Capacidad: ${t.capacity} pax)`
                        : `${t.number.toLowerCase().startsWith('mesa') ? t.number : `Mesa ${t.number}`} — ${t.siteName || 'Salón'} (Cap: ${t.capacity} pax)`;
                      return {
                        value: t.id,
                        label: displayLabel,
                      };
                    })}
                  />
                </FormField>
              )}

              {/* Detección de Comanda Activa para la Mesa */}
              {existingTableOrder && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-slate-800 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-950">
                        ¡{selectedTable?.name || `Mesa ${selectedTable?.number || ''}`} ya tiene la Comanda #{String(existingTableOrder.orderNumber).padStart(4, '0')} activa!
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Estado: <span className="font-bold text-amber-800 uppercase">{existingTableOrder.kitchenStatus || existingTableOrder.status}</span> ({existingTableOrder.items.length} {existingTableOrder.items.length === 1 ? 'ítem cargado' : 'ítems cargados'}).
                        Si deseas agregar productos a esta misma mesa, presiona el botón para sumarlos a la orden en curso.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    {onSelectExistingOrder && (
                      <button
                        type="button"
                        onClick={() => onSelectExistingOrder(existingTableOrder)}
                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span>✏️ Agregar productos a Comanda #{String(existingTableOrder.orderNumber).padStart(4, '0')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <FormField label="Asociar Cliente" required={selectedSaleType?.requiresClient}>
                <SelectInput
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  options={safeClients.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
              </FormField>

              {isDelivery && (
                <FormField label="Dirección y Datos de Entrega (Obligatorio)" required>
                  <TextInput
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ej: Av. San Martín 450, Piso 2 B..."
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Se precarga la dirección habitual del cliente. Puede editarla para este pedido puntual sin alterar su ficha general.
                  </p>
                </FormField>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button variant="outline" onClick={step === 2 ? () => setStep(1) : onClose}>
            {step === 2 ? 'Atrás' : 'Cancelar'}
          </Button>

          {step === 1 ? (
            <Button variant="primary" onClick={handleNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continuar al Paso 2
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Iniciar Carga de Comanda
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
