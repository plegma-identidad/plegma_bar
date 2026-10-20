import React from 'react';
import { Combo, ComboSection, ComboSectionItem } from '../../types';
import {
  X,
  Layers,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Package,
  ChefHat,
  Utensils,
  Tag,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';

interface ComboDetailModalProps {
  combo: Combo | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (combo: Combo) => void;
}

export const ComboDetailModal: React.FC<ComboDetailModalProps> = ({
  combo,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !combo) return null;

  const sections = combo.sections || [];
  const totalOptions = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);

  const getMarginBadge = (margin: number) => {
    if (margin >= 60) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {margin.toFixed(1)}% Excelente
        </span>
      );
    }
    if (margin >= 40) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {margin.toFixed(1)}% Bueno
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        {margin.toFixed(1)}% Ajustado
      </span>
    );
  };

  const getComponentBadge = (type: string) => {
    switch (type) {
      case 'item':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-2.5 h-2.5" /> Insumo
          </span>
        );
      case 'production':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ChefHat className="w-2.5 h-2.5" /> Producción
          </span>
        );
      case 'sale_product':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Utensils className="w-2.5 h-2.5" /> Producto Carta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            Item
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-scaleUp">
        {/* Cabecera Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10">
                  {combo.code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    combo.active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {combo.active ? 'Activo para venta' : 'Pausado'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">{combo.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(combo);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
              >
                Editar Combo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Header con imagen y métricas comerciales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Foto del Combo */}
            <div className="md:col-span-1">
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group flex items-center justify-center">
                {combo.imageUrl ? (
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Sin imagen cargada</p>
                  </div>
                )}
              </div>
              {combo.description && (
                <p className="text-xs text-slate-600 mt-2.5 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  "{combo.description}"
                </p>
              )}
            </div>

            {/* Ficha Comercial & KPIs */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Categoría</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5 truncate">
                    {combo.category || 'Sin categoría'}
                  </p>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {combo.subcategory || 'General'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Costo Base Est.</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    ${(Number(combo.costPrice) || 0).toLocaleString('es-AR')}
                  </p>
                  <span className="text-[10px] text-slate-400 block">Suma comp. base</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <p className="text-[10px] text-amber-700 uppercase font-bold">Precio de Venta</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">
                    ${(Number(combo.sellingPrice) || 0).toLocaleString('es-AR')}
                  </p>
                  <span className="text-[10px] text-amber-600 block">Precio combo</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Margen Bruto</p>
                  <div className="mt-1">{getMarginBadge(combo.profitMargin || 0)}</div>
                </div>
              </div>

              {/* Resumen de estructura */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950">
                      Estructura de Secciones y Opciones
                    </h4>
                    <p className="text-xs text-indigo-600">
                      {sections.length} {sections.length === 1 ? 'sección' : 'secciones'} configuradas con {totalOptions} opciones elegibles en total.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secciones y Opciones */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Pasos / Secciones del Combo
            </h4>

            {sections.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                <p className="text-sm">Este combo no tiene secciones ni opciones configuradas aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, sIdx) => (
                  <div
                    key={section.id || sIdx}
                    className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3"
                  >
                    {/* Encabezado de Sección */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                          {section.orderIndex || sIdx + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm">
                            {section.name}
                          </h5>
                          {section.description && (
                            <p className="text-xs text-slate-400">{section.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {section.required ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Opcional
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          Cant. Mín: {section.minQuantity} | Máx: {section.maxQuantity}
                        </span>

                        {section.allowRepeat && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Permite repetición
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tabla de Opciones / Componentes de la Sección */}
                    {(!section.items || section.items.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No hay componentes asignados a este paso.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2">Tipo</th>
                              <th className="p-2">Componente / Opción</th>
                              <th className="p-2 text-center">Cant.</th>
                              <th className="p-2 text-right">Costo Ref.</th>
                              <th className="p-2 text-right">Recargo Extra</th>
                              <th className="p-2 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {section.items.map((item, iIdx) => (
                              <tr key={item.id || iIdx} className="hover:bg-slate-50/50">
                                <td className="p-2">{getComponentBadge(item.componentType)}</td>
                                <td className="p-2 font-bold text-slate-800">{item.componentName}</td>
                                <td className="p-2 text-center font-mono text-slate-600">
                                  {item.quantity} {item.unit || 'u'}
                                </td>
                                <td className="p-2 text-right font-mono text-slate-500">
                                  ${(Number(item.unitCost) || 0).toLocaleString('es-AR')}
                                </td>
                                <td className="p-2 text-right font-mono font-bold">
                                  {Number(item.extraPrice) > 0 ? (
                                    <span className="text-amber-600">
                                      +${Number(item.extraPrice).toLocaleString('es-AR')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">$0 (Incluido)</span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {item.isAvailable !== false ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                      Disponible
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold">
                                      Agotado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition shadow-xs"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
