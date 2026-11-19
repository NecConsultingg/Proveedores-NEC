import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COOKIE_RECORDAR, opcionesCookie, quiereRecordar } from "./cookies";

// Cliente de Supabase con la sesión del usuario (cookies). Se crea uno nuevo en cada petición.
export async function supabaseConSesion() {
  const almacen = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (porGuardar) => {
        try {
          porGuardar.forEach(({ name, value, options }) => almacen.set(name, value, opcionesCookie(options, quiereRecordar(almacen.get(COOKIE_RECORDAR)?.value))));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}
