import { notFound, redirect } from 'next/navigation'
import { getProforma } from '@/lib/actions/proformas'
import { ProformaForm } from '@/components/proformas/proforma-form'

export default async function EditProformaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: proforma, error } = await getProforma(id)

    if (error || !proforma) {
        notFound()
    }

    const isReadOnly = proforma.status !== 'draft'

    return (
        <div className="max-w-6xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">
                {isReadOnly ? 'View Proforma' : 'Edit Proforma'}
            </h1>
            <ProformaForm
                initialData={proforma}
                id={id}
                readOnly={isReadOnly}
            />
        </div>
    )
}
