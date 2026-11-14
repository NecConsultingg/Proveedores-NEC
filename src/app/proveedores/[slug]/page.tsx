import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { InsigniaSello } from "@/components/insignia-sello";
import { MapaUbicacion } from "@/components/mapa-ubicacion";
import { CALENDARIO } from "@/lib/config";
import { obtenerProveedor } from "@/lib/datos";
import { publicosDe } from "@/lib/filtros";
import { ETIQUETA_UBICACION, nombrePublico, type Proveedor } from "@/lib/tipos";

export async function generateMetadata({ params }: PageProps<"/proveedores/[slug]">): Promise<Metadata> {
  const { directorio, proveedor: p } = await obtenerProveedor((await params).slug);
  if (!p) return {};
  const esp = directorio.categorias.find((c) => c.id === p.especialidadId);
  return { title: `${p.nombre} · ${esp?.nombre ?? "Proveedor"}` };
}

const mesAnio = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { month: "short", year: "numeric", timeZone: "UTC" });

function lineaEstado(p: Proveedor) {
  switch (p.estadoSello) {
    case "aliado":
      return `Cliente de NEC · evaluación oficial en ${CALENDARIO.temporadaAuditorias}`;
    case "vigente":
      return `Evaluado ${p.evaluadoEn ? mesAnio(p.evaluadoEn) : ""} · Próxima revisión ${p.proximaRevision ? mesAnio(p.proximaRevision) : ""}`;
    case "suspendido":
      return "Suspendido mientras corrige observaciones";
    case "retirado":
      return "NEC retiró el sello a este proveedor";
  }
}

export default function PaginaProveedor({ params }: PageProps<"/proveedores/[slug]">) {
  return (
    <Suspense fallback={<div className="patron-nec h-48" />}>
      <PerfilProveedor params={params} />
    </Suspense>
  );
}

