import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-primary mb-8">Breakfast Vision</h1>
            </div>

            <div className="flex gap-4">
                <Link href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    Go to Dashboard
                </Link>
                <Link href="/view/demo" className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
                    View Demo AR
                </Link>
            </div>
        </main>
    )
}
