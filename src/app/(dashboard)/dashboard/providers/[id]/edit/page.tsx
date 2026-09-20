import { notFound } from 'next/navigation'
import { getProvider } from '@/lib/actions/providers'
import { ProviderForm } from '@/components/providers/provider-form'
import type { ProviderType } from '@/lib/validations/provider'

export default async function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: provider } = await getProvider(id)
    if (!provider) notFound()

    return <div className="mx-auto max-w-4xl py-8"><ProviderForm provider={{
        id: provider.id,
        name: provider.name,
        type: provider.type as ProviderType,
        specialty: provider.specialty ?? '',
        cedula_ruc: provider.cedula_ruc ?? '',
        phone: provider.phone ?? '',
        email: provider.email ?? '',
        address: provider.address ?? '',
        notes: provider.notes ?? '',
        active: provider.active,
    }} /></div>
}
