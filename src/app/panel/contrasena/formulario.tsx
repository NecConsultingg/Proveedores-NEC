"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

const MINIMO = 10;
const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

export function FormularioContrasena({ correo }: { correo: string }) {
  const [estado, setEstado] = useState<{ ok: boolean; mensaje: string }>({ ok: false, mensaje: "" });
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const forma = e.currentTarget;
    const fd = new FormData(forma);
    const nueva = String(fd.get("nueva") ?? "");
    if (nueva.length < MINIMO) return setEstado({ ok: false, mensaje: `Usa al menos ${MINIMO} caracteres.` });
    if (nueva !== fd.get("repetir")) return setEstado({ ok: false, mensaje: "Las dos contraseñas no coinciden." });

    setGuardando(true);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const { error } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);
    if (!error) {
      forma.reset();
      return setEstado({ ok: true, mensaje: "Listo. Desde ahora entras con tu correo y esta contraseña." });
    }
    setEstado({
      ok: false,
      mensaje:
        error.code === "same_password"
          ? "Esa ya es tu contraseña actual. Elige otra."
          : error.code === "weak_password"
            ? "Esa contraseña es muy débil. Usa una más larga, con letras y números."
            : error.code === "reauthentication_needed"
              ? "Por seguridad, pide un enlace nuevo en «¿Se te olvidó la contraseña?» y cámbiala desde ahí."
              : "No pudimos guardar la contraseña. Intenta de nuevo.",
    });
  }

  return (
    <form onSubmit={guardar} className="max-w-sm space-y-4">
      {/* Para que el administrador de contraseñas del navegador la guarde con el correo correcto. */}
      <input type="email" name="usuario" value={correo} autoComplete="username" readOnly hidden />
      <label className="block">
        <span className="text-sm font-semibold">Contraseña nueva</span>
        <input name="nueva" type="password" required minLength={MINIMO} autoComplete="new-password" className={campo} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Repítela</span>
        <input name="repetir" type="password" required minLength={MINIMO} autoComplete="new-password" className={campo} />
      </label>
      <p className="text-sm text-pizarra">Mínimo {MINIMO} caracteres. Usa una que no uses en otros sitios.</p>
      {estado.mensaje && (
        <p className={estado.ok ? "rounded bg-arena p-3" : "text-red-700"} role="status">{estado.mensaje}</p>
      )}
      <button disabled={guardando} className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra disabled:opacity-60">
        {guardando ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
