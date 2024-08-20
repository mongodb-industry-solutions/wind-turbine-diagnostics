/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
      return [
        {
          source: '/embed-audio/:path*',
          destination: process.env.NEXT_PUBLIC_ENV == 'local-compose' ?
            'http://api:8000/embed-audio/:path*'
            :  'http://localhost:8000/embed-audio/:path*'
        }
      ]
    }
  };
  
  export default nextConfig;