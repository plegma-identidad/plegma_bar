-- ====================================================================
-- PLEGMA - SCRIPT SQL COMPLETO DE ESTRUCTURA Y BASE DE DATOS EN SUPABASE
-- Ejecutar este script en el SQL Editor del panel de Supabase
-- ====================================================================

-- --------------------------------------------------------------------
-- FASE 1: CONFIGURACIÓN BASE, USUARIOS Y TABLAS SIN LLAVES FORÁNEAS
-- --------------------------------------------------------------------

-- 1.1 Configuración de Branding e Identidad Visual
CREATE TABLE IF NOT EXISTS public.branding_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    company_name TEXT,
    company_subtitle TEXT,
    cuit TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    navigation_style TEXT DEFAULT 'sidebar',
    menu_bg_hex TEXT,
    menu_text_hex TEXT,
    menu_active_bg_hex TEXT,
    menu_active_text_hex TEXT,
    menu_font_family TEXT,
    app_bg_hex TEXT,
    card_bg_hex TEXT,
    primary_hex TEXT,
    button_bg_hex TEXT,
    button_text_hex TEXT,
    font_family TEXT,
    kanban_colors JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Opciones Maestras de Configuración (Categorías, Subcategorías, Unidades, Rubros)
CREATE TABLE IF NOT EXISTS public.config_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'category', 'subcategory', 'unit', 'rubro', 'position', 'profile'
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Sitios / Sectores del Salón
CREATE TABLE IF NOT EXISTS public.site_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4 Cajas Fuertes Maestras (Permanentes)
CREATE TABLE IF NOT EXISTS public.master_cash_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    box_type TEXT NOT NULL,
    status TEXT DEFAULT 'Siempre Abierta',
    current_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Roles Granulares de Seguridad
CREATE TABLE IF NOT EXISTS public.granular_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    module_access JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.6 Perfiles de Usuarios de la Aplicación
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dni TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    profile_name TEXT,
    role TEXT,
    assigned_role_ids UUID[],
    status TEXT DEFAULT 'Activo',
    last_access TIMESTAMPTZ,
    custom_permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- FASE 2: ENTIDADES MAESTRAS PRINCIPALES
-- --------------------------------------------------------------------

-- 2.1 Proveedores
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    commercial_name TEXT,
    rubro TEXT,
    subrubro TEXT,
    cuit TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    order_days TEXT[],
    delivery_days TEXT[],
    priority INT DEFAULT 1,
    purchase_frequency TEXT,
    cutoff_time TEXT,
    habitual_lead_time_days INT,
    payment_condition TEXT,
    payment_term_days INT,
    current_account BOOLEAN DEFAULT false,
    bank_name TEXT,
    account_owner TEXT,
    alias TEXT,
    cbu_cvu TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Artículos e Insumos (Inventario)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    storage_unit TEXT NOT NULL,
    purchase_unit TEXT NOT NULL,
    pack_quantity NUMERIC DEFAULT 1,
    location TEXT,
    current_stock NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    max_stock NUMERIC DEFAULT 0,
    current_price NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    has_current_account BOOLEAN DEFAULT false,
    differentiated_billing BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    is_employee BOOLEAN DEFAULT false,
    is_generic BOOLEAN DEFAULT false,
    debt NUMERIC DEFAULT 0,
    client_type TEXT,
    cuit TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Empleados (RRHH)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    position TEXT NOT NULL,
    profile TEXT NOT NULL,
    login_email TEXT,
    enable_clock_in BOOLEAN DEFAULT true,
    hourly_rate NUMERIC DEFAULT 0,
    is_partner BOOLEAN DEFAULT false,
    related_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    bank_company TEXT,
    account_type TEXT,
    cbu_cvu TEXT,
    alias TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Mesas Físicas del Restaurant
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    site_id UUID REFERENCES public.site_configs(id) ON DELETE RESTRICT,
    site_name TEXT,
    name TEXT,
    is_free BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Canales y Tipos de Venta POS
CREATE TABLE IF NOT EXISTS public.sale_type_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_salon_sale BOOLEAN DEFAULT true,
    requires_table BOOLEAN DEFAULT false,
    requires_client BOOLEAN DEFAULT false,
    initial_order_status TEXT DEFAULT 'Pendiente',
    final_order_status TEXT DEFAULT 'Facturado',
    auto_print_ticket BOOLEAN DEFAULT true,
    kitchen_printer TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Grupos de Opciones y Adicionales de Productos
