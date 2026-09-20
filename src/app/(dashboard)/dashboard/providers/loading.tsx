import { TableSkeleton } from '@/components/common/table-skeleton'

export default function ProvidersLoading() {
    return <div className="mx-auto max-w-6xl py-8"><div className="mb-8 h-9 w-72 animate-pulse rounded bg-muted" /><TableSkeleton /></div>
}
