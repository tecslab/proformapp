# Implementación del módulo de Gestión de Proyectos (GP)

## 1. Propósito

Este documento define la propuesta técnica para ampliar **ProformApp** con un módulo de **Gestión de Proyectos**, reutilizando la infraestructura existente de clientes, proformas, autenticación, Supabase, Server Actions y UI.

El objetivo es que una proforma finalizada pueda convertirse en la fuente comercial de uno o varios proyectos, mientras que el nuevo módulo permita controlar la ejecución real:

- alcance aprobado;
- proveedores y maestros;
- desglose operativo de los ítems vendidos;
- costos cotizados, comprometidos y pagados;
- cobros del cliente;
- pagos a proveedores/maestros;
- caja por proyecto;
- margen cotizado, margen previsto y margen real;
- incidencias e imprevistos.

El módulo **no reemplaza** el flujo de proformas. La proforma sigue siendo la fuente comercial de lo vendido al cliente; Gestión de Proyectos controla cómo se ejecuta y cómo se mueve el dinero después de la aprobación.

---

## 2. Decisiones confirmadas

### 2.1. La app existente se amplía; no se crea una aplicación separada

El nuevo módulo vivirá dentro del mismo repositorio y stack actual.

Stack actual a conservar:

- Next.js App Router;
- React;
- TypeScript;
- Supabase PostgreSQL;
- Supabase Auth + RLS;
- React Server Actions;
- React Hook Form;
- Zod;
- Tailwind CSS;
- shadcn/Radix.

No se introduce Redux, React Query ni una segunda capa de backend.

### 2.2. Clientes existentes se reutilizan

La tabla existente `clients` es la fuente única de clientes.

Los proyectos referencian:

```sql
client_id uuid not null references clients(id)
```

No se crea una segunda tabla de clientes.

### 2.3. Solo proformas finalizadas pueden incorporarse a proyectos

El flujo exigido será:

```text
Proforma draft
    ↓
Finalizar proforma
    ↓
Aprobación / decisión de ejecución
    ↓
Crear o seleccionar proyecto
    ↓
Importar ítems de proforma
```

La UI de Gestión de Proyectos debe impedir importar proformas cuyo `status != 'finalized'`.

### 2.4. Se mantiene el modelo de ownership actual

El sistema actual utiliza `user_id` y RLS por usuario.

Las tablas nuevas deben continuar con:

```sql
user_id uuid not null references auth.users(id)
```

No se introduce `organization_id` en esta etapa.

### 2.5. Se mantiene el significado actual del costo

Por el momento, el costo de un ítem se conserva tal como se maneja hoy en ProformApp.

No se desglosa en costo neto + IVA de compra.

No se implementa contabilidad tributaria en esta fase.

### 2.6. No se requiere una migración baseline del esquema existente por ahora

Las nuevas tablas deben agregarse mediante migraciones incrementales en `supabase/migrations/`.

El archivo `database.ts` debe mantenerse sincronizado con los cambios de esquema.

---

## 3. Principios del modelo

### 3.1. Separar venta de ejecución

La proforma responde:

> ¿Qué se vendió al cliente y a qué precio?

El proyecto responde:

> ¿Cómo se va a ejecutar, quién lo hará y cuánto costará realmente?

Un ítem vendido puede coincidir con una sola partida de ejecución o puede dividirse en varias.

Ejemplo:

```text
PROFORMA
Mueble de TV
Precio cliente: $1,500
Costo cotizado: $1,050

PROYECTO / EJECUCIÓN
Mueble de TV
├── Carpintería — Darío ........ $720
├── Piedra — proveedor X ....... $180
├── Herrajes — proveedor Y ..... $90
└── Instalación — maestro Z .... $60
```

### 3.2. Los ítems de proyecto son snapshots

La tabla existente `items` pertenece al flujo de proformas. Además, las proformas draft pueden reemplazar sus ítems durante edición.

