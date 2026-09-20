import { Suspense } from 'react'
import { getProviders } from '@/lib/actions/providers'
import { ProviderList } from '@/components/providers/provider-list'

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams
    const search = typeof params.search === 'string' ? params.search : ''
    const parsedPage = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const { data, count, error } = await getProviders(search, page)
    if (error) return <div className="p-8 text-destructive">Error al cargar proveedores: {error}</div>

    return <div className="mx-auto max-w-6xl py-8"><div className="mb-8"><h1 className="text-3xl font-bold">Proveedores y maestros</h1><p className="mt-2 text-muted-foreground">Administra las personas y empresas que participan en la ejecución.</p></div><Suspense fallback={<div>Cargando proveedores…</div>}><ProviderList providers={data} totalCount={count} /></Suspense></div>
}
