'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { getClients } from '@/lib/actions/clients'

interface ClientSelectorProps {
    value?: string
    onChange: (value: string) => void
    error?: string
}

export function ClientSelector({ value, onChange, error }: ClientSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [clients, setClients] = React.useState<{ value: string; label: string }[]>([])
    const [loading, setLoading] = React.useState(false)

    // Load initial clients
    React.useEffect(() => {
        const fetchClients = async () => {
            setLoading(true)
            const { data } = await getClients('', 1, 50) // Fetch top 50
            if (data) {
                setClients(data.map(c => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name} (${c.cedula_ruc})`
                })))
            }
            setLoading(false)
        }
        fetchClients()
    }, [])

    const selectedLabel = clients.find((c) => c.value === value)?.label

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            !value && "text-muted-foreground",
                            error && "border-red-500"
                        )}
                    >
                        {value ? selectedLabel : "Select client..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                    <Command>
                        <CommandInput placeholder="Search client..." />
                        <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.value}
                                        value={client.label}
                                        onSelect={() => {
                                            onChange(client.value)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === client.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {client.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}
