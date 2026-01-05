import { Suspense } from 'react'
import { ClientList } from '@/components/clients/client-list'
import { getClients } from '@/lib/actions/clients'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const search = typeof params.search === 'string' ? params.search : ''
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1

    // In server components we can fetch directly
    const { data: clients, count, error } = await getClients(search, page)

    if (error) {
        return <div>Error loading clients: {error}</div>
    }

    // Since we don't have total pages calc in action yet, simplified:
    const totalPages = Math.ceil((count || 0) / 10)

    return (
        <div className="max-w-6xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Clients</h1>
            <Suspense fallback={<div>Loading clients...</div>}>
                <ClientList
                    clients={clients || []}
                    totalCount={count || 0}
                    currentPage={page}
                    totalPages={totalPages}
                />
            </Suspense>
        </div>
    )
}
