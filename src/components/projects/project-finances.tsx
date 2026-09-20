'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cancelProjectReceivable, createProjectReceivable, recordProjectTransaction, voidProjectTransaction } from '@/lib/actions/project-finances'
import { transactionSchema, receivableSchema, transactionTypes, transactionLabels, clientTypes, outgoingTypes, type TransactionInput, type ReceivableInput } from '@/lib/validations/project-transaction'
import { executionPaymentBalance } from '@/lib/project-finance-calculations'
import type { Database, ExecutionRow, TransactionRow, Tables } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Receivable = Database['public']['Views']['project_receivable_balances']['Row']
type Options = {
    projectId: string; executions: ExecutionRow[]; providers: Tables<'providers'>[];
    proformas: { id: string; label: string }[]; scope: { id: string; description: string }[];
    transactions: TransactionRow[]; receivables: Receivable[]
}
const money = (value: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
const selectStyle = 'w-full rounded-md border p-2 text-sm bg-background'
const statusLabels: Record<string, string> = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', cancelled: 'Cancelado' }
function localDate() {
    const now = new Date()
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block space-y-1 text-sm"><span>{label}</span>{children}</label>
}

export function ProjectFinances(props: Options) {
    const [dialog, setDialog] = useState<'transaction' | 'receivable' | null>(null)
    const [confirmation, setConfirmation] = useState<{ kind: 'void' | 'cancel'; id: string } | null>(null)
    return <section className="space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-semibold">Cobros y pagos</h2><div className="flex gap-2"><Button variant="outline" onClick={() => setDialog('receivable')}>Programar cobro</Button><Button onClick={() => setDialog('transaction')}>Registrar movimiento</Button></div></div>
        <p className="text-sm text-muted-foreground">La caja muestra entradas menos salidas; no representa utilidad. Los cobros programados no aumentan la caja. Las devoluciones afectan la caja y se muestran por separado del cobro comercial.</p>
        <Card><CardHeader><CardTitle>Cobros esperados</CardTitle></CardHeader><CardContent className="space-y-3">
            {!props.receivables.length && <p className="text-sm text-muted-foreground">No hay cobros programados.</p>}
            {props.receivables.map(r => <div key={r.id} className="rounded-md border p-3 space-y-1">
                <div className="flex justify-between gap-3"><p className="font-medium">{r.description}</p><span>{statusLabels[r.effective_status]}</span></div>
                <p className="text-sm">Esperado: {money(r.expected_amount)} · Recibido: {money(r.collected)} · Saldo: {money(r.balance)}</p>
                <p className="text-sm text-muted-foreground">Vencimiento: {r.due_date ?? 'Sin fecha'}</p>
                {r.effective_status !== 'cancelled' && r.effective_status !== 'paid' && <Button variant="outline" size="sm" onClick={() => setConfirmation({ kind: 'cancel', id: r.id })}>Cancelar cobro esperado</Button>}
            </div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Movimientos reales</CardTitle></CardHeader><CardContent className="space-y-3">
            {!props.transactions.length && <p className="text-sm text-muted-foreground">Todavía no hay movimientos.</p>}
            {props.transactions.map(t => <div key={t.id} className="rounded-md border p-3 space-y-1">
                <div className="flex justify-between gap-3"><p className="font-medium">{t.description}</p><span className={t.voided_at ? 'line-through text-muted-foreground' : 'font-semibold'}>{t.direction === 'in' ? '+' : '−'}{money(t.amount)}</span></div>
                <p className="text-sm text-muted-foreground">{t.transaction_date} · {transactionLabels[t.type as keyof typeof transactionLabels]} · {t.payment_method || 'Sin método'}</p>
                {t.provider_id && <p className="text-sm">Proveedor: {props.providers.find(p => p.id === t.provider_id)?.name ?? 'No disponible'}</p>}
                {t.execution_item_id && <p className="text-sm">Partida: {props.executions.find(e => e.id === t.execution_item_id)?.description ?? 'Archivada'}</p>}
                {t.notes && <p className="text-sm whitespace-pre-wrap">{t.notes}</p>}
                {t.voided_at ? <p className="text-sm text-destructive">Anulado {t.voided_at.slice(0, 10)}: {t.void_reason}</p> : <Button variant="outline" size="sm" onClick={() => setConfirmation({ kind: 'void', id: t.id })}>Anular movimiento</Button>}
            </div>)}
        </CardContent></Card>
        <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{dialog === 'receivable' ? 'Programar cobro' : 'Registrar movimiento real'}</DialogTitle><DialogDescription>{dialog === 'receivable' ? 'Registra un acuerdo de cobro pendiente de recibir.' : 'Registra únicamente dinero que ya ingresó o salió del proyecto.'}</DialogDescription></DialogHeader>
                {dialog === 'transaction' && <TransactionForm {...props} onSaved={() => setDialog(null)} />}
                {dialog === 'receivable' && <ReceivableForm {...props} onSaved={() => setDialog(null)} />}
            </DialogContent>
        </Dialog>
        <Dialog open={confirmation !== null} onOpenChange={open => { if (!open) setConfirmation(null) }}>
            <DialogContent><DialogHeader><DialogTitle>{confirmation?.kind === 'void' ? 'Anular movimiento' : 'Cancelar cobro esperado'}</DialogTitle><DialogDescription>El registro se conserva en el historial. Cancelar un cobro esperado no anula dinero recibido.</DialogDescription></DialogHeader>
                {confirmation && <FinancialConfirmation {...confirmation} onSaved={() => setConfirmation(null)} />}
            </DialogContent>
        </Dialog>
    </section>
}

function TransactionForm(props: Options & { onSaved: () => void }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const form = useForm<TransactionInput>({ resolver: zodResolver(transactionSchema), defaultValues: {
        project_id: props.projectId, project_proforma_id: '', scope_item_id: '', execution_item_id: '',
        provider_id: '', receivable_id: '', type: 'client_advance', direction: 'in',
        amount: '', transaction_date: localDate(), description: '', payment_method: '', notes: '',
    } })
    const type = useWatch({ control: form.control, name: 'type' })
    const direction = useWatch({ control: form.control, name: 'direction' })
    const executionId = useWatch({ control: form.control, name: 'execution_item_id' })
    const amount = useWatch({ control: form.control, name: 'amount' })
    const execution = props.executions.find(e => e.id === executionId)
    const payment = execution ? executionPaymentBalance(execution, props.transactions) : null
    function changeType(next: TransactionInput['type']) {
        form.setValue('type', next)
        form.setValue('receivable_id', '')
        form.setValue('execution_item_id', '')
        form.setValue('scope_item_id', '')
        form.setValue('project_proforma_id', '')
        form.setValue('provider_id', '')
        if (clientTypes.includes(next)) form.setValue('direction', 'in')
        else if (outgoingTypes.includes(next)) form.setValue('direction', 'out')
    }
    async function submit(values: TransactionInput) {
        setError(null)
        try {
            const result = await recordProjectTransaction(values)
            if (result.error) { setError(result.error); return }
            props.onSaved(); router.refresh()
        } catch { setError('No se pudo guardar. Intenta nuevamente.') }
    }
    return <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <Field label="Tipo"><select className={selectStyle} value={type} onChange={e => changeType(e.target.value as TransactionInput['type'])}>{transactionTypes.map(t => <option key={t} value={t}>{transactionLabels[t]}</option>)}</select></Field>
        {(type === 'refund' || type === 'other') && <Field label="Dirección"><select className={selectStyle} {...form.register('direction')} onChange={e => { form.setValue('direction', e.target.value as 'in' | 'out'); form.setValue('execution_item_id', '') }}><option value="in">Entrada</option><option value="out">Salida</option></select></Field>}
        <Field label="Proforma importada (opcional)"><select className={selectStyle} {...form.register('project_proforma_id')}><option value="">Sin vínculo</option>{props.proformas.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
        <Field label="Ítem comercial (opcional)"><select className={selectStyle} {...form.register('scope_item_id')}><option value="">Sin vínculo</option>{props.scope.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}</select></Field>
        {clientTypes.includes(type) && <Field label="Aplicar a cobro esperado"><select className={selectStyle} {...form.register('receivable_id')}><option value="">Sin vínculo</option>{props.receivables.filter(r => !['paid', 'cancelled'].includes(r.effective_status)).map(r => <option key={r.id} value={r.id}>{r.description} — pendiente {money(r.balance)}</option>)}</select></Field>}
        {direction === 'out' && <Field label="Partida de ejecución"><select className={selectStyle} {...form.register('execution_item_id')} onChange={e => {
            form.setValue('execution_item_id', e.target.value)
            const selected = props.executions.find(item => item.id === e.target.value)
            form.setValue('provider_id', selected?.provider_id ?? '')
            form.setValue('scope_item_id', selected?.scope_item_id ?? '')
            form.setValue('project_proforma_id', '')
        }}><option value="">Gasto sin partida</option>{props.executions.filter(e => !e.archived_at && e.status !== 'cancelled').map(e => <option key={e.id} value={e.id}>{e.description}</option>)}</select></Field>}
        {!clientTypes.includes(type) && <Field label="Proveedor o maestro"><select className={selectStyle} {...form.register('provider_id')}><option value="">Sin proveedor</option>{props.providers.map(p => <option key={p.id} value={p.id}>{p.name}{p.active ? '' : ' (inactivo)'}</option>)}</select></Field>}
        <div className="grid grid-cols-2 gap-3"><Field label="Monto"><Input inputMode="decimal" {...form.register('amount')} /></Field><Field label="Fecha"><Input type="date" {...form.register('transaction_date')} /></Field></div>
        {execution && payment && <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <p>Costo comprometido: {execution.committed_cost === null ? 'Sin definir' : money(execution.committed_cost)}</p>
            <p>Pagado anteriormente: {money(payment.paid)}</p>
            {payment.balance !== null && <><p>Pendiente: {money(payment.balance)}</p><p>Este pago: {money(Number(amount) || 0)}</p><p>Pendiente después: {money((Math.round(payment.balance * 100) - Math.round((Number(amount) || 0) * 100)) / 100)}</p>
                {Number(amount) > payment.balance && <p className="text-destructive">Este pago supera el saldo comprometido.</p>}</>}
        </div>}
        <Field label="Concepto"><Input {...form.register('description')} /></Field>
        <Field label="Método de pago"><Input placeholder="Transferencia, efectivo…" {...form.register('payment_method')} /></Field>
        <Field label="Notas"><Textarea {...form.register('notes')} /></Field>
        {Object.entries(form.formState.errors).map(([key, value]) => <p role="alert" className="text-sm text-destructive" key={key}>{value.message}</p>)}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? 'Guardando…' : 'Registrar movimiento'}</Button>
    </form>
}

function ReceivableForm(props: Options & { onSaved: () => void }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const form = useForm<ReceivableInput>({ resolver: zodResolver(receivableSchema), defaultValues: {
        project_id: props.projectId, project_proforma_id: '', description: '', expected_amount: '', due_date: '',
    } })
    async function submit(values: ReceivableInput) {
        try {
            const result = await createProjectReceivable(values)
            if (result.error) { setError(result.error); return }
            props.onSaved(); router.refresh()
        } catch { setError('No se pudo guardar. Intenta nuevamente.') }
    }
    return <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <Field label="Concepto"><Input {...form.register('description')} /></Field>
        <Field label="Monto esperado"><Input inputMode="decimal" {...form.register('expected_amount')} /></Field>
        <Field label="Vencimiento"><Input type="date" {...form.register('due_date')} /></Field>
        <Field label="Proforma importada"><select className={selectStyle} {...form.register('project_proforma_id')}><option value="">Sin vínculo</option>{props.proformas.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
        {Object.entries(form.formState.errors).map(([key, value]) => <p role="alert" className="text-sm text-destructive" key={key}>{value.message}</p>)}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button disabled={form.formState.isSubmitting} type="submit">Guardar cobro esperado</Button>
    </form>
}

function FinancialConfirmation({ kind, id, onSaved }: { kind: 'void' | 'cancel'; id: string; onSaved: () => void }) {
    const router = useRouter()
    const [reason, setReason] = useState('')
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    async function submit(event: React.FormEvent) {
        event.preventDefault(); setPending(true); setError(null)
        try {
            const result = kind === 'void' ? await voidProjectTransaction({ id, reason }) : await cancelProjectReceivable(id)
            if (result.error) { setError(result.error); return }
            onSaved(); router.refresh()
        } catch { setError('No se pudo completar la operación.') }
        finally { setPending(false) }
    }
    return <form onSubmit={submit} className="space-y-4">
        {kind === 'void' && <Field label="Motivo de anulación"><Textarea required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></Field>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" variant="destructive" disabled={pending || (kind === 'void' && !reason.trim())}>{pending ? 'Guardando…' : 'Confirmar'}</Button>
    </form>
}
