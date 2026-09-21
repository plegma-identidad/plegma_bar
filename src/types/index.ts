export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export type ProcessState =
  | 'Pendiente de conteo'
  | 'Conteo finalizado'
  | 'Pedido confirmado'
  | 'Pendiente de entrega'
  | 'Entregado / Ingresado'
  | 'Pendiente de pago'
  | 'Pagado'
  | 'Finalizado';

export type UserRole = 'compras' | 'recepcion' | 'caja' | 'admin';

export interface Provider {
  id: string;
  code: string;
  name: string;
  commercialName?: string;
  rubro?: string; // e.g., Lácteos, Carnes, Bebidas, Verduras, Almacén
  logoUrl?: string;
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cuit?: string;
  address?: string;
  subrubro?: string;
  notes?: string;

  // Planning
  orderDays?: DayOfWeek[];
  deliveryDays?: DayOfWeek[];
  priority?: number; // 1 = highest
  dayPriorities?: Partial<Record<DayOfWeek, number>>;
  purchaseFrequency?: 'Semanal' | 'Bisemanal' | 'Diario' | 'Quincenal';
  cutoffTime?: string; // e.g., "14:00"
  habitualLeadTimeDays?: number;
  operationalNotes?: string;

  // Commercial
  currentAccount?: boolean;
  acceptsCash?: boolean;
  acceptsTransfer?: boolean;
  acceptsCheque?: boolean;
  paymentTermDays?: number;
  paymentCondition?: string; // e.g., "Contado", "7 días", "Cuenta Corriente 15 días"
  commercialNotes?: string;

  // Banking
  bankName?: string;
  accountOwner?: string;
  ownerCuit?: string;
  alias?: string;
  cbuCvu?: string;

  // Status & Priority
  active: boolean;
}

export type PurchaseStatus = 'Recibida' | 'Anulada' | 'En Proceso';
export type PaymentStatus = 'Pagada' | 'Pendiente' | 'Parcial' | 'Anulada';

export interface ProviderPurchase {
  id: string;
  providerId: string;
  purchaseDate: string; // [SYS]
  voucherNumber: string; // Comprobante
  totalAmount: number; // [AUTO]
  paidAmount: number; // [AUTO]
  purchaseStatus: PurchaseStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  storageUnit: string; // e.g., "kg", "L", "un"
  purchaseUnit: string; // e.g., "caja", "horma", "bolsa 10kg"
  packQuantity: number; // un per purchase unit
  location: string; // Depósito / Heladera / Cama Fría
  currentStock: number;
  minStock: number;
  maxStock: number;
  currentPrice: number;
  active: boolean;
  notes?: string;
}

export interface ProviderItemRelation {
  id: string;
  providerId: string;
  itemId: string;
  supplierProductCode: string;
  purchaseUnit: string;
  packQuantity: number;
  minStock: number;
  maxStock: number;
  lastPurchasePrice: number;
  lastPurchaseDate?: string;
  lastPriceHikeDate?: string;
  isPrimarySupplier: boolean;
  active: boolean;
  commercialNotes?: string;
}

export interface StockCountItem {
  itemId: string;
  previousStock: number;
  currentStock: number;
  receivedSinceLastCount: number;
  estimatedConsumption: number; // (prev + received - current)
  notes?: string;
}

export interface StockCount {
  id: string;
  countNumber: string;
  providerId: string;
  date: string; // ISO string
  userId: string;
  userName: string;
  status: 'borrador' | 'finalizado';
  items: StockCountItem[];
  notes?: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  unit: string;
  suggestedQty: number;
  finalQty: number;
  receivedQty?: number;
  referencePrice: number;
  itemNotes?: string;
}

export interface ReceptionHoursConfig {
  morningStart: string; // e.g., "08:00"
  morningEnd: string;   // e.g., "12:00"
  morningActive: boolean;
  afternoonStart: string; // e.g., "16:00"
  afternoonEnd: string;   // e.g., "19:00"
  afternoonActive: boolean;
  additionalNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string; // ISO string
  providerId: string;
  expectedDeliveryDate: string;
  userId: string;
  userName: string;
  status: ProcessState;
  items: OrderItem[];
  generalNotes?: string;
  receptionHoursSnapshot: ReceptionHoursConfig;
  
