import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Edit, UserRound } from 'lucide-react'
import { getImportableProformas, getProject, getProjectScope } from '@/lib/actions/projects'
import { ProjectScope } from '@/components/projects/project-scope'
import { ProjectExecution } from '@/components/projects/project-execution'
import { getExecution } from '@/lib/actions/project-execution'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/lib/validations/project'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value: string | null) {
    return value ? new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : 'Sin definir'
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: project } = await getProject(id)
    if (!project) notFound()
    const execution = await getExecution(id)
    const [{ data: scope, error: scopeError }, { data: importableProformas, error: importError }] = await Promise.all([
        getProjectScope(id),
        getImportableProformas(id),
    ])

    return <div className="mx-auto max-w-6xl space-y-6 py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-3"><h1 className="text-3xl font-bold">{project.name}</h1><Badge variant="secondary">{PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}</Badge></div><p className="text-muted-foreground">Base operativa del proyecto</p></div><Button asChild variant="outline"><Link href={`/dashboard/projects/${id}/edit`}><Edit className="mr-2 h-4 w-4" />Editar</Link></Button></div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4" />Cliente</CardTitle></CardHeader><CardContent>{project.clients ? <><p className="font-medium">{project.clients.first_name} {project.clients.last_name}</p><p className="text-sm text-muted-foreground">{project.clients.cedula_ruc}</p></> : 'Cliente no disponible'}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Planificación</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Inicio</p><p className="font-medium">{formatDate(project.start_date)}</p></div><div><p className="text-muted-foreground">Fin estimado</p><p className="font-medium">{formatDate(project.expected_end_date)}</p></div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{project.notes || 'Sin notas.'}</CardContent></Card>
        {scopeError || importError ? <Card className="border-destructive"><CardContent className="py-6 text-sm text-destructive">No se pudo cargar el alcance: {scopeError ?? importError}</CardContent></Card> : <ProjectScope projectId={id} scope={scope} importableProformas={importableProformas} />}
        {execution.error || scopeError ? <p role="alert" className="text-destructive">No se pudo cargar la ejecución: {execution.error ?? scopeError}</p> : <ProjectExecution projectId={id} items={execution.items} providers={execution.providers} scope={scope.flatMap(entry => entry.project_scope_items)} />}
    </div>
}
