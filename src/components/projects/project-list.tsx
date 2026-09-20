'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Archive, Edit, FolderKanban, Plus, Search } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { archiveProject } from '@/lib/actions/projects'
import type { Tables } from '@/lib/types/database'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/lib/validations/project'
import { PaginationControl } from '@/components/common/pagination-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

type Project = Tables<'projects'> & {
    clients: { first_name: string; last_name: string; cedula_ruc: string } | null
}

export function ProjectList({ projects, totalCount }: { projects: Project[]; totalCount: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) params.set('search', term)
        else params.delete('search')
        params.set('page', '1')
        router.replace(`?${params.toString()}`)
    }, 300)

    async function handleArchive(id: string) {
        const result = await archiveProject(id)
        if (result.error) toast.error(result.error)
        else toast.success('Proyecto archivado')
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" type="search" placeholder="Buscar proyectos…" defaultValue={searchParams.get('search') ?? ''} onChange={(event) => handleSearch(event.target.value)} />
                </div>
                <Button asChild><Link href="/dashboard/projects/new"><Plus className="mr-2 h-4 w-4" />Nuevo proyecto</Link></Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader><TableRow><TableHead>Proyecto</TableHead><TableHead>Cliente</TableHead><TableHead>Estado</TableHead><TableHead>Inicio</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No se encontraron proyectos.</TableCell></TableRow>
                        ) : projects.map((project) => (
                            <TableRow key={project.id}>
                                <TableCell className="font-medium"><Link className="hover:underline" href={`/dashboard/projects/${project.id}`}>{project.name}</Link></TableCell>
                                <TableCell>{project.clients ? `${project.clients.first_name} ${project.clients.last_name}` : '—'}</TableCell>
                                <TableCell><Badge variant="secondary">{PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}</Badge></TableCell>
                                <TableCell>{project.start_date ? new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC' }).format(new Date(`${project.start_date}T00:00:00Z`)) : '—'}</TableCell>
                                <TableCell className="text-right"><div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" asChild><Link aria-label={`Ver ${project.name}`} href={`/dashboard/projects/${project.id}`}><FolderKanban className="h-4 w-4" /></Link></Button>
                                    <Button variant="ghost" size="icon" asChild><Link aria-label={`Editar ${project.name}`} href={`/dashboard/projects/${project.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                                    <AlertDialog><AlertDialogTrigger asChild><Button aria-label={`Archivar ${project.name}`} variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Archivar proyecto?</AlertDialogTitle><AlertDialogDescription>Se ocultará de la lista activa sin eliminar su historial.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleArchive(project.id)}>Archivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </div></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <p className="text-sm text-muted-foreground">{totalCount} proyecto{totalCount === 1 ? '' : 's'} activo{totalCount === 1 ? '' : 's'}</p>
            <PaginationControl totalCount={totalCount} pageSize={10} />
        </div>
    )
}
