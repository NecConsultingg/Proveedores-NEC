"use client";

import Link from "next/link";
import { useActionState } from "react";
import { altaConCuenta, type EstadoCuenta } from "../../acciones";
import type { Especialidad } from "../campos";
import { Credenciales } from "../cuenta";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

export function FormularioAlta({ especialidades }: { especialidades: Especialidad[] }) {
  const [estado, accion, enviando] = useActionState<EstadoCuenta, FormData>(altaConCuenta, { ok: false, mensaje: "" });
  const grupos = [...new Set(especialidades.map((e) => e.grupo))];

  if (estado.ok && estado.correo && estado.contrasena) {
    return (
      <div className="space-y-4">
        <Credenciales negocio={estado.negocio || "su negocio"} correo={estado.correo} contrasena={estado.contrasena} aviso={estado.mensaje} />
        <div className="flex flex-wrap gap-4 text-sm">
          {estado.proveedorId && <Link href={`/panel/proveedores/${estado.proveedorId}`} className="underline">Ver su ficha</Link>}
          <a href="/panel/proveedores/nuevo" className="underline">Dar de alta otro</a>
        </div>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4 rounded-md border border-black/5 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold">Nombre del negocio *</span>
          <input name="nombre" required minLength={2} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Especialidad *</span>
          <select name="especialidad_id" required defaultValue="" className={campo}>
            <option value="" disabled>Elige una</option>
            {grupos.map((g) => (
              <optgroup key={g} label={g}>
                {especialidades.filter((e) => e.grupo === g).map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} · {e.ocupados} de {e.cupo}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Correo del proveedor *</span>
          <input name="correo" type="email" required className={campo} />
        </label>
      </div>
      {estado.mensaje && !estado.ok && <p className="text-red-700" role="alert">{estado.mensaje}</p>}
      <button disabled={enviando} className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra disabled:opacity-60">
        {enviando ? "Creando…" : "Dar de alta y crear cuenta"}
      </button>
    </form>
  );
}