Por esa razón, Gestión de Proyectos no debe depender dinámicamente de los valores vivos de `items`.

Al importar una proforma, se crea un snapshot comercial en una tabla propia del proyecto.

### 3.3. No borrar el ítem comercial al desglosar ejecución

Si un ítem importado necesita dividirse para ejecución, no se elimina el ítem comercial.

Se mantiene:

```text
Ítem comercial
└── N partidas de ejecución
```

Esto permite comparar permanentemente:

- lo cotizado;
- lo contratado;
- lo pagado;
- la utilidad esperada;
- la utilidad real.

### 3.4. Una proforma y un proyecto no tienen una relación estrictamente 1:1

Un proyecto puede contener varias proformas.

Ejemplo:

```text
Proyecto Todos Santos
├── Proforma Counter
├── Proforma Exhibidores
└── Proforma adicional futura
```

También debe permitirse importar solo algunos ítems de una proforma.

---

## 4. Tratamiento del descuento

La proforma actual aplica el descuento a nivel global antes del IVA.

Existen dos estrategias posibles.

### Estrategia A — Prorratear el descuento y persistirlo por ítem

Al importar:

```text
Ítem A: $600
Ítem B: $400
Subtotal: $1,000
Descuento: 10%
```

se guardarían montos efectivos:

```text
Ítem A efectivo: $540
Ítem B efectivo: $360
```

Ventaja:

- el margen por ítem puede calcularse directamente.

Desventajas:

- se persiste un valor derivado;
- aparecen problemas de redondeo;
- si se cambia la regla de distribución, hay que migrar datos;
- el snapshot deja de representar exactamente la línea comercial original.

### Estrategia B — Mantener el descuento como ajuste comercial global

Esta es la alternativa recomendada para V1.

Los `project_scope_items` conservan exactamente sus importes comerciales originales.

El descuento se conserva como snapshot a nivel de proforma importada:

```text
Subtotal original:        $1,000
Descuento comercial:        $100
Venta neta efectiva:        $900
IVA:                        $135
Total cliente:            $1,035
```

No se modifica permanentemente cada ítem.

Para calcular margen general:

```text
margen = venta_neta_efectiva - costos
```

Si la UI necesita mostrar rentabilidad efectiva por ítem, puede realizar un prorrateo **virtual** en la consulta/vista:

```text
factor_efectivo = subtotal_con_descuento / subtotal_original

venta_efectiva_item = line_total_original * factor_efectivo
```

Ese monto no necesita persistirse.

#### Recomendación

Adoptar **Estrategia B**.

Razones:

1. preserva fielmente la proforma finalizada;
2. evita duplicar información derivada;
3. evita errores acumulativos de redondeo;
4. permite cambiar la estrategia de reporte en el futuro;
5. el negocio normalmente necesita margen global del proyecto antes que margen exacto por línea;
6. si luego se necesita margen por línea, el prorrateo puede calcularse dinámicamente.

La tabla que vincula una proforma al proyecto debe guardar snapshots del resumen financiero de la proforma.

---

## 5. Modelo de datos propuesto

## 5.1. `projects`

Representa una obra/proyecto operativo.

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  client_id uuid not null references clients(id),

  name text not null,
  status text not null default 'draft',

  start_date date null,
  expected_end_date date null,
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);
```

Estados iniciales recomendados:

```text
draft
waiting_advance
approved
in_progress
waiting_client
waiting_supplier
finishing
pending_collection
completed
paused
cancelled
```

Para V1 puede usarse `text + CHECK` en lugar de enum PostgreSQL para facilitar evolución.

---

## 5.2. `providers`

Agrupa proveedores, maestros, contratistas y prestadores de servicios.

```sql
create table providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  name text not null,
  type text not null,

  specialty text null,
  cedula_ruc text null,
  phone text null,
  email text null,
  address text null,
  notes text null,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Tipos iniciales:

```text
supplier
master
contractor
service
other
```

