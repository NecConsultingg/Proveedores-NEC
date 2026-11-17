import Link from "next/link";
import { notFound } from "next/navigation";
import { CAMPOS, ESTADO_CAMBIO, TIPO_CAMBIO, fecha, obtenerMiembro, rango, rpc, valorLegible } from "@/lib/panel";
import { proponerBaja, proponerCambio, proponerSello } from "../../acciones";
import { FormaAccion } from "../../forma-accion";
import { CampoMotivo, CamposProveedor, type Especialidad } from "../campos";
import { CuentaProveedor, type Cuenta } from "../cuenta";
import type { ProveedorPanel } from "../page";

type Detalle = ProveedorPanel & {
  cuenta: Cuenta;
  cambios: { id: string; tipo: string; estado: string; datos: Record<string, unknown>; motivo: string; propuesto_en: string; propuesto_por: string; comentario_revision: string | null }[];
};

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

export default async function DetalleProveedor({ params }: PageProps<"/panel/proveedores/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [m, p, especialidades] = await Promise.all([
    obtenerMiembro(),
    rpc<Detalle | null>("panel_proveedor", { pid: id }),
    rpc<Especialidad[]>("panel_especialidades"),
  ]);
  if (!p) notFound();
  const esSuper = m.nivel === "superadmin";
  const medioOMas = rango(m.nivel) >= 2;

  return (
    <div className="space-y-6">
      <Link href="/panel/proveedores" className="text-sm underline">← Proveedores</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo text-3xl">{p.nombre}</h1>
          <p className="text-pizarra">
            {p.especialidad} · Sello: <b className="capitalize">{p.estado_sello}</b> · {p.publicado ? "Publicado" : "Sin publicar"}
            {p.demo && " · Demostración"}
          </p>
        </div>
        {p.publicado && (
          <a href={`/proveedores/${p.slug}`} target="_blank" className="text-sm underline">Ver perfil público ↗</a>
        )}
      </div>

      <section className="rounded-md border border-black/5 bg-white p-6">
        <h2 className="titulo text-xl">{esSuper ? "Editar" : "Proponer cambios"}</h2>
        <p className="mt-1 text-sm text-pizarra">
          Solo se envían los campos que modifiques. {esSuper ? "Puedes aplicar directo; queda en la bitácora." : "Un administrador revisa y aprueba."}
          {" "}Antes de cambiar WhatsApp o CLABE, confirma con el dueño llamando al número anterior.
        </p>
        <FormaAccion accion={proponerCambio} boton={esSuper ? "Guardar" : "Enviar propuesta"} className="mt-4 space-y-5">
          <input type="hidden" name="tipo" value="edicion" />
          <input type="hidden" name="proveedor_id" value={p.id} />
          <CamposProveedor p={p} especialidades={especialidades} />
          <CampoMotivo ejemplo="Ej. El dueño confirmó por llamada su nuevo WhatsApp" />
          {esSuper && (
            <label className="flex items-center gap-2">
              <input type="checkbox" name="directo" defaultChecked />
              <span>Aplicar directo (sin aprobación)</span>
            </label>
          )}
        </FormaAccion>
      </section>

      {medioOMas && <CuentaProveedor proveedorId={p.id} negocio={p.nombre} cuenta={p.cuenta} />}

      {medioOMas && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-black/5 bg-white p-6">
            <h2 className="titulo text-xl">Sello</h2>
            <p className="mt-1 text-sm text-pizarra">
              Queda en <b>borrador</b> hasta que lo autorice un superadministrador (que no sea quien lo propone). Solo con una
              evaluación completa y sus evidencias.
            </p>
            <FormaAccion accion={proponerSello} boton="Proponer sello" className="mt-4 space-y-3">
              <input type="hidden" name="proveedor_id" value={p.id} />
              <label className="block">
                <span className="text-sm font-semibold">Nuevo estado</span>
                <select name="estado_sello" className={campo} defaultValue="vigente">
                  <option value="vigente">Vigente (Verificado por NEC)</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold">Evaluado el</span>
                  <input type="date" name="evaluado_en" className={campo} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Próxima revisión</span>
                  <input type="date" name="proxima_revision" className={campo} />
                </label>
              </div>
              <CampoMotivo ejemplo="Ej. Evaluación 2027 completa: pedidos, visita y devolución" />
            </FormaAccion>
          </section>

          <section className="rounded-md border border-red-200 bg-white p-6">
            <h2 className="titulo text-xl">Baja (retiro del sello)</h2>
            <p className="mt-1 text-sm text-pizarra">
              Despublica al proveedor y marca el sello como retirado. Debe seguir el proceso escrito (aviso, plazo y decisión).
              La aprueba un superadministrador.
            </p>
            <FormaAccion accion={proponerBaja} boton="Proponer baja" estiloBoton="peligro"
              confirmar={`¿Proponer la baja de ${p.nombre}?`} className="mt-4 space-y-3">
              <input type="hidden" name="proveedor_id" value={p.id} />
              <CampoMotivo ejemplo="Ej. Fraude comprobado en la queja del 12-mar" />
            </FormaAccion>
          </section>
        </div>
      )}

      <section>
        <h2 className="titulo text-xl">Historial de cambios</h2>
        {p.cambios.length === 0 ? (
          <p className="mt-2 text-pizarra">Sin cambios registrados.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {p.cambios.map((c) => (
              <li key={c.id} className="rounded border border-black/5 bg-white p-3 text-sm">
                <b>{TIPO_CAMBIO[c.tipo]}</b> · {ESTADO_CAMBIO[c.estado]} · {fecha(c.propuesto_en)} · {c.propuesto_por}
                <p className="text-pizarra">Motivo: {c.motivo}</p>
                {Object.keys(c.datos).length > 0 && (
                  <p className="text-pizarra">
                    {Object.entries(c.datos).map(([k, v]) => `${CAMPOS[k] ?? k}: ${valorLegible(k, v, especialidades)}`).join(" · ")}
                  </p>
                )}
                {c.comentario_revision && <p>Revisión: {c.comentario_revision}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
