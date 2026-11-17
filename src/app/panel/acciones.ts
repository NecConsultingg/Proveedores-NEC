"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { leerWhatsapps } from "@/lib/formulario-whatsapp";
import { rpc } from "@/lib/panel";

export type EstadoAccion = { ok: boolean; mensaje: string };

const fallo = (e: unknown): EstadoAccion => ({ ok: false, mensaje: e instanceof Error ? e.message : "Algo salió mal" });

function refrescar() {
  updateTag("directorio"); // el directorio público toma los cambios aprobados de inmediato
  revalidatePath("/panel", "layout");
}

const NUMEROS = new Set(["anios", "mayoreo_minimo"]);
const BOOLEANOS = new Set(["publicado", "vende_presencial", "vende_en_linea"]);
const CAMPOS_FORMULARIO = [
  "nombre", "especialidad_id", "municipio", "tipo_ubicacion", "anios", "mayoreo_minimo", "descripcion",
  "whatsapp_oficial", "clabe_oficial", "banco", "dias_tianguis", "envios", "compromiso_devolucion",
  "foto_portada_url", "publicado", "consentimiento_publicacion_en", "notas_internas",
  "vende_presencial", "vende_en_linea", "otros_medios", "estado_republica", "maps_url",
];

function leerCampo(fd: FormData, campo: string): unknown {
  if (BOOLEANOS.has(campo)) return fd.get(campo) === "on";
  const crudo = String(fd.get(campo) ?? "").trim();
  if (crudo === "") return null;
  if (NUMEROS.has(campo)) return Number(crudo);
  if (campo === "whatsapp_oficial") {
    const d = crudo.replace(/\D/g, "");
    return d.length === 10 ? `52${d}` : d;
  }
  if (campo === "clabe_oficial") return crudo.replace(/\D/g, "");
  return crudo;
}

// Alta o edición. En edición solo se mandan los campos que cambiaron (el formulario trae los valores originales).
export async function proponerCambio(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  const tipo = String(fd.get("tipo"));
  const proveedor = String(fd.get("proveedor_id") ?? "") || null;
  const motivo = String(fd.get("motivo") ?? "").trim();
  const directo = fd.get("directo") === "on";
  const datos: Record<string, unknown> = {};
  for (const campo of CAMPOS_FORMULARIO) {
    if (!fd.has(campo) && !BOOLEANOS.has(campo)) continue;
    if (BOOLEANOS.has(campo) && !fd.has(`original_${campo}`) && tipo === "edicion") continue;
    const nuevo = leerCampo(fd, campo);
    if (tipo === "edicion") {
      const original = fd.get(`original_${campo}`);
      const origVal = BOOLEANOS.has(campo) ? original === "true" : original === null || original === "" ? null : NUMEROS.has(campo) ? Number(original) : String(original);
      if (JSON.stringify(nuevo) === JSON.stringify(origVal)) continue;
    } else if (nuevo === null || nuevo === false) {
      continue;
    }
    datos[campo] = nuevo;
  }
  if (fd.has("whatsapps") || fd.has("original_whatsapps")) {
    const { numeros, error } = leerWhatsapps(fd);
    if (error) return { ok: false, mensaje: error };
    if (numeros.join(",") !== String(fd.get("original_whatsapps") ?? "")) datos.whatsapps = numeros.length ? numeros : null;
  }
  if (motivo.length < 3) return { ok: false, mensaje: "Escribe el motivo del cambio." };
  let destino: string | null = null;
  try {
    const r = await rpc<{ estado: string; proveedor_id: string | null }>("panel_proponer", {
      tipo, proveedor, datos, motivo, directo,
    });
    refrescar();
    if (tipo === "alta" && r.proveedor_id) destino = `/panel/proveedores/${r.proveedor_id}`;
    if (!destino) {
      return {
        ok: true,
        mensaje: r.estado === "aplicado_directo" ? "Cambio aplicado y anotado en la bitácora." : "Propuesta enviada. Queda pendiente de aprobación.",
      };
    }
  } catch (e) {
    return fallo(e);
  }
  redirect(destino);
}

export async function proponerSello(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_proponer", {
      tipo: "sello",
      proveedor: String(fd.get("proveedor_id")),
      datos: {
        estado_sello: String(fd.get("estado_sello")),
        evaluado_en: String(fd.get("evaluado_en") ?? "") || null,
        proxima_revision: String(fd.get("proxima_revision") ?? "") || null,
      },
      motivo: String(fd.get("motivo") ?? "").trim(),
      directo: false,
    });
    refrescar();
    return { ok: true, mensaje: "Sello en borrador. Lo autoriza un superadministrador." };
  } catch (e) {
    return fallo(e);
  }
}

