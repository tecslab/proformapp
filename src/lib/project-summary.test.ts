import { dashboardTotals, projectAlerts } from './project-summary'
import type { ProjectFinancialSummary } from './types/database'

const base: ProjectFinancialSummary = {
    project_id: 'one', user_id: 'owner', name: 'Todos Santos', status: 'in_progress', archived_at: null,
    net_sales: 1400, client_total_due: 1400, quoted_cost: 1020, committed_cost: 1020,
    supplier_balance: 510, paid_over_commitment: 0, collected: 700.09, paid_cost: 510,
    paid_uncommitted_costs: 0, project_cash: 190.09, overdue_receivables: 0,
    client_balance: 699.91, quoted_margin: 380, expected_margin: 380, actual_margin: null,
    advance_pending: false, cash_shortfall: true, closing_balance_pending: false,
}
it('includes outstanding closed projects but excludes archived projects in dashboard totals', () => {
    expect(dashboardTotals([
        base, { ...base, status: 'completed', client_balance: 10, supplier_balance: 0, project_cash: -5 },
        { ...base, archived_at: '2026-09-20' },
    ])).toEqual({ active: 1, receivable: 709.91, payable: 510, cash: 185.09 })
})
it('does not offset receivables on one project with a credit on another', () => {
    expect(dashboardTotals([base, { ...base, client_balance: -900 }]).receivable).toBe(699.91)
})
it('reports business attention conditions independently', () => {
    expect(projectAlerts({ ...base, advance_pending: true, closing_balance_pending: true, overdue_receivables: 2 })).toEqual([
        'Adelanto pendiente', 'La caja actual es menor que los pagos comprometidos pendientes.',
        'Proveedor o maestro pendiente de pago', 'Saldo de cliente pendiente al cierre', 'Cobros esperados vencidos: 2',
    ])
})
it('shows no alerts when none of their conditions apply', () => {
    expect(projectAlerts({ ...base, supplier_balance: 0, cash_shortfall: false })).toEqual([])
})
