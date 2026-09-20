import Link from 'next/link'
import type { ProjectFinancialSummary } from '@/lib/types/database'
import { dashboardTotals, projectAlerts } from '@/lib/project-summary'
import { Card, CardContent } from '@/components/ui/card'

const money = (value: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
function Metrics({ values }: { values: [string, string][] }) {
    return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(([label, value]) =>
        <Card key={label}><CardContent><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></CardContent></Card>
    )}</div>
}
export function ProjectSummary({ summary }: { summary: ProjectFinancialSummary }) {
    const alerts = projectAlerts(summary)
    const values: [string, number | null][] = [
        ['Venta neta', summary.net_sales], ['Total cliente', summary.client_total_due],
        ['Cobrado', summary.collected], ['Por cobrar', summary.client_balance],
        ['Costo cotizado', summary.quoted_cost], ['Costo comprometido', summary.committed_cost],
        ['Costo pagado', summary.paid_cost], ['Por pagar', summary.supplier_balance],
        ['Caja', summary.project_cash], ['Margen cotizado', summary.quoted_margin],
        ['Margen esperado', summary.expected_margin], ['Margen real', summary.actual_margin],
    ]
    return <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Resumen financiero</h2>
        <p className="text-sm text-muted-foreground">Ventas y total cliente corresponden al alcance importado. En importaciones parciales se aplica proporcionalmente el descuento y el IVA de la proforma.</p>
        <Metrics values={values.map(([label, value]) => [label, value === null ? 'Disponible al cierre' : money(value)])} />
        <p className="text-sm text-muted-foreground">La caja no representa utilidad. El margen esperado incluye compromisos, gastos sin compromiso y pagos que exceden lo comprometido. El margen real se muestra al completar el proyecto.</p>
        {!!alerts.length && <div className="rounded-md border p-4"><h3 className="font-semibold">Requiere atención</h3><ul className="mt-2 list-disc pl-5 text-sm">{alerts.map(alert => <li key={alert}>{alert}</li>)}</ul><p className="mt-2 text-xs text-muted-foreground">La advertencia de caja no implica que todos los compromisos venzan hoy.</p></div>}
    </section>
}
export function ProjectsDashboard({ rows }: { rows: ProjectFinancialSummary[] }) {
    const totals = dashboardTotals(rows)
    const attention = rows.filter(row => !row.archived_at).map(row => ({ row, alerts: projectAlerts(row) })).filter(item => item.alerts.length)
    return <section className="mb-8 space-y-4">
        <Metrics values={[
            ['Proyectos activos', String(totals.active)], ['Por cobrar de clientes', money(totals.receivable)],
            ['Por pagar a proveedores/maestros', money(totals.payable)], ['Caja actual de proyectos', money(totals.cash)],
        ]} />
        <p className="text-sm text-muted-foreground">Totales de todos los proyectos no archivados, incluidos saldos de proyectos cerrados. La búsqueda filtra la lista inferior. Caja no equivale a ganancia.</p>
        <h2 className="text-xl font-semibold">Requieren atención</h2>
        {!attention.length ? <p className="text-sm text-muted-foreground">Sin alertas pendientes.</p> : <div className="grid gap-3 md:grid-cols-2">{attention.map(({ row, alerts }) =>
            <Card key={row.project_id}><CardContent><Link className="font-semibold underline" href={'/dashboard/projects/' + row.project_id}>{row.name}</Link><ul className="mt-2 list-disc pl-5 text-sm">{alerts.map(alert => <li key={alert}>{alert}</li>)}</ul></CardContent></Card>
        )}</div>}
    </section>
}
