// Fechas del calendario 2026–2027 (ver "Cronograma NEC Verificado.xlsx").
export const CALENDARIO = {
  cierreConvocatoria: "22 de enero de 2027",
  temporadaAuditorias: "febrero y marzo de 2027",
  publicacion: "primera semana de abril de 2027",
};

// Opciones apagadas por ahora (16-nov-2026): se encienden cuando la etapa lo pida. Los datos guardados no se borran.
export const FUNCIONES = {
  clabe: false, // CLABE oficial y banco: perfil público, verificador, panel y «Mi negocio»
  compromisoDevolucion: false, // compromiso de devolución: perfil, criterios y formularios
  envios: false, // «Envíos»: estar en el directorio ya implica que envía
  notasInternas: false, // cuadro de notas internas en la ficha del panel
};

export const LEYENDA_PILOTO =
  "Proveedores aliados NEC · evaluación oficial en febrero 2027";

export const AVISO_LEGAL =
  "Este directorio reúne a proveedores con los que NEC ya trabaja. Todavía no es la evaluación oficial: " +
  "la primera temporada de auditorías es en febrero de 2027 y sus resultados se publican en abril. " +
  "«Verificado por NEC» será una evaluación privada del historial del proveedor a la fecha de revisión; no es una " +
  "certificación oficial, no garantiza operaciones futuras y NEC no es parte de la compraventa.";


// Responsable del tratamiento de datos mientras se constituye la sociedad evaluadora (decidido 14-nov-2026).
// El RFC no se publica: el aviso de privacidad no lo requiere.
export const RESPONSABLE = {
  nombre: "Rubén Uriel Flores Bello",
  domicilio: "Avenida Xicohtencatl #7, Tepetitla de Lardizábal, C.P. 90700, Tlaxcala, México" as string | null, // 16-nov-2026
  correo: "necconsultingg@gmail.com",
};

// Dirección pública del sitio (vista previa al compartir, sitemap).
export const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

// Indexación en Google y otros buscadores. APAGADA mientras haya datos de demostración y legales en borrador.
// Para encenderla: en Vercel, NEXT_PUBLIC_PERMITIR_INDEXACION=si (producción) y volver a publicar.
export const PERMITIR_INDEXACION = process.env.NEXT_PUBLIC_PERMITIR_INDEXACION === "si";
