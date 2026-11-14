"use client";

import { useActionState } from "react";
import type { EstadoAccion } from "./acciones";

// Formulario genérico del panel: ejecuta la acción y muestra el resultado (o el error de la base de datos).
export function FormaAccion({
  accion,
  children,
  boton,
  confirmar,
  className = "space-y-4",
  estiloBoton = "primario",
}: {
  accion: (prev: EstadoAccion, fd: FormData) => Promise<EstadoAccion>;
  children: React.ReactNode;
  boton: string;
  confirmar?: string;
  className?: string;
  estiloBoton?: "primario" | "secundario" | "peligro";
}) {
  const [estado, ejecutar, enviando] = useActionState(accion, { ok: false, mensaje: "" });
  const estilos = {
    primario: "bg-marino text-humo hover:bg-pizarra",
    secundario: "border border-marino bg-white text-marino hover:bg-humo",
    peligro: "bg-red-800 text-white hover:bg-red-900",
  };
  return (
    <form
      action={ejecutar}
      className={className}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={enviando} className={`etiqueta rounded px-5 py-2.5 disabled:opacity-60 ${estilos[estiloBoton]}`}>
          {enviando ? "Procesando…" : boton}
        </button>
        {estado.mensaje && (
          <p className={estado.ok ? "text-emerald-800" : "text-red-700"} role="status">
            {estado.mensaje}
          </p>
        )}
      </div>
    </form>
  );
}
