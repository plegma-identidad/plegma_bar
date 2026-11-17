import React, { useState, useEffect } from 'react';
import {
  KitchenBatch,
} from '../../types';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Utensils,
  ShoppingBag,
  Bike,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface KitchenCardProps {
  batch: KitchenBatch;
  isSelected: boolean;
  onToggleSelect: (batchId: string) => void;
  onStart: (batchId: string) => void;
  onFinish: (batchId: string) => void;
  onDelete?: (batchId: string) => void;
  isProcessing?: boolean;
}

export const KitchenCard: React.FC<KitchenCardProps> = ({
  batch,
  isSelected,
  onToggleSelect,
  onStart,
  onFinish,
  onDelete,
  isProcessing = false,
}) => {
  // Tick en vivo cada 1 segundo para actualizar contadores locales sin recargar la red
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tiempos calculados
  const createdMs = new Date(batch.createdAt).getTime();
  const totalElapsedSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  const totalElapsedMin = Math.floor(totalElapsedSec / 60);

  // Si está En preparación, calcular tiempo de cocción desde startedAt
  let prepElapsedSec = 0;
  let prepElapsedMin = 0;
  if (batch.status === 'En preparación' && batch.startedAt) {
    const startedMs = new Date(batch.startedAt).getTime();
    prepElapsedSec = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
    prepElapsedMin = Math.floor(prepElapsedSec / 60);
  }

  // Formato mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Semáforo de demoras
  // En Pendiente: Verde < 15 min, Amarillo 15-25 min, Rojo >= 25 min
  const getSemaforoClasses = () => {
    if (batch.status === 'En preparación') {
      return {
        cardBorder: 'border-blue-500 ring-2 ring-blue-500/30',
        badgeBg: 'bg-blue-600 text-white',
        bannerBg: 'bg-blue-900/40 text-blue-200 border-blue-700/50',
        statusLabel: 'En Preparación',
      };
    }

    if (totalElapsedMin < 15) {
      return {
        cardBorder: 'border-emerald-500/40 hover:border-emerald-500',
        badgeBg: 'bg-emerald-600 text-white',
        bannerBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
        statusLabel: 'A tiempo',
      };
    } else if (totalElapsedMin < 25) {
      return {
        cardBorder: 'border-amber-500 ring-1 ring-amber-500/40',
        badgeBg: 'bg-amber-600 text-slate-950 font-black',
        bannerBg: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
        statusLabel: 'Atención',
      };
    } else {
      return {
        cardBorder: 'border-rose-600 ring-2 ring-rose-600 animate-pulse',
        badgeBg: 'bg-rose-600 text-white animate-bounce',
        bannerBg: 'bg-rose-950/60 text-rose-200 border-rose-800/60',
        statusLabel: 'Demorado Crítico',
      };
    }
  };

  const semaforo = getSemaforoClasses();

  // Hora legible de ingreso en formato limpio (ej: 12:35 hs)
  const formatHour = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m} hs`;
    } catch {
      return '';
    }
  };

  const formattedCreatedTime = formatHour(batch.createdAt);

  return (
    <div
      className={`flex flex-col min-w-[340px] max-w-lg w-full bg-slate-900/95 rounded-3xl border-2 transition-all duration-200 shadow-2xl overflow-hidden select-none ${semaforo.cardBorder
        } ${isSelected ? 'ring-4 ring-amber-400 border-amber-400 scale-[1.01]' : ''}`}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className="bg-slate-800/90 px-4 py-3.5 border-b border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Checkbox táctil amplio */}
          {batch.status === 'Pendiente' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(batch.id)}
              className="w-5 h-5 rounded-lg text-amber-500 bg-slate-950 border-slate-600 focus:ring-amber-400 cursor-pointer"
            />
          )}

          {/* Número de comanda destacado */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-3xl text-white tracking-tight drop-shadow-sm">
                #{batch.orderNumber}
              </span>
              {batch.batchNumber > 1 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500 text-slate-950 shadow-sm animate-pulse">
                  Agregado #{batch.batchNumber}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium whitespace-nowrap mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Ingreso: <strong className="text-slate-200">{formattedCreatedTime}</strong></span>
            </div>
          </div>
        </div>

        {/* Badge Semáforo / Estado y botón de descarte */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${semaforo.badgeBg}`}>
              {batch.status === 'Pendiente' ? (
                <Clock className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              )}
              <span>{batch.status}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mt-1">
              {semaforo.statusLabel}
            </span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Descartar este pedido de cocina #${batch.orderNumber}?`)) {
                  onDelete(batch.id);
                }
              }}
              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition cursor-pointer"
              title="Descartar comanda de cocina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CANAL DE VENTA Y DETALLES DE MESA / ENTREGA */}
      <div className="bg-slate-800/50 px-4 py-2.5 border-b border-slate-700/60 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {batch.saleTypeName.toLowerCase().includes('salón') || batch.saleTypeName.toLowerCase().includes('salon') ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-black text-sm bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{batch.tableName || 'Salón'}</span>
            </span>
          ) : batch.saleTypeName.toLowerCase().includes('take') || batch.saleTypeName.toLowerCase().includes('retiro') ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-black text-sm bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
              <ShoppingBag className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Take Away</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-black text-sm bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Delivery</span>
            </span>
          )}

          {batch.clientName && batch.clientName !== 'Consumidor Final' && (
            <span className="text-slate-300 font-semibold flex items-center gap-1 text-xs bg-slate-900/60 px-2.5 py-1 rounded-xl border border-slate-700/60">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[150px]">{batch.clientName}</span>
            </span>
          )}
        </div>

        {/* Dirección de delivery si corresponde */}
        {batch.deliveryAddress && (
          <div className="text-xs text-emerald-300 font-medium truncate max-w-[180px] flex items-center gap-1" title={batch.deliveryAddress}>
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{batch.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* 3. CONTADOR DE TIEMPO EN VIVO */}
      <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between font-mono font-bold tracking-wide ${semaforo.bannerBg}`}>
        {batch.status === 'Pendiente' ? (
          <>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="uppercase tracking-wider font-extrabold text-[11px]">Tiempo de Espera:</span>
            </div>
            <div className="text-xl font-black tracking-wider text-emerald-400">
              {formatTime(totalElapsedSec)}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current text-blue-400 shrink-0" />
              <span className="uppercase tracking-wider font-extrabold text-[11px] text-blue-200">Preparación Activa:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-300 tracking-wider">
                {formatTime(prepElapsedSec)}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                (Total: {totalElapsedMin}m)
              </span>
            </div>
          </>
        )}
      </div>

      {/* 4. LISTADO DE PRODUCTOS DE FABRICACIÓN */}
      <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[460px] min-h-[220px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900/40 [&::-webkit-scrollbar-thumb]:bg-slate-700/80 [&::-webkit-scrollbar-thumb]:rounded-full">
        {batch.items.map((item, idx) => {
          const isCancelled = item.itemStatus === 'Cancelado';

          // Detección de desglose de combo vs observación de cocina
          const hasBreakdown = Boolean(
            item.lineComment &&
            (item.lineComment.includes(' | ') || item.lineComment.includes(':'))
          );
          const breakdownParts = hasBreakdown && item.lineComment
            ? item.lineComment.split(' | ').filter(Boolean)
            : [];

          return (
            <div
              key={item.id || idx}
              className={`p-3.5 rounded-2xl border transition-all ${isCancelled
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 line-through opacity-80'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-100 hover:border-slate-600 shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Cantidad grande táctil con alto contraste */}
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${isCancelled
                      ? 'bg-rose-900 text-rose-200'
                      : 'bg-amber-400 text-slate-950 ring-2 ring-amber-500/20'
                      }`}
                  >
                    {item.quantity}×
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Nombre del plato */}
                    <p className={`font-black text-base leading-snug ${isCancelled ? 'line-through text-rose-300' : 'text-white'}`}>
                      {item.productName}
                    </p>

                    {/* Variantes y opciones seleccionadas */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.selectedOptions.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-700/90 text-amber-200 border border-slate-600"
                          >
                            {opt.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Si es desglose estructurado de Combo / Opciones */}
              {hasBreakdown && breakdownParts.length > 0 && (
                <div className="mt-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl p-2.5 space-y-1.5 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block">
                    ✦ Configuración del Combo:
                  </span>
                  <div className="space-y-1 pl-1">
                    {breakdownParts.map((part, pIdx) => {
                      const colonIdx = part.indexOf(':');
                      const hasColon = colonIdx > -1;
                      const label = hasColon ? part.slice(0, colonIdx).trim() : '';
                      const val = hasColon ? part.slice(colonIdx + 1).trim() : part.trim();
                      return (
                        <div key={pIdx} className="flex items-start gap-1.5 text-slate-200 leading-tight">
                          <span className="text-amber-400 font-extrabold mt-0.5">•</span>
                          <div>
                            {label && (
                              <strong className="text-slate-400 font-bold uppercase text-[11px] mr-1">
                                {label}:
                              </strong>
                            )}
                            <span className="text-white font-medium">{val}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Si es una Observación de Cocina directa (ej: SIN QUESO, BIEN COCIDO) */}
              {!hasBreakdown && item.lineComment && (
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-950/80 border-2 border-amber-400 text-amber-200 text-xs font-black flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="uppercase tracking-wide font-black text-amber-100">
                    {item.lineComment}
                  </span>
                </div>
              )}

              {/* Alerta de Cancelación */}
              {item.alertMessage && (
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-rose-900/90 text-rose-200 text-xs font-black border border-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{item.alertMessage}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Nota general de comanda si existe */}
        {batch.generalNotes && (
          <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs shadow-sm">
            <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block mb-0.5">
              Nota general de comanda:
            </span>
            <p className="italic text-slate-200 font-medium">{batch.generalNotes}</p>
          </div>
        )}
      </div>

      {/* 5. PIE DE TARJETA CON BOTÓN TÁCTIL PRINCIPAL */}
      <div className="p-3.5 bg-slate-800/95 border-t border-slate-700 flex items-center gap-2">
        {batch.status === 'Pendiente' ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onStart(batch.id)}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-98 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Preparación</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onFinish(batch.id)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Marcar como Lista 🔵</span>
          </button>
        )}
      </div>
    </div>
  );
};
