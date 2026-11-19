"use client";

import { guardarRecordar, supabaseNavegador } from "@/lib/supabase/navegador";
import { useState } from "react";
import { CampoContrasena } from "@/components/campo-contrasena";
import { DIAS_RECORDAR } from "@/lib/supabase/cookies";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2.5 focus:border-marino focus:outline-none";

// Entra con correo y contraseña (equipo NEC y proveedores). Se hace desde el navegador para que el límite
// de intentos de Supabase cuente por persona (su IP) y no por el servidor. Después manda a cada quien a su área.
export function FormularioAcceso() {
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setEntrando(true);
    const fd = new FormData(e.currentTarget);
    guardarRecordar(fd.get("recordarme") === "on");
    const supabase = supabaseNavegador();
    const { error: e2 } = await supabase.auth.signInWithPassword({
      email: String(fd.get("correo") ?? "").trim().toLowerCase(),
      password: String(fd.get("contrasena") ?? ""),
    });
    if (e2) {
      setEntrando(false);
      setError(
        /rate limit|too many/i.test(e2.message)
          ? "Demasiados intentos. Espera unos minutos y vuelve a intentar."
          : /banned/i.test(e2.message)
            ? "Tu cuenta está desactivada. Escríbele al equipo NEC."
            : "Correo o contraseña incorrectos.",
      );
      return;
    }
    const { data } = await supabase.rpc("mi_destino");
    const destino = data as { tipo: "equipo" | "proveedor" | null; debe_cambiar?: boolean; falta_registro?: boolean } | null;
    if (destino?.tipo === "equipo") return window.location.replace("/panel");
    if (destino?.tipo === "proveedor")
      return window.location.replace(
        destino.debe_cambiar ? "/mi-negocio/contrasena" : destino.falta_registro ? "/mi-negocio/registro" : "/mi-negocio",
      );
    await supabase.auth.signOut();
    setEntrando(false);
    setError("Tu cuenta no tiene acceso o está desactivada. Escríbele al equipo NEC.");
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <label className="block">
        <span className="font-semibold">Correo</span>
        <input name="correo" type="email" required autoComplete="username" autoCapitalize="none" spellCheck={false} className={campo} />
      </label>
      <CampoContrasena name="contrasena" etiqueta="Contraseña" autoComplete="current-password" />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="recordarme" defaultChecked className="h-4 w-4 accent-marino" />
        <span className="text-sm">Recordarme en este dispositivo por {DIAS_RECORDAR} días</span>
      </label>
      {error && <p className="text-red-700" role="alert">{error}</p>}
      <button disabled={entrando} className="etiqueta w-full rounded bg-marino py-3 text-humo hover:bg-pizarra disabled:opacity-60">
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
