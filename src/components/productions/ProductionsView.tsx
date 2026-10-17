import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductionProduct } from '../../types';
import { ProductionModal } from './ProductionModal';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  ChefHat,
  Plus,
  Search,
  Layers,
  FileText,
  Video,
  Edit2,
  Trash2,
  Copy,
  Grid,
  List,
  Eye,
  X,
  TrendingUp,
  Package,
  Building,
  ArrowUpRight,
  Warehouse,
  Flame,
} from 'lucide-react';

export const ProductionsView: React.FC = () => {
  const {
    productionProducts,
    deleteProductionProduct,
    toggleProductionProductActive,
    duplicateProductionProduct,
  } = useApp();

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductionProduct | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductionProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductionProduct | null>(null);

  // Categorías y Almacenes únicos para los filtros
  const categories = useMemo(() => {
    const set = new Set<string>();
    productionProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [productionProducts]);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    productionProducts.forEach((p) => {
      if (p.warehouse) set.add(p.warehouse);
    });
    return Array.from(set).sort();
  }, [productionProducts]);

  // Filtrado de producciones
  const filteredProducts = useMemo(() => {
    return productionProducts.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (selectedWarehouse !== 'ALL' && p.warehouse !== selectedWarehouse) return false;
      if (selectedStatus === 'ACTIVE' && !p.active) return false;
      if (selectedStatus === 'INACTIVE' && p.active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        const matchesSub = p.subcategory?.toLowerCase().includes(q);
        const matchesWarehouse = p.warehouse?.toLowerCase().includes(q);
        const matchesRecipe = p.recipe?.some((r) =>
          r.itemName.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesCode && !matchesCat && !matchesSub && !matchesWarehouse && !matchesRecipe) {
          return false;
        }
      }

      return true;
    });
  }, [productionProducts, selectedCategory, selectedWarehouse, selectedStatus, searchQuery]);

  // KPIs Superiores
  const stats = useMemo(() => {
    const total = productionProducts.length;
    const activos = productionProducts.filter((p) => p.active).length;
    const pausados = total - activos;
    const validCosts = productionProducts.filter((p) => (Number(p.costPrice) || 0) > 0);
    const avgCost = validCosts.length > 0
      ? validCosts.reduce((acc, p) => acc + (Number(p.costPrice) || 0), 0) / validCosts.length
      : 0;

    return { total, activos, pausados, avgCost };
  }, [productionProducts]);

  // Manejadores
  const handleOpenNew = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: ProductionProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (productId: string) => {
    await duplicateProductionProduct(productId);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProductionProduct(productToDelete.id);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* 1. Header con Breadcrumbs y Botón de Acción Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-amber-600 font-semibold">Producciones</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-600" />
            Producciones Internas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Preparaciones intermedias elaboradas con insumos propios para recetas de venta o cocina
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNew}
            className="shadow-sm"
          >
            Nueva Producción
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Producciones
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
            <p className="text-[10px] text-slate-400">Preparaciones registradas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              En Producción Activa
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.activos}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Disponibles para recetas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pausadas / Inactivas
            </p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{stats.pausados}</p>
            <p className="text-[10px] text-slate-400">Fuera de elaboración</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Costo Promedio Lote
            </p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">
              ${stats.avgCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-slate-400">Calculado desde recetas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Buscador de texto */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar preparación por nombre, código, almacén o ingrediente..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selectores de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Selector de Almacén */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">Todos los Almacenes</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Pausados</option>
          </select>

          {/* Toggle de Cuadrícula / Tabla */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Lista o Cuadrícula de Producciones */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron producciones</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'ALL' || selectedWarehouse !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Prueba modificando los filtros o el texto de búsqueda.'
              : 'Empieza cargando la primera preparación interna de cocina o barra.'}
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNew}
          >
            Crear Producción
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA EN CUADRÍCULA (CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            return (
              <div
                key={product.id}
                className={`bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
                  product.active ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20 opacity-80'
                }`}
              >
                <div>
                  {/* Foto de Portada / Encabezado Visual */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
                        <ChefHat className="w-12 h-12" />
                      </div>
                    )}

                    {/* Badges superiores: Almacén y Estado */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/95 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs">
                        <Warehouse className="w-3 h-3 text-amber-600" />
                        {product.warehouse || 'Freezer Producción'}
                      </span>
                    </div>

                    {/* Switch de Activo/Pausado */}
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => toggleProductionProductActive(product.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs transition ${
                          product.active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                        }`}
                        title={product.active ? 'Hacer clic para pausar producción' : 'Hacer clic para activar producción'}
                      >
                        {product.active ? 'Activo' : 'Pausado'}
                      </button>
                    </div>

                    {/* Badge de Categoría inferior en la foto */}
                    <div className="absolute bottom-2 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs border border-slate-200 shadow-xs">
                        {product.category} {product.subcategory ? `› ${product.subcategory}` : ''}
                      </span>
                    </div>

                    {/* Botones de Recursos (PDF / Video) */}
                    <div className="absolute bottom-2 right-2.5 flex items-center gap-1">
                      {product.recipeFileUrl && (
                        <a
                          href={product.recipeFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md bg-white text-indigo-600 hover:text-indigo-800 border border-slate-200 shadow-xs hover:bg-slate-50 transition"
                          title="Ver ficha técnica / PDF"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {product.videoUrl && (
                        <a
                          href={product.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md bg-white text-rose-600 hover:text-rose-800 border border-slate-200 shadow-xs hover:bg-slate-50 transition"
                          title="Ver video de preparación"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la Card */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 tracking-wider">
                        {product.code}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    {/* Costo Calculado y Unidad */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Costo Calculado
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ${(Number(product.costPrice) || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Unidad
                        </span>
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          por {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Resumen de Receta */}
                    <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-xs">
                      <span className="flex items-center gap-1 font-medium text-slate-600 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>{product.recipe?.length || 0} insumos</span>
                      </span>
                      <button
                        onClick={() => setDetailProduct(product)}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline"
                      >
                        Ver receta
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer de Acciones */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setDetailProduct(product)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                    title="Ver Ficha Técnica Completa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(product.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Duplicar preparación"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Editar preparación"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(product)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Eliminar preparación"
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
        /* VISTA EN TABLA (LIST) */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Preparación</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Almacén</th>
                  <th className="p-3 text-right">Unidad</th>
                  <th className="p-3 text-right">Costo Calculado</th>
                  <th className="p-3">Receta (Insumos)</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((product) => {
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setDetailProduct(product)}
                    >
                      <td className="p-3 font-mono font-bold text-amber-600">
                        {product.code}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <ChefHat className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {product.subcategory || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">{product.category}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                          <Warehouse className="w-3 h-3 text-amber-600" />
                          {product.warehouse || 'Freezer Producción'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 font-bold">
                        {product.unit}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        ${(Number(product.costPrice) || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          {product.recipe?.length || 0} insumos
                        </span>
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleProductionProductActive(product.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                            product.active
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {product.active ? 'Activo' : 'Pausado'}
                        </button>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(product.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal de Ficha Técnica / Detalle de la Producción */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header del Modal Detalle */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-600">{detailProduct.code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                      {detailProduct.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {detailProduct.warehouse || 'Freezer Producción'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{detailProduct.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setDetailProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Detalle */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Foto de la Preparación si existe */}
              {detailProduct.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video max-h-48 bg-slate-100 flex items-center justify-center shadow-xs">
                  <img
                    src={detailProduct.imageUrl}
                    alt={detailProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Resumen Financiero y Unidad */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Costo Calculado</p>
                  <p className="text-base font-black text-amber-700 mt-0.5">
                    ${(Number(detailProduct.costPrice) || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Unidad Elaborada</p>
                  <p className="text-base font-black text-slate-900 mt-0.5 font-mono">
                    {detailProduct.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Almacén de Guarda</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {detailProduct.warehouse || 'Freezer Producción'}
                  </p>
                </div>
              </div>

              {/* Recursos Adjuntos (PDF / Video) */}
              {(detailProduct.recipeFileUrl || detailProduct.videoUrl) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Documentación de Elaboración
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailProduct.recipeFileUrl && (
                      <a
                        href={detailProduct.recipeFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>{detailProduct.recipeFileName || 'Descargar / Ver Ficha Técnica (PDF)'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </a>
                    )}
                    {detailProduct.videoUrl && (
                      <a
                        href={detailProduct.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition"
                      >
                        <Video className="w-4 h-4 text-rose-600" />
                        <span>Ver Video Tutorial de Preparación</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle de Receta de Insumos */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  Receta & Composición con Insumos
                </h4>
                {(!detailProduct.recipe || detailProduct.recipe.length === 0) ? (
                  <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                    No hay insumos registrados para esta preparación.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Insumo</th>
                          <th className="p-2.5 text-right">Cantidad</th>
                          <th className="p-2.5 text-right">Unidad</th>
                          <th className="p-2.5 text-right">Costo Unit.</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {detailProduct.recipe.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-800">{item.itemName}</td>
                            <td className="p-2.5 text-right font-mono text-slate-700">{item.quantity}</td>
                            <td className="p-2.5 text-right text-slate-500 font-bold">{item.unit}</td>
                            <td className="p-2.5 text-right font-mono text-slate-500">
                              ${(Number(item.unitCost) || 0).toLocaleString('es-AR')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              ${(Number(item.subtotal) || 0).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right text-slate-500 uppercase text-[10px]">
                            Costo Total de Elaboración:
                          </td>
                          <td className="p-2.5 text-right font-mono text-amber-700 text-sm font-black">
                            ${(Number(detailProduct.costPrice) || 0).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                variant="primary"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  const p = detailProduct;
                  setDetailProduct(null);
                  handleEdit(p);
                }}
              >
                Editar Producción
              </Button>
              <Button
                variant="outline"
                onClick={() => setDetailProduct(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="¿Eliminar esta preparación de producción?"
        message={`Se eliminará "${productToDelete?.name}" y su receta asociada de insumos. Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />

      {/* 7. Modal Principal de Creación / Edición */}
      <ProductionModal
        isOpen={isModalOpen}
        productToEdit={productToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
      />
    </div>
  );
};
