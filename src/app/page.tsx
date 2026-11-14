import Link from "next/link";
import { Suspense } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { TarjetaProveedor } from "@/components/tarjeta-proveedor";
import { CALENDARIO, LEYENDA_PILOTO } from "@/lib/config";
import { obtenerDirectorio } from "@/lib/datos";
import { filtrar } from "@/lib/filtros";
import { PUBLICOS, type Publico } from "@/lib/tipos";

const PILARES = [
  { titulo: "Clientes de NEC", texto: "Negocios con los que ya trabajamos y conocemos de primera mano." },
  { titulo: "Contacto oficial", texto: "Solo publicamos el WhatsApp y la cuenta que el dueño nos confirmó." },
  { titulo: "Evaluación en febrero", texto: "En la temporada 2027 revisaremos pedidos, pagos e instalaciones." },
  { titulo: "Lugares limitados", texto: "Pocos especialistas por categoría, para que el directorio tenga filtro." },
];

type Filtros = { cat?: string; publico?: Publico; q?: string };

export default function Inicio({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Portada />
      <Suspense fallback={<div className="mx-auto h-96 max-w-6xl px-5 py-12 text-pizarra">Cargando directorio…</div>}>
        <Directorio searchParams={searchParams} />
      </Suspense>
      <LlamadoProveedores />
    </>
  );
}

function enlace(f: Filtros) {
  const params = new URLSearchParams();
  if (f.cat) params.set("cat", f.cat);
  if (f.publico) params.set("publico", f.publico);
  if (f.q) params.set("q", f.q);
  const s = params.toString();
  return `/${s ? `?${s}` : ""}#directorio`;
}

async function Directorio({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");
  const d = await obtenerDirectorio();

  const cat = texto(sp.cat) || undefined;
  const publico = PUBLICOS.some((p) => p.valor === sp.publico) ? (sp.publico as Publico) : undefined;
  const q = texto(sp.q) || undefined;
  const f: Filtros = { cat, publico, q };

  const elegida = d.categorias.find((c) => c.slug === cat);
  const grupoActivo = elegida?.nivel === 3 ? d.categorias.find((c) => c.id === elegida.parentId) : elegida;
  const grupos = d.categorias.filter((c) => c.nivel === 2);
  const subcategorias = grupoActivo ? d.subcategorias.filter((s) => s.parentId === grupoActivo.id) : [];
  const resultados = filtrar(d, f);

  return (
    <section id="directorio" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="titulo text-2xl">Directorio</h2>
        <p className="text-sm text-pizarra">{LEYENDA_PILOTO}</p>
      </div>
      {d.proveedores.some((p) => p.demo) && <AvisoDemo className="mt-4" />}

      <div className="mt-6 space-y-3">
        <FilaFiltros titulo="Categoría">
          <Chip href={enlace({ ...f, cat: undefined })} activo={!grupoActivo}>Todas</Chip>
          {grupos.map((g) => (
            <Chip key={g.slug} href={enlace({ ...f, cat: g.slug })} activo={grupoActivo?.id === g.id}>
              {g.nombre}
            </Chip>
          ))}
        </FilaFiltros>

        {subcategorias.length > 0 && (
          <FilaFiltros titulo="Tipo">
            <Chip href={enlace({ ...f, cat: grupoActivo!.slug })} activo={elegida?.nivel === 2}>
              Todo {grupoActivo!.nombre.toLowerCase()}
            </Chip>
            {subcategorias.map((s) => (
              <Chip key={s.slug} href={enlace({ ...f, cat: s.slug })} activo={elegida?.id === s.id}>
                {s.nombre}{" "}
                <span className="opacity-70">
                  · {s.ocupados} de {s.cupo} lugares
                </span>
              </Chip>
            ))}
          </FilaFiltros>
        )}

        <FilaFiltros titulo="Para">
          <Chip href={enlace({ ...f, publico: undefined })} activo={!publico}>Todos</Chip>
          {PUBLICOS.map((p) => (
            <Chip key={p.valor} href={enlace({ ...f, publico: p.valor })} activo={publico === p.valor}>
              {p.nombre}
            </Chip>
          ))}
        </FilaFiltros>
      </div>

      <p className="mt-6 text-sm text-pizarra" aria-live="polite">
        {resultados.length} {resultados.length === 1 ? "proveedor" : "proveedores"}
        {q && <> para «{q}»</>}
        {(cat || publico || q) && (
          <>
            {" · "}
            <Link href="/#directorio" scroll={false} className="underline">Quitar filtros</Link>
          </>
        )}
      </p>

      {resultados.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {resultados.map((r) => (
            <TarjetaProveedor key={r.proveedor.slug} r={r} />
          ))}
        </div>
      ) : d.proveedores.length === 0 ? (
        <p className="mt-6 rounded border border-black/10 bg-white p-6 text-center">
          Estamos dando de alta a los primeros proveedores aliados. Vuelve pronto.
        </p>
      ) : (
        <p className="mt-6 rounded border border-black/10 bg-white p-6 text-center">
          No encontramos proveedores con esos filtros.{" "}
          <Link href="/#directorio" scroll={false} className="underline">Ver todos</Link>
        </p>
      )}
    </section>
  );
}