CREATE TABLE IF NOT EXISTS public.product_option_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    selection_type TEXT DEFAULT 'single',
    max_selection INT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- FASE 3: RELACIONES INTERMEDIAS Y TABLAS HIJO DE MAESTROS
-- --------------------------------------------------------------------

-- 3.1 Relación Proveedor <-> Ítem de Inventario
CREATE TABLE IF NOT EXISTS public.provider_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    supplier_product_code TEXT,
    purchase_unit TEXT,
    pack_quantity NUMERIC,
    min_stock NUMERIC,
    max_stock NUMERIC,
    last_purchase_price NUMERIC,
    last_purchase_date TIMESTAMPTZ,
    is_primary_supplier BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider_id, item_id)
);

-- 3.2 Opciones Individuales de Productos
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Horarios Fijos de Empleados
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    special_hourly_rate NUMERIC,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Historial de Tarifas Horarias de Empleados
CREATE TABLE IF NOT EXISTS public.hourly_rate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT now(),
    old_price NUMERIC NOT NULL,
    new_price NUMERIC NOT NULL,
    percentage_increase NUMERIC NOT NULL,
    modified_by TEXT NOT NULL,
    notes TEXT
);

-- --------------------------------------------------------------------
-- FASE 4: OPERATIVA DE CAJAS, FICHAJE, ADELANTOS Y RESERVAS
-- --------------------------------------------------------------------

-- 4.1 Turnos de Caja (Apertura y Cierre)
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift TEXT NOT NULL, -- 'Mañana' | 'Tarde'
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Abierta', -- 'Abierta' | 'Cerrada' | 'Conciliada' | 'Anulada'
    opened_by_user_id UUID REFERENCES public.app_users(id),
    opened_by_user_name TEXT NOT NULL,
    notes TEXT,
    closed_at TIMESTAMPTZ,
    reconciled_at TIMESTAMPTZ,
    reconciled_by_user_name TEXT,
    total_difference NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Líneas de Caja por Turno (Medios de Pago)
CREATE TABLE IF NOT EXISTS public.cash_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES public.cash_shifts(id) ON DELETE CASCADE,
    box_type TEXT NOT NULL,
    initial_amount NUMERIC DEFAULT 0,
    tickets_total NUMERIC DEFAULT 0,
    expenses_total NUMERIC DEFAULT 0,
    withdrawals_total NUMERIC DEFAULT 0,
    theoretical_amount NUMERIC DEFAULT 0,
    real_amount NUMERIC,
    difference NUMERIC,
    status TEXT DEFAULT 'Abierta',
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 Movimientos de Caja
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID REFERENCES public.cash_lines(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.cash_shifts(id) ON DELETE CASCADE,
    date_time TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL, -- 'Ingreso', 'Salida', 'Ticket', 'Gasto', 'Consumo', 'Retiro', 'Traspaso', 'Ajuste', 'Apertura'
    category TEXT,
    origin TEXT NOT NULL,
    voucher_number TEXT,
    amount NUMERIC NOT NULL,
    user_id UUID REFERENCES public.app_users(id),
    user_name TEXT NOT NULL,
    notes TEXT,
    target_line_id UUID REFERENCES public.cash_lines(id),
    target_master_box_id UUID REFERENCES public.master_cash_boxes(id)
);

-- 4.4 Fichajes y Control de Asistencia (Clock Records)
CREATE TABLE IF NOT EXISTS public.clock_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE RESTRICT,
    dni TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    hours_worked NUMERIC,
    hourly_rate NUMERIC NOT NULL,
    total_cost NUMERIC,
    state TEXT DEFAULT 'Abierta', -- 'Abierta' | 'Cerrada' | 'Corregida' | 'Anulada'
    modified_by TEXT,
    modification_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 Reservas de Mesas
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_time TIMESTAMPTZ NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    guests_count INT NOT NULL,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE RESTRICT,
    table_name TEXT NOT NULL,
    status TEXT DEFAULT 'Confirmada', -- 'Confirmada' | 'Cumplida' | 'Cancelada' | 'Histórica'
    created_by_user_id UUID REFERENCES public.app_users(id),
    created_by_user_name TEXT NOT NULL,
    notes TEXT,
    cancel_reason TEXT,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- FASE 5: OPERATIVA DE COMPRAS Y STOCK
