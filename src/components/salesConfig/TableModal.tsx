import React, { useState } from 'react';
import { X, Save, MapPin, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextInput } from '../ui/Form';
import { RestaurantTableConfig, SiteConfig } from '../../types';

interface TableModalProps {
  tableToEdit?: RestaurantTableConfig | null;
  sites: SiteConfig[];
  onClose: () => void;
  onSave: (data: any) => { success: boolean; message: string };
}

export const TableModal: React.FC<TableModalProps> = ({ tableToEdit, sites, onClose, onSave }) => {
  const activeSites = sites.filter((s) => s.active);
  const [number, setNumber] = useState(tableToEdit?.number || '');
  const [capacityStr, setCapacityStr] = useState(tableToEdit ? String(tableToEdit.capacity) : '4');
  const [siteId, setSiteId] = useState(tableToEdit?.siteId || activeSites[0]?.id || '');
  const [name, setName] = useState(tableToEdit?.name || '');
  const [error, setError] = useState('');

  const siteOptions = activeSites.map((s) => ({
    value: s.id,
    label: `${s.name} (Orden ${s.order})`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      setError('El número o identificador de mesa es obligatorio (R-M01).');
      return;
    }
    const cap = parseInt(capacityStr, 10);
    if (isNaN(cap) || cap <= 0) {
      setError('La capacidad debe ser un número entero mayor a 0 (R-M02).');
      return;
    }
    if (!siteId) {
      setError('Debe seleccionar un Sitio o Sector activo (R-M03).');
      return;
    }

    const payload = {
      ...(tableToEdit ? tableToEdit : {}),
      number: number.trim(),
      capacity: cap,
      siteId,
      name: name.trim() || undefined,
    };

    const res = await onSave(payload);
    if (res && !res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {tableToEdit ? 'Editar Mesa de Salón' : 'Crear Nueva Mesa'}
              </h3>
              <p className="text-xs text-slate-400">Configuración de capacidad y ubicación física</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <FormField label="Número / Identificador de Mesa" required hint="Ej. Mesa 01, TBL-04 (Debe ser único, R-M01)">
            <TextInput
              placeholder="Ej. Mesa 08"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setError('');
              }}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Capacidad (Pax)" required hint="Máx comensales (> 0, R-M02)">
              <TextInput
                type="number"
                min="1"
                placeholder="4"
                value={capacityStr}
                onChange={(e) => {
                  setCapacityStr(e.target.value);
                  setError('');
                }}
              />
            </FormField>

            <FormField label="Sitio / Sector" required hint="Área física (R-M03)">
              <SelectInput
                options={siteOptions}
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Nombre Descriptivo (Opcional)" hint="Ej. Mesa VIP Ventana, Mesa Esquina">
            <TextInput
              placeholder="Ej. Mesa VIP frente al escenario..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              {tableToEdit ? 'Guardar Cambios' : 'Crear Mesa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
