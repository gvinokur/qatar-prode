/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/predictions',
        destination: '/predictions/groups/group-a',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
