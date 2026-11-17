import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormaAccion } from "@/app/panel/forma-accion";
import { CampoMaps } from "@/components/campo-maps";
import { CampoMayoreo } from "@/components/campo-mayoreo";
import { CamposVenta } from "@/components/campos-venta";
import { CamposWhatsapp } from "@/components/campos-whatsapp";
import { obtenerNegocio } from "@/lib/mi-negocio";
import { ESTADOS } from "@/lib/venta";
import { registrarNegocio } from "../acciones";

export const metadata: Metadata = { title: "Registro de tu negocio" };

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

export default async function RegistroNegocio({ searchParams }: PageProps<"/mi-negocio/registro">) {
  const n = await obtenerNegocio();
  if (n.debe_cambiar) redirect("/mi-negocio/contrasena");
  if (!n.falta_registro) redirect("/mi-negocio");

  return (
    <div className="space-y-5">
      <Suspense>
        <AvisoContrasena searchParams={searchParams} />
      </Suspense>
      <section className="rounded-md border border-black/5 bg-white p-6">
        <p className="etiqueta text-pizarra">Paso 2 de 2</p>
        <h1 className="titulo mt-1 text-2xl">Registra tu negocio</h1>
        <p className="mt-2 text-pizarra">
          Así aparecerás en el directorio. Revisa que todo esté bien: el equipo NEC lo revisa antes de publicarlo.
        </p>
        <p className="mt-3 rounded bg-humo p-3 text-sm">
          <b>{n.nombre}</b> · Especialidad: {n.especialidad ?? "—"}
          <span className="block text-pizarra">Si el nombre o la especialidad no son correctos, escríbele al equipo NEC.</span>
        </p>
        {n.ultimo_rechazo && (
          <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            <b>Tu registro anterior necesita correcciones:</b> {n.ultimo_rechazo}
          </p>
        )}

        <FormaAccion accion={registrarNegocio} boton="Confirmar y enviar registro" className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Estado *</span>
              <select name="estado_republica" required defaultValue={n.estado_republica ?? "Puebla"} className={campo}>
                <option value="" disabled>Elige tu estado</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Años en el negocio *</span>
              <input name="anios" required inputMode="numeric" defaultValue={n.anios || ""} className={campo} />
            </label>
            <CampoMayoreo minimo={n.mayoreo_minimo} unidad={n.mayoreo_unidad} requerido />
            <CamposWhatsapp valores={n.whatsapps} />
            <CamposVenta presencial={n.vende_presencial} enLinea={n.vende_en_linea} otros={n.otros_medios} />
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Días de tianguis (si vendes en tianguis)</span>
              <input name="dias_tianguis" defaultValue={n.dias_tianguis ?? ""} placeholder="Ej. martes y viernes" className={campo} />
            </label>
            <CampoMaps valor={n.maps_url} />
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Describe tu negocio (opcional)</span>
              <textarea name="descripcion" rows={3} defaultValue={n.descripcion ?? ""} maxLength={600}
                placeholder="Qué fabricas o vendes, para quién, tallas, líneas (juvenil, curvy…)" className={campo} />
            </label>
          </div>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="acepta" required className="mt-1.5" />
            <span className="text-sm">
              Confirmo que estos datos son correctos y autorizo a NEC a publicarlos en el Directorio de Proveedores una vez
              revisados, conforme al <a href="/aviso-de-privacidad" target="_blank" className="underline">aviso de privacidad</a>.
            </span>
          </label>
        </FormaAccion>
      </section>
    </div>
  );
}

async function AvisoContrasena({ searchParams }: Pick<PageProps<"/mi-negocio/registro">, "searchParams">) {
  const { listo } = await searchParams;
  return listo ? (
    <p className="rounded bg-arena p-4" role="status">
      <b>Paso 1 listo:</b> tu contraseña quedó guardada. Ahora registra los datos de tu negocio.
    </p>
  ) : null;
}
