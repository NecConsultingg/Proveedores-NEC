"use server";

import { FUNCIONES } from "@/lib/config";
import { verificarContacto } from "@/lib/datos";

export type EstadoVerificacion =
  | { tipo: "inicial" }
  | { tipo: "error"; mensaje: string; valor: string }
  | { tipo: "oficial"; valor: string; coincidencias: { slug: string; nombre: string; tipo: "whatsapp" | "clabe" }[] }
  | { tipo: "no_encontrado"; valor: string };

export async function verificar(_prev: EstadoVerificacion, fd: FormData): Promise<EstadoVerificacion> {
  const valor = String(fd.get("valor") ?? "").trim().slice(0, 40);
  const digitos = valor.replace(/\D/g, "");
  if (![10, 12, 13, ...(FUNCIONES.clabe ? [18] : [])].includes(digitos.length)) {
    return {
      tipo: "error",
      valor,
      mensaje: FUNCIONES.clabe ? "Escribe un WhatsApp de 10 dígitos o una CLABE de 18 dígitos." : "Escribe un WhatsApp de 10 dígitos.",
    };
  }
  try {
    const coincidencias = await verificarContacto(digitos);
    return coincidencias.length ? { tipo: "oficial", valor, coincidencias } : { tipo: "no_encontrado", valor };
  } catch (e) {
    console.error("No se pudo verificar", e);
    return { tipo: "error", valor, mensaje: "No pudimos verificar en este momento. Intenta de nuevo en unos minutos." };
  }
}
