import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Provider,
  Item,
  ProviderItemRelation,
  Order,
  StockCount,
  ReceptionHoursConfig,
  PriceHistoryEntry,
  ExpenseRecord,
  AuditLog,
  ProcessState,
  UserRole,
  DayOfWeek,
  UserPermissions,
  AppUser,
  BrandingConfig,
  Employee,
  HourlyRateLog,
  ClockRecord,
  EmployeeConsumption,
  EmployeeAdvance,
  Payrun,
  PayrunEmployeeDetail,
  PayrunDeduction,
  ToastType,
  ToastNotification,
  CashShift,
  CashLine,
  CashMovement,
  MasterCashBox,
  TurnoType,
  CashWithdrawalPayload,
  ReservationStatus,
  RestaurantTable,
  Reservation,
  ReservationLog,
  SiteConfig,
  RestaurantTableConfig,
  SaleTypeConfig,
  OrderStatus,
  SaleOrderItem,
  OrderBillingInfo,
  SaleOrder,
  ProductOptionGroup,
  ProductOption,
  ConfigOption,
  CurrentAccountMovement,
  Receipt,
  Client,
} from '../types';
import { configService } from '../services/configService';
import { providersService } from '../services/providersService';
import { itemsService } from '../services/itemsService';
import { clientsService } from '../services/clientsService';
import { posConfigService } from '../services/posConfigService';
import { employeesService } from '../services/employeesService';
import { usersService } from '../services/usersService';
import { saleOrdersService } from '../services/saleOrdersService';
import { cashService } from '../services/cashService';
import { currentAccountService } from '../services/currentAccountService';
import { auditLogsService } from '../services/auditLogsService';
import {
  INITIAL_PROVIDERS,
  INITIAL_ITEMS,
  INITIAL_PROVIDER_ITEMS,
  INITIAL_ORDERS,
  INITIAL_RECEPTION_HOURS,
  INITIAL_PRICE_HISTORY,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMPLOYEES,
  INITIAL_CLOCK_RECORDS,
  INITIAL_EMPLOYEE_ADVANCES,
  INITIAL_PAYRUNS,
  DEFAULT_POSITIONS,
  DEFAULT_PROFILES,
  INITIAL_ITEM_CATEGORIES,
  INITIAL_ITEM_SUBCATEGORIES,
  INITIAL_ITEM_UNITS,
  INITIAL_EMPLOYEE_CONSUMPTIONS,
} from '../data/initialData';
import {
  INITIAL_MASTER_CASH_BOXES,
  INITIAL_CASH_SHIFTS,
  INITIAL_CASH_LINES,
  INITIAL_CASH_MOVEMENTS,
} from '../data/cashData';
import {
  INITIAL_RESTAURANT_TABLES,
  INITIAL_RESERVATIONS,
} from '../data/reservationData';
import {
  INITIAL_SITE_CONFIGS,
  INITIAL_TABLE_CONFIGS,
  INITIAL_SALE_TYPE_CONFIGS,
} from '../data/salesConfigData';
import {
  INITIAL_SALE_ORDERS,
  SALE_PRODUCT_CATALOG,
  INITIAL_OPTION_GROUPS,
} from '../data/ordersData';
import {
  INITIAL_CC_CLIENTS,
  INITIAL_CC_MOVEMENTS,
  INITIAL_RECEIPTS,
} from '../data/currentAccountData';

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canInlineCreate: true,
    canApprovePayment: true,
    canManageUsers: true,
  },
  compras: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canInlineCreate: true,
    canApprovePayment: false,
    canManageUsers: false,
  },
  recepcion: {
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canInlineCreate: false,
    canApprovePayment: false,
    canManageUsers: false,
  },
  caja: {
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canInlineCreate: false,
    canApprovePayment: true,
    canManageUsers: false,
  },
};

interface AppContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  users: AppUser[];
  addUser: (user: AppUser) => void;
  updateUser: (user: AppUser) => void;
  deleteUser: (userId: string) => void;
  updateUserCustomPermissions: (userId: string, perms: Partial<UserPermissions>) => void;
  activeUserId: string;
  setActiveUserId: (id: string) => void;
  rolePermissions: Record<UserRole, UserPermissions>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  updateRolePermissions: (role: UserRole, newPerms: Partial<UserPermissions>) => void;
  providers: Provider[];
  addProvider: (provider: Provider) => void;
  updateProvider: (provider: Provider) => void;
  deleteProvider: (providerId: string) => void;
  clients: Client[];
  addOrUpdateClient: (client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  items: Item[];
  deleteItem: (itemId: string) => void;
  providerItems: ProviderItemRelation[];
  orders: Order[];
  stockCounts: StockCount[];
  receptionHours: ReceptionHoursConfig;
  priceHistory: PriceHistoryEntry[];
  expenses: ExpenseRecord[];
  auditLogs: AuditLog[];
  branding: BrandingConfig;
  updateBranding: (newConfig: Partial<BrandingConfig>) => void;
  itemCategories: ConfigOption[];
  itemSubcategories: ConfigOption[];
  itemUnits: ConfigOption[];
  setItemCategories: React.Dispatch<React.SetStateAction<ConfigOption[]>>;
  setItemSubcategories: React.Dispatch<React.SetStateAction<ConfigOption[]>>;
  setItemUnits: React.Dispatch<React.SetStateAction<ConfigOption[]>>;
  employees: Employee[];
  addOrUpdateEmployee: (emp: Employee) => void;
  toggleEmployeeStatus: (employeeId: string) => void;
  addHourlyRateLog: (employeeId: string, newRate: number, notes?: string) => void;
  clockRecords: ClockRecord[];
  clockIn: (dni: string) => { success: boolean; message: string; record?: ClockRecord };
  clockOut: (dni: string) => { success: boolean; message: string; record?: ClockRecord };
  correctClockRecord: (id: string, checkIn: string, checkOut: string, reason: string) => void;
  voidClockRecord: (id: string, reason: string) => void;
  employeeConsumptions: EmployeeConsumption[];
  addEmployeeConsumptionFromReceipt: (consumption: EmployeeConsumption) => void;
  employeeAdvances: EmployeeAdvance[];
  addOrUpdateAdvance: (adv: EmployeeAdvance) => void;
  voidAdvance: (advanceId: string) => void;
  payruns: Payrun[];
  createPayrun: (startDate: string, endDate: string, periodName?: string) => { success: boolean; message: string; payrun?: Payrun };
  markEmployeePaid: (payrunId: string, employeeId: string, paymentMethod: string, cashRegister: string) => void;
  unmarkEmployeePaid: (payrunId: string, employeeId: string) => void;
  voidPayrun: (payrunId: string) => void;

  // Cash Control
  cashShifts: CashShift[];
  cashLines: CashLine[];
  cashMovements: CashMovement[];
  masterCashBoxes: MasterCashBox[];
  openCashShift: (shift: TurnoType, initialLines?: { boxType: string; initialAmount: number }[], notes?: string) => Promise<{ success: boolean; message: string; shift?: CashShift }>;
  addCashLine: (shiftId: string, boxType: string, initialAmount: number) => Promise<{ success: boolean; message: string; line?: CashLine }>;
  recordCashMovement: (movement: Omit<CashMovement, 'id' | 'dateTime' | 'userId' | 'userName'>) => Promise<void>;
  withdrawCashToMaster: (payload: CashWithdrawalPayload) => Promise<{ success: boolean; message: string }>;
  transferCashBetweenLines: (payload: { sourceLineId: string; targetLineId: string; amount: number; notes?: string }) => Promise<{ success: boolean; message: string }>;
  closeCashLine: (lineId: string, realAmount: number, differenceNotes?: string) => Promise<{ success: boolean; message: string }>;
  closeCashShift: (shiftId: string) => Promise<{ success: boolean; message: string }>;
  reconcileCashShift: (shiftId: string) => Promise<{ success: boolean; message: string }>;
  voidCashShift: (shiftId: string, reason: string) => Promise<{ success: boolean; message: string }>;

  // Reservations Control
  restaurantTables: RestaurantTable[];
  reservations: Reservation[];
  addReservation: (data: Omit<Reservation, 'id' | 'createdAt' | 'createdByUserId' | 'createdByUserName' | 'status'>) => { success: boolean; message: string; reservation?: Reservation };
  updateReservation: (reservation: Reservation) => { success: boolean; message: string };
  cancelReservation: (reservationId: string, cancelReason: string) => { success: boolean; message: string };
  markReservationFulfilled: (reservationId: string, okNotes?: string) => { success: boolean; message: string };
  checkOverbooking: (tableId: string, dateTime: string, excludeReservationId?: string) => boolean;

  // Sales Configuration (Mesas, Tipos de Venta, Sitios)
  siteConfigs: SiteConfig[];
  tableConfigs: RestaurantTableConfig[];
  saleTypeConfigs: SaleTypeConfig[];
  addSiteConfig: (site: Omit<SiteConfig, 'id'>) => { success: boolean; message: string };
  updateSiteConfig: (site: SiteConfig) => { success: boolean; message: string };
  toggleSiteStatus: (siteId: string) => { success: boolean; message: string };
  deleteSiteConfig: (siteId: string) => { success: boolean; message: string };
  addTableConfig: (table: Omit<RestaurantTableConfig, 'id' | 'isFree'>) => { success: boolean; message: string };
  updateTableConfig: (table: RestaurantTableConfig) => { success: boolean; message: string };
  toggleTableStatus: (tableId: string) => { success: boolean; message: string };
  toggleTableFree: (tableId: string) => { success: boolean; message: string };
  deleteTableConfig: (tableId: string) => { success: boolean; message: string };
  addSaleTypeConfig: (st: Omit<SaleTypeConfig, 'id'>) => { success: boolean; message: string };
  updateSaleTypeConfig: (st: SaleTypeConfig) => { success: boolean; message: string };
  toggleSaleTypeStatus: (stId: string) => { success: boolean; message: string };
  deleteSaleTypeConfig: (stId: string) => { success: boolean; message: string };

  // Sale Orders (Pedidos y Ventas)
  saleOrders: SaleOrder[];
  createSaleOrder: (data: Omit<SaleOrder, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'createdByUserId' | 'createdByUserName' | 't1CreatedAt'>) => Promise<{ success: boolean; message: string; order?: SaleOrder }>;
  updateSaleOrder: (order: SaleOrder) => Promise<{ success: boolean; message: string }>;
  generateComandaPDF: (orderId: string) => Promise<{ success: boolean; message: string; pdfUrl?: string }>;
  updateSaleOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; message: string }>;
  processOrderBilling: (orderId: string, billing: Omit<OrderBillingInfo, 'billedAt' | 'ticketNumber'>) => Promise<{ success: boolean; message: string; ticketNumber?: string }>;
  cancelSaleOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; message: string }>;

  // Grupos de Opciones y Modificadores (Comandas v2.0)
  productOptionGroups: ProductOptionGroup[];
  addProductOptionGroup: (group: ProductOptionGroup) => { success: boolean; message: string };
  addOptionToGroup: (groupId: string, option: ProductOption) => { success: boolean; message: string };
  deleteOptionFromGroup: (groupId: string, optionId: string) => { success: boolean; message: string };
  toggleOptionGroupActive: (groupId: string) => { success: boolean; message: string };
  toggleGroupSelectionType: (groupId: string) => { success: boolean; message: string };

  // Cuentas Corrientes State
  ccMovements: CurrentAccountMovement[];
  setCcMovements: React.Dispatch<React.SetStateAction<CurrentAccountMovement[]>>;
  ccReceipts: Receipt[];
  setCcReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;

  toast: ToastNotification | null;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;

  // Actions
  getProviderState: (providerId: string) => ProcessState;
  getProviderActiveOrder: (providerId: string) => Order | undefined;
  getProviderActiveCount: (providerId: string) => StockCount | undefined;
  reorderProviderInDay: (providerId: string, day: DayOfWeek, direction: 'up' | 'down') => void;
  moveProviderToPosition: (
    draggedProviderId: string,
    sourceDay: DayOfWeek,
    targetDay: DayOfWeek,
    targetProviderId?: string
  ) => void;
  updateProviderDays: (providerId: string, orderDays: DayOfWeek[], deliveryDays: DayOfWeek[]) => void;
  
  // Stock Counts
  saveStockCount: (count: StockCount) => void;
  
  // Orders
  createOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: ProcessState) => void;
  
  // Reception
  receiveGoods: (
    orderId: string,
    receivedItems: { itemId: string; receivedQty: number; price?: number }[],
    notes: string,
    invoiceNumber: string,
    deliveryType: 'completa' | 'parcial',
    paymentStatus: Order['paymentStatus'],
    paymentDetails?: {
      amount: number;
      method: Order['paymentMethod'];
      account: string;
      receiptNumber?: string;
    }
  ) => void;

  // Payments
  recordPayment: (
    orderId: string,
    amount: number,
    method: NonNullable<Order['paymentMethod']>,
    account: string,
    receiptNumber?: string
  ) => void;

  // Items & Providers CRUD
  updateReceptionHours: (config: ReceptionHoursConfig) => void;
  addOrUpdateProvider: (provider: Provider) => void;
  addOrUpdateItem: (item: Item, providerRelations?: Partial<ProviderItemRelation>[]) => void;
  
  // Reset
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gastronomic_erp_state_clean_v1';

