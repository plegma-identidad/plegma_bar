import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Bell,
  AlertTriangle,
  LogOut,
  Store,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronDown,
  Layers,
  Users,
  Clock,
  CreditCard,
  FileText,
  Calendar,
  Building,
  Settings,
  ArrowRightLeft,
  ShoppingBag,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

interface MobileHomeViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenSettings: () => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  onNavigateTab,
  onOpenSettings,
}) => {
  const { branding, orders, employees, showToast } = useApp();
  const [showAmount, setShowAmount] = useState(true);

  const strokeWidth = branding?.menuIconStrokeWidth ?? 2;
  const companyName = branding?.companyName || 'PLEGMA Gastro';

  // Recent orders list (first 5)
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="pb-24 pt-3 px-4 max-w-lg mx-auto space-y-5 text-slate-900 font-sans md:hidden">
      {/* 1. Header Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" strokeWidth={strokeWidth} />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">
              {companyName}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium -mt-0.5">
              Abastecimiento & Gastronomía
            </p>
          </div>
        </div>

        {/* Top Right Action Badges */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast('Buscador rápido de la app.', 'info')}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => showToast('Tienes 3 notificaciones del turno.', 'info')}
            className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Tienes 2 alertas de insumos en stock crítico.', 'warning')}
            className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white">
              2
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => showToast('Sesión cerrada exitosamente. Redirigiendo...', 'info')}
            className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition shadow-xs"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. User Greeting Banner */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <span>Hola, Franco</span>
          <span className="text-lg">👋</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Turno <strong className="text-slate-800">Almuerzo</strong> • Lunes 03/08 • <strong className="text-slate-800">Caja Principal</strong>
        </p>
      </div>

      {/* 3. Top Quick Action Grid Pills */}
      <div className="grid grid-cols-5 gap-2 text-center">
        <button
          type="button"
          onClick={() => onNavigateTab('gastos')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 hover:border-amber-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold text-slate-800">Gastos</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('maestros-cuentas')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 hover:border-rose-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold text-slate-800">Cajas</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('maestros-clientes')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 hover:border-rose-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold text-slate-800">Clientes</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('inbox')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 hover:border-rose-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Monitor pedidos</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('kanban')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5 hover:border-rose-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-extrabold text-slate-800">Reservas</span>
        </button>
      </div>

      {/* 4. Featured Dark Cash Card */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4 border border-slate-800">
        {/* Card Top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span>Caja Principal</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/60 text-[10px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Caja abierta desde 09:02 hs</span>
          </div>
        </div>

        {/* Amount Highlight */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight font-mono">
                {showAmount ? '$ 458.350' : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowAmount(!showAmount)}
                className="text-slate-400 hover:text-white transition"
              >
                {showAmount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Facturación del turno</p>
          </div>
        </div>

        {/* 3 Metric Mini Circles */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="flex flex-col items-center">
            <span className="text-base font-black text-white">35</span>
            <span className="text-[9px] text-slate-400 leading-tight">Mesas atendidas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-black text-white">$ 13.090</span>
            <span className="text-[9px] text-slate-400 leading-tight">Ticket promedio</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-black text-white">4</span>
            <span className="text-[9px] text-slate-400 leading-tight">Pedidos abiertos</span>
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => onNavigateTab('maestros-cuentas')}
            className="py-2 px-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 flex items-center justify-center gap-1 transition"
          >
            <span>🗃️</span>
            <span className="truncate">Detalle cajas</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Transferencias operativas entre cajas.', 'info')}
            className="py-2 px-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 flex items-center justify-center gap-1 transition"
          >
            <span>⇆</span>
            <span className="truncate">Movimientos</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="py-2 px-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 flex items-center justify-center gap-1 transition"
          >
            <span>⚙️</span>
            <span className="truncate">Configuración</span>
          </button>
        </div>
      </div>

      {/* 5. Sección Recursos Humanos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Recursos Humanos</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-empleados')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
          >
            <span>Ver todo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scrollable Sub-modules */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-empleados')}
            className="shrink-0 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-center space-y-1.5 w-24 hover:bg-rose-100/80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 block">Empleados</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-marcacion')}
            className="shrink-0 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-center space-y-1.5 w-24 hover:bg-rose-100/80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 block">Marcación</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-adelantos')}
            className="shrink-0 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-center space-y-1.5 w-28 hover:bg-rose-100/80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">Adelantos / Consumos</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-liquidaciones')}
            className="shrink-0 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-center space-y-1.5 w-24 hover:bg-rose-100/80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 block">Liquidaciones</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('rrhh-empleados')}
            className="shrink-0 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 text-center space-y-1.5 w-24 hover:bg-rose-100/80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900 block">Francos</span>
          </button>
        </div>
      </div>

      {/* 6. Sección Pedidos Recientes */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Pedidos recientes</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('inbox')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
          >
            <span>Ver más</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of 5 Sample Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 text-xs">
          {recentOrders.map((ord, idx) => (
            <div
              key={ord.id}
              onClick={() => onNavigateTab('inbox')}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                  #{1258 - idx}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Pedido #{1258 - idx}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {ord.providerName} • {ord.deliveryDay}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="font-black text-rose-600 block text-xs">
                    $ {ord.estimatedTotal.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">15:45 hs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
