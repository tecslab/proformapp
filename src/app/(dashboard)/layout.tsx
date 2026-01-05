import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="p-4 border-b flex items-center h-16">
                    <SidebarTrigger />
                </div>
                <div className="p-4">
                    {children}
                </div>
            </main>
            <Toaster />
        </SidebarProvider>
    )
}
