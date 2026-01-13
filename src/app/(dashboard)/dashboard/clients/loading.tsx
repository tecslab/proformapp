import { TableSkeleton } from "@/components/common/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[150px]" />
                <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-[300px]" />
            </div>
            <TableSkeleton columnCount={5} rowCount={8} />
        </div>
    )
}
