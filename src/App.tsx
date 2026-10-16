import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { ProviderSheet } from './components/ProviderSheet';
import { StockCountModal } from './components/StockCountModal';
import { OrderReviewModal } from './components/OrderReviewModal';
import { OrderDocumentModal } from './components/OrderDocumentModal';
import { GoodsReceptionModal } from './components/GoodsReceptionModal';
import { OrderInbox } from './components/OrderInbox';
import { ItemMasterView } from './components/ItemMasterView';
import { PurchasingDashboard } from './components/PurchasingDashboard';
import { SettingsModal } from './components/SettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { ProviderEditModal } from './components/ProviderEditModal';
import { MaestrosView } from './components/MaestrosView';
import { EmployeeMasterView } from './components/EmployeeMasterView';
import { ClockView } from './components/ClockView';
import { AdvancesConsumptionsView } from './components/AdvancesConsumptionsView';
import { PayrunsView } from './components/PayrunsView';
import { MobileHomeView } from './components/MobileHomeView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/ui/Toast';
import { CurrentAccountView } from './components/CurrentAccountView';
import { CashControlView } from './components/CashControlView';
import { ReservationsView } from './components/ReservationsView';
import { SalesConfigView } from './components/SalesConfigView';
import { OrdersView } from './components/OrdersView';
import { ComandasPosView } from './components/ComandasPosView';
import { SaleProductsView } from './components/sales/SaleProductsView';
import { ProductionsView } from './components/productions/ProductionsView';
import { useIsMobile } from './hooks/useIsMobile';
import { Provider, Order, StockCount } from './types';

