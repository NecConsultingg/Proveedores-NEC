"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Subcategoria } from "@/lib/tipos";
import { enviarSolicitud, type EstadoFormulario } from "./acciones";

const inicial: EstadoFormulario = { ok: false, mensaje: "", errores: {}, valores: {}, intento: 0 };
const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2.5 focus:border-marino focus:outline-none";

export function Formulario({ subcategorias }: { subcategorias: Subcategoria[] }) {
  const grupos = [...new Map(subcategorias.map((s) => [s.grupo.id, s.grupo])).values()];
  const [estado, accion, enviando] = useActionState(enviarSolicitud, inicial);

  if (estado.ok) {
    return (
      <div className="rounded-md bg-marino p-8 text-humo" role="status">
        <h2 className="titulo text-2xl">Solicitud recibida</h2>
        <p className="mt-3">{estado.mensaje}</p>
        <Link href="/" className="etiqueta mt-6 inline-block rounded bg-arena px-5 py-3 text-marino">Volver al directorio</Link>
      </div>
    );
  }

  const e = estado.errores;
  const v = estado.valores;
  return (
    <form key={estado.intento} action={accion} className="relative space-y-5 rounded-md border border-black/5 bg-white p-6" noValidate>
      {/* Antispam: campo oculto que las personas no ven; si llega lleno, es un bot. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          No llenar este campo
          <input name="sitio_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre del negocio" error={e.nombreNegocio}>
          <input name="nombreNegocio" defaultValue={v.nombreNegocio} required autoComplete="organization" className={campo} />
        </Campo>
        <Campo etiqueta="Nombre del dueño o responsable" error={e.nombreResponsable}>
          <input name="nombreResponsable" defaultValue={v.nombreResponsable} required autoComplete="name" className={campo} />
        </Campo>
        <Campo etiqueta="WhatsApp" error={e.whatsapp}>
          <input name="whatsapp" defaultValue={v.whatsapp} required inputMode="tel" autoComplete="tel" placeholder="10 dígitos" className={campo} />
        </Campo>
        <Campo etiqueta="Correo (opcional)" error={e.correo}>
          <input name="correo" defaultValue={v.correo} type="email" autoComplete="email" className={campo} />
        </Campo>
        <Campo etiqueta="Tu especialidad (lo que más vendes)" error={e.especialidadSlug}>
          <select name="especialidadSlug" required defaultValue={v.especialidadSlug ?? ""} className={campo}>
            <option value="" disabled>Elige una</option>
            {grupos.map((g) => (
              <optgroup key={g.id} label={g.nombre}>
                {subcategorias
                  .filter((s) => s.grupo.id === g.id)
                  .map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.nombre} · {Math.max((s.cupo ?? 0) - s.ocupados, 0)} de {s.cupo} lugares libres
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <span className="mt-1 block text-sm text-pizarra">
            Ocupas un solo lugar, en tu especialidad. Lo demás que vendas lo registramos como categorías secundarias.
          </span>
        </Campo>
        <Campo etiqueta="¿Dónde vendes?" error={e.tipoUbicacion}>
          <select name="tipoUbicacion" required defaultValue={v.tipoUbicacion ?? ""} className={campo}>
            <option value="" disabled>Elige una</option>
            <option value="fabrica">Fábrica o taller</option>
            <option value="puesto">Puesto en tianguis</option>
            <option value="fabrica_y_puesto">Fábrica y puesto</option>
          </select>
        </Campo>
        <Campo etiqueta="Municipio" error={e.municipio}>
          <input name="municipio" required defaultValue={v.municipio ?? "San Martín Texmelucan"} className={campo} />
        </Campo>
        <Campo etiqueta="Años en el negocio" error={e.anios}>
          <input name="anios" defaultValue={v.anios} required inputMode="numeric" className={campo} />
        </Campo>
      </div>
      <Campo etiqueta="Redes sociales o catálogo (Facebook, Instagram, TikTok…)">
        <input name="redes" defaultValue={v.redes} className={campo} />
      </Campo>
      <fieldset>
        <legend className="font-semibold">¿Ya eres cliente de NEC Consulting?</legend>
        <div className="mt-1 flex gap-6">
          <label className="flex items-center gap-2"><input type="radio" name="clienteNec" value="si" defaultChecked={v.clienteNec === "si"} /> Sí</label>
          <label className="flex items-center gap-2"><input type="radio" name="clienteNec" value="no" defaultChecked={v.clienteNec !== "si"} /> No</label>
        </div>
        <p className="text-sm text-pizarra">Ser cliente da prioridad para la evaluación, pero no el sello automático.</p>
      </fieldset>
      <Campo etiqueta="Comentarios (opcional)">
        <textarea name="comentarios" defaultValue={v.comentarios} rows={3} className={campo} />
      </Campo>
      <div>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="aceptaAviso" defaultChecked={v.aceptaAviso === "on"} className="mt-1.5" />
          <span>
            Acepto el <Link href="/aviso-de-privacidad" className="underline" target="_blank">aviso de privacidad</Link> y
            autorizo a NEC a contactarme por WhatsApp sobre la evaluación.
          </span>
        </label>
        {e.aceptaAviso && <p className="mt-1 text-sm text-red-700">{e.aceptaAviso}</p>}
      </div>
      {estado.mensaje && <p className="text-red-700" aria-live="polite">{estado.mensaje}</p>}
      <button
        disabled={enviando}
        className="etiqueta w-full rounded bg-marino py-3.5 text-humo hover:bg-pizarra disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}

function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-semibold">{etiqueta}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}
