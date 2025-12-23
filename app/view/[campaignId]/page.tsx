"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
const ARScene = dynamic(() => import('@/components/ar/ARScene'), {
    ssr: false,
    loading: () => <div className="flex h-screen items-center justify-center bg-black text-white">Loading AR Module...</div>
})
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type Campaign = {
    id: string
    name: string
    target_image_url: string
    compiled_mind_file_url: string
    content_type: 'model' | 'video'
    content_url: string
    cta_link: string | null
}

export default function ARViewPage() {
    const params = useParams()
    const campaignId = params.campaignId as string
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [targetFound, setTargetFound] = useState(false)

    useEffect(() => {
        async function fetchCampaign() {
            if (!campaignId) return

            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single()

            if (error) {
                console.error('Error fetching campaign:', error)
                setError('Campaign not found or invalid.')
            } else {
                setCampaign(data)
            }
            setLoading(false)
        }

        fetchCampaign()
    }, [campaignId])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p>Loading Experience...</p>
            </div>
        )
    }

    if (error || !campaign) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <p className="text-red-500">{error || 'Campaign not found'}</p>
            </div>
        )
    }

    if (!campaign.compiled_mind_file_url) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <p className="text-yellow-500">This campaign is not ready (missing target file).</p>
            </div>
        )
    }

    return (
        <main className="fixed inset-0 overflow-hidden bg-black">
            <ARScene
                mindFileUrl={campaign.compiled_mind_file_url}
                onTargetFound={() => setTargetFound(true)}
                onTargetLost={() => setTargetFound(false)}
            >
                {/* 3D Content */}
                {campaign.content_type === 'model' ? (
                    <Model url={campaign.content_url} />
                ) : (
                    <VideoPlane url={campaign.content_url} />
                )}
            </ARScene>

            {/* UI Overlay */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
                {targetFound && campaign.cta_link && (
                    <Button
                        className="pointer-events-auto bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4"
                        onClick={() => window.open(campaign.cta_link!, '_blank')}
                    >
                        Open Link
                    </Button>
                )}
            </div>
        </main>
    )
}

import { useGLTF, useVideoTexture } from '@react-three/drei'

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url)
    return <primitive object={scene} scale={[0.5, 0.5, 0.5]} />
}

function VideoPlane({ url }: { url: string }) {
    const texture = useVideoTexture(url)
    return (
        <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[1, 0.56]} /> {/* 16:9 aspect ratio assumption */}
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    )
}
