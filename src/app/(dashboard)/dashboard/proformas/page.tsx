import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProformas } from '@/lib/actions/proformas'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { SearchInput } from '@/components/common/search-input'
import { PaginationControl } from '@/components/common/pagination-control'
import { ProformaActions } from '@/components/proformas/proforma-actions'

export default async function ProformasPage({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string
        page?: string
    }>
}) {
    const params = await searchParams;
    const query = params?.query || ''
    const page = Number(params?.page) || 1
    const pageSize = 10

    const { data: proformas, count, error } = await getProformas(query, page, pageSize)

    if (error) {
        return <div className="p-8 text-red-500">Error loading proformas: {error}</div>
    }

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Proformas</h1>
                <Link href="/dashboard/proformas/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Proforma
                    </Button>
                </Link>
            </div>

            <div className="flex justify-between items-center">
                <SearchInput placeholder="Search by # or Client Name..." />
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
                            <TableHead className="w-[50px]"></TableHead>
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
                                    <TableCell className="font-mono font-medium">
                                        {String(proforma.proforma_number).padStart(6, '0')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {proforma.clients ? `${proforma.clients.first_name} ${proforma.clients.last_name}` : 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {proforma.clients?.cedula_ruc}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(proforma.date), 'PP')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={proforma.status === 'finalized' ? 'secondary' : 'outline'} className="capitalize">
                                            {proforma.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        ${proforma.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <ProformaActions id={proforma.id} status={proforma.status} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControl totalCount={count || 0} pageSize={pageSize} />
        </div>
    )
}
