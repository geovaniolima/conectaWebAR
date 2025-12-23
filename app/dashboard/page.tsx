"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCampaigns() {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setCampaigns(data)
            setLoading(false)
        }
        fetchCampaigns()
    }, [])

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
                <Link href="/dashboard/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2">{campaign.name}</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Type: {campaign.content_type}
                            </p>
                            <div className="flex gap-2">
                                <Link href={`/view/${campaign.id}`} target="_blank">
                                    <Button variant="outline" size="sm">Preview</Button>
                                </Link>
                                <Button variant="secondary" size="sm">Edit</Button>
                            </div>
                        </div>
                    ))}
                    {campaigns.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            No campaigns found. Create your first one!
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    )
}
