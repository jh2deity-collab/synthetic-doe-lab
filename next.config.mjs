/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    experimental: {
        turbo: {},
    },
    // Disable static page generation for pages with Plotly
    exportPathMap: async function (defaultPathMap) {
        return {
            ...defaultPathMap,
            '/statistics': { page: '/statistics' },
        };
    },
};

export default nextConfig;