  // Amounts
  estimatedTotal: number;
  finalReceivedTotal?: number;
  
  // Receptions
  receptionDate?: string;
  receptionNotes?: string;
  invoiceOrReceiptNumber?: string;
  deliveryType?: 'completa' | 'parcial';
  
  // Payments
  paymentStatus: 'Pagado' | 'Pendiente de pago' | 'Pago parcial' | 'Cuenta corriente' | 'Sin cargo';
  paidAmount?: number;
  remainingDebt?: number;
  paymentDate?: string;
  paymentMethod?: 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta' | 'Cuenta corriente';
  paymentAccount?: string; // e.g., "Caja Principal", "Banco Galicia", "Mercado Pago"
  paymentReceiptNumber?: string;
}

export interface PriceHistoryEntry {
  id: string;
  itemId: string;
  providerId: string;
  date: string;
  oldPrice: number;
  newPrice: number;
  variationPercentage: number;
  userId: string;
  orderId?: string;
  quantity?: number; // Cantidad ingresada en la compra
}

export interface ExpenseRecord {
  id: string;
  date: string;
  providerId: string;
  orderId: string;
  amount: number;
  account: string;
  paymentMethod: string;
  receiptNumber?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'conteo' | 'pedido' | 'recepcion' | 'precio' | 'pago' | 'proveedor' | 'cliente' | 'insumo' | 'configuracion';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export type MovementType = 'Venta' | 'Recibo' | 'Ajuste';
export type LineState = 'Pendiente' | 'Seleccionada' | 'Pagada';

export interface CurrentAccountMovement {
  id: string;
  clientId: string;
  dateTime: string;
  voucherType: string;
  type: MovementType;
  total: number;
  ticketDetail?: string;
  ticketNumber?: string;
  lineState: LineState;
}

export interface Client {
  id: string;
  code: string;
  name: string; // Cliente / Razón Social (Obligatorio)
  phone: string; // Teléfono (Obligatorio)
  address: string; // Dirección (Obligatorio)
  hasCurrentAccount: boolean; // Cuenta Corriente (Sí/No, Obligatorio)
  differentiatedBilling: boolean; // Cobro Diferenciado (Sí/No, Obligatorio, por defecto No)
  isDefault: boolean; // Por Defecto (Sí/No, Obligatorio)
  isEmployee?: boolean; // Es Empleado (Sí/No, Obligatorio)
  isGeneric?: boolean;
  debt: number; // Deuda Moneda [AUTO]
  active: boolean; // Activo (Sí/No, Obligatorio)
  notes?: string; // Observaciones (Texto largo, opcional)
  geolocation?: string; // Geolocalización

  clientType?: 'Salon' | 'Barra' | 'Eventos' | 'Delivery' | 'Corporativo';
  contactName?: string;
  email?: string;
  cuit?: string;
  categoryId?: string;
}

export type ModuleActionLevel = 'none' | 'view' | 'create' | 'edit' | 'full';

export interface ModuleAccessMatrix {
  kanban: ModuleActionLevel;
  inbox: ModuleActionLevel;
  items: ModuleActionLevel;
  dashboard: ModuleActionLevel;
  audit: ModuleActionLevel;
  maestros: ModuleActionLevel;
}

export interface GranularRole {
  id: string;
  name: string;
  description: string;
  moduleAccess: ModuleAccessMatrix;
}

export interface UserProfile {
  id: string;
  name: string;
  description: string;
}

export interface AppUser {
  id: string;
  dni: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profileId?: string;
  profileName?: string;
  assignedRoleIds: string[];
  role?: UserRole;
  status: 'Activo' | 'Inactivo';
  lastAccess?: string;
  customPermissions?: Partial<UserPermissions>;
}

export interface UserPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInlineCreate: boolean;
  canApprovePayment: boolean;
  canManageUsers: boolean;
}

