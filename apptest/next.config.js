/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // In production, replace with specific origins
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://82.29.168.17:8222/api/v1/:path*',
      },
      {
        source: '/api/activitiesresponses/grade/:activityId',
        destination: 'http://82.29.168.17:8222/api/v1/activitiesresponses/:activityId/grade',
      },
      {
        source: '/api/activitiesresponses/student/:studentId',
        destination: 'http://82.29.168.17:8222/api/v1/activitiesresponses/student/:studentId',
      },
      {
        source: '/api/student-activities/:studentId/:activityId',
        destination: 'http://82.29.168.17:8222/api/v1/activitiesresponses/activity/:activityId/student/:studentId',
      },
      {
        source: '/api/activities/:activityId',
        destination: 'http://82.29.168.17:8222/api/v1/activities/:activityId',
      },
      // Add a catch-all rule for activitiesresponses routes
      {
        source: '/api/activitiesresponses/:path*',
        destination: 'http://82.29.168.17:8222/api/v1/activitiesresponses/:path*',
      }
    ]
  },
  // Permitir conexiones directas al backend
  async redirects() {
    return []
  },
}

module.exports = nextConfig 