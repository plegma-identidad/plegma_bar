import React, { useState } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { FormField, TextInput } from '../ui/Form';
import { SiteConfig } from '../../types';

interface SiteModalProps {
  siteToEdit?: SiteConfig | null;
  onClose: () => void;
  onSave: (data: any) => { success: boolean; message: string };
}

export const SiteModal: React.FC<SiteModalProps> = ({ siteToEdit, onClose, onSave }) => {
  const [name, setName] = useState(siteToEdit?.name || '');
  const [description, setDescription] = useState(siteToEdit?.description || '');
  const [orderStr, setOrderStr] = useState(siteToEdit ? String(siteToEdit.order) : '1');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del sitio / sector es obligatorio (R-S01).');
      return;
    }
    const orderVal = parseInt(orderStr, 10);
    if (isNaN(orderVal) || orderVal < 0) {
      setError('El orden numérico debe ser un entero mayor o igual a 0 (R-S03).');
      return;
    }

    const payload = {
      ...(siteToEdit ? siteToEdit : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      order: orderVal,
      active: siteToEdit ? siteToEdit.active : true,
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {siteToEdit ? 'Editar Sitio / Sector' : 'Crear Nuevo Sitio / Sector'}
              </h3>
              <p className="text-xs text-slate-400">Administración de áreas físicas del local</p>
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

          <FormField label="Nombre del Sitio / Sector" required hint="Ej. Salón Medio, Terraza, Vereda (R-S01)">
            <TextInput
              placeholder="Ej. Salón Medio"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          </FormField>

          <FormField label="Orden Visual de Presentación" required hint="Secuencia numéres (>= 0, R-S03)">
            <TextInput
              type="number"
              min="0"
              placeholder="1"
              value={orderStr}
              onChange={(e) => {
                setOrderStr(e.target.value);
                setError('');
              }}
            />
          </FormField>

          <FormField label="Descripción o Detalle (Opcional)" hint="Detalle descriptivo del área física">
            <TextInput
              placeholder="Ej. Área climatizada para eventos privados..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              {siteToEdit ? 'Guardar Cambios' : 'Crear Sitio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
