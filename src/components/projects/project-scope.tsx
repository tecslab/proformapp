import { FileText } from 'lucide-react'
import { PROJECT_PROFORMA_RELATION_LABELS } from '@/lib/validations/project'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportProformaDialog, type ImportableProforma } from './import-proforma-dialog'

interface ScopeItem {
    id: string
    description: string
    comment: string | null
    quantity: number
    unit: string
    quoted_unit_cost: number
    quoted_line_total: number
    status: string
}

interface ImportedProforma {
    id: string
    relation_type: string
    subtotal_snapshot: number
    discount_percentage_snapshot: number
    discount_amount_snapshot: number
    net_subtotal_snapshot: number
    iva_amount_snapshot: number
    total_snapshot: number
    proformas: { proforma_number: number; date: string } | null
    project_scope_items: ScopeItem[]
}

function money(value: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
}

export function ProjectScope({ projectId, scope, importableProformas }: { projectId: string; scope: ImportedProforma[]; importableProformas: ImportableProforma[] }) {
    return <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-semibold">Alcance comercial</h2><p className="text-sm text-muted-foreground">Snapshots de los ítems vendidos en proformas finalizadas.</p></div><div className="flex flex-col items-end gap-1"><ImportProformaDialog projectId={projectId} proformas={importableProformas} hasScope={scope.length > 0} />{importableProformas.length === 0 && <span className="text-xs text-muted-foreground">No hay ítems finalizados disponibles.</span>}</div></div>

        {scope.length === 0 ? <Card className="border-dashed"><CardContent className="py-10 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Aún no hay alcance importado</p><p className="mt-1 text-sm text-muted-foreground">Finaliza una proforma del mismo cliente para incorporarla al proyecto.</p></CardContent></Card> : scope.map((entry) => <Card key={entry.id}>
            <CardHeader className="border-b"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><CardTitle>Proforma #{entry.proformas?.proforma_number ?? '—'}</CardTitle><CardDescription className="mt-1"><Badge variant="outline">{PROJECT_PROFORMA_RELATION_LABELS[entry.relation_type as keyof typeof PROJECT_PROFORMA_RELATION_LABELS] ?? entry.relation_type}</Badge></CardDescription></div><div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-sm"><span className="text-muted-foreground">Venta neta</span><span className="font-mono font-medium">{money(entry.net_subtotal_snapshot)}</span><span className="text-muted-foreground">Total cliente</span><span className="font-mono font-medium">{money(entry.total_snapshot)}</span></div></div>
                {entry.discount_amount_snapshot > 0 && <p className="mt-3 text-xs text-muted-foreground">Subtotal original {money(entry.subtotal_snapshot)} · Descuento global {entry.discount_percentage_snapshot}% ({money(entry.discount_amount_snapshot)})</p>}
            </CardHeader>
            <CardContent className="space-y-1">{entry.project_scope_items.map((item) => <div key={item.id} className="grid gap-2 border-b py-3 last:border-0 sm:grid-cols-[1fr_150px_130px]"><div><p className="font-medium">{item.description}</p>{item.comment && <p className="text-sm text-muted-foreground">{item.comment}</p>}</div><p className="text-sm text-muted-foreground sm:text-right">{item.quantity} {item.unit}<br />Costo: {money(item.quoted_unit_cost * item.quantity)}</p><div className="sm:text-right"><p className="font-mono font-medium">{money(item.quoted_line_total)}</p><p className="text-xs text-muted-foreground">Venta original</p></div></div>)}</CardContent>
        </Card>)}
    </section>
}
