import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleProduct, SaleProductType } from '../../types';
import { SaleProductModal } from './SaleProductModal';
import { storageService } from '../../services/storageService';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ModuleHelpModal } from '../ui/ModuleHelpModal';
import {
  Utensils,
  ChefHat,
  ShoppingBag,
  Plus,
  Search,
  Layers,
  FileText,
  Video,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Grid,
  List,
  Percent,
  Eye,
  X,
  TrendingUp,
  HelpCircle,
  ArrowUpRight,
  Package,
  ExternalLink,
  Film,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

// Helper para convertir URLs de YouTube o Vimeo a URLs embebibles
const getEmbedVideoUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }
    return null;
  } catch {
    return null;
  }
};

const isDirectVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('supabase.co') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.includes('/video_') ||
    lower.includes('content-type=video')
  );
};

const getFileNameFromUrl = (url?: string, defaultName = 'Ficha Técnica de Receta'): string => {
  if (!url) return defaultName;
  try {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/');
    const last = segments[segments.length - 1];
    if (last) {
      const decoded = decodeURIComponent(last);
      return decoded.replace(/^[a-z]+_/i, '');
    }
    return defaultName;
  } catch {
    return defaultName;
  }
};

export const SaleProductsView: React.FC = () => {
  const {
    saleProducts,
    items,
    deleteSaleProduct,
    toggleSaleProductActive,
    duplicateSaleProduct,
  } = useApp();

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | SaleProductType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<SaleProduct | null>(null);
  const [detailProduct, setDetailProduct] = useState<SaleProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<SaleProduct | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(false);

  // Categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    saleProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [saleProducts]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return saleProducts.filter((product) => {
      if (selectedType !== 'ALL') {
        const isFabProd = String(product.productType || '').toLowerCase().includes('fab');
        const isFabFilter = String(selectedType).toLowerCase().includes('fab');
        if (isFabProd !== isFabFilter) return false;
      }
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return false;
      if (selectedStatus === 'ACTIVE' && !product.active) return false;
      if (selectedStatus === 'INACTIVE' && product.active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCode = product.code.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesSub = product.subcategory?.toLowerCase().includes(q);
        const productRecipe = product.recipe || product.recipeComponents || [];
        const matchesRecipe = productRecipe.some((r) =>
          r.componentName.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesCode && !matchesCat && !matchesSub && !matchesRecipe) {
          return false;
        }
      }

      return true;
    });
  }, [saleProducts, selectedType, selectedCategory, selectedStatus, searchQuery]);

  // Paginación (8 registros por página)
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear a página 1 al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Métricas / KPIs
  const stats = useMemo(() => {
    const total = saleProducts.length;
    const fabricacion = saleProducts.filter((p) => String(p.productType || '').toLowerCase().includes('fab')).length;
    const reventa = saleProducts.filter((p) => !String(p.productType || '').toLowerCase().includes('fab')).length;
    const activos = saleProducts.filter((p) => p.active).length;

    const validMargins = saleProducts.filter((p) => p.sellingPrice > 0);
    const avgMargin = validMargins.length > 0
      ? validMargins.reduce((acc, p) => acc + (p.profitMargin || 0), 0) / validMargins.length
      : 0;

    return { total, fabricacion, reventa, activos, avgMargin };
  }, [saleProducts]);

  // Manejadores
  const handleOpenNew = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (product: SaleProduct) => {
    setPreviewDoc(false);

    // Auto-recuperación: si al producto le falta recipeFileUrl, videoUrl o imageUrl, consultar Storage
    if (product.code && (!product.recipeFileUrl || !product.videoUrl || !product.imageUrl)) {
      const files = await storageService.getProductFiles(product.code);
      const enrichedProduct: SaleProduct = {
        ...product,
        recipeFileUrl: product.recipeFileUrl || files.recipeFileUrl,
        recipeFileName: product.recipeFileName || files.recipeFileName || (files.recipeFileUrl ? getFileNameFromUrl(files.recipeFileUrl) : undefined),
        videoUrl: product.videoUrl || files.videoUrl,
        imageUrl: product.imageUrl || files.imageUrl,
      };
      setDetailProduct(enrichedProduct);
      return;
    }

    setDetailProduct(product);
  };

  const handleEdit = (product: SaleProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (productId: string) => {
    await duplicateSaleProduct(productId);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    await deleteSaleProduct(productToDelete.id);
    setProductToDelete(null);
  };

  // Helper para badge de margen
  const getMarginBadge = (margin: number) => {
    let colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    if (margin >= 65) {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (margin >= 40) {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}>
        <Percent className="w-3 h-3" />
        {margin.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* 1. Header con Breadcrumbs y Botones de Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-indigo-600 font-semibold">Ventas</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Prod. de Venta (Carta)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-indigo-600" />
            Prod. de Venta (Carta)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo de productos para la venta, escandallos con insumos/producciones y artículos de reventa directa
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            leftIcon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setIsHelpOpen(true)}
            className="hidden sm:inline-flex"
          >
            Guía de Uso
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNew}
          >
            + Nuevo Producto
          </Button>
        </div>
      </div>

      {/* 2. Resumen KPI Cards (Estilo idéntico a Control de Caja & Demás Módulos) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total en Carta</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {stats.activos} activos para la venta
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
            <Utensils className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Fabricación</p>
            <p className="text-xl font-black text-indigo-700 mt-1">{stats.fabricacion}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Con receta y escandallo propio</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Reventa Directa</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{stats.reventa}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Vinculados al stock de insumos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Margen Promedio</p>
            <p className="text-xl font-black text-amber-600 mt-1">{stats.avgMargin.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Rentabilidad calculada s/ venta</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda, Filtros y Selector de Vista */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código, categoría o ingrediente..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
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

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Tipo */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition ${selectedType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('FABRICACION')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${selectedType === 'FABRICACION'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ChefHat className="w-3 h-3" />
              Fabricación
            </button>
            <button
              onClick={() => setSelectedType('REVENTA')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${selectedType === 'REVENTA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ShoppingBag className="w-3 h-3" />
              Reventa
            </button>
          </div>

          {/* Selector de Categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Pausados</option>
          </select>

          {/* Toggle de Cuadrícula / Tabla */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Vista en Cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Lista o Cuadrícula de Productos */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedType !== 'ALL' || selectedCategory !== 'ALL'
              ? 'Prueba modificando los filtros o el texto de búsqueda.'
              : 'Empieza creando el primer producto para tu carta gastronómica.'}
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNew}
          >
            Crear Producto
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA EN CUADRÍCULA (CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const isFabricacion = String(product.productType || '').toLowerCase().includes('fab');
            const linkedItem = product.linkedItemId ? items.find((i) => i.id === product.linkedItemId) : null;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group ${product.active ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20 opacity-80'
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
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isFabricacion ? <ChefHat className="w-12 h-12" /> : <ShoppingBag className="w-12 h-12" />}
                      </div>
                    )}

                    {/* Badges superiores */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {isFabricacion ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs">
                          <ChefHat className="w-3 h-3" />
                          Fabricación
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                          <ShoppingBag className="w-3 h-3" />
                          Reventa
                        </span>
                      )}
                    </div>

                    {/* Switch de Activo/Pausado */}
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => toggleSaleProductActive(product.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs transition ${product.active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          }`}
                        title={product.active ? 'Hacer clic para pausar venta' : 'Hacer clic para activar venta'}
                      >
                        {product.active ? 'Activo' : 'Pausado'}
                      </button>
                    </div>

                    {/* Badge de Categoría inferior en la imagen */}
                    <div className="absolute bottom-2 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs border border-slate-200 shadow-xs">
                        {product.category} {product.subcategory ? `› ${product.subcategory}` : ''}
                      </span>
                    </div>

                    {/* Botones de Recursos (PDF / Video) - Solo aplican para Fabricación */}
                    {isFabricacion && (
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
                    )}
                  </div>

                  {/* Cuerpo de la Card */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 tracking-wider">
                        {product.code}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    {/* Métricas de Precio, Costo y Margen */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Precio Venta:</span>
                        <span className="text-base font-black text-slate-900">
                          ${(Number(product.sellingPrice) || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Costo Calculado:</span>
                        <span className="text-xs font-bold text-slate-700">
                          ${(Number(product.costPrice) || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-medium">Margen Rentab.:</span>
                        {getMarginBadge(product.profitMargin || 0)}
                      </div>
                    </div>

                    {/* Resumen de Receta o Insumo Vinculado */}
                    <div className="text-[11px] text-slate-600">
                      {isFabricacion ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="flex items-center gap-1 font-medium">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{(product.recipe?.length || product.recipeComponents?.length || 0)} componentes</span>
                          </span>
                          <button
                            onClick={() => handleOpenDetail(product)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline"
                          >
                            Ver receta
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="truncate max-w-[150px] font-medium">
                            {linkedItem ? linkedItem.name : 'Insumo no asignado'}
                          </span>
                          {linkedItem && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Stock: {linkedItem.currentStock} {linkedItem.storageUnit}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de Acciones */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleOpenDetail(product)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
                    title="Ver Ficha Técnica Completa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(product.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Duplicar producto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Editar producto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(product)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 rounded-lg transition"
                      title="Eliminar producto"
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Costo</th>
                  <th className="p-3 text-right">Precio Venta</th>
                  <th className="p-3 text-center">Margen</th>
                  <th className="p-3">Receta / Insumo</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedProducts.map((product) => {
                  const isFabricacion = String(product.productType || '').toLowerCase().includes('fab');
                  const linkedItem = product.linkedItemId ? items.find((i) => i.id === product.linkedItemId) : null;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(product)}
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
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              {isFabricacion ? <ChefHat className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {product.subcategory || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {isFabricacion ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <ChefHat className="w-3 h-3" />
                            Fabricación
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShoppingBag className="w-3 h-3" />
                            Reventa
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 font-semibold">{product.category}</td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        ${(Number(product.costPrice) || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        ${(Number(product.sellingPrice) || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-center">
                        {getMarginBadge(product.profitMargin || 0)}
                      </td>
                      <td className="p-3">
                        {isFabricacion ? (
                          <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            {(product.recipe?.length || product.recipeComponents?.length || 0)} componentes
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[11px] text-slate-800 font-bold truncate max-w-[150px] block">
                              {linkedItem ? linkedItem.name : 'No asignado'}
                            </span>
                            {linkedItem && (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Stock: {linkedItem.currentStock} {linkedItem.storageUnit}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSaleProductActive(product.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${product.active
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
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
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

      {/* Controles de Paginación (8 registros por página) */}
      {filteredProducts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Mostrando{' '}
            <span className="font-bold text-slate-800">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            a{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-800">
              {filteredProducts.length}
            </span>{' '}
            productos {totalPages > 1 && `(Página ${currentPage} de ${totalPages})`}
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

      {/* 5. Modal de Ficha Técnica / Detalle del Producto */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          {(() => {
            const isDetailFabricacion = String(detailProduct.productType || '').toLowerCase().includes('fab');
            return (
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header del Modal Detalle */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      {isDetailFabricacion ? (
                        <ChefHat className="w-5 h-5" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-600">{detailProduct.code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                          {detailProduct.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isDetailFabricacion
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                          {isDetailFabricacion ? 'Fabricación' : 'Reventa'}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{detailProduct.name}</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPreviewDoc(false);
                      setDetailProduct(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contenido del Detalle */}
                <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
                  {/* Portada / Imagen de Presentación del Producto */}
                  {detailProduct.imageUrl && (
                    <div className="relative h-44 sm:h-52 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                      <img
                        src={detailProduct.imageUrl}
                        alt={detailProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                        <div className="text-white">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                            {detailProduct.category} {detailProduct.subcategory ? `› ${detailProduct.subcategory}` : ''}
                          </span>
                          <h3 className="text-lg font-black mt-1.5 text-white drop-shadow-sm">
                            {detailProduct.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resumen Financiero */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Costo Estimado</p>
                      <p className="text-base font-black text-slate-800 mt-0.5">
                        ${(Number(detailProduct.costPrice) || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Precio Venta</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        ${(Number(detailProduct.sellingPrice) || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Margen Ganancia</p>
                      <div className="mt-0.5">{getMarginBadge(detailProduct.profitMargin || 0)}</div>
                    </div>
                  </div>

                  {/* Recursos Adjuntos (PDF / Video) */}
                  {(detailProduct.recipeFileUrl || detailProduct.videoUrl) && (
                    <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          Recursos Multimedia & Documentación
                        </h4>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          Ficha Técnica & Video
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* 1. Documento / Ficha Técnica */}
                        {detailProduct.recipeFileUrl && (
                          <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">
                                    {detailProduct.recipeFileName || getFileNameFromUrl(detailProduct.recipeFileUrl)}
                                  </p>
                                  <span className="text-[10px] text-slate-400">Documento / Ficha Técnica en Supabase Storage</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(!previewDoc)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition ${
                                    previewDoc
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{previewDoc ? 'Ocultar visor' : 'Ver documento'}</span>
                                  {previewDoc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                <a
                                  href={detailProduct.recipeFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                                >
                                  <span>Abrir pestaña</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>

                            {/* Visor Embebido de Documento / Ficha Técnica */}
                            {previewDoc && (
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 shadow-inner mt-2 animate-fadeIn">
                                <div className="px-3 py-2 bg-slate-200/70 border-b border-slate-300 flex items-center justify-between text-xs text-slate-600">
                                  <span className="font-bold flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    Visualizador integrado de documento
                                  </span>
                                  <a
                                    href={detailProduct.recipeFileUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" /> Descargar archivo
                                  </a>
                                </div>
                                {detailProduct.recipeFileUrl.toLowerCase().includes('.png') ||
                                detailProduct.recipeFileUrl.toLowerCase().includes('.jpg') ||
                                detailProduct.recipeFileUrl.toLowerCase().includes('.jpeg') ||
                                detailProduct.recipeFileUrl.toLowerCase().includes('.webp') ? (
                                  <div className="p-3 flex items-center justify-center bg-white">
                                    <img
                                      src={detailProduct.recipeFileUrl}
                                      alt="Ficha técnica de receta"
                                      className="max-h-[460px] w-auto object-contain rounded-lg"
                                    />
                                  </div>
                                ) : (
                                  <iframe
                                    src={detailProduct.recipeFileUrl}
                                    title="Visor Ficha Técnica"
                                    className="w-full h-[460px] bg-white border-0"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Video Tutorial de Elaboración */}
                        {detailProduct.videoUrl && (
                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span className="flex items-center gap-1.5">
                                <Video className="w-4 h-4 text-rose-600" />
                                Video Tutorial de Elaboración & Preparación:
                              </span>
                              <a
                                href={detailProduct.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <span>Ver en pestaña externa</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Reproductor de Video Embebido */}
                            {getEmbedVideoUrl(detailProduct.videoUrl) ? (
                              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-800 bg-black">
                                <iframe
                                  src={getEmbedVideoUrl(detailProduct.videoUrl)!}
                                  title="Video Tutorial"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full border-0"
                                />
                              </div>
                            ) : isDirectVideoUrl(detailProduct.videoUrl) ? (
                              <div className="rounded-2xl overflow-hidden shadow-md border border-slate-800 bg-black">
                                <video
                                  src={detailProduct.videoUrl}
                                  controls
                                  preload="metadata"
                                  className="w-full max-h-80 object-contain bg-black mx-auto"
                                />
                              </div>
                            ) : (
                              <a
                                href={detailProduct.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 transition"
                              >
                                <Video className="w-4 h-4 text-rose-600" />
                                <span>Abrir video en plataforma externa</span>
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detalle de Escandallo (Si es Fabricación) */}
                  {isDetailFabricacion ? (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-indigo-600" />
                        Escandallo & Composición de la Receta
                      </h4>
                      {(() => {
                        const recipeList = detailProduct.recipe || detailProduct.recipeComponents || [];
                        if (recipeList.length === 0) {
                          return (
                            <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                              No hay componentes cargados para esta receta.
                            </p>
                          );
                        }
                        return (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">Tipo</th>
                                  <th className="p-2.5">Componente</th>
                                  <th className="p-2.5 text-right">Cantidad</th>
                                  <th className="p-2.5 text-right">Costo Unit.</th>
                                  <th className="p-2.5 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {recipeList.map((comp) => {
                                  const isCompInsumo = String(comp.componentType || '').toUpperCase().includes('INS');
                                  return (
                                    <tr key={comp.id || comp.componentId} className="hover:bg-slate-50/50">
                                      <td className="p-2.5">
                                        {isCompInsumo ? (
                                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                            Insumo
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                                            Producción
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 font-bold text-slate-800">{comp.componentName}</td>
                                      <td className="p-2.5 text-right font-mono text-slate-700">
                                        {comp.quantity} {comp.unit}
                                      </td>
                                      <td className="p-2.5 text-right font-mono text-slate-500">
                                        ${(Number(comp.unitCost) || 0).toLocaleString('es-AR')}
                                      </td>
                                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                        ${(Number(comp.subtotal) || 0).toLocaleString('es-AR')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                <tr>
                                  <td colSpan={4} className="p-2.5 text-right text-slate-500 uppercase text-[10px]">
                                    Costo Total de Receta:
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-900 text-sm">
                                    ${(Number(detailProduct.costPrice) || 0).toLocaleString('es-AR')}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Detalle de Reventa */
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        Insumo de Reventa Vinculado
                      </h4>
                      {detailProduct.linkedItemId ? (
                        (() => {
                          const item = items.find((i) => i.id === detailProduct.linkedItemId);
                          if (!item) return <p className="text-slate-500">Insumo ID: {detailProduct.linkedItemId} no encontrado.</p>;
                          return (
                            <div className="space-y-1.5">
                              <p className="text-sm font-bold text-slate-900">{item.name}</p>
                              <div className="flex gap-4 text-slate-600 text-xs">
                                <span>Código: <strong className="text-slate-800">{item.code}</strong></span>
                                <span>Stock Actual: <strong className="text-emerald-700">{item.currentStock} {item.storageUnit}</strong></span>
                                <span>Costo Compra: <strong className="text-slate-900">${item.currentPrice.toLocaleString('es-AR')}</strong></span>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-slate-500 italic">No tiene insumo vinculado asignado.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer de Acciones del Modal */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <Button
                    variant="primary"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const p = detailProduct;
                      setPreviewDoc(false);
                      setDetailProduct(null);
                      handleEdit(p);
                    }}
                  >
                    Editar Producto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewDoc(false);
                      setDetailProduct(null);
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. Modal de Confirmación de Eliminación usando ConfirmModal de UI */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="¿Eliminar este producto de venta?"
        message={`Se eliminará "${productToDelete?.name}" de la carta y todo su escandallo asociado. Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />

      {/* 7. Modal de Guía de Uso del Módulo */}
      {isHelpOpen && (
        <ModuleHelpModal
          module="sale_products"
          onClose={() => setIsHelpOpen(false)}
        />
      )}

      {/* 8. Modal Principal de Creación / Edición */}
      <SaleProductModal
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
