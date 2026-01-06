import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

export default async function ProformasPage() {
    const supabase = await createClient()
    const { data: proformas, error } = await supabase
        .from('proformas')
        .select('*, clients(first_name, last_name)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error(error)
        return <div>Error loading proformas</div>
    }

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Proformas</h1>
                <Link href="/dashboard/proformas/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Proforma
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proformas?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No proformas found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            proformas?.map((proforma) => (
                                <TableRow key={proforma.id}>
                                    <TableCell className="font-mono">
                                        {String(proforma.proforma_number).padStart(6, '0')}
                                    </TableCell>
                                    <TableCell>
                                        {proforma.clients ? `${proforma.clients.first_name} ${proforma.clients.last_name}` : 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(proforma.date), 'PP')}
                                    </TableCell>
                                    <TableCell className="capitalize">{proforma.status}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ${proforma.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Actions to be added in Phase 4 */}
                                        <Button variant="ghost" size="sm" disabled>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
