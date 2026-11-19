"use client";

import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { comprimirFoto } from "@/lib/foto";
import { PUBLICOS } from "@/lib/tipos";
import { borrarModelo, guardarModelo } from "../acciones";

export type ItemCatalogo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_mayoreo: string | null;
  foto_url: string | null;
  publicos: string[];
  estado: "pendiente" | "aprobado" | "rechazado";
  comentario_revision: string | null;
};

const MAXIMO = 12;
const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";
const ESTADO: Record<ItemCatalogo["estado"], { texto: string; clase: string }> = {
  pendiente: { texto: "Visible en tu perfil", clase: "bg-emerald-100 text-emerald-900" },
  aprobado: { texto: "Visible en tu perfil", clase: "bg-emerald-100 text-emerald-900" },
  rechazado: { texto: "Oculto por NEC", clase: "bg-red-100 text-red-900" },
};

const supabase = () =>
  supabaseNavegador();

// Ruta dentro del bucket a partir de la URL pública (…/object/public/catalogo/<ruta>).
const rutaDe = (url: string | null | undefined) => url?.split("/object/public/catalogo/")[1];

export function EditorCatalogo({ items, proveedorId }: { items: ItemCatalogo[]; proveedorId: string }) {
  const [editando, setEditando] = useState<ItemCatalogo | "nuevo" | null>(items.length === 0 ? "nuevo" : null);
  const [aviso, setAviso] = useState("");
  const router = useRouter();

  async function borrar(item: ItemCatalogo) {
    if (!window.confirm(`¿Borrar «${item.nombre}» de tu catálogo?`)) return;
    const r = await borrarModelo(item.id);
    setAviso(r.mensaje);
    const ruta = rutaDe(r.fotoUrl);
    if (r.ok && ruta) await supabase().storage.from("catalogo").remove([ruta]);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {aviso && <p className="rounded bg-arena p-3" role="status">{aviso}</p>}

      {editando ? (
        <FormularioModelo
          key={editando === "nuevo" ? "nuevo" : editando.id}
          item={editando === "nuevo" ? null : editando}
          proveedorId={proveedorId}
          alTerminar={(mensaje) => {
            setEditando(null);
            setAviso(mensaje);
            router.refresh();
          }}
          alCancelar={items.length ? () => setEditando(null) : undefined}
        />
      ) : (
        items.length < MAXIMO && (
          <button onClick={() => { setAviso(""); setEditando("nuevo"); }}
            className="etiqueta rounded bg-marino px-5 py-3 text-humo hover:bg-pizarra">
            + Agregar modelo
          </button>
        )
      )}

      <p className="text-sm text-pizarra">{items.length} de {MAXIMO} modelos</p>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((i) => (
          <li key={i.id} className="overflow-hidden rounded-md border border-black/5 bg-white">
            <div className="relative aspect-[3/4] bg-arena">
              {i.foto_url && (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa del propio proveedor, sin optimizar
                <img src={i.foto_url} alt={i.nombre} className="h-full w-full object-cover" loading="lazy" />
              )}
              <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-semibold ${ESTADO[i.estado].clase}`}>
                {ESTADO[i.estado].texto}
              </span>
            </div>
            <div className="space-y-1 p-3 text-sm">
              <p className="font-semibold">{i.nombre}</p>
              {i.precio_mayoreo && <p>{i.precio_mayoreo} mayoreo</p>}
              {i.estado === "rechazado" && i.comentario_revision && (
                <p className="text-red-800">NEC lo ocultó: {i.comentario_revision}. Corrígelo y guárdalo para mostrarlo otra vez.</p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setAviso(""); setEditando(i); }} className="underline">Editar</button>
                <button onClick={() => borrar(i)} className="text-red-800 underline">Borrar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormularioModelo({
  item,
  proveedorId,
  alTerminar,
  alCancelar,
}: {
  item: ItemCatalogo | null;
  proveedorId: string;
  alTerminar: (mensaje: string) => void;
  alCancelar?: () => void;
}) {
  const [foto, setFoto] = useState<Blob | null>(null);
  const [vista, setVista] = useState<string | null>(item?.foto_url ?? null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  async function elegirFoto(archivo: File | undefined) {
    setError("");
    if (!archivo) return;
    try {
      const blob = await comprimirFoto(archivo);
      setFoto(blob);
      setVista(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos usar esa foto.");
    }
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!foto && !item?.foto_url) return setError("Agrega una foto del modelo.");
    setGuardando(true);
    const cliente = supabase();
    let fotoUrl = item?.foto_url ?? "";
    let subida: string | null = null;
    if (foto) {
      subida = `${proveedorId}/${crypto.randomUUID()}.jpg`;
      const { error: e2 } = await cliente.storage.from("catalogo").upload(subida, foto, { contentType: "image/jpeg" });
      if (e2) {
        setGuardando(false);
        return setError("No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.");
      }
      fotoUrl = cliente.storage.from("catalogo").getPublicUrl(subida).data.publicUrl;
    }
    const r = await guardarModelo({
      id: item?.id,
      nombre: String(fd.get("nombre") ?? ""),
      descripcion: String(fd.get("descripcion") ?? ""),
      precio: String(fd.get("precio") ?? ""),
      fotoUrl,
      publicos: fd.getAll("publicos").map(String),
    });
    if (!r.ok) {
      if (subida) await cliente.storage.from("catalogo").remove([subida]); // no dejar fotos huérfanas
      setGuardando(false);
      return setError(r.mensaje);
    }
    // Si cambió la foto, se borra la anterior.
    const anterior = rutaDe(item?.foto_url);
    if (subida && anterior) await cliente.storage.from("catalogo").remove([anterior]);
    alTerminar(r.mensaje);
  }

  return (
    <form onSubmit={guardar} className="grid gap-5 rounded-md border border-black/5 bg-white p-5 sm:grid-cols-[200px_1fr]">
      <div>
        <button type="button" onClick={() => entrada.current?.click()}
          className="relative block aspect-[3/4] w-full overflow-hidden rounded border-2 border-dashed border-acero bg-humo hover:border-marino">
          {vista ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local de la foto elegida
            <img src={vista} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center p-3 text-center text-sm text-pizarra">
              Toca para elegir o tomar una foto
            </span>
          )}
        </button>
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
        {vista && (
          <button type="button" onClick={() => entrada.current?.click()} className="mt-2 text-sm underline">Cambiar foto</button>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="titulo text-xl">{item ? "Editar modelo" : "Nuevo modelo"}</h2>
        <label className="block">
          <span className="text-sm font-semibold">Nombre del modelo *</span>
          <input name="nombre" required minLength={2} maxLength={80} defaultValue={item?.nombre ?? ""}
            placeholder="Ej. Jean skinny tiro alto" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Descripción (opcional)</span>
          <textarea name="descripcion" rows={2} maxLength={300} defaultValue={item?.descripcion ?? ""}
            placeholder="Tallas, colores, tela…" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Precio de mayoreo (opcional)</span>
          <input name="precio" maxLength={40} defaultValue={item?.precio_mayoreo ?? ""} placeholder="Ej. $180 por pieza" className={campo} />
          <span className="text-xs text-pizarra">Si lo dejas vacío, se muestra «Precio por WhatsApp».</span>
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">¿Para quién es?</legend>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
            {PUBLICOS.map((p) => (
              <label key={p.valor} className="flex items-center gap-2">
                <input type="checkbox" name="publicos" value={p.valor} defaultChecked={item?.publicos.includes(p.valor)} />
                {p.nombre}
              </label>
            ))}
          </div>
          <span className="text-xs text-pizarra">Así los compradores te encuentran al filtrar por dama, caballero, etc.</span>
        </fieldset>
        {error && <p className="text-red-700" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button disabled={guardando} className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra disabled:opacity-60">
            {guardando ? "Guardando…" : item ? "Guardar cambios" : "Agregar al catálogo"}
          </button>
          {alCancelar && <button type="button" onClick={alCancelar} className="underline">Cancelar</button>}
        </div>
      </div>
    </form>
  );
}
