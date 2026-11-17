"use client";

import { useState } from "react";
import { PATRON_MAPS } from "@/lib/venta";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

// Mini ventana para pegar el enlace de Google Maps del negocio. Se publica como botón «Ver en Google Maps».
export function CampoMaps({ valor = "", conOriginal = false }: { valor?: string | null; conOriginal?: boolean }) {
  const [url, setUrl] = useState(valor ?? "");
  const limpio = url.trim();
  const valido = PATRON_MAPS.test(limpio);
  return (
    <div className="rounded-md border border-acero/60 bg-humo p-4 sm:col-span-2">
      <p className="text-sm font-semibold">Ubicación en Google Maps (opcional)</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-pizarra">
        <li>Abre Google Maps y busca tu negocio o deja el dedo presionado sobre tu local.</li>
        <li>Toca <b>Compartir</b> y luego <b>Copiar vínculo</b>.</li>
        <li>Pégalo aquí. Se verá en tu perfil como el botón «Ver en Google Maps».</li>
      </ol>
      <input name="maps_url" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" maxLength={500}
        placeholder="https://maps.app.goo.gl/…" className={`${campo} mt-3`} />
      {limpio && !valido && (
        <p className="mt-1 text-sm text-red-700">Ese enlace no es de Google Maps. Debe empezar con https://maps.app.goo.gl/</p>
      )}
      {valido && (
        <a href={limpio} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
          Probar el enlace ↗
        </a>
      )}
      {conOriginal && <input type="hidden" name="original_maps_url" value={valor ?? ""} />}
    </div>
  );
}
