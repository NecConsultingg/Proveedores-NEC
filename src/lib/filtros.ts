import type { Categoria, Directorio, Proveedor, Publico } from "./tipos";

// Reglas del directorio (decididas el 10-nov-2026):
// * Un proveedor aparece en su especialidad y en sus categorías secundarias (máx. 2).
// * Quien tiene la especialidad buscada sale primero, marcado como «Especialista».
// * El público (dama, caballero…) sale del catálogo. Lo unisex cuenta para dama y caballero.

export interface Resultado {
  proveedor: Proveedor;
  especialidad: Categoria | undefined;
  especialista: boolean; // su especialidad está dentro del filtro de categoría
  publicos: Publico[]; // públicos de su catálogo dentro del filtro
}

export function normalizar(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function publicosDe(p: Proveedor, categorias?: Set<string>): Publico[] {
  const set = new Set<Publico>();
  for (const item of p.catalogo) {
    if (categorias && (!item.categoriaId || !categorias.has(item.categoriaId))) continue;
    item.publicos.forEach((x) => set.add(x));
  }
  const orden: Publico[] = ["dama", "caballero", "nina", "nino", "bebe", "unisex"];
  return orden.filter((x) => set.has(x));
}

export function filtrar(
  d: Directorio,
  { cat, publico, q }: { cat?: string; publico?: Publico; q?: string },
): Resultado[] {
  const porId = new Map(d.categorias.map((c) => [c.id, c]));
  const elegida = cat ? d.categorias.find((c) => c.slug === cat) : undefined;

  // Subcategorías que cubre el filtro de categoría (una subcategoría o todas las de una categoría).
  let ids: Set<string> | undefined;
  if (elegida?.nivel === 3) ids = new Set([elegida.id]);
  if (elegida?.nivel === 2) ids = new Set(d.subcategorias.filter((s) => s.parentId === elegida.id).map((s) => s.id));

  const palabras = q ? normalizar(q).split(/\s+/).filter(Boolean) : [];

  const resultados: Resultado[] = [];
  for (const p of d.proveedores) {
    const suyas = [p.especialidadId, ...p.secundariasIds];
    if (ids && !suyas.some((id) => ids.has(id))) continue;

    const publicos = publicosDe(p, ids);
    if (publico) {
      const aplica = publicos.includes(publico) ||
        ((publico === "dama" || publico === "caballero") && publicos.includes("unisex"));
      if (!aplica) continue;
    }

    if (palabras.length) {
      const nombresCat = suyas.map((id) => porId.get(id)?.nombre ?? "").join(" ");
      const modelos = p.catalogo.map((c) => `${c.nombre} ${c.descripcion}`).join(" ");
      const texto = normalizar(`${p.nombre} ${p.municipio} ${p.descripcion} ${nombresCat} ${modelos}`);
      if (!palabras.every((w) => texto.includes(w))) continue;
    }

    resultados.push({
      proveedor: p,
      especialidad: porId.get(p.especialidadId),
      especialista: ids ? ids.has(p.especialidadId) : false,
      publicos,
    });
  }

  return resultados.sort(
    (a, b) => Number(b.especialista) - Number(a.especialista) || a.proveedor.nombre.localeCompare(b.proveedor.nombre, "es"),
  );
}