export async function proponerBaja(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_proponer", {
      tipo: "baja", proveedor: String(fd.get("proveedor_id")), datos: {}, motivo: String(fd.get("motivo") ?? "").trim(), directo: false,
    });
    refrescar();
    return { ok: true, mensaje: "Baja propuesta. La aprueba un superadministrador." };
  } catch (e) {
    return fallo(e);
  }
}

export async function resolverCambio(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  const aprobar = fd.get("decision") === "aprobar";
  try {
    await rpc("panel_resolver", {
      cambio: String(fd.get("cambio_id")), aprobar, comentario: String(fd.get("comentario") ?? "").trim() || null,
    });
    refrescar();
    return { ok: true, mensaje: aprobar ? "Aprobado y aplicado." : "Rechazado." };
  } catch (e) {
    return fallo(e);
  }
}

export async function cambiarEstadoSolicitud(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_estado_solicitud", { solicitud: String(fd.get("solicitud_id")), nuevo: String(fd.get("estado")) });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Estado actualizado." };
  } catch (e) {
    return fallo(e);
  }
}

export async function altaMiembro(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_alta_miembro", {
      correo: String(fd.get("correo") ?? ""), nombre: String(fd.get("nombre") ?? ""), nivel: String(fd.get("nivel")),
    });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Miembro agregado. Para entrar la primera vez, que abra proveedoresnec.com/acceso/recuperar y cree su contraseña." };
  } catch (e) {
    return fallo(e);
  }
}

export async function activarMiembro(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_activar_miembro", { miembro: String(fd.get("miembro_id")), p_activo: fd.get("activo") === "true" });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Listo." };
  } catch (e) {
    return fallo(e);
  }
}

// ---------- Cuentas de proveedor ----------

export type EstadoCuenta = EstadoAccion & { correo?: string; contrasena?: string; proveedorId?: string; negocio?: string };

export async function crearCuentaProveedor(_prev: EstadoCuenta, fd: FormData): Promise<EstadoCuenta> {
  try {
    const r = await rpc<{ correo: string; contrasena: string }>("panel_crear_cuenta_proveedor", {
      proveedor: String(fd.get("proveedor_id")), correo: String(fd.get("correo") ?? ""),
    });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Cuenta creada.", ...r };
  } catch (e) {
    return fallo(e);
  }
}

export async function restablecerCuentaProveedor(_prev: EstadoCuenta, fd: FormData): Promise<EstadoCuenta> {
  try {
    const r = await rpc<{ correo: string; contrasena: string }>("panel_restablecer_cuenta_proveedor", {
      proveedor: String(fd.get("proveedor_id")),
    });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Contraseña temporal nueva generada. La anterior ya no sirve.", ...r };
  } catch (e) {
    return fallo(e);
  }
}

export async function activarCuentaProveedor(_prev: EstadoAccion, fd: FormData): Promise<EstadoAccion> {
  try {
    await rpc("panel_activar_cuenta_proveedor", {
      proveedor: String(fd.get("proveedor_id")), p_activa: fd.get("activa") === "true",
    });
    revalidatePath("/panel", "layout");
    return { ok: true, mensaje: "Listo." };
  } catch (e) {
    return fallo(e);
  }
}

// Alta con cuenta en un paso: solo correo, nombre y especialidad. El proveedor llena lo demás al entrar.
export async function altaConCuenta(_prev: EstadoCuenta, fd: FormData): Promise<EstadoCuenta> {
  try {
    const r = await rpc<{ correo: string; contrasena: string; proveedor_id: string }>("panel_alta_con_cuenta", {
      nombre: String(fd.get("nombre") ?? ""),
      especialidad: String(fd.get("especialidad_id") ?? ""),
      correo: String(fd.get("correo") ?? ""),
    });
    revalidatePath("/panel", "layout");
    return {
      ok: true, mensaje: "Proveedor y cuenta creados.", correo: r.correo, contrasena: r.contrasena,
      proveedorId: r.proveedor_id, negocio: String(fd.get("nombre") ?? "").trim(),
    };
  } catch (e) {
    return fallo(e);
  }
}
