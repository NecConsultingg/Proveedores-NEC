import Link from "next/link";
import { Suspense } from "react";
import { CAMPOS, ESTADO_CAMBIO, TIPO_CAMBIO, fecha, obtenerMiembro, rango, rpc, valorLegible } from "@/lib/panel";
import { resolverCambio } from "../acciones";
import { FormaAccion } from "../forma-accion";
import type { Especialidad } from "../proveedores/campos";
import type { ProveedorPanel } from "../proveedores/page";

type Cambio = {
  id: string;
  tipo: string;
  estado: string;
  datos: Record<string, unknown>;
  motivo: string;
  propuesto_en: string;
  propuesto_por_id: string;
  propuesto_por: string;
  revisado_por: string | null;
  revisado_en: string | null;
  comentario_revision: string | null;
  proveedor_id: string | null;
  proveedor: string | null;
};

export default function Aprobaciones({ searchParams }: PageProps<"/panel/aprobaciones">) {
  return (
    <Suspense fallback={<p className="text-pizarra">Cargando…</p>}>
      <Lista searchParams={searchParams} />
    </Suspense>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/panel/aprobaciones">, "searchParams">) {
  const { ver } = await searchParams;
  const filtro = ver === "todos" ? "todos" : "pendiente";
  const [m, cambios, proveedores, especialidades] = await Promise.all([
    obtenerMiembro(),
    rpc<Cambio[]>("panel_cambios", { filtro }),
    rpc<ProveedorPanel[]>("panel_proveedores"),
    rpc<Especialidad[]>("panel_especialidades"),
  ]);
  const actual = new Map(proveedores.map((p) => [p.id, p]));

  const puedeResolver = (c: Cambio) =>
    c.estado === "pendiente" &&
    c.propuesto_por_id !== m.id &&
    (c.tipo === "sello" || c.tipo === "baja" ? m.nivel === "superadmin" : rango(m.nivel) >= 2);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo text-3xl">Aprobaciones</h1>
          <p className="mt-1 text-pizarra">
            Nadie aprueba su propio cambio. El sello y las bajas los aprueba un superadministrador.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/panel/aprobaciones" className={filtro === "pendiente" ? "font-semibold" : "underline"}>Pendientes</Link>
          <Link href="/panel/aprobaciones?ver=todos" className={filtro === "todos" ? "font-semibold" : "underline"}>Historial</Link>
        </div>
      </div>

      {cambios.length === 0 && <p className="rounded border border-black/10 bg-white p-6">No hay cambios {filtro === "pendiente" ? "pendientes" : ""}.</p>}

      {cambios.map((c) => {
        const p = c.proveedor_id ? actual.get(c.proveedor_id) : undefined;
        return (
          <article key={c.id} className="rounded-md border border-black/5 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {TIPO_CAMBIO[c.tipo]} · {c.proveedor ?? (c.datos.nombre as string) ?? "Nuevo proveedor"}
              </h2>
              <span className="text-sm text-pizarra">{ESTADO_CAMBIO[c.estado]}</span>
            </div>
            <p className="text-sm text-pizarra">
              Propuesto por {c.propuesto_por} · {fecha(c.propuesto_en)}
              {c.revisado_por && <> · Revisado por {c.revisado_por} · {fecha(c.revisado_en)}</>}
            </p>
            <p className="mt-2">Motivo: {c.motivo}</p>

            {Object.keys(c.datos).length > 0 && (
              <table className="mt-3 w-full text-sm">
                <thead className="text-left text-pizarra">
                  <tr><th className="py-1 pr-3">Campo</th>{c.tipo !== "alta" && <th className="py-1 pr-3">Actual</th>}<th className="py-1">Propuesto</th></tr>
                </thead>
                <tbody>
                  {Object.entries(c.datos).map(([k, v]) => (
                    <tr key={k} className="border-t border-black/5">
                      <td className="py-1 pr-3">{CAMPOS[k] ?? k}</td>
                      {c.tipo !== "alta" && <td className="py-1 pr-3 text-pizarra">{valorLegible(k, p?.[k as keyof ProveedorPanel], especialidades)}</td>}
                      <td className="py-1 font-semibold">{valorLegible(k, v, especialidades)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {(["whatsapp_oficial", "clabe_oficial"].some((k) => k in c.datos)) && c.estado === "pendiente" && (
              <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">
                Cambio de contacto: antes de aprobar, llama al dueño <b>al número anterior</b> y confirma que él lo pidió.
              </p>
            )}
            {c.comentario_revision && <p className="mt-2 text-sm">Comentario de revisión: {c.comentario_revision}</p>}

            {puedeResolver(c) && (
              <div className="mt-4 flex flex-wrap gap-4">
                <FormaAccion accion={resolverCambio} boton="Aprobar" className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="cambio_id" value={c.id} />
                  <input type="hidden" name="decision" value="aprobar" />
                </FormaAccion>
                <FormaAccion accion={resolverCambio} boton="Rechazar" estiloBoton="secundario" className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="cambio_id" value={c.id} />
                  <input type="hidden" name="decision" value="rechazar" />
                  <input name="comentario" required placeholder="Motivo del rechazo" className="rounded border border-acero px-3 py-2" />
                </FormaAccion>
              </div>
            )}
            {c.estado === "pendiente" && !puedeResolver(c) && (
              <p className="mt-3 text-sm text-pizarra">
                {c.propuesto_por_id === m.id ? "Es tu propuesta: la aprueba otra persona." : "Lo aprueba un nivel superior."}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