function FilaFiltros({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="etiqueta w-full text-pizarra sm:w-24">{titulo}</span>
      {children}
    </div>
  );
}

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm ${
        activo ? "border-marino bg-marino text-humo" : "border-acero bg-white hover:border-marino"
      }`}
    >
      {children}
    </Link>
  );
}

function Portada() {
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="etiqueta text-acero">Directorio de proveedores · Texmelucan y región</p>
          <h1 className="titulo mt-4 max-w-xl text-4xl leading-tight sm:text-5xl">Proveedores que sí cumplen.</h1>
          <p className="mt-5 max-w-xl text-lg text-humo/90">
            Empezamos con los proveedores de ropa al mayoreo con los que NEC ya trabaja. En febrero de 2027 arranca la
            primera temporada oficial de evaluación: pedidos comprobados, visita a instalaciones y compromiso de
            devolución por escrito.
          </p>
          <form action="/#directorio" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="q" className="sr-only">Buscar proveedor o producto</label>
            <input
              id="q"
              name="q"
              placeholder="Busca por producto, ej. jeans, faldas, fajas"
              className="flex-1 rounded bg-humo px-4 py-3 text-marino placeholder:text-pizarra/70"
            />
            <button className="etiqueta rounded bg-acero px-6 py-3 text-marino hover:bg-arena">Buscar</button>
          </form>
          <p className="mt-6 max-w-xl text-humo/90">
            ¿Te escribió un número que dice ser proveedor?{" "}
            <Link href="/verificar" className="font-semibold underline underline-offset-4">Verifícalo antes de pagar</Link>.
          </p>
        </div>
      </section>

      <section className="bg-arena">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((p) => (
            <div key={p.titulo}>
              <h2 className="etiqueta font-semibold">{p.titulo}</h2>
              <p className="mt-1 text-sm">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LlamadoProveedores() {
  return (
    <section className="patron-nec text-humo">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="etiqueta text-acero">¿Eres proveedor?</p>
          <h2 className="titulo mt-2 text-3xl">Temporada de evaluación 2027</h2>
          <p className="mt-3 text-humo/90">
            Las auditorías son en {CALENDARIO.temporadaAuditorias} y los resultados se publican en la{" "}
            {CALENDARIO.publicacion}. Hay pocos lugares por especialidad. Recibimos solicitudes hasta el{" "}
            {CALENDARIO.cierreConvocatoria}.
          </p>
        </div>
        <Link href="/quiero-ser-auditado" className="etiqueta shrink-0 rounded bg-arena px-6 py-3.5 text-marino hover:bg-white">
          Quiero ser auditado
        </Link>
      </div>
    </section>
  );
}