export interface RoleProfile {
  id: string;
  name: string;
  roleKey: UserRole;
  description: string;
  permissions: UserPermissions;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface ConfigOption {
  id: string;
  name: string;
  active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'Frío' | 'Seco' | 'Cocina' | 'Barra' | 'General';
  responsibleName?: string;
  active: boolean;
}

export type NavigationStyle = 'top' | 'sidebar';
export type ButtonStyleVariant = 'solid' | 'outline' | 'glass' | 'gradient';
export type ButtonShadowStyle = 'none' | 'sm' | 'md' | 'xl';
export type ButtonRadius = 'rounded-full' | 'rounded-2xl' | 'rounded-xl' | 'rounded-lg' | 'rounded-none';
export type ToggleStyle = 'pill' | 'square' | 'ios';
export type FontFamilyOption =
  | 'Inter'
  | 'Outfit'
  | 'Roboto'
  | 'Plus Jakarta Sans'
  | 'Poppins'
  | 'Space Grotesk'
  | 'Montserrat'
  | 'Playfair Display'
  | 'Raleway'
  | 'Oswald'
  | 'Lora'
  | 'Fira Code'
  | 'Cinzel';

export interface BrandingConfig {
  // Brand Logo & Company Details
  logoUrl?: string;
  companyName?: string;
  companySubtitle?: string;
  cuit?: string;
  address?: string;
  phone?: string;
  email?: string;

  // Navigation Layout
  navigationStyle: NavigationStyle;

  // Dedicated Menu Customization
  menuBgHex: string;
  menuTextHex: string;
  menuActiveBgHex: string;
  menuActiveTextHex: string;
  menuFontFamily: FontFamilyOption;
  menuFontSize: 'sm' | 'md' | 'lg';

  // HEX Colors per Component
  appBgHex: string;
  cardBgHex: string;
  cardBorderHex: string;
  primaryHex: string;
  buttonBgHex: string;
  buttonTextHex: string;

  // Advanced Button Properties
  buttonRadius: ButtonRadius;
  buttonStyleVariant: ButtonStyleVariant;
  buttonShadowStyle: ButtonShadowStyle;
  buttonFontWeight: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold' | 'font-extrabold';
  buttonHoverEffect: 'none' | 'scale' | 'lift' | 'glow';
  buttonFontFamily?: FontFamilyOption;

  // Toggle Switch Properties
  toggleStyle: ToggleStyle;
  toggleActiveHex: string;
  toggleInactiveHex: string;
  toggleKnobSize: 'sm' | 'md' | 'lg';

  // Menu Icon Customization
  menuIconStrokeWidth?: number;
  menuIconHex?: string;
  menuActiveIconHex?: string;
  submenuIconHex?: string;
  submenuActiveIconHex?: string;

  // Kanban Board Customization
  kanbanColumnBgHex?: string;
  kanbanHeaderBgHex?: string;
  kanbanCardBgHex?: string;
  kanbanCardBorderHex?: string;
  kanbanDraftHex?: string;
  kanbanPendingHex?: string;
  kanbanOrderedHex?: string;
  kanbanReceivedHex?: string;

  // Expanded Typography Options
  fontFamily: FontFamilyOption;
  fontSizeScale: 'compact' | 'normal' | 'large';
  headingFontWeight: 'font-bold' | 'font-extrabold' | 'font-black';
}

// ----------------------------------------------------
// RECURSOS HUMANOS (RR.HH.) - EMPLEADOS TYPES
// ----------------------------------------------------

export type EmployeeDayOfWeek =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';

export interface HourlyRateLog {
  id: string;
  employeeId: string;
  timestamp: string; // Fecha Hora Modificación [SYS]
  oldPrice: number; // Valor Anterior [AUTO]
  newPrice: number; // Valor Nuevo
  percentageIncrease: number; // % Aumento = ((Nuevo - Anterior) / Anterior) * 100 [AUTO]
  modifiedBy: string; // Usuario Modificación [EXT]
  notes?: string; // Observaciones
}

export interface WorkScheduleItem {
  id: string;
  employeeId: string;
  day: EmployeeDayOfWeek;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "16:00"
  specialHourlyRate?: number; // Moneda (Tarifa especial)
  active: boolean; // Si / No
  notes?: string;
}

export interface Employee {
  id: string;
  dni: string; // Número, Obligatorio, Único
  name: string; // Texto, Obligatorio (Nombre y apellido)
  address: string; // Texto, Obligatorio (Domicilio)
  phone: string; // Texto/Número, Obligatorio
  birthDate?: string; // Fecha
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  position: string; // Lista [CFG] Puestos, Obligatorio
  profile: string; // Lista [CFG] Perfiles, Obligatorio
  loginEmail?: string; // Email
  isSharedEmail?: boolean; // Si / No
  enableClockIn: boolean; // Si / No, Obligatorio
  hourlyRate: number; // Moneda, Obligatorio
  isPartner: boolean; // Si / No, Obligatorio
  relatedProviderId?: string; // Lista [EXT] Proveedores
  active: boolean; // Si / No, Obligatorio

