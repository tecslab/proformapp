'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saveExecution } from '@/lib/actions/project-execution'
import { executionSchema, executionLabels, executionStatuses, type ExecutionFormData } from '@/lib/validations/project-execution'
import type { ExecutionRow, Tables } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Scope = Pick<Tables<'project_scope_items'>, 'id' | 'description' | 'quoted_line_total'>
const money = (value: number | null) => value === null ? 'Sin definir' : new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
const selectStyle = 'w-full rounded-md border p-2 text-sm bg-background'

export function ProjectExecution({ projectId, items, scope, providers }: {
    projectId: string; items: ExecutionRow[]; scope: Scope[]; providers: Tables<'providers'>[]
}) {
    const [editor, setEditor] = useState<{ item?: ExecutionRow; scopeId: string } | null>(null)
    const groups = [...scope.map(s => ({ id: s.id, name: s.description, sale: s.quoted_line_total })), { id: '', name: 'Costos generales del proyecto', sale: null }]
    return <section className="space-y-4">
        <div className="flex justify-between gap-4"><h2 className="text-2xl font-semibold">Ejecución</h2><Button onClick={() => setEditor({ scopeId: '' })}>Nueva partida</Button></div>
        {groups.map(group => <Card key={group.id}>
            <CardHeader><div className="flex justify-between gap-3"><div><CardTitle>{group.name}</CardTitle>{group.sale !== null && <p className="text-sm text-muted-foreground mt-2">Venta original: {money(group.sale)}</p>}</div><Button variant="outline" onClick={() => setEditor({ scopeId: group.id })}>{group.id ? 'Desglosar ejecución' : 'Agregar costo general'}</Button></div></CardHeader>
            <CardContent className="space-y-3">
                {items.filter(item => (item.scope_item_id ?? '') === group.id).map(item => <div key={item.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex justify-between gap-3"><div><p className="font-medium">{item.description}</p><p className="text-sm text-muted-foreground">{providers.find(p => p.id === item.provider_id)?.name ?? 'Sin proveedor asignado'} · {executionLabels[item.status as keyof typeof executionLabels]}</p></div><Button variant="ghost" onClick={() => setEditor({ item, scopeId: group.id })}>Editar</Button></div>
                    <p className="text-sm">Estimado: {money(item.estimated_cost)} · Comprometido: {money(item.committed_cost)}</p>
                    {item.category && <p className="text-sm text-muted-foreground">{item.category}</p>}
                    {item.notes && <p className="text-sm whitespace-pre-wrap">{item.notes}</p>}
                </div>)}
                {!items.some(item => (item.scope_item_id ?? '') === group.id) && <p className="text-sm text-muted-foreground">Sin partidas de ejecución.</p>}
            </CardContent>
        </Card>)}
        <Dialog open={editor !== null} onOpenChange={open => { if (!open) setEditor(null) }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editor?.item ? 'Editar partida' : 'Nueva partida de ejecución'}</DialogTitle><DialogDescription>Asigna el trabajo y sus costos. Puedes cancelar una partida desde su estado.</DialogDescription></DialogHeader>
                {editor && <ExecutionForm projectId={projectId} item={editor.item} scopeId={editor.scopeId} scope={scope} providers={providers} onSaved={() => setEditor(null)} />}
            </DialogContent>
        </Dialog>
    </section>
}

function ExecutionForm({ projectId, item, scopeId, scope, providers, onSaved }: {
    projectId: string; item?: ExecutionRow; scopeId: string; scope: Scope[]; providers: Tables<'providers'>[]; onSaved: () => void
}) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const form = useForm<ExecutionFormData>({
        resolver: zodResolver(executionSchema),
        defaultValues: {
            project_id: projectId, scope_item_id: scopeId, provider_id: item?.provider_id ?? '',
            description: item?.description ?? '', category: item?.category ?? '',
            estimated_cost: item?.estimated_cost?.toString() ?? '', committed_cost: item?.committed_cost?.toString() ?? '',
            status: (item?.status ?? 'planned') as ExecutionFormData['status'], notes: item?.notes ?? '',
        },
    })
    async function submit(values: ExecutionFormData) {
        setError(null)
        try {
            const result = await saveExecution(values, item?.id)
            if (result.error) { setError(result.error); return }
            onSaved()
            router.refresh()
        } catch { setError('No se pudo guardar. Intenta nuevamente.') }
    }
    return <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <label className="block space-y-1"><span>Ítem comercial</span><select className={selectStyle} {...form.register('scope_item_id')}><option value="">Costo general</option>{scope.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}</select></label>
        <label className="block space-y-1"><span>Descripción</span><Input {...form.register('description')} /></label>
        <label className="block space-y-1"><span>Proveedor o maestro</span><select className={selectStyle} {...form.register('provider_id')}><option value="">Sin asignar</option>{providers.filter(p => p.active || p.id === item?.provider_id).map(p => <option key={p.id} value={p.id}>{p.name}{!p.active ? ' (inactivo)' : ''}</option>)}</select></label>
        <label className="block space-y-1"><span>Categoría</span><Input {...form.register('category')} /></label>
        <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span>Costo estimado</span><Input inputMode="decimal" placeholder="Sin definir" {...form.register('estimated_cost')} /></label>
            <label className="block space-y-1"><span>Costo comprometido</span><Input inputMode="decimal" placeholder="Sin definir" {...form.register('committed_cost')} /></label>
        </div>
        <label className="block space-y-1"><span>Estado</span><select className={selectStyle} {...form.register('status')}>{executionStatuses.map(s => <option key={s} value={s}>{executionLabels[s]}</option>)}</select></label>
        <label className="block space-y-1"><span>Notas</span><Textarea {...form.register('notes')} /></label>
        {Object.entries(form.formState.errors).map(([key, value]) => <p key={key} role="alert" className="text-sm text-destructive">{value.message}</p>)}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Guardando…' : 'Guardar partida'}</Button>
    </form>
}
