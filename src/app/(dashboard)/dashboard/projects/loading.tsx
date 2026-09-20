import { TableSkeleton } from '@/components/common/table-skeleton'

export default function ProjectsLoading() {
    return <div className="mx-auto max-w-6xl py-8"><div className="mb-8 h-9 w-40 animate-pulse rounded bg-muted" /><TableSkeleton /></div>
}
