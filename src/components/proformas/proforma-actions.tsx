'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, FileEdit, Copy, Lock, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { cloneProforma, finalizeProforma } from '@/lib/actions/proformas'

interface ProformaActionsProps {
    id: string
    status: string
}

export function ProformaActions({ id, status }: ProformaActionsProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [finalizeOpen, setFinalizeOpen] = useState(false)

    async function handleClone() {
        setLoading(true)
        const result = await cloneProforma(id)
        setLoading(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Proforma cloned successfully')
        }
    }

    async function handleFinalize() {
        setLoading(true)
        const result = await finalizeProforma(id)
        setLoading(false)
        setFinalizeOpen(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Proforma finalized')
        }
    }

    return (
        <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    {/* EDIT: Only allowed if draft */}
                    {status === 'draft' ? (
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/proformas/${id}/edit`} className="cursor-pointer">
                                <FileEdit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/proformas/${id}/edit`} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {/* CLONE: Always allowed */}
                    <DropdownMenuItem onClick={handleClone} disabled={loading}>
                        <Copy className="mr-2 h-4 w-4" />
                        Clone
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* FINALIZE: Only allowed if draft */}
                    {status === 'draft' && (
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Lock className="mr-2 h-4 w-4" />
                                Finalize
                            </DropdownMenuItem>
                        </DialogTrigger>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finalize Proforma?</DialogTitle>
                    <DialogDescription>
                        This will lock the proforma and prevent further editing. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setFinalizeOpen(false)}>Cancel</Button>
                    <Button onClick={handleFinalize} disabled={loading}>
                        {loading ? 'Finalizing...' : 'Confirm Finalize'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
