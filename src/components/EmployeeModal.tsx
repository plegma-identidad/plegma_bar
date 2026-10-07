import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee, HourlyRateLog, WorkScheduleItem, EmployeeDayOfWeek } from '../types';
import { DEFAULT_POSITIONS, DEFAULT_PROFILES } from '../data/initialData';
import {
  X,
  User,
  CreditCard,
  Clock,
  Calendar,
  History,
  Save,
  Phone,
  MessageSquare,
  Building2,
  Building,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface EmployeeModalProps {
  employeeToEdit?: Employee | null;
  onClose: () => void;
}

const ALL_DAYS: EmployeeDayOfWeek[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ employeeToEdit, onClose }) => {
  const { addOrUpdateEmployee, providers, employees, showToast, specialHoursPercentage } = useApp();

  const [activeTab, setActiveTab] = useState<
    'generales' | 'pago' | 'valor_hora' | 'cronograma' | 'historial'
  >('generales');

  // Form State - Datos Generales
  const [dni, setDni] = useState(employeeToEdit?.dni || '');
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [address, setAddress] = useState(employeeToEdit?.address || '');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [birthDate, setBirthDate] = useState(employeeToEdit?.birthDate || '');
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | 'Otro'>(
    employeeToEdit?.gender || 'Femenino'
  );
  const [position, setPosition] = useState(employeeToEdit?.position || DEFAULT_POSITIONS[0]);
  const [profile, setProfile] = useState(employeeToEdit?.profile || DEFAULT_PROFILES[0]);
  const [loginEmail, setLoginEmail] = useState(employeeToEdit?.loginEmail || '');
  const [isSharedEmail, setIsSharedEmail] = useState(employeeToEdit?.isSharedEmail || false);
  const [enableClockIn, setEnableClockIn] = useState(
    employeeToEdit?.enableClockIn !== undefined ? employeeToEdit.enableClockIn : true
  );
  const [hourlyRate, setHourlyRate] = useState<number>(employeeToEdit?.hourlyRate || 5800);
  const [isPartner, setIsPartner] = useState(employeeToEdit?.isPartner || false);
  const [relatedProviderId, setRelatedProviderId] = useState(employeeToEdit?.relatedProviderId || '');
  const [active, setActive] = useState(employeeToEdit?.active !== undefined ? employeeToEdit.active : true);

  // Form State - Datos de Pago
  const [bankCompany, setBankCompany] = useState<
    'Mercado Pago' | 'Naranja X' | 'Banco' | 'Ualá' | 'Otra'
  >(employeeToEdit?.bankCompany || 'Mercado Pago');
  const [accountType, setAccountType] = useState<'Caja de Ahorro' | 'Cuenta Corriente' | 'CVU'>(
    employeeToEdit?.accountType || 'CVU'
  );
  const [cbuCvu, setCbuCvu] = useState(employeeToEdit?.cbuCvu || '');
  const [alias, setAlias] = useState(employeeToEdit?.alias || '');

  // Form State - Valor Hora Adjustment
  const [rateAdjustment, setRateAdjustment] = useState<number>(employeeToEdit?.hourlyRate || 5800);
  const [rateChangeNotes, setRateChangeNotes] = useState<string>('');

  // Form State - Cronograma Laboral (Multiturno & Hora Especial)
  const [schedule, setSchedule] = useState<WorkScheduleItem[]>(() => {
    if (employeeToEdit?.schedule && employeeToEdit.schedule.length > 0) {
      return employeeToEdit.schedule;
    }
    return ALL_DAYS.map((day, idx) => ({
      id: `sch-${day}-${idx}-${Date.now()}`,
      employeeId: employeeToEdit?.id || '',
      day,
      shiftName: 'Turno 1',
      startTime: day === 'Sábado' ? '09:00' : '08:00',
      endTime: day === 'Sábado' ? '13:00' : '16:00',
      isSpecialHours: day === 'Viernes' || day === 'Sábado',
      active: day !== 'Domingo',
    }));
  });

  // History logs
  const [logs, setLogs] = useState<HourlyRateLog[]>(employeeToEdit?.hourlyRateLogs || []);

  const calculatePct = (oldVal: number, newVal: number) => {
    if (oldVal <= 0) return 0;
    const pct = ((newVal - oldVal) / oldVal) * 100;
    return Number(pct.toFixed(2));
  };

  const handleUpdateShift = (id: string, key: keyof WorkScheduleItem, value: any) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const handleAddShift = (day: EmployeeDayOfWeek) => {
    const existingForDay = schedule.filter((s) => s.day === day);
    const shiftNumber = existingForDay.length + 1;
    const newShift: WorkScheduleItem = {
      id: `sch-${day}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: employeeToEdit?.id || '',
      day,
      shiftName: `Turno ${shiftNumber}`,
      startTime: shiftNumber === 2 ? '16:00' : '08:00',
      endTime: shiftNumber === 2 ? '20:00' : '16:00',
      isSpecialHours: false,
      active: true,
    };
    setSchedule((prev) => [...prev, newShift]);
  };

  const handleRemoveShift = (id: string) => {
    setSchedule((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dni.trim()) {
      alert('El DNI es obligatorio.');
      return;
    }
    if (!name.trim()) {
      alert('El Nombre completo es obligatorio.');
      return;
    }
    if (!position) {
      alert('El Puesto es obligatorio.');
      return;
    }

    // Check DNI uniqueness
    const duplicate = employees.find((emp) => emp.dni === dni.trim() && emp.id !== employeeToEdit?.id);
    if (duplicate) {
      alert(`Ya existe un empleado registrado con el DNI ${dni}.`);
      return;
    }

    // Generate Hourly Rate Log if rate changed
    let updatedLogs = [...logs];
    const initialRate = employeeToEdit?.hourlyRate || 0;
    const finalRate = rateAdjustment;

    if (employeeToEdit && finalRate !== initialRate && initialRate > 0) {
      const pct = calculatePct(initialRate, finalRate);
      const newLog: HourlyRateLog = {
        id: 'log-' + Date.now(),
        employeeId: employeeToEdit.id,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        oldPrice: initialRate,
        newPrice: finalRate,
        percentageIncrease: pct,
        modifiedBy: 'ADMINISTRADOR',
        notes: rateChangeNotes || 'Ajuste de tarifa hora',
      };
      updatedLogs = [newLog, ...updatedLogs];
    }

    const empObj: Employee = {
      id: employeeToEdit?.id || 'emp-' + Date.now(),
      dni: dni.trim(),
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      birthDate,
      gender,
      position,
      profile,
      loginEmail: loginEmail.trim(),
      isSharedEmail,
      enableClockIn,
      hourlyRate: finalRate,
      isPartner,
      relatedProviderId,
      active,
      bankCompany,
      accountType,
      cbuCvu: cbuCvu.trim(),
      alias: alias.trim(),
      hourlyRateLogs: updatedLogs,
      schedule,
    };

    await addOrUpdateEmployee(empObj);
    showToast(employeeToEdit ? 'Empleado actualizado correctamente.' : 'Nuevo empleado creado exitosamente.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {employeeToEdit ? `Ficha de Empleado: ${employeeToEdit.name}` : 'Alta de Nuevo Empleado'}
              </h3>
              <p className="text-xs text-slate-400">
                Gestión integral de legajo, datos personales, pago, valor hora y cronograma.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Footer Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Body Container with Sidebar and Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Vertical Navigation Tabs Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-4 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('generales')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition text-left ${
                activeTab === 'generales'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Datos Generales</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pago')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition text-left ${
                activeTab === 'pago'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Datos de Pago</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('valor_hora')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition text-left ${
                activeTab === 'valor_hora'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Valor Hora</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cronograma')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition text-left ${
                activeTab === 'cronograma'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Cronograma</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition text-left ${
                activeTab === 'historial'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Historial Precio Hora</span>
            </button>
          </div>

          {/* Main Content Area per Tab */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-6 bg-white">
            {/* PESTAÑA 1: DATOS GENERALES */}
            {activeTab === 'generales' && (
              <div className="space-y-6">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Datos Generales & Legajo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left Form Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        DNI <span className="text-rose-600">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        placeholder="Ej.: 42893400"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nombre y Apellido Completo <span className="text-rose-600">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej.: GIULIANA NIETO ASIS"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Dirección / Domicilio <span className="text-rose-600">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej.: Brig. Juan Manuel de Rosas 460, Córdoba"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Teléfono de Contacto <span className="text-rose-600">*</span>:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ej.: 3518061694"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-rose-500"
                        />
                        {phone && (
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`tel:${phone}`}
                              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                              title="Llamar"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Fecha de Nacimiento:</label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Sexo:</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold cursor-pointer"
                        >
                          <option value="Femenino">Femenino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Form Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Puesto <span className="text-rose-600">*</span>:
                      </label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold cursor-pointer"
                      >
                        {DEFAULT_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Perfil de Acceso <span className="text-rose-600">*</span>:
                      </label>
                      <select
                        value={profile}
                        onChange={(e) => setProfile(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold cursor-pointer uppercase"
                      >
                        {DEFAULT_PROFILES.map((prof) => (
                          <option key={prof} value={prof}>
                            {prof}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mail para Login:</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="usuariosidentidad@gmail.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                      />
                    </div>

                    {/* Toggles Group (Activa, Marcación, Socio) */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Empleado Activo:</span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                          className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="font-bold text-slate-800">Habilitar Marcación de Horas:</span>
                        <input
                          type="checkbox"
                          checked={enableClockIn}
                          onChange={(e) => setEnableClockIn(e.target.checked)}
                          className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="font-bold text-slate-800">Es Socio de la Empresa:</span>
                        <input
                          type="checkbox"
                          checked={isPartner}
                          onChange={(e) => setIsPartner(e.target.checked)}
                          className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proveedor Relacionado Sub-Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="font-bold text-slate-700 block mb-1">Proveedor Relacionado (Opcional):</label>
                  <select
                    value={relatedProviderId}
                    onChange={(e) => setRelatedProviderId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <option value="">Sin proveedor asociado</option>
                    {providers.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name} ({prov.rubro || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: DATOS DE PAGO */}
            {activeTab === 'pago' && (
              <div className="space-y-6">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Datos de Cuenta & Depósito de Haberes
                </h4>

                {/* Compañía de Cuenta (Badges/Logos selector) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-xs block">
                    Compañía de Cuenta / Entidad Financiera:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['Mercado Pago', 'Naranja X', 'Banco', 'Ualá', 'Otra'].map((compName) => (
                      <button
                        key={compName}
                        type="button"
                        onClick={() => setBankCompany(compName as any)}
                        className={`py-3 px-2 rounded-2xl border text-center transition flex items-center justify-center ${
                          bankCompany === compName
                            ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 font-extrabold text-rose-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs">{compName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tipo de Cuenta:</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="CVU">CVU (Virtual)</option>
                      <option value="Caja de Ahorro">Caja de Ahorro</option>
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número de CBU / CVU:</label>
                    <input
                      type="text"
                      value={cbuCvu}
                      onChange={(e) => setCbuCvu(e.target.value)}
                      placeholder="0000003100089123849102"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Alias de Cuenta:</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="GIULIANA.NIETO.MP"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: VALOR HORA */}
            {activeTab === 'valor_hora' && (
              <div className="space-y-6">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Configuración del Valor Hora & Ajuste Paritario
                </h4>

                <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Valor Hora Anterior:</span>
                      <strong className="text-base font-black text-slate-700 font-mono">
                        $ {(employeeToEdit?.hourlyRate || 0).toLocaleString('es-AR')}
                      </strong>
                    </div>

                    <div>
                      <label className="font-bold text-slate-900 block mb-1">Nuevo Valor Hora ($):</label>
                      <input
                        type="number"
                        min="0"
                        value={rateAdjustment}
                        onChange={(e) => setRateAdjustment(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-base font-black font-mono text-rose-900 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block">% Variación Calculada:</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-base font-black font-mono px-3 py-1 rounded-xl border ${
                            calculatePct(employeeToEdit?.hourlyRate || 0, rateAdjustment) > 0
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          +{calculatePct(employeeToEdit?.hourlyRate || 0, rateAdjustment)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Observación / Motivo del Cambio de Valor Hora:
                    </label>
                    <textarea
                      rows={2}
                      value={rateChangeNotes}
                      onChange={(e) => setRateChangeNotes(e.target.value)}
                      placeholder="Ej.: Aumento paritario sindicato gastronómicos Julio 2026."
                      className="w-full p-3 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: CRONOGRAMA LABORAL */}
            {activeTab === 'cronograma' && (() => {
              const baseRate = rateAdjustment || hourlyRate || 0;
              const pct = specialHoursPercentage || 50;
              const calculatedSpecialRate = Math.round(baseRate * (1 + pct / 100));

              return (
                <div className="space-y-5">
                  {/* Banner Informativo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Cronograma Laboral (Doble Turno & Hora Especial)</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Asigna uno o más turnos por día. Marca <span className="text-amber-300 font-bold">"Aplica Hora Especial"</span> para aplicar un incremento del <span className="font-extrabold text-amber-400">+{pct}%</span>.
                      </p>
                    </div>
                    <div className="bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700 text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Hora Especial Calculado</span>
                      <span className="font-mono font-black text-emerald-400 text-xs">
                        ${calculatedSpecialRate.toLocaleString('es-AR')} / hr
                      </span>
                    </div>
                  </div>

                  {/* Días y Turnos */}
                  <div className="space-y-4">
                    {ALL_DAYS.map((day) => {
                      const dayShifts = schedule.filter((s) => s.day === day);
                      return (
                        <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                          {/* Cabecera del Día */}
                          <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-xs uppercase tracking-wider">{day}</span>
                              {dayShifts.length > 1 && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
                                  {dayShifts.length} TURNOS (DOBLE TURNO)
                                </span>
                              )}
                              {dayShifts.length === 1 && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                                  1 Turno
                                </span>
                              )}
                              {dayShifts.length === 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Sin Turnos (Franco)
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddShift(day)}
                              className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] rounded-xl border border-rose-200 transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar Turno</span>
                            </button>
                          </div>

                          {/* Lista de Turnos para este día */}
                          {dayShifts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/30 italic">
                              No hay turnos configurados para el {day}. Presiona "+ Agregar Turno" para asignarle un horario.
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {dayShifts.map((shift, idx) => (
                                <div
                                  key={shift.id}
                                  className={`p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs transition ${
                                    shift.active ? 'bg-white' : 'bg-slate-50/70 opacity-60'
                                  }`}
                                >
                                  {/* Nombre de Turno */}
                                  <div className="w-36">
                                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Etiqueta Turno:</label>
                                    <input
                                      type="text"
                                      disabled={!shift.active}
                                      value={shift.shiftName || `Turno ${idx + 1}`}
                                      onChange={(e) => handleUpdateShift(shift.id, 'shiftName', e.target.value)}
                                      placeholder="Ej. Turno Mañana"
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                  </div>

                                  {/* Rango de Horas */}
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Hora Inicio:</label>
                                      <input
                                        type="time"
                                        disabled={!shift.active}
                                        value={shift.startTime}
                                        onChange={(e) => handleUpdateShift(shift.id, 'startTime', e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                                      />
                                    </div>
                                    <span className="self-end pb-2 font-bold text-slate-400">a</span>
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Hora Fin:</label>
                                      <input
                                        type="time"
                                        disabled={!shift.active}
                                        value={shift.endTime}
                                        onChange={(e) => handleUpdateShift(shift.id, 'endTime', e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                                      />
                                    </div>
                                  </div>

                                  {/* Checkbox Hora Especial */}
                                  <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 px-3 py-2 rounded-xl mt-3 sm:mt-0">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        disabled={!shift.active}
                                        checked={shift.isSpecialHours || false}
                                        onChange={(e) => handleUpdateShift(shift.id, 'isSpecialHours', e.target.checked)}
                                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                      />
                                      <span className="font-extrabold text-amber-950 text-xs">Aplica Hora Especial</span>
                                    </label>

                                    {shift.isSpecialHours && (
                                      <span className="px-2 py-0.5 rounded-md font-mono font-black text-[10px] bg-amber-200 text-amber-900 border border-amber-300">
                                        +{pct}% (${calculatedSpecialRate.toLocaleString('es-AR')})
                                      </span>
                                    )}
                                  </div>

                                  {/* Switch Habilitado / Eliminar */}
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={shift.active}
                                        onChange={(e) => handleUpdateShift(shift.id, 'active', e.target.checked)}
                                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                      />
                                      <span>Activo</span>
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveShift(shift.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Eliminar turno"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* PESTAÑA 5: HISTORIAL PRECIO HORA */}
            {activeTab === 'historial' && (
              <div className="space-y-6">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Log Histórico de Valor Hora
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-3">Fecha y Hora</th>
                          <th className="p-3 text-right">Valor Anterior</th>
                          <th className="p-3 text-right">Valor Nuevo</th>
                          <th className="p-3 text-center">% Aumento</th>
                          <th className="p-3">Usuario Modificación</th>
                          <th className="p-3">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              No existen registros históricos de variación de tarifa.
                            </td>
                          </tr>
                        ) : (
                          logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-slate-600">{log.timestamp}</td>
                              <td className="p-3 text-right font-mono text-slate-500">
                                $ {log.oldPrice.toLocaleString('es-AR')}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">
                                $ {log.newPrice.toLocaleString('es-AR')}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  +{log.percentageIncrease}%
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-700">{log.modifiedBy}</td>
                              <td className="p-3 text-slate-500">{log.notes || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 text-white w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Empleado</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
