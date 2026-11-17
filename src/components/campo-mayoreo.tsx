"use client";

import { useState } from "react";
import { UNIDADES_MAYOREO } from "@/lib/venta";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

// «Mayoreo desde»: cantidad + unidad (piezas, paquetes, docenas… u otra que escriba el proveedor).
export function CampoMayoreo({
  minimo,
  unidad,
  requerido = false,
  conOriginales = false,
}: {
  minimo?: number | null;
  unidad?: string | null;
  requerido?: boolean;
  conOriginales?: boolean;
}) {
  const inicial = (unidad || "piezas").trim();
  const conocida = UNIDADES_MAYOREO.some((u) => u.valor === inicial.toLowerCase());
  const [eleccion, setEleccion] = useState(conocida ? inicial.toLowerCase() : "otra");
  const [otra, setOtra] = useState(conocida ? "" : inicial);
  const valor = eleccion === "otra" ? otra.trim() : eleccion;

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-semibold">Mayoreo desde{requerido ? " *" : ""}</legend>
      <div className="flex flex-wrap gap-2">
        <input name="mayoreo_minimo" required={requerido} inputMode="numeric" defaultValue={minimo ?? ""} placeholder="Cantidad"
          aria-label="Cantidad mínima de mayoreo" className={`${campo} w-28`} />
        <select value={eleccion} onChange={(e) => setEleccion(e.target.value)} aria-label="Unidad" className={`${campo} w-40`}>
          {UNIDADES_MAYOREO.map((u) => <option key={u.valor} value={u.valor}>{u.nombre}</option>)}
          <option value="otra">Otra…</option>
        </select>
        {eleccion === "otra" && (
          <input value={otra} onChange={(e) => setOtra(e.target.value)} required maxLength={30} placeholder="Ej. camisas, rollos"
            aria-label="Escribe la unidad" className={`${campo} w-48`} />
        )}
      </div>
      <input type="hidden" name="mayoreo_unidad" value={valor} />
      <span className="text-xs text-pizarra">Ej. «12 piezas», «2 paquetes», «1 docena».</span>
      {conOriginales && (
        <>
          <input type="hidden" name="original_mayoreo_minimo" value={minimo ?? ""} />
          <input type="hidden" name="original_mayoreo_unidad" value={unidad ?? "piezas"} />
        </>
      )}
    </fieldset>
  );
}
