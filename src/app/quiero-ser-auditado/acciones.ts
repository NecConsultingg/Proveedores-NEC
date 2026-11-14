"use server";

import { guardarSolicitud, obtenerDirectorio } from "@/lib/datos";
import type { TipoUbicacion } from "@/lib/tipos";

export type EstadoFormulario = {
  ok: boolean;
  mensaje: string;
  errores: Partial<Record<string, string>>;
  valores: Record<string, string>;
  intento: number;
};

const UBICACIONES: TipoUbicacion[] = ["fabrica", "puesto", "fabrica_y_puesto"];

export async function enviarSolicitud(prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  // Se regresan los valores capturados para no borrar el formulario si hay errores.
  const valores: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$")) valores[k] = v;
  });
  const base = { valores, intento: prev.intento + 1 };
  // Antispam: si el campo oculto viene lleno, fingimos éxito y no guardamos nada.
  if (String(fd.get("sitio_web") ?? "").trim() !== "") {
    return { ...base, ok: true, mensaje: "¡Listo! Recibimos tu solicitud.", errores: {} };
  }
  const texto = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

  const datos = {
    nombreNegocio: texto("nombreNegocio"),
    nombreResponsable: texto("nombreResponsable"),
    whatsapp: texto("whatsapp").replace(/\D/g, ""),
    correo: texto("correo"),
    especialidadSlug: texto("especialidadSlug"),
    tipoUbicacion: texto("tipoUbicacion") as TipoUbicacion,
    municipio: texto("municipio"),
    anios: Number(texto("anios")),
    redes: texto("redes", 500),
    clienteNec: fd.get("clienteNec") === "si",
    comentarios: texto("comentarios", 1000),
  };

  const errores: EstadoFormulario["errores"] = {};
  if (datos.nombreNegocio.length < 2) errores.nombreNegocio = "Escribe el nombre del negocio.";
  if (datos.nombreResponsable.length < 3) errores.nombreResponsable = "Escribe el nombre del dueño o responsable.";
  if (datos.whatsapp.length < 10 || datos.whatsapp.length > 13) errores.whatsapp = "Escribe un WhatsApp de 10 dígitos.";
  if (datos.correo && !/^\S+@\S+\.\S+$/.test(datos.correo)) errores.correo = "Revisa el correo.";
  const { subcategorias } = await obtenerDirectorio();
  if (!subcategorias.some((s) => s.slug === datos.especialidadSlug)) errores.especialidadSlug = "Elige tu especialidad.";
  if (!UBICACIONES.includes(datos.tipoUbicacion)) errores.tipoUbicacion = "Elige dónde vendes.";
  if (datos.municipio.length < 2) errores.municipio = "Escribe el municipio.";
  if (texto("anios") === "" || !Number.isInteger(datos.anios) || datos.anios < 0 || datos.anios > 80) errores.anios = "Escribe los años en números.";
  if (fd.get("aceptaAviso") !== "on") errores.aceptaAviso = "Necesitamos tu autorización para guardar tus datos.";

  if (Object.keys(errores).length > 0) {
    return { ...base, ok: false, mensaje: "Revisa los campos marcados.", errores };
  }

  // Números de 10 dígitos se guardan con lada de México.
  if (datos.whatsapp.length === 10) datos.whatsapp = `52${datos.whatsapp}`;

  try {
    await guardarSolicitud(datos);
  } catch (e) {
    console.error("No se pudo guardar la solicitud", e);
    return { ...base, ok: false, mensaje: "No pudimos guardar tu solicitud. Intenta de nuevo en unos minutos.", errores: {} };
  }
  return {
    ...base,
    ok: true,
    mensaje: "¡Listo! Recibimos tu solicitud. Te escribiremos por WhatsApp para confirmar los siguientes pasos.",
    errores: {},
  };
}
