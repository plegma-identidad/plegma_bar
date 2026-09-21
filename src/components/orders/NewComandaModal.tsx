import React, { useState } from 'react';
import { X, Utensils, MapPin, User, ArrowRight, CheckCircle2, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { SaleTypeConfig, RestaurantTableConfig, Client, SaleOrder } from '../../types';

interface NewComandaModalProps {
  saleTypes?: SaleTypeConfig[];
  tables?: RestaurantTableConfig[];
  clients?: Client[];
  onClose: () => void;
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
  onClose,
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

    onConfirmCreate({
      saleTypeId: selectedSaleType.id,
      saleTypeName: selectedSaleType.name,
      clientId: selectedClient ? selectedClient.id : 'cli-001',
      clientName: selectedClient ? selectedClient.name : 'Consumidor Final',
      tableId: selectedSaleType.requiresTable ? selectedTable?.id : undefined,
      tableName: selectedSaleType.requiresTable ? (selectedTable ? `${selectedTable.number} (${selectedTable.siteName})` : 'Mesa 01') : undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
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
                    options={activeTables.map((t) => ({
                      value: t.id,
                      label: `${t.number} — ${t.siteName} (Cap: ${t.capacity} pax)`,
                    }))}
                  />
                </FormField>
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

              {selectedSaleType?.name.toLowerCase().includes('delivery') && (
                <FormField label="Dirección y Datos de Entrega">
                  <TextInput
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ej: Av. San Martín 450, Piso 2 B..."
                  />
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
