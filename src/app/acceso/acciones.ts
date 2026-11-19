"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseConSesion } from "@/lib/supabase/servidor";

export type EstadoAcceso = { enviado: boolean; mensaje: string };

const RESPUESTA_NEUTRA =
  "Si tu correo pertenece al equipo NEC, en unos minutos te llega un enlace para crear tu contraseña. Revisa también la carpeta de spam.";

export async function enviarEnlace(_prev: EstadoAcceso, fd: FormData): Promise<EstadoAcceso> {
  const correo = String(fd.get("correo") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(correo)) return { enviado: false, mensaje: "Escribe un correo válido." };

  // Solo se envía el enlace a correos del equipo activo. La respuesta es la misma en ambos casos
  // para no revelar quién pertenece al equipo.
  const publico = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data: esEquipo, error } = await publico.rpc("es_correo_equipo", { correo });
  if (error) {
    console.error("No se pudo revisar el correo", error);
    return { enviado: false, mensaje: "No pudimos enviar el enlace. Intenta en unos minutos." };
  }

  if (esEquipo) {
    const h = await headers();
    const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    // Flujo «implícito»: el enlace trae la sesión y funciona aunque se abra en otro dispositivo o navegador
    // (por ejemplo, Gmail en el celular). La página /auth/confirmar la guarda.
    const enlace = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
    });
    const { error: errorEnvio } = await enlace.auth.signInWithOtp({
      email: correo,
      options: { emailRedirectTo: `${origen}/auth/confirmar`, shouldCreateUser: true },
    });
    if (errorEnvio) {
      console.error("No se pudo enviar el enlace", errorEnvio);
      const limite = /rate limit|seconds/i.test(errorEnvio.message);
      return {
        enviado: false,
        mensaje: limite
          ? "Se pidieron demasiados enlaces. Espera unos minutos y vuelve a intentar."
          : "No pudimos enviar el enlace. Intenta en unos minutos.",
      };
    }
  }
  return { enviado: true, mensaje: RESPUESTA_NEUTRA };
}

export async function salir() {
  const supabase = await supabaseConSesion();
  await supabase.auth.signOut();
  // Vacía la caché del navegador (router de Next) para que no queden a la vista páginas de la sesión anterior.
  revalidatePath("/", "layout");
  redirect("/acceso");
}
