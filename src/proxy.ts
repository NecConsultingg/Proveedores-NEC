import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { antesDelLanzamiento } from "@/lib/config";
import { COOKIE_RECORDAR, opcionesCookie, quiereRecordar } from "@/lib/supabase/cookies";

// Páginas del directorio que, antes de la apertura, solo ve quien inició sesión (proveedores y equipo NEC).
const conConteo = (ruta: string) => ruta === "/" || ruta === "/verificar" || ruta.startsWith("/proveedores/");
const privada = (ruta: string) => ruta.startsWith("/panel") || ruta.startsWith("/mi-negocio");

// Refresca la sesión de Supabase, manda a /acceso a quien no la tenga en las rutas privadas
// y muestra la cuenta regresiva a los visitantes antes de la apertura del directorio.
export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  if (ruta === "/proximamente") {
    return antesDelLanzamiento() ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url));
  }
  // Ya abierto el directorio, las páginas públicas no necesitan revisar la sesión.
  if (conConteo(ruta) && !antesDelLanzamiento()) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const recordar = quiereRecordar(request.cookies.get(COOKIE_RECORDAR)?.value);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (porGuardar, encabezados) => {
          porGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          porGuardar.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, opcionesCookie(options, recordar)));
          Object.entries(encabezados ?? {}).forEach(([k, v]) => respuesta.headers.set(k, v));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  if (conConteo(ruta)) {
    if (data?.claims) {
      // proveedores y equipo NEC ya ven el directorio; que el navegador no lo guarde para quien entre después
      respuesta.headers.set("Cache-Control", "private, no-store");
      return respuesta;
    }
    const conteo = request.nextUrl.clone();
    conteo.pathname = "/proximamente";
    conteo.search = "";
    const r = NextResponse.rewrite(conteo);
    r.headers.set("Cache-Control", "private, no-store");
    return r;
  }

  if (!data?.claims && privada(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/acceso";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  respuesta.headers.set("X-Robots-Tag", "noindex, nofollow");
  // Páginas con sesión: nunca en la caché del navegador (botón «atrás» después de cerrar sesión).
  respuesta.headers.set("Cache-Control", "private, no-store");
  return respuesta;
}

export const config = {
  matcher: ["/", "/proximamente", "/verificar", "/proveedores/:path*", "/panel/:path*", "/mi-negocio/:path*", "/acceso", "/acceso/:path*", "/auth/:path*"],
};
