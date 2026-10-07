import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import { EmployeeModal } from './EmployeeModal';
import { StandardDataTable, Column } from './ui/DataTable';
import { DEFAULT_POSITIONS } from '../data/initialData';
import { SpecialHoursConfigModal } from './SpecialHoursConfigModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  DollarSign,
  UserCheck,
  UserX,
  Phone,
  MessageSquare,
  Building,
  Edit,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Percent,
} from 'lucide-react';

export const EmployeeMasterView: React.FC = () => {
  const { employees, toggleEmployeeStatus, providers, specialHoursPercentage } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSpecialHoursModalOpen, setIsSpecialHoursModalOpen] = useState(false);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDni = emp.dni.toLowerCase().includes(q);
      const matchName = emp.name.toLowerCase().includes(q);
      const matchPos = emp.position.toLowerCase().includes(q);
      const matchEmail = (emp.loginEmail || '').toLowerCase().includes(q);
      if (!matchDni && !matchName && !matchPos && !matchEmail) return false;
    }

    if (selectedPosition !== 'todos' && emp.position !== selectedPosition) {
      return false;
    }

    if (selectedStatus === 'activos' && !emp.active) return false;
    if (selectedStatus === 'inactivos' && emp.active) return false;

    return true;
  });

  // KPI calculations
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.active).length;
  const avgHourlyRate =
    activeCount > 0
      ? Math.round(
        employees.filter((e) => e.active).reduce((sum, e) => sum + (e.hourlyRate || 0), 0) / activeCount
      )
      : 0;
  const partnerCount = employees.filter((e) => e.isPartner).length;

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  // Columns for DataTable
  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Empleado / Legajo',
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
            {emp.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <span>{emp.name}</span>
              {emp.isPartner && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  SOCIO
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">DNI: {emp.dni} • {emp.address}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Puesto & Perfil',
      sortable: true,
      render: (emp) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{emp.position}</span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">{emp.profile}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contacto',
      render: (emp) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-700">{emp.phone}</span>
          {emp.phone && (
            <div className="flex items-center gap-1">
              <a
                href={`tel:${emp.phone}`}
                className="p-1 text-slate-500 hover:text-slate-900"
                title="Llamar"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://wa.me/${emp.phone}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-emerald-600 hover:text-emerald-700"
                title="WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'hourlyRate',
      header: 'Valor Hora',
      sortable: true,
      align: 'right',
      render: (emp) => (
        <div className="text-right">
          <span className="font-mono font-black text-slate-900 text-xs">
            $ {emp.hourlyRate.toLocaleString('es-AR')}
          </span>
          <span className="block text-[10px] text-slate-400">/ hora trabajo</span>
        </div>
      ),
    },
    {
      key: 'enableClockIn',
      header: 'Marcación',
      align: 'center',
      render: (emp) => (
        <div className="flex justify-center">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${emp.enableClockIn
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
          >
            {emp.enableClockIn ? 'Habilitada' : 'Deshabilitada'}
          </span>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'center',
      render: (emp) => (
        <div className="flex justify-center">
          <button
            onClick={() => toggleEmployeeStatus(emp.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition ${emp.active
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            title="Haz clic para cambiar estado activo/inactivo"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${emp.active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
            <span>{emp.active ? 'Activo' : 'Inactivo'}</span>
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (emp) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleEdit(emp)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition shadow-xs"
            title="Editar Ficha de Empleado"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Ver Ficha</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-600" />
            <span>Recursos Humanos — Maestro de Empleados</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralización de legajos, puestos, datos de pago, valor hora y cronogramas laborales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSpecialHoursModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition border border-slate-700"
            title="Configurar el Porcentaje General de Hora Especial"
          >
            <Percent className="w-4 h-4 text-amber-400" />
            <span>Configurar Hora Especial (+{specialHoursPercentage}%)</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Total Empleados
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Plantilla registrada</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider block">
            Empleados Activos
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Disponibles para operar
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-xs text-rose-700 font-bold uppercase tracking-wider block">
            Promedio Valor Hora
          </span>
          <div className="text-2xl font-black text-rose-900 font-mono mt-1">
            $ {avgHourlyRate.toLocaleString('es-AR')}
          </div>
          <span className="text-[11px] text-rose-700 font-semibold mt-1 block">Tarifa promedio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block">
            Socios de la Empresa
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{partnerCount}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Socios activos</span>
        </div>
      </div>

      {/* Main Employee Table */}
      <StandardDataTable
        title="Plantilla de Empleados"
        subtitle="Consulte legajos, puestos, estado y valores de hora."
        data={filteredEmployees}
        columns={columns}
        keyExtractor={(emp) => emp.id}
        searchPlaceholder="Buscar por DNI, nombre, puesto..."
        searchFilterKey={(emp) => `${emp.dni} ${emp.name} ${emp.position} ${emp.loginEmail || ''}`}
        headerActions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Position Filter */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="todos">Todos los puestos</option>
              {DEFAULT_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            {/* Active Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Sólo Activos</option>
              <option value="inactivos">Sólo Inactivos</option>
            </select>
          </div>
        }
      />

      {/* Modal Empleado */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          employeeToEdit={editingEmployee}
          onClose={() => setIsEmployeeModalOpen(false)}
        />
      )}

      {/* Modal Configuración Hora Especial */}
      {isSpecialHoursModalOpen && (
        <SpecialHoursConfigModal
          onClose={() => setIsSpecialHoursModalOpen(false)}
        />
      )}
    </div>
  );
};
