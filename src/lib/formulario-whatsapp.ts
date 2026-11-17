import { MAX_WHATSAPPS, normalizarWhatsapp } from "./venta";

// Lee los campos «whatsapps» de un formulario. Ignora los vacíos (basta con uno).
export function leerWhatsapps(fd: FormData): { numeros: string[]; error?: string } {
  const crudos = fd.getAll("whatsapps").map((v) => String(v).trim()).filter(Boolean);
  if (crudos.length > MAX_WHATSAPPS) return { numeros: [], error: `Máximo ${MAX_WHATSAPPS} números de WhatsApp.` };
  const numeros: string[] = [];
  for (const c of crudos) {
    const n = normalizarWhatsapp(c);
    if (!n) return { numeros: [], error: `«${c}» no es un WhatsApp de 10 dígitos.` };
    if (!numeros.includes(n)) numeros.push(n);
  }
  return { numeros };
}
