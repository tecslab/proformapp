'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Plus, Search, UserMinus } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { deactivateProvider } from '@/lib/actions/providers'
import type { Tables } from '@/lib/types/database'
import { PROVIDER_TYPE_LABELS, type ProviderType } from '@/lib/validations/provider'
import { PaginationControl } from '@/components/common/pagination-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export function ProviderList({ providers, totalCount }: { providers: Tables<'providers'>[]; totalCount: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) params.set('search', term)
        else params.delete('search')
        params.set('page', '1')
        router.replace(`?${params.toString()}`)
    }, 300)

    async function handleDeactivate(id: string) {
        const result = await deactivateProvider(id)
        if (result.error) toast.error(result.error)
        else toast.success('Proveedor desactivado')
    }

    return <div className="space-y-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="relative w-full sm:w-80"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" type="search" placeholder="Buscar proveedores…" defaultValue={searchParams.get('search') ?? ''} onChange={(event) => handleSearch(event.target.value)} /></div>
            <Button asChild><Link href="/dashboard/providers/new"><Plus className="mr-2 h-4 w-4" />Nuevo proveedor o maestro</Link></Button>
        </div>
        <div className="rounded-md border"><Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Especialidad</TableHead><TableHead>Contacto</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>{providers.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No se encontraron proveedores o maestros.</TableCell></TableRow> : providers.map((provider) => <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell><Badge variant="outline">{PROVIDER_TYPE_LABELS[provider.type as ProviderType] ?? provider.type}</Badge></TableCell>
                <TableCell>{provider.specialty || '—'}</TableCell><TableCell>{provider.phone || provider.email || '—'}</TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" asChild><Link aria-label={`Editar ${provider.name}`} href={`/dashboard/providers/${provider.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button aria-label={`Desactivar ${provider.name}`} variant="ghost" size="icon"><UserMinus className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Desactivar proveedor?</AlertDialogTitle><AlertDialogDescription>Ya no aparecerá entre los proveedores activos. Sus referencias históricas se conservarán.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeactivate(provider.id)}>Desactivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </div></TableCell>
            </TableRow>)}</TableBody>
        </Table></div>
        <p className="text-sm text-muted-foreground">{totalCount} proveedor{totalCount === 1 ? '' : 'es'} activo{totalCount === 1 ? '' : 's'}</p>
        <PaginationControl totalCount={totalCount} pageSize={10} />
    </div>
}
