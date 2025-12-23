import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <h2 className="text-3xl font-bold mb-8">Settings</h2>
            <div className="p-6 rounded-lg border border-border bg-card">
                <p className="text-muted-foreground">
                    Settings configuration (API Keys, Agency Profile, etc.) will go here.
                </p>
            </div>
        </DashboardLayout>
    )
}
