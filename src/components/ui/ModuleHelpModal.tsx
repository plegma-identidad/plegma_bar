import React from 'react';
import { X, Info, Settings, CalendarDays, DollarSign, Users, PackageOpen, LayoutDashboard, Layers } from 'lucide-react';

export type HelpModule = 
  | 'config'
  | 'reservations'
  | 'cash'
  | 'currentAccount'
  | 'ingredients'
  | 'kanban'
  | 'purchasing'
  | 'payruns'
  | 'sale_products'
  | 'combos';

interface ModuleHelpModalProps {
  module?: HelpModule;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  moduleName?: string;
  description?: string;
  sections?: { title: string; content: string }[];
}

const MODULE_DATA: Record<HelpModule, { title: string; subtitle: string; icon: React.ReactNode; sections: { title: string; content: string }[] }> = {
  config: {
    title: 'Guía de Uso: Configuración Operativa',
    subtitle: 'Gestión de salones, mesas y tipos de venta',
    icon: <Settings className="w-5 h-5" />,
    sections: [
      { title: '1. Sitios / Salones', content: 'Aquí defines las grandes áreas de tu local (Salón Principal, Patio, Barra). Debes crear al menos uno para poder ubicar mesas.' },
      { title: '2. Mesas', content: 'Puedes crear múltiples mesas, asignándoles una capacidad (cantidad de personas) y vinculándolas al Salón correspondiente. Esto permite que los mozos puedan tomarlas.' },
      { title: '3. Canales / Tipos de Venta', content: 'Controla si tu local tiene Delivery, Takeaway, Salón, etc. Puedes definir por cada uno qué impresora de cocina usa y cuáles son sus estados obligatorios iniciales.' }
    ]
  },
  reservations: {
    title: 'Guía de Uso: Reserva de Mesas',
    subtitle: 'Gestión de ocupación programada',
    icon: <CalendarDays className="w-5 h-5" />,
    sections: [
      { title: '1. Creación de Reservas', content: 'Permite asentar a nombre de quién, para qué fecha, hora y cuántas personas (capacidad) será la ocupación.' },
      { title: '2. Asignación de Mesas', content: 'Al confirmar una reserva, puedes asignarle una mesa específica que hayas creado en Configuración Operativa, bloqueándola para ese momento.' },
      { title: '3. Estados de la Reserva', content: 'Maneja estados como Pendiente, Confirmada (asiste) o Cancelada (no show).' }
    ]
  },
  cash: {
    title: 'Guía de Uso: Control de Caja',
    subtitle: 'Manejo de tesorería, turnos y movimientos',
    icon: <DollarSign className="w-5 h-5" />,
    sections: [
      { title: '1. Turnos de Caja', content: 'Es obligatorio abrir un Turno de Caja para poder facturar/cobrar pedidos del Salón o Delivery.' },
      { title: '2. Ingresos y Retiros', content: 'Cualquier dinero extra que ingrese (cambio) o que se retire (pago a proveedores, retiros de dueños) debe registrarse como movimiento de caja.' },
      { title: '3. Cierre y Arqueo', content: 'Al finalizar la jornada o el turno del cajero, se cierra la caja indicando cuánto dinero físico hay realmente. El sistema mostrará un sobrante o faltante.' }
    ]
  },
  currentAccount: {
    title: 'Guía de Uso: Cuentas Corrientes',
    subtitle: 'Líneas de crédito y deudas de clientes',
    icon: <Users className="w-5 h-5" />,
    sections: [
      { title: '1. Generación de Deuda', content: 'Cuando en el módulo de Ventas se cobra un pedido utilizando el medio de pago "Cuenta Corriente", el importe se suma automáticamente a la deuda del cliente.' },
      { title: '2. Cobranzas y Recibos', content: 'Aquí puedes registrar cuando el cliente viene a pagar parte o la totalidad de su deuda. Se emitirá un comprobante de Recibo.' },
      { title: '3. Estados de Cuenta', content: 'Puedes auditar todo el historial de movimientos (pedidos fiados vs pagos realizados) de cada cliente individualmente.' }
    ]
  },
  ingredients: {
    title: 'Guía de Uso: Insumos y Stocks',
    subtitle: 'Maestro de productos, materias primas y costeo',
    icon: <PackageOpen className="w-5 h-5" />,
    sections: [
      { title: '1. Maestro de Insumos', content: 'Aquí das de alta todo lo que compras (por kilo, litro, unidad). Puedes agruparlos por Rubros (Carnes, Bebidas) y Subrubros.' },
      { title: '2. Precios y Variaciones', content: 'Mantiene un historial de los cambios de precio de costo de cada insumo para analizar la inflación y proteger tu rentabilidad.' },
      { title: '3. Productos de Venta', content: 'Permite crear los platos finales que ve el mozo, y si lo deseas, atarles una receta descontando insumos básicos automáticamente al vender.' }
    ]
  },
  kanban: {
    title: 'Guía de Uso: Tablero Semanal',
    subtitle: 'Ciclo completo de abastecimiento y compras',
    icon: <CalendarDays className="w-5 h-5" />,
    sections: [
      { title: '1. Pendientes de Conteo', content: 'Permite saber qué insumos o áreas hay que auditar (contar) en el inventario real de la semana.' },
      { title: '2. Órdenes de Compra', content: 'A partir de los faltantes detectados, el sistema te permite generar "Pedidos Confirmados" a tus proveedores.' },
      { title: '3. Recepción', content: 'Cuando llega el camión o repartidor, marcas el pedido como "Entregado/Ingresado", impactando la cantidad física en tu stock y generando la cuenta a pagar.' }
    ]
  },
  purchasing: {
    title: 'Guía de Uso: Dashboard de Compras',
    subtitle: 'Métricas e inflación',
    icon: <LayoutDashboard className="w-5 h-5" />,
    sections: [
      { title: '1. Compras Período', content: 'Resumen de los montos gastados en mercadería durante el periodo activo.' },
      { title: '2. Deuda Proveedores', content: 'Muestra el saldo pendiente de pago que tenemos con nuestros proveedores.' },
      { title: '3. Ajuste Inflacionario', content: 'Registra los mayores aumentos de precios detectados en el último tiempo.' }
    ]
  },
  payruns: {
    title: 'Guía de Uso: Liquidaciones de Sueldos',
    subtitle: 'Gestión y pago de nóminas paso a paso',
    icon: <DollarSign className="w-5 h-5" />,
    sections: [
      { title: 'Paso 1: Iniciar una Nueva Liquidación', content: 'Presiona el botón "Nueva Liquidación". Debes asignarle un nombre al período (ej. "Primera Quincena Marzo") y definir el rango de fechas (Inicio y Fin) que vas a liquidar.' },
      { title: 'Paso 2: Cálculo Automático de Horas', content: 'El sistema buscará automáticamente todas las marcaciones en estado "Cerrada" o "Corregida" que estén dentro de ese rango de fechas, calculando el sueldo base (Horas Trabajadas × Valor Hora).' },
      { title: 'Paso 3: Adicionales y Descuentos', content: 'Si necesitas sumar dinero extra (premios, feriados, propinas) o restar dinero (adelantos, llegadas tarde), haz clic en el botón "+" (Añadir Concepto) en la fila de cada empleado para ajustar su monto final.' },
      { title: 'Paso 4: Confirmar Liquidación', content: 'Una vez revisados los totales, presiona "Crear Liquidación". ¡Atención! Al hacer esto, todas las marcaciones incluidas pasarán a estado "Liquidada" y ya no podrán ser modificadas.' },
      { title: 'Paso 5: Pagos y Emisión de Recibos', content: 'Desde el panel principal podrás ingresar al detalle de la liquidación creada. Allí podrás registrar cuando le abones el sueldo a un empleado y "Reimprimir Recibo" para entregarle el comprobante físico.' }
    ]
  },
  sale_products: {
    title: 'Guía de Uso: Prod. de Venta (Carta)',
    subtitle: 'Escandallo, recetas de elaboración, reventa directa y costeo',
    icon: <PackageOpen className="w-5 h-5" />,
    sections: [
      { title: '1. Productos de Fabricación', content: 'Son platos o tragos elaborados en el local (hamburguesas, pizzas, cócteles). Requieren definir su receta o escandallo seleccionando insumos del inventario o productos de producción (semielaborados).' },
      { title: '2. Productos de Reventa Directa', content: 'Son artículos que se adquieren terminados para vender directamente al cliente (gaseosas, cervezas en lata). Se vinculan a un insumo para consultar su stock disponible y costo de compra.' },
      { title: '3. Costo y Margen de Rentabilidad', content: 'El costo se calcula sumando los componentes de la receta. El sistema computa automáticamente el margen sobre venta: ((Precio Venta - Costo) / Precio Venta) × 100.' },
      { title: '4. Ficha Técnica y Tutoriales', content: 'Puedes adjuntar el PDF de la ficha de cocina y el enlace a un video de YouTube con el instructivo de preparación para capacitar al equipo.' }
    ]
  },
  combos: {
    title: 'Guía de Uso: Maestro de Combos & Promociones',
    subtitle: 'Combos configurables, secciones, opciones & recargos',
    icon: <Layers className="w-5 h-5" />,
    sections: [
      { title: '1. Estructura y Secciones', content: 'Un combo se divide en etapas o secciones (ej. Selección de Hamburguesa, Guarnición, Bebida). Cada sección puede ser obligatoria u opcional, admitir cantidades mínimas y máximas, y permitir o no la repetición de opciones.' },
      { title: '2. Componentes Multi-Origen', content: 'Cada sección puede contener opciones provenientes de: Insumos de stock, Producciones intermedias, o Productos de Carta. Al seleccionar una opción, se registra su costo de referencia para el cálculo del escandallo.' },
      { title: '3. Recargos de Precio Extra', content: 'Si una opción es premium (ej. cambiar papas tradicionales por papas cheddar), puedes definir un recargo en $. Al ingresar el combo en la comanda de venta, el total se incrementará automáticamente.' },
      { title: '4. Almacenamiento Físico en Supabase Storage', content: 'Las fotos se guardan físicamente en la carpeta Ventas/Combos/[Código]. Al editar o eliminar un combo, los archivos anteriores se eliminan físicamente del servidor para no acumular memoria.' }
    ]
  }
};

export const ModuleHelpModal: React.FC<ModuleHelpModalProps> = ({
  module,
  isOpen = true,
  onClose,
  title,
  subtitle,
  description,
  sections,
}: any) => {
  if (isOpen === false) return null;

  const defaultData = module ? MODULE_DATA[module] : null;
  const modalTitle = title || defaultData?.title || 'Guía de Uso';
  const modalSubtitle = subtitle || description || defaultData?.subtitle || 'Información operativa del módulo';
  const modalIcon = defaultData?.icon || <Info className="w-5 h-5" />;
  const modalSections = sections || defaultData?.sections || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {modalIcon}
            </div>
            <div>
              <h3 className="font-extrabold text-base">{modalTitle}</h3>
              <p className="text-xs text-slate-400">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700">
          {modalSections.map((sec: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {sec.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-4">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
