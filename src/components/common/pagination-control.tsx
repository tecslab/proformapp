'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PaginationControl({ totalCount, pageSize }: { totalCount: number, pageSize: number }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1
    const totalPages = Math.ceil(totalCount / pageSize)

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <a href={createPageURL(currentPage - 1)}><ChevronLeft className="h-4 w-4" /> Previous</a>
                ) : (
                    <span><ChevronLeft className="h-4 w-4" /> Previous</span>
                )}
            </Button>
            <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <a href={createPageURL(currentPage + 1)}>Next <ChevronRight className="h-4 w-4" /></a>
                ) : (
                    <span>Next <ChevronRight className="h-4 w-4" /></span>
                )}
            </Button>
        </div>
    )
}
