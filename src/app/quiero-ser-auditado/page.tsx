import type { Metadata } from "next";
import { CALENDARIO } from "@/lib/config";
import { obtenerDirectorio } from "@/lib/datos";
import { Formulario } from "./formulario";

export const metadata: Metadata = { title: "Quiero ser auditado" };

const PASOS = [
  ["Solicitud", `Llena el formulario antes del ${CALENDARIO.cierreConvocatoria}.`],
  ["Preselección", "A finales de enero asignamos los lugares por especialidad y firmamos el contrato."],
  ["Auditoría", `En ${CALENDARIO.temporadaAuditorias}: pedidos comprobados, visita y compromiso de devolución.`],
  ["Publicación", `Los proveedores verificados se publican en la ${CALENDARIO.publicacion}.`],
];

export default async function QuieroSerAuditado() {
  const { subcategorias } = await obtenerDirectorio();
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <p className="etiqueta text-acero">Temporada de evaluación 2027</p>
          <h1 className="titulo mt-3 text-3xl sm:text-4xl">Quiero ser auditado</h1>
          <p className="mt-3 max-w-2xl text-humo/90">
            Hay pocos lugares por especialidad y cada proveedor ocupa uno solo, aunque venda para dama, caballero y niño. Si vendes ropa al mayoreo en Texmelucan o la región, aparta tu
            lugar para la evaluación de febrero.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_300px]">
        <Formulario subcategorias={subcategorias} />
        <aside>
          <h2 className="titulo text-lg">Cómo sigue</h2>
          <ol className="mt-4 space-y-4">
            {PASOS.map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="titulo grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marino text-sm text-humo">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-pizarra">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