  // Datos de Cuenta / Pago
  bankCompany?: 'Mercado Pago' | 'Naranja X' | 'Banco' | 'Ualá' | 'Otra';
  accountType?: 'Caja de Ahorro' | 'Cuenta Corriente' | 'CVU';
  cbuCvu?: string;
  alias?: string;

  // Logs & Work Schedule
  hourlyRateLogs?: HourlyRateLog[];
  schedule?: WorkScheduleItem[];
}

export type ClockState = 'Abierta' | 'Cerrada' | 'Corregida' | 'Anulada';

export interface ClockRecord {
  id: string;
  employeeId: string;
  dni: string;
  employeeName: string;
  checkIn: string; // YYYY-MM-DD HH:mm:ss
  checkOut?: string; // YYYY-MM-DD HH:mm:ss
  hoursWorked?: number; // Duration in hours (e.g. 7.5)
  hourlyRate: number; // Frozen rate at check-in time
  totalCost?: number; // hoursWorked * hourlyRate
  state: ClockState;
  modifiedBy?: string;
  modificationReason?: string;
  modifiedAt?: string;
  notes?: string;
}

export type AdvanceStatus = 'Pendiente' | 'En descuento' | 'Descontado' | 'Anulado';

export interface EmployeeConsumption {
  id: string;
  employeeId: string;
  employeeName: string;
  dni: string;
  date: string; // YYYY-MM-DD HH:mm
  orderNumber: string;
  amount: number;
  detail: string;
  liquidationPeriod?: string; // e.g. "Julio/2026"
  status: 'Pendiente' | 'Aplicado';
}

export interface AdvanceInstallment {
  installmentNumber: number;
  amount: number;
  liquidationPeriod: string; // e.g. "Julio/2026"
  status: 'Pendiente' | 'Aplicado';
  appliedIn?: string;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  dni: string;
  date: string; // YYYY-MM-DD HH:mm
  amount: number;
  detail?: string;
  paymentMethod?: string;
  cashRegister?: string;
  liquidationStartPeriod: string; // e.g. "Julio/2026"
  isInstallments: boolean;
  installmentsCount: number;
  installmentAmount: number;
  pendingBalance: number;
  status: AdvanceStatus;
  installments: AdvanceInstallment[];
  createdUser?: string;
}

export type PayrunStatus = 'Pendiente' | 'En curso' | 'Liquidada' | 'Anulada';
export type EmployeePayrunStatus = 'Pendiente' | 'En proceso' | 'Pagado';

export interface PayrunDeduction {
  id: string;
  concept: string; // "Adelanto de Sueldo" | "Consumo de Empleado"
  detail: string; // e.g. "3/4 cuota (1 de 3)" or "Pedido #40.663"
  amount: number;
  sourceId?: string;
}

export interface PayrunEmployeeDetail {
  employeeId: string;
  employeeName: string;
  dni: string;
  position: string;
  hoursWorkedStr: string; // HH:MM:SS
  hoursWorkedDecimal: number;
  hourlyRate: number;
  grossAmount: number;
  deductions: PayrunDeduction[];
  totalDeductions: number;
  netAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: EmployeePayrunStatus;
  paymentMethod?: string;
  cashRegister?: string;
  paymentDate?: string;
}

export interface Payrun {
  id: string;
  periodName: string;
  startDate: string; // YYYY-MM-DD HH:mm
  endDate: string; // YYYY-MM-DD HH:mm
  employeeCount: number;
  totalToPay: number;
  totalPaid: number;
  totalPending: number;
  status: PayrunStatus;
  employeesDetails: PayrunEmployeeDetail[];
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  message: string;
  type: ToastType;
}

// ----------------------------------------------------
// VENTAS — CUENTA CORRIENTE
// ----------------------------------------------------

export type ReceiptStatus = 'Pendiente' | 'Facturado';

export interface Receipt {
  id: string;
  receiptNumber: string; // REC-XXXXX
  clientId: string;
  dateTime: string; // YYYY-MM-DD HH:mm:ss
  totalAmount: number;
  status: ReceiptStatus;
  userName: string; // Usuario que generó el recibo
  movementIds: string[]; // IDs de CurrentAccountMovement incluidos en este recibo
  paymentMethod?: string;
  cashRegister?: string;
  appliedToPayroll?: boolean;
  billedAt?: string;
}

// ----------------------------------------------------
// VENTAS — CONTROL DE CAJA
// ----------------------------------------------------

export type TurnoType = 'Mañana' | 'Tarde';
export type CashShiftStatus = 'Abierta' | 'Cerrada' | 'Conciliada' | 'Anulada';
export type CashLineStatus = 'Abierta' | 'Cerrada' | 'Conciliada';
export type CashMovementType = 'Ingreso' | 'Salida' | 'Ticket' | 'Gasto' | 'Consumo' | 'Retiro' | 'Traspaso' | 'Ajuste' | 'Apertura';

export type CashIncomeCategory =
  | 'Cobro de Ticket / Venta POS'
  | 'Aporte de Cambio / Fondo Extra'
  | 'Cobro de Cuenta Corriente'
  | 'Traspaso Entrante de otra Caja'
  | 'Ingreso Varios / Ajuste Positivo';

export type CashExpenseCategory =
  | 'Gasto Operativo / Compras Menores'
  | 'Pago a Proveedor'
  | 'Consumo Interno'
  | 'Retiro a Caja Fuerte / Maestra'
  | 'Traspaso Saliente a otra Caja'
  | 'Adelanto de Sueldo / Vale'
  | 'Salida Varios / Ajuste Negativo';

export interface CashShift {
  id: string;
  shift: TurnoType;               // 'Mañana' | 'Tarde'
  createdAt: string;             // [SYS] YYYY-MM-DD HH:mm:ss
  name: string;                  // String autogenerado "MAÑANA 14/08/2026"
  status: CashShiftStatus;       // 'Abierta' | 'Cerrada' | 'Conciliada' | 'Anulada'
  openedByUserId: string;
  openedByUserName: string;
  notes?: string;
  closedAt?: string;
  reconciledAt?: string;
  reconciledByUserName?: string;
  totalDifference?: number;
  voidReason?: string;
}

export interface CashLine {
  id: string;
  shiftId: string;
  boxType: string;               // Efectivo, Mercado Pago 1, Mercado Pago 2, Mercado Pago 3, Cuenta Corriente, Cortesía
  initialAmount: number;         // Monto Inicio Caja
  ticketsTotal: number;          // Total Tickets Facturados / Ingresos (+) [AUTO]
  expensesTotal: number;         // Total Gastos / Consumos / Salidas (-) [AUTO]
  withdrawalsTotal: number;      // Total Retiros (-) [AUTO]
  theoreticalAmount: number;     // Inicio + Tickets - Gastos - Retiros [AUTO]
  realAmount?: number;           // Monto Real Cierre (declarado por el cajero)
  difference?: number;           // Real - Teórico [AUTO]
  differenceNotes?: string;
  openedByUserId?: string;
  openedByUserName?: string;
  status: CashLineStatus;        // 'Abierta' | 'Cerrada' | 'Conciliada'
  closedAt?: string;
}

export interface CashMovement {
  id: string;
  lineId: string;
  shiftId: string;
  dateTime: string;              // [SYS] YYYY-MM-DD HH:mm:ss
  type: CashMovementType;        // 'Ingreso' | 'Salida' | 'Ticket' | 'Gasto' | 'Consumo' | 'Retiro' | 'Traspaso' | 'Ajuste' | 'Apertura'
  category?: string;             // Subtipo / Categoría de Ingreso o Salida
  categoryType?: 'Ingreso' | 'Salida';
  origin: string;                // ej: N° Ticket, N° Gasto, Retiro A Caja Maestra
  voucherNumber?: string;
  amount: number;                // Importe numérico (Positivo o negativo según tipo)
  userId: string;
  userName: string;
  notes?: string;
  targetLineId?: string;
  targetMasterBoxId?: string;
}

export interface MasterCashBox {
  id: string;
  name: string;                  // ej: "Caja Fuerte Principal", "Cuenta Mercado Pago Empresa", "Banco Galicia"
  boxType: string;               // Medio asociado
  status: 'Siempre Abierta';     // No se cierran jamás
  currentBalance: number;        // Saldo positivo acumulado por retiros
}

export interface CashWithdrawalPayload {
  lineId: string;
  amount: number;
  masterBoxId: string;
  notes?: string;
}

// ----------------------------------------------------
// VENTAS — RESERVAS DE MESAS
// ----------------------------------------------------

export type ReservationStatus = 'Confirmada' | 'Cumplida' | 'Cancelada' | 'Histórica';

export interface ReservationLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface RestaurantTable {
  id: string;
  code: string;         // ej: TBL-01, TBL-04
  name: string;         // ej: Mesa 01 - Salón Principal
  capacity: number;     // comensales recomendados
  sector: 'Salón Principal' | 'Terraza' | 'Barra' | 'VIP';
  active: boolean;
}

export interface Reservation {
  id: string;
  dateTime: string;              // [SYS / Req] YYYY-MM-DD HH:mm:ss
  clientId: string;              // [EXT] Clientes
  clientName: string;
  clientPhone?: string;
  guestsCount: number;           // [Req] Cantidad de personas esperadas (>= 1)
  tableId: string;               // [CFG] Mesas
  tableName: string;
  status: ReservationStatus;     // 'Confirmada' | 'Cumplida' | 'Cancelada' | 'Histórica'
  createdByUserId: string;       // [EXT] Usuario que registró la reserva
  createdByUserName: string;
  createdAt: string;             // [SYS] Fecha/Hora Carga
  notes?: string;                // Observaciones
  cancelReason?: string;         // Motivo de cancelación
  updatedByUserId?: string;      // Trazabilidad de modificación
  updatedByUserName?: string;
  updatedAt?: string;
  fulfilledByUserId?: string;    // Trazabilidad de OK / Cumplimiento
  fulfilledByUserName?: string;
  fulfilledAt?: string;
  fulfilledOkNotes?: string;
  logs?: ReservationLog[];       // Log de modificaciones inmutable
}

// ----------------------------------------------------
// VENTAS — CONFIGURACIÓN DE MESAS, TIPOS DE VENTA Y SITIOS
// ----------------------------------------------------

export interface SiteConfig {
  id: string;
  name: string;                  // [Req, R-S01] Nombre único del sector (ej: Salón Medio, Salón Fondo)
  description?: string;          // Detalle opcional
  active: boolean;               // [Req] Estado de habilitación
  order: number;                 // [Req, R-S03] Orden visual (>= 0)
}

export interface RestaurantTableConfig {
  id: string;
  number: string;                // [Req, R-M01] Identificador o código único de la mesa (ej: "Mesa 01", "TBL-01")
  capacity: number;              // [Req, R-M02] Cantidad de personas máxima (> 0)
  siteId: string;                // [Req, R-M03] Selección desde Sitios activos
  siteName: string;
  name?: string;                 // [Opcional] Nombre descriptivo (ej: "Mesa VIP Ventana")
  isFree: boolean;               // [Req, A-M02] Estado de habilitación operativa (true = Sí / false = No, default true)
  active: boolean;               // Habilitación general de la mesa
}

export interface SaleTypeConfig {
  id: string;
  name: string;                  // [Req, R-TV01] Nombre del canal único (ej: Salón, Delivery, Takeaway)
  isSalonSale: boolean;          // [Req] Venta en el Salón (Sí / No)
  requiresTable: boolean;        // [Req, R-TV03] Requiere Mesa (Sí / No)
  requiresClient: boolean;       // [Req] Requiere Cliente (Sí / No)
  initialOrderStatus: string;    // [Req, R-TV02] Estado Inicial del Pedido desde Estados de Pedido
  finalOrderStatus: string;      // [Req, R-TV02] Estado Final del Pedido al cerrar
  autoPrintTicket: boolean;      // [Req] Imprime Ticket Automático
  kitchenPrinter?: string;       // [Opcional] Comanda en Impresora
  active: boolean;               // [Req, A-TV01] Estado de disponibilidad
}

// ----------------------------------------------------
// VENTAS — PEDIDOS / VENTAS
// ----------------------------------------------------

export type OrderStatus =
  | 'Pendiente'
  | 'Comandado'
  | 'En Cocina'
  | 'Listo'
  | 'Entregado'
  | 'Cerrado'
  | 'Facturado'
  | 'Cancelado';

export interface ProductOption {
  id: string;
  name: string;
  priceModifier: number; // 0 = Incluido, > 0 = Costo extra (ej: +900)
}

export interface ProductOptionGroup {
  id: string;
  name: string;                   // ej: "Tipo de café", "Acompañamiento", "Dip", "Adicionales"
  isRequired: boolean;            // true = Obligatorio (1), false = Opcional
  selectionType: 'single' | 'multiple'; // 'single' = 1 opción, 'multiple' = variadas
  maxSelection?: number;
  options: ProductOption[];
  active: boolean;
}

export interface SelectedOptionDetail {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface SplitPaymentLine {
  id: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
}

export interface SaleOrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;              // ej: Comidas, Bebidas, Postres, Cafetería, Combos
  unitPrice: number;
  costPrice?: number;            // [CP03] Precio de costo para cobro diferenciado
  quantity: number;              // > 0
  sideOption?: string;           // Acompañamiento seleccionado
  requiresSideOption?: boolean;  // R09 obligatoriedad
  selectedOptions?: SelectedOptionDetail[]; // Comandas v2.0: Opciones/Modificadores
  subtotal: number;              // quantity * (unitPrice + sum(options.priceModifier))
  lineComment?: string;          // ej: "Sin azúcar", "Bien cocido"
}

export interface OrderBillingInfo {
  clientId: string;
  clientName: string;
  paymentCondition: 'Contado' | 'Cuenta Corriente' | 'Invitación' | 'Gift Card' | 'Consumo Empleado';
  paymentMethod: string;         // Efectivo, Mercado Pago Franco, Mercado Pago Fer, etc.
  splitPayments?: SplitPaymentLine[]; // Soporte cobro múltiple (ej. $15.000 Efectivo + $10.000 MP)
  cashRegisterId?: string;       // Caja Abierta seleccionada
  discountPercentage?: number;
  discountAmount?: number;
  subtotalAmount: number;
  finalTotal: number;
  notes?: string;
  billedAt: string;
  ticketNumber: string;          // ej: TKT-00101
}

export interface SaleOrder {
  id: string;
  orderNumber: number;           // [AUTO] Correlativo #1001
  createdAt: string;             // [SYS T1] Fecha/Hora Creación
  saleTypeId: string;            // [CFG] Salón, Delivery, Takeaway
  saleTypeName: string;
  clientId: string;              // [EXT] Clientes
  clientName: string;
  clientPhone?: string;
  tableId?: string;              // [CFG] Mesas (obligatorio si requiere mesa R03)
  tableName?: string;
  totalAmount: number;           // [AUTO] Recalculado
  status: OrderStatus;
  createdByUserId: string;       // [AUTO]
  createdByUserName: string;
  generalNotes?: string;
  
  // Trazabilidad temporal (T1 - T4)
  t1CreatedAt: string;           // T1: Inicio
  t2ComandaAt?: string;          // T2: Envío a cocina
  t3KitchenOutputAt?: string;    // T3: Salida de cocina
  t4DeliveredAt?: string;        // T4: Entrega al cliente

  comandaPdfUrl?: string;        // Documento Comanda PDF
  ticketPdfUrl?: string;         // Documento Ticket PDF

  items: SaleOrderItem[];
  billingDetails?: OrderBillingInfo;
}





