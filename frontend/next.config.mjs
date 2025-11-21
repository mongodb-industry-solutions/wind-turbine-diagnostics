import dotenv from "dotenv";
import path from "path";

// Load environment variables from the .env file in the root directory
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const apiHost = process.env.API_HOST || "localhost";

const nextConfig = {
  env: {
    MONGODB_URI: process.env.MONGODB_URI, // Ensure environment variables are accessible
  },
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
