import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Kanban,
  Package,
  FileText,
  TrendingUp,
  Clock,
  ShieldCheck,
  RotateCcw,
  Store,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  ShoppingBag,
  BarChart3,
  Users,
  Building2,
  Building,
  CreditCard,
  Palette,
  Receipt,
  Utensils,
  Calendar,
  ChefHat,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  maestrosSubTab?: string | null;
  rrhhSubTab?: string | null;
}

export interface NavSubItem {
  id: string;
  label: string;
  description: string;
  icon: any;
}

export interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: NavSubItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'gestion_operativa',
    label: 'Gestión Operativa',
    icon: SlidersHorizontal,
    items: [
      { id: 'kanban', label: 'Tablero Semanal', description: 'Kanban semanal de proveedores & conteos', icon: Kanban },
      { id: 'items', label: 'Maestro Insumos & Stock', description: 'Catálogo de insumos, límites & precios', icon: Package },
      { id: 'producciones', label: 'Producciones', description: 'Preparaciones internas, recetas de insumos & costos', icon: ChefHat },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: Utensils,
    items: [
      { id: 'ventas_carta', label: 'Prod. de Venta (Carta)', description: 'Recetas, productos de fabricación & reventa', icon: ChefHat },
      { id: 'ventas_pedidos', label: 'Ventas — Comandas v2.0', description: 'Toma POS táctil, comandas a cocina & cobro dividido', icon: Utensils },
      { id: 'ventas_caja', label: 'Ventas — Control de Caja', description: 'Apertura, cierres de turno, retiros & conciliación', icon: CreditCard },
      { id: 'ventas_cc', label: 'Ventas — Cuenta Corriente', description: 'Cuentas corrientes de clientes, consumos & recibos', icon: Receipt },
      { id: 'ventas_reservas', label: 'Ventas — Reservas de Mesas', description: 'Gestión de comensales, mesas & reservas', icon: Calendar },
      { id: 'sales_config', label: 'Ventas — Configuración Comercial', description: 'Mesas físicas, capacidad, tipos de venta & sectores', icon: SlidersHorizontal },
    ],
  },
  {
    id: 'compras_comprobantes',
    label: 'Compras y Comprobantes',
    icon: ShoppingBag,
    items: [
      { id: 'inbox', label: 'Bandeja de Pedidos y Pagos', description: 'Órdenes, recepciones, comprobantes & pagos', icon: FileText },
    ],
  },
  {
    id: 'reportes_control',
    label: 'Reportes y Control',
    icon: BarChart3,
    items: [
      { id: 'dashboard', label: 'Dashboard Compras', description: 'KPIs de compras, variaciones & análisis', icon: TrendingUp },
      { id: 'audit', label: 'Auditoría & Trazabilidad', description: 'Log de actividades & eventos del sistema', icon: ShieldCheck },
    ],
  },
  {
    id: 'recursos_humanos',
    label: 'Recursos Humanos',
    icon: Users,
    items: [
      { id: 'rrhh-empleados', label: 'Empleados', description: 'Fichas, puestos, valor hora & cronogramas', icon: Users },
      { id: 'rrhh-marcacion', label: 'Marcación', description: 'Registro de reloj & control de asistencia', icon: Clock },
      { id: 'rrhh-adelantos', label: 'Adelantos / Consumos', description: 'Vales, adelantos & consumos de personal', icon: CreditCard },
      { id: 'rrhh-liquidaciones', label: 'Liquidaciones', description: 'Cálculo de haberes & horas trabajadas', icon: FileText },
    ],
  },
  {
    id: 'maestros',
    label: 'Maestros',
    icon: Layers,
    items: [
      { id: 'maestros-clientes', label: 'Clientes', description: 'Cuentas Corrientes & Ventas', icon: Users },
      { id: 'maestros-proveedores', label: 'Proveedores', description: 'Fichas Comerciales & Rubros', icon: Building2 },
      { id: 'maestros-usuarios', label: 'Usuarios y Roles', description: 'Gestión & Matriz de Permisos', icon: ShieldCheck },
      { id: 'maestros-depositos', label: 'Depósitos y Almacenes', description: 'Puntos de acopio & ubicaciones', icon: Building },
      { id: 'maestros-cuentas', label: 'Caja y Cuentas Bancarias', description: 'Cuentas operativas & saldos', icon: CreditCard },
      { id: 'maestros-branding', label: 'Configuración de Marca', description: 'Colores, logos & UI Sandbox', icon: Palette },
    ],
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSettings,
  maestrosSubTab,
  rrhhSubTab,
}) => {
  const { userRole, setUserRole, receptionHours, resetToDefaults, branding } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTopNavCollapsed, setIsTopNavCollapsed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [expandedSidebarSections, setExpandedSidebarSections] = useState<Record<string, boolean>>({
    gestion_operativa: true,
    ventas: true,
    compras_comprobantes: true,
    reportes_control: true,
    recursos_humanos: true,
    maestros: true,
  });

  const toggleSidebarSection = (sectionId: string) => {
    setExpandedSidebarSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(e.target.value as UserRole);
  };

  const isSidebar = branding?.navigationStyle === 'sidebar';
  const strokeWidth = branding?.menuIconStrokeWidth ?? 2;

  const menuContainerStyle: React.CSSProperties = {
    backgroundColor: branding?.menuBgHex || '#0f172a',
    color: branding?.menuTextHex || '#94a3b8',
    fontFamily: branding?.menuFontFamily ? `'${branding.menuFontFamily}', sans-serif` : 'inherit',
  };

  const getNavItemStyle = (isActive: boolean): React.CSSProperties => {
    if (isActive) {
      return {
        backgroundColor: branding?.menuActiveBgHex || '#f59e0b',
        color: branding?.menuActiveTextHex || '#0f172a',
        fontWeight: 'bold',
      };
    }
    return {
      color: branding?.menuTextHex || '#94a3b8',
    };
  };

  const getNavIconColor = (isActive: boolean): string | undefined => {
    if (isActive) {
      return branding?.menuActiveIconHex || branding?.menuActiveTextHex || undefined;
    }
    return branding?.menuIconHex || branding?.menuTextHex || undefined;
  };

  const getSubmenuIconColor = (isActive: boolean): string | undefined => {
    if (isActive) {
      return branding?.submenuActiveIconHex || branding?.menuActiveIconHex || branding?.menuActiveTextHex || undefined;
    }
    return branding?.submenuIconHex || branding?.menuIconHex || branding?.menuTextHex || undefined;
  };

  const effectiveTab =
    currentTab === 'maestros' && maestrosSubTab
      ? `maestros-${maestrosSubTab}`
      : currentTab === 'recursos_humanos' && rrhhSubTab
      ? `rrhh-${rrhhSubTab}`
      : currentTab;

  // Active section helper
  const currentSection = NAV_SECTIONS.find((sec) =>
    sec.items.some((item) => item.id === currentTab)
  ) || NAV_SECTIONS[0];

  // SIDEBAR NAVIGATION MODE
  if (isSidebar) {
    return (
      <aside
        style={menuContainerStyle}
        className={`w-full ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } border-b md:border-b-0 md:border-r border-slate-800 md:min-h-screen p-3 md:p-4 flex flex-col justify-between shrink-0 shadow-xl z-40 transition-all duration-300 ease-in-out`}
      >
        <div className="space-y-5">
          {/* Header del Sidebar */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80 transition-all duration-300">
              <div className="flex items-center gap-3 overflow-hidden">
                {branding?.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/20 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 shrink-0">
                    <Store className="w-5 h-5" strokeWidth={strokeWidth} />
                  </div>
                )}
                <div className="transition-opacity duration-300 whitespace-nowrap">
                  <h1 className="font-bold text-base tracking-tight leading-none" style={{ color: branding?.menuTextHex || '#ffffff' }}>
                    PLEGMA Gastro
                  </h1>
                  <p className="text-[11px] opacity-75 font-medium mt-1">
                    Abastecimiento & Stock
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 border border-slate-700/60 shrink-0"
                title="Colapsar menú lateral"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pb-3 border-b border-slate-800/80 transition-all duration-300">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/20 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 shrink-0">
                  <Store className="w-5 h-5" strokeWidth={strokeWidth} />
                </div>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 border border-slate-700/60 flex items-center justify-center shrink-0"
                title="Expandir menú lateral"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Grouped Navigation Sections - Cascading Accordion */}
          <nav className="space-y-3 pt-1">
            {NAV_SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              const isSectionActive =
                section.id === currentTab ||
                section.items.some((item) => item.id === effectiveTab || item.id === currentTab);
              const isExpanded = expandedSidebarSections[section.id];

              return (
                <div key={section.id} className="space-y-1">
                  {!isSidebarCollapsed ? (
                    <div>
                      {/* Cascading Section Header Button */}
                      <button
                        onClick={() => {
                          if (section.items.length === 1) {
                            setCurrentTab(section.items[0].id);
                          } else {
                            toggleSidebarSection(section.id);
                          }
                        }}
                        style={getNavItemStyle(isSectionActive)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                          isSectionActive
                            ? 'shadow-xs border border-white/20'
                            : 'hover:opacity-100 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SectionIcon className="w-4 h-4 shrink-0" style={{ color: getNavIconColor(isSectionActive) }} strokeWidth={strokeWidth} />
                          <span className="truncate">{section.label}</span>
                        </div>
                        {section.items.length > 1 && (
                          <ChevronDown
                            style={{ color: getNavIconColor(isSectionActive) }}
                            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>

                      {/* Cascading Submenu Options (Indented Branch) */}
                      {(isExpanded || section.items.length === 1) && (
                        <div
                          style={{ borderLeftColor: branding?.menuActiveBgHex || '#f59e0b' }}
                          className="ml-3.5 pl-2.5 border-l-2 space-y-1 mt-1.5 transition-all"
                        >
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = currentTab === item.id || effectiveTab === item.id;

                            return (
                              <button
                                key={item.id}
                                onClick={() => setCurrentTab(item.id)}
                                style={getNavItemStyle(isActive)}
                                title={item.label}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                  isActive
                                    ? 'shadow-md shadow-amber-500/20'
                                    : 'hover:opacity-100 hover:bg-white/10'
                                }`}
                              >
                                <ItemIcon className="w-4 h-4 shrink-0" style={{ color: getSubmenuIconColor(isActive) }} strokeWidth={strokeWidth} />
                                <span className="whitespace-nowrap truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Collapsed Sidebar Flyout */
                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setCurrentTab(item.id)}
                            style={getNavItemStyle(isActive)}
                            title={`${section.label} > ${item.label}`}
                            className={`w-full flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                              isActive ? 'shadow-md shadow-amber-500/20' : 'hover:opacity-100 hover:bg-white/10'
                            }`}
                          >
                            <ItemIcon className="w-4.5 h-4.5 shrink-0" />
                          </button>
                        );
                      })}
                      <div className="w-full border-t border-slate-800/80 my-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80 mt-6">

          {/* Role Selector */}
          <div
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } bg-slate-800/60 rounded-xl border border-slate-700/60 transition-all duration-200`}
          >
            {!isSidebarCollapsed && (
              <span className="text-xs font-medium" style={{ color: branding?.menuTextHex || '#94a3b8' }}>
                Rol:
              </span>
            )}
            <select
              value={userRole}
              onChange={handleRoleChange}
              className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer text-center"
            >
              <option value="admin" className="bg-slate-800 text-white">
                {isSidebarCollapsed ? '👑' : '👑 Admin'}
              </option>
              <option value="compras" className="bg-slate-800 text-white">
                {isSidebarCollapsed ? '🛒' : '🛒 Compras'}
              </option>
              <option value="recepcion" className="bg-slate-800 text-white">
                {isSidebarCollapsed ? '📦' : '📦 Recepción'}
              </option>
              <option value="caja" className="bg-slate-800 text-white">
                {isSidebarCollapsed ? '💵' : '💵 Caja'}
              </option>
            </select>
          </div>

          {/* Reset System Button */}
          <button
            onClick={() => {
              if (window.confirm('¿Reiniciar todos los datos a la configuración inicial del sistema?')) {
                resetToDefaults();
              }
            }}
            className={`w-full flex items-center justify-center gap-2 ${
              isSidebarCollapsed ? 'p-2.5' : 'py-2 px-3'
            } rounded-xl bg-slate-800/40 text-xs opacity-75 hover:opacity-100 hover:bg-slate-800 transition-all duration-200 border border-slate-800`}
            style={{ color: branding?.menuTextHex || '#94a3b8' }}
            title="Restablecer datos de prueba"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Resetear Datos</span>}
          </button>
        </div>
      </aside>
    );
  }

  // TOPBAR NAVIGATION MODE WITH GROUPED SECTIONS & DROPDOWNS
  return (
    <header
      style={menuContainerStyle}
      className="hidden md:block border-b border-slate-800 sticky top-0 z-40 shadow-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand Left */}
          <div className="flex items-center gap-3 shrink-0">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/20 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 shrink-0">
                <Store className="w-5 h-5" strokeWidth={strokeWidth} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight leading-none" style={{ color: branding?.menuTextHex || '#ffffff' }}>
                  PLEGMA Gastro
                </h1>
              </div>
              <p className="text-xs opacity-75 font-medium">
                Abastecimiento, Compras & Stock
              </p>
            </div>
          </div>

          {/* Top Main Section Tabs (Desktop view) */}
          <div className="hidden md:flex items-center gap-1.5 relative">
            {NAV_SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              const isSectionActive =
                section.id === currentTab ||
                section.items.some((item) => item.id === effectiveTab || item.id === currentTab);
              const isDropdownOpen = activeDropdown === section.id;

              return (
                <div key={section.id} className="relative">
                  <button
                    onClick={() => {
                      if (section.items.length === 1) {
                        setCurrentTab(section.items[0].id);
                        setActiveDropdown(null);
                      } else {
                        setActiveDropdown(isDropdownOpen ? null : section.id);
                      }
                    }}
                    onMouseEnter={() => {
                      if (section.items.length > 1) setActiveDropdown(section.id);
                    }}
                    style={getNavItemStyle(isSectionActive)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isSectionActive
                        ? 'shadow-md shadow-black/10'
                        : 'hover:opacity-80'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4 shrink-0" style={{ color: getNavIconColor(isSectionActive) }} strokeWidth={strokeWidth} />
                    <span>{section.label}</span>
                    {section.items.length > 1 && (
                      <ChevronDown
                        style={{ color: getNavIconColor(isSectionActive) }}
                        className={`w-3.5 h-3.5 transition-transform ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu for Sections with multiple items */}
                  {section.items.length > 1 && isDropdownOpen && (
                    <div
                      onMouseLeave={() => setActiveDropdown(null)}
                      className="absolute left-0 mt-1 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn space-y-1"
                    >
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isSubActive = currentTab === item.id || effectiveTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id);
                              setActiveDropdown(null);
                            }}
                            style={getNavItemStyle(isSubActive)}
                            className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ${
                              isSubActive
                                ? 'shadow-xs border border-white/10'
                                : 'hover:opacity-80'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: getSubmenuIconColor(isSubActive) }} strokeWidth={strokeWidth} />
                            <div>
                              <div className="font-bold text-xs">{item.label}</div>
                              <div className="text-[10px] opacity-80 leading-tight">
                                {item.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Toggle Chevron / Hamburger for Mobile */}
          <div className="flex md:hidden items-center justify-center">
            <button
              onClick={() => setIsTopNavCollapsed(!isTopNavCollapsed)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-white transition border border-slate-700/60 shadow-md shrink-0"
              title={isTopNavCollapsed ? "Desplegar menú de módulos" : "Ocultar menú"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  !isTopNavCollapsed ? 'rotate-180 text-amber-300' : ''
                }`}
              />
            </button>
          </div>

          {/* Actions Right (Rol, Reset) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Role Selector with max-w truncation */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 max-w-[110px] sm:max-w-none">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Rol:
              </span>
              <select
                value={userRole}
                onChange={handleRoleChange}
                className="bg-transparent text-[11px] sm:text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer truncate w-full"
              >
                <option value="admin" className="bg-slate-800 text-white">
                  👑 Admin
                </option>
                <option value="compras" className="bg-slate-800 text-white">
                  🛒 Compras
                </option>
                <option value="recepcion" className="bg-slate-800 text-white">
                  📦 Recepción
                </option>
                <option value="caja" className="bg-slate-800 text-white">
                  💵 Caja / Pagos
                </option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos a la configuración inicial del sistema?')) {
                  resetToDefaults();
                }
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Restablecer datos de prueba"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* OFF-CANVAS MOBILE DRAWER / OVERLAY PANEL */}
      {!isTopNavCollapsed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-3 sm:p-6 md:hidden animate-fadeIn">
          <div
            style={{ backgroundColor: branding?.menuBgHex || '#0f172a' }}
            className="w-full max-h-[85vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm tracking-tight">Menú de Módulos & Gestión</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTopNavCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs no-scrollbar">
              {NAV_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const isSectionActive = section.items.some((item) => item.id === currentTab);

                return (
                  <div
                    key={section.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSectionActive
                        ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20'
                        : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
                      <SectionIcon className="w-4 h-4 text-amber-400" />
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                        {section.label}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isSubActive = currentTab === item.id || effectiveTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id);
                              setIsTopNavCollapsed(true);
                            }}
                            style={getNavItemStyle(isSubActive)}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-bold transition ${
                              isSubActive
                                ? 'shadow-xs'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4 shrink-0" style={{ color: getSubmenuIconColor(isSubActive) }} strokeWidth={strokeWidth} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
