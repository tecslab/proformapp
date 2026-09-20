import { notFound } from 'next/navigation'
import { getProject, getProjectClients } from '@/lib/actions/projects'
import { ProjectForm } from '@/components/projects/project-form'
import type { ProjectStatus } from '@/lib/validations/project'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [{ data: project }, { data: clients }] = await Promise.all([getProject(id), getProjectClients()])
    if (!project) notFound()

    return <div className="mx-auto max-w-4xl py-8"><ProjectForm clients={clients} project={{
        id: project.id,
        client_id: project.client_id,
        name: project.name,
        status: project.status as ProjectStatus,
        start_date: project.start_date ?? '',
        expected_end_date: project.expected_end_date ?? '',
        notes: project.notes ?? '',
    }} /></div>
}
