import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { Users, FileText } from 'lucide-react'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Clients
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Active clients
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Proformas this Month
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.monthlyProformas}</div>
                        <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
