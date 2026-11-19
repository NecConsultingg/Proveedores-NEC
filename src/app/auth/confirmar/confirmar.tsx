"use client";

import { supabaseNavegador } from "@/lib/supabase/navegador";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// El enlace del correo llega aquí con la sesión en la parte «#» de la dirección (no viaja al servidor).
// La guardamos en cookies y entramos al panel.
export function Confirmar() {
  const [error, setError] = useState<string | null>(null);
  const yaCorrio = useRef(false);

  useEffect(() => {
    // Una sola vez: el enlace sirve una vez y aquí también se borra de la barra de direcciones.
    if (yaCorrio.current) return;
    yaCorrio.current = true;
    const datos = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = datos.get("access_token");
    const refreshToken = datos.get("refresh_token");
    const errorEnlace = datos.get("error_description");
    // Borra los datos de la barra de direcciones.
    window.history.replaceState(null, "", window.location.pathname);

    if (errorEnlace || !accessToken || !refreshToken) {
      setError(
        errorEnlace?.includes("expired") || errorEnlace?.includes("invalid")
          ? "El enlace ya se usó o venció."
          : "El enlace no es válido.",
      );
      return;
    }
    const supabase = supabaseNavegador();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: e }) => {
        if (e) setError("No pudimos abrir tu sesión.");
        else window.location.replace("/panel/contrasena");
      });
  }, []);

  if (error) {
    return (
      <div className="mt-3 space-y-4">
        <h1 className="titulo text-2xl">No pudimos entrar</h1>
        <p>{error} Pide un enlace nuevo; cada enlace sirve una sola vez y vence en una hora.</p>
        <Link href="/acceso/recuperar" className="etiqueta inline-block rounded bg-marino px-5 py-3 text-humo">Pedir otro enlace</Link>
      </div>
    );
  }
  return <h1 className="titulo mt-3 text-2xl">Entrando al panel…</h1>;
}
