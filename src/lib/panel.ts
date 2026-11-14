import "server-only";
import { redirect } from "next/navigation";
import { supabaseConSesion } from "./supabase/servidor";

export type Nivel = "staff" | "admin_medio" | "superadmin";
export interface Miembro {
  id: string;
  nombre: string;
  correo: string;
  nivel: Nivel;
}

export const NOMBRE_NIVEL: Record<Nivel, string> = {
  staff: "Staff",
  admin_medio: "Administrador medio",
  superadmin: "Superadministrador",
};

export const rango = (n: Nivel) => ({ staff: 1, admin_medio: 2, superadmin: 3 })[n];

// Llama a una función panel_* de Supabase con la sesión del usuario. Los permisos los revisa la base de datos.
export async function rpc<T>(nombre: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await supabaseConSesion();
  const { data, error } = await supabase.rpc(nombre, args);
  if (error) throw new Error(error.message);
  return data as T;
}

// Devuelve al miembro del equipo con sesión activa, o lo manda a /acceso.
export async function obtenerMiembro(): Promise<Miembro> {
  const miembro = await rpc<Miembro | null>("panel_yo").catch(() => null);
  if (!miembro) redirect("/acceso?error=sin-acceso");
  return miembro;
}

export async function exigir(minimo: Nivel): Promise<Miembro> {
  const m = await obtenerMiembro();
  if (rango(m.nivel) < rango(minimo)) redirect("/panel");
  return m;
}

// Etiquetas legibles de los campos que se pueden proponer.
export const CAMPOS: Record<string, string> = {
  nombre: "Nombre del negocio",
  especialidad_id: "Especialidad",
  municipio: "Municipio",
  tipo_ubicacion: "Dónde vende",
  anios: "Años en el negocio",
  mayoreo_minimo: "Mayoreo desde (piezas)",
  descripcion: "Descripción",
  whatsapp_oficial: "WhatsApp oficial",
  clabe_oficial: "CLABE oficial",
  banco: "Banco",
  dias_tianguis: "Días de tianguis",
  envios: "Envíos",
  compromiso_devolucion: "Compromiso de devolución",
  foto_portada_url: "Foto de portada (URL)",
  publicado: "Publicado en el directorio",
  consentimiento_publicacion_en: "Fecha de autorización firmada",
  notas_internas: "Notas internas",
  estado_sello: "Sello",
  evaluado_en: "Evaluado el",
  proxima_revision: "Próxima revisión",
};

export const TIPO_CAMBIO: Record<string, string> = {
  alta: "Alta de proveedor",
  edicion: "Edición",
  baja: "Baja (retiro del sello)",
  sello: "Sello",
};

export const ESTADO_CAMBIO: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  aplicado_directo: "Edición directa",
};

export const fecha = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" })
    : "—";

export function valorLegible(campo: string, v: unknown, especialidades?: { id: string; nombre: string }[]) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (campo === "especialidad_id") return especialidades?.find((e) => e.id === v)?.nombre ?? String(v);
  if (campo === "clabe_oficial") return `•••• ${String(v).slice(-4)}`;
  if (campo === "tipo_ubicacion")
    return ({ fabrica: "Fábrica", puesto: "Puesto en tianguis", fabrica_y_puesto: "Fábrica y puesto" } as Record<string, string>)[String(v)] ?? String(v);
  return String(v);
}
