"use client";

import { useState } from "react";
import { SUGERENCIAS_OTROS } from "@/lib/venta";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

// «Formato de venta»: presencial, en línea y otros medios (con ideas para tocar y agregar).
// Con `conOriginales`, manda también los valores de antes para que solo se proponga lo que cambió.
export function CamposVenta({
  presencial = false,
  enLinea = false,
  otros = "",
  conOriginales = false,
}: {
  presencial?: boolean;
  enLinea?: boolean;
  otros?: string | null;
  conOriginales?: boolean;
}) {
  const [texto, setTexto] = useState(otros ?? "");
  const elegidos = texto.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  function alternar(s: string) {
    const lista = texto.split(",").map((t) => t.trim()).filter(Boolean);
    const ya = lista.some((t) => t.toLowerCase() === s.toLowerCase());
    setTexto((ya ? lista.filter((t) => t.toLowerCase() !== s.toLowerCase()) : [...lista, s]).join(", "));
  }

  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-sm font-semibold">Formato de venta</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="vende_presencial" defaultChecked={presencial} className="mt-1" />
          <span>
            Presencial <span className="block text-sm text-pizarra">Fábrica, taller, tienda o puesto en tianguis</span>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="vende_en_linea" defaultChecked={enLinea} className="mt-1" />
          <span>
            En línea <span className="block text-sm text-pizarra">Pedidos por WhatsApp o redes y envío</span>
          </span>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold">Otros medios (opcional)</span>
        <input name="otros_medios" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={300}
          placeholder="Toca las opciones de abajo o escribe el tuyo" className={campo} />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Ideas de otros medios">
        {SUGERENCIAS_OTROS.map((s) => {
          const activo = elegidos.includes(s.toLowerCase());
          return (
            <button key={s} type="button" onClick={() => alternar(s)} aria-pressed={activo}
              className={`rounded-full border px-3 py-1 text-sm ${activo ? "border-marino bg-marino text-humo" : "border-acero bg-white hover:border-marino"}`}>
              {activo ? "✓ " : "+ "}{s}
            </button>
          );
        })}
      </div>
      {conOriginales && (
        <>
          <input type="hidden" name="original_vende_presencial" value={String(presencial)} />
          <input type="hidden" name="original_vende_en_linea" value={String(enLinea)} />
          <input type="hidden" name="original_otros_medios" value={otros ?? ""} />
        </>
      )}
    </fieldset>
  );
}
