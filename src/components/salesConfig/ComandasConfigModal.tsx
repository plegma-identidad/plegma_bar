import React, { useState } from 'react';
import { X, Sliders, Users, ShoppingBag, Grid, Coffee, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, TextInput, SelectInput } from '../ui/Form';
import { useApp } from '../../context/AppContext';
import { ProductOptionGroup, ProductOption } from '../../types';

interface ComandasConfigModalProps {
  onClose: () => void;
}

export const ComandasConfigModal: React.FC<ComandasConfigModalProps> = ({ onClose }) => {
  const {
    productOptionGroups,
    addProductOptionGroup,
    addOptionToGroup,
    deleteOptionFromGroup,
    toggleGroupSelectionType,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'maestros' | 'opciones' | 'pagos' | 'automatizaciones'>('opciones');

  // Form states for new option group
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(true);
  const [newGroupSelectionType, setNewGroupSelectionType] = useState<'single' | 'multiple'>('single');

  // Form states for adding option
  const [selectedGroupId, setSelectedGroupId] = useState<string>(productOptionGroups[0]?.id || '');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('0');

  // Paginación de grupos de opciones y extras
  const [groupsPage, setGroupsPage] = useState<number>(1);
  const GROUPS_PAGE_SIZE = 3;
  const totalGroupsPages = Math.ceil(productOptionGroups.length / GROUPS_PAGE_SIZE) || 1;
  const paginatedGroups = productOptionGroups.slice((groupsPage - 1) * GROUPS_PAGE_SIZE, groupsPage * GROUPS_PAGE_SIZE);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGrp: ProductOptionGroup = {
      id: 'grp-' + Date.now(),
      name: newGroupName.trim(),
      isRequired: newGroupRequired,
      selectionType: newGroupSelectionType,
      active: true,
      options: [],
    };
    const res = addProductOptionGroup(newGrp);
    showToast(res.message, 'success');
    setNewGroupName('');
  };

  const handleAddOption = () => {
    const targetGroupId = selectedGroupId || productOptionGroups[0]?.id;
    if (!newOptionName.trim() || !targetGroupId) return;
    const price = parseFloat(newOptionPrice) || 0;
    const newOpt: ProductOption = {
      id: 'opt-' + Date.now(),
      name: newOptionName.trim(),
      priceModifier: price,
    };
    const res = addOptionToGroup(targetGroupId, newOpt);
    showToast(res.message, 'success');
    setNewOptionName('');
    setNewOptionPrice('0');
  };

  const handleDeleteOption = (groupId: string, optionId: string) => {
    const res = deleteOptionFromGroup(groupId, optionId);
    showToast(res.message, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        {/* Header Estilo PLEGMA */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Configuración de Comandas v2.0</h2>
              <p className="text-xs text-slate-400 font-medium">
                Bloque funcional de parametrización y maestros
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

        {/* Tabs Estilo PLEGMA */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 space-x-2 pt-2">
          {[
            { id: 'opciones', label: 'Grupos de Opciones / Modificadores', icon: Coffee },
            { id: 'maestros', label: 'Maestros del Módulo', icon: Grid },
            { id: 'pagos', label: 'Condiciones y Medios de Pago', icon: ShoppingBag },
            { id: 'automatizaciones', label: 'Automatizaciones & Reglas', icon: CheckCircle2 },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                  active
                    ? 'border-amber-500 text-slate-900 bg-white shadow-xs font-black'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'opciones' && (
            <div className="space-y-6">
              {/* Alert Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                <Coffee className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Ejemplo Combo Merienda / Productos Configurables:</p>
                  <p className="mt-0.5">
                    Permite definir grupos obligatorios (ej. *Tipo de café*, *Acompañamiento*) y modificadores adicionales con costo (`+$900 Extra Queso`).
                  </p>
                </div>
              </div>

              {/* Group Creator */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Crear Nuevo Grupo de Opciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2">
                    <FormField label="Nombre del Grupo">
                      <TextInput
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ej: Sabor de Licuado, Punto de Carne..."
                      />
                    </FormField>
                  </div>
                  <FormField label="Tipo Selección">
                    <SelectInput
                      value={newGroupSelectionType}
                      onChange={(e) => setNewGroupSelectionType(e.target.value as any)}
                      options={[
                        { value: 'single', label: 'Selección Única (1)' },
                        { value: 'multiple', label: 'Selección Múltiple' },
                      ]}
                    />
                  </FormField>
                  <div className="flex items-center space-x-3 pb-1">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGroupRequired}
                        onChange={(e) => setNewGroupRequired(e.target.checked)}
                        className="w-4 h-4 rounded-xs text-amber-500 focus:ring-amber-500"
                      />
                      <span>Obligatoria</span>
                    </label>
                    <Button variant="primary" size="sm" onClick={handleAddGroup} leftIcon={<Plus className="w-4 h-4" />}>
                      Crear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add Option to Existing Group */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Agregar Opción / Modificador</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <FormField label="Seleccionar Grupo">
                    <SelectInput
                      value={selectedGroupId || productOptionGroups[0]?.id || ''}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      options={productOptionGroups.map((g) => ({ value: g.id, label: g.name }))}
                    />
                  </FormField>
                  <FormField label="Opción / Modificador">
                    <TextInput
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      placeholder="Ej: Extra Queso"
                    />
                  </FormField>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <FormField label="Costo Extra ($)">
                        <TextInput
                          type="number"
                          value={newOptionPrice}
                          onChange={(e) => setNewOptionPrice(e.target.value)}
                        />
                      </FormField>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleAddOption} className="mt-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* List of Option Groups con Paginación */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Grupos Configurados ({productOptionGroups.length})
                  </h3>
                  {totalGroupsPages > 1 && (
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                      <button
                        type="button"
                        disabled={groupsPage === 1}
                        onClick={() => setGroupsPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition"
                      >
                        ← Ant
                      </button>
                      <span>Pág. {groupsPage} de {totalGroupsPages}</span>
                      <button
                        type="button"
                        disabled={groupsPage >= totalGroupsPages}
                        onClick={() => setGroupsPage((p) => Math.min(totalGroupsPages, p + 1))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition"
                      >
                        Sig →
                      </button>
                    </div>
                  )}
                </div>

                {paginatedGroups.map((group) => (
                  <div key={group.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">{group.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            group.isRequired
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {group.isRequired ? 'Obligatoria' : 'Opcional'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = toggleGroupSelectionType(group.id);
                            showToast(res.message, 'success');
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer hover:opacity-80 transition-opacity ${
                            group.selectionType === 'multiple'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Haz clic para cambiar entre Selección Única y Múltiple"
                        >
                          {group.selectionType === 'multiple' ? 'Múltiple ⚙️' : 'Única (1) ⚙️'}
                        </button>
                      </div>
                      <span className="text-xs text-slate-500 font-bold">{group.options.length} Opciones</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <span className="font-semibold text-slate-800">{opt.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`font-extrabold ${opt.priceModifier > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                              {opt.priceModifier > 0 ? `+$${opt.priceModifier}` : 'Incluido'}
                            </span>
                            <button
                              onClick={() => handleDeleteOption(group.id, opt.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'maestros' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Clientes', desc: 'Permite asociar una comanda a un cliente.', ejemplo: 'Juan Pérez, Consumidor Final' },
                  { title: 'Tipos de Venta', desc: 'Define la modalidad comercial.', ejemplo: 'Salón, Take Away, Delivery' },
                  { title: 'Mesas', desc: 'Identifica la mesa para ventas de salón.', ejemplo: 'Mesa 01, Mesa 02, Terraza 05' },
                  { title: 'Carta / Menú', desc: 'Determina el conjunto de productos disponibles.', ejemplo: 'Carta General, Desayuno' },
                  { title: 'Categorías de Producto', desc: 'Organiza visualmente los productos.', ejemplo: 'Cafetería, Bebidas, Hamburguesas' },
                  { title: 'Productos', desc: 'Artículos simples o configurables.', ejemplo: 'Cortado, Burger, Combo Merienda' },
                ].map((m, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-white space-y-1 shadow-xs">
                    <h4 className="font-black text-slate-900 text-sm">{m.title}</h4>
                    <p className="text-slate-600">{m.desc}</p>
                    <p className="text-[11px] font-bold text-amber-700 pt-1">Ejemplos: {m.ejemplo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start space-x-3 shadow-md">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Independencia Conceptual:</p>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Condición de Pago (Contado, Cta Cte, Invitación) y Medio de Pago (Efectivo, MP Franco) son independientes.
                    Esto permite soportar cobros combinados (ej: $15.000 Efectivo + $10.000 MP Franco).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automatizaciones' && (
            <div className="space-y-3 text-xs">
              {[
                'Los maestros activos estarán disponibles automáticamente en la pantalla POS.',
                'El Tipo de venta determinará qué información adicional solicitar (Salón → Mesa, Delivery → Cliente/datos).',
                'El Producto determina automáticamente los grupos de opciones a mostrar.',
                'Los valores inactivos no podrán utilizarse en nuevas comandas, pero permanecerán visibles en operaciones históricas.',
              ].map((rule, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Configuración Activa - PLEGMA Resto Bar</span>
          <Button variant="primary" onClick={onClose}>
            Guardar & Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