En UI usar la etiqueta **Proveedores y maestros**.

---

## 5.3. `project_proformas`

Relaciona proyectos con proformas finalizadas y guarda el snapshot del resumen comercial.

```sql
create table project_proformas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,
  proforma_id uuid not null references proformas(id),

  relation_type text not null default 'initial',

  subtotal_snapshot numeric(12,2) not null,
  discount_percentage_snapshot numeric(7,4) not null default 0,
  discount_amount_snapshot numeric(12,2) not null default 0,
  net_subtotal_snapshot numeric(12,2) not null,
  iva_percentage_snapshot numeric(7,4) not null default 0,
  iva_amount_snapshot numeric(12,2) not null default 0,
  total_snapshot numeric(12,2) not null,

  created_at timestamptz not null default now(),

  unique(project_id, proforma_id)
);
```

`relation_type` inicial:

```text
initial
additional
```

La importación debe validar que la proforma:

- pertenezca al usuario autenticado;
- pertenezca al mismo cliente del proyecto;
- esté finalizada.

---

## 5.4. `project_scope_items`

Snapshot de los ítems comerciales importados.

```sql
create table project_scope_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,
  project_proforma_id uuid not null references project_proformas(id) on delete cascade,

  source_item_id uuid not null references items(id),

  description text not null,
  comment text null,
  quantity numeric(12,2) not null,
  unit text not null,

  quoted_unit_cost numeric(12,2) not null,
  quoted_gain_percentage numeric(7,4) not null default 0,
  quoted_line_total numeric(12,2) not null,

  position integer not null,
  status text not null default 'pending',

  created_at timestamptz not null default now(),
  archived_at timestamptz null,

  unique(project_id, source_item_id)
);
```

Los valores son snapshots; después de importar no deben recalcularse desde `items`.

---

## 5.5. `project_execution_items`

Representa cada partida operativa necesaria para ejecutar un ítem comercial.

```sql
create table project_execution_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,
  scope_item_id uuid null references project_scope_items(id),

  provider_id uuid null references providers(id),

  description text not null,
  category text null,

  estimated_cost numeric(12,2) null,
  committed_cost numeric(12,2) null,

  status text not null default 'planned',
  notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);
```

`scope_item_id` es nullable para permitir costos generales del proyecto, por ejemplo:

- transporte;
- limpieza;
- movilización;
- instalación general.

Estados recomendados:

```text
planned
quoted
committed
in_progress
completed
cancelled
```

---

## 5.6. `project_receivables`

Representa dinero esperado del cliente que todavía no necesariamente ha ingresado.

```sql
create table project_receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,
  project_proforma_id uuid null references project_proformas(id),

  description text not null,
  expected_amount numeric(12,2) not null,
  due_date date null,

  status text not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Estados:

```text
pending
partial
paid
cancelled
```

Ejemplo:

```text
Anois
Adelanto acordado: $300
Receivable: $300 pendiente
Transaction: $0 hasta que realmente se reciba
```

---

## 5.7. `project_transactions`

Ledger de movimientos financieros reales.

```sql
create table project_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,

  project_proforma_id uuid null references project_proformas(id),
  scope_item_id uuid null references project_scope_items(id),
  execution_item_id uuid null references project_execution_items(id),

  provider_id uuid null references providers(id),

  direction text not null,
  type text not null,

  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null,

  description text not null,
  payment_method text null,
  notes text null,

  voided_at timestamptz null,
  void_reason text null,

  created_at timestamptz not null default now()
);
```

`direction`:

```text
in
out
```

Tipos iniciales:

```text
client_advance
client_partial_payment
client_balance
provider_advance
provider_payment
material_purchase
labor_payment
transport
refund
other
```

### Regla de auditoría

Las transacciones financieras no deben borrarse desde la UI.

Si una transacción fue registrada por error, se usa:

```text
Anular movimiento
```

guardando `voided_at` y `void_reason`.

Los cálculos financieros deben ignorar transacciones anuladas.

---

## 5.8. `project_incidents`

Registra imprevistos sin convertirlos automáticamente en venta.

```sql
create table project_incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),

  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  description text null,
  incident_date date not null,

  responsibility text not null default 'under_review',

  estimated_cost numeric(12,2) null,
  final_cost numeric(12,2) null,

  billable_to_client boolean null,

  resolved boolean not null default false,
  resolution_notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Responsabilidades:

