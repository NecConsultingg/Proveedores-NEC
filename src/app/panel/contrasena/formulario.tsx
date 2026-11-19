"use client";

import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useState } from "react";
import { CampoContrasena } from "@/components/campo-contrasena";

const MINIMO = 10;

// Cambio de contraseña para el equipo NEC y para los proveedores. Con `proveedor`, al guardar marca que ya no
// usa la temporal y lo lleva a «Mi negocio».
export function FormularioContrasena({ correo, proveedor = false }: { correo: string; proveedor?: boolean }) {
  const [estado, setEstado] = useState<{ ok: boolean; mensaje: string }>({ ok: false, mensaje: "" });
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const forma = e.currentTarget;
    const fd = new FormData(forma);
    const nueva = String(fd.get("nueva") ?? "");
    if (nueva.length < MINIMO) return setEstado({ ok: false, mensaje: `Usa al menos ${MINIMO} caracteres.` });
    if (nueva !== fd.get("repetir")) return setEstado({ ok: false, mensaje: "Las dos contraseñas no coinciden." });
    if (/^nec-/i.test(nueva)) return setEstado({ ok: false, mensaje: "Elige una contraseña tuya, distinta a la temporal." });

    setGuardando(true);
    const supabase = supabaseNavegador();
    const { error } = await supabase.auth.updateUser({ password: nueva });
    if (!error) {
      if (proveedor) {
        await supabase.rpc("proveedor_contrasena_cambiada");
        window.location.replace("/mi-negocio?listo=1");
        return;
      }
      setGuardando(false);
      forma.reset();
      return setEstado({ ok: true, mensaje: "Listo. Desde ahora entras con tu correo y esta contraseña." });
    }
    setGuardando(false);
    setEstado({
      ok: false,
      mensaje:
        error.code === "same_password"
          ? "Esa ya es tu contraseña actual. Elige otra."
          : error.code === "weak_password"
            ? "Esa contraseña es muy débil. Usa una más larga, con letras y números."
            : error.code === "reauthentication_needed"
              ? "Por seguridad, cierra sesión y vuelve a entrar antes de cambiarla."
              : "No pudimos guardar la contraseña. Intenta de nuevo.",
    });
  }

  return (
    <form onSubmit={guardar} className="max-w-sm space-y-4">
      {/* Para que el administrador de contraseñas del navegador la guarde con el correo correcto. */}
      <input type="email" name="usuario" value={correo} autoComplete="username" readOnly hidden />
      <CampoContrasena name="nueva" etiqueta="Contraseña nueva" autoComplete="new-password" minLength={MINIMO} />
      <CampoContrasena name="repetir" etiqueta="Repítela" autoComplete="new-password" minLength={MINIMO} />
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
