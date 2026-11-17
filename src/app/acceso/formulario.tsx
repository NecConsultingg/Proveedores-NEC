"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2.5 focus:border-marino focus:outline-none";

// Entra con correo y contraseña. Se hace desde el navegador para que el límite de intentos de Supabase
// cuente por persona (su IP) y no por el servidor.
export function FormularioAcceso() {
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEntrando(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const { error: e2 } = await supabase.auth.signInWithPassword({
      email: String(fd.get("correo") ?? "").trim().toLowerCase(),
      password: String(fd.get("contrasena") ?? ""),
    });
    if (!e2) {
      window.location.replace("/panel");
      return;
    }
    setEntrando(false);
    setError(
      /rate limit|too many/i.test(e2.message)
        ? "Demasiados intentos. Espera unos minutos y vuelve a intentar."
        : "Correo o contraseña incorrectos.",
    );
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <label className="block">
        <span className="font-semibold">Correo</span>
        <input name="correo" type="email" required autoComplete="username" className={campo} />
      </label>
      <label className="block">
        <span className="font-semibold">Contraseña</span>
        <input name="contrasena" type="password" required autoComplete="current-password" className={campo} />
      </label>
      {error && <p className="text-red-700" role="alert">{error}</p>}
      <button disabled={entrando} className="etiqueta w-full rounded bg-marino py-3 text-humo hover:bg-pizarra disabled:opacity-60">
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
