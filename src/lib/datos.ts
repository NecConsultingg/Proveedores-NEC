import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { Categoria, Directorio, Proveedor, Publico, SolicitudAuditoria, Subcategoria } from "./tipos";

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan las variables de Supabase en .env.local (ver .env.example)");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------- Lectura ----------
// El directorio completo se lee en una sola pasada y se guarda en caché unos minutos:
// cambia poco, es chico y así carga rápido en celular. Los filtros se aplican en memoria.

type FilaProveedor = {
  slug: string;
  nombre: string;
  especialidad_id: string;
  estado_republica: string | null;
  vende_presencial: boolean;
  vende_en_linea: boolean;
  otros_medios: string | null;
  maps_url: string | null;
  anios: number;
  mayoreo_minimo: number;
  descripcion: string | null;
  estado_sello: Proveedor["estadoSello"];
  evaluado_en: string | null;
  proxima_revision: string | null;
  whatsapp_oficial: string | null;
  banco: string | null;
  clabe_terminacion: string | null;
  dias_tianguis: string | null;
  envios: string | null;
  compromiso_devolucion: string | null;
  foto_portada_url: string | null;
  demo: boolean;
  proveedor_categorias: { categoria_id: string }[];
  catalogo_items: {
    nombre: string;
    descripcion: string | null;
    precio_mayoreo: string | null;
    foto_url: string | null;
    orden: number;
    categoria_id: string | null;
    publicos: Publico[];
  }[];
  ubicaciones: { tipo: "fabrica" | "puesto"; descripcion_publica: string; lat: number | null; lng: number | null; orden: number }[];
};

const COLUMNAS = [
  "slug,nombre,especialidad_id,estado_republica,vende_presencial,vende_en_linea,otros_medios,maps_url,anios,mayoreo_minimo,descripcion,estado_sello,evaluado_en",
  "proxima_revision,whatsapp_oficial,banco,clabe_terminacion,dias_tianguis,envios,compromiso_devolucion,foto_portada_url,demo",
  "proveedor_categorias(categoria_id)",
  "catalogo_items(nombre,descripcion,precio_mayoreo,foto_url,orden,categoria_id,publicos)",
  "ubicaciones(tipo,descripcion_publica,lat,lng,orden)",
].join(",");

const porOrden = <T extends { orden: number }>(a: T, b: T) => a.orden - b.orden;

function aProveedor(f: FilaProveedor): Proveedor {
  return {
    slug: f.slug,
    nombre: f.nombre,
    especialidadId: f.especialidad_id,
    secundariasIds: f.proveedor_categorias.map((s) => s.categoria_id),
    estado: f.estado_republica,
    vendePresencial: f.vende_presencial,
    vendeEnLinea: f.vende_en_linea,
    otrosMedios: f.otros_medios,
    mapsUrl: f.maps_url,
    anios: f.anios,
    mayoreoMinimo: f.mayoreo_minimo,
    descripcion: f.descripcion ?? "",
    estadoSello: f.estado_sello,
    evaluadoEn: f.evaluado_en,
    proximaRevision: f.proxima_revision,
    whatsappOficial: f.whatsapp_oficial,
    banco: f.banco,
    clabeTerminacion: f.clabe_terminacion,
    diasTianguis: f.dias_tianguis ?? "",
    envios: f.envios ?? "",
    compromisoDevolucion: f.compromiso_devolucion,
    fotoPortadaUrl: f.foto_portada_url,
    demo: f.demo,
    catalogo: [...f.catalogo_items].sort(porOrden).map((c) => ({
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      precioMayoreo: c.precio_mayoreo,
      fotoUrl: c.foto_url,
      categoriaId: c.categoria_id,
      publicos: c.publicos,
    })),
    ubicaciones: [...f.ubicaciones].sort(porOrden).map((u) => ({
      tipo: u.tipo,
      descripcion: u.descripcion_publica,
      lat: u.lat === null ? null : Number(u.lat),
      lng: u.lng === null ? null : Number(u.lng),
    })),
  };
}

export async function obtenerDirectorio(): Promise<Directorio> {
  "use cache";
  cacheLife("minutes");
  cacheTag("directorio"); // el panel NEC lo refresca al aprobar cambios
  const db = supabase();
  const [cats, provs] = await Promise.all([
    db.from("categorias").select("id,parent_id,nivel,slug,nombre,cupo,orden").order("orden"),
    db.from("proveedores").select(COLUMNAS).order("nombre"),
  ]);
  if (cats.error) throw cats.error;
  if (provs.error) throw provs.error;

  const categorias: Categoria[] = cats.data.map((c) => ({
    id: c.id,
    parentId: c.parent_id,
    nivel: c.nivel,
    slug: c.slug,
    nombre: c.nombre,
    cupo: c.cupo,
    orden: c.orden,
  }));
  const proveedores = (provs.data as unknown as FilaProveedor[]).map(aProveedor);
  const porId = new Map(categorias.map((c) => [c.id, c]));

  const subcategorias: Subcategoria[] = categorias
    .filter((c) => c.nivel === 3 && c.parentId && porId.has(c.parentId))
    .map((c) => ({
      ...c,
      grupo: porId.get(c.parentId!)!,
      ocupados: proveedores.filter((p) => p.especialidadId === c.id).length,
    }));

  return { categorias, subcategorias, proveedores };
}

export async function obtenerProveedor(slug: string) {
  const directorio = await obtenerDirectorio();
  const proveedor = directorio.proveedores.find((p) => p.slug === slug) ?? null;
  return { directorio, proveedor };
}

// «Verificar número»: ¿este WhatsApp o CLABE es el contacto oficial de algún proveedor publicado?
export async function verificarContacto(valor: string) {
  const { data, error } = await supabase().rpc("verificar_contacto", { valor });
  if (error) throw error;
  return (data ?? []) as { slug: string; nombre: string; tipo: "whatsapp" | "clabe" }[];
}

// ---------- Escritura ----------

export async function guardarSolicitud(s: SolicitudAuditoria): Promise<void> {
  const { error } = await supabase().from("solicitudes_auditoria").insert({
    nombre_negocio: s.nombreNegocio,
    nombre_responsable: s.nombreResponsable,
    whatsapp: s.whatsapp,
    correo: s.correo || null,
    especialidad_slug: s.especialidadSlug,
    vende_presencial: s.vendePresencial,
    vende_en_linea: s.vendeEnLinea,
    otros_medios: s.otrosMedios || null,
    estado_republica: s.estado,
    anios: s.anios,
    redes: s.redes || null,
    cliente_nec: s.clienteNec,
    comentarios: s.comentarios || null,
    acepta_aviso_privacidad: true,
  });
  if (error) throw error;
}
