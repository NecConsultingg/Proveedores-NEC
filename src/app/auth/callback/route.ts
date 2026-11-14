import { NextResponse, type NextRequest } from "next/server";
import { supabaseConSesion } from "@/lib/supabase/servidor";

// Aquí regresa el enlace del correo: cambia el código por una sesión y entra al panel.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const codigo = url.searchParams.get("code");
  const siguiente = url.searchParams.get("next")?.startsWith("/panel") ? url.searchParams.get("next")! : "/panel";

  if (codigo) {
    const supabase = await supabaseConSesion();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(siguiente, url.origin));
  }
  return NextResponse.redirect(new URL("/acceso?error=enlace", url.origin));
}
