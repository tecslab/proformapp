'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileInput } from 'lucide-react'
import { importProjectProforma } from '@/lib/actions/projects'
import { PROJECT_PROFORMA_RELATION_LABELS, type ImportProjectProformaData } from '@/lib/validations/project'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface ImportableItem {
    id: string
    description: string
    comment: string | null
    quantity: number
    unit: string
    unit_cost: number
    percentage_gain: number
    line_total: number
    position: number
}

export interface ImportableProforma {
    id: string
    proforma_number: number
    date: string
    subtotal: number
    descuento: number
    iva_amount: number
    total: number
    items: ImportableItem[]
}

function money(value: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value)
}

export function ImportProformaDialog({ projectId, proformas, hasScope }: { projectId: string; proformas: ImportableProforma[]; hasScope: boolean }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [proformaId, setProformaId] = useState(proformas[0]?.id ?? '')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [relationType, setRelationType] = useState<'initial' | 'additional'>(hasScope ? 'additional' : 'initial')
    const [loading, setLoading] = useState(false)
    const selectedProforma = useMemo(() => proformas.find((proforma) => proforma.id === proformaId), [proformaId, proformas])

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen)
        if (!nextOpen) return

        const availableProforma = proformas.find((proforma) => proforma.id === proformaId) ?? proformas[0]
        setProformaId(availableProforma?.id ?? '')
        setSelectedIds(availableProforma?.items.map((item) => item.id) ?? [])
        setRelationType(hasScope ? 'additional' : 'initial')
    }

    function selectProforma(id: string) {
        setProformaId(id)
        const proforma = proformas.find((candidate) => candidate.id === id)
        setSelectedIds(proforma?.items.map((item) => item.id) ?? [])
    }

    function toggleItem(id: string) {
        setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id])
    }

    async function handleImport() {
        if (!selectedProforma || selectedIds.length === 0) return
        setLoading(true)
        const input: ImportProjectProformaData = {
            project_id: projectId,
            proforma_id: selectedProforma.id,
            item_ids: selectedIds,
            relation_type: relationType,
        }
        const result = await importProjectProforma(input)
        if (result.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success(`${selectedIds.length} ítem${selectedIds.length === 1 ? '' : 's'} importado${selectedIds.length === 1 ? '' : 's'}`)
        setOpen(false)
        setLoading(false)
        router.refresh()
    }

    return <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild><Button disabled={proformas.length === 0}><FileInput className="mr-2 h-4 w-4" />Importar proforma</Button></DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader><DialogTitle>Importar proforma finalizada</DialogTitle><DialogDescription>Solo aparecen proformas del mismo cliente con ítems aún no incorporados. Los valores se guardarán como snapshots.</DialogDescription></DialogHeader>
            {selectedProforma && <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div className="space-y-2"><label htmlFor="proforma" className="text-sm font-medium">Proforma</label><select id="proforma" value={proformaId} onChange={(event) => selectProforma(event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                        {proformas.map((proforma) => <option key={proforma.id} value={proforma.id}>Proforma #{proforma.proforma_number}</option>)}
                    </select></div>
                    <div className="space-y-2"><label htmlFor="relation" className="text-sm font-medium">Tipo de alcance</label><select id="relation" value={relationType} onChange={(event) => setRelationType(event.target.value as 'initial' | 'additional')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                        {Object.entries(PROJECT_PROFORMA_RELATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select></div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-4">
                    <div><p className="text-muted-foreground">Subtotal original</p><p className="font-mono font-medium">{money(selectedProforma.subtotal)}</p></div>
                    <div><p className="text-muted-foreground">Descuento global</p><p className="font-mono font-medium">{selectedProforma.descuento}%</p></div>
                    <div><p className="text-muted-foreground">IVA</p><p className="font-mono font-medium">{money(selectedProforma.iva_amount)}</p></div>
                    <div><p className="text-muted-foreground">Total cliente</p><p className="font-mono font-medium">{money(selectedProforma.total)}</p></div>
                </div>

                <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium">Ítems disponibles</p><Badge variant="secondary">{selectedIds.length} seleccionados</Badge></div>
                    <div className="max-h-80 divide-y overflow-y-auto rounded-md border">
                        {selectedProforma.items.map((item) => <label key={item.id} className="flex cursor-pointer gap-3 p-4 hover:bg-muted/40">
                            <input type="checkbox" className="mt-1 h-4 w-4" checked={selectedIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                            <span className="min-w-0 flex-1"><span className="block font-medium">{item.description}</span>{item.comment && <span className="block text-sm text-muted-foreground">{item.comment}</span>}<span className="mt-1 block text-xs text-muted-foreground">{item.quantity} {item.unit} · Costo cotizado {money(item.unit_cost * item.quantity)}</span></span>
                            <span className="font-mono text-sm">{money(item.line_total)}</span>
                        </label>)}
                    </div>
                    <p className="text-xs text-muted-foreground">Los importes de línea permanecen originales. El descuento se conserva únicamente como ajuste global de la proforma.</p>
                </div>
            </div>}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={loading || selectedIds.length === 0} onClick={handleImport}>{loading ? 'Importando…' : `Importar ${selectedIds.length || ''}`}</Button></DialogFooter>
        </DialogContent>
    </Dialog>
}
