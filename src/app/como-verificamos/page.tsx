import type { Metadata } from "next";
import Link from "next/link";
import { CALENDARIO, FUNCIONES } from "@/lib/config";

export const metadata: Metadata = { title: "Cómo verificamos" };

// BORRADOR de criterios públicos (tarea 2.1 del cronograma). Revisar con abogado antes de publicar.
const CRITERIOS = [
  ["Pedidos 100% comprobables", "Número de guía rastreable, foto de entrega y pago validado con el CEP de Banxico (fecha, monto, clave de rastreo y bancos)."],
  ["Visita a instalaciones", "Vamos a la fábrica, al taller o al puesto del tianguis."],
  ["Confirmaciones de compradores", "Solo opinan compradores con un pedido comprobado."],
  ["Antigüedad comprobable", "Años en el mismo punto de venta y antigüedad de sus redes sociales."],
  ["Identidad del dueño", "Quien dice ser el dueño lo tiene que demostrar."],
  ...(FUNCIONES.compromisoDevolucion ? [["Compromiso de devolución", "Condiciones por escrito, firmadas por el proveedor ante NEC."]] : []),
  ["Contacto oficial", `Solo publicamos el WhatsApp${FUNCIONES.clabe ? " y la cuenta de pago" : ""} que NEC confirmó con el dueño.`],
];

const RETIRO = [
  "Fraude comprobado: cobrar y no entregar, o entregar algo muy distinto a lo pactado.",
  "Presentar evidencias falsas o alteradas.",
  "Suplantar a otro proveedor o prestar el sello.",
  "Vender mercancía robada o pirata.",
];

const SUSPENSION = [
  "Varias quejas comprobadas en poco tiempo (por ejemplo, 3 en 6 meses).",
  ...(FUNCIONES.compromisoDevolucion ? ["No cumplir su compromiso de devolución."] : []),
  "No renovar la evaluación a tiempo.",
  "No responder a una mediación.",
];

export default function ComoVerificamos() {
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <p className="etiqueta text-acero">Criterios públicos</p>
          <h1 className="titulo mt-3 text-3xl sm:text-4xl">Cómo verificamos</h1>
          <p className="mt-3 max-w-2xl text-humo/90">
            «Verificado por NEC» es una evaluación privada con criterios propios y públicos. No es una certificación
            oficial. Paga el proveedor evaluado, nunca quien consulta el directorio.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-5 py-12">
        <section className="rounded-md bg-arena p-6">
          <h2 className="titulo text-xl">Calendario 2027</h2>
          <ul className="mt-3 space-y-1">
            <li><strong>Hasta el {CALENDARIO.cierreConvocatoria}:</strong> recibimos solicitudes.</li>
            <li><strong>{CALENDARIO.temporadaAuditorias[0].toUpperCase() + CALENDARIO.temporadaAuditorias.slice(1)}:</strong> temporada de auditorías.</li>
            <li><strong>{CALENDARIO.publicacion[0].toUpperCase() + CALENDARIO.publicacion.slice(1)}:</strong> publicamos a los proveedores verificados.</li>
          </ul>
          <p className="mt-3 text-sm text-pizarra">
            Mientras tanto, el directorio muestra a proveedores aliados: clientes actuales de NEC que todavía no pasan por la
            evaluación oficial.
          </p>
        </section>

        <section>
          <h2 className="titulo text-2xl">Qué revisamos</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {CRITERIOS.map(([t, d]) => (
              <li key={t} className="rounded-md border border-black/5 bg-white p-5">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-pizarra">{d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-pizarra">
            Lugares limitados por especialidad (por ejemplo, 3 en jeans y 2 en pantalón de vestir). Cada proveedor ocupa un solo lugar, en su especialidad, aunque venda para dama, caballero y niño. Ser cliente de NEC da prioridad para la
            evaluación, nunca el sello automático.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="titulo text-xl">Retiro inmediato del sello</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">{RETIRO.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div>
            <h2 className="titulo text-xl">Suspensión con plazo para corregir</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">{SUSPENSION.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <p className="text-sm text-pizarra md:col-span-2">
            Todo se hace por escrito: queja → aviso al proveedor → plazo para presentar pruebas → decisión por escrito.
          </p>
        </section>

        <section className="rounded-md bg-marino p-6 text-humo">
          <h2 className="titulo text-xl">¿Eres proveedor?</h2>
          <p className="mt-2">Aparta tu lugar para la temporada de febrero.</p>
          <Link href="/quiero-ser-auditado" className="etiqueta mt-4 inline-block rounded bg-arena px-5 py-3 text-marino">
            Quiero ser auditado
          </Link>
        </section>
      </div>
    </>
  );
}
