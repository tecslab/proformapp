'use client'

import { Calendar, Home, Inbox, Search, Settings, User2, Users, FileText } from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from '@/components/ui/sidebar'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

// Menu items.
const items = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
    },
    {
        title: 'Clients',
        url: '/dashboard/clients',
        icon: Users,
    },
    {
        title: 'Proformas',
        url: '/dashboard/proformas',
        icon: FileText,
    }
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Proforma App</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <form action={async () => {
                    await logout()
                }}>
                    <Button variant="outline" className="w-full justify-start">
                        <User2 className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