function MainLayout() {
  const { providers, orders, branding } = useApp();
  const isMobile = useIsMobile(768);
  const isSidebar = branding?.navigationStyle === 'sidebar';

  const [currentTab, setCurrentTab] = useState<string>(() =>
    window.innerWidth < 768 ? 'mobile_home' : 'kanban'
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedProviderForSheet, setSelectedProviderForSheet] = useState<Provider | null>(null);
  const [stockCountProvider, setStockCountProvider] = useState<Provider | null>(null);
  const [orderReviewProvider, setOrderReviewProvider] = useState<Provider | null>(null);
  const [activeOrderForDocument, setActiveOrderForDocument] = useState<Order | null>(null);
  const [receivingOrder, setReceivingOrder] = useState<Order | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null | 'new'>(null);

  const [maestrosSubTab, setMaestrosSubTab] = useState<
    'clientes' | 'proveedores' | 'usuarios' | 'categorias' | 'depositos' | 'cuentas' | 'branding' | null
  >(null);

  const [rrhhSubTab, setRrhhSubTab] = useState<
    'empleados' | 'marcacion' | 'adelantos' | 'liquidaciones' | null
  >('empleados');

  const handleNavigateTab = (tabId: string) => {
    if (tabId.startsWith('maestros-')) {
      const sub = tabId.replace('maestros-', '') as any;
      setMaestrosSubTab(sub);
      setCurrentTab('maestros');
    } else if (tabId.startsWith('rrhh-')) {
      const sub = tabId.replace('rrhh-', '') as any;
      setRrhhSubTab(sub);
      setCurrentTab('recursos_humanos');
    } else {
      if (tabId === 'maestros') {
        setMaestrosSubTab(null);
      } else if (tabId === 'recursos_humanos') {
        setRrhhSubTab('empleados');
      }
      setCurrentTab(tabId as any);
    }
  };

  // Quick Action Handlers from Kanban
  const handleSelectProvider = (provider: Provider) => {
    setSelectedProviderForSheet(provider);
  };

  const handleStartStockCount = (provider: Provider) => {
    setSelectedProviderForSheet(null);
    setStockCountProvider(provider);
  };

  const handleStartOrderReview = (provider: Provider) => {
    setSelectedProviderForSheet(null);
    setOrderReviewProvider(provider);
  };

  const handleReceiveGoods = (provider: Provider, specificOrder?: Order) => {
    setSelectedProviderForSheet(null);
    const targetOrd =
      specificOrder ||
      orders
        .filter((o) => o.providerId === provider.id && (o.status === 'Pendiente de entrega' || o.status === 'Pedido confirmado'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (targetOrd) {
      setReceivingOrder(targetOrd);
    } else {
      alert('No existe un pedido pendiente de recepción para este proveedor.');
    }
  };

  const handleRecordPayment = (provider: Provider, specificOrder?: Order) => {
    setSelectedProviderForSheet(null);
    setCurrentTab('inbox');
  };

  const handleProceedFromCountToOrder = (count: StockCount) => {
    setStockCountProvider(null);
    const prov = providers.find((p) => p.id === count.providerId);
    if (prov) {
      setOrderReviewProvider(prov);
    }
  };

  const handleOrderConfirmed = (newOrder: Order) => {
    setOrderReviewProvider(null);
    setActiveOrderForDocument(newOrder);
  };

  return (
    <div
      id="app-root"
      style={{ backgroundColor: branding?.appBgHex || '#f8fafc' }}
      className={`min-h-screen w-full overflow-x-hidden font-sans text-slate-900 flex ${isSidebar ? 'flex-col md:flex-row' : 'flex-col'} antialiased transition-colors`}
    >
      {/* Top Navbar or Sidebar */}
      <div className="print:hidden contents">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={handleNavigateTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          maestrosSubTab={maestrosSubTab}
          rrhhSubTab={rrhhSubTab}
        />
      </div>

      {/* Main Container View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden pb-20 md:pb-6 print:hidden">
        {/* Mobile Sub-module Back Header Button */}
        {isMobile && currentTab !== 'mobile_home' && (
          <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentTab('mobile_home')}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 py-1 px-2.5 bg-rose-50 rounded-xl border border-rose-200 transition"
            >
              <span>← Volver al Inicio</span>
            </button>
          </div>
        )}

        {currentTab === 'mobile_home' && (
          <MobileHomeView
            onNavigateTab={handleNavigateTab}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {currentTab === 'kanban' && (
          <KanbanBoard
            onSelectProvider={handleSelectProvider}
            onStartStockCount={handleStartStockCount}
            onStartOrderReview={handleStartOrderReview}
            onReceiveGoods={handleReceiveGoods}
            onRecordPayment={handleRecordPayment}
            onNewProvider={() => setEditingProvider('new')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {currentTab === 'inbox' && (
          <OrderInbox
            onViewOrderDocument={(orderId) => {
              const ord = orders.find((o) => o.id === orderId);
              if (ord) setActiveOrderForDocument(ord);
            }}
            onReceiveGoods={(prov, ord) => setReceivingOrder(ord)}
            onRecordPayment={(ord) => {
              // Direct payment inside inbox
            }}
          />
        )}

        {currentTab === 'items' && <ItemMasterView />}

        {currentTab === 'producciones' && <ProductionsView />}

        {currentTab === 'ventas_carta' && <SaleProductsView />}

        {currentTab === 'ventas_cc' && <CurrentAccountView />}

        {currentTab === 'ventas_caja' && <CashControlView />}

        {currentTab === 'ventas_reservas' && <ReservationsView />}

        {currentTab === 'sales_config' && <SalesConfigView />}

        {currentTab === 'ventas_pedidos' && <ComandasPosView />}

        {currentTab === 'dashboard' && <PurchasingDashboard />}

        {currentTab === 'audit' && <AuditLogModal />}

        {currentTab === 'recursos_humanos' && (
          <>
            {(!rrhhSubTab || rrhhSubTab === 'empleados') && <EmployeeMasterView />}
            {rrhhSubTab === 'marcacion' && <ClockView />}
            {rrhhSubTab === 'adelantos' && <AdvancesConsumptionsView />}
            {rrhhSubTab === 'liquidaciones' && <PayrunsView />}
          </>
        )}

        {currentTab === 'maestros' && (
          <MaestrosView
            onNavigateToItems={() => setCurrentTab('items')}
            onOpenNewProvider={() => setEditingProvider('new')}
            initialSubView={maestrosSubTab}
          />
        )}
      </main>

      {/* MODAL 1: Provider Sheet (Ficha Operativa del Proveedor) */}
      {selectedProviderForSheet && (
        <ProviderSheet
          provider={selectedProviderForSheet}
          onClose={() => setSelectedProviderForSheet(null)}
          onStartStockCount={() => handleStartStockCount(selectedProviderForSheet)}
          onStartOrderReview={() => handleStartOrderReview(selectedProviderForSheet)}
          onReceiveGoods={() => handleReceiveGoods(selectedProviderForSheet)}
          onRecordPayment={() => handleRecordPayment(selectedProviderForSheet)}
          onViewOrderDocument={(orderId) => {
            const ord = orders.find((o) => o.id === orderId);
            if (ord) setActiveOrderForDocument(ord);
          }}
        />
      )}

      {/* MODAL 2: Streamlined Stock Count Screen */}
      {stockCountProvider && (
        <StockCountModal
          provider={stockCountProvider}
          onClose={() => setStockCountProvider(null)}
          onProceedToOrder={handleProceedFromCountToOrder}
        />
      )}

      {/* MODAL 3: Order Review & Confirmation */}
      {orderReviewProvider && (
        <OrderReviewModal
          provider={orderReviewProvider}
          onClose={() => setOrderReviewProvider(null)}
          onOrderConfirmed={handleOrderConfirmed}
        />
      )}

      {/* MODAL 4: Order Printable PDF / Image Preview Document */}
      {activeOrderForDocument && (
        <OrderDocumentModal
          order={activeOrderForDocument}
          onClose={() => setActiveOrderForDocument(null)}
        />
      )}

      {/* MODAL 5: Goods Reception (Ingreso de Mercadería) */}
      {receivingOrder && (
        <GoodsReceptionModal
          order={receivingOrder}
          onClose={() => setReceivingOrder(null)}
        />
      )}

      {/* MODAL 6: Settings (Horarios de Recepción) */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {/* MODAL 7: Provider Creation / Edit */}
      {editingProvider && (
        <ProviderEditModal
          providerToEdit={editingProvider === 'new' ? null : editingProvider}
          onClose={() => setEditingProvider(null)}
        />
      )}

      {/* Global Toast Notifications */}
      <Toast />

      {/* Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onNavigateTab={handleNavigateTab}
        onToggleMobileMenu={() => handleNavigateTab('maestros')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
