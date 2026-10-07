import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Percent, Save, CheckCircle2, Sparkles, DollarSign } from 'lucide-react';

interface SpecialHoursConfigModalProps {
  onClose: () => void;
}

export const SpecialHoursConfigModal: React.FC<SpecialHoursConfigModalProps> = ({ onClose }) => {
  const { specialHoursPercentage, updateSpecialHoursPercentage, showToast } = useApp();
  const [percentageInput, setPercentageInput] = useState<number>(specialHoursPercentage);

  const sampleBaseRate = 6000;
  const calculatedSpecialRate = Math.round(sampleBaseRate * (1 + percentageInput / 100));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (percentageInput < 0) {
      alert('El porcentaje no puede ser negativo.');
      return;
    }
    updateSpecialHoursPercentage(percentageInput);
    showToast(`Porcentaje de Hora Especial actualizado al ${percentageInput}%.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150"
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Configuración de Hora Especial</h3>
              <p className="text-[11px] text-slate-400">Porcentaje global aplicado a turnos especiales</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2">
            <p className="text-amber-900 font-semibold text-xs leading-relaxed">
              El porcentaje aquí configurado transformará automáticamente la tarifa de horas base de los empleados en todos los turnos del cronograma que tengan marcado el casillero <span className="font-extrabold text-amber-950">"Aplica Hora Especial"</span>.
            </p>
          </div>

          <div>
            <label className="font-extrabold text-slate-800 block mb-1 text-xs">
              Porcentaje Adicional de Hora Especial (%):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={percentageInput}
                onChange={(e) => setPercentageInput(Number(e.target.value))}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                placeholder="50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Calculator Preview Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-inner border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Simulación en tiempo real:</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Ejemplo Tarifa Base:</span>
                <span className="font-mono font-bold text-slate-200">${sampleBaseRate.toLocaleString('es-AR')} / hr</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-300 block font-semibold">Valor Con Hora Especial (+{percentageInput}%):</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  ${calculatedSpecialRate.toLocaleString('es-AR')} / hr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
