// @ts-check
import withSerwistInit from "@serwist/next";

// You may want to use a more robust revision to cache
// files more efficiently.
// A viable option is `git rev-parse HEAD`.
const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
    cacheOnNavigation: true,
    swSrc: "app/service-worker.ts",
    swDest: "public/sw.js",
    additionalPrecacheEntries: [{ url: "/offline", revision }],
});

/** @type {import("next").NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        // Temporarily ignore ESLint during builds due to pre-existing warnings
        ignoreDuringBuilds: true,
    },
    experimental: {
        viewTransition: true,
        serverActions: {
            bodySizeLimit: '5mb'
        }
    }
};

export default withSerwist(nextConfig);
