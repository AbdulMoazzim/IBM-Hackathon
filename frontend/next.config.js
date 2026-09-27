/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for development
    reactStrictMode: true,

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: '**.example.com',
            },
        ],
    },

    // Environment variables
    env: {
        APP_NAME: 'VibeGuard',
        APP_VERSION: '1.0.0',
    },

    // Headers configuration
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // Security headers
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    // Force HTTPS
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    // CSP Header
                    {
                        key: 'Content-Security-Policy',
                        value: process.env.NODE_ENV === 'development'
                            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
                            : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
                    },
                ],
            },
        ];
    },

    // Rewrites
    async rewrites() {
        return {
            beforeFiles: [
                // Proxy to VibeGuard FastAPI backend
                {
                    source: '/vibeguard/:path*',
                    destination: `${process.env.NEXT_PUBLIC_VIBEGUARD_URL || 'http://localhost:8000'}/:path*`,
                },
                // API proxy to Next.js BFF (existing mock routes)
                {
                    source: '/api/:path*',
                    destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/:path*`,
                },
            ],
        };
    },

    // Webpack configuration
    // (Removed manual splitChunks as it conflicts with Next.js App Router internal chunking)

    // Experimental features
    experimental: {
        // Enable optimized package imports
        optimizePackageImports: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            'date-fns',
        ],
    },

    // Logging configuration
    logging: {
        fetches: {
            fullUrl: true,
        },
    },

    // Performance optimizations
    compress: true,
    swcMinify: true,

    // TypeScript configuration
    typescript: {
        tsconfigPath: './tsconfig.json',
        // Treat TypeScript warnings as errors in production
        // tsconfigPath: './tsconfig.json',
    },

    // ESLint configuration
    eslint: {
        dirs: ['app', 'components', 'lib', 'hooks'],
    },
};

module.exports = nextConfig;
