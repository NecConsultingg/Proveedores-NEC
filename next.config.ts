import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fotos de catálogo guardadas en Supabase Storage
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // Las direcciones *.vercel.app nunca se indexan: el sitio oficial es proveedoresnec.com.
  async headers() {
    return [
      {
        source: "/:ruta*",
        has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
