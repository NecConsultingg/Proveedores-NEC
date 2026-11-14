import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Directorio de proveedores NEC",
    short_name: "Directorio NEC",
    description: "Proveedores de ropa al mayoreo de Texmelucan con los que NEC ya trabaja.",
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    background_color: "#020528",
    theme_color: "#020528",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