```text
under_review
client
provider
company
shared
not_applicable
```

Si una incidencia termina siendo facturable, el flujo preferido es:

```text
Incidencia
  ↓
Se determina que es cobrable
  ↓
Crear proforma adicional
  ↓
Finalizarla
  ↓
Importarla al proyecto
```

No se incrementa manualmente el valor comercial del proyecto.

---

## 6. Cálculos financieros

Los saldos no deben almacenarse manualmente si pueden derivarse.

### 6.1. Venta comercial neta

A nivel de proforma importada:

```text
net_sales =
subtotal_snapshot
- discount_amount_snapshot
```

Este valor es el ingreso comercial que debe usarse para margen.

### 6.2. Total por cobrar al cliente

```text
client_total_due =
total_snapshot
```

Incluye IVA.

### 6.3. Cobrado

```text
collected =
SUM(project_transactions.amount)
WHERE direction = 'in'
AND voided_at IS NULL
AND type IN tipos de cobro de cliente
```

### 6.4. Saldo cliente

```text
client_balance =
client_total_due - collected
```

Para proyectos con varias proformas se suman los snapshots de todas las proformas importadas.

### 6.5. Costo cotizado

Debe derivarse de los snapshots importados:

```text
quoted_cost =
SUM(quoted_unit_cost * quantity)
```

### 6.6. Costo comprometido

```text
committed_cost =
SUM(project_execution_items.committed_cost)
```

### 6.7. Pagado

```text
paid_cost =
SUM(project_transactions.amount)
WHERE direction = 'out'
AND voided_at IS NULL
```

### 6.8. Pendiente a proveedores

```text
supplier_balance =
committed_cost
- pagos vinculados a partidas comprometidas
```

Los gastos generales no vinculados a un commitment se incluyen como costo pagado pero no crean saldo futuro.

### 6.9. Caja del proyecto

```text
project_cash =
total_inflows
- total_outflows
```

**Caja no equivale a utilidad.**

### 6.10. Margen cotizado

```text
quoted_margin =
net_sales
- quoted_cost
```

### 6.11. Margen previsto actual

```text
expected_margin =
net_sales
- committed_cost
- paid_uncommitted_costs
```

Debe evitarse contar dos veces pagos que ya pertenecen a un `committed_cost`.

### 6.12. Margen real

Al cierre:

```text
actual_margin =
net_sales
- total_real_project_cost
```

---

## 7. Vistas SQL recomendadas

Para evitar duplicar cálculos en Server Actions y UI, crear vistas SQL.

### 7.1. `project_financial_summary`

Debe exponer por proyecto:

```text
project_id
net_sales
client_total_due
collected
client_balance

quoted_cost
committed_cost
paid_cost
supplier_balance

project_cash
quoted_margin
expected_margin
actual_margin
```

### 7.2. `project_scope_financial_summary`

Opcional en primera iteración, recomendado si se necesita análisis por ítem:

```text
scope_item_id
quoted_line_total
effective_sale_amount (calculado, no persistido)
quoted_cost
committed_cost
paid_cost
expected_margin
actual_margin
```

El `effective_sale_amount` puede aplicar dinámicamente el factor global de descuento correspondiente a su proforma.

---

## 8. Importación de proformas

### 8.1. Entrada

Desde la ficha del proyecto:

```text
+ Importar proforma
```

### 8.2. Filtro

Mostrar únicamente proformas:

