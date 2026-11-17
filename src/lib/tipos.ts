// Estados del sello. "aliado" = proveedor del piloto de diciembre 2026: cliente de NEC,
// todavía SIN auditoría oficial. No se le puede llamar "Verificado" (Profeco).
export type EstadoSello = "aliado" | "vigente" | "suspendido" | "retirado";

export type TipoUbicacion = "fabrica" | "puesto" | "fabrica_y_puesto";

export type Publico = "dama" | "caballero" | "nina" | "nino" | "bebe" | "unisex";

export const PUBLICOS: { valor: Publico; nombre: string }[] = [
  { valor: "dama", nombre: "Dama" },
  { valor: "caballero", nombre: "Caballero" },
  { valor: "nina", nombre: "Niña" },
  { valor: "nino", nombre: "Niño" },
  { valor: "bebe", nombre: "Bebé" },
  { valor: "unisex", nombre: "Unisex" },
];

export const nombrePublico = (p: Publico) => PUBLICOS.find((x) => x.valor === p)?.nombre ?? p;

// Jerarquía: sector (1) → categoría (2) → subcategoría (3). El cupo vive en la subcategoría.
export interface Categoria {
  id: string;
  parentId: string | null;
  nivel: 1 | 2 | 3;
  slug: string;
  nombre: string;
  cupo: number | null;
  orden: number;
}

export interface Subcategoria extends Categoria {
  grupo: Categoria; // su categoría de nivel 2
  ocupados: number; // proveedores publicados con esta especialidad
}

export interface CatalogoItem {
  nombre: string;
  descripcion: string;
  precioMayoreo: string | null;
  fotoUrl: string | null;
  categoriaId: string | null;
  publicos: Publico[];
}

export interface Ubicacion {
  tipo: "fabrica" | "puesto";
  descripcion: string;
  lat: number | null; // sin coordenadas = solo se publica la zona
  lng: number | null;
}

export interface Proveedor {
  slug: string;
  nombre: string;
  especialidadId: string;
  secundariasIds: string[];
  estado: string | null; // estado de la República
  vendePresencial: boolean;
  vendeEnLinea: boolean;
  otrosMedios: string | null;
  mapsUrl: string | null; // enlace de Google Maps que puso el proveedor
  anios: number;
  mayoreoMinimo: number;
  descripcion: string;
  estadoSello: EstadoSello;
  evaluadoEn: string | null; // ISO date
  proximaRevision: string | null;
  whatsappOficial: string | null; // solo dígitos con lada, ej. 522481234567
  banco: string | null;
  clabeTerminacion: string | null;
  diasTianguis: string;
  envios: string;
  compromisoDevolucion: string | null;
  fotoPortadaUrl: string | null;
  catalogo: CatalogoItem[];
  ubicaciones: Ubicacion[];
  demo: boolean; // proveedor ficticio para pruebas
}

export interface Directorio {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  proveedores: Proveedor[];
}

export interface SolicitudAuditoria {
  nombreNegocio: string;
  nombreResponsable: string;
  whatsapp: string;
  correo: string;
  especialidadSlug: string;
  vendePresencial: boolean;
  vendeEnLinea: boolean;
  otrosMedios: string;
  estado: string;
  anios: number;
  redes: string;
  clienteNec: boolean;
  comentarios: string;
}

export const ETIQUETA_UBICACION: Record<TipoUbicacion, string> = {
  fabrica: "fábrica",
  puesto: "puesto en tianguis",
  fabrica_y_puesto: "fábrica y puesto en tianguis",
};
