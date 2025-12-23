import Link from 'next/link'
import { LayoutDashboard, PlusCircle, Settings } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card p-6 hidden md:block">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-primary tracking-tighter">BREAKFAST<br />VISION</h1>
                </div>
                <nav className="space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                        <LayoutDashboard size={20} />
                        Overview
                    </Link>
                    <Link href="/dashboard/create" className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                        <PlusCircle size={20} />
                        New Campaign
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
