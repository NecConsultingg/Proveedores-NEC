import type { MetadataRoute } from "next";
import { PERMITIR_INDEXACION, SITIO } from "@/lib/config";
import { obtenerDirectorio } from "@/lib/datos";

// Lista de páginas para buscadores. Nunca incluye proveedores de demostración.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!PERMITIR_INDEXACION) return [];
  const { proveedores } = await obtenerDirectorio();
  const fijas = ["", "/como-verificamos", "/verificar", "/quiero-ser-auditado", "/aviso-de-privacidad", "/terminos"];
  return [
    ...fijas.map((ruta) => ({ url: `${SITIO}${ruta}`, changeFrequency: "weekly" as const, priority: ruta === "" ? 1 : 0.6 })),
    ...proveedores
      .filter((p) => !p.demo)
      .map((p) => ({ url: `${SITIO}/proveedores/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
