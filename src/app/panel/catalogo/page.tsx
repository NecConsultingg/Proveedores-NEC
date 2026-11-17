import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { fecha, obtenerMiembro, rango, rpc } from "@/lib/panel";
import { nombrePublico, type Publico } from "@/lib/tipos";
import { resolverModelo } from "../acciones";
import { FormaAccion } from "../forma-accion";

export const metadata: Metadata = { title: "Catálogo" };

type Modelo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_mayoreo: string | null;
  foto_url: string | null;
  publicos: Publico[];
  estado: "pendiente" | "aprobado" | "rechazado";
  comentario_revision: string | null;
  actualizado_en: string;
  proveedor_id: string;
  proveedor: string;
  revisado_por: string | null;
  revisado_en: string | null;
};

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "aprobado", texto: "Visibles" },
  { valor: "rechazado", texto: "Ocultos por NEC" },
];

export default function CatalogoPanel({ searchParams }: PageProps<"/panel/catalogo">) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="titulo text-3xl">Catálogo de proveedores</h1>
        <p className="mt-1 text-pizarra">
          Los proveedores agregan, cambian y borran sus modelos libremente y se ven al momento en su perfil. Aquí puedes
          consultarlos y, si alguno no es apropiado (foto que no es del producto, datos de contacto distintos a los
          oficiales…), ocultarlo con un comentario para el proveedor.
        </p>
      </div>
      <Suspense fallback={<p className="text-pizarra">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/panel/catalogo">, "searchParams">) {
  const { filtro: f } = await searchParams;
  const filtro = FILTROS.some((x) => x.valor === f) ? String(f) : "todos";
  const [m, modelos] = await Promise.all([obtenerMiembro(), rpc<Modelo[]>("panel_catalogo", { filtro })]);
  const puedeResolver = rango(m.nivel) >= 2;
  return (
    <>
      <nav className="flex flex-wrap gap-2">
        {FILTROS.map((x) => (
          <Link key={x.valor} href={`/panel/catalogo?filtro=${x.valor}`}
            className={`rounded-full border px-3 py-1 text-sm ${filtro === x.valor ? "border-marino bg-marino text-humo" : "border-acero bg-white"}`}>
            {x.texto}
          </Link>
        ))}
      </nav>
      {modelos.length === 0 ? (
        <p className="rounded border border-black/5 bg-white p-5 text-pizarra">No hay modelos en esta lista.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {modelos.map((x) => (
            <li key={x.id} className="flex gap-4 rounded-md border border-black/5 bg-white p-4">
              <a href={x.foto_url ?? "#"} target="_blank" rel="noopener noreferrer" className="block w-32 shrink-0">
                {x.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- revisión interna, sin optimizar
                  <img src={x.foto_url} alt={x.nombre} className="aspect-[3/4] w-full rounded object-cover" />
                )}
              </a>
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="etiqueta text-pizarra">
                  <Link href={`/panel/proveedores/${x.proveedor_id}`} className="underline">{x.proveedor}</Link>
                </p>
                <p className="text-base font-semibold">{x.nombre}</p>
                {x.descripcion && <p className="text-pizarra">{x.descripcion}</p>}
                <p>{x.precio_mayoreo ? `${x.precio_mayoreo} mayoreo` : "Precio por WhatsApp"}</p>
                {x.publicos.length > 0 && <p>Para: {x.publicos.map(nombrePublico).join(", ")}</p>}
                <p className="text-xs text-pizarra">
                  Actualizado {fecha(x.actualizado_en)}
                  {x.revisado_por && x.estado === "rechazado" && ` · lo ocultó ${x.revisado_por} ${fecha(x.revisado_en)}`}
                </p>
                {x.estado === "rechazado" && (
                  <p className="font-semibold text-red-800">Oculto{x.comentario_revision ? `: ${x.comentario_revision}` : ""}</p>
                )}
                {puedeResolver && x.estado !== "rechazado" && (
                  <FormaAccion accion={resolverModelo} boton="Ocultar" estiloBoton="peligro" className="space-y-2 pt-2">
                    <input type="hidden" name="item" value={x.id} />
                    <input type="hidden" name="aprobar" value="no" />
                    <input name="comentario" required placeholder="Por qué se oculta (lo verá el proveedor)"
                      className="w-full rounded border border-acero px-3 py-2" />
                  </FormaAccion>
                )}
                {puedeResolver && x.estado === "rechazado" && (
                  <FormaAccion accion={resolverModelo} boton="Volver a mostrar" estiloBoton="secundario" className="pt-2">
                    <input type="hidden" name="item" value={x.id} />
                    <input type="hidden" name="aprobar" value="si" />
                  </FormaAccion>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
