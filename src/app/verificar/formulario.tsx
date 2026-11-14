"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verificar, type EstadoVerificacion } from "./acciones";

export function FormularioVerificar() {
  const [estado, accion, enviando] = useActionState<EstadoVerificacion, FormData>(verificar, { tipo: "inicial" });
  const valorPrevio = estado.tipo === "inicial" ? "" : estado.valor;

  return (
    <div className="space-y-5">
      <form action={accion} className="flex flex-col gap-3 rounded-md border border-black/5 bg-white p-6 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="font-semibold">WhatsApp o CLABE</span>
          <input
            name="valor"
            required
            inputMode="numeric"
            defaultValue={valorPrevio}
            key={valorPrevio}
            placeholder="Ej. 248 123 4567 o los 18 dígitos de la CLABE"
            className="mt-1 w-full rounded border border-acero px-3 py-2.5 focus:border-marino focus:outline-none"
          />
        </label>
        <button
          disabled={enviando}
          className="etiqueta rounded bg-marino px-8 py-3 text-humo hover:bg-pizarra disabled:opacity-60"
        >
          {enviando ? "Revisando…" : "Verificar"}
        </button>
      </form>

      <div aria-live="polite">
        {estado.tipo === "error" && <p className="text-red-700">{estado.mensaje}</p>}

        {estado.tipo === "oficial" && (
          <div className="rounded-md border-l-4 border-emerald-600 bg-emerald-50 p-5 text-emerald-950">
            <p className="titulo text-lg">Sí es un contacto oficial</p>
            {estado.coincidencias.map((c) => (
              <p key={c.slug} className="mt-2">
                Es {c.tipo === "clabe" ? "la cuenta para pagos" : "el WhatsApp"} de{" "}
                <Link href={`/proveedores/${c.slug}`} className="font-semibold underline">{c.nombre}</Link>, {c.tipo === "clabe" ? "confirmada" : "confirmado"} por NEC.
              </p>
            ))}
            <p className="mt-3 text-sm">
              Aun así, revisa que el producto, el precio y las condiciones sean los que acordaron por escrito.
            </p>
          </div>
        )}

        {estado.tipo === "no_encontrado" && (
          <div className="rounded-md border-l-4 border-red-600 bg-red-50 p-5 text-red-950">
            <p className="titulo text-lg">No coincide con ningún proveedor del directorio</p>
            <p className="mt-2">
              Si te dicen que son un proveedor de este directorio, <strong>no pagues</strong> hasta comunicarte con el
              número publicado en su perfil. Puede ser alguien haciéndose pasar por ellos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
