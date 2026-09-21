import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  MapPin,
  ShoppingBag,
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Building2,
  Users,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { StandardDataTable } from './ui/DataTable';
import { ModuleHelpModal } from './ui/ModuleHelpModal';
import { useApp } from '../context/AppContext';
import { RestaurantTableConfig, SaleTypeConfig, SiteConfig } from '../types';
import { TableModal } from './salesConfig/TableModal';
import { SaleTypeModal } from './salesConfig/SaleTypeModal';
import { SiteModal } from './salesConfig/SiteModal';
import { ConfigDetailModal } from './salesConfig/ConfigDetailModal';

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
      active
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-rose-100 text-rose-800 border-rose-300'
    }`}
  >
    {active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
    {active ? 'Habilitado' : 'Inactivo'}
  </span>
);

export function SalesConfigView() {
  const {
    siteConfigs,
    tableConfigs,
    saleTypeConfigs,
    addSiteConfig,
    updateSiteConfig,
    toggleSiteStatus,
    deleteSiteConfig,
    addTableConfig,
    updateTableConfig,
    toggleTableStatus,
    toggleTableFree,
    deleteTableConfig,
    addSaleTypeConfig,
    updateSaleTypeConfig,
    toggleSaleTypeStatus,
    deleteSaleTypeConfig,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'mesas' | 'tiposVenta' | 'sitios'>('mesas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTableConfig | null>(null);

  const [isSaleTypeModalOpen, setIsSaleTypeModalOpen] = useState(false);
  const [editingSaleType, setEditingSaleType] = useState<SaleTypeConfig | null>(null);

  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteConfig | null>(null);

  const [detailModalItem, setDetailModalItem] = useState<{
    item: RestaurantTableConfig | SaleTypeConfig | SiteConfig;
    type: 'table' | 'saleType' | 'site';
  } | null>(null);

  // Filtered Lists
  const filteredTables = useMemo(() => {
    return tableConfigs.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.number.toLowerCase().includes(q) ||
        t.siteName.toLowerCase().includes(q) ||
        (t.name || '').toLowerCase().includes(q)
      );
    });
  }, [tableConfigs, searchQuery]);

  const filteredSaleTypes = useMemo(() => {
    return saleTypeConfigs.filter((st) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.initialOrderStatus.toLowerCase().includes(q) ||
        st.finalOrderStatus.toLowerCase().includes(q)
      );
    });
  }, [saleTypeConfigs, searchQuery]);

  const filteredSites = useMemo(() => {
    return siteConfigs
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
      })
      .sort((a, b) => a.order - b.order); // [A-S02] Ordenamiento visual por 'order'
  }, [siteConfigs, searchQuery]);

  // Handlers for Tables
  const handleSaveTable = async (payload: any) => {
    let res;
    if (editingTable) {
      res = await updateTableConfig(payload as RestaurantTableConfig);
    } else {
      res = await addTableConfig(payload);
    }
    if (res && res.success) {
      showToast(res.message, 'success');
      setIsTableModalOpen(false);
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
    return res;
  };

  const handleDeleteTable = async (t: RestaurantTableConfig) => {
    if (!confirm(`¿Desea eliminar la mesa "${t.number}"?`)) return;
    const res = await deleteTableConfig(t.id);
    if (res && res.success) {
      showToast(res.message, 'warning');
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
  };

  // Handlers for Sale Types
  const handleSaveSaleType = async (payload: any) => {
    let res;
    if (editingSaleType) {
      res = await updateSaleTypeConfig(payload as SaleTypeConfig);
    } else {
      res = await addSaleTypeConfig(payload);
    }
    if (res && res.success) {
      showToast(res.message, 'success');
      setIsSaleTypeModalOpen(false);
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
    return res;
  };

  const handleDeleteSaleType = async (st: SaleTypeConfig) => {
    if (!confirm(`¿Desea eliminar el tipo de venta "${st.name}"?`)) return;
    const res = await deleteSaleTypeConfig(st.id);
    if (res && res.success) {
      showToast(res.message, 'warning');
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
  };

  // Handlers for Sites
  const handleSaveSite = async (payload: any) => {
    let res;
    if (editingSite) {
      res = await updateSiteConfig(payload as SiteConfig);
    } else {
      res = await addSiteConfig(payload);
    }
    if (res && res.success) {
      showToast(res.message, 'success');
      setIsSiteModalOpen(false);
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
    return res;
  };

  const handleDeleteSite = async (s: SiteConfig) => {
    if (!confirm(`¿Desea eliminar el sitio "${s.name}"?`)) return;
    const res = await deleteSiteConfig(s.id);
    if (res && res.success) {
      showToast(res.message, 'warning');
    } else if (res && !res.success) {
      showToast(res.message, 'error');
    }
  };

  // Columns for Tables
  const tableColumns = [
    {
      key: 'number',
      header: 'Número / Código',
      sortable: true,
      render: (t: RestaurantTableConfig) => (
        <div>
          <span className="font-extrabold text-slate-900 text-xs">{t.number}</span>
          {t.name && <p className="text-[10px] text-slate-400">{t.name}</p>}
        </div>
      ),
    },
    {
      key: 'siteName',
      header: 'Sitio / Sector',
      sortable: true,
      render: (t: RestaurantTableConfig) => (
        <span className="font-semibold text-slate-700 text-xs flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          {t.siteName}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacidad',
      sortable: true,
      align: 'center' as const,
      render: (t: RestaurantTableConfig) => (
        <span className="font-black text-slate-800 text-xs">{t.capacity} pax</span>
      ),
    },
    {
      key: 'isFree',
      header: 'Disponibilidad (Libre)',
      align: 'center' as const,
      render: (t: RestaurantTableConfig) => (
        <button
          type="button"
          onClick={async () => {
            const res = await toggleTableFree(t.id);
            if (res) showToast(res.message, 'info');
          }}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition ${
            t.isFree
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
          title="Haga clic para alternar estado Libre/Ocupada (A-M02)"
        >
          {t.isFree ? 'Libre (Sí)' : 'Ocupada (No)'}
        </button>
      ),
    },
    {
      key: 'active',
      header: 'Habilitación',
      align: 'center' as const,
      render: (t: RestaurantTableConfig) => <StatusBadge active={t.active} />,
    },
    {
      key: 'actions',
      header: 'Acciones (5)',
      align: 'center' as const,
      render: (t: RestaurantTableConfig) => (
        <div className="flex items-center justify-center gap-1">
          {/* Action 4: Eye - Ver Detalle */}
          <button
            type="button"
            onClick={() => setDetailModalItem({ item: t, type: 'table' })}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver detalle de mesa [4]"
          >
            <Eye className="w-4 h-4" />
          </button>
          {/* Action 3: Toggle Activo/Inactivo */}
          <button
            type="button"
            onClick={async () => {
              const res = await toggleTableStatus(t.id);
              if (res) showToast(res.message, 'info');
            }}
            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Activar / Desactivar mesa [3]"
          >
            {t.active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          </button>
          {/* Action 2: Edit */}
          <button
            type="button"
            onClick={() => {
              setEditingTable(t);
              setIsTableModalOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Editar mesa [2]"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* Delete (R-M04) */}
          <button
            type="button"
            onClick={() => handleDeleteTable(t)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Eliminar mesa (Protegido R-M04)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Columns for Sale Types
  const saleTypeColumns = [
    {
      key: 'name',
      header: 'Nombre del Canal',
      sortable: true,
      render: (st: SaleTypeConfig) => (
        <span className="font-extrabold text-slate-900 text-xs">{st.name}</span>
      ),
    },
    {
      key: 'isSalonSale',
      header: 'Venta Salón',
      align: 'center' as const,
      render: (st: SaleTypeConfig) => (
        <span className={`font-bold text-xs ${st.isSalonSale ? 'text-emerald-700' : 'text-slate-400'}`}>
          {st.isSalonSale ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'requiresTable',
      header: 'Requiere Mesa',
      align: 'center' as const,
      render: (st: SaleTypeConfig) => (
        <span className={`font-bold text-xs ${st.requiresTable ? 'text-amber-700' : 'text-slate-400'}`}>
          {st.requiresTable ? 'Sí (R-TV03)' : 'No'}
        </span>
      ),
    },
    {
      key: 'requiresClient',
      header: 'Requiere Cliente',
      align: 'center' as const,
      render: (st: SaleTypeConfig) => (
        <span className={`font-bold text-xs ${st.requiresClient ? 'text-indigo-700' : 'text-slate-400'}`}>
          {st.requiresClient ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'initialOrderStatus',
      header: 'Estado Inicial',
      render: (st: SaleTypeConfig) => <span className="font-medium text-slate-700 text-xs">{st.initialOrderStatus}</span>,
    },
    {
      key: 'finalOrderStatus',
      header: 'Estado Final',
      render: (st: SaleTypeConfig) => <span className="font-bold text-emerald-700 text-xs">{st.finalOrderStatus}</span>,
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'center' as const,
      render: (st: SaleTypeConfig) => <StatusBadge active={st.active} />,
    },
    {
      key: 'actions',
      header: 'Acciones (5)',
      align: 'center' as const,
      render: (st: SaleTypeConfig) => (
        <div className="flex items-center justify-center gap-1">
          {/* Action 4: Eye - Ver Detalle */}
          <button
            type="button"
            onClick={() => setDetailModalItem({ item: st, type: 'saleType' })}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver detalle del tipo de venta [4]"
          >
            <Eye className="w-4 h-4" />
          </button>
          {/* Action 3: Toggle Activo/Inactivo (A-TV01) */}
          <button
            type="button"
            onClick={async () => {
              const res = await toggleSaleTypeStatus(st.id);
              if (res) showToast(res.message, 'info');
            }}
            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Activar / Desactivar canal [3]"
          >
            {st.active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          </button>
          {/* Action 2: Edit */}
          <button
            type="button"
            onClick={() => {
              setEditingSaleType(st);
              setIsSaleTypeModalOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Editar tipo de venta [2]"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* Delete */}
          <button
            type="button"
            onClick={() => handleDeleteSaleType(st)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Eliminar tipo de venta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Columns for Sites
  const siteColumns = [
    {
      key: 'order',
      header: 'Orden',
      sortable: true,
      align: 'center' as const,
      render: (s: SiteConfig) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs">
          #{s.order}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nombre del Sitio / Sector',
      sortable: true,
      render: (s: SiteConfig) => (
        <div>
          <span className="font-extrabold text-slate-900 text-xs">{s.name}</span>
          {s.description && <p className="text-[10px] text-slate-400">{s.description}</p>}
        </div>
      ),
    },
    {
      key: 'tablesCount',
      header: 'Mesas Asociadas',
      align: 'center' as const,
      render: (s: SiteConfig) => {
        const count = tableConfigs.filter((t) => t.siteId === s.id).length;
        return <span className="font-bold text-indigo-700 text-xs">{count} mesas</span>;
      },
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'center' as const,
      render: (s: SiteConfig) => <StatusBadge active={s.active} />,
    },
    {
      key: 'actions',
      header: 'Acciones (5)',
      align: 'center' as const,
      render: (s: SiteConfig) => (
        <div className="flex items-center justify-center gap-1">
          {/* Action 4: Eye - Ver Detalle */}
          <button
            type="button"
            onClick={() => setDetailModalItem({ item: s, type: 'site' })}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Ver detalle del sitio [4]"
          >
            <Eye className="w-4 h-4" />
          </button>
          {/* Action 3: Toggle Activo/Inactivo */}
          <button
            type="button"
            onClick={async () => {
              const res = await toggleSiteStatus(s.id);
              if (res) showToast(res.message, 'info');
            }}
            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Activar / Desactivar sitio [3]"
          >
            {s.active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          </button>
          {/* Action 2: Edit */}
          <button
            type="button"
            onClick={() => {
              setEditingSite(s);
              setIsSiteModalOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Editar sitio [2]"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* Delete (Protected R-S02) */}
          <button
            type="button"
            onClick={() => handleDeleteSite(s)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Eliminar sitio (Protegido R-S02)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Operativa</span>
            <span>/</span>
            <span className="text-indigo-600 font-semibold">Ventas</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Configuración Comercial</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            Configuración de Mesas, Canales & Sitios
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de áreas físicas, mesas, capacidades y reglas operativas por canal
          </p>
        </div>

        {/* Create Action Button for Active Tab (Action 1) */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setIsHelpOpen(true)}
            className="hidden sm:flex"
          >
            Guía de Uso
          </Button>

          {activeTab === 'mesas' && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingTable(null);
                setIsTableModalOpen(true);
              }}
            >
              Crear Mesa [1]
            </Button>
          )}
          {activeTab === 'tiposVenta' && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingSaleType(null);
                setIsSaleTypeModalOpen(true);
              }}
            >
              Crear Tipo de Venta [1]
            </Button>
          )}
          {activeTab === 'sitios' && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingSite(null);
                setIsSiteModalOpen(true);
              }}
            >
              Crear Sitio / Sector [1]
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            <button
              onClick={() => setActiveTab('mesas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'mesas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Mesas Físicas ({tableConfigs.length})
            </button>

            <button
              onClick={() => setActiveTab('tiposVenta')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'tiposVenta'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              Tipos de Venta ({saleTypeConfigs.length})
            </button>

            <button
              onClick={() => setActiveTab('sitios')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'sitios'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Sitios / Sectores ({siteConfigs.length})
            </button>
          </div>

          {/* Search Box (Action 5) */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main DataTable per Tab */}
      {activeTab === 'mesas' && (
        <StandardDataTable
          data={filteredTables}
          columns={tableColumns}
          keyExtractor={(t) => t.id}
          title="Configuración de Mesas Físicas"
          subtitle="Registro de mesas, capacidades y disponibilidad operativa"
          emptyMessage="No hay mesas registradas."
          emptyIcon={<MapPin className="w-8 h-8 text-slate-300" />}
        />
      )}

      {activeTab === 'tiposVenta' && (
        <StandardDataTable
          data={filteredSaleTypes}
          columns={saleTypeColumns}
          keyExtractor={(st) => st.id}
          title="Configuración de Tipos de Venta"
          subtitle="Canales comercializadores y reglas de asignación"
          emptyMessage="No hay tipos de venta registrados."
          emptyIcon={<ShoppingBag className="w-8 h-8 text-slate-300" />}
        />
      )}

      {activeTab === 'sitios' && (
        <StandardDataTable
          data={filteredSites}
          columns={siteColumns}
          keyExtractor={(s) => s.id}
          title="Configuración de Sitios / Sectores"
          subtitle="Sectores físicos ordenados visualmente para plano de salón (A-S02)"
          emptyMessage="No hay sitios registrados."
          emptyIcon={<Layers className="w-8 h-8 text-slate-300" />}
        />
      )}

      {/* Active Modals */}
      {isTableModalOpen && (
        <TableModal
          tableToEdit={editingTable}
          sites={siteConfigs}
          onClose={() => setIsTableModalOpen(false)}
          onSave={handleSaveTable}
        />
      )}

      {isSaleTypeModalOpen && (
        <SaleTypeModal
          saleTypeToEdit={editingSaleType}
          onClose={() => setIsSaleTypeModalOpen(false)}
          onSave={handleSaveSaleType}
        />
      )}

      {isSiteModalOpen && (
        <SiteModal
          siteToEdit={editingSite}
          onClose={() => setIsSiteModalOpen(false)}
          onSave={handleSaveSite}
        />
      )}

      {detailModalItem && (
        <ConfigDetailModal
          item={detailModalItem.item}
          type={detailModalItem.type}
          onClose={() => setDetailModalItem(null)}
        />
      )}
      
      {isHelpOpen && (
        <ModuleHelpModal
          module="config"
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
