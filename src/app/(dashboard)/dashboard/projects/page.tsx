import { Suspense } from 'react'
import { getProjects } from '@/lib/actions/projects'
import { ProjectList } from '@/components/projects/project-list'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams
    const search = typeof params.search === 'string' ? params.search : ''
    const parsedPage = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const { data, count, error } = await getProjects(search, page)

    if (error) return <div className="p-8 text-destructive">Error al cargar proyectos: {error}</div>

    return <div className="mx-auto max-w-6xl py-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Proyectos</h1><p className="mt-2 text-muted-foreground">Controla la ejecución de los trabajos aprobados.</p></div>
        <Suspense fallback={<div>Cargando proyectos…</div>}><ProjectList projects={data} totalCount={count} /></Suspense>
    </div>
}
