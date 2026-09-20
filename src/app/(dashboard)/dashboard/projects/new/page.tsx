import Link from 'next/link'
import { getProjectClients } from '@/lib/actions/projects'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'

export default async function NewProjectPage() {
    const { data: clients, error } = await getProjectClients()
    if (error) return <div className="p-8 text-destructive">Error al cargar clientes: {error}</div>

    return <div className="mx-auto max-w-4xl py-8">
        {clients.length === 0 && <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-md border p-4 text-sm"><span>No tienes clientes activos para asignar.</span><Button size="sm" asChild><Link href="/dashboard/clients/new">Crear cliente</Link></Button></div>}
        <ProjectForm clients={clients} />
    </div>
}
