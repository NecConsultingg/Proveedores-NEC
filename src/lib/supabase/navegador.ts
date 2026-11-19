"use client";

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { COOKIE_RECORDAR, DIAS_RECORDAR, opcionesCookie, quiereRecordar } from "./cookies";

const leer = () => parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? "" }));

// Guarda la elección de «Recordarme» antes de iniciar sesión (dura lo mismo que la sesión recordada).
export function guardarRecordar(recordar: boolean) {
  document.cookie = serializeCookieHeader(COOKIE_RECORDAR, recordar ? "1" : "0", {
    path: "/", sameSite: "lax", secure: location.protocol === "https:", maxAge: DIAS_RECORDAR * 24 * 60 * 60,
  });
}

// Cliente de Supabase en el navegador: la sesión dura 30 días con «Recordarme» o hasta cerrar el navegador sin él.
export function supabaseNavegador() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: leer,
      setAll: (porGuardar) => {
        const recordar = quiereRecordar(leer().find((c) => c.name === COOKIE_RECORDAR)?.value);
        porGuardar.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, opcionesCookie(options, recordar));
        });
      },
    },
  });
}
