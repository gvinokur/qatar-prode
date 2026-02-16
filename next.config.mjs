// @ts-check
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from 'next-intl/plugin';

// You may want to use a more robust revision to cache
// files more efficiently.
// A viable option is `git rev-parse HEAD`.
const revision = crypto.randomUUID();

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
    cacheOnNavigation: true,
    swSrc: "app/service-worker.ts",
    swDest: "public/sw.js",
    additionalPrecacheEntries: [{ url: "/offline", revision }],
});

/** @type {import("next").NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        viewTransition: true,
        serverActions: {
            bodySizeLimit: '5mb'
        }
    }
};

export default withNextIntl(withSerwist(nextConfig));
