import type { Metadata } from "next";
import { PaginaLegal } from "@/components/pagina-legal";
import { RESPONSABLE } from "@/lib/config";

// BORRADOR legal: fuera de buscadores hasta que lo apruebe el abogado (quitar «robots» al aprobarlo).
export const metadata: Metadata = { title: "Aviso de privacidad", robots: { index: false, follow: true } };

export default function AvisoPrivacidad() {
  return (
    <PaginaLegal titulo="Aviso de privacidad">
      <p>
        {RESPONSABLE.nombre}, con domicilio en {RESPONSABLE.domicilio ?? "[domicilio pendiente]"}, es responsable del
        tratamiento de los datos personales que nos proporcionas en este sitio, operado bajo la marca NEC.
      </p>
      <h2>Qué datos recabamos</h2>
      <p>
        En el formulario «Quiero ser auditado»: nombre del negocio y del responsable, número de WhatsApp, correo
        electrónico (opcional), estado, formato de venta, especialidad, antigüedad y redes sociales. En «Verificar número o cuenta» no
        guardamos el número ni la cuenta que escribes.
      </p>
      <h2>Para qué los usamos</h2>
      <p>
        Para contactarte sobre la temporada de evaluación, organizar la auditoría y, si resultas verificado y lo autorizas
        por escrito, publicar tu perfil en el directorio.
      </p>
      <h2>Con quién los compartimos</h2>
      <p>No vendemos ni compartimos tus datos con terceros, salvo obligación legal.</p>
      <h2>Derechos ARCO</h2>
      <p>
        Puedes pedir acceso, rectificación, cancelación u oposición al uso de tus datos escribiendo a{" "}
        <a href={`mailto:${RESPONSABLE.correo}`} className="underline">{RESPONSABLE.correo}</a>.
      </p>
    </PaginaLegal>
  );
}
