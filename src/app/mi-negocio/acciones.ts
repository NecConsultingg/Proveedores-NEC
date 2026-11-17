"use server";

import { revalidatePath } from "next/cache";
import { rpc } from "@/lib/panel";
import type { EstadoAccion } from "@/app/panel/acciones";

// Campos que el proveedor puede proponer (la base de datos revisa lo mismo).
const CAMPOS = [
  "municipio", "anios", "mayoreo_minimo", "descripcion", "whatsapp_oficial", "clabe_oficial", "banco",
  "dias_tianguis", "envios", "compromiso_devolucion",
];
const NUMEROS = new Set(["anios", "mayoreo_minimo"]);

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
    if (!fd.has(campo)) continue;
    const nuevo = normalizar(campo, String(fd.get(campo) ?? "").trim());
    const original = normalizar(campo, String(fd.get(`original_${campo}`) ?? "").trim());
    if (JSON.stringify(nuevo) !== JSON.stringify(original)) datos[campo] = nuevo;
  }
  if (Object.keys(datos).length === 0) return { ok: false, mensaje: "No cambiaste ningún dato." };
  if (typeof datos.whatsapp_oficial === "string" && !/^52\d{10}$/.test(datos.whatsapp_oficial))
    return { ok: false, mensaje: "El WhatsApp debe tener 10 dígitos." };
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
