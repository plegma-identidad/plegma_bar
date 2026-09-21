import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client, AppUser, Category, Warehouse, UserRole, UserProfile, GranularRole, ModuleActionLevel, ModuleAccessMatrix, CurrentAccountMovement, Provider, ProviderPurchase } from '../types';
import { DEFAULT_RUBROS } from '../data/initialData';
import { Button } from './ui/Button';
import { FormField, TextInput, SelectInput, SelectWithInlineAdd } from './ui/Form';
import { StandardDataTable, Column } from './ui/DataTable';
import {
  Package,
  Store,
  Users,
  Tag,
  Building2,
  Utensils,
  UserCheck,
  ShieldCheck,
  Building,
  Plus,
  X,
  ChevronRight,
  CheckCircle2,
  Lock,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Palette,
  Layout,
  Type,
  Paintbrush,
  CreditCard,
  FileText,
  Phone,
  Mail,
  Search,
  Filter,
  ShoppingCart,
  DollarSign,
  Paperclip,
  MessageSquare,
  Kanban,
} from 'lucide-react';

interface MaestrosViewProps {
  onNavigateToItems: () => void;
  onOpenNewProvider: () => void;
  initialSubView?: 'clientes' | 'proveedores' | 'usuarios' | 'categorias' | 'depositos' | 'cuentas' | 'branding' | null;
}

