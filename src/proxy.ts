import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en las rutas privadas y manda a /acceso a quien no la tenga.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (porGuardar, encabezados) => {
          porGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          porGuardar.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
          Object.entries(encabezados ?? {}).forEach(([k, v]) => respuesta.headers.set(k, v));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && (request.nextUrl.pathname.startsWith("/panel") || request.nextUrl.pathname.startsWith("/mi-negocio"))) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/acceso";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  respuesta.headers.set("X-Robots-Tag", "noindex, nofollow");
  return respuesta;
}

export const config = {
  matcher: ["/panel/:path*", "/mi-negocio/:path*", "/acceso", "/acceso/:path*", "/auth/:path*"],
};
