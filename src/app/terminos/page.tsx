import type { Metadata } from "next";
import { PaginaLegal } from "@/components/pagina-legal";
import { RESPONSABLE } from "@/lib/config";

// BORRADOR legal: fuera de buscadores hasta que lo apruebe el abogado (quitar «robots» al aprobarlo).
export const metadata: Metadata = { title: "Términos y condiciones", robots: { index: false, follow: true } };

export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos y condiciones">
      <h2>Qué es este directorio</h2>
      <p>
        Un listado de proveedores de ropa y calzado al mayoreo elaborado por NEC. Durante el piloto (diciembre 2026 a marzo 2027) los
        proveedores listados son clientes actuales de NEC y todavía no han pasado por la evaluación oficial.
      </p>
      <h2>Qué no es</h2>
      <p>
        «Verificado por NEC» es una evaluación privada del historial del proveedor a la fecha de revisión. No es una
        certificación oficial ni garantiza operaciones futuras.
      </p>
      <h2>NEC no es parte de la compraventa</h2>
      <p>
        Los acuerdos de precio, pago, envío y devolución son entre el comprador y el proveedor. Antes de pagar, confirma
        que hablas con el WhatsApp publicado en el perfil.
      </p>
      <h2>Quejas</h2>
      <p>
        Las quejas requieren pruebas (comprobante de pago CEP, conversación con el proveedor y guía, si aplica) y se
        tratan de forma confidencial mientras se revisan.
      </p>
      <h2>Contacto</h2>
      <p>
        Para dudas, reportes o quejas escribe a{" "}
        <a href={`mailto:${RESPONSABLE.correo}`} className="underline">{RESPONSABLE.correo}</a>.
      </p>
    </PaginaLegal>
  );
}
