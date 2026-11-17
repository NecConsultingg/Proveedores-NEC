// Formato de venta, estados y ubicación en Google Maps (decidido 16-nov-2026).
// Se usa en el servidor y en el navegador: no importar nada de servidor aquí.

export const ESTADOS = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
  "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro",
  "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz",
  "Yucatán", "Zacatecas",
] as const;

// Ideas que se ofrecen al llenar «Otros medios», para que el proveedor entienda qué poner.
export const SUGERENCIAS_OTROS = [
  "Tienda en línea propia",
  "Mercado Libre",
  "Amazon",
  "Facebook Marketplace",
  "Instagram",
  "TikTok Shop",
  "Catálogo por WhatsApp",
  "Venta por catálogo",
  "Distribuidores o revendedores",
];

// Misma regla que la base de datos: solo enlaces de Google Maps.
export const PATRON_MAPS = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.com(\.mx)?\/maps|maps\.google\.com(\.mx)?\/)/;

export function formatoVenta(p: { vendePresencial: boolean; vendeEnLinea: boolean; otrosMedios: string | null }) {
  const partes: string[] = [];
  if (p.vendePresencial) partes.push("Presencial");
  if (p.vendeEnLinea) partes.push("En línea");
  if (p.otrosMedios?.trim()) partes.push(p.otrosMedios.trim());
  return partes;
}

export const MAX_WHATSAPPS = 5;

// «248 123 4567» → «522481234567». Devuelve null si no tiene 10 dígitos (o 12–13 con lada).
export function normalizarWhatsapp(crudo: string): string | null {
  const d = crudo.replace(/\D/g, "");
  if (d.length === 10) return `52${d}`;
  if (d.length >= 12 && d.length <= 13) return d;
  return null;
}

// «522481234567» → «248 123 4567» para mostrar.
export function mostrarWhatsapp(n: string) {
  const d = n.replace(/^52(1)?/, "");
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : n;
}

// Unidad del mínimo de mayoreo. «Otra» deja escribir la del proveedor (p. ej. «camisas», «rollos»).
export const UNIDADES_MAYOREO = [
  { valor: "piezas", nombre: "Piezas", singular: "pieza" },
  { valor: "paquetes", nombre: "Paquetes", singular: "paquete" },
  { valor: "docenas", nombre: "Docenas", singular: "docena" },
  { valor: "cajas", nombre: "Cajas", singular: "caja" },
  { valor: "pares", nombre: "Pares", singular: "par" },
  { valor: "juegos", nombre: "Juegos", singular: "juego" },
];

// «12 paquetes», «1 docena», «20 camisas».
export function textoMayoreo(cantidad: number, unidad: string | null | undefined) {
  const u = (unidad || "piezas").trim();
  const conocida = UNIDADES_MAYOREO.find((x) => x.valor === u.toLowerCase());
  return `${cantidad} ${cantidad === 1 && conocida ? conocida.singular : u}`;
}
