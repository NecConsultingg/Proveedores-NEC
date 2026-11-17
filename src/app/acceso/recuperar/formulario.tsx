"use client";

import { useActionState } from "react";
import { enviarEnlace, type EstadoAcceso } from "../acciones";

export function FormularioEnlace() {
  const [estado, accion, enviando] = useActionState<EstadoAcceso, FormData>(enviarEnlace, { enviado: false, mensaje: "" });

  if (estado.enviado) {
    return (
      <p className="rounded-md bg-arena p-5" role="status">
        {estado.mensaje}
      </p>
    );
  }
  return (
    <form action={accion} className="space-y-4">
      <label className="block">
        <span className="font-semibold">Tu correo del equipo NEC</span>
        <input
          name="correo"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-acero bg-white px-3 py-2.5 focus:border-marino focus:outline-none"
        />
      </label>
      {estado.mensaje && <p className="text-red-700">{estado.mensaje}</p>}
      <button disabled={enviando} className="etiqueta w-full rounded bg-marino py-3 text-humo hover:bg-pizarra disabled:opacity-60">
        {enviando ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
