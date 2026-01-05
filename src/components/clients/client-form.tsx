'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { clientSchema, type ClientFormData } from '@/lib/validations/client'
import { createClient, updateClient } from '@/lib/actions/clients'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ClientFormProps {
    client?: ClientFormData & { id: string }
}

export function ClientForm({ client }: ClientFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const isEdit = !!client

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            first_name: client?.first_name || '',
            last_name: client?.last_name || '',
            cedula_ruc: client?.cedula_ruc || '',
            email: client?.email || '',
            phone: client?.phone || '',
            address: client?.address || '',
        },
    })

    async function onSubmit(values: ClientFormData) {
        setLoading(true)

        let result
        if (isEdit) {
            result = await updateClient(client.id, values)
        } else {
            result = await createClient(values)
        }

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success(isEdit ? 'Client updated successfully' : 'Client created successfully')
            // Redirect handled in action, but we can prevent double submit
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Client' : 'New Client'}</CardTitle>
                <CardDescription>
                    {isEdit ? 'Update client information.' : 'Add a new client to your list.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                placeholder="John"
                                {...form.register('first_name')}
                            />
                            {form.formState.errors.first_name && (
                                <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                placeholder="Doe"
                                {...form.register('last_name')}
                            />
                            {form.formState.errors.last_name && (
                                <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cedula_ruc">Cédula / RUC</Label>
                        <Input
                            id="cedula_ruc"
                            placeholder="1234567890"
                            maxLength={13}
                            {...form.register('cedula_ruc')}
                        />
                        {form.formState.errors.cedula_ruc && (
                            <p className="text-sm text-red-500">{form.formState.errors.cedula_ruc.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Unique identification (10 or 13 digits)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="0991234567"
                                {...form.register('phone')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            placeholder="Main St, City"
                            {...form.register('address')}
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Client' : 'Create Client')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
