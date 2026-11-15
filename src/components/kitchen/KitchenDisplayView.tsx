import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { kitchenService } from '../../services/kitchenService';
import { KitchenBatch, ConsolidatedProductionItem } from '../../types';
import { KitchenCard } from './KitchenCard';
import { ProductionConsolidatedModal } from './ProductionConsolidatedModal';
import {
  Flame,
  Clock,
  Play,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Utensils,
  ShoppingBag,
  Bike,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface KitchenDisplayViewProps {
  onNavigateToPos?: () => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({ onNavigateToPos }) => {
  const { saleProducts, currentUser, showToast } = useApp();

  const [batches, setBatches] = useState<KitchenBatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isProcessingBatchId, setIsProcessingBatchId] = useState<string | null>(null);

  // Filtros
  const [channelFilter, setChannelFilter] = useState<'TODOS' | 'SALON' | 'TAKEAWAY' | 'DELIVERY'>('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'Pendiente' | 'En preparación'>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState<boolean>(false);
  const [consolidatedItems, setConsolidatedItems] = useState<ConsolidatedProductionItem[]>([]);
  const [lastSelectedBatchCount, setLastSelectedBatchCount] = useState<number>(0);

  // Pantalla completa
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carga de lotes activos de cocina
  const loadBatches = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await kitchenService.getBatches({ activeOnly: true });
      // Asegurar estricto orden cronológico por fecha de ingreso (la más antigua primero)
      const sorted = [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setBatches(sorted);
    } catch (err) {
      console.error('Error al cargar lotes de cocina:', err);
      if (!silent) showToast('Error al actualizar pedidos de cocina.', 'danger');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Montaje: Carga inicial, suscripción a Supabase Realtime y polling de respaldo (15s)
  useEffect(() => {
    loadBatches();

    // Suscripción Realtime a Supabase
    const unsubscribe = kitchenService.subscribeToChanges(() => {
      loadBatches(true);
    });

    // Polling de respaldo cada 15 segundos
    const interval = setInterval(() => {
      loadBatches(true);
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Manejador de Pantalla Completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Filtrado de lotes para visualización
  // REGLA FUNDAMENTAL: El orden cronológico inicial NO SE MODIFICA
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Filtro por Estado
      if (statusFilter !== 'TODOS' && b.status !== statusFilter) return false;

      // Filtro por Canal de Venta
      if (channelFilter === 'SALON') {
        const s = b.saleTypeName.toLowerCase();
        if (!s.includes('salón') && !s.includes('salon')) return false;
      } else if (channelFilter === 'TAKEAWAY') {
        const s = b.saleTypeName.toLowerCase();
        if (!s.includes('take') && !s.includes('retiro')) return false;
      } else if (channelFilter === 'DELIVERY') {
        const s = b.saleTypeName.toLowerCase();
        if (!s.includes('delivery')) return false;
      }

      // Buscador
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = String(b.orderNumber).includes(q);
        const matchTable = b.tableName?.toLowerCase().includes(q);
        const matchClient = b.clientName?.toLowerCase().includes(q);
        if (!matchNum && !matchTable && !matchClient) return false;
      }

      return true;
    });
  }, [batches, channelFilter, statusFilter, searchQuery]);

  // Selección individual para inicio múltiple
  const handleToggleSelect = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  // Iniciar preparación individual
  const handleStartBatch = async (batchId: string) => {
    setIsProcessingBatchId(batchId);
    try {
      const res = await kitchenService.startBatch(
        batchId,
        currentUser?.id,
        currentUser?.name || 'Cocinero'
      );
      if (res.success) {
        showToast(res.message, 'success');
        await loadBatches(true);
      } else {
        showToast(res.message, 'danger');
      }
    } finally {
      setIsProcessingBatchId(null);
    }
  };

  // Iniciar preparación múltiple + Apertura automática del Consolidado de Producción
  const handleStartMultipleBatches = async () => {
    if (selectedBatchIds.length === 0) return;

    setIsLoading(true);
    try {
      // 1. Obtener los lotes seleccionados para generar el consolidado
      const targetBatches = batches.filter((b) => selectedBatchIds.includes(b.id));

      // 2. Iniciar preparación en Supabase
      const res = await kitchenService.startMultipleBatches(
        selectedBatchIds,
        currentUser?.id,
        currentUser?.name || 'Cocinero'
      );

      if (res.success) {
        showToast(res.message, 'success');
        // 3. Generar consolidado de producción de los platos seleccionados
        const consolidated = kitchenService.getConsolidatedProduction(targetBatches);
        setConsolidatedItems(consolidated);
        setLastSelectedBatchCount(selectedBatchIds.length);
        setIsConsolidatedModalOpen(true);

        setSelectedBatchIds([]);
        await loadBatches(true);
      } else {
        showToast(res.message, 'danger');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ver consolidado de todos los platos activos en cocina
  const handleOpenGeneralConsolidated = () => {
    const consolidated = kitchenService.getConsolidatedProduction(batches);
    setConsolidatedItems(consolidated);
    setLastSelectedBatchCount(0);
    setIsConsolidatedModalOpen(true);
  };

  // Finalizar preparación (Marcar como Lista)
  const handleFinishBatch = async (batchId: string) => {
    setIsProcessingBatchId(batchId);
    try {
      const res = await kitchenService.finishBatch(
        batchId,
        currentUser?.id,
        currentUser?.name || 'Cocinero'
      );
      if (res.success) {
        showToast(res.message, 'success');
        await loadBatches(true);
      } else {
        showToast(res.message, 'danger');
      }
    } finally {
      setIsProcessingBatchId(null);
    }
  };

  // Descartar o eliminar un lote de cocina
  const handleDeleteBatch = async (batchId: string) => {
    try {
      const ok = await kitchenService.deleteBatch(batchId);
      if (ok) {
        showToast('Pedido de cocina descartado.', 'info');
        setBatches((prev) => prev.filter((b) => b.id !== batchId));
      } else {
        showToast('Error al descartar pedido de cocina.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al descartar pedido.', 'danger');
    }
  };

  // Contadores para KPIs superiores
  const pendingCount = batches.filter((b) => b.status === 'Pendiente').length;
  const inPrepCount = batches.filter((b) => b.status === 'En preparación').length;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none"
    >
      {/* 1. BARRA SUPERIOR PRINCIPAL (KDS HEADER) */}
      <header className="bg-slate-900 border-b-2 border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl relative z-10">
        {/* Identidad del Módulo y Botón Volver a POS */}
        <div className="flex items-center gap-3">
          {onNavigateToPos && (
            <button
              type="button"
              onClick={onNavigateToPos}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Volver a la toma de Comandas POS"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Comandas POS</span>
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                PLEGMA Resto Bar
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                En Vivo (Realtime)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Monitor de Cocina (KDS)</span>
            </h1>
          </div>
        </div>

        {/* KPIs Rápidos y Resumen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge Pendientes */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Pendiente' ? 'TODOS' : 'Pendiente')}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'Pendiente'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800/80 text-amber-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendientes:</span>
            <span className="px-2 py-0.5 rounded-xl bg-slate-900 text-white font-mono font-black text-sm">
              {pendingCount}
            </span>
          </button>

          {/* Badge En Preparación */}
          <button
            type="button"
            onClick={() =>
              setStatusFilter(statusFilter === 'En preparación' ? 'TODOS' : 'En preparación')
            }
            className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              statusFilter === 'En preparación'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-slate-800/80 text-blue-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>En Preparación:</span>
            <span className="px-2 py-0.5 rounded-xl bg-slate-900 text-white font-mono font-black text-sm">
              {inPrepCount}
            </span>
          </button>

          {/* Botón Consolidado General */}
          <button
            type="button"
            onClick={handleOpenGeneralConsolidated}
            className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs border border-slate-700 flex items-center gap-2 transition shadow-sm cursor-pointer"
            title="Ver resumen consolidado de producción por platos"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Ver Consolidado</span>
          </button>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={() => loadBatches()}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Refrescar comanderas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Botón Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa KDS'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. BARRA DE ACCIÓN FLOTANTE SI HAY SELECCIÓN MÚLTIPLE */}
      {selectedBatchIds.length > 0 && (
        <div className="bg-amber-500 text-slate-950 px-6 py-3 flex items-center justify-between shadow-2xl animate-slideDown sticky top-[73px] z-30 font-black">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm">
              {selectedBatchIds.length}
            </span>
            <span className="text-sm">
              {selectedBatchIds.length === 1
                ? '1 comanda seleccionada para iniciar'
                : `${selectedBatchIds.length} comandas seleccionadas para iniciar juntas`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedBatchIds([])}
              className="px-3 py-1.5 rounded-xl bg-amber-600/50 hover:bg-amber-600 text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleStartMultipleBatches}
              className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Iniciar Preparación & Ver Consolidado</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BARRA DE FILTROS RÁPIDOS POR CANAL Y BUSCADOR */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filtros de Canal de Venta */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setChannelFilter('TODOS')}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              channelFilter === 'TODOS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({batches.length})
          </button>

          <button
            type="button"
            onClick={() => setChannelFilter('SALON')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              channelFilter === 'SALON'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Salón</span>
          </button>

          <button
            type="button"
            onClick={() => setChannelFilter('TAKEAWAY')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              channelFilter === 'TAKEAWAY'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>

          <button
            type="button"
            onClick={() => setChannelFilter('DELIVERY')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              channelFilter === 'DELIVERY'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Buscador táctil */}
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar comanda, mesa o cliente..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 4. ÁREA PRINCIPAL DE TARJETAS KDS EN ESTRICTO ORDEN CRONOLÓGICO */}
      <main className="p-4 sm:p-6 flex-1 overflow-y-auto">
        {isLoading && batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="font-extrabold text-sm">Cargando comandas en cocina...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Flame className="w-16 h-16 mx-auto mb-4 text-slate-700 opacity-40" />
            <h2 className="text-lg font-black text-slate-400">Cocina al Día</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              No hay comandas activas pendientes de elaboración con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredBatches.map((batch) => (
              <KitchenCard
                key={batch.id}
                batch={batch}
                isSelected={selectedBatchIds.includes(batch.id)}
                onToggleSelect={handleToggleSelect}
                onStart={handleStartBatch}
                onFinish={handleFinishBatch}
                onDelete={handleDeleteBatch}
                isProcessing={isProcessingBatchId === batch.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* 5. MODAL DE RESUMEN CONSOLIDADO DE PRODUCCIÓN */}
      {isConsolidatedModalOpen && (
        <ProductionConsolidatedModal
          items={consolidatedItems}
          selectedBatchCount={lastSelectedBatchCount}
          onClose={() => setIsConsolidatedModalOpen(false)}
        />
      )}
    </div>
  );
};
