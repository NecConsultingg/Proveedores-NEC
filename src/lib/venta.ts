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
