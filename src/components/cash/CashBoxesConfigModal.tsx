import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Sliders,
  Building2,
  CreditCard,
  DollarSign,
  AlertCircle,
  Info,
  Check,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, TextInput } from '../ui/Form';
import { useApp } from '../../context/AppContext';
import { OperativeCashBox, MasterCashBox } from '../../types';
import { ConfirmModal } from '../ui/ConfirmModal';

interface CashBoxesConfigModalProps {
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

export const CashBoxesConfigModal: React.FC<CashBoxesConfigModalProps> = ({ onClose }) => {
  const {
    operativeCashBoxes,
    masterCashBoxes,
    addOrUpdateOperativeCashBox,
    toggleOperativeCashBoxActive,
    deleteOperativeCashBox,
    addOrUpdateMasterCashBox,
    toggleMasterCashBoxActive,
    deleteMasterCashBox,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'operative' | 'master'>('operative');

  // Formulario Caja Operativa
  const [isAddingOperative, setIsAddingOperative] = useState(false);
  const [editingOperativeId, setEditingOperativeId] = useState<string | null>(null);
  const [opName, setOpName] = useState('');
  const [opDescription, setOpDescription] = useState('');
  const [opInitialAmount, setOpInitialAmount] = useState('0');
  const [opActive, setOpActive] = useState(true);

  // Formulario Caja Maestra
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [masterName, setMasterName] = useState('');
  const [masterBoxType, setMasterBoxType] = useState('Efectivo');
  const [masterInitialBalance, setMasterInitialBalance] = useState('0');
  const [masterActive, setMasterActive] = useState(true);

  // Referencias para auto-scroll y auto-focus
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const opNameInputRef = useRef<HTMLInputElement>(null);
  const masterNameInputRef = useRef<HTMLInputElement>(null);

  // Modal de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'operative' | 'master';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'operative',
    id: '',
    name: '',
  });

  // Reset Formulario Operativo
  const resetOpForm = () => {
    setIsAddingOperative(false);
    setEditingOperativeId(null);
    setOpName('');
    setOpDescription('');
    setOpInitialAmount('0');
    setOpActive(true);
  };

  // Abrir edición Operativa
  const handleEditOperative = (box: OperativeCashBox) => {
    setEditingOperativeId(box.id);
    setOpName(box.name);
    setOpDescription(box.description || '');
    setOpInitialAmount(String(box.defaultInitialAmount || 0));
    setOpActive(box.active);
    setIsAddingOperative(true);

    // Scroll suave automático al inicio del modal hacia el formulario de edición y dar foco
    setTimeout(() => {
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      opNameInputRef.current?.focus();
    }, 60);
  };