async function PerfilProveedor({ params }: Pick<PageProps<"/proveedores/[slug]">, "params">) {
  const { directorio, proveedor: p } = await obtenerProveedor((await params).slug);
  if (!p) notFound();

  const cat = (id: string | null) => directorio.categorias.find((c) => c.id === id);
  const especialidad = cat(p.especialidadId);
  const grupo = cat(especialidad?.parentId ?? null);
  const secundarias = p.secundariasIds.map(cat).filter((c) => c !== undefined);
  const publicos = publicosDe(p);
  const contactoConfirmado = Boolean(p.whatsappOficial || p.clabeTerminacion);

  const whatsapp = p.whatsappOficial
    ? `https://wa.me/${p.whatsappOficial}?text=${encodeURIComponent(
        `Hola, vi a ${p.nombre} en el Directorio NEC y me interesa comprar al mayoreo.`,
      )}`
    : null;

  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/#directorio" className="etiqueta text-acero hover:text-humo">← Volver al directorio</Link>
            <p className="etiqueta mt-5 text-acero">
              {grupo ? `${grupo.nombre} · ` : ""}Especialista en {especialidad?.nombre.toLowerCase()} · Mayoreo
            </p>
            <h1 className="titulo mt-2 text-3xl sm:text-4xl">{p.nombre}</h1>
            <p className="mt-2 text-humo/90">
              {p.municipio}, Puebla · {ETIQUETA_UBICACION[p.tipoUbicacion]} · {p.anios} años
            </p>
          </div>
          <div className="flex items-center gap-4 rounded bg-humo px-5 py-4 text-marino">
            <Image src="/brand/nec-isotipo-azul.png" alt="" width={30} height={36} />
            <div>
              <InsigniaSello estado={p.estadoSello} evaluadoEn={p.evaluadoEn} />
              <p className="mt-1 text-sm text-pizarra">{lineaEstado(p)}</p>
            </div>
          </div>
        </div>
      </section>

      {p.demo && <AvisoDemo className="mx-auto mt-6 max-w-6xl px-5" />}
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-md border border-black/5 bg-white p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="titulo text-xl">Lo que sabe NEC</h2>
              <span className="text-sm text-pizarra">Solo NEC puede editar esta sección</span>
            </div>
            {p.estadoSello === "aliado" ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                <Dato titulo="Cliente actual de NEC">Trabajamos con este negocio y lo conocemos de primera mano.</Dato>
                {contactoConfirmado ? (
                  <Dato titulo="Contacto confirmado">El WhatsApp y la cuenta publicados nos los confirmó el dueño.</Dato>
                ) : (
                  <Dato titulo="Contacto oficial" pendiente>Pendiente: NEC lo publicará cuando lo confirme con el dueño.</Dato>
                )}
                <Dato titulo="Antigüedad declarada">{p.anios} años en el negocio (se comprobará en la evaluación).</Dato>
                <Dato titulo="Evaluación oficial" pendiente>
                  Pendiente: temporada de {CALENDARIO.temporadaAuditorias}.
                </Dato>
              </ul>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                <Dato titulo="Pedidos comprobados">Guía, foto de entrega y pago con CEP de Banxico.</Dato>
                <Dato titulo="Visita a instalaciones">{ETIQUETA_UBICACION[p.tipoUbicacion]}.</Dato>
                <Dato titulo="Antigüedad comprobable">{p.anios} años en el mismo punto de venta.</Dato>
                <Dato titulo="Responsable identificado">Dueño del negocio confirmado por NEC.</Dato>
              </ul>
            )}
          </section>

          <section className="grid gap-4 rounded-md border border-black/5 bg-white p-6 sm:grid-cols-3">
            <div>
              <p className="etiqueta text-pizarra">Especialidad</p>
              <p className="mt-1 font-semibold">{especialidad?.nombre}</p>
            </div>
            <div>
              <p className="etiqueta text-pizarra">También vende</p>
              <p className="mt-1">{secundarias.length ? secundarias.map((c) => c.nombre).join(" · ") : "—"}</p>
            </div>
            <div>
              <p className="etiqueta text-pizarra">Para</p>
              <p className="mt-1">{publicos.length ? publicos.map(nombrePublico).join(" · ") : "—"}</p>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="titulo text-xl">Catálogo</h2>
              <span className="text-sm text-pizarra">Publicado por el proveedor</span>
            </div>
            {p.catalogo.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {p.catalogo.map((c, i) => (
                  <article key={`${c.nombre}-${i}`} className="overflow-hidden rounded-md border border-black/5 bg-white">
                    <div className="relative aspect-[3/4] bg-arena">
                      {c.fotoUrl ? (
                        <Image src={c.fotoUrl} alt={c.nombre} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
                      ) : (
                        <span className="etiqueta absolute inset-0 grid place-items-center text-pizarra">Foto del modelo</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="etiqueta text-pizarra">
                        {[cat(c.categoriaId)?.nombre, ...c.publicos.map(nombrePublico)].filter(Boolean).join(" · ")}
                      </p>
                      <h3 className="font-semibold">{c.nombre}</h3>
                      <p className="text-sm text-pizarra">{c.descripcion}</p>
                      <p className="text-sm">{c.precioMayoreo ? `${c.precioMayoreo} mayoreo` : "Precio por WhatsApp"}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded border border-black/10 bg-white p-5 text-pizarra">Catálogo en preparación.</p>
            )}
          </section>

          {p.ubicaciones.length > 0 && (
            <section>
              <h2 className="titulo text-xl">Dónde encontrarlo</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {p.ubicaciones.map((u, i) => (
                  <MapaUbicacion key={i} u={u} />
                ))}
              </div>
            </section>
          )}

          {p.compromisoDevolucion && (
            <section className="rounded-md bg-arena p-6">
              <h2 className="titulo text-xl">Compromiso de devolución</h2>
              <p className="mt-2">{p.compromisoDevolucion}</p>
              <p className="mt-2 text-sm text-pizarra">Firmado ante NEC.</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-black/5 bg-white p-5">
            <h2 className="titulo text-lg">Contacto oficial</h2>
            <dl className="mt-3 space-y-3">
              <Campo nombre="WhatsApp confirmado por NEC">
                {p.whatsappOficial ? `+${p.whatsappOficial}` : "Por publicar"}
              </Campo>
              <Campo nombre="Cuenta para pagos aprobada">
                {p.clabeTerminacion ? `${p.banco ?? "CLABE"} · terminación ${p.clabeTerminacion}` : "Por publicar"}
              </Campo>
              <Campo nombre="Días de tianguis">{p.diasTianguis || "—"}</Campo>
              <Campo nombre="Envíos">{p.envios || "—"}</Campo>
              <Campo nombre="Mayoreo">Desde {p.mayoreoMinimo} piezas</Campo>
            </dl>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="etiqueta mt-5 block rounded bg-marino py-3 text-center text-humo hover:bg-pizarra"
              >
                Escribir por WhatsApp
              </a>
            )}
          </section>
          <section className="rounded-md bg-marino p-5 text-humo">
            <h2 className="etiqueta">Ojo</h2>
            <p className="mt-2">
              Si te escriben de otro número o te piden pagar a otra cuenta, no es este proveedor.
            </p>
            <Link href="/verificar" className="etiqueta mt-4 inline-block rounded bg-arena px-4 py-2.5 text-marino hover:bg-white">
              Verificar un número o cuenta
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

function Dato({ titulo, children, pendiente }: { titulo: string; children: React.ReactNode; pendiente?: boolean }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className={pendiente ? "text-acero" : "text-pizarra"}>{pendiente ? "○" : "✓"}</span>
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="text-sm text-pizarra">{children}</p>
      </div>
    </li>
  );
}

function Campo({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-pizarra">{nombre}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}
