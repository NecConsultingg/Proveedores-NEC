import { CampoMaps } from "@/components/campo-maps";
import { CamposVenta } from "@/components/campos-venta";
import { CamposWhatsapp } from "@/components/campos-whatsapp";
import { FUNCIONES } from "@/lib/config";
import { ESTADOS } from "@/lib/venta";
import type { ProveedorPanel } from "./page";

export type Especialidad = { id: string; nombre: string; grupo: string; cupo: number; ocupados: number };

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

// Campos del proveedor para alta y edición. En edición manda también los valores originales,
// para que solo se propongan los campos que cambiaron.
export function CamposProveedor({ p, especialidades }: { p?: ProveedorPanel; especialidades: Especialidad[] }) {
  const grupos = [...new Set(especialidades.map((e) => e.grupo))];
  const orig = (k: keyof ProveedorPanel) =>
    p ? <input type="hidden" name={`original_${k}`} value={p[k] === null || p[k] === undefined ? "" : String(p[k])} /> : null;
  const texto = (k: keyof ProveedorPanel, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="text-sm font-semibold">{etiqueta}</span>
      <input name={k} defaultValue={p ? ((p[k] as string | number | null) ?? "") : ""} className={campo} {...extra} />
      {orig(k)}
    </label>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {texto("nombre", "Nombre del negocio *", { required: true })}
      <label className="block">
        <span className="text-sm font-semibold">Especialidad *</span>
        <select name="especialidad_id" required defaultValue={p?.especialidad_id ?? ""} className={campo}>
          <option value="" disabled>Elige una</option>
          {grupos.map((g) => (
            <optgroup key={g} label={g}>
              {especialidades.filter((e) => e.grupo === g).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} · {e.ocupados} de {e.cupo}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {orig("especialidad_id")}
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Estado</span>
        <select name="estado_republica" defaultValue={p ? (p.estado_republica ?? "") : "Puebla"} className={campo}>
          <option value="">Elige un estado</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        {orig("estado_republica")}
      </label>
      {texto("anios", "Años en el negocio", { inputMode: "numeric" })}
      {texto("mayoreo_minimo", "Mayoreo desde (piezas)", { inputMode: "numeric" })}
      <CamposWhatsapp valores={p?.whatsapps} conOriginales={Boolean(p)} />
      {FUNCIONES.clabe && texto("banco", "Banco")}
      {FUNCIONES.clabe && texto("clabe_oficial", "CLABE oficial (18 dígitos)", { inputMode: "numeric" })}
      {texto("dias_tianguis", "Días de tianguis")}
      {FUNCIONES.envios && texto("envios", "Envíos")}
      {texto("consentimiento_publicacion_en", "Fecha de autorización firmada", { type: "date" })}
      <CamposVenta presencial={p?.vende_presencial} enLinea={p?.vende_en_linea} otros={p?.otros_medios} conOriginales={Boolean(p)} />
      <CampoMaps valor={p?.maps_url} conOriginal={Boolean(p)} />
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Descripción</span>
        <textarea name="descripcion" rows={2} defaultValue={p?.descripcion ?? ""} className={campo} />
        {orig("descripcion")}
      </label>
      {FUNCIONES.compromisoDevolucion && <label className="block sm:col-span-2">
        <span className="text-sm font-semibold">Compromiso de devolución</span>
        <textarea name="compromiso_devolucion" rows={2} defaultValue={p?.compromiso_devolucion ?? ""} className={campo} />
        {orig("compromiso_devolucion")}
      </label>}
      {FUNCIONES.notasInternas && (
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold">Notas internas (nunca se publican)</span>
          <textarea name="notas_internas" rows={2} defaultValue={p?.notas_internas ?? ""} className={campo} />
          {orig("notas_internas")}
        </label>
      )}
      {p && (
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="publicado" defaultChecked={p.publicado} />
          <span>Publicado en el directorio (requiere fecha de autorización y lugar libre en la especialidad)</span>
          {orig("publicado")}
        </label>
      )}
    </div>
  );
}

export function CampoMotivo({ ejemplo }: { ejemplo: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">Motivo *</span>
      <input name="motivo" required minLength={3} placeholder={ejemplo} className={campo} />
    </label>
  );
}
