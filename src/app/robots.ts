import type { MetadataRoute } from "next";
import { PERMITIR_INDEXACION, SITIO } from "@/lib/config";

// Mientras la indexación esté apagada, se pide a los buscadores no rastrear nada.
export default function robots(): MetadataRoute.Robots {
  if (!PERMITIR_INDEXACION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
