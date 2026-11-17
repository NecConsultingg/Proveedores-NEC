"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { rpc } from "@/lib/panel";
import type { EstadoAccion } from "@/app/panel/acciones";
import { leerWhatsapps } from "@/lib/formulario-whatsapp";

// Campos que el proveedor puede proponer (la base de datos revisa lo mismo).
const CAMPOS = [
  "estado_republica", "vende_presencial", "vende_en_linea", "otros_medios", "maps_url", "anios", "mayoreo_minimo", "descripcion", "clabe_oficial", "banco",
  "dias_tianguis", "envios", "compromiso_devolucion",
];
const NUMEROS = new Set(["anios", "mayoreo_minimo"]);
const BOOLEANOS = new Set(["vende_presencial", "vende_en_linea"]);

function normalizar(campo: string, crudo: string): unknown {
  if (crudo === "") return null;
  if (NUMEROS.has(campo)) return Number(crudo);
  if (campo === "whatsapp_oficial") {
    const d = crudo.replace(/\D/g, "");
    return d.length === 10 ? `52${d}` : d;
  }
  if (campo === "clabe_oficial") return crudo.replace(/\D/g, "");
  return crudo;
}

// Solo se manda lo que cambió respecto a lo que hoy está guardado (el formulario trae los originales).
export async function proponerDesdeProveedor(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  const datos: Record<string, unknown> = {};
  for (const campo of CAMPOS) {
    if (BOOLEANOS.has(campo)) {
      // Casilla: si no viene marcada no llega en el formulario; se compara con el valor guardado.
      if (!fd.has(`original_${campo}`)) continue;
      const marcado = fd.get(campo) === "on";
      if (marcado !== (fd.get(`original_${campo}`) === "true")) datos[campo] = marcado;
      continue;
    }
    if (!fd.has(campo)) continue;
    const nuevo = normalizar(campo, String(fd.get(campo) ?? "").trim());
    const original = normalizar(campo, String(fd.get(`original_${campo}`) ?? "").trim());
    if (JSON.stringify(nuevo) !== JSON.stringify(original)) datos[campo] = nuevo;
  }
  if (fd.has("original_whatsapps")) {
    const { numeros, error } = leerWhatsapps(fd);
    if (error) return { ok: false, mensaje: error };
    if (numeros.length === 0) return { ok: false, mensaje: "Deja al menos un número de WhatsApp." };
    if (numeros.join(",") !== String(fd.get("original_whatsapps") ?? "")) datos.whatsapps = numeros;
  }
  if (Object.keys(datos).length === 0) return { ok: false, mensaje: "No cambiaste ningún dato." };
  if (typeof datos.clabe_oficial === "string" && !/^\d{18}$/.test(datos.clabe_oficial))
    return { ok: false, mensaje: "La CLABE debe tener 18 dígitos." };
  try {
    await rpc("proveedor_proponer", { datos, motivo: String(fd.get("motivo") ?? "").trim() });
    revalidatePath("/mi-negocio");
    return { ok: true, mensaje: "Enviado. El equipo NEC lo revisa y te avisamos cuando se publique." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "No pudimos enviarlo. Intenta de nuevo." };
  }
}

// Registro del primer ingreso: el proveedor llena los datos de su negocio y autoriza publicarlos.
export async function registrarNegocio(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  const texto = (k: string) => String(fd.get(k) ?? "").trim();
  const { numeros, error } = leerWhatsapps(fd);
  if (error) return { ok: false, mensaje: error };
  if (numeros.length === 0) return { ok: false, mensaje: "Escribe al menos un número de WhatsApp." };
  const anios = Number(texto("anios"));
  const mayoreo = Number(texto("mayoreo_minimo"));
  if (!texto("estado_republica")) return { ok: false, mensaje: "Elige tu estado." };
  if (fd.get("vende_presencial") !== "on" && fd.get("vende_en_linea") !== "on" && !texto("otros_medios"))
    return { ok: false, mensaje: "Marca cómo vendes: presencial, en línea u otros medios." };
  if (texto("anios") === "" || !Number.isInteger(anios) || anios < 0 || anios > 80)
    return { ok: false, mensaje: "Escribe los años en el negocio en números." };
  if (texto("mayoreo_minimo") === "" || !Number.isInteger(mayoreo) || mayoreo < 1)
    return { ok: false, mensaje: "Escribe desde cuántas piezas vendes al mayoreo." };
  if (fd.get("acepta") !== "on") return { ok: false, mensaje: "Marca la casilla de autorización para enviar tu registro." };

  const datos: Record<string, unknown> = {
    whatsapps: numeros,
    estado_republica: texto("estado_republica"),
    vende_presencial: fd.get("vende_presencial") === "on",
    vende_en_linea: fd.get("vende_en_linea") === "on",
    otros_medios: texto("otros_medios") || null,
    anios,
    mayoreo_minimo: mayoreo,
    dias_tianguis: texto("dias_tianguis") || null,
    descripcion: texto("descripcion") || null,
    maps_url: texto("maps_url") || null,
  };
  try {
    await rpc("proveedor_registrar", { datos, acepta: true });
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "No pudimos enviar tu registro. Intenta de nuevo." };
  }
  revalidatePath("/mi-negocio", "layout");
  redirect("/mi-negocio?registro=1");
}

// ---------- Catálogo ----------

export type Modelo = {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: string;
  fotoUrl: string;
  publicos: string[];
};

export async function guardarModelo(m: Modelo): Promise<EstadoAccion> {
  try {
    await rpc("proveedor_catalogo_guardar", {
      item: m.id ?? null,
      p_nombre: m.nombre,
      p_descripcion: m.descripcion,
      p_precio: m.precio,
      p_foto_url: m.fotoUrl,
      p_publicos: m.publicos,
    });
    revalidatePath("/mi-negocio/catalogo");
    updateTag("directorio"); // el perfil público se actualiza al momento
    return { ok: true, mensaje: "Listo, ya se ve en tu perfil del directorio." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "No pudimos guardar el modelo." };
  }
}

export async function borrarModelo(id: string): Promise<EstadoAccion & { fotoUrl?: string }> {
  try {
    const r = await rpc<{ foto_url: string | null }>("proveedor_catalogo_borrar", { item: id });
    revalidatePath("/mi-negocio/catalogo");
    updateTag("directorio");
    return { ok: true, mensaje: "Modelo borrado.", fotoUrl: r.foto_url ?? undefined };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "No pudimos borrar el modelo." };
  }
}