- del mismo cliente;
- del usuario actual;
- `status = 'finalized'`;
- con ítems todavía no importados al proyecto.

### 8.3. Preview

Ejemplo:

```text
Proforma #35

☑ Counter
  Venta: $660
  Costo cotizado: $...

☑ Módulo lateral
  Venta: $...
  Costo cotizado: $...
```

Permitir importación parcial.

### 8.4. Acción atómica

La importación debe ejecutarse en una operación transaccional o RPC para evitar estados parciales:

1. validar ownership;
2. validar cliente;
3. validar `status = finalized`;
4. insertar/obtener `project_proformas`;
5. copiar snapshots de los ítems seleccionados;
6. evitar duplicados;
7. completar o revertir todo ante error.

Si no se implementa RPC inicialmente, se debe diseñar rollback explícito, aunque se recomienda la transacción en PostgreSQL.

---

## 9. UX de desglose de ejecución

En un `project_scope_item`:

```text
Mueble de TV
Venta proforma: $1,500
Costo cotizado: $1,050

[ Desglosar ejecución ]
```

Luego:

```text
Carpintería
Proveedor: Darío
Comprometido: $720

Piedra
Proveedor: Piedra X
Comprometido: $180

Herrajes
Proveedor: Y
Comprometido: $90
```

El ítem comercial permanece visible.

No se modifica la proforma.

---

## 10. Cobros y pagos

Debe existir una acción principal de registro rápido:

```text
+ Registrar
```

Opciones:

```text
Cobro de cliente
Pago a proveedor/maestro
Compra/material
Nuevo compromiso
Incidencia
```

### Cobro de cliente

Campos mínimos:

- proyecto;
- proforma/alcance opcional;
- tipo;
- valor;
- fecha;
- método;
- nota.

### Pago de proveedor/maestro

Campos mínimos:

- proyecto;
- partida de ejecución;
- proveedor;
- valor;
- fecha;
- concepto;
- método;
- nota.

Si existe un `committed_cost`, la UI debe mostrar antes de guardar:

```text
Costo comprometido: $1,020
Pagado anteriormente: $510
Pendiente: $510
Este pago: $510
Pendiente después: $0
```

---

## 11. Dashboard de proyectos

Nueva ruta principal:

```text
/dashboard/projects
```

Tarjetas generales:

```text
Proyectos activos
Por cobrar de clientes
Por pagar a proveedores/maestros
Caja actual de proyectos
```

Sección **Requieren atención**:

- proyecto aprobado sin adelanto;
- caja insuficiente frente a compromisos próximos;
- proveedor pendiente de pago;
- proyecto en cierre con saldo del cliente;
- receivable vencido.

No se debe mostrar caja como ganancia.

---

## 12. Ficha del proyecto

Ruta:

```text
/dashboard/projects/[id]
```

Pestañas sugeridas:

```text
Resumen
Alcance
Ejecución
Cobros
Pagos
Incidencias
Historial
```

### Resumen

Mostrar:

```text
Venta neta
Total cliente
Cobrado
Por cobrar

Costo cotizado
Costo comprometido
Costo pagado
Por pagar

Caja
Margen cotizado
Margen esperado
Margen real
```

---

## 13. Alertas de negocio

### Aprobado sin adelanto

Si:

```text
status in ('approved', 'waiting_advance')
AND collected = 0
```

mostrar:

> Adelanto pendiente

### Compromisos superiores a caja

Si:

```text
project_cash < supplier_balance
```

mostrar advertencia:

> La caja actual del proyecto es menor que los pagos comprometidos pendientes.

Esto no implica que todos los saldos venzan inmediatamente, pero sirve como alerta operativa.

### Proyecto en cierre con saldo

Si:

```text
status in ('finishing', 'pending_collection', 'completed')
AND client_balance > 0
```

mostrar:

> Saldo de cliente pendiente.

---

## 14. Integración con la arquitectura actual

Mantener el patrón actual:

