'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2, Plus, Search } from 'lucide-react'
import { deleteClient } from '@/lib/actions/clients'
import type { Database } from '@/lib/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientListProps {
    clients: Client[]
    totalCount: number
    currentPage: number
    totalPages: number
}

export function ClientList({ clients, totalCount, currentPage, totalPages }: ClientListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }
        params.set('page', '1') // Reset to first page on search
        router.replace(`?${params.toString()}`)
    }, 300)

    const handleDelete = async (id: string) => {
        const result = await deleteClient(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Client deleted successfully')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search clients..."
                        className="pl-8"
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get('search')?.toString()}
                    />
                </div>
                <Link href="/dashboard/clients/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>CI/RUC</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        {client.first_name} {client.last_name}
                                    </TableCell>
                                    <TableCell>{client.cedula_ruc}</TableCell>
                                    <TableCell>{client.email || '-'}</TableCell>
                                    <TableCell>{client.phone || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/clients/${client.id}/edit`}>
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove the client from your active list. Historical proformas will not be affected.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(client.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination controls can go here, omitted for brevity but recommended for v2 */}
            <div className="text-sm text-muted-foreground">
                Showing {clients.length} of {totalCount} clients
            </div>
        </div>
    )
}
