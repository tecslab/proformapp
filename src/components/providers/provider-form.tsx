'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createProvider, updateProvider } from '@/lib/actions/providers'
import { PROVIDER_TYPES, PROVIDER_TYPE_LABELS, providerSchema, type ProviderFormData } from '@/lib/validations/provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const selectClassName = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

export function ProviderForm({ provider }: { provider?: ProviderFormData & { id: string } }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const form = useForm<ProviderFormData>({
        resolver: zodResolver(providerSchema),
        defaultValues: provider ?? {
            name: '', type: 'supplier', specialty: '', cedula_ruc: '', phone: '', email: '', address: '', notes: '', active: true,
        },
    })

    async function onSubmit(values: ProviderFormData) {
        setLoading(true)
        const result = provider ? await updateProvider(provider.id, values) : await createProvider(values)
        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        }
    }

    return (
        <Card className="mx-auto max-w-3xl">
            <CardHeader><CardTitle>{provider ? 'Editar proveedor o maestro' : 'Nuevo proveedor o maestro'}</CardTitle><CardDescription>Registra los datos de contacto y la especialidad para asignarlo posteriormente a partidas de ejecución.</CardDescription></CardHeader>
            <CardContent><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" placeholder="Nombre o razón social" {...form.register('name')} />{form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}</div>
                    <div className="space-y-2"><Label htmlFor="type">Tipo</Label><select id="type" className={selectClassName} {...form.register('type')}>{PROVIDER_TYPES.map((type) => <option key={type} value={type}>{PROVIDER_TYPE_LABELS[type]}</option>)}</select></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="specialty">Especialidad</Label><Input id="specialty" placeholder="Ej. Carpintería" {...form.register('specialty')} /></div>
                    <div className="space-y-2"><Label htmlFor="cedula_ruc">Cédula / RUC</Label><Input id="cedula_ruc" inputMode="numeric" maxLength={13} {...form.register('cedula_ruc')} />{form.formState.errors.cedula_ruc && <p className="text-sm text-destructive">{form.formState.errors.cedula_ruc.message}</p>}</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="phone">Teléfono</Label><Input id="phone" {...form.register('phone')} /></div>
                    <div className="space-y-2"><Label htmlFor="email">Correo</Label><Input id="email" type="email" {...form.register('email')} />{form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}</div>
                </div>
                <div className="space-y-2"><Label htmlFor="address">Dirección</Label><Input id="address" {...form.register('address')} /></div>
                <div className="space-y-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" rows={4} {...form.register('notes')} /></div>
                {provider && <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('active')} /> Activo</label>}
                <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button></div>
            </form></CardContent>
        </Card>
    )
}
