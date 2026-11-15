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

  // Hora legible de ingreso (ej: 13:45)
  const formattedCreatedTime = new Date(batch.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex flex-col bg-slate-900 rounded-3xl border-2 transition-all shadow-xl overflow-hidden select-none ${
        semaforo.cardBorder
      } ${isSelected ? 'ring-4 ring-amber-400 border-amber-400' : ''}`}
    >
      {/* 1. ENCABEZADO SUPERIOR */}
      <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Checkbox táctil */}
          {batch.status === 'Pendiente' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(batch.id)}
              className="w-5 h-5 rounded-lg text-amber-500 bg-slate-900 border-slate-600 focus:ring-amber-400 cursor-pointer"
            />
          )}

          {/* Número de comanda destacado */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-2xl text-white tracking-tight">
                #{batch.orderNumber}
              </span>
              {batch.batchNumber > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500 text-slate-950">
                  Agregado #{batch.batchNumber}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Ingreso: {formattedCreatedTime} hs</span>
            </div>
          </div>
        </div>

        {/* Badge Semáforo / Estado y botón de descarte */}
        <div className="flex items-start gap-1.5">
          <div className="text-right">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow-sm ${semaforo.badgeBg}`}>
              {batch.status === 'Pendiente' && <Clock className="w-3.5 h-3.5" />}
              {batch.status === 'En preparación' && <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{batch.status}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
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
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition cursor-pointer"
              title="Descartar pedido de cocina"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CANAL DE VENTA Y DETALLES DE MESA / ENTREGA */}
      <div className="bg-slate-800/40 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {batch.saleTypeName.toLowerCase().includes('salón') || batch.saleTypeName.toLowerCase().includes('salon') ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-extrabold text-sm">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span>{batch.tableName || 'Salón'}</span>
            </span>
          ) : batch.saleTypeName.toLowerCase().includes('take') || batch.saleTypeName.toLowerCase().includes('retiro') ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-extrabold text-sm">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>Take Away</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm">
              <Bike className="w-4 h-4 text-emerald-400" />
              <span>Delivery</span>
            </span>
          )}

          {batch.clientName && batch.clientName !== 'Consumidor Final' && (
            <span className="text-slate-300 font-medium truncate max-w-[140px] flex items-center gap-1 text-[11px]">
              <User className="w-3 h-3 text-slate-500" />
              {batch.clientName}
            </span>
          )}
        </div>

        {/* Dirección de delivery si corresponde */}
        {batch.deliveryAddress && (
          <div className="text-[11px] text-emerald-300 font-medium truncate max-w-[160px] flex items-center gap-1" title={batch.deliveryAddress}>
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{batch.deliveryAddress}</span>
          </div>
        )}
      </div>

      {/* 3. CONTADOR DE TIEMPO EN VIVO */}
      <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between font-mono font-bold ${semaforo.bannerBg}`}>
        {batch.status === 'Pendiente' ? (
          <>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Tiempo de Espera:</span>
            </div>
            <div className="text-base font-black tracking-tight">
              {formatTime(totalElapsedSec)}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 fill-current text-blue-400" />
              <span>Preparación Activa:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-blue-300 tracking-tight">
                {formatTime(prepElapsedSec)}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Total: {totalElapsedMin}m)
              </span>
            </div>
          </>
        )}
      </div>

      {/* 4. LISTADO DE PRODUCTOS DE FABRICACIÓN */}
      <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
        {batch.items.map((item, idx) => {
          const isCancelled = item.itemStatus === 'Cancelado';

          return (
            <div
              key={item.id || idx}
              className={`p-2.5 rounded-2xl border transition-all ${
                isCancelled
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 line-through opacity-80'
                  : 'bg-slate-800/70 border-slate-700/60 text-slate-100 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {/* Cantidad grande táctil */}
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isCancelled
                        ? 'bg-rose-900 text-rose-200'
                        : 'bg-amber-500 text-slate-950 shadow-sm'
                    }`}
                  >
                    {item.quantity}×
                  </span>

                  <div>
                    {/* Nombre del plato */}
                    <p className={`font-black text-sm leading-tight ${isCancelled ? 'line-through text-rose-300' : 'text-white'}`}>
                      {item.productName}
                    </p>

                    {/* Variantes y opciones seleccionadas */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedOptions.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-700 text-amber-200 border border-slate-600"
                          >
                            {opt.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observación / Comentario en Alto Contraste (ej: SIN QUESO, BIEN COCIDO) */}
              {item.lineComment && (
                <div className="mt-2 px-2.5 py-1 rounded-xl bg-black border-2 border-yellow-400 text-yellow-300 text-xs font-black flex items-center gap-1.5 shadow-md">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="uppercase tracking-wide font-extrabold">
                    {item.lineComment}
                  </span>
                </div>
              )}

              {/* Alerta de Cancelación */}
              {item.alertMessage && (
                <div className="mt-2 px-2.5 py-1 rounded-xl bg-rose-900/90 text-rose-200 text-[11px] font-black border border-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{item.alertMessage}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Nota general de comanda si existe */}
        {batch.generalNotes && (
          <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Nota general:</span>
            <p className="italic text-slate-200">{batch.generalNotes}</p>
          </div>
        )}
      </div>

      {/* 5. PIE DE TARJETA CON BOTÓN TÁCTIL PRINCIPAL */}
      <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center gap-2">
        {batch.status === 'Pendiente' ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onStart(batch.id)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Preparación</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onFinish(batch.id)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Marcar como Lista 🔵</span>
          </button>
        )}
      </div>
    </div>
  );
};
