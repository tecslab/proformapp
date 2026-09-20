'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createProject, updateProject } from '@/lib/actions/projects'
import {
    PROJECT_STATUSES,
    PROJECT_STATUS_LABELS,
    projectSchema,
    type ProjectFormData,
} from '@/lib/validations/project'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface ClientOption {
    id: string
    first_name: string
    last_name: string
    cedula_ruc: string
}

interface ProjectFormProps {
    clients: ClientOption[]
    project?: ProjectFormData & { id: string }
}

const selectClassName = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'

export function ProjectForm({ clients, project }: ProjectFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: project ?? {
            client_id: '',
            name: '',
            status: 'draft',
            start_date: '',
            expected_end_date: '',
            notes: '',
        },
    })

    async function onSubmit(values: ProjectFormData) {
        setLoading(true)
        const result = project
            ? await updateProject(project.id, values)
            : await createProject(values)

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        }
    }

    return (
        <Card className="mx-auto max-w-3xl">
            <CardHeader>
                <CardTitle>{project ? 'Editar proyecto' : 'Nuevo proyecto'}</CardTitle>
                <CardDescription>Define el cliente, las fechas y el estado operativo inicial.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" placeholder="Ej. Todos Santos / Exhibidores" {...form.register('name')} />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="client_id">Cliente</Label>
                            <select id="client_id" className={selectClassName} {...form.register('client_id')}>
                                <option value="">Seleccionar cliente</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.first_name} {client.last_name} — {client.cedula_ruc}
                                    </option>
                                ))}
                            </select>
                            {form.formState.errors.client_id && <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <select id="status" className={selectClassName} {...form.register('status')}>
                                {PROJECT_STATUSES.map((status) => (
                                    <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha de inicio</Label>
                            <Input id="start_date" type="date" {...form.register('start_date')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expected_end_date">Fin estimado</Label>
                            <Input id="expected_end_date" type="date" {...form.register('expected_end_date')} />
                            {form.formState.errors.expected_end_date && <p className="text-sm text-destructive">{form.formState.errors.expected_end_date.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea id="notes" rows={5} placeholder="Alcance general, acuerdos o contexto del proyecto" {...form.register('notes')} />
                        {form.formState.errors.notes && <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                        <Button type="submit" disabled={loading || clients.length === 0}>
                            {loading ? 'Guardando…' : 'Guardar proyecto'}
                        </Button>
                    </div>
                    {clients.length === 0 && <p className="text-sm text-destructive">Primero debes crear un cliente.</p>}
                </form>
            </CardContent>
        </Card>
    )
}
