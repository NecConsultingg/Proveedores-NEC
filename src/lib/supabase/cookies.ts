import type { CookieOptions } from "@supabase/ssr";

// «Recordarme»: preferencia que se guarda al iniciar sesión (no es dato de la sesión).
export const COOKIE_RECORDAR = "nec_recordarme";
export const DIAS_RECORDAR = 30;

// Supabase guarda sus cookies por 400 días. Con «Recordarme» la sesión dura 30 días;
// sin él, la cookie es de sesión y se borra al cerrar el navegador. Las que se borran (maxAge 0) se dejan igual.
export function opcionesCookie(opciones: CookieOptions = {}, recordar: boolean): CookieOptions {
  if (opciones.maxAge === 0) return opciones;
  const { maxAge: _maxAge, expires: _expires, ...resto } = opciones;
  return recordar ? { ...resto, maxAge: DIAS_RECORDAR * 24 * 60 * 60 } : resto;
}

export const quiereRecordar = (valor: string | undefined) => valor === "1";
