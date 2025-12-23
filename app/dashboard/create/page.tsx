"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, CheckCircle } from 'lucide-react'

declare global {
    interface Window {
        MINDAR: any;
    }
}

export default function CreateCampaignPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [compiling, setCompiling] = useState(false)
    const [compilerLoaded, setCompilerLoaded] = useState(false)
    const [scriptStatus, setScriptStatus] = useState<string>('Initializing...')
    const [currentCdnIndex, setCurrentCdnIndex] = useState(0)

    const [name, setName] = useState('')
    const [contentType, setContentType] = useState<'model' | 'video'>('model')
    const [ctaLink, setCtaLink] = useState('')

    const [targetFile, setTargetFile] = useState<File | null>(null)
    const [contentFile, setContentFile] = useState<File | null>(null)
    const [compiledFile, setCompiledFile] = useState<File | null>(null)

    const CDNS = [
        'https://unpkg.com/mind-ar@1.2.5/dist/mindar-image.prod.js',
        'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'
    ]

    const loadMindAR = (index: number) => {
        if (typeof window === 'undefined') return

        if (window.MINDAR && window.MINDAR.IMAGE) {
            setCompilerLoaded(true)
            setScriptStatus('Ready (Cached)')
            return
        }

        if (index >= CDNS.length) {
            setScriptStatus('Failed to load. Click Retry.')
            return
        }

        const cdnUrl = CDNS[index]
        setScriptStatus(`downloading... (${index + 1})`)

        const existingScript = document.getElementById('mindar-script')
        if (existingScript) existingScript.remove()

        const script = document.createElement('script')
        script.id = 'mindar-script'
        script.src = cdnUrl
        script.type = "module"
        script.async = true
        script.crossOrigin = "anonymous"

        script.onload = () => {
            setScriptStatus('Script loaded. Starting...')
            let attempts = 0
            const interval = setInterval(() => {
                attempts++
                if (window.MINDAR && window.MINDAR.IMAGE) {
                    setCompilerLoaded(true)
                    setScriptStatus('Ready')
                    clearInterval(interval)
                } else if (attempts > 20) {
                    clearInterval(interval)
                    setScriptStatus('Timeout waiting for MindAR object.')
                }
            }, 200)
        }

        script.onerror = (e) => {
            console.error("Script load error:", e)
            loadMindAR(index + 1)
        }

        document.body.appendChild(script)
    }

    useEffect(() => {
        // Delay slightly to ensure hydrated
        const timer = setTimeout(() => loadMindAR(0), 1000)
        return () => clearTimeout(timer)
    }, [])

    const compileImage = async (file: File) => {
        if (!compilerLoaded) return
        setCompiling(true)

        try {
            if (!window.MINDAR || !window.MINDAR.IMAGE) {
                throw new Error("MindAR library not properly initialized. Please refresh the page.");
            }

            const CompilerClass = window.MINDAR.IMAGE.OfflineCompiler || window.MINDAR.IMAGE.Compiler;
            if (!CompilerClass) {
                throw new Error("MindAR Compiler class not found.");
            }

            // 1. Load file into Image object
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = URL.createObjectURL(file);
            });

            // 2. Compile
            const compiler = new CompilerClass();
            console.log("Starting compilation...");

            await compiler.compileImageTargets([img], (progress: number) => {
                console.log("Progress:", progress);
            });

            // 3. Export
            const exportedBuffer = await compiler.exportData();
            const blob = new Blob([exportedBuffer], { type: 'application/octet-stream' });
            const mindFile = new File([blob], 'targets.mind');
            setCompiledFile(mindFile);
            console.log("Compilation finished");

        } catch (err: any) {
            console.error("Compilation failed:", err)
            alert(`Compilation failed: ${err.message || err}`)
            setTargetFile(null)
        } finally {
            setCompiling(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetFile || !contentFile || !compiledFile) {
            alert("Please upload all files and compile the target.")
            return
        }

        setLoading(true)
        try {
            // 1. Upload Target Image
            const targetPath = `targets/${Date.now()}_${targetFile.name}`
            const { data: targetData, error: targetError } = await supabase.storage
                .from('campaign-assets')
                .upload(targetPath, targetFile)
            if (targetError) throw targetError

            // 2. Upload Content
            const contentPath = `content/${Date.now()}_${contentFile.name}`
            const { data: contentData, error: contentError } = await supabase.storage
                .from('campaign-assets')
                .upload(contentPath, contentFile)
            if (contentError) throw contentError

            // 3. Upload Compiled Mind File
            const mindPath = `compiled/${Date.now()}_targets.mind`
            const { data: mindData, error: mindError } = await supabase.storage
                .from('campaign-assets')
                .upload(mindPath, compiledFile)
            if (mindError) throw mindError

            // Get Public URLs
            const getUrl = (path: string) =>
                supabase.storage.from('campaign-assets').getPublicUrl(path).data.publicUrl

            // 4. Create Campaign Record
            const { error: dbError } = await supabase.from('campaigns').insert({
                name,
                target_image_url: getUrl(targetPath),
                content_url: getUrl(contentPath),
                compiled_mind_file_url: getUrl(mindPath),
                content_type: contentType,
                cta_link: ctaLink,
                active: true
            })

            if (dbError) throw dbError

            router.push('/dashboard')
        } catch (err: any) {
            console.error(err)
            alert("Error creating campaign: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">Create New Campaign</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Campaign Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 rounded-md border border-input bg-background"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Image (The Bag Art)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        setTargetFile(file)
                                        setCompiledFile(null)
                                        // Auto-compile
                                        if (compilerLoaded) {
                                            await compileImage(file)
                                        } else {
                                            alert("Compiler not ready yet. Please wait a moment.")
                                        }
                                    }
                                }}
                                className="w-full p-2 border border-dashed rounded-md"
                            />
                        </div>

                        {/* Debug/Status Info */}
                        <div className="text-xs text-muted-foreground mt-2">
                            System Status: <span className={compilerLoaded ? "text-green-500 font-bold" : "text-amber-500"}>{scriptStatus}</span>
                        </div>

                        {(compiling || (targetFile && !compiledFile)) && (
                            <div className="mt-2 text-blue-500 text-sm flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {compiling ? "Processing image... (this takes a few seconds)" : "Preparing compiler..."}
                            </div>
                        )}

                        {compiledFile && (
                            <div className="flex items-center text-green-500 text-sm mt-2">
                                <CheckCircle className="mr-2 h-4 w-4" /> Ready to Create!
                            </div>
                        )}
                        {/* Hidden container for the compiler */}
                        <div id="compiler-container" className="hidden"></div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content Type</label>
                        <select
                            className="w-full p-2 rounded-md border border-input bg-background"
                            value={contentType}
                            onChange={e => setContentType(e.target.value as any)}
                        >
                            <option value="model">3D Model (.glb/.gltf)</option>
                            <option value="video">Video (.mp4)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content File</label>
                        <input
                            type="file"
                            accept={contentType === 'model' ? ".glb,.gltf" : "video/*"}
                            required
                            onChange={e => setContentFile(e.target.files?.[0] || null)}
                            className="w-full p-2 border border-dashed rounded-md"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Call to Action Link (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            className="w-full p-2 rounded-md border border-input bg-background"
                            value={ctaLink}
                            onChange={e => setCtaLink(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !compiledFile}>
                        {loading ? <Loader2 className="animate-spin" /> : "Create Campaign"}
                    </Button>
                </form>
            </div>
        </DashboardLayout>
    )
}