  // Guardar Operativa
  const handleSaveOperative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) {
      showToast('El nombre de la caja operativa es obligatorio.', 'error');
      return;
    }

    const payload: Partial<OperativeCashBox> = {
      id: editingOperativeId || undefined,
      name: opName.trim(),
      description: opDescription.trim() || undefined,
      defaultInitialAmount: Math.max(0, parseFloat(opInitialAmount) || 0),
      active: opActive,
      sortOrder: editingOperativeId
        ? operativeCashBoxes.find((b) => b.id === editingOperativeId)?.sortOrder
        : operativeCashBoxes.length + 1,
    };

    const res = await addOrUpdateOperativeCashBox(payload);
    if (res.success) {
      showToast(res.message, 'success');
      resetOpForm();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Reset Formulario Maestra
  const resetMasterForm = () => {
    setIsAddingMaster(false);
    setEditingMasterId(null);
    setMasterName('');
    setMasterBoxType('Efectivo');
    setMasterInitialBalance('0');
    setMasterActive(true);
  };

  // Abrir edición Maestra
  const handleEditMaster = (box: MasterCashBox) => {
    setEditingMasterId(box.id);
    setMasterName(box.name);
    setMasterBoxType(box.boxType || 'Efectivo');
    setMasterInitialBalance(String(box.currentBalance || 0));
    setMasterActive(box.active ?? true);
    setIsAddingMaster(true);

    // Scroll suave automático al inicio del modal hacia el formulario de edición y dar foco
    setTimeout(() => {
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      masterNameInputRef.current?.focus();
    }, 60);
  };

  // Guardar Maestra
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterName.trim()) {
      showToast('El nombre de la caja maestra es obligatorio.', 'error');
      return;
    }

    const payload: Partial<MasterCashBox> = {
      id: editingMasterId || undefined,
      name: masterName.trim(),
      boxType: masterBoxType.trim() || masterName.trim(),
      status: 'Siempre Abierta',
      currentBalance: Math.max(0, parseFloat(masterInitialBalance) || 0),
      active: masterActive,
    };

    const res = await addOrUpdateMasterCashBox(payload);
    if (res.success) {
      showToast(res.message, 'success');
      resetMasterForm();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (deleteConfirm.type === 'operative') {
      const res = await deleteOperativeCashBox(deleteConfirm.id);
      showToast(res.message, res.success ? 'success' : 'error');
    } else {
      const res = await deleteMasterCashBox(deleteConfirm.id);
      showToast(res.message, res.success ? 'success' : 'error');
    }
    setDeleteConfirm({ isOpen: false, type: 'operative', id: '', name: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-indigo-300">
                  CONFIGURACIÓN
                </span>
                <span className="text-[10px] text-slate-400">Control de Caja</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Gestión de Cajas Operativas y Maestras
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('operative');
              resetOpForm();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'operative'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cajas Operativas (Turnos) ({operativeCashBoxes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('master');
              resetMasterForm();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'master'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Cajas Maestras ("Siempre Abiertas") ({masterCashBoxes.length})
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div ref={contentScrollRef} className="p-6 overflow-y-auto space-y-6 flex-1 scroll-smooth">
          {/* ============================================================ */}
          {/* PESTAÑA 1: CAJAS OPERATIVAS */}
          {/* ============================================================ */}
          {activeTab === 'operative' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                <div className="text-xs text-indigo-950">
                  <p className="font-bold">Medios de Pago y Cobranza para Apertura de Turno</p>
                  <p className="text-indigo-700/80 text-[11px] mt-0.5">
                    Las cajas operativas activas son las que se precargan obligatoriamente al abrir cada turno.
                  </p>
                </div>
                {!isAddingOperative && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      resetOpForm();
                      setIsAddingOperative(true);
                      setTimeout(() => {
                        contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        opNameInputRef.current?.focus();
                      }, 60);
                    }}
                  >
                    Nueva Caja Operativa
                  </Button>
                )}
              </div>

              {/* Formulario de Alta / Edición de Caja Operativa */}
              {isAddingOperative && (
                <form
                  onSubmit={handleSaveOperative}
                  className={`rounded-2xl p-4 space-y-4 animate-fadeIn transition-all shadow-md ${
                    editingOperativeId
                      ? 'bg-indigo-50/90 border-2 border-indigo-500 ring-4 ring-indigo-500/10'
                      : 'bg-slate-50 border-2 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-900 uppercase">
                        {editingOperativeId ? 'Editar Caja Operativa' : 'Agregar Nueva Caja Operativa'}
                      </span>
                      {editingOperativeId && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold">
                          EDITANDO
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={resetOpForm}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nombre de la Caja / Medio *
                      </label>
                      <input
                        ref={opNameInputRef}
                        type="text"
                        required
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                        placeholder="Ej: Posnet Barra 2, Dólares en Efectivo"
                        className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Monto Inicial Sugerido ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={opInitialAmount}
                        onChange={(e) => setOpInitialAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Estado Inicial
                      </label>
                      <select
                        value={opActive ? 'true' : 'false'}
                        onChange={(e) => setOpActive(e.target.value === 'true')}
                        className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="true">Activa (Disponible para turnos)</option>
                        <option value="false">Desactivada (Pausada)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Descripción u Observaciones (Opcional)
                    </label>
                    <input
                      type="text"
                      value={opDescription}
                      onChange={(e) => setOpDescription(e.target.value)}
                      placeholder="Ej: Cobranzas exclusivas con QR en salón exterior"
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <Button type="button" size="sm" variant="outline" onClick={resetOpForm}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      {editingOperativeId ? 'Actualizar Caja' : 'Guardar Caja'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Lista de Cajas Operativas */}
              <div className="space-y-2">
                {operativeCashBoxes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No hay cajas operativas configuradas. Agrega al menos una para permitir aperturas de turno.
                  </p>
                ) : (
                  operativeCashBoxes.map((box) => (
                    <div
                      key={box.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition ${
                        box.active
                          ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleOperativeCashBoxActive(box.id, !box.active)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                            box.active
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-400 border border-slate-300 hover:bg-slate-300'
                          }`}
                          title={box.active ? 'Clic para Desactivar' : 'Clic para Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{box.name}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                box.active
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {box.active ? 'Activa' : 'Desactivada'}
                            </span>
                          </div>
                          {box.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{box.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Monto Inicial Sug.
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {fmt(box.defaultInitialAmount || 0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditOperative(box)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar caja operativa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'operative',
                                id: box.id,
                                name: box.name,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar o pausar caja operativa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PESTAÑA 2: CAJAS MAESTRAS */}
          {/* ============================================================ */}
          {activeTab === 'master' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                <div className="text-xs text-amber-950">
                  <p className="font-bold">Cajas Maestras Permanentes ("Siempre Abiertas")</p>
                  <p className="text-amber-700/80 text-[11px] mt-0.5">
                    Son los destinos permanentes donde se acumulan los retiros de efectivo o transferencias de cierre.
                  </p>
                </div>
                {!isAddingMaster && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      resetMasterForm();
                      setIsAddingMaster(true);
                      setTimeout(() => {
                        contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        masterNameInputRef.current?.focus();
                      }, 60);
                    }}
                  >
                    Nueva Caja Maestra
                  </Button>
                )}
              </div>

              {/* Formulario de Alta / Edición de Caja Maestra */}
              {isAddingMaster && (
                <form
                  onSubmit={handleSaveMaster}
                  className={`rounded-2xl p-4 space-y-4 animate-fadeIn transition-all shadow-md ${
                    editingMasterId
                      ? 'bg-amber-50/90 border-2 border-amber-500 ring-4 ring-amber-500/10'
                      : 'bg-slate-50 border-2 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-900 uppercase">
                        {editingMasterId ? 'Editar Caja Maestra' : 'Agregar Nueva Caja Maestra'}
                      </span>
                      {editingMasterId && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-mono text-[10px] font-bold">
                          EDITANDO
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={resetMasterForm}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nombre de la Caja Maestra *
                      </label>
                      <input
                        ref={masterNameInputRef}
                        type="text"
                        required
                        value={masterName}
                        onChange={(e) => setMasterName(e.target.value)}
                        placeholder="Ej: Caja Fuerte Secundaria, Banco BBVA"
                        className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Medio / Tipo Asociado
                      </label>
                      <input
                        type="text"
                        value={masterBoxType}
                        onChange={(e) => setMasterBoxType(e.target.value)}
                        placeholder="Ej: Efectivo, Banco, Mercado Pago"
                        className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {editingMasterId ? 'Saldo Acumulado ($)' : 'Saldo Inicial de Apertura ($)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={masterInitialBalance}
                        onChange={(e) => setMasterInitialBalance(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={masterActive ? 'true' : 'false'}
                      onChange={(e) => setMasterActive(e.target.value === 'true')}
                      className="w-full sm:w-1/3 text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="true">Activa (Disponible para retiros)</option>
                      <option value="false">Desactivada (Pausada)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <Button type="button" size="sm" variant="outline" onClick={resetMasterForm}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      {editingMasterId ? 'Actualizar Caja Maestra' : 'Guardar Caja Maestra'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Lista de Cajas Maestras */}
              <div className="space-y-2">
                {masterCashBoxes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No hay cajas maestras configuradas.
                  </p>
                ) : (
                  masterCashBoxes.map((box) => (
                    <div
                      key={box.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition ${
                        box.active !== false
                          ? 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleMasterCashBoxActive(box.id, box.active === false ? true : false)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                            box.active !== false
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-400 border border-slate-300 hover:bg-slate-300'
                          }`}
                          title={box.active !== false ? 'Clic para Desactivar' : 'Clic para Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{box.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {box.status}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                box.active !== false
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {box.active !== false ? 'Activa' : 'Desactivada'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Medio asociado: <span className="font-medium text-slate-700">{box.boxType}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Saldo Actual
                          </span>
                          <span className="font-mono text-xs font-black text-emerald-700">
                            {fmt(box.currentBalance || 0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditMaster(box)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar caja maestra"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'master',
                                id: box.id,
                                name: box.name,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar o pausar caja maestra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Los cambios de activación se aplican de forma inmediata al abrir turnos o retiros.</span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {/* Confirm Modal para eliminación */}
      {deleteConfirm.isOpen && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title={
            deleteConfirm.type === 'operative'
              ? 'Eliminar o Pausar Caja Operativa'
              : 'Eliminar o Pausar Caja Maestra'
          }
          message={`¿Está seguro de que desea eliminar "${deleteConfirm.name}"? Si ya posee movimientos históricos registrados en turnos o retiros, el sistema la desactivará para preservar la integridad contable.`}
          confirmText="Confirmar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, type: 'operative', id: '', name: '' })}
        />
      )}
    </div>
  );
};
