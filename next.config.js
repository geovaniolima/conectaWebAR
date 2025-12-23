/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
    images: {
        domains: ['supabase.co', 'pvevmedkmdlbigzhfxmm.supabase.co'],
    },
    webpack: (config) => {
        config.externals.push({
            'utf-8-validate': 'commonjs utf-8-validate',
            'bufferutil': 'commonjs bufferutil',
        })
        return config
    },
}

module.exports = nextConfig
