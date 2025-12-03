const apiHost = process.env.API_HOST || "localhost";

const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/embed-audio/:path*",
        destination: `http://${apiHost}:8000/embed-audio/:path*`,
      },
    ];
  },
};

export default nextConfig;