export const MaestrosView: React.FC<MaestrosViewProps> = ({
  onNavigateToItems,
  onOpenNewProvider,
  initialSubView,
}) => {
  const {
    providers,
    addProvider,
    updateProvider,
    deleteProvider,
    items,
    userRole,
    users,
    addUser,
    updateUser,
    deleteUser,
    rolePermissions,
    updateRolePermissions,
    branding,
    updateBranding,
    itemCategories,
    setItemCategories,
    clients,
    addOrUpdateClient,
    deleteClient,
    hasPermission,
  } = useApp();

  const [currentAccountMovements, setCurrentAccountMovements] = useState<CurrentAccountMovement[]>([
    {
      id: 'mov-1',
      clientId: 'cli-1',
      dateTime: '2026-07-28 14:30 hs',
      voucherType: 'Ticket #1042',
      type: 'Venta',
      total: 195000,
      ticketDetail: '10x Vinos Malbec Reserva, 5x Tabla de Quesos VIP',
      lineState: 'Pendiente',
    },
    {
      id: 'mov-2',
      clientId: 'cli-1',
      dateTime: '2026-07-29 11:15 hs',
      voucherType: 'Recibo #085',
      type: 'Recibo',
      total: 50000,
      ticketDetail: 'Pago a cuenta vía Transferencia Bancaria',
      lineState: 'Pagada',
    },
    {
      id: 'mov-3',
      clientId: 'cli-2',
      dateTime: '2026-07-30 09:00 hs',
      voucherType: 'Ticket #1050 (Al Costo)',
      type: 'Venta',
      total: 68000,
      ticketDetail: '20x Gin Aposento, 10x Pack Tónica (Valorizado al Costo)',
      lineState: 'Pendiente',
    },
  ]);

  const [viewingCurrentAccountClient, setViewingCurrentAccountClient] = useState<Client | null>(null);

  const getClientDebt = (clientId: string) => {
    const movs = currentAccountMovements.filter((m) => m.clientId === clientId);
    return movs.reduce((acc, m) => {
      if (m.type === 'Venta') return acc + m.total;
      if (m.type === 'Recibo') return acc - m.total;
      if (m.type === 'Ajuste') return acc + m.total;
      return acc;
    }, 0);
  };

  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-1', name: 'Fresco & Lácteos', description: 'Quesos, manteca, crema y lácteos frescos', itemCount: 12 },
    { id: 'cat-2', name: 'Carnicería & Fritos', description: 'Cortes vacunos, cerdos y aves', itemCount: 8 },
    { id: 'cat-3', name: 'Almacén & Secos', description: 'Harinas, aceites, especias y conservas', itemCount: 25 },
    { id: 'cat-4', name: 'Bebidas & Coctelería', description: 'Vinos, destilados, aperitivos y refrescos', itemCount: 30 },
  ]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    { id: 'wh-1', code: 'DEP-01', name: 'Depósito Central Secos', type: 'Seco', responsibleName: 'Jorge Lopez', active: true },
    { id: 'wh-2', code: 'CAM-01', name: 'Cámara Principal Frío', type: 'Frío', responsibleName: 'Marcos Soler', active: true },
    { id: 'wh-3', code: 'BAR-01', name: 'Barra & Salón', type: 'Barra', responsibleName: 'Sofía Rossi', active: true },
  ]);

  // Perfiles de Puesto (Cargos)
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([
    { id: 'p-1', name: 'Administrador General', description: 'Acceso y supervisión integral de todos los procesos del local' },
    { id: 'p-2', name: 'Encargado de Compras', description: 'Planificación de pedidos, negociación y registro de compras' },
    { id: 'p-3', name: 'Cocinero / Chef', description: 'Conteo de stock diario en cocina, requerimientos e insumos' },
    { id: 'p-4', name: 'Cajero / Facturación', description: 'Control de órdenes, rendición de caja y pagos a proveedores' },
    { id: 'p-5', name: 'Mozo / Atención Salón', description: 'Toma de comensales y seguimiento de órdenes' },
    { id: 'p-6', name: 'Barman / Coctelería', description: 'Gestión de insumos de barra y stock de bebidas' },
    { id: 'p-7', name: 'Encargado de Depósito', description: 'Recepción física de proveedores y control de stock central' },
  ]);

  // Roles Granulares (Permisos por Módulo)
  const [granularRoles, setGranularRoles] = useState<GranularRole[]>([
    {
      id: 'r-1',
      name: 'Rol Administrador Total',
      description: 'Acceso total (ver, crear, editar y eliminar) a todos los módulos',
      moduleAccess: { kanban: 'full', inbox: 'full', items: 'full', dashboard: 'full', audit: 'full', maestros: 'full' },
    },
    {
      id: 'r-2',
      name: 'Rol Compras & Pedidos',
      description: 'Edición en Kanban e Inbox, alta de insumos y consulta de dashboard',
      moduleAccess: { kanban: 'edit', inbox: 'edit', items: 'create', dashboard: 'view', audit: 'none', maestros: 'view' },
    },
    {
      id: 'r-3',
      name: 'Rol Recepción & Depósito',
      description: 'Ingreso de mercaderías, actualización de insumos y auditoría',
      moduleAccess: { kanban: 'edit', inbox: 'view', items: 'edit', dashboard: 'none', audit: 'view', maestros: 'none' },
    },
    {
      id: 'r-4',
      name: 'Rol Caja & Facturación',
      description: 'Gestión completa de pagos, órdenes y métricas de facturación',
      moduleAccess: { kanban: 'view', inbox: 'full', items: 'view', dashboard: 'view', audit: 'none', maestros: 'view' },
    },
    {
      id: 'r-5',
      name: 'Rol Solo Consulta (Auditor)',
      description: 'Permiso de lectura únicamente en todos los módulos sin edición',
      moduleAccess: { kanban: 'view', inbox: 'view', items: 'view', dashboard: 'view', audit: 'view', maestros: 'view' },
    },
  ]);

  // Active Sub-view State (null = Main Grid Dashboard)
  const [activeSubView, setActiveSubView] = useState<
    'clientes' | 'proveedores' | 'usuarios' | 'perfiles' | 'categorias' | 'depositos' | 'cuentas' | 'branding' | null
  >(initialSubView || null);

  React.useEffect(() => {
    if (initialSubView !== undefined) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  // Form Modal State (for creating or editing records)
  const [formModal, setFormModal] = useState<{
    entity: 'cliente' | 'proveedor' | 'usuario' | 'perfil' | 'rol' | 'categoria' | 'deposito';
    isNew: boolean;
    data: any;
  } | null>(null);

  // Provider Purchases & Detail Modal State
  const [providerPurchases, setProviderPurchases] = useState<ProviderPurchase[]>([
    {
      id: 'pur-1',
      providerId: 'prov-4', // Carnicería 6 Esquinas
      purchaseDate: '12/06/2026 11:45',
      voucherNumber: 'FC A 0001-00002345',
      totalAmount: 245000,
      paidAmount: 245000,
      purchaseStatus: 'Recibida',
      paymentStatus: 'Pagada',
      notes: 'Factura A de carne vacuna fresca y pollo',
    },
    {
      id: 'pur-2',
      providerId: 'prov-4',
      purchaseDate: '05/06/2026 10:20',
      voucherNumber: 'FC A 0001-00002312',
      totalAmount: 375500,
      paidAmount: 0,
      purchaseStatus: 'Recibida',
      paymentStatus: 'Pendiente',
      notes: 'Compra a crédito 15 días',
    },
    {
      id: 'pur-3',
      providerId: 'prov-4',
      purchaseDate: '29/05/2026 09:10',
      voucherNumber: 'FC A 0001-00002290',
      totalAmount: 186300,
      paidAmount: 186300,
      purchaseStatus: 'Recibida',
      paymentStatus: 'Pagada',
      notes: 'Pago por transferencia bancaria',
    },
    {
      id: 'pur-4',
      providerId: 'prov-4',
      purchaseDate: '18/05/2026 14:33',
      voucherNumber: 'FC A 0001-00002245',
      totalAmount: 540000,
      paidAmount: 0,
      purchaseStatus: 'Recibida',
      paymentStatus: 'Pendiente',
      notes: 'Insumos evento salón principal',
    },
    {
      id: 'pur-5',
      providerId: 'prov-4',
      purchaseDate: '02/05/2026 08:55',
      voucherNumber: 'NC A 0001-00000234',
      totalAmount: -45000,
      paidAmount: -45000,
      purchaseStatus: 'Anulada',
      paymentStatus: 'Pagada',
      notes: 'Nota de crédito por devolución parcial',
    },
    {
      id: 'pur-6',
      providerId: 'prov-1', // Turboblender
      purchaseDate: '15/06/2026 16:00',
      voucherNumber: 'FC A 0002-00011400',
      totalAmount: 480000,
      paidAmount: 200000,
      purchaseStatus: 'Recibida',
      paymentStatus: 'Parcial',
      notes: 'Equipamiento licuadora industrial',
    },
  ]);

  const [viewingProviderDetail, setViewingProviderDetail] = useState<Provider | null>(null);
  const [activeProviderTab, setActiveProviderTab] = useState<'compras' | 'documentos' | 'notas' | 'contactos' | 'adjuntos'>('compras');

  // Auto calculation functions for Provider Account State
  const getProviderStats = (providerId: string) => {
    const purchases = providerPurchases.filter((p) => p.providerId === providerId);
    const validPurchases = purchases.filter((p) => p.purchaseStatus !== 'Anulada');
    
    const totalComprado = validPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPagado = validPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const saldoPendiente = totalComprado - totalPagado;
    const count = purchases.length;

    return { totalComprado, totalPagado, saldoPendiente, count };
  };

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'danger' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddInlineCategory = (catName: string) => {
    if (!catName.trim()) return;
    setItemCategories((prev) => [...prev, { id: 'opt-' + Date.now(), name: catName.trim(), active: true }]);
    showToast(`Rubro "${catName}" agregado correctamente.`, 'success');
  };

  // --- CRUD HANDLERS WITH CONFIRMATION & TOAST ---

  // 1. CLIENTES
  const handleOpenClientForm = (client?: Client) => {
    if (client) {
      setFormModal({
        entity: 'cliente',
        isNew: false,
        data: {
          id: client.id || '',
          code: client.code || '',
          name: client.name || '',
          phone: client.phone || '',
          address: client.address || '',
          hasCurrentAccount: client.hasCurrentAccount ?? true,
          differentiatedBilling: client.hasCurrentAccount ? (client.differentiatedBilling ?? false) : false,
          isDefault: client.isDefault ?? false,
          isEmployee: client.isEmployee ?? false,
          geolocation: client.geolocation || '',
          debt: client.debt ?? getClientDebt(client.id),
          active: client.active ?? true,
          notes: client.notes || '',
          clientType: client.clientType || 'Salon',
          cuit: client.cuit || '',
          email: client.email || '',
        },
      });
    } else {
      setFormModal({
        entity: 'cliente',
        isNew: true,
        data: {
          id: 'cli-' + Date.now(),
          code: `CLI-00${clients.length + 1}`,
          name: '',
          phone: '',
          address: '',
          hasCurrentAccount: true,
          differentiatedBilling: false, // Default = false
          isDefault: false,
          isEmployee: false,
          geolocation: '',
          debt: 0,
          active: true,
          notes: '',
          clientType: 'Salon',
          cuit: '',
          email: '',
        },
      });
    }
  };

  const handleSaveClient = (clientData: any, isNew: boolean) => {
    // Validaciones 3.5: Cliente, Teléfono y Dirección son obligatorios
    if (!clientData.name?.trim() || !clientData.phone?.trim() || !clientData.address?.trim()) {
      showToast('Por favor completa los campos obligatorios: Cliente, Teléfono y Dirección.', 'danger');
      return;
    }

    // Regla de Cobro Diferenciado: solo si Cuenta Corriente = Sí
    const finalHasCC = Boolean(clientData.hasCurrentAccount);
    const finalDiffBilling = finalHasCC ? Boolean(clientData.differentiatedBilling) : false;

    const formattedClient: Client = {
      id: clientData.id,
      code: clientData.code || `CLI-${Date.now()}`,
      name: clientData.name.trim(),
      phone: clientData.phone.trim(),
      address: clientData.address.trim(),
      hasCurrentAccount: finalHasCC,
      differentiatedBilling: finalDiffBilling,
      isDefault: Boolean(clientData.isDefault),
      isEmployee: Boolean(clientData.isEmployee),
      geolocation: clientData.geolocation || '',
      debt: isNew ? 0 : (clientData.debt ?? getClientDebt(clientData.id)),
      active: Boolean(clientData.active),
      notes: clientData.notes || '',
      clientType: clientData.clientType || 'Salon',
      cuit: clientData.cuit || '',
      email: clientData.email || '',
    };

    setConfirmDialog({
      title: isNew ? 'Confirmar Nuevo Cliente' : 'Guardar Modificaciones de Cliente',
      message: `¿Estás seguro de guardar los datos del cliente "${formattedClient.name}"?`,
      confirmText: isNew ? 'Crear Cliente' : 'Guardar Cambios',
      onConfirm: async () => {
        await addOrUpdateClient(formattedClient);

        showToast(
          isNew
            ? `Cliente "${formattedClient.name}" registrado con éxito.`
            : `Cliente "${formattedClient.name}" actualizado correctamente.`,
          'success'
        );
        setFormModal(null);
      },
    });
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    setConfirmDialog({
      title: '¡Atención! Eliminar Cliente',
      message: `¿Confirmas eliminar permanentemente al cliente "${clientName}"?`,
      confirmText: 'Eliminar Registro',
      isDanger: true,
      onConfirm: async () => {
        await deleteClient(clientId);
        showToast(`Cliente "${clientName}" eliminado.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 1.B PROVEEDORES
  const handleOpenProviderForm = (provider?: Provider) => {
    if (provider) {
      setFormModal({
        entity: 'proveedor',
        isNew: false,
        data: {
          id: provider.id,
          code: provider.code || '',
          name: provider.name || '',
          commercialName: provider.commercialName || '',
          phone: provider.phone || '',
          email: provider.email || '',
          address: provider.address || '',
          rubro: provider.rubro || 'Equipamiento',
          subrubro: provider.subrubro || '',
          cuit: provider.cuit || '',
          active: provider.active ?? true,
          notes: provider.notes || '',
        },
      });
    } else {
      setFormModal({
        entity: 'proveedor',
        isNew: true,
        data: {
          id: 'prov-' + Date.now(),
          code: `PRV-00${providers.length + 1}`,
          name: '',
          commercialName: '',
          phone: '',
          email: '',
          address: '',
          rubro: 'Equipamiento',
          subrubro: '',
          cuit: '',
          active: true,
          notes: '',
        },
      });
    }
  };

  const handleSaveProvider = (providerData: any, isNew: boolean) => {
    // Validaciones 8: El campo Proveedor (Nombre) es obligatorio
    if (!providerData.name?.trim()) {
      showToast('Por favor ingresa el nombre o razón social del proveedor.', 'danger');
      return;
    }

    const cleanName = providerData.name.trim();

    // Validaciones 8: No se permite duplicar proveedores con el mismo nombre
    const isDuplicate = providers.some(
      (p) => p.id !== providerData.id && p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Ya existe un proveedor registrado con el nombre "${cleanName}".`, 'danger');
      return;
    }

    const formattedProvider: Provider = {
      id: providerData.id,
      code: providerData.code || `PRV-${Date.now()}`,
      name: cleanName,
      commercialName: providerData.commercialName?.trim() || cleanName,
      phone: providerData.phone?.trim() || '',
      email: providerData.email?.trim() || '',
      address: providerData.address?.trim() || '',
      rubro: providerData.rubro || 'Varios',
      subrubro: providerData.subrubro?.trim() || '',
      cuit: providerData.cuit?.trim() || '',
      active: Boolean(providerData.active),
      notes: providerData.notes || '',
      contactName: providerData.contactName || cleanName,
      whatsapp: providerData.phone || '',
    };

    setConfirmDialog({
      title: isNew ? 'Confirmar Nuevo Proveedor' : 'Guardar Modificaciones de Proveedor',
      message: `¿Estás seguro de guardar los datos del proveedor "${formattedProvider.name}"?`,
      confirmText: isNew ? 'Crear Proveedor' : 'Guardar Cambios',
      onConfirm: () => {
        if (isNew) {
          addProvider(formattedProvider);
          showToast(`Proveedor "${formattedProvider.name}" registrado con éxito.`, 'success');
        } else {
          updateProvider(formattedProvider);
          showToast(`Proveedor "${formattedProvider.name}" actualizado correctamente.`, 'success');
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteProvider = (providerId: string, providerName: string) => {
    setConfirmDialog({
      title: '¡Atención! Eliminar Proveedor',
      message: `¿Confirmas eliminar permanentemente al proveedor "${providerName}"?`,
      confirmText: 'Eliminar Proveedor',
      isDanger: true,
      onConfirm: () => {
        deleteProvider(providerId);
        showToast(`Proveedor "${providerName}" eliminado.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 2. USUARIOS
  const handleOpenUserForm = (user?: AppUser) => {
    if (user) {
      setFormModal({
        entity: 'usuario',
        isNew: false,
        data: {
          id: user.id || user.dni || '',
          dni: user.dni || user.id || '',
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          profileId: user.profileId || userProfiles[0]?.id || 'p-1',
          assignedRoleIds: user.assignedRoleIds || ['r-1'],
          status: user.status || 'Activo',
          lastAccess: user.lastAccess || 'Hoy',
          canInlineCreate: user.customPermissions?.canInlineCreate ?? true,
          canCreate: user.customPermissions?.canCreate ?? true,
          canEdit: user.customPermissions?.canEdit ?? true,
          canDelete: user.customPermissions?.canDelete ?? false,
        },
      });
    } else {
      setFormModal({
        entity: 'usuario',
        isNew: true,
        data: {
          id: '',
          dni: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          profileId: userProfiles[0]?.id || 'p-1',
          assignedRoleIds: ['r-1'],
          status: 'Activo',
          canInlineCreate: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
        },
      });
    }
  };

  const handleSaveUser = (userData: any, isNew: boolean) => {
    if (!userData.dni?.trim() || !userData.name?.trim() || !userData.email?.trim()) return;

    const selectedProfile = userProfiles.find((p) => p.id === userData.profileId);

    const userToSave: AppUser = {
      id: isNew ? '' : userData.id || '',
      dni: userData.dni.trim(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone || '',
      address: userData.address || '',
      profileId: userData.profileId || 'p-1',
      profileName: selectedProfile?.name || 'Administrador General',
      assignedRoleIds: userData.assignedRoleIds || [],
      role: userData.role || 'operador',
      status: userData.status || 'Activo',
      lastAccess: isNew ? 'Recién creado' : userData.lastAccess,
      customPermissions: {
        canInlineCreate: Boolean(userData.canInlineCreate),
        canCreate: Boolean(userData.canCreate),
        canEdit: Boolean(userData.canEdit),
        canDelete: Boolean(userData.canDelete),
      },
    };

    setConfirmDialog({
      title: isNew ? 'Confirmar Alta de Usuario' : 'Guardar Cambios de Usuario',
      message: `¿Confirmas ${isNew ? 'dar de alta' : 'modificar'} al usuario "${userToSave.name}" (DNI: ${userToSave.dni})?`,
      confirmText: isNew ? 'Dar de Alta' : 'Guardar Cambios',
      onConfirm: async () => {
        if (isNew) {
          const res = await addUser(userToSave);
          if (res && res.success) {
            showToast(`Usuario "${userToSave.name}" registrado con éxito.`, 'success');
          } else {
            showToast(`Error al registrar el usuario. Compruebe si el email o DNI ya existen.`, 'danger');
          }
        } else {
          const res = await updateUser(userToSave);
          if (res && res.success) {
            showToast(`Usuario "${userToSave.name}" actualizado correctamente.`, 'success');
          } else {
            showToast(`Error al actualizar el usuario.`, 'danger');
          }
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      title: '¡Atención! Eliminar Usuario',
      message: `¿Confirmas eliminar al usuario "${userName}"? Perderá el acceso al sistema.`,
      confirmText: 'Eliminar Usuario',
      isDanger: true,
      onConfirm: async () => {
        await deleteUser(userId);
        showToast(`Usuario "${userName}" eliminado.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 2.b PERFILES (Cargos)
  const handleOpenProfileForm = (profile?: UserProfile) => {
    if (profile) {
      setFormModal({
        entity: 'perfil',
        isNew: false,
        data: { ...profile },
      });
    } else {
      setFormModal({
        entity: 'perfil',
        isNew: true,
        data: {
          id: 'p-' + Date.now(),
          name: '',
          description: '',
        },
      });
    }
  };

  const handleSaveProfile = (profileData: UserProfile, isNew: boolean) => {
    if (!profileData.name?.trim()) return;
    setConfirmDialog({
      title: isNew ? 'Crear Nuevo Perfil (Cargo)' : 'Guardar Modificaciones de Perfil',
      message: `¿Confirmas ${isNew ? 'crear' : 'actualizar'} el perfil "${profileData.name}"?`,
      confirmText: isNew ? 'Crear Perfil' : 'Guardar Cambios',
      onConfirm: () => {
        if (isNew) {
          setUserProfiles((prev) => [...prev, profileData]);
          showToast(`Perfil "${profileData.name}" registrado correctamente.`, 'success');
        } else {
          setUserProfiles((prev) => prev.map((p) => (p.id === profileData.id ? profileData : p)));
          showToast(`Perfil "${profileData.name}" actualizado.`, 'success');
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    setConfirmDialog({
      title: 'Eliminar Perfil (Cargo)',
      message: `¿Confirmas eliminar el perfil "${profileName}"?`,
      confirmText: 'Eliminar Perfil',
      isDanger: true,
      onConfirm: () => {
        setUserProfiles((prev) => prev.filter((p) => p.id !== profileId));
        showToast(`Perfil "${profileName}" eliminado.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 2.c ROLES GRANULARES
  const handleOpenRoleForm = (role?: GranularRole) => {
    if (role) {
      setFormModal({
        entity: 'rol',
        isNew: false,
        data: JSON.parse(JSON.stringify(role)),
      });
    } else {
      setFormModal({
        entity: 'rol',
        isNew: true,
        data: {
          id: 'r-' + Date.now(),
          name: '',
          description: '',
          moduleAccess: {
            kanban: 'view',
            inbox: 'view',
            items: 'view',
            dashboard: 'view',
            audit: 'none',
            maestros: 'none',
          },
        },
      });
    }
  };

  const handleSaveRole = (roleData: GranularRole, isNew: boolean) => {
    if (!roleData.name?.trim()) return;
    setConfirmDialog({
      title: isNew ? 'Crear Rol Granular' : 'Guardar Modificaciones de Rol',
      message: `¿Confirmas ${isNew ? 'crear' : 'modificar'} el rol "${roleData.name}"?`,
      confirmText: isNew ? 'Crear Rol' : 'Guardar Cambios',
      onConfirm: () => {
        if (isNew) {
          setGranularRoles((prev) => [...prev, roleData]);
          showToast(`Rol "${roleData.name}" creado con éxito.`, 'success');
        } else {
          setGranularRoles((prev) => prev.map((r) => (r.id === roleData.id ? roleData : r)));
          showToast(`Rol "${roleData.name}" actualizado.`, 'success');
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    setConfirmDialog({
      title: 'Eliminar Rol Granular',
      message: `¿Confirmas eliminar el rol "${roleName}"?`,
      confirmText: 'Eliminar Rol',
      isDanger: true,
      onConfirm: () => {
        setGranularRoles((prev) => prev.filter((r) => r.id !== roleId));
        showToast(`Rol "${roleName}" eliminado.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 3. CATEGORÍAS
  const handleOpenCategoryForm = (category?: Category) => {
    if (category) {
      setFormModal({
        entity: 'categoria',
        isNew: false,
        data: {
          id: category.id || '',
          name: category.name || '',
          description: category.description || '',
          itemCount: category.itemCount || 0,
        },
      });
    } else {
      setFormModal({
        entity: 'categoria',
        isNew: true,
        data: {
          id: 'cat-' + Date.now(),
          name: '',
          description: '',
          itemCount: 0,
        },
      });
    }
  };

  const handleSaveCategory = (catData: Category, isNew: boolean) => {
    if (!catData.name?.trim()) return;

    setConfirmDialog({
      title: isNew ? 'Confirmar Nueva Categoría' : 'Guardar Cambios en Categoría',
      message: `¿Deseas guardar la categoría "${catData.name}"?`,
      confirmText: isNew ? 'Crear Categoría' : 'Guardar Cambios',
      onConfirm: () => {
        if (isNew) {
          setCategories((prev) => [catData, ...prev]);
          showToast(`Categoría "${catData.name}" creada con éxito.`, 'success');
        } else {
          setCategories((prev) => prev.map((c) => (c.id === catData.id ? catData : c)));
          showToast(`Categoría "${catData.name}" modificada correctamente.`, 'success');
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    setConfirmDialog({
      title: 'Eliminar Categoría',
      message: `¿Confirmas eliminar la categoría "${catName}"?`,
      confirmText: 'Eliminar Categoría',
      isDanger: true,
      onConfirm: () => {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
        showToast(`Categoría "${catName}" eliminada.`, 'danger');
        setFormModal(null);
      },
    });
  };

  // 4. DEPÓSITOS
  const handleOpenWarehouseForm = (warehouse?: Warehouse) => {
    if (warehouse) {
      setFormModal({
        entity: 'deposito',
        isNew: false,
        data: {
          id: warehouse.id || '',
          code: warehouse.code || '',
          name: warehouse.name || '',
          type: warehouse.type || 'Seco',
          responsibleName: warehouse.responsibleName || '',
          active: warehouse.active ?? true,
        },
      });
    } else {
      setFormModal({
        entity: 'deposito',
        isNew: true,
        data: {
          id: 'wh-' + Date.now(),
          code: `DEP-0${warehouses.length + 1}`,
          name: '',
          type: 'Seco',
          responsibleName: '',
          active: true,
        },
      });
    }
  };

  const handleSaveWarehouse = (whData: Warehouse, isNew: boolean) => {
    if (!whData.name?.trim()) return;

    setConfirmDialog({
      title: isNew ? 'Confirmar Ubicación' : 'Modificar Ubicación',
      message: `¿Deseas guardar la ubicación "${whData.name}"?`,
      confirmText: isNew ? 'Crear Ubicación' : 'Guardar Cambios',
      onConfirm: () => {
        if (isNew) {
          setWarehouses((prev) => [whData, ...prev]);
          showToast(`Depósito "${whData.name}" registrado con éxito.`, 'success');
        } else {
          setWarehouses((prev) => prev.map((w) => (w.id === whData.id ? whData : w)));
          showToast(`Depósito "${whData.name}" actualizado correctamente.`, 'success');
        }
        setFormModal(null);
      },
    });
  };

  const handleDeleteWarehouse = (whId: string, whName: string) => {
    setConfirmDialog({
      title: 'Eliminar Ubicación',
      message: `¿Confirmas eliminar la ubicación "${whName}"?`,
      confirmText: 'Eliminar Ubicación',
      isDanger: true,
      onConfirm: () => {
        setWarehouses((prev) => prev.filter((w) => w.id !== whId));
        showToast(`Ubicación "${whName}" eliminada.`, 'danger');
        setFormModal(null);
      },
    });
  };

  const roleNames: Record<UserRole, string> = {
    admin: 'Administrador Total',
    compras: 'Encargado de Compras',
    recepcion: 'Recepcionista de Depósito',
    caja: 'Cajero / Tesorería',
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: 'Acceso total sin restricciones a compras, configuraciones, usuarios y auditoría.',
    compras: 'Gestión de órdenes de compra, creación de proveedores e insumos.',
    recepcion: 'Control físico de entrega de remitos y conteo de existencias.',
    caja: 'Registro de pagos a proveedores y liquidación de comprobantes.',
  };

  // --- TABLE COLUMNS ---
  const clientColumns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Cliente / Razón Social',
      render: (c) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{c?.name || '-'}</span>
            {c?.isDefault && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300">
                Por Defecto
              </span>
            )}
            {c?.isEmployee && (
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 font-extrabold text-[10px] rounded-full border border-cyan-300">
                Empleado
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">{c?.code || '-'} {c?.cuit ? `| CUIT: ${c.cuit}` : ''}</span>
        </div>
      ),
    },
    { key: 'phone', header: 'Teléfono', render: (c) => <span className="font-medium">{c?.phone || '-'}</span> },
    { key: 'address', header: 'Dirección', render: (c) => <span className="text-slate-600 text-xs">{c?.address || '-'}</span> },
    {
      key: 'hasCurrentAccount',
      header: 'Cuenta Corriente',
      align: 'center',
      render: (c) => (
        <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${c?.hasCurrentAccount ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
          {c?.hasCurrentAccount ? 'SÍ' : 'NO'}
        </span>
      ),
    },
    {
      key: 'differentiatedBilling',
      header: 'Cobro Diferenciado',
      align: 'center',
      render: (c) => (
        <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${c?.differentiatedBilling ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-slate-100 text-slate-500'}`}>
          {c?.differentiatedBilling ? 'SÍ (Al Costo)' : 'NO'}
        </span>
      ),
    },
    {
      key: 'debt',
      header: 'Deuda [AUTO]',
      align: 'right',
      render: (c) => {
        const debtVal = getClientDebt(c?.id || '');
        return (
          <span className={`font-mono font-extrabold text-xs ${debtVal > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
            ${debtVal.toLocaleString('es-AR')}
          </span>
        );
      },
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'center',
      render: (c) => (
        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${c?.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {c?.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      width: '14%',
      render: (c) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {c?.hasCurrentAccount && (
            <Button
              onClick={() => setViewingCurrentAccountClient(c)}
              variant="outline"
              size="sm"
              className="p-1.5 h-auto text-[11px] bg-slate-50 hover:bg-indigo-50 border-slate-300 text-indigo-700"
              title="Ver Ficha / Cuenta Corriente"
            >
              <FileText className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={() => handleOpenClientForm(c)}
            variant="outline"
            size="sm"
            className="p-1.5 h-auto text-xs"
            title="Editar Cliente"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
          </Button>
        </div>
      ),
    },
  ];

  const providerColumns: Column<Provider>[] = [
    {
      key: 'name',
      header: 'Proveedor',
      render: (p) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{p?.name || '-'}</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {p?.code || '-'} {p?.cuit ? `| CUIT: ${p.cuit}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (p) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span>{p?.phone || '-'}</span>
          {p?.phone && (
            <a
              href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition"
              title="Contactar por WhatsApp"
            >
              <Phone className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 text-xs truncate max-w-[180px]">{p?.email || '-'}</span>
          {p?.email && (
            <a
              href={`mailto:${p.email}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
              title="Enviar Email"
            >
              <Mail className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'rubro',
      header: 'Rubro',
      render: (p) => (
        <div>
          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-bold text-[10px] rounded-full block w-fit">
            {p?.rubro || 'General'}
          </span>
          {p?.subrubro && (
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {p.subrubro}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      align: 'center',
      render: (p) => (
        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${p?.active ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
          {p?.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      width: '14%',
      render: (p) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={() => setViewingProviderDetail(p)}
            variant="outline"
            size="sm"
            className="p-1.5 h-auto text-[11px] bg-slate-50 hover:bg-indigo-50 border-slate-300 text-indigo-700"
            title="Ver Ficha / Estado de Cuenta"
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => handleOpenProviderForm(p)}
            variant="outline"
            size="sm"
            className="p-1.5 h-auto text-xs"
            title="Editar Proveedor"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
          </Button>
        </div>
      ),
    },
  ];

  const userColumns: Column<AppUser>[] = [
    { key: 'dni', header: 'DNI', render: (u) => <span className="font-mono font-bold text-indigo-700">{u?.dni || u?.id || '-'}</span> },
    { key: 'name', header: 'Nombre / Apellido', render: (u) => <span className="font-bold text-slate-900">{u?.name || '-'}</span> },
    { key: 'email', header: 'Email', render: (u) => <span>{u?.email || '-'}</span> },
    { key: 'profileName', header: 'Perfil (Cargo)', render: (u) => <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-bold text-xs rounded-lg">{u?.profileName || 'Administrador General'}</span> },
    {
      key: 'assignedRoleIds',
      header: 'Roles Asignados',
      render: (u) => {
        const roles = (u?.assignedRoleIds || []).map((rid) => granularRoles.find((gr) => gr.id === rid)?.name || rid);
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((rName, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold text-[10px] rounded-full border border-amber-200 shadow-xs">
                {rName}
              </span>
            ))}
          </div>
        );
      },
    },
    { key: 'status', header: 'Estado', render: (u) => <span className={`px-2 py-0.5 font-semibold text-[10px] rounded ${u?.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{u?.status || 'Activo'}</span> },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center',
      width: '10%',
      render: (u) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (u) handleOpenUserForm(u);
          }}
          variant="outline"
          size="sm"
          className="p-1.5 h-auto text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
        </Button>
      ),
    },
  ];

  const profileColumns: Column<UserProfile>[] = [
    { key: 'name', header: 'Nombre del Perfil (Cargo)', render: (p) => <span className="font-bold text-slate-900">{p?.name || '-'}</span> },
    { key: 'description', header: 'Descripción / Responsabilidades del Cargo', render: (p) => <span className="text-slate-600 text-xs">{p?.description || '-'}</span> },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center',
      width: '12%',
      render: (p) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (p) handleOpenProfileForm(p);
          }}
          variant="outline"
          size="sm"
          className="p-1.5 h-auto text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
        </Button>
      ),
    },
  ];

  const actionLevelBadges: Record<ModuleActionLevel, { label: string; color: string }> = {
    none: { label: 'No ver', color: 'bg-slate-100 text-slate-500' },
    view: { label: 'Ver', color: 'bg-blue-100 text-blue-800' },
    create: { label: 'Crear', color: 'bg-emerald-100 text-emerald-800 font-semibold' },
    edit: { label: 'Editar', color: 'bg-amber-100 text-amber-900 font-semibold' },
    full: { label: 'Acceso Total', color: 'bg-purple-100 text-purple-900 font-extrabold' },
  };

  const granularRoleColumns: Column<GranularRole>[] = [
    { key: 'name', header: 'Nombre del Rol', render: (r) => <span className="font-bold text-slate-900">{r?.name || '-'}</span> },
    { key: 'description', header: 'Descripción', render: (r) => <span className="text-slate-500 text-xs">{r?.description || '-'}</span> },
    {
      key: 'moduleAccess',
      header: 'Matriz de Permisos por Módulo',
      render: (r) => {
        if (!r?.moduleAccess) return <span>-</span>;
        const modules: { key: keyof ModuleAccessMatrix; label: string }[] = [
          { key: 'kanban', label: 'Kanban' },
          { key: 'inbox', label: 'Pedidos' },
          { key: 'items', label: 'Insumos' },
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'audit', label: 'Auditoría' },
          { key: 'maestros', label: 'Maestros' },
        ];
        return (
          <div className="flex flex-wrap gap-1">
            {modules.map((m) => {
              const level = r.moduleAccess[m.key] || 'none';
              const cfg = actionLevelBadges[level];
              return (
                <span key={m.key} className={`px-2 py-0.5 rounded text-[10px] border border-slate-200 ${cfg.color}`}>
                  <strong>{m.label}:</strong> {cfg.label}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center',
      width: '12%',
      render: (r) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (r) handleOpenRoleForm(r);
          }}
          variant="outline"
          size="sm"
          className="p-1.5 h-auto text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
        </Button>
      ),
    },
  ];

  const categoryColumns: Column<Category>[] = [
    { key: 'name', header: 'Rubro / Categoría', render: (c) => <span className="font-bold text-slate-900">{c?.name || '-'}</span> },
    { key: 'description', header: 'Descripción', render: (c) => <span>{c?.description || '-'}</span> },
    { key: 'itemCount', header: 'Insumos', align: 'center', render: (c) => <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded">{c?.itemCount || 0}</span> },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center',
      width: '12%',
      render: (c) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (c) handleOpenCategoryForm(c);
          }}
          variant="outline"
          size="sm"
          className="p-1.5 h-auto text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
        </Button>
      ),
    },
  ];

  const warehouseColumns: Column<Warehouse>[] = [
    { key: 'code', header: 'Código', width: '15%', render: (w) => <span>{w?.code || '-'}</span> },
    { key: 'name', header: 'Ubicación', render: (w) => <span className="font-bold text-slate-900">{w?.name || '-'}</span> },
    { key: 'type', header: 'Tipo', render: (w) => <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">{w?.type || '-'}</span> },
    { key: 'responsibleName', header: 'Responsable', render: (w) => <span>{w?.responsibleName || '-'}</span> },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center',
      width: '12%',
      render: (w) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (w) handleOpenWarehouseForm(w);
          }}
          variant="outline"
          size="sm"
          className="p-1.5 h-auto text-xs"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification Component */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-bounce-short">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold text-white ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-700 text-emerald-100'
                : toast.type === 'danger'
                ? 'bg-rose-900 border-rose-700 text-rose-100'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`p-2.5 rounded-xl ${
                  confirmDialog.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
                Cancelar
              </Button>
              <Button
                variant={confirmDialog.isDanger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                {confirmDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD CENTRAL DE MAESTROS (grid de tarjetas) */}
      {activeSubView === null && (
        <div className="space-y-8 animate-fadeIn">
          {/* View Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Centro de Administración de Maestros
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Gestiona de forma centralizada las tablas maestras, parámetros, usuarios y catálogos de <strong className="text-amber-400">PLEGMA Gatro</strong>.
              </p>
            </div>
          </div>

          {/* SECTION 1: CADENA DE SUMINISTRO & PROCESOS OPERATIVOS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
              <Store className="w-5 h-5 text-indigo-600" />
              <h2>Procesos Operativos & Cadena de Suministro</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CARD 1: MATERIALES E INSUMOS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Package className="w-6 h-6" />
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {items.length} Insumos
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition">
                      Maestro Materiales e Insumos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Catálogo unificado de materias primas, unidades de compra, categorías y stocks mínimos.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onNavigateToItems}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Tabla de Insumos
                </Button>
              </div>

              {/* CARD 2: PROVEEDORES */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {providers.length} Proveedores
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                      Maestro de Proveedores
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Padrón de proveedores habituales, días de pedido, contactos y condiciones de pago.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('proveedores')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Tabla Proveedores
                </Button>
              </div>

              {/* CARD 3: CLIENTES */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {clients.length} Clientes
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition">
                      Maestro de Clientes
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Listado de salones, barras, eventos y clientes corporativos con rubros asociados.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('clientes')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Tabla Clientes
                </Button>
              </div>

              {/* CARD 4: CATEGORÍAS & RUBROS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Tag className="w-6 h-6" />
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {categories.length} Rubros
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition">
                      Categorías & Rubros
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Clasificación de familias de insumos (Carnes, Lácteos, Bebidas, Almacén, etc.).
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('categorias')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Categorías
                </Button>
              </div>

              {/* CARD 5: DEPÓSITOS Y UBICACIONES */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {warehouses.length} Depósitos
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition">
                      Depósitos & Ubicaciones
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Almacenes de recepción (Cámara Frío, Depósito Secos, Barra Principal).
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('depositos')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Ubicaciones
                </Button>
              </div>

              {/* CARD 6: RECETAS / ESCANDALLOS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between opacity-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                      Próximamente
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Recetas & Escandallos
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Composición de platos y cocktails para explosión técnica de insumos y costos.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => alert('Próximamente: Módulo de Recetas y Escandallos.')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Explorar Escandallos
                </Button>
              </div>
            </div>
          </section>

          {/* SECTION 2: ADMINISTRACIÓN DE USUARIOS & SEGURIDAD */}
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h2>Administración de Usuarios & Seguridad</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CARD 7: USUARIOS DEL SISTEMA */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {users.length} Activos
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                      Maestro de Usuarios
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Altas de personal con DNI (Key DB), roles operativos y permisos individuales por usuario.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('usuarios')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Tabla Usuarios
                </Button>
              </div>

              {/* CARD 8: PERFILES & PERMISOS (RBAC) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      4 Perfiles
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-cyan-600 transition">
                      Perfiles & Permisos (RBAC)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Configuración de visibilidad de botones (+) y permisos globales por rol.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('perfiles')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Ver Matriz RBAC
                </Button>
              </div>

              {/* CARD 9: SUCURSALES & CENTROS DE COSTO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Building className="w-6 h-6" />
                    </div>
                    <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      Centros de Costo
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-600 transition">
                      Sucursales & Centros de Costo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Imputación presupuestaria por local, barra o punto de venta de la marca.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => alert('Módulo de Centros de Costo listo para vinculación contable.')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Configurar Sucursales
                </Button>
              </div>

              {/* CARD 10: BRANDING & IDENTIDAD VISUAL */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                      <Palette className="w-6 h-6" />
                    </div>
                    <span className="bg-pink-100 text-pink-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      Personalización
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-pink-600 transition">
                      Branding & Identidad Visual
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Configuración de menú (superior/lateral), estilos de botones, colores y tipografía de la app.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveSubView('branding')}
                  variant="outline"
                  size="sm"
                  className="mt-6 w-full justify-between"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Configurar Branding
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- VISTAS INTEGRADAS A PANTALLA COMPLETA --- */}

      {/* VISTA 1: TABLA MAESTRO CLIENTES */}
      {activeSubView === 'clientes' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Maestro de Clientes</span>
                </h2>
                <p className="text-xs text-slate-500">Listado de salones y clientes registrados. Haz clic en una fila para editar o eliminar.</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenClientForm()}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              requiredPermission="canCreate"
              hideIfNoPermission={false}
            >
              + Nuevo Registro
            </Button>
          </div>

          <StandardDataTable
            data={clients}
            columns={clientColumns}
            keyExtractor={(c) => c?.id || c?.code || Math.random().toString()}
            searchFilterKey={(c) => `${c?.code || ''} ${c?.name || ''} ${c?.clientType || ''} ${c?.cuit || ''}`}
            searchPlaceholder="Buscar cliente por nombre, código o CUIT..."
            title="Clientes Registrados"
            onRowClick={(c) => handleOpenClientForm(c)}
          />
        </div>
      )}

      {/* VISTA 1.B: TABLA MAESTRO PROVEEDORES */}
      {activeSubView === 'proveedores' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-600" />
                  <span>Maestro de Proveedores</span>
                </h2>
                <p className="text-xs text-slate-500">Centraliza datos de contacto, rubro y estado de proveedores. Haz clic en una fila para editar o consultar su ficha de compras.</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenProviderForm()}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              requiredPermission="canCreate"
              hideIfNoPermission={false}
            >
              + Nuevo Proveedor
            </Button>
          </div>

          <StandardDataTable
            data={providers}
            columns={providerColumns}
            keyExtractor={(p) => p?.id || p?.code || Math.random().toString()}
            searchFilterKey={(p) => `${p?.code || ''} ${p?.name || ''} ${p?.phone || ''} ${p?.email || ''} ${p?.rubro || ''} ${p?.subrubro || ''}`}
            searchPlaceholder="Buscar proveedor por nombre, teléfono, email o rubro..."
            title="Proveedores Registrados"
            onRowClick={(p) => handleOpenProviderForm(p)}
          />
        </div>
      )}

      {/* VISTA 2: TABLA MAESTRO USUARIOS */}
      {activeSubView === 'usuarios' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <span>Maestro de Usuarios</span>
                </h2>
                <p className="text-xs text-slate-500">Padrón de personal con DNI (Key DB). Haz clic en un usuario para editar sus datos o permisos.</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenUserForm()}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              requiredPermission="canCreate"
              hideIfNoPermission={false}
            >
              + Nuevo Registro
            </Button>
          </div>

          <StandardDataTable
            data={users}
            columns={userColumns}
            keyExtractor={(u) => u?.id || u?.dni || Math.random().toString()}
            searchFilterKey={(u) => `${u?.dni || u?.id || ''} ${u?.name || ''} ${u?.email || ''} ${u?.role || ''}`}
            searchPlaceholder="Buscar usuario por DNI, nombre o email..."
            title="Usuarios del Sistema"
            onRowClick={(u) => handleOpenUserForm(u)}
          />
        </div>
      )}

      {/* VISTA 3: PERFILES (CARGOS) & ROLES GRANULARES */}
      {activeSubView === 'perfiles' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  <span>Gestión de Perfiles (Cargos) & Roles Granulares</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Crea los cargos del personal y define roles granulares con permisos específicos por cada módulo (No ver, Ver, Crear, Editar, Acceso Total).
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: PERFILES (CARGOS DE PUESTO) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>1. Catálogo de Perfiles (Cargos del Personal)</span>
                </h3>
                <p className="text-xs text-slate-300">Función u ocupación dentro del local (Ej. Administrador, Cocinero, Cajero, Mozo, Barman, Depósito).</p>
              </div>
              <Button
                onClick={() => handleOpenProfileForm()}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                + Nuevo Perfil (Cargo)
              </Button>
            </div>

            <StandardDataTable
              data={userProfiles}
              columns={profileColumns}
              keyExtractor={(p) => p?.id || Math.random().toString()}
              searchFilterKey={(p) => `${p?.name || ''} ${p?.description || ''}`}
              searchPlaceholder="Buscar perfil por nombre o cargo..."
              title="Perfiles (Cargos) Registrados"
              onRowClick={(p) => handleOpenProfileForm(p)}
            />
          </div>

          {/* SECCIÓN 2: ROLES GRANULARES (PERMISOS POR MÓDULO) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>2. Roles Granulares & Matriz de Permisos por Módulo</span>
                </h3>
                <p className="text-xs text-slate-300">Configuración de acciones permitidas (No ver, Ver, Crear, Editar, Acceso Total) por cada funcionalidad.</p>
              </div>
              <Button
                onClick={() => handleOpenRoleForm()}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                + Nuevo Rol Granular
              </Button>
            </div>

            <StandardDataTable
              data={granularRoles}
              columns={granularRoleColumns}
              keyExtractor={(r) => r?.id || Math.random().toString()}
              searchFilterKey={(r) => `${r?.name || ''} ${r?.description || ''}`}
              searchPlaceholder="Buscar rol por nombre o permisos..."
              title="Roles Granulares Registrados"
              onRowClick={(r) => handleOpenRoleForm(r)}
            />
          </div>
        </div>
      )}

      {/* VISTA 4: TABLA CATEGORÍAS */}
      {activeSubView === 'categorias' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <span>Maestro de Categorías & Rubros</span>
                </h2>
                <p className="text-xs text-slate-500">Haz clic en una fila para editar o eliminar la categoría.</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenCategoryForm()}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              requiredPermission="canCreate"
              hideIfNoPermission={false}
            >
              + Nuevo Registro
            </Button>
          </div>

          <StandardDataTable
            data={categories}
            columns={categoryColumns}
            keyExtractor={(c) => c?.id || Math.random().toString()}
            searchFilterKey={(c) => `${c?.name || ''} ${c?.description || ''}`}
            searchPlaceholder="Buscar rubro por nombre..."
            title="Rubros Registrados"
            onRowClick={(c) => handleOpenCategoryForm(c)}
          />
        </div>
      )}

      {/* VISTA 5: TABLA DEPÓSITOS */}
      {activeSubView === 'depositos' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Botón Volver */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-600" />
                  <span>Maestro de Depósitos & Ubicaciones</span>
                </h2>
                <p className="text-xs text-slate-500">Haz clic en una fila para editar o eliminar la ubicación.</p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenWarehouseForm()}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              requiredPermission="canCreate"
              hideIfNoPermission={false}
            >
              + Nuevo Registro
            </Button>
          </div>

          <StandardDataTable
            data={warehouses}
            columns={warehouseColumns}
            keyExtractor={(w) => w?.id || Math.random().toString()}
            searchFilterKey={(w) => `${w?.code || ''} ${w?.name || ''} ${w?.type || ''} ${w?.responsibleName || ''}`}
            searchPlaceholder="Buscar ubicación por código o nombre..."
            title="Depósitos Registrados"
            onRowClick={(w) => handleOpenWarehouseForm(w)}
          />
        </div>
      )}

      {/* VISTA 6: BRANDING & IDENTIDAD VISUAL */}
      {activeSubView === 'branding' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Sub-view con Único Botón de Guardado Principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <span>Branding, Colores & Personalización de Interfaz</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Personaliza la apariencia gráfica del sistema. La previsualización de la derecha refleja los cambios en tiempo real.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => {
                showToast('Configuración de marca e identidad visual guardada exitosamente.', 'success');
              }}
            >
              Guardar Configuración de Marca
            </Button>
          </div>

          {/* Grid Principal de Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Opciones Organizadas (2 Columnas) */}
            <div className="lg:col-span-2 space-y-6">
              {/* BLOQUE 0: LOGOTIPO PRINCIPAL DE LA APP */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-900 text-sm">0. Logotipo Principal de la App</h3>
                  </div>
                  {branding.logoUrl && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Logo Personalizado Activo
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  {/* Vista Previa Actual del Logo */}
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-7 h-7 text-amber-400" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <span className="font-bold text-slate-900 block">
                        {branding.logoUrl ? 'Logo de Marca Personalizado' : 'Logo Predeterminado (Ícono Store)'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Este logotipo se visualizará en la barra superior/lateral de menú de toda la aplicación.
                      </p>
                      {branding.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            updateBranding({ logoUrl: '' });
                            showToast('Logo removido. Se restauró el ícono por defecto.', 'info');
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline block pt-1"
                        >
                          Restaurar Logo Predeterminado
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input Carga por URL & Carga por Archivo Local */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Opción 1: Carga por URL */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Opción A: Enlace / URL de Imagen</label>
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        value={branding.logoUrl || ''}
                        onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    {/* Opción 2: Carga de Archivo Local */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Opción B: Subir Archivo Local (PNG, JPG, SVG)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const base64 = evt.target?.result as string;
                              if (base64) {
                                updateBranding({ logoUrl: base64 });
                                showToast('Logotipo cargado exitosamente desde archivo local.', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE DATOS DE EMPRESA Y CABECERA DE DOCUMENTOS / PDF */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Datos del Negocio / Empresa (Cabecera de Documentos & PDF)
                  </h3>
                </div>

                <p className="text-xs text-slate-500">
                  Estos datos se imprimirán automáticamente en los membretes y cabeceras de todos los documentos, comprobantes y recibos de sueldo generados en formato PDF por la aplicación.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nombre Comercial / Razón Social:</label>
                    <input
                      type="text"
                      value={branding.companyName || ''}
                      onChange={(e) => updateBranding({ companyName: e.target.value })}
                      placeholder="PLEGMA BARAPP S.A."
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subtítulo / Rubro:</label>
                    <input
                      type="text"
                      value={branding.companySubtitle || ''}
                      onChange={(e) => updateBranding({ companySubtitle: e.target.value })}
                      placeholder="Gastronomía & Servicios de Restaurante"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">CUIT / Identificación Fiscal:</label>
                    <input
                      type="text"
                      value={branding.cuit || ''}
                      onChange={(e) => updateBranding({ cuit: e.target.value })}
                      placeholder="30-71289341-9"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Dirección Comercial:</label>
                    <input
                      type="text"
                      value={branding.address || ''}
                      onChange={(e) => updateBranding({ address: e.target.value })}
                      placeholder="Av. Libertador 1420, CABA"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Teléfono de Contacto:</label>
                    <input
                      type="text"
                      value={branding.phone || ''}
                      onChange={(e) => updateBranding({ phone: e.target.value })}
                      placeholder="+54 11 4892-0192"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Correo Electrónico:</label>
                    <input
                      type="email"
                      value={branding.email || ''}
                      onChange={(e) => updateBranding({ email: e.target.value })}
                      placeholder="contacto@plegmabarapp.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 1: DISPOSICIÓN Y MENÚ DE NAVEGACIÓN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layout className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">1. Disposición y Colores del Menú de Navegación</h3>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Estilo de Disposición (Superior vs Lateral) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">Disposición del Menú</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          updateBranding({ navigationStyle: 'top' });
                          showToast('Navegación en Barra Superior aplicada.', 'info');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          branding.navigationStyle === 'top'
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Layout className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="block text-xs text-slate-900">Menú Superior (Barra Horizontal)</span>
                          <span className="text-[10px] text-slate-500 font-normal">Navegación con submenús desplegables superiores</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateBranding({ navigationStyle: 'sidebar' });
                          showToast('Navegación en Menú Lateral aplicada.', 'info');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          branding.navigationStyle === 'sidebar'
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Layout className="w-4 h-4 text-indigo-600 rotate-90 shrink-0" />
                        <div>
                          <span className="block text-xs text-slate-900">Menú Lateral (Sidebar en Cascada)</span>
                          <span className="text-[10px] text-slate-500 font-normal">Panel vertical con acordeón en cascada</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Grosor del Contorno de Íconos del Menú */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="font-semibold text-slate-800 block">Grosor de Contorno de Íconos del Menú (Stroke Width)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { width: 1.25, label: 'Super Fino (1.25px)' },
                        { width: 1.5, label: 'Fino (1.5px)' },
                        { width: 2, label: 'Estándar (2px)' },
                        { width: 2.5, label: 'Grueso (2.5px)' },
                        { width: 3, label: 'Extra Grueso (3px)' },
                      ].map((sw) => (
                        <button
                          key={sw.width}
                          type="button"
                          onClick={() => updateBranding({ menuIconStrokeWidth: sw.width })}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            (branding.menuIconStrokeWidth ?? 2) === sw.width
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {sw.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colores Hex del Menú */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Fondo del Menú (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuBgHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuBgHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Texto Inactivo (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuTextHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ menuTextHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuTextHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ menuTextHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Fondo Pestaña Activa (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuActiveBgHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ menuActiveBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuActiveBgHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ menuActiveBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Texto Pestaña Activa (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuActiveTextHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuActiveTextHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuActiveTextHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuActiveTextHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Íconos Inactivos (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuIconHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ menuIconHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuIconHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ menuIconHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Íconos Menú Activos (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.menuActiveIconHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuActiveIconHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.menuActiveIconHex || '#0f172a'}
                          onChange={(e) => updateBranding({ menuActiveIconHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Íconos Submenú Inactivos (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.submenuIconHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ submenuIconHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.submenuIconHex || '#94a3b8'}
                          onChange={(e) => updateBranding({ submenuIconHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Íconos Submenú Activos (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.submenuActiveIconHex || '#0f172a'}
                          onChange={(e) => updateBranding({ submenuActiveIconHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.submenuActiveIconHex || '#0f172a'}
                          onChange={(e) => updateBranding({ submenuActiveIconHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: ESTILOS DE BOTONES Y BOTÓN PRINCIPAL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Paintbrush className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">2. Estilos de Botones y Acciones Principales</h3>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Colores Hex del Botón Principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Color Fondo Botón (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.buttonBgHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ buttonBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.buttonBgHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ buttonBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Color Texto Botón (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.buttonTextHex || '#0f172a'}
                          onChange={(e) => updateBranding({ buttonTextHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.buttonTextHex || '#0f172a'}
                          onChange={(e) => updateBranding({ buttonTextHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Redondeo de Esquinas */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">Redondeo de Esquinas de Botón</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'rounded-full', label: 'Cápsula' },
                        { id: 'rounded-2xl', label: 'Curvo XL' },
                        { id: 'rounded-xl', label: 'Suave LG' },
                        { id: 'rounded-lg', label: 'Estándar' },
                        { id: 'rounded-none', label: 'Recto 90°' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => updateBranding({ buttonRadius: r.id as any })}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            branding.buttonRadius === r.id
                              ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sombreado de Botones */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">Sombreado de Botón (Box Shadow)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'Sin Sombra' },
                        { id: 'sm', label: 'Sombra Suave' },
                        { id: 'md', label: 'Elevado MD' },
                        { id: 'xl', label: 'Profundo 3D' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateBranding({ buttonShadowStyle: s.id as any })}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            branding.buttonShadowStyle === s.id
                              ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipografía Exclusiva para Botones */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="font-semibold text-slate-800 block">Tipografía Exclusiva de los Botones</label>
                    <select
                      value={branding.buttonFontFamily || branding.fontFamily || 'Inter'}
                      onChange={(e) => updateBranding({ buttonFontFamily: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                    >
                      {[
                        { id: 'Inter', name: 'Inter (Limpia & Funcional)' },
                        { id: 'Roboto', name: 'Roboto (Google Standard)' },
                        { id: 'Outfit', name: 'Outfit (Moderna & Premium)' },
                        { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
                        { id: 'Poppins', name: 'Poppins (Redondeada)' },
                        { id: 'Space Grotesk', name: 'Space Grotesk (Futurista)' },
                        { id: 'Montserrat', name: 'Montserrat (Elegante)' },
                        { id: 'Playfair Display', name: 'Playfair Display (Gourmet)' },
                        { id: 'Raleway', name: 'Raleway (Moderna LG)' },
                        { id: 'Oswald', name: 'Oswald (Condensada / Fuerte)' },
                        { id: 'Lora', name: 'Lora (Editorial / Clásica)' },
                        { id: 'Fira Code', name: 'Fira Code (Monospaced Tech)' },
                        { id: 'Cinzel', name: 'Cinzel (Premium Elegance)' },
                      ].map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: TOGGLES Y SELECTORES */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">3. Estilo de Interruptores & Toggles</h3>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Forma del Toggle */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">Forma Geométrica del Toggle</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateBranding({ toggleStyle: 'rounded' })}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          branding.toggleStyle === 'rounded'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="w-8 h-4 bg-emerald-500 rounded-full p-0.5 flex justify-end">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                        <span>Redondeado Circular</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateBranding({ toggleStyle: 'square' })}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          branding.toggleStyle === 'square'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="w-8 h-4 bg-emerald-500 rounded-md p-0.5 flex justify-end">
                          <div className="w-3 h-3 bg-white rounded-xs" />
                        </div>
                        <span>Cuadrado Moderno</span>
                      </button>
                    </div>
                  </div>

                  {/* Colores Hex del Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Color Toggle Activo (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.toggleActiveHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ toggleActiveHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.toggleActiveHex || '#f59e0b'}
                          onChange={(e) => updateBranding({ toggleActiveHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Color Toggle Inactivo (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.toggleInactiveHex || '#cbd5e1'}
                          onChange={(e) => updateBranding({ toggleInactiveHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.toggleInactiveHex || '#cbd5e1'}
                          onChange={(e) => updateBranding({ toggleInactiveHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 4: TIPOGRAFÍA Y FONDO GLOBAL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Type className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-sm">4. Tipografía Global & Fondo General de Pantalla</h3>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Fondo General App */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="font-semibold text-slate-800 block">Fondo de Pantalla App (#HEX)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.appBgHex || '#f8fafc'}
                        onChange={(e) => updateBranding({ appBgHex: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={branding.appBgHex || '#f8fafc'}
                        onChange={(e) => updateBranding({ appBgHex: e.target.value })}
                        className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Familia Tipográfica Expandida (13 Fuentes) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-800 block">Familia Tipográfica Global de la App</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {[
                        { id: 'Inter', name: 'Inter (UI Limpia)' },
                        { id: 'Roboto', name: 'Roboto (Standard)' },
                        { id: 'Outfit', name: 'Outfit (Moderna)' },
                        { id: 'Plus Jakarta Sans', name: 'Jakarta Sans' },
                        { id: 'Poppins', name: 'Poppins (Curva)' },
                        { id: 'Space Grotesk', name: 'Space Grotesk' },
                        { id: 'Montserrat', name: 'Montserrat' },
                        { id: 'Playfair Display', name: 'Playfair (Gourmet)' },
                        { id: 'Raleway', name: 'Raleway (Limpia)' },
                        { id: 'Oswald', name: 'Oswald (Fuerte)' },
                        { id: 'Lora', name: 'Lora (Editorial)' },
                        { id: 'Fira Code', name: 'Fira Code (Tech)' },
                        { id: 'Cinzel', name: 'Cinzel (Lujo)' },
                      ].map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => updateBranding({ fontFamily: font.id as any })}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            branding.fontFamily === font.id
                              ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="block text-xs font-bold" style={{ fontFamily: font.id }}>{font.id}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 block truncate">{font.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 5: ESTILOS Y COLORES DEL TABLERO KANBAN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Kanban className="w-4 h-4 text-orange-600" />
                  <h3 className="font-bold text-slate-900 text-sm">5. Estilos y Colores del Tablero Kanban</h3>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Colores de Fondo de Columnas y Tarjetas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Fondo de Columna Kanban (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.kanbanColumnBgHex || '#f1f5f9'}
                          onChange={(e) => updateBranding({ kanbanColumnBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.kanbanColumnBgHex || '#f1f5f9'}
                          onChange={(e) => updateBranding({ kanbanColumnBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Cabecera de Columna (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.kanbanHeaderBgHex || '#e2e8f0'}
                          onChange={(e) => updateBranding({ kanbanHeaderBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.kanbanHeaderBgHex || '#e2e8f0'}
                          onChange={(e) => updateBranding({ kanbanHeaderBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Fondo de Tarjeta Kanban (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.kanbanCardBgHex || '#ffffff'}
                          onChange={(e) => updateBranding({ kanbanCardBgHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.kanbanCardBgHex || '#ffffff'}
                          onChange={(e) => updateBranding({ kanbanCardBgHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="font-semibold text-slate-800 block">Borde de Tarjeta Kanban (#HEX)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.kanbanCardBorderHex || '#e2e8f0'}
                          onChange={(e) => updateBranding({ kanbanCardBorderHex: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={branding.kanbanCardBorderHex || '#e2e8f0'}
                          onChange={(e) => updateBranding({ kanbanCardBorderHex: e.target.value })}
                          className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Panel Lateral: PREVISUALIZACIÓN EN VIVO (REALISTIC MINI APP MOCKUP) */}
            <div className="space-y-6">
              <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-3xl space-y-4 shadow-2xl border border-slate-800 relative lg:sticky lg:top-20">
                {/* Sandbox Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">Previsualización Realista App</h3>
                      <p className="text-[10px] text-slate-400">Maqueta interactiva en tiempo real.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                    LIVE MOCKUP
                  </span>
                </div>

                {/* REALISTIC MINI APP MOCKUP FRAME */}
                <div
                  style={{
                    backgroundColor: branding.appBgHex || '#f8fafc',
                    fontFamily: branding.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit',
                  }}
                  className="rounded-2xl border border-slate-800 p-3.5 space-y-3 text-slate-900 shadow-inner overflow-hidden relative transition-all"
                >
                  {/* 1. MOCKUP TOP HEADER / MENU NAVBAR */}
                  <div
                    style={{
                      backgroundColor: branding.menuBgHex || '#0f172a',
                      color: branding.menuTextHex || '#94a3b8',
                      fontFamily: branding.menuFontFamily ? `'${branding.menuFontFamily}', sans-serif` : 'inherit',
                    }}
                    className="rounded-xl p-2.5 shadow-md flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-6 h-6 rounded-lg object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                          P
                        </div>
                      )}
                      <span className="font-bold text-xs" style={{ color: branding.menuTextHex || '#ffffff' }}>
                        PLEGMA Gastro
                      </span>
                    </div>

                    {/* Mockup Active / Inactive Menu Tabs */}
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{
                          backgroundColor: branding.menuActiveBgHex || '#f59e0b',
                          color: branding.menuActiveTextHex || '#0f172a',
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-xs"
                      >
                        Tab Activa
                      </div>
                      <div
                        style={{ color: branding.menuTextHex || '#94a3b8' }}
                        className="px-2 py-1 text-[10px] font-medium opacity-80"
                      >
                        Inactiva
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 text-center font-mono">
                    ⬆️ <strong>Barra de Menú</strong> ({branding.navigationStyle === 'sidebar' ? 'Modo Sidebar' : 'Modo Superior'})
                  </div>

                  {/* 2. MOCKUP APP CARD & BUTTON PREVIEW */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-xs text-slate-900" style={{ fontFamily: branding.fontFamily }}>
                        Muestra de Contenido & Botón
                      </h5>
                      <span className="text-[9px] text-slate-400 font-mono">VistaPrevia</span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug" style={{ fontFamily: branding.fontFamily }}>
                      Así lucirá el texto general y los botones de acción en las tablas y formularios.
                    </p>

                    {/* Mockup Button with Dedicated Font */}
                    <button
                      type="button"
                      style={{
                        backgroundColor: branding.buttonBgHex || '#f59e0b',
                        color: branding.buttonTextHex || '#0f172a',
                        fontFamily: branding.buttonFontFamily
                          ? `'${branding.buttonFontFamily}', sans-serif`
                          : branding.fontFamily || 'Inter',
                      }}
                      className={`w-full py-2 px-3 text-xs ${branding.buttonFontWeight || 'font-bold'} ${
                        branding.buttonRadius || 'rounded-xl'
                      } ${
                        branding.buttonShadowStyle === 'sm'
                          ? 'shadow-xs'
                          : branding.buttonShadowStyle === 'md'
                          ? 'shadow-md'
                          : branding.buttonShadowStyle === 'xl'
                          ? 'shadow-xl'
                          : ''
                      } transition-all border border-black/5`}
                    >
                      Botón Principal Activo
                    </button>
                  </div>

                  {/* 3. MOCKUP TOGGLE SWITCHES PREVIEW */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-2 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                      Muestra de Switches & Toggles
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">Filtro / Estado Activo</span>
                      <div
                        style={{ backgroundColor: branding.toggleActiveHex || '#f59e0b' }}
                        className={`w-10 h-5 p-0.5 ${
                          branding.toggleStyle === 'square' ? 'rounded-md' : 'rounded-full'
                        } flex items-center justify-end transition-all shadow-inner`}
                      >
                        <div
                          className={`w-4 h-4 bg-white ${
                            branding.toggleStyle === 'square' ? 'rounded-xs' : 'rounded-full'
                          } shadow-md`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Estado Inactivo</span>
                      <div
                        style={{ backgroundColor: branding.toggleInactiveHex || '#cbd5e1' }}
                        className={`w-10 h-5 p-0.5 ${
                          branding.toggleStyle === 'square' ? 'rounded-md' : 'rounded-full'
                        } flex items-center justify-start transition-all shadow-inner`}
                      >
                        <div
                          className={`w-4 h-4 bg-white ${
                            branding.toggleStyle === 'square' ? 'rounded-xs' : 'rounded-full'
                          } shadow-md`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. MOCKUP KANBAN BOARD PREVIEW */}
                  <div
                    style={{ backgroundColor: branding.kanbanColumnBgHex || '#f1f5f9' }}
                    className="p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-xs"
                  >
                    <div
                      style={{ backgroundColor: branding.kanbanHeaderBgHex || '#e2e8f0' }}
                      className="p-1.5 rounded-lg flex items-center justify-between text-[10px] font-bold text-slate-800"
                    >
                      <span className="flex items-center gap-1">
                        <Kanban className="w-3 h-3 text-orange-600" />
                        <span>Columna Kanban</span>
                      </span>
                      <span className="bg-slate-300/80 px-1.5 py-0.5 rounded-full text-[9px]">2</span>
                    </div>

                    <div
                      style={{
                        backgroundColor: branding.kanbanCardBgHex || '#ffffff',
                        borderColor: branding.kanbanCardBorderHex || '#e2e8f0',
                      }}
                      className="p-2 rounded-lg border text-[10px] space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Proveedor Distribuidora</span>
                        <span className="text-[8px] bg-amber-100 text-amber-900 font-bold px-1 rounded">
                          Conteo
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500">Muestra de tarjeta Kanban en vivo.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 text-white p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <span>✓ Tipografía Global:</span>
                      <span className="font-mono text-white">{branding.fontFamily || 'Inter'}</span>
                    </div>
                    <div className="text-slate-400">
                      Fondo App: <span className="font-mono text-slate-200">{branding.appBgHex || '#f8fafc'}</span> | Menú: <span className="font-mono text-slate-200">{branding.menuBgHex || '#0f172a'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FORMULARIO SEPARADO EN MODAL INDEPENDIENTE PARA CREAR O EDITAR / ELIMINAR --- */}
      {formModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            style={{ fontFamily: branding.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit' }}
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 space-y-6 shadow-2xl border border-slate-200"
          >
            {/* Header del Formulario */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${formModal.isNew ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {formModal.isNew ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {formModal.isNew ? `+ Nuevo ${formModal.entity.toUpperCase()}` : `Editar ${formModal.entity.toUpperCase()}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formModal.isNew ? 'Ingresa los datos para dar de alta un nuevo registro.' : 'Modifica los campos del registro o elimina el elemento.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULARIO CLIENTE */}
            {formModal.entity === 'cliente' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveClient(formModal.data, formModal.isNew);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <FormField label="Cliente (Nombre o Razón Social)" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. Restaurante Las Heras S.A."
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Teléfono de Contacto" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. 011-4555-9988"
                      value={formModal.data.phone || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, phone: e.target.value } })}
                      required
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Dirección (Fiscal o Domicilio)" required>
                      <TextInput
                        type="text"
                        placeholder="Ej. Av. Las Heras 2450, CABA"
                        value={formModal.data.address || ''}
                        onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, address: e.target.value } })}
                        required
                      />
                    </FormField>
                  </div>

                  <FormField label="Código de Cliente (Opcional)">
                    <TextInput
                      type="text"
                      value={formModal.data.code || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, code: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="Geolocalización (URL o Coordenadas)">
                    <TextInput
                      type="text"
                      placeholder="Ej. https://maps.google.com/..."
                      value={formModal.data.geolocation || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, geolocation: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="CUIT / Identificación Fiscal">
                    <TextInput
                      type="text"
                      placeholder="30-70000000-8"
                      value={formModal.data.cuit || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, cuit: e.target.value } })}
                    />
                  </FormField>
                </div>

                {/* BLOQUE CONFIGURACIONES DE CLIENTE */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Configuración Operativa & Cuenta Corriente</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Cuenta Corriente */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${formModal.data.hasCurrentAccount ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                      <div>
                        <span className="font-bold text-slate-900 block">Cuenta Corriente</span>
                        <span className="text-[10px] text-slate-500 block">Permite operar a crédito / saldo pendiente</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formModal.data.hasCurrentAccount)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setFormModal({
                            ...formModal,
                            data: {
                              ...formModal.data,
                              hasCurrentAccount: val,
                              differentiatedBilling: val ? formModal.data.differentiatedBilling : false,
                            },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </label>

                    {/* Cobro Diferenciado [NUEVO] */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border transition ${formModal.data.hasCurrentAccount ? (formModal.data.differentiatedBilling ? 'bg-purple-50 border-purple-300 cursor-pointer' : 'bg-white border-slate-200 cursor-pointer') : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block">Cobro Diferenciado</span>
                          <span className="px-1.5 py-0.2 bg-purple-600 text-white font-extrabold text-[9px] rounded">NUEVO</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Ventas valorizadas al costo en lugar de precio venta</span>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!formModal.data.hasCurrentAccount}
                        checked={Boolean(formModal.data.differentiatedBilling)}
                        onChange={(e) =>
                          setFormModal({
                            ...formModal,
                            data: { ...formModal.data, differentiatedBilling: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                    </label>

                    {/* Por Defecto */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${formModal.data.isDefault ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                      <div>
                        <span className="font-bold text-slate-900 block">Cliente Por Defecto</span>
                        <span className="text-[10px] text-slate-500 block">Propuesto automáticamente en nuevas ventas</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formModal.data.isDefault)}
                        onChange={(e) =>
                          setFormModal({
                            ...formModal,
                            data: { ...formModal.data, isDefault: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                      />
                    </label>

                    {/* Empleado */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${formModal.data.isEmployee ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-slate-200'}`}>
                      <div>
                        <span className="font-bold text-slate-900 block">Cliente Empleado</span>
                        <span className="text-[10px] text-slate-500 block">Identifica a este cliente como empleado del local</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(formModal.data.isEmployee)}
                        onChange={(e) =>
                          setFormModal({
                            ...formModal,
                            data: { ...formModal.data, isEmployee: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                    </label>
                  </div>

                  {/* Estado Activo */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Estado del Cliente:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formModal.data.active)}
                        onChange={(e) =>
                          setFormModal({
                            ...formModal,
                            data: { ...formModal.data, active: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className={`font-bold text-xs ${formModal.data.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {formModal.data.active ? 'Cliente Habilitado (Activo)' : 'Inactivo'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Observaciones */}
                <FormField label="Observaciones / Notas Adicionales">
                  <textarea
                    rows={2}
                    placeholder="Notas o información adicional del cliente..."
                    value={formModal.data.notes || ''}
                    onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, notes: e.target.value } })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </FormField>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteClient(formModal.data.id, formModal.data.name)}
                      requiredPermission="canDelete" hideIfNoPermission={false}
                    >
                      Eliminar Registro
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md" requiredPermission={formModal.isNew ? 'canCreate' : 'canEdit'} hideIfNoPermission={false}>
                      {formModal.isNew ? 'Guardar Cliente' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO PROVEEDOR */}
            {formModal.entity === 'proveedor' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProvider(formModal.data, formModal.isNew);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <FormField label="Proveedor (Nombre o Razón Social)" required hint="No se permiten nombres duplicados">
                    <TextInput
                      type="text"
                      placeholder="Ej. Carnicería 6 Esquinas S.A."
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="CUIT / Identificación Fiscal">
                    <TextInput
                      type="text"
                      placeholder="Ej. 30-99887766-5"
                      value={formModal.data.cuit || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, cuit: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="Teléfono de Contacto">
                    <TextInput
                      type="text"
                      placeholder="Ej. 351 555-8888"
                      value={formModal.data.phone || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, phone: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="Correo Electrónico (Email)">
                    <TextInput
                      type="email"
                      placeholder="Ej. ventas@6esquinas.com.ar"
                      value={formModal.data.email || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, email: e.target.value } })}
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Dirección Física">
                      <TextInput
                        type="text"
                        placeholder="Ej. Av. Siempre Viva 1234, Córdoba"
                        value={formModal.data.address || ''}
                        onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, address: e.target.value } })}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Rubro Principal"
                    hint={
                      hasPermission('canInlineCreate')
                        ? '✓ Puedes hacer clic en el botón + para agregar un nuevo rubro'
                        : '🔒 Tu rol no tiene permiso para agregar rubros en vivo'
                    }
                  >
                    <SelectWithInlineAdd
                      options={itemCategories.filter((c) => c.active).map((c) => ({ value: c.name, label: c.name }))}
                      value={formModal.data.rubro || 'Equipamiento'}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, rubro: e.target.value } })}
                      placeholder="Seleccionar Rubro..."
                      onInlineAdd={(newCatName) => handleAddInlineCategory(newCatName)}
                      inlineAddTitle="Crear Rubro Rápido"
                      inlineAddPlaceholder="Ej. Panadería & Repostería"
                      requiredPermission="canInlineCreate"
                    />
                  </FormField>

                  <FormField label="Subrubro">
                    <TextInput
                      type="text"
                      placeholder="Ej. Carnes Vacunas & Aves"
                      value={formModal.data.subrubro || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, subrubro: e.target.value } })}
                    />
                  </FormField>
                </div>

                {/* Estado del Proveedor */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Estado del Proveedor</span>
                    <span className="text-[10px] text-slate-500 block">
                      Los proveedores inactivos no estarán disponibles para nuevas compras o cargas de gastos
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formModal.data.active)}
                      onChange={(e) =>
                        setFormModal({
                          ...formModal,
                          data: { ...formModal.data, active: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className={`font-bold text-xs ${formModal.data.active ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {formModal.data.active ? 'Activo (Habilitado)' : 'Inactivo'}
                    </span>
                  </label>
                </div>

                {/* Observaciones */}
                <FormField label="Observaciones / Notas de Proveedor">
                  <textarea
                    rows={2}
                    placeholder="Notas o información comercial del proveedor..."
                    value={formModal.data.notes || ''}
                    onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, notes: e.target.value } })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </FormField>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteProvider(formModal.data.id, formModal.data.name)}
                      requiredPermission="canDelete"
                      hideIfNoPermission={false}
                    >
                      Eliminar Proveedor
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md" requiredPermission={formModal.isNew ? 'canCreate' : 'canEdit'} hideIfNoPermission={false}>
                      {formModal.isNew ? 'Guardar Proveedor' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO USUARIO */}
            {formModal.entity === 'usuario' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveUser(formModal.data, formModal.isNew);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="DNI" required hint="Número de documento de identidad">
                    <TextInput
                      type="text"
                      placeholder="Ej. 35123456"
                      value={formModal.data.dni || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, dni: e.target.value } })}
                      disabled={!formModal.isNew}
                      required
                    />
                  </FormField>

                  <FormField label="Nombre y Apellido" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Email" required>
                    <TextInput
                      type="email"
                      placeholder="juan@plegma.com"
                      value={formModal.data.email || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, email: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Teléfono">
                    <TextInput
                      type="text"
                      placeholder="+54 11 4000-0000"
                      value={formModal.data.phone || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, phone: e.target.value } })}
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Dirección Física">
                      <TextInput
                        type="text"
                        placeholder="Av. Corrientes 1234"
                        value={formModal.data.address || ''}
                        onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, address: e.target.value } })}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label="Perfil (Cargo del Puesto)">
                      <SelectInput
                        options={userProfiles.map((p) => ({ value: p.id, label: `${p.name} - ${p.description}` }))}
                        value={formModal.data.profileId || userProfiles[0]?.id || ''}
                        onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, profileId: e.target.value } })}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Asignación de Múltiples Roles Checkboxes */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Roles Asignados al Usuario (Permite Múltiples Roles por Rotación):</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Marca todos los roles aplicables</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {granularRoles.map((r) => {
                      const isChecked = (formModal.data.assignedRoleIds || []).includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition cursor-pointer ${
                            isChecked ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current: string[] = formModal.data.assignedRoleIds || [];
                              const updated = e.target.checked
                                ? [...current, r.id]
                                : current.filter((id: string) => id !== r.id);
                              setFormModal({
                                ...formModal,
                                data: { ...formModal.data, assignedRoleIds: updated },
                              });
                            }}
                            className="mt-0.5 w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{r.name}</div>
                            <div className="text-[10px] text-slate-500">{r.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Permiso Especial Individual para Desplegables */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Permiso Especial Individual:</span>
                  </h5>
                  <div>
                    <label className="flex items-center gap-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 hover:bg-indigo-100/60 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={Boolean(formModal.data.canInlineCreate)}
                        onChange={(e) =>
                          setFormModal({
                            ...formModal,
                            data: { ...formModal.data, canInlineCreate: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-indigo-950 text-xs block">
                          Habilitar botón (+) para Agregar en Campos Desplegables
                        </span>
                        <span className="text-[10px] text-indigo-700">
                          Permite al usuario crear nuevos rubros o elementos en vivo directamente desde los selectores desplegables.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteUser(formModal.data.id, formModal.data.name)}
                      requiredPermission="canDelete" hideIfNoPermission={false}
                    >
                      Eliminar Usuario
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md" requiredPermission={formModal.isNew ? 'canCreate' : 'canEdit'} hideIfNoPermission={false}>
                      {formModal.isNew ? 'Dar de Alta Usuario' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO PERFIL (CARGO) */}
            {formModal.entity === 'perfil' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile(formModal.data, formModal.isNew);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-3">
                  <FormField label="Nombre del Perfil / Cargo" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. Barman / Coctelería Principal"
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Descripción de Funciones & Responsabilidades">
                    <TextInput
                      type="text"
                      placeholder="Ej. Control de stock de licores, insumos de coctelería y apertura de barra"
                      value={formModal.data.description || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, description: e.target.value } })}
                    />
                  </FormField>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteProfile(formModal.data.id, formModal.data.name)}
                    >
                      Eliminar Perfil
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md">
                      {formModal.isNew ? 'Crear Perfil' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO ROL GRANULAR */}
            {formModal.entity === 'rol' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRole(formModal.data, formModal.isNew);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-3">
                  <FormField label="Nombre del Rol Granular" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. Rol Recepción & Auditoría Depósito"
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Descripción / Ámbito de Acción">
                    <TextInput
                      type="text"
                      placeholder="Ej. Permite verificar entregas de insumos y consultar el módulo de auditoría"
                      value={formModal.data.description || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, description: e.target.value } })}
                    />
                  </FormField>

                  {/* Matriz de Acciones por Módulo */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <h5 className="font-bold text-slate-800 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Nivel de Permiso por Módulo de la App:</span>
                      </span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'kanban', label: 'Tablero Semanal (Kanban)' },
                        { key: 'inbox', label: 'Pedidos & Pagos (Inbox)' },
                        { key: 'items', label: 'Maestro de Insumos' },
                        { key: 'dashboard', label: 'Dashboard de Compras' },
                        { key: 'audit', label: 'Módulo Auditoría' },
                        { key: 'maestros', label: 'Maestros & Parámetros' },
                      ].map((mod) => {
                        const currentLevel = formModal.data.moduleAccess?.[mod.key] || 'none';
                        return (
                          <div key={mod.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="font-bold text-slate-900 block">{mod.label}</span>
                            <SelectInput
                              options={[
                                { value: 'none', label: '🚫 No ver (Sin acceso)' },
                                { value: 'view', label: '👁️ Ver (Solo Lectura)' },
                                { value: 'create', label: '➕ Crear (Ver + Alta)' },
                                { value: 'edit', label: '✏️ Editar (Ver + Crear + Modificar)' },
                                { value: 'full', label: '👑 Acceso Total (Ver + Crear + Editar + Eliminar)' },
                              ]}
                              value={currentLevel}
                              onChange={(e) => {
                                const newLevel = e.target.value;
                                setFormModal({
                                  ...formModal,
                                  data: {
                                    ...formModal.data,
                                    moduleAccess: {
                                      ...formModal.data.moduleAccess,
                                      [mod.key]: newLevel,
                                    },
                                  },
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteRole(formModal.data.id, formModal.data.name)}
                    >
                      Eliminar Rol
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md">
                      {formModal.isNew ? 'Crear Rol Granular' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO CATEGORÍA */}
            {formModal.entity === 'categoria' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCategory(formModal.data, formModal.isNew);
                }}
                className="space-y-4 text-xs"
              >
                <FormField label="Nombre del Rubro / Categoría" required>
                  <TextInput
                    type="text"
                    placeholder="Ej. Congelados, Panadería"
                    value={formModal.data.name || ''}
                    onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                    required
                  />
                </FormField>

                <FormField label="Descripción">
                  <TextInput
                    type="text"
                    placeholder="Breve detalle de insumos asociados..."
                    value={formModal.data.description || ''}
                    onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, description: e.target.value } })}
                  />
                </FormField>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteCategory(formModal.data.id, formModal.data.name)}
                      requiredPermission="canDelete" hideIfNoPermission={false}
                    >
                      Eliminar Categoría
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md" requiredPermission={formModal.isNew ? 'canCreate' : 'canEdit'} hideIfNoPermission={false}>
                      {formModal.isNew ? 'Guardar Categoría' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO DEPÓSITO */}
            {formModal.entity === 'deposito' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveWarehouse(formModal.data, formModal.isNew);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Código de Depósito">
                    <TextInput
                      type="text"
                      value={formModal.data.code || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, code: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="Tipo de Almacén">
                    <SelectInput
                      options={[
                        { value: 'Seco', label: 'Depósito Seco' },
                        { value: 'Frío', label: 'Cámara de Frío' },
                        { value: 'Congelados', label: 'Cámara Congelados' },
                        { value: 'Cava', label: 'Cava de Vinos' },
                        { value: 'Barra', label: 'Barra & Salón' },
                      ]}
                      value={formModal.data.type || 'Seco'}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, type: e.target.value } })}
                    />
                  </FormField>

                  <FormField label="Nombre de la Ubicación" required>
                    <TextInput
                      type="text"
                      placeholder="Ej. Depósito Central Secos"
                      value={formModal.data.name || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, name: e.target.value } })}
                      required
                    />
                  </FormField>

                  <FormField label="Nombre del Responsable">
                    <TextInput
                      type="text"
                      placeholder="Ej. Jorge López"
                      value={formModal.data.responsibleName || ''}
                      onChange={(e) => setFormModal({ ...formModal, data: { ...formModal.data, responsibleName: e.target.value } })}
                    />
                  </FormField>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  {!formModal.isNew ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteWarehouse(formModal.data.id, formModal.data.name)}
                      requiredPermission="canDelete" hideIfNoPermission={false}
                    >
                      Eliminar Ubicación
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="md" onClick={() => setFormModal(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="md" requiredPermission={formModal.isNew ? 'canCreate' : 'canEdit'} hideIfNoPermission={false}>
                      {formModal.isNew ? 'Guardar Ubicación' : 'Guardar Modificaciones'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL FICHA DE CLIENTE & CUENTA CORRIENTE (SOLO VISUALIZACIÓN 3.2) */}
      {viewingCurrentAccountClient && (
        <div className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            style={{ fontFamily: branding.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit' }}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 space-y-6 shadow-2xl border border-slate-200 animate-fadeIn"
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {viewingCurrentAccountClient.name}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-full border">
                      {viewingCurrentAccountClient.code}
                    </span>
                    {viewingCurrentAccountClient.isDefault && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300">
                        Por Defecto
                      </span>
                    )}
                    {viewingCurrentAccountClient.isEmployee && (
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 font-extrabold text-[10px] rounded-full border border-cyan-300">
                        Empleado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>📞 {viewingCurrentAccountClient.phone}</span>
                    <span>📍 {viewingCurrentAccountClient.address}</span>
                    {viewingCurrentAccountClient.cuit && <span>📄 CUIT: {viewingCurrentAccountClient.cuit}</span>}
                    {viewingCurrentAccountClient.geolocation && <span>🌍 Mapa: {viewingCurrentAccountClient.geolocation}</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCurrentAccountClient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Resumen Deuda & Badges de Cuenta Corriente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Deuda Pendiente AUTO */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white space-y-1 shadow-md">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Deuda Pendiente [AUTO]</span>
                <span className="text-2xl font-black font-mono text-emerald-400 block">
                  ${getClientDebt(viewingCurrentAccountClient.id).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-400 block">Calculado en tiempo real según movimientos</span>
              </div>

              {/* Indicador Cuenta Corriente */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 block">Condición de Cuenta Corriente</span>
                <span className="text-sm font-bold text-emerald-950 block">Habilitado para Operar a Crédito</span>
                <span className="text-[10px] text-emerald-700 block">Las ventas pueden facturarse con pago Cuenta Corriente</span>
              </div>

              {/* Indicador Cobro Diferenciado */}
              <div className={`p-4 rounded-2xl border space-y-1 ${viewingCurrentAccountClient.differentiatedBilling ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-extrabold text-purple-900 block">Cobro Diferenciado</span>
                <span className="text-sm font-bold text-purple-950 block">
                  {viewingCurrentAccountClient.differentiatedBilling ? 'SÍ — Valorizado al Costo' : 'NO — Precio de Venta Normal'}
                </span>
                <span className="text-[10px] text-purple-700 block">
                  {viewingCurrentAccountClient.differentiatedBilling ? 'Las ventas se imputan al costo vigente del insumo' : 'Facturación estándar'}
                </span>
              </div>
            </div>

            {/* Tabla Historial de Movimientos 3.2 (Solo Visualización) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Historial de Movimientos de Cuenta Corriente (Solo Visualización)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">No permite ingreso ni edición directa</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Fecha / Hora [SYS]</th>
                      <th className="py-3 px-4">Comprobante</th>
                      <th className="py-3 px-4">Tipo Movimiento</th>
                      <th className="py-3 px-4">Detalle Ticket</th>
                      <th className="py-3 px-4 text-right">Importe [AUTO]</th>
                      <th className="py-3 px-4 text-center">Estado [SYS]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {currentAccountMovements.filter((m) => m.clientId === viewingCurrentAccountClient.id).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No hay movimientos registrados en la cuenta corriente de este cliente.
                        </td>
                      </tr>
                    ) : (
                      currentAccountMovements
                        .filter((m) => m.clientId === viewingCurrentAccountClient.id)
                        .map((mov) => (
                          <tr key={mov.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{mov.dateTime}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{mov.voucherType}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${mov.type === 'Venta' ? 'bg-amber-100 text-amber-900 border border-amber-300' : mov.type === 'Recibo' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
                                {mov.type === 'Venta' && '🛒 Venta'}
                                {mov.type === 'Recibo' && '💲 Recibo'}
                                {mov.type === 'Ajuste' && '🔄 Ajuste'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={mov.ticketDetail}>
                              {mov.ticketDetail || '-'}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${mov.type === 'Venta' ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {mov.type === 'Venta' ? '+' : '-'}${mov.total.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${mov.lineState === 'Pagada' ? 'bg-emerald-100 text-emerald-900' : mov.lineState === 'Seleccionada' ? 'bg-purple-100 text-purple-900' : 'bg-amber-100 text-amber-900'}`}>
                                {mov.lineState}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Cerrar */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => setViewingCurrentAccountClient(null)}>
                Cerrar Ficha
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FICHA DE PROVEEDOR & ESTADO DE CUENTA (DETALLE & COMPRAS 4 & 5) */}
      {viewingProviderDetail && (
        <div className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            style={{ fontFamily: branding.fontFamily ? `'${branding.fontFamily}', sans-serif` : 'inherit' }}
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 space-y-6 shadow-2xl border border-slate-200 animate-fadeIn"
          >
            {/* Header Ficha del Proveedor */}
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl mt-1">
                  <Store className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900">
                      {viewingProviderDetail.name}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-full border">
                      {viewingProviderDetail.code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${viewingProviderDetail.active ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                      {viewingProviderDetail.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">📍 Dirección:</span>
                      <span>{viewingProviderDetail.address || 'Sin especificar'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">📞 TEL:</span>
                      <span>{viewingProviderDetail.phone || 'Sin especificar'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">✉️ Email:</span>
                      <span>{viewingProviderDetail.email || 'Sin especificar'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">🏷️ Rubro:</span>
                      <span>{viewingProviderDetail.rubro || 'General'} {viewingProviderDetail.subrubro ? `(${viewingProviderDetail.subrubro})` : ''}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const target = viewingProviderDetail;
                    setViewingProviderDetail(null);
                    handleOpenProviderForm(target);
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="w-4 h-4 text-indigo-600" />}
                >
                  Editar Proveedor
                </Button>
                <button
                  onClick={() => setViewingProviderDetail(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Panel Estado de Cuenta (Resumen Financiero 4 [AUTO]) */}
            {(() => {
              const stats = getProviderStats(viewingProviderDetail.id);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Total Comprado */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Total Comprado [AUTO]</span>
                    <span className="text-xl font-black font-mono text-emerald-700 block">
                      ${stats.totalComprado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Total Pagado */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-800 block">Total Pagado [AUTO]</span>
                    <span className="text-xl font-black font-mono text-emerald-900 block">
                      ${stats.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Saldo Pendiente */}
                  <div className={`p-4 rounded-2xl border text-center space-y-1 ${stats.saldoPendiente > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] uppercase font-extrabold text-amber-900 block">Saldo Pendiente [AUTO]</span>
                    <span className={`text-xl font-black font-mono block ${stats.saldoPendiente > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
                      ${stats.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Compras Realizadas */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-blue-800 block">Compras Realizadas</span>
                    <span className="text-xl font-black font-mono text-blue-900 block">
                      {stats.count}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Pestañas de la Ficha (COMPRAS, DOCUMENTOS, NOTAS, CONTACTOS, ADJUNTOS) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'compras', label: 'COMPRAS', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
                  { id: 'documentos', label: 'DOCUMENTOS', icon: <FileText className="w-3.5 h-3.5" /> },
                  { id: 'notas', label: 'NOTAS', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { id: 'contactos', label: 'CONTACTOS', icon: <Phone className="w-3.5 h-3.5" /> },
                  { id: 'adjuntos', label: 'ADJUNTOS', icon: <Paperclip className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProviderTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeProviderTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* CONTENIDO PESTAÑA COMPRAS */}
              {activeProviderTab === 'compras' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Fecha Compra [SYS]</th>
                        <th className="py-3 px-4">Comprobante</th>
                        <th className="py-3 px-4 text-right">Total Compra [AUTO]</th>
                        <th className="py-3 px-4 text-center">Estado Compra</th>
                        <th className="py-3 px-4 text-center">Estado Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {providerPurchases.filter((p) => p.providerId === viewingProviderDetail.id).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            No hay comprobantes de compra registrados para este proveedor.
                          </td>
                        </tr>
                      ) : (
                        providerPurchases
                          .filter((p) => p.providerId === viewingProviderDetail.id)
                          .map((pur) => (
                            <tr key={pur.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{pur.purchaseDate}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{pur.voucherNumber}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                ${pur.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${pur.purchaseStatus === 'Anulada' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-blue-100 text-blue-900 border border-blue-200'}`}>
                                  {pur.purchaseStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                                  pur.paymentStatus === 'Pagada'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : pur.paymentStatus === 'Pendiente'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : pur.paymentStatus === 'Parcial'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}>
                                  {pur.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* OTRAS PESTAÑAS (DOCUMENTOS, NOTAS, CONTACTOS, ADJUNTOS) */}
              {activeProviderTab !== 'compras' && (
                <div className="p-8 border border-slate-200 rounded-2xl bg-slate-50 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-700 block uppercase">
                    Sección {activeProviderTab.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-500">
                    Registro complementario de {activeProviderTab} para el proveedor {viewingProviderDetail.name}.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Cerrar */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => setViewingProviderDetail(null)}>
                Cerrar Ficha
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