```text
Form
→ Zod schema
→ Server Action
→ Supabase
→ revalidatePath
```

### Server Actions

Agregar:

```text
src/lib/actions/projects.ts
src/lib/actions/providers.ts
src/lib/actions/project-finances.ts
src/lib/actions/project-incidents.ts
```

### Validaciones

Agregar:

```text
src/lib/validations/project.ts
src/lib/validations/provider.ts
src/lib/validations/project-transaction.ts
src/lib/validations/project-incident.ts
```

### Componentes

Agregar:

```text
src/components/projects/
src/components/providers/
```

### Rutas

Agregar:

```text
src/app/(dashboard)/dashboard/projects/
src/app/(dashboard)/dashboard/providers/
```

La ruta exacta debe alinearse con la estructura real de rutas que exista al implementar.

---

## 15. Seguridad y RLS

Todas las tablas nuevas deben tener RLS habilitado.

Regla mínima:

```text
auth.uid() = user_id
```

Pero además las acciones sensibles deben verificar relaciones.

Ejemplo al importar proforma:

- `projects.user_id = auth.uid()`;
- `proformas.user_id = auth.uid()`;
- cliente del proyecto = cliente de proforma;
- proforma finalizada.

Nunca recibir `user_id` del navegador.

Siempre obtenerlo mediante:

```ts
const { data: { user } } = await supabase.auth.getUser()
```

y usar `user.id` en el servidor.

---

## 16. Índices recomendados

```sql
projects(user_id, status)
projects(user_id, client_id)

providers(user_id, active)
providers(user_id, name)

project_proformas(project_id)
project_proformas(proforma_id)

project_scope_items(project_id)
project_scope_items(project_proforma_id)

project_execution_items(project_id)
project_execution_items(scope_item_id)
project_execution_items(provider_id)

project_receivables(project_id, status)

project_transactions(project_id, transaction_date)
project_transactions(provider_id)
project_transactions(execution_item_id)

project_incidents(project_id, resolved)
```

Mantener también constraints de unicidad que prevengan importaciones duplicadas.

---

## 17. Estrategia de migraciones

No se requiere baseline en esta etapa.

Crear migraciones incrementales, por ejemplo:

```text
YYYYMMDDHHMMSS_create_projects_and_providers.sql
YYYYMMDDHHMMSS_create_project_scope.sql
YYYYMMDDHHMMSS_create_project_financials.sql
YYYYMMDDHHMMSS_create_project_incidents.sql
YYYYMMDDHHMMSS_create_project_financial_views.sql
```

Después de cada cambio:

1. actualizar `src/lib/types/database.ts`;
2. ejecutar tests;
3. ejecutar lint;
4. ejecutar build;
5. validar RLS con al menos dos usuarios.

---

## 18. Casos de aceptación

### Caso 1 — Todos Santos / Exhibidores

Datos:

```text
Venta al cliente: $1,400
Cobro cliente: $700.09

Proveedor Paul
Costo comprometido: $1,020
Pago realizado: $510
```

Resultado esperado:

```text
Saldo cliente: $699.91
Saldo Paul: $510
Caja proyecto: $190.09
Margen esperado, sin otros costos: $380
```

La UI no debe presentar $190.09 como utilidad.

### Caso 2 — Vero P. / Ricaurte

```text
Venta mueble: $120
Cobrado: $45
Pago Darío: $45
```

Resultado:

```text
Saldo cliente: $75
Caja: $0
```

### Caso 3 — Anois

```text
Proforma: $623.74
Adelanto acordado: $300
Cobro real: $0
```

Resultado:

```text
Receivable pendiente: $300
Cobrado: $0
Caja: $0
```

El adelanto acordado no debe contarse como dinero recibido.

### Caso 4 — Ítem dividido

Proforma:

```text
Mueble
Venta: $1,500
Costo cotizado: $1,050
```

Ejecución:

```text
Carpintería $720
Piedra $180
Herrajes $90
Instalación $60
```

