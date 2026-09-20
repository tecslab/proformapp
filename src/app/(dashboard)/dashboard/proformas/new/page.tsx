import { ProformaForm } from '@/components/proformas/proforma-form'
import { getIncidentProformaContext } from '@/lib/actions/project-incidents'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function NewProformaPage({ searchParams }: { searchParams: Promise<{ incident?: string }> }) {
    const { incident: incidentId } = await searchParams
    const context = incidentId ? await getIncidentProformaContext(incidentId) : null
    if (incidentId && !context) notFound()
    const initialData = context ? {
        client_id: context.project.client_id, date: new Date().toISOString(), iva_percentage: 15,
        descuento: 0, payment_methods: '50% de anticipo y saldo contra entrega',
        observations: 'Adicional para ' + context.project.name + ' — Incidencia: ' + context.incident.title,
        items: [{ quantity: 1, unit: 'u', description: context.incident.title, comment: '',
            unit_cost: context.incident.final_cost ?? context.incident.estimated_cost ?? 0, percentage_gain: 0 }],
    } : undefined
    return (
        <div className="max-w-6xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">New Proforma</h1>
            {context && <p className="mb-4 rounded-md border p-4 text-sm">Proforma adicional por incidencia. Revisa el costo y la ganancia antes de guardar. Después de finalizarla, vuelve a <Link className="underline" href={'/dashboard/projects/' + context.project.id}>{context.project.name}</Link> e impórtala como alcance adicional.</p>}
            <ProformaForm initialData={initialData} />
        </div>
    )
}
