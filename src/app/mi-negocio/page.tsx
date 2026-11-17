import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormaAccion } from "@/app/panel/forma-accion";
import { CAMPOS, ESTADO_CAMBIO, fecha, valorLegible } from "@/lib/panel";
import { NOMBRE_SELLO, obtenerNegocio, type MiNegocio } from "@/lib/mi-negocio";
import { proponerDesdeProveedor } from "./acciones";

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";
const ESTADO_PARA_PROVEEDOR: Record<string, string> = { ...ESTADO_CAMBIO, pendiente: "En revisión", aprobado: "Aprobado y publicado" };

export default async function MiNegocioInicio({ searchParams }: PageProps<"/mi-negocio">) {
  const n = await obtenerNegocio();
  if (n.debe_cambiar) redirect("/mi-negocio/contrasena");
  const whatsapp = n.whatsapp_oficial?.replace(/^52/, "") ?? "";

  return (
    <div className="space-y-6">
      <Suspense>
        <AvisoListo searchParams={searchParams} />
      </Suspense>

      <section className="grid gap-4 sm:grid-cols-3">
        <Dato titulo="Sello" valor={NOMBRE_SELLO[n.estado_sello]} />
        <Dato titulo="En el directorio" valor={n.publicado ? "Publicado" : "Aún no publicado"} />
        <Dato titulo="Próxima revisión" valor={n.proxima_revision ? fecha(n.proxima_revision).split(",")[0] : "Por definir"} />
      </section>
      {n.publicado && (
        <p>
          <a href={`/proveedores/${n.slug}`} target="_blank" className="underline">Ver mi perfil público ↗</a>
        </p>
      )}

      <section className="rounded-md border border-black/5 bg-white p-6">
        <h2 className="titulo text-xl">Mis datos</h2>
        <p className="mt-1 text-sm text-pizarra">
          Cambia lo que necesites y envíalo. El equipo NEC lo revisa antes de publicarlo; si cambias tu WhatsApp o tu CLABE,
          te llamaremos al número anterior para confirmar que eres tú. Nombre, especialidad y fotos: escríbenos.
        </p>
        <p className="mt-3 text-sm">
          <b>{n.nombre}</b> · {n.especialidad ?? "Sin especialidad"}
        </p>
        <FormaAccion accion={proponerDesdeProveedor} boton="Enviar cambios a revisión" className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo n={n} k="whatsapp_oficial" etiqueta="WhatsApp oficial (10 dígitos)" valor={whatsapp} inputMode="tel" />
            <Campo n={n} k="municipio" etiqueta="Municipio" />
            <Campo n={n} k="banco" etiqueta="Banco" />
            <Campo n={n} k="clabe_oficial" etiqueta="CLABE oficial (18 dígitos)" inputMode="numeric" />
            <Campo n={n} k="anios" etiqueta="Años en el negocio" inputMode="numeric" />
            <Campo n={n} k="mayoreo_minimo" etiqueta="Mayoreo desde (piezas)" inputMode="numeric" />
            <Campo n={n} k="dias_tianguis" etiqueta="Días de tianguis" />
            <Campo n={n} k="envios" etiqueta="Envíos" />
            <Campo n={n} k="descripcion" etiqueta="Descripción" largo />
            <Campo n={n} k="compromiso_devolucion" etiqueta="Compromiso de devolución" largo />
          </div>
          <label className="block">
            <span className="text-sm font-semibold">¿Por qué cambia? *</span>
            <input name="motivo" required minLength={3} placeholder="Ej. Cambié de número de WhatsApp" className={campo} />
          </label>
        </FormaAccion>
      </section>

      <section>
        <h2 className="titulo text-xl">Cambios que he enviado</h2>
        {n.cambios.length === 0 ? (
          <p className="mt-2 text-pizarra">Todavía no has enviado cambios.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {n.cambios.map((c) => (
              <li key={c.id} className="rounded border border-black/5 bg-white p-3 text-sm">
                <b>{ESTADO_PARA_PROVEEDOR[c.estado] ?? c.estado}</b> · enviado {fecha(c.propuesto_en)}
                <p className="text-pizarra">
                  {Object.entries(c.datos).map(([k, v]) => `${CAMPOS[k] ?? k}: ${valorLegible(k, v)}`).join(" · ")}
                </p>
                {c.comentario_revision && <p>Respuesta del equipo NEC: {c.comentario_revision}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-md border border-black/5 bg-white p-4">
      <p className="etiqueta text-pizarra">{titulo}</p>
      <p className="mt-1 font-semibold">{valor}</p>
    </div>
  );
}

function Campo({
  n, k, etiqueta, valor, largo, inputMode,
}: {
  n: MiNegocio;
  k: keyof MiNegocio;
  etiqueta: string;
  valor?: string;
  largo?: boolean;
  inputMode?: "tel" | "numeric";
}) {
  const actual = valor ?? (n[k] === null || n[k] === undefined ? "" : String(n[k]));
  return (
    <label className={`block ${largo ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-semibold">{etiqueta}</span>
      {largo ? (
        <textarea name={k} rows={2} defaultValue={actual} className={campo} />
      ) : (
        <input name={k} defaultValue={actual} inputMode={inputMode} className={campo} />
      )}
      <input type="hidden" name={`original_${k}`} value={actual} />
    </label>
  );
}

async function AvisoListo({ searchParams }: Pick<PageProps<"/mi-negocio">, "searchParams">) {
  const { listo } = await searchParams;
  return listo ? (
    <p className="rounded bg-arena p-4" role="status">
      Listo, tu contraseña quedó guardada. Desde ahora entras con tu correo y esa contraseña.
    </p>
  ) : null;
}
