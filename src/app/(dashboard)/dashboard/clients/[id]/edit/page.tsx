import { ClientForm } from '@/components/clients/client-form'
import { getClient } from '@/lib/actions/clients'
import { notFound } from 'next/navigation'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: client, error } = await getClient(id)

    if (error || !client) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Edit Client</h1>
            <ClientForm client={client} />
        </div>
    )
}
