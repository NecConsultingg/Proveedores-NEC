import { formatoVenta } from "@/lib/venta";
import { fecha, obtenerMiembro, rango, rpc } from "@/lib/panel";
import { cambiarEstadoSolicitud } from "../acciones";
import { FormaAccion } from "../forma-accion";

type Solicitud = {
  id: string;
  nombre_negocio: string;
  nombre_responsable: string;
  whatsapp: string;
  correo: string | null;
  especialidad_slug: string;
  tipo_ubicacion: string | null;
  municipio: string | null;
  estado_republica: string | null;
  vende_presencial: boolean;
  vende_en_linea: boolean;
  otros_medios: string | null;
  anios: number;
  redes: string | null;
  cliente_nec: boolean;
  comentarios: string | null;
  estado: string;
  recibida_en: string;
};

const ESTADOS = [
  { v: "recibida", t: "Recibida", minimo: 1 },
  { v: "contactado", t: "Contactado", minimo: 1 },
  { v: "preseleccionado", t: "Preseleccionado", minimo: 2 },
  { v: "no_seleccionado", t: "No seleccionado", minimo: 2 },
  { v: "auditando", t: "Auditando", minimo: 1 },
];

export default async function Solicitudes() {
  const [m, solicitudes] = await Promise.all([obtenerMiembro(), rpc<Solicitud[]>("panel_solicitudes")]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="titulo text-3xl">Solicitudes «Quiero ser auditado»</h1>
        <p className="mt-1 text-pizarra">
          Contacta en menos de 3 días hábiles. La convocatoria cierra el 22 de enero de 2027. La preselección la decide un
          administrador.
        </p>
      </div>
      {solicitudes.length === 0 && <p className="rounded border border-black/10 bg-white p-6">Todavía no hay solicitudes.</p>}
      <div className="space-y-3">
        {solicitudes.map((s) => (
          <article key={s.id} className="rounded-md border border-black/5 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{s.nombre_negocio}</h2>
              <span className="text-sm text-pizarra">Recibida {fecha(s.recibida_en)}</span>
            </div>
            <p className="text-sm">
              {s.nombre_responsable} · WhatsApp{" "}
              <a className="underline" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">
                +{s.whatsapp}
              </a>
              {s.correo && <> · {s.correo}</>}
            </p>
            <p className="text-sm text-pizarra">
              Especialidad: {s.especialidad_slug} ·{" "}
              {[s.estado_republica ?? s.municipio,
                formatoVenta({ vendePresencial: s.vende_presencial, vendeEnLinea: s.vende_en_linea, otrosMedios: s.otros_medios }).join(", ") || s.tipo_ubicacion?.replaceAll("_", " "),
                `${s.anios} años`].filter(Boolean).join(" · ")}
              {s.cliente_nec && " · Cliente de NEC"}
            </p>
            {s.redes && <p className="text-sm text-pizarra">Redes: {s.redes}</p>}
            {s.comentarios && <p className="mt-1 text-sm">«{s.comentarios}»</p>}
            <FormaAccion accion={cambiarEstadoSolicitud} boton="Guardar estado" estiloBoton="secundario" className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="solicitud_id" value={s.id} />
              <select name="estado" defaultValue={s.estado} className="rounded border border-acero px-3 py-2">
                {ESTADOS.map((e) => (
                  <option key={e.v} value={e.v} disabled={rango(m.nivel) < e.minimo && e.v !== s.estado}>
                    {e.t}
                  </option>
                ))}
              </select>
            </FormaAccion>
          </article>
        ))}
      </div>
    </div>
  );
}
