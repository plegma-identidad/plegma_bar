import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Combo } from '../../types';
import { ComboModal } from './ComboModal';
import { ComboDetailModal } from './ComboDetailModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ModuleHelpModal } from '../ui/ModuleHelpModal';
import { storageService } from '../../services/storageService';
import {
  Layers,
  Plus,
  Search,
  Grid,
  List,
  Percent,
  Eye,
  Edit2,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  HelpCircle,
  Package,
  ChefHat,
  Utensils,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export const CombosView: React.FC = () => {
  const {
    combos,
    deleteCombo,
    toggleComboActive,
    duplicateCombo,
  } = useApp();

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comboToEdit, setComboToEdit] = useState<Combo | null>(null);
  const [detailCombo, setDetailCombo] = useState<Combo | null>(null);
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    combos.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [combos]);

  // Filtrado de Combos
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      if (selectedCategory !== 'ALL' && combo.category !== selectedCategory) return false;
      if (selectedStatus === 'ACTIVE' && !combo.active) return false;
      if (selectedStatus === 'INACTIVE' && combo.active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = combo.name.toLowerCase().includes(q);
        const matchesCode = combo.code.toLowerCase().includes(q);
        const matchesCat = combo.category.toLowerCase().includes(q);
        const matchesSub = combo.subcategory?.toLowerCase().includes(q);
        const matchesItems = (combo.sections || []).some((s) =>
          (s.items || []).some((i) => i.componentName.toLowerCase().includes(q))
        );

        if (!matchesName && !matchesCode && !matchesCat && !matchesSub && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [combos, selectedCategory, selectedStatus, searchQuery]);

  // Paginación estricta de 8 registros por página
  const totalPages = Math.ceil(filteredCombos.length / ITEMS_PER_PAGE) || 1;

  // Reset de página al cambiar filtros
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const paginatedCombos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCombos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCombos, currentPage]);

  // KPIs
  const stats = useMemo(() => {
    const total = combos.length;
    const activos = combos.filter((c) => c.active).length;
    const validMargins = combos.filter((c) => Number(c.sellingPrice) > 0);
    const avgMargin =
      validMargins.length > 0
        ? validMargins.reduce((acc, c) => acc + (c.profitMargin || 0), 0) / validMargins.length
        : 0;
    const avgPrice =
      validMargins.length > 0
        ? validMargins.reduce((acc, c) => acc + (Number(c.sellingPrice) || 0), 0) / validMargins.length
        : 0;

    return { total, activos, avgMargin, avgPrice };
  }, [combos]);

  // Handlers
  const handleOpenNew = () => {
    setComboToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (combo: Combo) => {
    setComboToEdit(combo);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (combo: Combo) => {
    setDetailCombo(combo);
  };

  const handleDuplicate = async (combo: Combo) => {
    await duplicateCombo(combo.id);
  };

  const handleConfirmDelete = async () => {
    if (!comboToDelete) return;
    await deleteCombo(comboToDelete.id);
    setComboToDelete(null);
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 60) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {margin.toFixed(1)}%
        </span>
      );
    }
    if (margin >= 40) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {margin.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
        {margin.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Ventas</span>
            <span>/</span>
            <span className="text-amber-600">Combos Configurables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-amber-500" />
            Maestro de Combos & Promociones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Combos armados por insumos, producciones o productos de carta con secciones y recargos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs flex items-center gap-1.5 text-xs font-bold"
            title="Manual y Ayuda del Módulo"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Guía del Módulo</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition shadow-amber-500/20 shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Combo
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Combos</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
            <span className="text-[10px] text-slate-400">En catálogo</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Combos Activos</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats.activos}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Listos para vender</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Margen Promedio</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.avgMargin.toFixed(1)}%</p>
            <span className="text-[10px] text-slate-400">Rentabilidad bruta</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Precio Promedio</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              ${Math.round(stats.avgPrice).toLocaleString('es-AR')}
            </p>
            <span className="text-[10px] text-slate-400">Ticket sugerido</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Búsqueda */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código CMB, categoría o ingredientes/componentes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Filtros Dropdowns y Toggle de Vista */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Estado */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Solo Activos</option>
              <option value="INACTIVE">Solo Pausados</option>
            </select>

            {/* Switch Grid / Table */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Cuadrícula"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista Tabla"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido: Cards o Tabla con paginación de 8 registros */}
      {paginatedCombos.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron combos</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {combos.length === 0
              ? 'Aún no has configurado ningún combo. Haz clic en "Nuevo Combo" para comenzar.'
              : 'No hay combos que coincidan con los filtros o la búsqueda actual.'}
          </p>
          {combos.length === 0 && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Crear Primer Combo
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA CUADRÍCULA */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paginatedCombos.map((combo) => {
            const sectionsCount = combo.sections?.length || 0;
            const optionsCount = (combo.sections || []).reduce(
              (acc, s) => acc + (s.items?.length || 0),
              0
            );

            return (
              <div
                key={combo.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
              >
                {/* Imagen del Combo */}
                <div className="aspect-16/10 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {combo.imageUrl ? (
                    <img
                      src={combo.imageUrl}
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 p-4">
                      <Layers className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400">Sin foto</span>
                    </div>
                  )}

                  {/* Badge de Código */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-900/80 text-amber-300 backdrop-blur-xs">
                    {combo.code}
                  </span>

                  {/* Switch Activo / Pausado Rápido */}
                  <button
                    type="button"
                    onClick={() => toggleComboActive(combo.id)}
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs transition ${
                      combo.active
                        ? 'bg-emerald-500/90 text-white shadow-xs'
                        : 'bg-red-500/90 text-white shadow-xs'
                    }`}
                    title={combo.active ? 'Haga clic para pausar' : 'Haga clic para activar'}
                  >
                    {combo.active ? 'Activo' : 'Pausado'}
                  </button>
                </div>

                {/* Contenido de la Card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>{combo.category || 'General'}</span>
                      {combo.subcategory && (
                        <>
                          <span>•</span>
                          <span className="truncate">{combo.subcategory}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-black text-slate-800 text-sm mt-0.5 line-clamp-1" title={combo.name}>
                      {combo.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                      {combo.description || `${sectionsCount} secciones configuradas con ${optionsCount} opciones.`}
                    </p>
                  </div>

                  {/* Precios y Margen */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio</span>
                        <span className="text-base font-black text-slate-900">
                          ${(Number(combo.sellingPrice) || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Margen</span>
                        <div>{getMarginBadge(combo.profitMargin || 0)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-xl">
                      <span>Costo Base:</span>
                      <span className="font-mono font-bold text-slate-700">
                        ${(Number(combo.costPrice) || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(combo)}
                      className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Ver Ficha Técnica"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(combo)}
                      className="p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                      title="Editar Combo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(combo)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Duplicar Combo"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setComboToDelete(combo)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar Combo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Código / Foto</th>
                  <th className="p-3.5">Nombre & Categoría</th>
                  <th className="p-3.5 text-center">Secciones</th>
                  <th className="p-3.5 text-right">Costo Base</th>
                  <th className="p-3.5 text-right">Precio Venta</th>
                  <th className="p-3.5 text-center">Margen</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedCombos.map((combo) => (
                  <tr key={combo.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                          {combo.imageUrl ? (
                            <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layers className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {combo.code}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-black text-slate-900 text-xs">{combo.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {combo.category} {combo.subcategory && `• ${combo.subcategory}`}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        {(combo.sections || []).length} pasos
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono text-slate-600">
                      ${(Number(combo.costPrice) || 0).toLocaleString('es-AR')}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      ${(Number(combo.sellingPrice) || 0).toLocaleString('es-AR')}
                    </td>

                    <td className="p-3.5 text-center">{getMarginBadge(combo.profitMargin || 0)}</td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleComboActive(combo.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          combo.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {combo.active ? 'Activo' : 'Pausado'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(combo)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Ver Ficha Técnica"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(combo)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(combo)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setComboToDelete(combo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Controles de Paginación Estricta (8 registros por página) */}
      {filteredCombos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Mostrando{' '}
            <span className="font-bold text-slate-800">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            a{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCombos.length)}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-800">
              {filteredCombos.length}
            </span>{' '}
            combos {totalPages > 1 && `(Página ${currentPage} de ${totalPages})`}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center gap-1"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pageNum - prev > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400 text-xs font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-xl transition shadow-xs ${
                            currentPage === pageNum
                              ? 'bg-amber-500 text-white shadow-amber-500/20'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center gap-1"
                title="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Combo */}
      <ComboModal
        isOpen={isModalOpen}
        comboToEdit={comboToEdit}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal Ver Ficha Técnica / Detalle */}
      <ComboDetailModal
        isOpen={!!detailCombo}
        combo={detailCombo}
        onClose={() => setDetailCombo(null)}
        onEdit={(c) => {
          setDetailCombo(null);
          setComboToEdit(c);
          setIsModalOpen(true);
        }}
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={!!comboToDelete}
        title="¿Eliminar Combo?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el combo "${comboToDelete?.name}" (${comboToDelete?.code})? Se eliminarán también sus fotos y archivos de Storage.`}
        confirmText="Eliminar Permanentemente"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setComboToDelete(null)}
      />

      {/* Modal de Ayuda del Módulo */}
      {isHelpOpen && (
        <ModuleHelpModal
          module="combos"
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
};