-- --------------------------------------------------------------------

-- 5.1 Conteos de Stock
CREATE TABLE IF NOT EXISTS public.stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count_number TEXT UNIQUE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE RESTRICT,
    date TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES public.app_users(id),
    user_name TEXT NOT NULL,
    status TEXT DEFAULT 'borrador',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID REFERENCES public.stock_counts(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT,
    previous_stock NUMERIC NOT NULL,
    current_stock NUMERIC NOT NULL,
    received_since_last_count NUMERIC DEFAULT 0,
    estimated_consumption NUMERIC DEFAULT 0,
    notes TEXT
);

-- 5.2 Pedidos a Proveedores
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    provider_id UUID REFERENCES public.providers(id) ON DELETE RESTRICT,
    expected_delivery_date DATE,
    user_id UUID REFERENCES public.app_users(id),
    user_name TEXT NOT NULL,
    status TEXT NOT NULL,
    general_notes TEXT,
    reception_hours_snapshot JSONB,
    estimated_total NUMERIC DEFAULT 0,
    final_received_total NUMERIC,
    reception_date TIMESTAMPTZ,
    invoice_or_receipt_number TEXT,
    delivery_type TEXT,
    payment_status TEXT DEFAULT 'Pendiente de pago',
    paid_amount NUMERIC DEFAULT 0,
    remaining_debt NUMERIC DEFAULT 0,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    suggested_qty NUMERIC NOT NULL,
    final_qty NUMERIC NOT NULL,
    received_qty NUMERIC,
    reference_price NUMERIC NOT NULL,
    item_notes TEXT
);

-- --------------------------------------------------------------------
-- FASE 6: OPERATIVA DE VENTAS POS, FACTURACIÓN Y CUENTAS CORRIENTES
-- --------------------------------------------------------------------

-- 6.1 Pedidos POS (Ventas)
CREATE TABLE IF NOT EXISTS public.sale_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGSERIAL UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    sale_type_id UUID REFERENCES public.sale_type_configs(id) ON DELETE RESTRICT,
    sale_type_name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    table_name TEXT,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pendiente', -- 'Pendiente' | 'Comandado' | 'En Cocina' | 'Listo' | 'Entregado' | 'Cerrado' | 'Facturado' | 'Cancelado'
    created_by_user_id UUID REFERENCES public.app_users(id),
    created_by_user_name TEXT NOT NULL,
    general_notes TEXT,
    t1_created_at TIMESTAMPTZ DEFAULT now(),
    t2_comanda_at TIMESTAMPTZ,
    t3_kitchen_output_at TIMESTAMPTZ,
    t4_delivered_at TIMESTAMPTZ,
    billing_details JSONB
);

CREATE TABLE IF NOT EXISTS public.sale_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.sale_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    unit_price NUMERIC NOT NULL,
    cost_price NUMERIC,
    quantity NUMERIC NOT NULL,
    side_option TEXT,
    selected_options JSONB,
    subtotal NUMERIC NOT NULL,
    line_comment TEXT
);

-- 6.2 Movimientos de Cuenta Corriente (Clientes)
CREATE TABLE IF NOT EXISTS public.current_account_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    date_time TIMESTAMPTZ DEFAULT now(),
    voucher_type TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Venta' | 'Recibo' | 'Ajuste'
    total NUMERIC NOT NULL,
    ticket_detail TEXT,
    ticket_number TEXT,
    line_state TEXT DEFAULT 'Pendiente' -- 'Pendiente' | 'Seleccionada' | 'Pagada'
);

-- 6.3 Recibos de Cobro
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
    date_time TIMESTAMPTZ DEFAULT now(),
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pendiente',
    user_name TEXT NOT NULL,
    movement_ids UUID[],
    payment_method TEXT,
    cash_register TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- FASE 7: AUDITORÍA Y REGISTRO DE EVENTOS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    details TEXT
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura y escritura publica temporal en audit_logs" ON public.audit_logs;
CREATE POLICY "Permitir lectura y escritura publica temporal en audit_logs"
  ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
