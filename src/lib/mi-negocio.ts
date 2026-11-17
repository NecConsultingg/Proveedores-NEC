import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { rpc } from "./panel";

export interface MiNegocio {
  correo: string;
  debe_cambiar: boolean;
  id: string;
  slug: string;
  nombre: string;
  especialidad: string | null;
  tipo_ubicacion: string;
  municipio: string | null;
  anios: number | null;
  mayoreo_minimo: number | null;
  descripcion: string | null;
  whatsapp_oficial: string | null;
  clabe_oficial: string | null;
  banco: string | null;
  dias_tianguis: string | null;
  envios: string | null;
  compromiso_devolucion: string | null;
  publicado: boolean;
  estado_sello: "aliado" | "vigente" | "suspendido" | "retirado";
  evaluado_en: string | null;
  proxima_revision: string | null;
  cambios: {
    id: string;
    estado: string;
    datos: Record<string, unknown>;
    motivo: string;
    propuesto_en: string;
    revisado_en: string | null;
    comentario_revision: string | null;
  }[];
}

// Devuelve el negocio de la cuenta de proveedor con sesión, o lo manda a /acceso.
export async function obtenerNegocio(): Promise<MiNegocio> {
  await connection(); // depende de la sesión: siempre en el momento, nunca prerenderizado
  const n = await rpc<MiNegocio | null>("proveedor_mi_negocio").catch(() => null);
  if (!n) redirect("/acceso?error=sin-acceso");
  return n;
}

export const NOMBRE_SELLO: Record<MiNegocio["estado_sello"], string> = {
  aliado: "Proveedor aliado (aún sin evaluación oficial)",
  vigente: "Verificado por NEC",
  suspendido: "Sello suspendido",
  retirado: "Sello retirado",
};
