import type { Ubicacion } from "@/lib/tipos";

// Con coordenadas: mini mapa de Google Maps y enlace para abrirlo.
// Es la dirección a la que Google redirige su enlace clásico «output=embed» (no requiere API key).
// Sin coordenadas (fábricas que no autorizan su dirección): solo la zona, sin mapa.
export function MapaUbicacion({ u }: { u: Ubicacion }) {
  const tieneMapa = u.lat !== null && u.lng !== null;
  const titulo = u.tipo === "puesto" ? "Puesto en tianguis" : "Fábrica";
  return (
    <article className="overflow-hidden rounded-md border border-black/5 bg-white">
      {tieneMapa && (
        <iframe
          title={`Mapa: ${u.descripcion}`}
          src={`https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${u.lat},${u.lng}!6i17`}
          className="aspect-video w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
      <div className="p-4">
        <p className="etiqueta text-pizarra">{titulo}</p>
        <p className="mt-1 font-semibold">{u.descripcion}</p>
        {tieneMapa ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${u.lat},${u.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm underline"
          >
            Abrir en Google Maps
          </a>
        ) : (
          <p className="mt-1 text-sm text-pizarra">Dirección exacta solo con cita, por seguridad del proveedor.</p>
        )}
      </div>
    </article>
  );
}
