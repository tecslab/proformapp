import type { ProjectFinancialSummary } from '@/lib/types/database'

export function projectAlerts(summary: ProjectFinancialSummary) {
    const alerts: string[] = []
    if (summary.advance_pending) alerts.push('Adelanto pendiente')
    if (summary.cash_shortfall) alerts.push('La caja actual es menor que los pagos comprometidos pendientes.')
    if (summary.supplier_balance > 0) alerts.push('Proveedor o maestro pendiente de pago')
    if (summary.closing_balance_pending) alerts.push('Saldo de cliente pendiente al cierre')
    if (summary.overdue_receivables > 0) alerts.push('Cobros esperados vencidos: ' + summary.overdue_receivables)
    return alerts
}

export function dashboardTotals(rows: ProjectFinancialSummary[]) {
    const visible = rows.filter(row => !row.archived_at)
    const sum = (field: 'client_balance' | 'supplier_balance' | 'project_cash', positive = false) =>
        visible.reduce((total, row) => total + Math.round((positive ? Math.max(0, row[field]) : row[field]) * 100), 0) / 100
    return {
        active: visible.filter(row => !['completed', 'cancelled'].includes(row.status)).length,
        receivable: sum('client_balance', true), payable: sum('supplier_balance', true), cash: sum('project_cash'),
    }
}