Resultado:

```text
Costo comprometido: $1,050
Ítem comercial original permanece intacto.
```

### Caso 5 — Descuento global

Proforma:

```text
Ítem A: $600
Ítem B: $400
Descuento: 10%
Subtotal después de descuento: $900
```

Persistencia esperada:

```text
Scope A quoted_line_total = $600
Scope B quoted_line_total = $400
project_proforma discount_amount_snapshot = $100
project_proforma net_subtotal_snapshot = $900
```

No se persisten $540 y $360 como nuevos precios comerciales.

Si un reporte solicita precio efectivo por ítem, se deriva dinámicamente.

---

## 19. Fases de implementación

### Fase 1 — Base de proyectos

- `projects`;
- `providers`;
- RLS;
- CRUD;
- navegación.

### Fase 2 — Importación de proformas

- `project_proformas`;
- `project_scope_items`;
- importar únicamente finalizadas;
- validar mismo cliente;
- importación parcial;
- snapshots.

### Fase 3 — Ejecución

- `project_execution_items`;
- desglose de ítems;
- asignación de proveedor/maestro;
- costo estimado;
- costo comprometido.

### Fase 4 — Finanzas

- `project_receivables`;
- `project_transactions`;
- cobros;
- pagos;
- anulaciones;
- cálculo de saldos.

### Fase 5 — Resumen financiero

- vistas SQL;
- dashboard;
- caja;
- por cobrar;
- por pagar;
- márgenes;
- alertas.

### Fase 6 — Incidencias

- `project_incidents`;
- resolución;
- vínculo con flujo de proforma adicional cuando sea cobrable.

---

## 20. Fuera de alcance inicial

No implementar todavía:

- contabilidad tributaria;
- separación IVA de compras;
- facturación electrónica/SRI;
- inventario;
- nómina;
- contratos;
- calendario avanzado;
- CRM;
- automatización de WhatsApp;
- IA;
- multiempresa / organizaciones;
- conciliación bancaria;
- P&L contable formal.

---

## 21. Reglas técnicas críticas

1. Usar `numeric` para dinero en PostgreSQL.
2. No usar `float` para valores monetarios.
3. Los saldos derivados no se ingresan manualmente.
4. Caja no equivale a utilidad.
5. Un adelanto acordado no equivale a un cobro recibido.
6. Costo cotizado, costo comprometido y costo pagado son conceptos diferentes.
7. Los movimientos financieros reales no se borran; se anulan.
8. Una incidencia no aumenta automáticamente el precio del proyecto.
9. Una venta adicional debe volver al flujo de proforma.
10. Solo proformas finalizadas pueden importarse.
11. No modificar la proforma original desde Gestión de Proyectos.
12. No confiar en filtros del frontend para seguridad; aplicar RLS y validación server-side.
13. Todas las acciones deben derivar `user_id` desde Supabase Auth.
14. Los snapshots deben preservar el estado comercial al momento de importación.
15. El descuento se mantiene como ajuste global y solo se prorratea dinámicamente cuando un reporte lo requiera.

---

## 22. Resultado esperado de la V1

Al terminar esta implementación, ProformApp debe permitir pasar naturalmente de:

```text
Cotización
→ Aprobación
→ Ejecución
→ Cobros
→ Pagos
→ Cierre
```

sin crear un sistema contable general.

La principal ganancia funcional es poder responder, para cualquier proyecto:

> ¿Cuánto vendimos?

> ¿Cuánto hemos cobrado?

> ¿Cuánto cotizamos que costaría?

> ¿Cuánto realmente comprometimos con proveedores y maestros?

> ¿Cuánto ya pagamos?

> ¿Cuánto falta pagar?

> ¿Cuánto queda por cobrar?

> ¿Cuánto dinero hay actualmente en la caja de este proyecto?

> ¿Qué margen esperábamos y cuál terminó siendo el margen real?
