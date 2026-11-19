import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LANZAMIENTO, antesDelLanzamiento } from "@/lib/config";
import { CuentaRegresiva } from "./cuenta-regresiva";

export const metadata: Metadata = {
  title: "Muy pronto",
  description: "El directorio de proveedores NEC abre muy pronto. Los espacios ya se empezaron a ocupar.",
};

const fechaApertura = new Date(LANZAMIENTO).toLocaleDateString("es-MX", {
  weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City",
});

// Lo ven los visitantes sin sesión en el inicio, los perfiles y «Verificar número» hasta la apertura (ver proxy.ts).
export default function Proximamente() {
  return (
    <Suspense fallback={<div className="patron-nec min-h-[70vh]" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await connection(); // depende de la hora: siempre en el momento
  if (!antesDelLanzamiento()) redirect("/");
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-24">
          <p className="etiqueta text-acero">Directorio de proveedores · Texmelucan y región</p>
          <h1 className="titulo mt-4 text-4xl leading-tight sm:text-5xl">Muy pronto.</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-humo/90">
            Abrimos el directorio el <b className="text-humo">{fechaApertura}</b>. Lo mejor de lo mejor del mayoreo, en un
            solo lugar.
          </p>
          <div className="mx-auto mt-10 max-w-xl">
            <CuentaRegresiva hasta={LANZAMIENTO} />
          </div>
        </div>
      </section>

      <section className="bg-arena">
        <div className="mx-auto max-w-3xl px-5 py-8 text-center">
          <p className="etiqueta font-semibold">Los espacios ya se empezaron a ocupar</p>
          <p className="mt-1 text-sm">Cada categoría tiene lugares limitados, y solo entran los mejores.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 py-12 sm:grid-cols-2">
        <div className="flex flex-col rounded-md border border-black/5 bg-white p-6">
          <p className="etiqueta text-pizarra">¿Ya eres proveedor NEC?</p>
          <h2 className="titulo mt-2 text-xl">Registra tu negocio</h2>
          <p className="mt-2 flex-1 text-pizarra">
            Entra con el correo y la contraseña temporal que te mandamos, y deja listo tu negocio antes de la apertura.
          </p>
          <Link href="/acceso" className="etiqueta mt-5 block rounded bg-marino py-3 text-center text-humo hover:bg-pizarra">
            Iniciar sesión
          </Link>
        </div>
        <div className="flex flex-col rounded-md border border-black/5 bg-white p-6">
          <p className="etiqueta text-pizarra">¿Tu negocio está entre los mejores?</p>
          <h2 className="titulo mt-2 text-xl">Aplica a un espacio</h2>
          <p className="mt-2 flex-1 text-pizarra">Postúlate como proveedor candidato antes de que se ocupen los lugares.</p>
          <Link href="/quiero-ser-auditado" className="etiqueta mt-5 block rounded border border-marino py-3 text-center text-marino hover:bg-humo">
            Aplicar
          </Link>
        </div>
      </div>
    </>
  );
}
