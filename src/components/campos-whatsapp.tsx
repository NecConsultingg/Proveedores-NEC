"use client";

import { useState } from "react";
import { MAX_WHATSAPPS, mostrarWhatsapp } from "@/lib/venta";

const campo = "w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

// De 1 a 5 números de WhatsApp. El primero es el principal (botón «Escribir por WhatsApp»).
// Los campos vacíos se ignoran al guardar, así que basta con uno.
export function CamposWhatsapp({ valores, conOriginales = false }: { valores?: string[] | null; conOriginales?: boolean }) {
  const iniciales = (valores ?? []).map(mostrarWhatsapp);
  const [numeros, setNumeros] = useState<string[]>(iniciales.length ? iniciales : [""]);

  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-semibold">WhatsApp (de 1 a {MAX_WHATSAPPS} números, 10 dígitos)</legend>
      {numeros.map((n, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-sm text-pizarra">{i === 0 ? "Principal" : `Número ${i + 1}`}</span>
          <input name="whatsapps" value={n} inputMode="tel" autoComplete="off" placeholder="248 123 4567"
            onChange={(e) => setNumeros((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
            className={campo} aria-label={i === 0 ? "WhatsApp principal" : `WhatsApp ${i + 1}`} />
          {numeros.length > 1 && (
            <button type="button" onClick={() => setNumeros((xs) => xs.filter((_, j) => j !== i))}
              className="shrink-0 rounded px-2 py-1 text-sm text-pizarra hover:text-red-700" aria-label={`Quitar número ${i + 1}`}>
              Quitar
            </button>
          )}
        </div>
      ))}
      {numeros.length < MAX_WHATSAPPS && (
        <button type="button" onClick={() => setNumeros((xs) => [...xs, ""])} className="text-sm underline">
          + Agregar otro número
        </button>
      )}
      {conOriginales && <input type="hidden" name="original_whatsapps" value={(valores ?? []).join(",")} />}
    </fieldset>
  );
}