// Helper para obtener el timestamp local en formato YYYY-MM-DD HH:mm
const getLocalDatetimeString = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Helper para obtener fecha local YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [activeUserId, setActiveUserId] = useState<string>('usr-1');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, UserPermissions>>(DEFAULT_ROLE_PERMISSIONS);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [providerItems, setProviderItems] = useState<ProviderItemRelation[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [receptionHours, setReceptionHours] = useState<ReceptionHoursConfig>(INITIAL_RECEPTION_HOURS);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>(INITIAL_PRICE_HISTORY);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [itemCategories, setItemCategories] = useState<ConfigOption[]>([]);
  const [itemSubcategories, setItemSubcategories] = useState<ConfigOption[]>([]);
  const [itemUnits, setItemUnits] = useState<ConfigOption[]>([]);

  // Limpiar localStorage legado de opciones de configuración, proveedores, clientes, insumos, empleados, usuarios, comandas, caja, CC y consumos
  useEffect(() => {
    try {
      localStorage.removeItem('plegma_item_categories');
      localStorage.removeItem('plegma_item_subcategories');
      localStorage.removeItem('plegma_item_units');
      localStorage.removeItem('plegma_providers');
      localStorage.removeItem('plegma_clients');
      localStorage.removeItem('plegma_items');
      localStorage.removeItem('plegma_provider_items');
      localStorage.removeItem('plegma_employees');
      localStorage.removeItem('plegma_users');
      localStorage.removeItem('plegma_sale_orders');
      localStorage.removeItem('plegma_master_cash_boxes');
      localStorage.removeItem('plegma_cash_shifts');
      localStorage.removeItem('plegma_cash_lines');
      localStorage.removeItem('plegma_cash_movements');
      localStorage.removeItem('plegma_cc_movements');
      localStorage.removeItem('plegma_cc_receipts');
      localStorage.removeItem('plegma_employee_consumptions');
      localStorage.removeItem('plegma_audit_logs');
    } catch (e) {}
  }, []);

  // Carga inicial desde Supabase para Módulos 1, 2, 3, 4, 6, 7, 8, 9 y 10
  useEffect(() => {
    const fetchInitialDataFromSupabase = async () => {
      try {
        const [cats, subcats, units, provs, fetchedItems, fetchedRelations, fetchedClients, fetchedEmps, fetchedUsers, fetchedSaleOrders, fetchedMasterBoxes, fetchedShifts, fetchedLines, fetchedMovements, fetchedCcMovements, fetchedReceipts, fetchedEmployeeConsumptions, fetchedAuditLogs] = await Promise.all([
          configService.getByType('category'),
          configService.getByType('subcategory'),
          configService.getByType('unit'),
          providersService.getAll(),
          itemsService.getAll(),
          itemsService.getProviderRelations(),
          clientsService.getAll(),
          employeesService.getAll(),
          usersService.getUsers(),
          saleOrdersService.getAll(),
          cashService.getMasterCashBoxes(),
          cashService.getShifts(),
          cashService.getLines(),
          cashService.getMovements(),
          currentAccountService.getMovements(),
          currentAccountService.getReceipts(),
          currentAccountService.getEmployeeConsumptions(),
          auditLogsService.getAll(),
        ]);
        setItemCategories(cats);
        setItemSubcategories(subcats);
        setItemUnits(units);
        setProviders(provs);
        setItems(fetchedItems);
        setProviderItems(fetchedRelations);
        setClients(fetchedClients);
        setEmployees(fetchedEmps);
        setUsers(fetchedUsers);
        setSaleOrders(fetchedSaleOrders);
        setMasterCashBoxes(fetchedMasterBoxes);
        setCashShifts(fetchedShifts);
        setCashLines(fetchedLines);
        setCashMovements(fetchedMovements);
        setCcMovements(fetchedCcMovements);
        setCcReceipts(fetchedReceipts);
        setEmployeeConsumptions(fetchedEmployeeConsumptions);
        setAuditLogs(fetchedAuditLogs);
      } catch (err) {
        console.error('Error al cargar datos iniciales de Supabase:', err);
      }
    };

    fetchInitialDataFromSupabase();
  }, []);

  const saveItemCategories = async (action: React.SetStateAction<ConfigOption[]>) => {
    const prev = itemCategories;
    const next = typeof action === 'function' ? action(prev) : action;
    setItemCategories(next);

    try {
      const prevMap = new Map<string, ConfigOption>(prev.map((o) => [o.id, o]));
      const nextIds = new Set(next.map((o) => o.id));

      for (const p of prev) {
        if (!nextIds.has(p.id) && !p.id.startsWith('opt-') && !p.id.startsWith('cat-leg-')) {
          await configService.delete(p.id);
        }
      }

      for (const item of next) {
        if (item.id.startsWith('opt-') || item.id.startsWith('cat-leg-')) {
          await configService.create('category', item.name, item.active);
        } else if (prevMap.has(item.id)) {
          const old = prevMap.get(item.id)!;
          if (old.name !== item.name || old.active !== item.active) {
            await configService.update(item.id, { name: item.name, active: item.active });
          }
        }
      }

      const fresh = await configService.getByType('category');
      if (fresh.length > 0) setItemCategories(fresh);
    } catch (e) {
      console.error('Error al sincronizar categorías con Supabase:', e);
    }
  };

  const saveItemSubcategories = async (action: React.SetStateAction<ConfigOption[]>) => {
    const prev = itemSubcategories;
    const next = typeof action === 'function' ? action(prev) : action;
    setItemSubcategories(next);

    try {
      const prevMap = new Map<string, ConfigOption>(prev.map((o) => [o.id, o]));
      const nextIds = new Set(next.map((o) => o.id));

      for (const p of prev) {
        if (!nextIds.has(p.id) && !p.id.startsWith('opt-') && !p.id.startsWith('scat-leg-')) {
          await configService.delete(p.id);
        }
      }

      for (const item of next) {
        if (item.id.startsWith('opt-') || item.id.startsWith('scat-leg-')) {
          await configService.create('subcategory', item.name, item.active);
        } else if (prevMap.has(item.id)) {
          const old = prevMap.get(item.id)!;
          if (old.name !== item.name || old.active !== item.active) {
            await configService.update(item.id, { name: item.name, active: item.active });
          }
        }
      }

      const fresh = await configService.getByType('subcategory');
      if (fresh.length > 0) setItemSubcategories(fresh);
    } catch (e) {
      console.error('Error al sincronizar subcategorías con Supabase:', e);
    }
  };

  const saveItemUnits = async (action: React.SetStateAction<ConfigOption[]>) => {
    const prev = itemUnits;
    const next = typeof action === 'function' ? action(prev) : action;
    setItemUnits(next);

    try {
      const prevMap = new Map<string, ConfigOption>(prev.map((o) => [o.id, o]));
      const nextIds = new Set(next.map((o) => o.id));

      for (const p of prev) {
        if (!nextIds.has(p.id) && !p.id.startsWith('unit-leg-') && !p.id.startsWith('opt-')) {
          await configService.delete(p.id);
        }
      }

      for (const item of next) {
        if (item.id.startsWith('opt-') || item.id.startsWith('unit-leg-')) {
          await configService.create('unit', item.name, item.active);
        } else if (prevMap.has(item.id)) {
          const old = prevMap.get(item.id)!;
          if (old.name !== item.name || old.active !== item.active) {
            await configService.update(item.id, { name: item.name, active: item.active });
          }
        }
      }

      const fresh = await configService.getByType('unit');
      if (fresh.length > 0) setItemUnits(fresh);
    } catch (e) {
      console.error('Error al sincronizar unidades con Supabase:', e);
    }
  };


  const addOrUpdateEmployee = async (emp: Employee) => {
    const saved = await employeesService.save(emp);
    if (saved) {
      setEmployees((prev) => {
        const idx = prev.findIndex((e) => e.id === emp.id || e.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      logAudit('Guardar Empleado', 'cliente', saved.id, saved.name);
    }
  };

  const toggleEmployeeStatus = async (employeeId: string) => {
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return;
    const updated = { ...target, active: !target.active };
    const saved = await employeesService.save(updated);
    if (saved) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? saved : e))
      );
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    const success = await employeesService.delete(employeeId);
    if (success) {
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    }
  };

  const addHourlyRateLog = (employeeId: string, newRate: number, notes?: string) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const oldRate = e.hourlyRate;
        const pct = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;
        const newLog: HourlyRateLog = {
          id: 'log-' + Date.now(),
          employeeId,
          timestamp: getLocalDatetimeString(),
          oldPrice: oldRate,
          newPrice: newRate,
          percentageIncrease: Number(pct.toFixed(2)),
          modifiedBy: 'ADMINISTRADOR',
          notes,
        };
        return {
          ...e,
          hourlyRate: newRate,
          hourlyRateLogs: [newLog, ...(e.hourlyRateLogs || [])],
        };
      })
    );
  };

  const [clockRecords, setClockRecords] = useState<ClockRecord[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_clock_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CLOCK_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_clock_records', JSON.stringify(clockRecords));
    } catch (e) {}
  }, [clockRecords]);

  const clockIn = (dni: string) => {
    const cleanDni = dni.trim();
    const emp = employees.find((e) => e.dni === cleanDni);
    if (!emp) {
      return { success: false, message: `No se encontró ningún empleado registrado con el DNI ${cleanDni}.` };
    }
    if (!emp.active) {
      return { success: false, message: `El empleado ${emp.name} se encuentra INACTIVO en la plantilla.` };
    }
    if (!emp.enableClockIn) {
      return { success: false, message: `El empleado ${emp.name} no tiene habilitada la marcación de horas.` };
    }

    const openRecord = clockRecords.find(
      (r) => r.dni === cleanDni && r.state === 'Abierta'
    );
    if (openRecord) {
      return {
        success: false,
        message: `El empleado ${emp.name} ya posee una marcación ABIERTA desde las ${openRecord.checkIn.substring(11)}. Registre la salida primero.`,
        record: openRecord,
      };
    }

    const nowStr = getLocalDatetimeString();
    const newRecord: ClockRecord = {
      id: 'clk-' + Date.now(),
      employeeId: emp.id,
      dni: emp.dni,
      employeeName: emp.name,
      checkIn: nowStr,
      hourlyRate: emp.hourlyRate || 0,
      state: 'Abierta',
    };

    setClockRecords((prev) => [newRecord, ...prev]);
    return {
      success: true,
      message: `Entrada registrada exitosamente para ${emp.name} a las ${nowStr.substring(11)}.`,
      record: newRecord,
    };
  };

  const clockOut = (dni: string) => {
    const cleanDni = dni.trim();
    const emp = employees.find((e) => e.dni === cleanDni);
    if (!emp) {
      return { success: false, message: `No se encontró ningún empleado registrado con el DNI ${cleanDni}.` };
    }

    const openRecord = clockRecords.find(
      (r) => r.dni === cleanDni && r.state === 'Abierta'
    );
    if (!openRecord) {
      return {
        success: false,
        message: `El empleado ${emp.name} no posee ninguna marcación ABIERTA pendiente de salida.`,
      };
    }

    const nowStr = getLocalDatetimeString();
    
    const tIn = new Date(openRecord.checkIn.replace(' ', 'T')).getTime();
    const tOut = new Date(nowStr.replace(' ', 'T')).getTime();
    const diffMs = Math.max(0, tOut - tIn);
    const hoursDecimal = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    const totalCost = Number((hoursDecimal * openRecord.hourlyRate).toFixed(2));

    const updatedRecord: ClockRecord = {
      ...openRecord,
      checkOut: nowStr,
      hoursWorked: hoursDecimal,
      totalCost,
      state: 'Cerrada',
    };

    setClockRecords((prev) =>
      prev.map((r) => (r.id === openRecord.id ? updatedRecord : r))
    );

    return {
      success: true,
      message: `Salida registrada exitosamente para ${emp.name}. Jornada total: ${hoursDecimal} hs. Costo: $${totalCost.toLocaleString('es-AR')}.`,
      record: updatedRecord,
    };
  };

  const correctClockRecord = (id: string, checkIn: string, checkOut: string, reason: string) => {
    setClockRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        let hoursDecimal = r.hoursWorked;
        let totalCost = r.totalCost;

        if (checkIn && checkOut) {
          const tIn = new Date(checkIn.replace(' ', 'T')).getTime();
          const tOut = new Date(checkOut.replace(' ', 'T')).getTime();
          const diffMs = Math.max(0, tOut - tIn);
          hoursDecimal = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
          totalCost = Number((hoursDecimal * r.hourlyRate).toFixed(2));
        }

        return {
          ...r,
          checkIn,
          checkOut: checkOut || undefined,
          hoursWorked: hoursDecimal,
          totalCost,
          state: 'Corregida',
          modifiedBy: 'ADMINISTRADOR',
          modificationReason: reason,
          modifiedAt: getLocalDatetimeString(),
        };
      })
    );
  };

  const voidClockRecord = (id: string, reason: string) => {
    setClockRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              state: 'Anulada',
              modifiedBy: 'ADMINISTRADOR',
              modificationReason: reason,
              modifiedAt: getLocalDatetimeString(),
            }
          : r
      )
    );
  };

  const [employeeConsumptions, setEmployeeConsumptions] = useState<EmployeeConsumption[]>([]);

  const addEmployeeConsumptionFromReceipt = async (consumption: EmployeeConsumption) => {
    const saved = await currentAccountService.addEmployeeConsumption(consumption);
    const finalEc = saved || { ...consumption, id: 'ec-' + Date.now() };
    setEmployeeConsumptions((prev) => [finalEc, ...prev]);
  };

  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_employee_advances');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EMPLOYEE_ADVANCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_employee_advances', JSON.stringify(employeeAdvances));
    } catch (e) {}
  }, [employeeAdvances]);

  const addOrUpdateAdvance = (adv: EmployeeAdvance) => {
    setEmployeeAdvances((prev) => {
      const idx = prev.findIndex((a) => a.id === adv.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = adv;
        return copy;
      }
      return [adv, ...prev];
    });
  };

  const voidAdvance = (advanceId: string) => {
    setEmployeeAdvances((prev) =>
      prev.map((a) => (a.id === advanceId ? { ...a, status: 'Anulado', pendingBalance: 0 } : a))
    );
  };

  const [payruns, setPayruns] = useState<Payrun[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_payruns');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PAYRUNS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_payruns', JSON.stringify(payruns));
    } catch (e) {}
  }, [payruns]);

  // Cuentas Corrientes State & Persistence
  const [ccMovements, setCcMovementsState] = useState<CurrentAccountMovement[]>([]);
  const [ccReceipts, setCcReceiptsState] = useState<Receipt[]>([]);

  const setCcMovements: React.Dispatch<React.SetStateAction<CurrentAccountMovement[]>> = async (action) => {
    const prev = ccMovements;
    const next = typeof action === 'function' ? action(prev) : action;
    setCcMovementsState(next);

    try {
      const prevMap = new Map<string, CurrentAccountMovement>(prev.map((m) => [m.id, m]));
      for (const item of next) {
        if (!prevMap.has(item.id) || item.id.startsWith('mov-')) {
          await currentAccountService.addMovement(item);
        } else {
          const old = prevMap.get(item.id)!;
          if (old.lineState !== item.lineState) {
            await currentAccountService.updateMovementState(item.id, item.lineState);
          }
        }
      }
      const fresh = await currentAccountService.getMovements();
      if (fresh.length > 0) setCcMovementsState(fresh);
    } catch (e) {
      console.error('Error al sincronizar movimientos de CC con Supabase:', e);
    }
  };

  const setCcReceipts: React.Dispatch<React.SetStateAction<Receipt[]>> = async (action) => {
    const prev = ccReceipts;
    const next = typeof action === 'function' ? action(prev) : action;
    setCcReceiptsState(next);

    try {
      const prevMap = new Map<string, Receipt>(prev.map((r) => [r.id, r]));
      for (const item of next) {
        if (!prevMap.has(item.id) || item.id.startsWith('rec-') || item.id.startsWith('rc-')) {
          await currentAccountService.saveReceipt(item);
        } else {
          const old = prevMap.get(item.id)!;
          if (old.status !== item.status || old.billedAt !== item.billedAt) {
            await currentAccountService.saveReceipt(item);
          }
        }
      }
      const fresh = await currentAccountService.getReceipts();
      if (fresh.length > 0) setCcReceiptsState(fresh);
    } catch (e) {
      console.error('Error al sincronizar recibos con Supabase:', e);
    }
  };

  const createPayrun = (startDate: string, endDate: string, customPeriodName?: string) => {
    if (!startDate || !endDate) {
      return { success: false, message: 'Debe ingresar fecha y hora de inicio y fin.' };
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return { success: false, message: 'La fecha de fin debe ser posterior a la fecha de inicio.' };
    }

    const activeEmps = employees.filter((e) => e.active);
    if (activeEmps.length === 0) {
      return { success: false, message: 'No hay empleados activos en la nómina.' };
    }

    const details: PayrunEmployeeDetail[] = activeEmps.map((emp) => {
      const empClocks = clockRecords.filter(
        (c) =>
          c.employeeId === emp.id &&
          c.state !== 'Anulada' &&
          c.checkIn >= startDate &&
          c.checkIn <= endDate
      );

      const totalHoursDecimal = empClocks.reduce((sum, c) => sum + (c.hoursWorked || 0), 0);
      const hoursInt = Math.floor(totalHoursDecimal);
      const minsInt = Math.round((totalHoursDecimal - hoursInt) * 60);
      const hoursWorkedStr = `${String(hoursInt).padStart(2, '0')}:${String(minsInt).padStart(2, '0')}:00`;

      const hourlyRate = emp.hourlyRate || 3000;
      const grossAmount = Number((totalHoursDecimal * hourlyRate).toFixed(2));

      const deductions: PayrunDeduction[] = [];

      const empConsumptions = employeeConsumptions.filter(
        (c) => c.employeeId === emp.id && c.status === 'Pendiente'
      );
      empConsumptions.forEach((c) => {
        deductions.push({
          id: 'ded-' + c.id,
          concept: 'Consumo de Empleado',
          detail: `Pedido #${c.orderNumber}`,
          amount: c.amount,
          sourceId: c.id,
        });
      });

      const empAdvances = employeeAdvances.filter(
        (a) => a.employeeId === emp.id && (a.status === 'Pendiente' || a.status === 'En descuento')
      );
      empAdvances.forEach((adv) => {
        const pendingInst = adv.installments.find((i) => i.status === 'Pendiente');
        if (pendingInst) {
          deductions.push({
            id: 'ded-' + adv.id + '-' + pendingInst.installmentNumber,
            concept: 'Adelanto de Sueldo',
            detail: `${pendingInst.installmentNumber}/${adv.installmentsCount} cuota`,
            amount: pendingInst.amount,
            sourceId: adv.id,
          });
        }
      });

      const totalDeductions = Number(
        deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)
      );

      const netAmount = Math.max(0, Number((grossAmount - totalDeductions).toFixed(2)));

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        dni: emp.dni,
        position: emp.position,
        hoursWorkedStr: totalHoursDecimal > 0 ? hoursWorkedStr : '00:00:00',
        hoursWorkedDecimal: totalHoursDecimal,
        hourlyRate,
        grossAmount,
        deductions,
        totalDeductions,
        netAmount,
        paidAmount: 0,
        pendingAmount: netAmount,
        status: 'Pendiente',
      };
    });

    const totalToPay = Number(details.reduce((sum, d) => sum + d.netAmount, 0).toFixed(2));
    const nowStr = getLocalDatetimeString();

    const newPayrunRecord: Payrun = {
      id: 'payrun-' + Date.now(),
      periodName: customPeriodName || `Período ${startDate.split(' ')[0]} al ${endDate.split(' ')[0]}`,
      startDate,
      endDate,
      employeeCount: activeEmps.length,
      totalToPay,
      totalPaid: 0,
      totalPending: totalToPay,
      status: 'Pendiente',
      employeesDetails: details,
      createdAt: nowStr,
    };

    setPayruns((prev) => [newPayrunRecord, ...prev]);
    return { success: true, message: 'Liquidación creada exitosamente.', payrun: newPayrunRecord };
  };

  const markEmployeePaid = (
    payrunId: string,
    employeeId: string,
    paymentMethod: string,
    cashRegister: string
  ) => {
    const nowStr = getLocalDatetimeString();
    setPayruns((prev) =>
      prev.map((pr) => {
        if (pr.id !== payrunId) return pr;

        const updatedDetails = pr.employeesDetails.map((det) => {
          if (det.employeeId !== employeeId) return det;
          return {
            ...det,
            status: 'Pagado' as const,
            paidAmount: det.netAmount,
            pendingAmount: 0,
            paymentMethod,
            cashRegister,
            paymentDate: nowStr,
          };
        });

        const totalPaid = Number(updatedDetails.reduce((sum, d) => sum + d.paidAmount, 0).toFixed(2));
        const totalPending = Number((pr.totalToPay - totalPaid).toFixed(2));
        const status = totalPending <= 0 ? 'Liquidada' : totalPaid > 0 ? 'En curso' : 'Pendiente';

        return {
          ...pr,
          totalPaid,
          totalPending: Math.max(0, totalPending),
          status,
          employeesDetails: updatedDetails,
        };
      })
    );
  };

  const unmarkEmployeePaid = (payrunId: string, employeeId: string) => {
    setPayruns((prev) =>
      prev.map((pr) => {
        if (pr.id !== payrunId) return pr;

        const updatedDetails = pr.employeesDetails.map((det) => {
          if (det.employeeId !== employeeId) return det;
          return {
            ...det,
            status: 'Pendiente' as const,
            paidAmount: 0,
            pendingAmount: det.netAmount,
            paymentMethod: undefined,
            cashRegister: undefined,
            paymentDate: undefined,
          };
        });

        const totalPaid = Number(updatedDetails.reduce((sum, d) => sum + d.paidAmount, 0).toFixed(2));
        const totalPending = Number((pr.totalToPay - totalPaid).toFixed(2));
        const status = totalPaid === 0 ? 'Pendiente' : totalPending > 0 ? 'En curso' : 'Liquidada';

        return {
          ...pr,
          totalPaid,
          totalPending,
          status,
          employeesDetails: updatedDetails,
        };
      })
    );
  };

  const voidPayrun = (payrunId: string) => {
    setPayruns((prev) =>
      prev.map((pr) => (pr.id === payrunId ? { ...pr, status: 'Anulada' } : pr))
    );
  };

  // ----------------------------------------------------
  // CONTROL DE CAJA
  // ----------------------------------------------------
  const [masterCashBoxes, setMasterCashBoxes] = useState<MasterCashBox[]>([]);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [cashLines, setCashLines] = useState<CashLine[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);

  // Helper date string with seconds
  const getNowStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const openCashShift = async (shift: TurnoType, initialLines?: { boxType: string; initialAmount: number }[], notes?: string): Promise<{ success: boolean; message: string; shift?: CashShift }> => {
    const activeShift = cashShifts.find((s) => s.status === 'Abierta');
    if (activeShift) {
      return { success: false, message: `Ya existe una caja de turno abierta (${activeShift.name}). Debe cerrarla primero.` };
    }

    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const shiftName = `${shift.toUpperCase()} ${dateStr}`;
    const activeUser = users.find((u) => u.id === activeUserId);

    const shiftToSave: CashShift = {
      id: '',
      shift,
      createdAt: getNowStr(),
      name: shiftName,
      status: 'Abierta',
      openedByUserId: activeUserId,
      openedByUserName: activeUser?.name || 'Usuario Autenticado',
      notes,
    };

    const savedShift = await cashService.saveShift(shiftToSave);
    const finalShift = savedShift || { ...shiftToSave, id: 'shift-' + Date.now() };

    setCashShifts((prev) => [finalShift, ...prev]);

    if (initialLines && initialLines.length > 0) {
      const createdLines: CashLine[] = [];
      const createdMovements: CashMovement[] = [];

      for (const l of initialLines) {
        const lineToSave: CashLine = {
          id: '',
          shiftId: finalShift.id,
          boxType: l.boxType,
          initialAmount: l.initialAmount,
          ticketsTotal: 0,
          expensesTotal: 0,
          withdrawalsTotal: 0,
          theoreticalAmount: l.initialAmount,
          status: 'Abierta',
          openedByUserId: activeUserId,
          openedByUserName: activeUser?.name || 'Usuario Autenticado',
        };

        const savedLine = await cashService.saveLine(lineToSave);
        const finalLine = savedLine || { ...lineToSave, id: 'line-' + Date.now() + Math.random() };
        createdLines.push(finalLine);

        if (l.initialAmount > 0) {
          const initMovToSave: CashMovement = {
            id: '',
            lineId: finalLine.id,
            shiftId: finalShift.id,
            dateTime: getNowStr(),
            type: 'Apertura',
            origin: 'Saldo Inicial',
            amount: l.initialAmount,
            userId: activeUserId,
            userName: activeUser?.name || 'Usuario Autenticado',
            notes: `Monto inicial de apertura para ${l.boxType}`,
          };

          const savedMov = await cashService.addMovement(initMovToSave);
          if (savedMov) createdMovements.push(savedMov);
        }
      }

      setCashLines((prev) => [...createdLines, ...prev]);
      if (createdMovements.length > 0) {
        setCashMovements((prev) => [...createdMovements, ...prev]);
      }
    }

    return { success: true, message: `Caja de turno "${shiftName}" abierta correctamente.`, shift: finalShift };
  };

  const addCashLine = async (shiftId: string, boxType: string, initialAmount: number): Promise<{ success: boolean; message: string; line?: CashLine }> => {
    const targetShift = cashShifts.find((s) => s.id === shiftId);
    if (!targetShift) return { success: false, message: 'No se encontró la caja de turno.' };
    if (targetShift.status !== 'Abierta') return { success: false, message: 'La caja de turno no está abierta.' };

    const existingLine = cashLines.find((l) => l.shiftId === shiftId && l.boxType.toLowerCase() === boxType.toLowerCase() && l.status !== 'Conciliada');
    if (existingLine && existingLine.status === 'Abierta') {
      return { success: false, message: `Ya existe una línea abierta para "${boxType}" en esta caja.` };
    }

    const activeUser = users.find((u) => u.id === activeUserId);

    const lineToSave: CashLine = {
      id: '',
      shiftId,
      boxType,
      initialAmount,
      ticketsTotal: 0,
      expensesTotal: 0,
      withdrawalsTotal: 0,
      theoreticalAmount: initialAmount,
      status: 'Abierta',
    };

    const savedLine = await cashService.saveLine(lineToSave);
    const newLine = savedLine || { ...lineToSave, id: 'line-' + Date.now() };

    setCashLines((prev) => [...prev, newLine]);

    if (initialAmount > 0) {
      const initMov: CashMovement = {
        id: '',
        lineId: newLine.id,
        shiftId,
        dateTime: getNowStr(),
        type: 'Apertura',
        origin: 'Saldo Inicial',
        amount: initialAmount,
        userId: activeUserId,
        userName: activeUser?.name || 'Usuario Autenticado',
        notes: `Monto inicial de apertura para ${boxType}`,
      };

      const savedMov = await cashService.addMovement(initMov);
      if (savedMov) {
        setCashMovements((prev) => [savedMov, ...prev]);
      }
    }

    return { success: true, message: `Línea "${boxType}" agregada a la caja correctamente.`, line: newLine };
  };

  const recordCashMovement = async (movement: Omit<CashMovement, 'id' | 'dateTime' | 'userId' | 'userName'>): Promise<void> => {
    const targetLine = cashLines.find((l) => l.id === movement.lineId);
    if (!targetLine || targetLine.status !== 'Abierta') {
      console.warn('No se puede imputar movimientos a una línea de caja cerrada o inexistente.');
      return;
    }

    const activeUser = users.find((u) => u.id === activeUserId);
    const nowStr = getNowStr();

    const movToSave: CashMovement = {
      ...movement,
      id: '',
      dateTime: nowStr,
      userId: activeUserId,
      userName: activeUser?.name || 'Usuario Autenticado',
    };

    const savedMov = await cashService.addMovement(movToSave);
    const finalMov = savedMov || { ...movToSave, id: 'cm-' + Date.now() };

    setCashMovements((prev) => [finalMov, ...prev]);

    let ticketsTotal = targetLine.ticketsTotal;
    let expensesTotal = targetLine.expensesTotal;
    let withdrawalsTotal = targetLine.withdrawalsTotal;

    if (movement.type === 'Ingreso' || movement.type === 'Ticket' || (movement.type === 'Ajuste' && movement.amount > 0)) {
      ticketsTotal += Math.abs(movement.amount);
    } else if (movement.type === 'Salida' || movement.type === 'Gasto' || movement.type === 'Consumo' || (movement.type === 'Ajuste' && movement.amount < 0)) {
      expensesTotal += Math.abs(movement.amount);
    } else if (movement.type === 'Retiro' || movement.type === 'Traspaso') {
      if (movement.amount < 0) {
        withdrawalsTotal += Math.abs(movement.amount);
      } else {
        ticketsTotal += Math.abs(movement.amount);
      }
    }

    const theoreticalAmount = targetLine.initialAmount + ticketsTotal - expensesTotal - withdrawalsTotal;

    const updatedLine: CashLine = {
      ...targetLine,
      ticketsTotal,
      expensesTotal,
      withdrawalsTotal,
      theoreticalAmount,
    };

    await cashService.saveLine(updatedLine);

    setCashLines((prev) =>
      prev.map((l) => (l.id === movement.lineId ? updatedLine : l))
    );
  };

  const withdrawCashToMaster = async ({ lineId, amount, masterBoxId, notes }: CashWithdrawalPayload): Promise<{ success: boolean; message: string }> => {
    const targetLine = cashLines.find((l) => l.id === lineId);
    if (!targetLine || targetLine.status !== 'Abierta') {
      return { success: false, message: 'No se pueden efectuar retiros desde una línea de caja cerrada.' };
    }

    const targetMaster = masterCashBoxes.find((mb) => mb.id === masterBoxId);
    if (!targetMaster) {
      return { success: false, message: 'Debe seleccionar una Caja Maestra de destino válida.' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Ingrese un monto de retiro superior a cero.' };
    }

    const activeUser = users.find((u) => u.id === activeUserId);
    const nowStr = getNowStr();

    const withdrawMov: CashMovement = {
      id: '',
      lineId: targetLine.id,
      shiftId: targetLine.shiftId,
      dateTime: nowStr,
      type: 'Retiro',
      origin: `Retiro A ${targetMaster.name}`,
      voucherNumber: `RET-${Date.now().toString().slice(-5)}`,
      amount: -Math.abs(amount),
      userId: activeUserId,
      userName: activeUser?.name || 'Usuario Autenticado',
      notes,
      targetMasterBoxId: masterBoxId,
    };

    const savedMov = await cashService.addMovement(withdrawMov);
    const finalMov = savedMov || { ...withdrawMov, id: 'cm-' + Date.now() };

    setCashMovements((prev) => [finalMov, ...prev]);

    const withdrawalsTotal = targetLine.withdrawalsTotal + Math.abs(amount);
    const theoreticalAmount = targetLine.initialAmount + targetLine.ticketsTotal - targetLine.expensesTotal - withdrawalsTotal;
    const updatedLine: CashLine = {
      ...targetLine,
      withdrawalsTotal,
      theoreticalAmount,
    };

    await cashService.saveLine(updatedLine);

    setCashLines((prev) =>
      prev.map((l) => (l.id === lineId ? updatedLine : l))
    );

    const newBalance = targetMaster.currentBalance + Math.abs(amount);
    await cashService.updateMasterCashBoxBalance(masterBoxId, newBalance);

    setMasterCashBoxes((prev) =>
      prev.map((mb) => (mb.id === masterBoxId ? { ...mb, currentBalance: newBalance } : mb))
    );

    return { success: true, message: `Retiro de $${amount.toLocaleString('es-AR')} a ${targetMaster.name} registrado con éxito.` };
  };

  const transferCashBetweenLines = async (payload: { sourceLineId: string; targetLineId: string; amount: number; notes?: string }): Promise<{ success: boolean; message: string }> => {
    const sourceLine = cashLines.find((l) => l.id === payload.sourceLineId);
    const targetLine = cashLines.find((l) => l.id === payload.targetLineId);
    if (!sourceLine || sourceLine.status !== 'Abierta') {
      return { success: false, message: 'La línea de caja de origen no está abierta.' };
    }
    if (!targetLine || targetLine.status !== 'Abierta') {
      return { success: false, message: 'La línea de caja de destino no está abierta.' };
    }
    if (payload.amount <= 0) {
      return { success: false, message: 'Ingrese un monto a transferir válido superior a cero.' };
    }

    const activeUser = users.find((u) => u.id === activeUserId);
    const nowStr = getNowStr();

    const sourceMov: CashMovement = {
      id: '',
      lineId: sourceLine.id,
      shiftId: sourceLine.shiftId,
      dateTime: nowStr,
      type: 'Retiro',
      origin: `Traspaso A ${targetLine.boxType}`,
      voucherNumber: `TRF-${Date.now().toString().slice(-5)}`,
      amount: -Math.abs(payload.amount),
      userId: activeUserId,
      userName: activeUser?.name || 'Usuario Autenticado',
      notes: payload.notes,
      targetLineId: targetLine.id,
    };

    const targetMov: CashMovement = {
      id: '',
      lineId: targetLine.id,
      shiftId: targetLine.shiftId,
      dateTime: nowStr,
      type: 'Apertura',
      origin: `Traspaso Desde ${sourceLine.boxType}`,
      voucherNumber: `TRF-${Date.now().toString().slice(-5)}`,
      amount: Math.abs(payload.amount),
      userId: activeUserId,
      userName: activeUser?.name || 'Usuario Autenticado',
      notes: payload.notes,
      targetLineId: sourceLine.id,
    };

    const savedSource = await cashService.addMovement(sourceMov);
    const savedTarget = await cashService.addMovement(targetMov);

    setCashMovements((prev) => [
      savedTarget || { ...targetMov, id: 'cm-' + (Date.now() + 1) },
      savedSource || { ...sourceMov, id: 'cm-' + Date.now() },
      ...prev,
    ]);

    const sourceWithdrawals = sourceLine.withdrawalsTotal + Math.abs(payload.amount);
    const sourceTheoretical = sourceLine.initialAmount + sourceLine.ticketsTotal - sourceLine.expensesTotal - sourceWithdrawals;
    const updatedSource: CashLine = {
      ...sourceLine,
      withdrawalsTotal: sourceWithdrawals,
      theoreticalAmount: sourceTheoretical,
    };

    const targetTickets = targetLine.ticketsTotal + Math.abs(payload.amount);
    const targetTheoretical = targetLine.initialAmount + targetTickets - targetLine.expensesTotal - targetLine.withdrawalsTotal;
    const updatedTarget: CashLine = {
      ...targetLine,
      ticketsTotal: targetTickets,
      theoreticalAmount: targetTheoretical,
    };

    await cashService.saveLine(updatedSource);
    await cashService.saveLine(updatedTarget);

    setCashLines((prev) =>
      prev.map((l) => (l.id === sourceLine.id ? updatedSource : l.id === targetLine.id ? updatedTarget : l))
    );

    return { success: true, message: `Transferencia de $${payload.amount.toLocaleString('es-AR')} de ${sourceLine.boxType} a ${targetLine.boxType} realizada con éxito.` };
  };

  const closeCashLine = async (lineId: string, realAmount: number, differenceNotes?: string): Promise<{ success: boolean; message: string }> => {
    const targetLine = cashLines.find((l) => l.id === lineId);
    if (!targetLine) return { success: false, message: 'Línea de caja no encontrada.' };

    if (realAmount === undefined || realAmount === null || isNaN(realAmount)) {
      return { success: false, message: 'Debe ingresar el Monto Real Cierre previamente.' };
    }

    const theoreticalAmount = targetLine.initialAmount + targetLine.ticketsTotal - targetLine.expensesTotal - targetLine.withdrawalsTotal;
    const difference = realAmount - theoreticalAmount;
    const nowStr = getNowStr();
    const activeUser = users.find((u) => u.id === activeUserId);

    if (difference !== 0 && (!differenceNotes || !differenceNotes.trim())) {
      return { success: false, message: 'Al existir diferencia entre el monto real y el teórico, la observación es OBLIGATORIA.' };
    }

    const updatedLine: CashLine = {
      ...targetLine,
      theoreticalAmount,
      realAmount,
      difference,
      differenceNotes: differenceNotes?.trim(),
      status: 'Cerrada' as const,
      closedAt: nowStr,
    };

    await cashService.saveLine(updatedLine);

    setCashLines((prev) =>
      prev.map((l) => (l.id === lineId ? updatedLine : l))
    );

    if (difference !== 0) {
      const auditLog: AuditLog = {
        id: 'aud-' + Date.now(),
        timestamp: nowStr,
        userId: activeUserId,
        userName: activeUser?.name || 'Usuario Autenticado',
        action: 'Cierre de Línea con Diferencia',
        entityType: 'pago',
        entityId: lineId,
        oldValue: `Teórico: $${theoreticalAmount}`,
        newValue: `Real: $${realAmount}`,
        details: `Diferencia detectada en línea ${targetLine.boxType}: $${difference} (${difference > 0 ? 'Sobrante' : 'Faltante'}).`,
      };
      setAuditLogs((prev) => [auditLog, ...prev]);
    }

    return { success: true, message: `Línea de caja "${targetLine.boxType}" cerrada correctamente.` };
  };

  const closeCashShift = async (shiftId: string): Promise<{ success: boolean; message: string }> => {
    const targetShift = cashShifts.find((s) => s.id === shiftId);
    if (!targetShift) return { success: false, message: 'Caja de turno no encontrada.' };

    const shiftLines = cashLines.filter((l) => l.shiftId === shiftId);
    if (shiftLines.length === 0) {
      return { success: false, message: 'La caja de turno no posee líneas registradas.' };
    }

    const openLines = shiftLines.filter((l) => l.status === 'Abierta');
    if (openLines.length > 0) {
      return {
        success: false,
        message: `No se puede cerrar la Caja de Turno. Existen ${openLines.length} línea(s) en estado "Abierta" (${openLines.map((l) => l.boxType).join(', ')}). Debe cerrarlas primero.`,
      };
    }

    const totalDiff = shiftLines.reduce((acc, l) => acc + (l.difference || 0), 0);
    const nowStr = getNowStr();

    const updatedShift: CashShift = {
      ...targetShift,
      status: 'Cerrada' as const,
      closedAt: nowStr,
      totalDifference: totalDiff,
    };

    await cashService.saveShift(updatedShift);

    setCashShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? updatedShift : s))
    );

    return { success: true, message: `Caja de turno "${targetShift.name}" cerrada correctamente.` };
  };

  const reconcileCashShift = async (shiftId: string): Promise<{ success: boolean; message: string }> => {
    const targetShift = cashShifts.find((s) => s.id === shiftId);
    if (!targetShift) return { success: false, message: 'Caja de turno no encontrada.' };

    const activeUser = users.find((u) => u.id === activeUserId);
    const nowStr = getNowStr();

    const updatedShift: CashShift = {
      ...targetShift,
      status: 'Conciliada' as const,
      reconciledAt: nowStr,
      reconciledByUserName: activeUser?.name || 'Usuario Autenticado',
    };

    await cashService.saveShift(updatedShift);

    setCashShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? updatedShift : s))
    );

    const shiftLines = cashLines.filter((l) => l.shiftId === shiftId);
    for (const line of shiftLines) {
      const updatedLine: CashLine = { ...line, status: 'Conciliada' };
      await cashService.saveLine(updatedLine);
    }

    setCashLines((prev) =>
      prev.map((l) => (l.shiftId === shiftId ? { ...l, status: 'Conciliada' as const } : l))
    );

    return { success: true, message: `Caja de turno "${targetShift.name}" conciliada exitosamente.` };
  };

  const voidCashShift = async (shiftId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const targetShift = cashShifts.find((s) => s.id === shiftId);
    if (!targetShift) return { success: false, message: 'Caja de turno no encontrada.' };

    const updatedShift: CashShift = {
      ...targetShift,
      status: 'Anulada' as const,
      voidReason: reason,
    };

    await cashService.saveShift(updatedShift);

    setCashShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? updatedShift : s))
    );

    return { success: true, message: `Caja de turno "${targetShift.name}" anulada.` };
  };

  // ----------------------------------------------------
  // RESERVAS DE MESAS
  // ----------------------------------------------------
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_restaurant_tables');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RESTAURANT_TABLES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_restaurant_tables', JSON.stringify(restaurantTables));
    } catch (e) {}
  }, [restaurantTables]);

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_reservations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RESERVATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_reservations', JSON.stringify(reservations));
    } catch (e) {}
  }, [reservations]);

  // [A04] Transición a Histórica: cron/effect que cambia 'Confirmada' pasadas a 'Histórica'
  useEffect(() => {
    const checkPastReservations = () => {
      const now = new Date();
      setReservations((prev) => {
        let changed = false;
        const updated = prev.map((res) => {
          if (res.status === 'Confirmada') {
            const resTime = new Date(res.dateTime.replace(' ', 'T'));
            if (!isNaN(resTime.getTime()) && resTime < now) {
              changed = true;
              return { ...res, status: 'Histórica' as const };
            }
          }
          return res;
        });
        return changed ? updated : prev;
      });
    };

    checkPastReservations();
    const interval = setInterval(checkPastReservations, 60000); // Re-check every minute
    return () => clearInterval(interval);
  }, []);

  // [A06] Control de Overbooking (Doble Reserva en misma mesa +/- 2 horas)
  const checkOverbooking = (tableId: string, dateTimeStr: string, excludeReservationId?: string): boolean => {
    const targetTime = new Date(dateTimeStr.replace(' ', 'T')).getTime();
    if (isNaN(targetTime)) return false;

    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    return reservations.some((r) => {
      if (r.id === excludeReservationId) return false;
      if (r.tableId !== tableId) return false;
      if (r.status !== 'Confirmada') return false;

      const existingTime = new Date(r.dateTime.replace(' ', 'T')).getTime();
      if (isNaN(existingTime)) return false;

      const diff = Math.abs(targetTime - existingTime);
      return diff < TWO_HOURS_MS;
    });
  };

  const addReservation = (data: Omit<Reservation, 'id' | 'createdAt' | 'createdByUserId' | 'createdByUserName' | 'status'>) => {
    // [R01] Obligatoriedad de Fecha/Hora
    if (!data.dateTime || !data.dateTime.trim()) {
      return { success: false, message: 'Debe ingresar la Fecha y Hora de la reserva (R01).' };
    }

    // [R02] Obligatoriedad de Mesa
    if (!data.tableId) {
      return { success: false, message: 'Debe asignar una mesa válida de la lista (R02).' };
    }

    // [R03] Obligatoriedad de Comensales
    if (!data.guestsCount || data.guestsCount < 1) {
      return { success: false, message: 'La cantidad de comensales debe ser de al menos 1 persona (R03).' };
    }

    // [A06] Control de Overbooking
    if (checkOverbooking(data.tableId, data.dateTime)) {
      const table = restaurantTables.find((t) => t.id === data.tableId);
      return {
        success: false,
        message: `Overbooking bloqueado (A06): La mesa "${table?.name || data.tableName}" ya posee una reserva confirmada en un rango cercano a la hora solicitada.`,
      };
    }

    const activeUser = users.find((u) => u.id === activeUserId);
    const nowStr = getNowStr();

    const newRes: Reservation = {
      ...data,
      id: 'res-' + Date.now(),
      status: 'Confirmada', // [A01] Estado inicial Confirmada
      createdByUserId: activeUserId, // [A02] Auditoría de Carga
      createdByUserName: activeUser?.name || 'Usuario Autenticado',
      createdAt: nowStr, // [A03] Timestamp SYS
    };

    setReservations((prev) => [newRes, ...prev]);
    return { success: true, message: `Reserva para "${data.clientName}" registrada exitosamente.`, reservation: newRes };
  };

  const updateReservation = (updatedRes: Reservation) => {
    const target = reservations.find((r) => r.id === updatedRes.id);
    if (!target) return { success: false, message: 'Reserva no encontrada.' };

    // [R05] Inmutabilidad de Históricas (Salvo admin)
    if (target.status === 'Histórica' && userRole !== 'admin') {
      return { success: false, message: 'Las reservas históricas están bloqueadas para edición (R05).' };
    }

    // [A06] Control de Overbooking al editar
    if (updatedRes.status === 'Confirmada' && checkOverbooking(updatedRes.tableId, updatedRes.dateTime, updatedRes.id)) {
      return {
        success: false,
        message: `Overbooking bloqueado (A06): La mesa "${updatedRes.tableName}" ya posee otra reserva confirmada en ese rango horario.`,
      };
    }

    const nowStr = getNowStr();
    const activeUser = users.find((u) => u.id === activeUserId);
    const changes: string[] = [];

    if (target.dateTime !== updatedRes.dateTime) changes.push(`Fecha/Hora: '${target.dateTime}' ➔ '${updatedRes.dateTime}'`);
    if (target.tableId !== updatedRes.tableId) changes.push(`Mesa: '${target.tableName}' ➔ '${updatedRes.tableName}'`);
    if (target.guestsCount !== updatedRes.guestsCount) changes.push(`Comensales: ${target.guestsCount} ➔ ${updatedRes.guestsCount} pax`);
    if (target.notes !== updatedRes.notes) changes.push(`Notas modificadas`);
    if (target.status !== updatedRes.status) changes.push(`Estado: '${target.status}' ➔ '${updatedRes.status}'`);

    const newLogItem: ReservationLog = {
      id: 'log-' + Date.now(),
      timestamp: nowStr,
      userId: activeUserId,
      userName: activeUser?.name || 'Usuario Autenticado',
      action: 'Edición de Reserva',
      details: changes.length > 0 ? changes.join(' | ') : 'Edición general de la reserva.',
    };

    const finalRes: Reservation = {
      ...updatedRes,
      updatedByUserId: activeUserId,
      updatedByUserName: activeUser?.name || 'Usuario Autenticado',
      updatedAt: nowStr,
      logs: [newLogItem, ...(target.logs || [])],
    };

    setReservations((prev) => prev.map((r) => (r.id === updatedRes.id ? finalRes : r)));
    return { success: true, message: `Reserva para "${updatedRes.clientName}" actualizada correctamente.` };
  };

  const cancelReservation = (reservationId: string, cancelReason: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return { success: false, message: 'Reserva no encontrada.' };

    const nowStr = getNowStr();
    const activeUser = users.find((u) => u.id === activeUserId);
    const userName = activeUser?.name || 'Usuario Autenticado';

    const logItem: ReservationLog = {
      id: 'log-' + Date.now(),
      timestamp: nowStr,
      userId: activeUserId,
      userName,
      action: 'Cancelación de Reserva',
      details: `Reserva cancelada. Motivo: ${cancelReason}`,
    };

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: 'Cancelada' as const,
              cancelReason,
              updatedByUserId: activeUserId,
              updatedByUserName: userName,
              updatedAt: nowStr,
              logs: [logItem, ...(r.logs || [])],
            }
          : r
      )
    );

    return { success: true, message: `Reserva de "${target.clientName}" fue cancelada.` };
  };

  const markReservationFulfilled = (reservationId: string, okNotes?: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return { success: false, message: 'Reserva no encontrada.' };
    if (target.status === 'Cancelada') return { success: false, message: 'No se puede marcar cumplida una reserva cancelada.' };

    const nowStr = getNowStr();
    const activeUser = users.find((u) => u.id === activeUserId);
    const userName = activeUser?.name || 'Usuario Autenticado';

    const logItem: ReservationLog = {
      id: 'log-' + Date.now(),
      timestamp: nowStr,
      userId: activeUserId,
      userName,
      action: 'OK de Cumplimiento (Check-in)',
      details: `Reserva confirmada OK y marcada como CUMPLIDA. Usuario: ${userName}.${okNotes ? ` Nota OK: ${okNotes}` : ''}`,
    };

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: 'Cumplida' as const,
              fulfilledByUserId: activeUserId,
              fulfilledByUserName: userName,
              fulfilledAt: nowStr,
              fulfilledOkNotes: okNotes?.trim() || undefined,
              updatedByUserId: activeUserId,
              updatedByUserName: userName,
              updatedAt: nowStr,
              logs: [logItem, ...(r.logs || [])],
            }
          : r
      )
    );

    return { success: true, message: `OK de Cumplimiento registrado exitosamente por ${userName} para "${target.clientName}".` };
  };

  const [siteConfigs, setSiteConfigs] = useState<SiteConfig[]>([]);
  const [tableConfigs, setTableConfigs] = useState<RestaurantTableConfig[]>([]);
  const [saleTypeConfigs, setSaleTypeConfigs] = useState<SaleTypeConfig[]>([]);

  useEffect(() => {
    posConfigService.getSites().then((data) => {
      setSiteConfigs(data);
    });
    posConfigService.getTables().then((data) => {
      setTableConfigs(data);
    });
    posConfigService.getSaleTypes().then((data) => {
      setSaleTypeConfigs(data);
    });
  }, []);

  // SITIOS METHODS
  const addSiteConfig = async (data: Omit<SiteConfig, 'id'>) => {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'El nombre del sitio es obligatorio (R-S01).' };
    }
    const exists = siteConfigs.some((s) => s.name.toLowerCase() === data.name.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Ya existe un sitio registrado con el nombre "${data.name}" (R-S01).` };
    }
    if (data.order < 0) {
      return { success: false, message: 'El orden debe ser mayor o igual a 0 (R-S03).' };
    }

    const saved = await posConfigService.createSite({
      ...data,
      name: data.name.trim(),
    });

    const newSite: SiteConfig = saved || {
      ...data,
      id: 'site-' + Date.now(),
      name: data.name.trim(),
    };

    setSiteConfigs((prev) => [...prev.filter((s) => s.id !== newSite.id), newSite].sort((a, b) => a.order - b.order));
    return { success: true, message: `Sitio "${newSite.name}" creado exitosamente.` };
  };

  const updateSiteConfig = async (updatedSite: SiteConfig) => {
    if (!updatedSite.name || !updatedSite.name.trim()) {
      return { success: false, message: 'El nombre del sitio es obligatorio.' };
    }
    const exists = siteConfigs.some((s) => s.id !== updatedSite.id && s.name.toLowerCase() === updatedSite.name.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Ya existe otro sitio con el nombre "${updatedSite.name}" (R-S01).` };
    }
    if (updatedSite.order < 0) {
      return { success: false, message: 'El orden debe ser mayor o igual a 0 (R-S03).' };
    }

    if (!updatedSite.id.startsWith('site-')) {
      await posConfigService.updateSite(updatedSite.id, updatedSite);
    }

    setSiteConfigs((prev) =>
      prev.map((s) => (s.id === updatedSite.id ? { ...updatedSite, name: updatedSite.name.trim() } : s)).sort((a, b) => a.order - b.order)
    );

    // Propagate site name changes to tableConfigs (A-S03)
    setTableConfigs((prev) =>
      prev.map((t) => (t.siteId === updatedSite.id ? { ...t, siteName: updatedSite.name.trim() } : t))
    );

    return { success: true, message: `Sitio "${updatedSite.name}" actualizado correctamente.` };
  };

  const toggleSiteStatus = async (siteId: string) => {
    const target = siteConfigs.find((s) => s.id === siteId);
    if (!target) return { success: false, message: 'Sitio no encontrado.' };

    const newStatus = !target.active;
    if (!siteId.startsWith('site-')) {
      await posConfigService.updateSite(siteId, { active: newStatus });
    }
    setSiteConfigs((prev) => prev.map((s) => (s.id === siteId ? { ...s, active: newStatus } : s)));

    return { success: true, message: `Sitio "${target.name}" ${newStatus ? 'activado' : 'desactivado'}.` };
  };

  const deleteSiteConfig = async (siteId: string) => {
    const target = siteConfigs.find((s) => s.id === siteId);
    if (!target) return { success: false, message: 'Sitio no encontrado.' };

    // [R-S02] Bloqueo de Borrado si tiene mesas asociadas
    const hasTables = tableConfigs.some((t) => t.siteId === siteId);
    if (hasTables) {
      return { success: false, message: `No se permite eliminar el sitio "${target.name}" porque posee mesas asociadas (R-S02).` };
    }

    if (!siteId.startsWith('site-')) {
      await posConfigService.deleteSite(siteId);
    }

    setSiteConfigs((prev) => prev.filter((s) => s.id !== siteId));
    return { success: true, message: `Sitio "${target.name}" eliminado.` };
  };

  // MESAS METHODS
  const addTableConfig = async (data: Omit<RestaurantTableConfig, 'id' | 'isFree'>) => {
    if (!data.number || !data.number.trim()) {
      return { success: false, message: 'El número o código de mesa es obligatorio (R-M01).' };
    }
    const exists = tableConfigs.some((t) => t.number.toLowerCase() === data.number.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `El número de mesa "${data.number}" ya existe (R-M01).` };
    }
    if (!data.capacity || data.capacity <= 0) {
      return { success: false, message: 'La capacidad debe ser un número entero mayor a 0 (R-M02).' };
    }
    const targetSite = siteConfigs.find((s) => s.id === data.siteId && s.active);
    if (!targetSite) {
      return { success: false, message: 'El sitio seleccionado no existe o está inactivo (R-M03 / A-S01).' };
    }

    const saved = await posConfigService.createTable({
      ...data,
      number: data.number.trim(),
      siteName: targetSite.name,
      isFree: true,
      active: true,
    });

    const newTable: RestaurantTableConfig = saved || {
      ...data,
      id: 'tbl-cfg-' + Date.now(),
      number: data.number.trim(),
      siteName: targetSite.name,
      isFree: true,
      active: true,
    };

    setTableConfigs((prev) => [...prev.filter((t) => t.id !== newTable.id), newTable]);
    return { success: true, message: `Mesa "${newTable.number}" creada exitosamente.` };
  };

  const updateTableConfig = async (updatedTable: RestaurantTableConfig) => {
    if (!updatedTable.number || !updatedTable.number.trim()) {
      return { success: false, message: 'El número de mesa es obligatorio.' };
    }
    const exists = tableConfigs.some((t) => t.id !== updatedTable.id && t.number.toLowerCase() === updatedTable.number.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Ya existe otra mesa con el número "${updatedTable.number}" (R-M01).` };
    }
    if (!updatedTable.capacity || updatedTable.capacity <= 0) {
      return { success: false, message: 'La capacidad debe ser mayor a 0 (R-M02).' };
    }
    const targetSite = siteConfigs.find((s) => s.id === updatedTable.siteId);
    if (!targetSite) {
      return { success: false, message: 'El sitio asignado no es válido (R-M03).' };
    }

    const finalTable = { ...updatedTable, number: updatedTable.number.trim(), siteName: targetSite.name };
    if (!updatedTable.id.startsWith('tbl-')) {
      await posConfigService.updateTable(updatedTable.id, finalTable);
    }
    setTableConfigs((prev) => prev.map((t) => (t.id === updatedTable.id ? finalTable : t)));
    return { success: true, message: `Mesa "${updatedTable.number}" actualizada correctamente.` };
  };

  const toggleTableStatus = async (tableId: string) => {
    const target = tableConfigs.find((t) => t.id === tableId);
    if (!target) return { success: false, message: 'Mesa no encontrada.' };

    const newActive = !target.active;
    if (!tableId.startsWith('tbl-')) {
      await posConfigService.updateTable(tableId, { active: newActive });
    }
    setTableConfigs((prev) => prev.map((t) => (t.id === tableId ? { ...t, active: newActive } : t)));
    return { success: true, message: `Mesa "${target.number}" ${newActive ? 'activada' : 'desactivada'}.` };
  };

  const toggleTableFree = async (tableId: string) => {
    const target = tableConfigs.find((t) => t.id === tableId);
    if (!target) return { success: false, message: 'Mesa no encontrada.' };

    const newFree = !target.isFree;
    if (!tableId.startsWith('tbl-')) {
      await posConfigService.updateTable(tableId, { isFree: newFree });
    }
    setTableConfigs((prev) => prev.map((t) => (t.id === tableId ? { ...t, isFree: newFree } : t)));
    return { success: true, message: `Mesa "${target.number}" marcada como ${newFree ? 'Libre' : 'Ocupada/No Libre'}.` };
  };

  const deleteTableConfig = async (tableId: string) => {
    const target = tableConfigs.find((t) => t.id === tableId);
    if (!target) return { success: false, message: 'Mesa no encontrada.' };

    // [R-M04] Proteccion de Integridad Referencial (si tiene reservas asociadas)
    const hasReservations = reservations.some((r) => r.tableId === tableId);
    if (hasReservations) {
      return { success: false, message: `No se permite eliminar la mesa "${target.number}" porque registra historial de reservas asociadas (R-M04).` };
    }

    if (!tableId.startsWith('tbl-')) {
      await posConfigService.deleteTable(tableId);
    }

    setTableConfigs((prev) => prev.filter((t) => t.id !== tableId));
    return { success: true, message: `Mesa "${target.number}" eliminada.` };
  };

  // TIPOS DE VENTA METHODS
  const addSaleTypeConfig = async (data: Omit<SaleTypeConfig, 'id'>) => {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'El nombre del tipo de venta es obligatorio (R-TV01).' };
    }
    const exists = saleTypeConfigs.some((st) => st.name.toLowerCase() === data.name.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `El tipo de venta "${data.name}" ya existe (R-TV01).` };
    }

    const saved = await posConfigService.createSaleType({
      ...data,
      name: data.name.trim(),
    });

    const newSt: SaleTypeConfig = saved || {
      ...data,
      id: 'st-' + Date.now(),
      name: data.name.trim(),
    };

    setSaleTypeConfigs((prev) => [...prev.filter((st) => st.id !== newSt.id), newSt]);
    return { success: true, message: `Tipo de Venta "${newSt.name}" registrado exitosamente.` };
  };

  const updateSaleTypeConfig = async (updatedSt: SaleTypeConfig) => {
    if (!updatedSt.name || !updatedSt.name.trim()) {
      return { success: false, message: 'El nombre del tipo de venta es obligatorio.' };
    }
    const exists = saleTypeConfigs.some((st) => st.id !== updatedSt.id && st.name.toLowerCase() === updatedSt.name.trim().toLowerCase());
    if (exists) {
      return { success: false, message: `Ya existe otro tipo de venta con el nombre "${updatedSt.name}" (R-TV01).` };
    }

    if (!updatedSt.id.startsWith('st-')) {
      await posConfigService.updateSaleType(updatedSt.id, updatedSt);
    }

    setSaleTypeConfigs((prev) => prev.map((st) => (st.id === updatedSt.id ? { ...updatedSt, name: updatedSt.name.trim() } : st)));
    return { success: true, message: `Tipo de Venta "${updatedSt.name}" actualizado correctamente.` };
  };

  const toggleSaleTypeStatus = async (stId: string) => {
    const target = saleTypeConfigs.find((st) => st.id === stId);
    if (!target) return { success: false, message: 'Tipo de Venta no encontrado.' };

    const newActive = !target.active;
    if (!stId.startsWith('st-')) {
      await posConfigService.updateSaleType(stId, { active: newActive });
    }
    setSaleTypeConfigs((prev) => prev.map((st) => (st.id === stId ? { ...st, active: newActive } : st)));
    return { success: true, message: `Tipo de Venta "${target.name}" ${newActive ? 'activado' : 'desactivado'}.` };
  };

  const deleteSaleTypeConfig = async (stId: string) => {
    const target = saleTypeConfigs.find((st) => st.id === stId);
    if (!target) return { success: false, message: 'Tipo de Venta no encontrado.' };

    if (!stId.startsWith('st-')) {
      await posConfigService.deleteSaleType(stId);
    }

    setSaleTypeConfigs((prev) => prev.filter((st) => st.id !== stId));
    return { success: true, message: `Tipo de Venta "${target.name}" eliminado.` };
  };

  // ----------------------------------------------------
  // GRUPOS DE OPCIONES Y MODIFICADORES (COMANDAS V2.0)
  // ----------------------------------------------------
  const [productOptionGroups, setProductOptionGroups] = useState<ProductOptionGroup[]>(() => {
    try {
      const saved = localStorage.getItem('plegma_option_groups');
      if (saved) {
        const parsed: ProductOptionGroup[] = JSON.parse(saved);
        // Force grp-002 (Acompañamiento) to have selectionType: 'multiple'
        return parsed.map((g) =>
          g.id === 'grp-002' ? { ...g, selectionType: 'multiple' } : g
        );
      }
    } catch (e) {}
    return INITIAL_OPTION_GROUPS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('plegma_option_groups', JSON.stringify(productOptionGroups));
    } catch (e) {}
  }, [productOptionGroups]);

  const addProductOptionGroup = (group: ProductOptionGroup) => {
    setProductOptionGroups((prev) => [...prev, group]);
    return { success: true, message: `Grupo "${group.name}" creado exitosamente.` };
  };

  const addOptionToGroup = (groupId: string, option: ProductOption) => {
    setProductOptionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, options: [...g.options, option] } : g))
    );
    return { success: true, message: `Opción "${option.name}" agregada.` };
  };

  const deleteOptionFromGroup = (groupId: string, optionId: string) => {
    setProductOptionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g))
    );
    return { success: true, message: `Opción eliminada.` };
  };

  const toggleOptionGroupActive = (groupId: string) => {
    setProductOptionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, active: !g.active } : g))
    );
    return { success: true, message: `Estado de grupo actualizado.` };
  };

  const toggleGroupSelectionType = (groupId: string) => {
    setProductOptionGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextType: 'single' | 'multiple' = g.selectionType === 'multiple' ? 'single' : 'multiple';
          return { ...g, selectionType: nextType };
        }
        return g;
      })
    );
    return {
      success: true,
      message: 'Tipo de selección de grupo actualizado.',
    };
  };

  // ----------------------------------------------------
  // PEDIDOS Y VENTAS (COMMERCIAL ENGINE)
  // ----------------------------------------------------
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);

  const createSaleOrder = async (data: Omit<SaleOrder, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'createdByUserId' | 'createdByUserName' | 't1CreatedAt'>): Promise<{ success: boolean; message: string; order?: SaleOrder }> => {
    // Validation: Mandatory open cash shift to take orders (Observacion 4)
    const activeShift = cashShifts.find((s) => s.status === 'Abierta');
    if (!activeShift) {
      return { success: false, message: 'No hay una Caja de Turno abierta. Es obligatorio realizar la Apertura de Caja para tomar e ingresar pedidos.' };
    }

    const saleType = saleTypeConfigs.find((st) => st.id === data.saleTypeId);
    
    // [R03] Requerimiento de Mesa si Tipo de Venta exige mesa
    if (saleType?.requiresTable && (!data.tableId || !data.tableId.trim())) {
      return { success: false, message: `El canal "${saleType.name}" requiere la asignación obligatoria de una mesa (R03).` };
    }

    // [R04] Requerimiento de Cliente si Tipo de Venta exige cliente
    if (saleType?.requiresClient && (!data.clientId || !data.clientId.trim())) {
      return { success: false, message: `El canal "${saleType.name}" requiere asociar un cliente obligatoriamente (R04).` };
    }

    // [R09] Validación de acompañamiento obligatorio
    for (const item of data.items) {
      if (item.requiresSideOption && (!item.sideOption || !item.sideOption.trim())) {
        return { success: false, message: `El producto "${item.productName}" requiere seleccionar un acompañamiento obligatorio (R09).` };
      }
    }

    const maxNum = saleOrders.reduce((max, o) => Math.max(max, o.orderNumber || 1000), 1000);
    const nextNum = maxNum + 1; // [A01] Correlativo autogenerado
    const nowStr = getNowStr(); // [A02] Timestamp SYS
    const activeUser = users.find((u) => u.id === activeUserId);

    // Dynamic Recalculation (A04)
    const recalculatedTotal = data.items.reduce((acc, i) => acc + i.subtotal, 0);

    const orderToSave: SaleOrder = {
      ...data,
      id: '',
      orderNumber: nextNum,
      createdAt: nowStr,
      t1CreatedAt: nowStr, // T1: Inicio
      totalAmount: recalculatedTotal,
      status: (saleType?.initialOrderStatus as any) || 'Pendiente',
      createdByUserId: activeUserId,
      createdByUserName: activeUser?.name || 'Usuario Autenticado',
    };

    const saved = await saleOrdersService.save(orderToSave);
    const finalOrder = saved || { ...orderToSave, id: 'ord-' + Date.now() };

    setSaleOrders((prev) => [finalOrder, ...prev]);
    return { success: true, message: `Pedido #${finalOrder.orderNumber || nextNum} registrado exitosamente.`, order: finalOrder };
  };

  const updateSaleOrder = async (updatedOrder: SaleOrder): Promise<{ success: boolean; message: string }> => {
    const target = saleOrders.find((o) => o.id === updatedOrder.id);
    if (!target) return { success: false, message: 'Pedido no encontrado.' };

    // [R08] Inmutabilidad de Pedido Facturado (salvo admin)
    if (target.status === 'Facturado' && userRole !== 'admin') {
      return { success: false, message: 'Los pedidos facturados están bloqueados para modificaciones (R08).' };
    }

    // Dynamic Recalculation (A04)
    const recalculatedTotal = updatedOrder.items.reduce((acc, i) => acc + i.subtotal, 0);
    const finalOrderPayload = { ...updatedOrder, totalAmount: recalculatedTotal };

    const saved = await saleOrdersService.save(finalOrderPayload);
    const finalOrder = saved || finalOrderPayload;

    setSaleOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? finalOrder : o)));
    return { success: true, message: `Pedido #${updatedOrder.orderNumber} actualizado correctamente.` };
  };

  const generateComandaPDF = async (orderId: string): Promise<{ success: boolean; message: string; pdfUrl?: string }> => {
    const target = saleOrders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'Pedido no encontrado.' };

    // [R02] Validación de ítems en comanda
    if (!target.items || target.items.length === 0) {
      return { success: false, message: 'No se puede emitir comanda a cocina sin artículos cargados (R02).' };
    }

    const nowStr = getNowStr();
    const pdfUrl = `comanda_${target.orderNumber}.pdf`;
    const newStatus = target.status === 'Pendiente' ? 'Comandado' : target.status;

    await saleOrdersService.updateStatus(orderId, newStatus, { t2ComandaAt: nowStr });

    setSaleOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus as any,
              t2ComandaAt: nowStr, // [A05] Timestamp T2
              comandaPdfUrl: pdfUrl,
            }
          : o
      )
    );

    return { success: true, message: `Comanda emitida y enviada a cocina/barra para Pedido #${target.orderNumber}.`, pdfUrl };
  };

  const updateSaleOrderStatus = async (orderId: string, status: OrderStatus): Promise<{ success: boolean; message: string }> => {
    const target = saleOrders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'Pedido no encontrado.' };

    const nowStr = getNowStr();
    const timestamps: { t3KitchenOutputAt?: string; t4DeliveredAt?: string } = {};

    if (status === 'Listo' && !target.t3KitchenOutputAt) {
      timestamps.t3KitchenOutputAt = nowStr;
    }
    if (status === 'Entregado' && !target.t4DeliveredAt) {
      timestamps.t4DeliveredAt = nowStr;
    }

    await saleOrdersService.updateStatus(orderId, status, timestamps);

    setSaleOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated: SaleOrder = { ...o, status };
        if (status === 'Listo' && !o.t3KitchenOutputAt) {
          updated.t3KitchenOutputAt = nowStr; // [A06] T3 Salida Cocina
        }
        if (status === 'Entregado' && !o.t4DeliveredAt) {
          updated.t4DeliveredAt = nowStr; // [A06] T4 Entrega
        }
        return updated;
      })
    );

    return { success: true, message: `Estado del Pedido #${target.orderNumber} actualizado a "${status}".` };
  };

  const processOrderBilling = async (orderId: string, billing: Omit<OrderBillingInfo, 'billedAt' | 'ticketNumber'>): Promise<{ success: boolean; message: string; ticketNumber?: string }> => {
    const target = saleOrders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'Pedido no encontrado.' };

    // [R01] Validación de ítems en facturación
    if (!target.items || target.items.length === 0) {
      return { success: false, message: 'No se permite facturar un pedido que no posea al menos 1 artículo (R01).' };
    }

    // [R07] Validación de Caja Abierta activa
    const activeShift = cashShifts.find((s) => s.status === 'Abierta');
    if (!activeShift && billing.paymentCondition !== 'Cuenta Corriente') {
      return { success: false, message: 'No se puede procesar facturación sin una Caja de Turno abierta (R07).' };
    }

    // Find Client
    const client = clients.find((c) => c.id === billing.clientId);

    // [R05] Restricción Cta Cte
    if (billing.paymentCondition === 'Cuenta Corriente') {
      if (!client || !client.hasCurrentAccount) {
        return { success: false, message: `El cliente "${billing.clientName}" no está habilitado para Cuenta Corriente (R05).` };
      }
    }

    // [R06] Restricción Consumo Empleado
    if (billing.paymentCondition === 'Consumo Empleado') {
      const isEmployee = employees.some((e) => e.name.toLowerCase() === billing.clientName.toLowerCase() || e.id === billing.clientId);
      if (!isEmployee) {
        return { success: false, message: `La persona "${billing.clientName}" no está registrada como empleado habilitado (R06).` };
      }
    }

    const nowStr = getNowStr();
    const ticketNum = 'TKT-' + String(target.orderNumber).padStart(5, '0');
    const ticketPdf = `ticket_${target.orderNumber}.pdf`;

    const fullBilling: OrderBillingInfo = {
      ...billing,
      billedAt: nowStr,
      ticketNumber: ticketNum,
    };

    // [A07] Financial Impact:
    // If Cash / Contado: record cash movement on active shift line
    if (billing.paymentCondition === 'Contado' && activeShift) {
      const activeLine = cashLines.find((l) => l.shiftId === activeShift.id && l.status === 'Abierta');
      if (activeLine) {
        recordCashMovement({
          lineId: activeLine.id,
          shiftId: activeShift.id,
          type: 'Ticket',
          origin: `Facturación Pedido #${target.orderNumber} - ${target.clientName}`,
          voucherNumber: ticketNum,
          amount: billing.finalTotal,
          notes: `Cobro en ${billing.paymentMethod}`,
        });
      }
    }

    // [A07] If Cuenta Corriente: record current account movement
    if (billing.paymentCondition === 'Cuenta Corriente' && client) {
      const itemDetails = target.items ? target.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ') : '';
      const ccMovement: CurrentAccountMovement = {
        id: 'mov-' + Date.now(),
        clientId: client.id,
        dateTime: nowStr,
        voucherType: 'Ticket',
        type: 'Venta',
        total: billing.finalTotal,
        ticketDetail: `Pedido #${target.orderNumber}${itemDetails ? ' - ' + itemDetails : ''}`,
        ticketNumber: ticketNum,
        lineState: 'Pendiente',
      };
      setCcMovements((prev) => [ccMovement, ...prev]);
    }

    // If Employee Consumption: record employee consumption
    if (billing.paymentCondition === 'Consumo Empleado') {
      const emp = employees.find((e) => e.name.toLowerCase() === billing.clientName.toLowerCase() || e.id === billing.clientId);
      if (emp) {
        addEmployeeConsumptionFromReceipt({
          id: 'ec-' + Date.now(),
          employeeId: emp.id,
          employeeName: emp.name,
          dni: emp.dni || 'N/A',
          date: nowStr,
          orderNumber: String(target.orderNumber),
          amount: billing.finalTotal,
          detail: `Consumo Pedido #${target.orderNumber}`,
          status: 'Pendiente',
        });
      }
    }

    const updatedOrder: SaleOrder = {
      ...target,
      status: 'Facturado' as const,
      ticketPdfUrl: ticketPdf,
      billingDetails: fullBilling,
    };

    await saleOrdersService.save(updatedOrder);

    setSaleOrders((prev) =>
      prev.map((o) => (o.id === orderId ? updatedOrder : o))
    );

    return { success: true, message: `Pedido #${target.orderNumber} facturado exitosamente. Ticket ${ticketNum} emitido.`, ticketNumber: ticketNum };
  };

  const cancelSaleOrder = async (orderId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const target = saleOrders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'Pedido no encontrado.' };

    if (target.status === 'Facturado' && userRole !== 'admin') {
      return { success: false, message: 'No se puede anular un pedido que ya ha sido facturado (R08).' };
    }

    await saleOrdersService.updateStatus(orderId, 'Cancelado');

    setSaleOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelado' as const, generalNotes: reason ? `[CANCELADO]: ${reason}` : o.generalNotes } : o))
    );

    return { success: true, message: `Pedido #${target.orderNumber} anulado.` };
  };

  const [toast, setToast] = useState<ToastNotification | null>(null);

  const hideToast = () => setToast(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({
      id: 'toast-' + Date.now(),
      message,
      type,
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const [branding, setBranding] = useState<BrandingConfig>({
    companyName: 'PLEGMA BARAPP S.A.',
    companySubtitle: 'Gastronomía & Servicios de Restaurante',
    cuit: '30-71289341-9',
    address: 'Av. Libertador 1420, CABA',
    phone: '+54 11 4892-0192',
    email: 'contacto@plegmabarapp.com',
    navigationStyle: 'top',
    menuBgHex: '#0f172a',
    menuTextHex: '#94a3b8',
    menuActiveBgHex: '#f59e0b',
    menuActiveTextHex: '#0f172a',
    menuFontFamily: 'Inter',
    menuFontSize: 'md',

    appBgHex: '#f8fafc',
    cardBgHex: '#ffffff',
    cardBorderHex: '#e2e8f0',
    primaryHex: '#f59e0b',
    buttonBgHex: '#f59e0b',
    buttonTextHex: '#0f172a',

    buttonRadius: 'rounded-xl',
    buttonStyleVariant: 'solid',
    buttonShadowStyle: 'md',
    buttonFontWeight: 'font-bold',
    buttonHoverEffect: 'scale',

    toggleStyle: 'pill',
    toggleActiveHex: '#f59e0b',
    toggleInactiveHex: '#cbd5e1',
    toggleKnobSize: 'md',

    menuIconStrokeWidth: 2,
    menuIconHex: '#94a3b8',
    menuActiveIconHex: '#0f172a',
    submenuIconHex: '#94a3b8',
    submenuActiveIconHex: '#0f172a',

    kanbanColumnBgHex: '#f1f5f9',
    kanbanHeaderBgHex: '#e2e8f0',
    kanbanCardBgHex: '#ffffff',
    kanbanCardBorderHex: '#e2e8f0',
    kanbanDraftHex: '#f59e0b',
    kanbanPendingHex: '#3b82f6',
    kanbanOrderedHex: '#8b5cf6',
    kanbanReceivedHex: '#10b981',

    fontFamily: 'Inter',
    fontSizeScale: 'normal',
    headingFontWeight: 'font-extrabold',
  });

  const updateBranding = (newConfig: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('plegma_branding_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  useEffect(() => {
    try {
      const savedBranding = localStorage.getItem('plegma_branding_config');
      if (savedBranding) {
        setBranding((prev) => ({ ...prev, ...JSON.parse(savedBranding) }));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (branding) {
      // 1. Dynamic Google Fonts Loader for App Font & Menu Font
      const fontsToLoad = Array.from(new Set([branding.fontFamily || 'Inter', branding.menuFontFamily || 'Inter']));
      fontsToLoad.forEach((fontName) => {
        const formattedFontName = fontName.replace(/ /g, '+');
        const fontLinkId = `google-font-${fontName.toLowerCase().replace(/ /g, '-')}`;
        if (!document.getElementById(fontLinkId)) {
          const linkElem = document.createElement('link');
          linkElem.id = fontLinkId;
          linkElem.rel = 'stylesheet';
          linkElem.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@300;400;500;600;700;800;900&display=swap`;
          document.head.appendChild(linkElem);
        }
      });

      document.body.style.fontFamily = `'${branding.fontFamily || 'Inter'}', system-ui, -apple-system, sans-serif`;

      // 2. Set root CSS custom variables for live color application across the app
      const root = document.documentElement;
      if (branding.appBgHex) root.style.setProperty('--app-bg-hex', branding.appBgHex);
      if (branding.menuBgHex) root.style.setProperty('--menu-bg-hex', branding.menuBgHex);
      if (branding.menuTextHex) root.style.setProperty('--menu-text-hex', branding.menuTextHex);
      if (branding.menuActiveBgHex) root.style.setProperty('--menu-active-bg-hex', branding.menuActiveBgHex);
      if (branding.menuActiveTextHex) root.style.setProperty('--menu-active-text-hex', branding.menuActiveTextHex);
      if (branding.primaryHex) root.style.setProperty('--primary-hex', branding.primaryHex);
      if (branding.buttonBgHex) root.style.setProperty('--button-bg-hex', branding.buttonBgHex);
      if (branding.buttonTextHex) root.style.setProperty('--button-text-hex', branding.buttonTextHex);
    }
  }, [branding]);

  const addUser = async (newUser: AppUser) => {
    const saved = await usersService.saveUser(newUser);
    if (saved) {
      setUsers((prev) => [saved, ...(prev || []).filter((u) => u.id !== saved.id)]);
      logAudit('Crear Usuario', 'cliente', saved.id, saved.name);
      return { success: true, user: saved };
    }
    return { success: false };
  };

  const updateUser = async (updatedUser: AppUser) => {
    const saved = await usersService.saveUser(updatedUser);
    if (saved) {
      setUsers((prev) => (prev || []).map((u) => (u.id === saved.id ? saved : u)));
      logAudit('Actualizar Usuario', 'cliente', saved.id, saved.name);
      return { success: true, user: saved };
    }
    return { success: false };
  };

  const deleteUser = async (userId: string) => {
    const success = await usersService.deleteUser(userId);
    if (success) {
      setUsers((prev) => (prev || []).filter((u) => u.id !== userId));
      logAudit('Eliminar Usuario', 'cliente', userId);
    }
  };

  const addProvider = async (newProvider: Provider) => {
    const saved = await providersService.save(newProvider);
    if (saved) {
      setProviders((prev) => [saved, ...(prev || [])]);
    }
  };

  const updateProvider = async (updatedProvider: Provider) => {
    const saved = await providersService.save(updatedProvider);
    if (saved) {
      setProviders((prev) => (prev || []).map((p) => (p.id === saved.id ? saved : p)));
    }
  };

  const deleteProvider = async (providerId: string) => {
    const success = await providersService.delete(providerId);
    if (success) {
      setProviders((prev) => (prev || []).filter((p) => p.id !== providerId));
    }
  };

  const addOrUpdateClient = async (client: Client) => {
    const saved = await clientsService.save(client);
    if (saved) {
      setClients((prev) => {
        const idx = prev.findIndex((c) => c.id === client.id || c.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      logAudit('Guardar Cliente', 'cliente', saved.id, saved.name);
    }
  };

  const deleteClient = async (clientId: string) => {
    const success = await clientsService.delete(clientId);
    if (success) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    }
  };

  const updateUserCustomPermissions = (userId: string, perms: Partial<UserPermissions>) => {
    setUsers((prev) =>
      (prev || []).map((u) => (u.id === userId ? { ...u, customPermissions: { ...u.customPermissions, ...perms } } : u))
    );
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permission) return true;
    const safeUsers = Array.isArray(users) ? users : [];
    const activeUser =
      safeUsers.find((u) => u && u.id === activeUserId) ||
      safeUsers.find((u) => u && u.role === userRole);
    if (activeUser?.customPermissions && activeUser.customPermissions[permission] !== undefined) {
      return Boolean(activeUser.customPermissions[permission]);
    }
    const rolePerms =
      (rolePermissions && rolePermissions[userRole]) ||
      DEFAULT_ROLE_PERMISSIONS[userRole] ||
      DEFAULT_ROLE_PERMISSIONS.admin;
    return Boolean(rolePerms?.[permission]);
  };

  const updateRolePermissions = (role: UserRole, newPerms: Partial<UserPermissions>) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...newPerms,
      },
    }));
  };

  // Load from LocalStorage
  useEffect(() => {
    try {
      localStorage.removeItem('gastronomic_erp_state_v1');
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.providers) setProviders(parsed.providers);
        if (parsed.items) setItems(parsed.items);
        if (parsed.providerItems) setProviderItems(parsed.providerItems);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.stockCounts) setStockCounts(parsed.stockCounts);
        if (parsed.receptionHours) setReceptionHours(parsed.receptionHours);
        if (parsed.priceHistory) setPriceHistory(parsed.priceHistory);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      const payload = {
        providers,
        items,
        providerItems,
        orders,
        stockCounts,
        receptionHours,
        priceHistory,
        expenses,
        auditLogs,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving localStorage', e);
    }
  }, [providers, items, providerItems, orders, stockCounts, receptionHours, priceHistory, expenses, auditLogs]);

  // Log audit helper
  const logAudit = async (action: string, entityType: AuditLog['entityType'], entityId: string, details?: string) => {
    const userId = `usr-${userRole}`;
    const userName = `Usuario (${userRole.toUpperCase()})`;
    const timestamp = getLocalDatetimeString();

    const created = await auditLogsService.create({
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp,
    });

    const newLog: AuditLog = created || {
      id: 'aud-' + Date.now(),
      timestamp,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // State derivation for a provider based on active orders & stock counts
  const getProviderState = (providerId: string): ProcessState => {
    // Check if there is an active order for this provider
    const providerOrders = orders.filter((o) => o.providerId === providerId);
    if (providerOrders.length > 0) {
      // Find the most recent order
      const latestOrder = [...providerOrders].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      if (latestOrder.status === 'Pendiente de entrega') return 'Pendiente de entrega';
      if (latestOrder.status === 'Entregado / Ingresado') {
        if (latestOrder.paymentStatus === 'Pendiente de pago' || latestOrder.paymentStatus === 'Pago parcial') {
          return 'Pendiente de pago';
        }
        if (latestOrder.paymentStatus === 'Pagado') return 'Pagado';
        return 'Entregado / Ingresado';
      }
      if (latestOrder.status === 'Pedido confirmado') return 'Pedido confirmado';
      if (latestOrder.status === 'Pagado') return 'Pagado';
      if (latestOrder.status === 'Finalizado') return 'Finalizado';
    }

    // Check count status
    const providerCounts = stockCounts.filter((c) => c.providerId === providerId);
    if (providerCounts.length > 0) {
      const latestCount = [...providerCounts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      if (latestCount.status === 'finalizado') return 'Conteo finalizado';
    }

    return 'Pendiente de conteo';
  };

  const getProviderActiveOrder = (providerId: string): Order | undefined => {
    const providerOrders = orders.filter((o) => o.providerId === providerId);
    if (providerOrders.length === 0) return undefined;
    return [...providerOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const getProviderActiveCount = (providerId: string): StockCount | undefined => {
    const providerCounts = stockCounts.filter((c) => c.providerId === providerId);
    if (providerCounts.length === 0) return undefined;
    return [...providerCounts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  // Reorder provider priority
  const reorderProviderInDay = (providerId: string, day: DayOfWeek, direction: 'up' | 'down') => {
    setProviders((prev) => {
      const dayProviders = prev
        .filter((p) => (p.orderDays ? p.orderDays.includes(day) : true))
        .sort((a, b) => (a.priority || 0) - (b.priority || 0));

      const index = dayProviders.findIndex((p) => p.id === providerId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= dayProviders.length) return prev;

      // Swap priorities
      const curr = dayProviders[index];
      const target = dayProviders[targetIndex];

      return prev.map((p) => {
        if (p.id === curr.id) return { ...p, priority: target.priority };
        if (p.id === target.id) return { ...p, priority: curr.priority };
        return p;
      });
    });
    logAudit('Reordenar Proveedores', 'proveedor', providerId, `Mover prioridad en día ${day}`);
  };

  const moveProviderToPosition = (
    draggedProviderId: string,
    sourceDay: DayOfWeek,
    targetDay: DayOfWeek,
    targetProviderId?: string
  ) => {
    setProviders((prev) => {
      const dragged = prev.find((p) => p.id === draggedProviderId);
      if (!dragged) return prev;

      let updatedProviders = [...prev];

      // 1. Update orderDays if dragged across day columns
      if (sourceDay !== targetDay) {
        const currentOrderDays = dragged.orderDays || [];
        const newOrderDays = Array.from(
          new Set([...currentOrderDays.filter((d) => d !== sourceDay), targetDay])
        );
        updatedProviders = updatedProviders.map((p) =>
          p.id === draggedProviderId ? { ...p, orderDays: newOrderDays } : p
        );
      }

      // Helper to get priority for day
      const getPriority = (p: Provider, day: DayOfWeek) => {
        if (p.dayPriorities && p.dayPriorities[day] !== undefined) {
          return p.dayPriorities[day]!;
        }
        return p.priority || 999;
      };

      // 2. Reorder priorities within targetDay column independently
      const targetDayProviders = updatedProviders
        .filter((p) => (p.orderDays ? p.orderDays.includes(targetDay) : true))
        .sort((a, b) => getPriority(a, targetDay) - getPriority(b, targetDay));

      const draggedIdx = targetDayProviders.findIndex((p) => p.id === draggedProviderId);
      if (draggedIdx === -1) return updatedProviders;

      const [removed] = targetDayProviders.splice(draggedIdx, 1);

      let insertIdx = targetDayProviders.length;
      if (targetProviderId) {
        const targetIdx = targetDayProviders.findIndex((p) => p.id === targetProviderId);
        if (targetIdx !== -1) {
          insertIdx = targetIdx;
        }
      }

      targetDayProviders.splice(insertIdx, 0, removed);

      // Assign independent priority for targetDay ONLY
      const dayPriorityMap = new Map<string, number>();
      targetDayProviders.forEach((p, idx) => {
        dayPriorityMap.set(p.id, idx + 1);
      });

      return updatedProviders.map((p) => {
        if (dayPriorityMap.has(p.id)) {
          const newDayPriorities = {
            ...(p.dayPriorities || {}),
            [targetDay]: dayPriorityMap.get(p.id)!,
          };
          return { ...p, dayPriorities: newDayPriorities };
        }
        return p;
      });
    });

    logAudit('Drag & Drop Proveedor', 'proveedor', draggedProviderId, `Arrastrar a ${targetDay}`);
  };

  const updateProviderDays = (providerId: string, orderDays: DayOfWeek[], deliveryDays: DayOfWeek[]) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, orderDays, deliveryDays } : p))
    );
    logAudit('Actualizar Días de Pedido/Entrega', 'proveedor', providerId);
  };

  // Save stock count
  const saveStockCount = (count: StockCount) => {
    setStockCounts((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === count.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = count;
        return copy;
      }
      return [count, ...prev];
    });

    // If final, update stock in items
    if (count.status === 'finalizado') {
      setItems((prevItems) => {
        return prevItems.map((item) => {
          const countItem = count.items.find((ci) => ci.itemId === item.id);
          if (countItem) {
            return {
              ...item,
              currentStock: countItem.currentStock,
            };
          }
          return item;
        });
      });
    }

    logAudit(
      count.status === 'finalizado' ? 'Finalizar Conteo Stock' : 'Guardar Borrador Conteo',
      'conteo',
      count.id,
      `Conteo #${count.countNumber} para proveedor`
    );
  };

  // Create Order
  const deleteItem = async (itemId: string) => {
    const success = await itemsService.delete(itemId);
    if (success) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      setProviderItems((prev) => prev.filter((pi) => pi.itemId !== itemId));
    }
  };

  const createOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    logAudit('Crear Pedido', 'pedido', order.id, `Pedido #${order.orderNumber} por $${order.estimatedTotal.toLocaleString('es-AR')}`);
  };

  const updateOrderStatus = (orderId: string, newStatus: ProcessState) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    logAudit('Cambiar Estado de Pedido', 'pedido', orderId, `Nuevo estado: ${newStatus}`);
  };

  // Receive Goods (Ingreso de Mercadería)
  const receiveGoods = (
    orderId: string,
    receivedItems: { itemId: string; receivedQty: number; price?: number }[],
    notes: string,
    invoiceNumber: string,
    deliveryType: 'completa' | 'parcial',
    paymentStatus: Order['paymentStatus'],
    paymentDetails?: {
      amount: number;
      method: Order['paymentMethod'];
      account: string;
      receiptNumber?: string;
    }
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    let receivedTotalSum = 0;

    // 1. Update items stock & check for price updates
    setItems((prevItems) =>
      prevItems.map((item) => {
        const rec = receivedItems.find((r) => r.itemId === item.id);
        if (!rec) return item;

        const newStock = item.currentStock + rec.receivedQty;
        let newPrice = item.currentPrice;

        if (rec.price && rec.price !== item.currentPrice) {
          newPrice = rec.price;

          // Log price history
          const oldP = item.currentPrice;
          const varPct = Number((((rec.price - oldP) / oldP) * 100).toFixed(2));
          const priceEntry: PriceHistoryEntry = {
            id: 'ph-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            itemId: item.id,
            providerId: targetOrder.providerId,
            date: getLocalDateString(),
            oldPrice: oldP,
            newPrice: rec.price,
            variationPercentage: varPct,
            userId: `usr-${userRole}`,
            orderId,
            quantity: rec.receivedQty,
          };
          setPriceHistory((ph) => [priceEntry, ...ph]);
          logAudit('Actualización de Precio en Recepción', 'precio', item.id, `${item.name}: de $${oldP} a $${rec.price} (${varPct}%)`);
        }

        const itemTotal = rec.receivedQty * newPrice;
        receivedTotalSum += itemTotal;

        return {
          ...item,
          currentStock: newStock,
          currentPrice: newPrice,
        };
      })
    );

    // 2. Update order status
    const isPaid = paymentStatus === 'Pagado';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        const updatedOrderItems = o.items.map((oi) => {
          const rec = receivedItems.find((r) => r.itemId === oi.itemId);
          return rec ? { ...oi, receivedQty: rec.receivedQty } : oi;
        });

        const finalStatus: ProcessState = isPaid
          ? 'Pagado'
          : paymentStatus === 'Pendiente de pago'
          ? 'Pendiente de pago'
          : 'Entregado / Ingresado';

        return {
          ...o,
          status: finalStatus,
          receptionDate: getLocalDatetimeString(),
          receptionNotes: notes,
          invoiceOrReceiptNumber: invoiceNumber,
          deliveryType,
          items: updatedOrderItems,
          finalReceivedTotal: receivedTotalSum || o.estimatedTotal,
          paymentStatus,
          paidAmount: isPaid ? (paymentDetails?.amount ?? receivedTotalSum) : (paymentDetails?.amount ?? 0),
          remainingDebt: isPaid ? 0 : (receivedTotalSum - (paymentDetails?.amount ?? 0)),
          paymentMethod: paymentDetails?.method,
          paymentAccount: paymentDetails?.account,
          paymentReceiptNumber: paymentDetails?.receiptNumber,
          paymentDate: isPaid ? getLocalDatetimeString() : undefined,
        };
      })
    );

    // 3. If paid, create expense record
    if (paymentDetails && paymentDetails.amount > 0) {
      const exp: ExpenseRecord = {
        id: 'exp-' + Date.now(),
        date: getLocalDatetimeString(),
        providerId: targetOrder.providerId,
        orderId,
        amount: paymentDetails.amount,
        account: paymentDetails.account,
        paymentMethod: paymentDetails.method || 'Efectivo',
        receiptNumber: paymentDetails.receiptNumber || invoiceNumber,
        notes: `Pago al ingresar pedido #${targetOrder.orderNumber}`,
      };
      setExpenses((prev) => [exp, ...prev]);
    }

    logAudit(
      'Ingreso de Mercadería Registrado',
      'recepcion',
      orderId,
      `Pedido #${targetOrder.orderNumber} - Entrega ${deliveryType}. Total: $${receivedTotalSum.toLocaleString('es-AR')}`
    );
  };

  // Record Payment
  const recordPayment = (
    orderId: string,
    amount: number,
    method: NonNullable<Order['paymentMethod']>,
    account: string,
    receiptNumber?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        const currentPaid = o.paidAmount || 0;
        const newPaidTotal = currentPaid + amount;
        const totalAmount = o.finalReceivedTotal || o.estimatedTotal;
        const newDebt = Math.max(0, totalAmount - newPaidTotal);
        const isFullyPaid = newDebt === 0;

        return {
          ...o,
          paymentStatus: isFullyPaid ? 'Pagado' : 'Pago parcial',
          status: isFullyPaid ? 'Pagado' : 'Pendiente de pago',
          paidAmount: newPaidTotal,
          remainingDebt: newDebt,
          paymentMethod: method,
          paymentAccount: account,
          paymentReceiptNumber: receiptNumber || o.paymentReceiptNumber,
          paymentDate: getLocalDatetimeString(),
        };
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const exp: ExpenseRecord = {
        id: 'exp-' + Date.now(),
        date: getLocalDatetimeString(),
        providerId: targetOrder.providerId,
        orderId,
        amount,
        account,
        paymentMethod: method,
        receiptNumber,
        notes: `Registro de pago a pedido #${targetOrder.orderNumber}`,
      };
      setExpenses((prev) => [exp, ...prev]);
    }

    logAudit('Registro de Pago', 'pago', orderId, `Pago de $${amount.toLocaleString('es-AR')} mediante ${method} (${account})`);
  };

  const updateReceptionHours = (config: ReceptionHoursConfig) => {
    setReceptionHours(config);
    logAudit('Actualizar Horarios de Recepción', 'proveedor', 'config-global');
  };

  const addOrUpdateProvider = async (provider: Provider) => {
    const saved = await providersService.save(provider);
    if (saved) {
      setProviders((prev) => {
        const idx = prev.findIndex((p) => p.id === provider.id || p.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      logAudit('Guardar Proveedor', 'proveedor', saved.id, saved.name);
    }
  };

  const addOrUpdateItem = async (item: Item, providerRelations?: Partial<ProviderItemRelation>[]) => {
    const savedItem = await itemsService.save(item);
    if (!savedItem) return;

    const existingItem = items.find((i) => i.id === item.id || i.id === savedItem.id);
    if (existingItem && existingItem.currentPrice !== savedItem.currentPrice) {
      const oldPrice = existingItem.currentPrice;
      const varPct = Number((((savedItem.currentPrice - oldPrice) / oldPrice) * 100).toFixed(2));
      const priceEntry: PriceHistoryEntry = {
        id: 'ph-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        itemId: savedItem.id,
        providerId: 'manual',
        date: getLocalDateString(),
        oldPrice: oldPrice,
        newPrice: savedItem.currentPrice,
        variationPercentage: varPct,
        userId: `usr-${userRole}`,
      };
      setPriceHistory((ph) => [priceEntry, ...ph]);
      logAudit('Actualización de Precio Manual', 'precio', savedItem.id, `${savedItem.name}: de $${oldPrice} a $${savedItem.currentPrice} (${varPct}%)`);
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id || i.id === savedItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedItem;
        return copy;
      }
      return [savedItem, ...prev];
    });

    if (providerRelations && providerRelations.length > 0) {
      for (const rel of providerRelations) {
        if (!rel.providerId) continue;
        const savedRel = await itemsService.saveProviderRelation({
          ...rel,
          itemId: savedItem.id,
        });
        if (savedRel) {
          setProviderItems((prev) => {
            const idx = prev.findIndex((r) => r.providerId === savedRel.providerId && r.itemId === savedRel.itemId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedRel;
              return copy;
            }
            return [...prev, savedRel];
          });
        }
      }
    }

    logAudit('Guardar Insumo', 'conteo', savedItem.id, savedItem.name);
  };

  const resetToDefaults = () => {
    setProviders(INITIAL_PROVIDERS);
    setItems(INITIAL_ITEMS);
    setProviderItems(INITIAL_PROVIDER_ITEMS);
    setOrders(INITIAL_ORDERS);
    setStockCounts([]);
    setReceptionHours(INITIAL_RECEPTION_HOURS);
    setPriceHistory(INITIAL_PRICE_HISTORY);
    setExpenses([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        users,
        addUser,
        updateUser,
        deleteUser,
        updateUserCustomPermissions,
        activeUserId,
        setActiveUserId,
        rolePermissions,
        hasPermission,
        updateRolePermissions,
        providers,
        addProvider,
        updateProvider,
        deleteProvider,
        items,
        deleteItem,
        providerItems,
        orders,
        stockCounts,
        receptionHours,
        priceHistory,
        expenses,
        auditLogs,
        branding,
        updateBranding,
        employees,
        addOrUpdateEmployee,
        toggleEmployeeStatus,
        addHourlyRateLog,
        clockRecords,
        clockIn,
        clockOut,
        correctClockRecord,
        voidClockRecord,
        employeeConsumptions,
        addEmployeeConsumptionFromReceipt,
        employeeAdvances,
        addOrUpdateAdvance,
        voidAdvance,
        payruns,
        createPayrun,
        markEmployeePaid,
        unmarkEmployeePaid,
        voidPayrun,
        cashShifts,
        cashLines,
        cashMovements,
        masterCashBoxes,
        openCashShift,
        addCashLine,
        recordCashMovement,
        withdrawCashToMaster,
        transferCashBetweenLines,
        closeCashLine,
        closeCashShift,
        reconcileCashShift,
        voidCashShift,
        restaurantTables,
        reservations,
        addReservation,
        updateReservation,
        cancelReservation,
        markReservationFulfilled,
        checkOverbooking,
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
        saleOrders,
        createSaleOrder,
        updateSaleOrder,
        generateComandaPDF,
        updateSaleOrderStatus,
        processOrderBilling,
        cancelSaleOrder,
        productOptionGroups,
        addProductOptionGroup,
        addOptionToGroup,
        deleteOptionFromGroup,
        toggleOptionGroupActive,
        toggleGroupSelectionType,
        ccMovements,
        setCcMovements,
        ccReceipts,
        setCcReceipts,
        toast,
        showToast,
        hideToast,
        getProviderState,
        getProviderActiveOrder,
        getProviderActiveCount,
        reorderProviderInDay,
        moveProviderToPosition,
        updateProviderDays,
        saveStockCount,
        createOrder,
        updateOrderStatus,
        receiveGoods,
        recordPayment,
        updateReceptionHours,
        addOrUpdateProvider,
        clients,
        addOrUpdateClient,
        deleteClient,
        addOrUpdateItem,
        resetToDefaults,
        itemCategories,
        itemSubcategories,
        itemUnits,
        setItemCategories: saveItemCategories as any,
        setItemSubcategories: saveItemSubcategories as any,
        setItemUnits: saveItemUnits as any,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
