import dotenv from "dotenv";
import path from "path";

// Load environment variables from the .env file in the root directory
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const nextConfig = {
  env: {
    MONGODB_URI: process.env.MONGODB_URI, // Ensure environment variables are accessible
  },
  rewrites: async () => {
    return [
      {
        source: "/embed-audio/:path*",
        destination:
          process.env.NEXT_PUBLIC_ENV === "local-compose"
            ? "http://api:8000/embed-audio/:path*"
            : "http://localhost:8000/embed-audio/:path*",
      },
    ];
  },
};

export default nextConfig;
