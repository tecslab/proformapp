'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

import { createProforma, getNextProformaNumber } from '@/lib/actions/proformas'
import { proformaSchema, type ProformaFormData } from '@/lib/validations/proforma'
import { ClientSelector } from '@/components/clients/client-selector'

export function ProformaForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [nextParams, setNextParams] = useState<number | null>(null)

    const form = useForm({
        resolver: zodResolver(proformaSchema),
        defaultValues: {
            date: new Date().toISOString(),
            iva_percentage: 15,
            items: [
                { quantity: 1, unit: 'u', description: '', unit_cost: 0, percentage_gain: 0 }
            ],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    })

    // Watch items for calculations
    const items = useWatch({ control: form.control, name: 'items' })
    const ivaPercentage = Number(useWatch({ control: form.control, name: 'iva_percentage' })) || 0

    // Calculations
    const calculateTotals = () => {
        let subtotal = 0

        items.forEach((item) => {
            const cost = Number(item.unit_cost) || 0
            const gain = Number(item.percentage_gain) || 0
            const quantity = Number(item.quantity) || 0

            // Logic defined by user
            const earned_value = cost * (gain / 100)
            const unit_price = cost + earned_value
            const total = unit_price * quantity

            subtotal += total
        })

        const iva_amount = subtotal * (ivaPercentage / 100)
        const total = subtotal + iva_amount

        return { subtotal, iva_amount, total }
    }

    const { subtotal, iva_amount, total } = calculateTotals()

    // Fetch next proforma number
    useEffect(() => {
        getNextProformaNumber().then(num => setNextParams(num))
    }, [])

    async function onSubmit(data: ProformaFormData) {
        setLoading(true)
        const result = await createProforma(data)

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Proforma created successfully')
            // Redirect handles automatically in action
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <ClientSelector
                                value={form.watch('client_id')}
                                onChange={(val) => form.setValue('client_id', val)}
                                error={form.formState.errors.client_id?.message}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !form.watch('date') && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {form.watch('date') ? format(new Date(form.watch('date')), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={new Date(form.watch('date'))}
                                        onSelect={(date) => date && form.setValue('date', date.toISOString())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {form.formState.errors.date && (
                                <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Delivery Days</Label>
                            <Input
                                type="number"
                                {...form.register('delivery_days')}
                                placeholder="e.g. 5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Methods</Label>
                            <Input
                                {...form.register('payment_methods')}
                                placeholder="e.g. Cash, Transfer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Proforma #</Label>
                            <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground font-mono">
                                {nextParams ? String(nextParams).padStart(6, '0') : 'Loading...'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Items</h3>
                    <Button type="button" variant="secondary" size="sm" onClick={() => append({ quantity: 1, unit: 'u', description: '', unit_cost: 0, percentage_gain: 0 })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Qty</TableHead>
                                <TableHead className="w-[80px]">Unit</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[120px]">Cost</TableHead>
                                <TableHead className="w-[100px]">Gain %</TableHead>
                                <TableHead className="w-[120px] text-right">Price</TableHead>
                                <TableHead className="w-[120px] text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => {
                                // Calculate row values for display
                                const cost = Number(form.watch(`items.${index}.unit_cost`)) || 0
                                const gain = Number(form.watch(`items.${index}.percentage_gain`)) || 0
                                const qty = Number(form.watch(`items.${index}.quantity`)) || 0

                                const earned = cost * (gain / 100)
                                const price = cost + earned
                                const rowTotal = price * qty

                                return (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...form.register(`items.${index}.quantity`)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                {...form.register(`items.${index}.unit`)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                {...form.register(`items.${index}.description`)}
                                            />
                                            {form.formState.errors.items?.[index]?.description && (
                                                <p className="text-xs text-red-500 mt-1">{form.formState.errors.items[index]?.description?.message}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...form.register(`items.${index}.unit_cost`)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="1"
                                                {...form.register(`items.${index}.percentage_gain`)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            ${price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            ${rowTotal.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex justify-end">
                <Card className="w-full md:w-1/3">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                IVA (%):
                                <Input
                                    type="number"
                                    className="w-16 h-8"
                                    {...form.register('iva_percentage')}
                                />
                            </span>
                            <span className="font-mono">${iva_amount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? 'Saving...' : 'Create Proforma'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
