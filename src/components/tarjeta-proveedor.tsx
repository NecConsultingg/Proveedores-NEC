import Image from "next/image";
import Link from "next/link";
import type { Resultado } from "@/lib/filtros";
import { nombrePublico } from "@/lib/tipos";
import { formatoVenta, textoMayoreo } from "@/lib/venta";
import { InsigniaSello } from "./insignia-sello";

export function TarjetaProveedor({ r }: { r: Resultado }) {
  const p = r.proveedor;
  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-black/5 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-arena">
        {p.fotoPortadaUrl ? (
          <Image src={p.fotoPortadaUrl} alt={`Catálogo de ${p.nombre}`} fill className="object-cover" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
        ) : (
          <span className="etiqueta absolute left-3 top-3 text-pizarra">Foto de catálogo</span>
        )}
        <span className="absolute bottom-3 right-3">
          <InsigniaSello estado={p.estadoSello} evaluadoEn={p.evaluadoEn} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="etiqueta flex flex-wrap items-center gap-2 text-pizarra">
          {r.especialidad?.nombre}
          {r.especialista && <span className="rounded bg-arena px-1.5 py-0.5 text-marino">Especialista</span>}
        </p>
        <h3 className="text-xl font-semibold leading-tight">{p.nombre}</h3>
        <p className="text-sm text-pizarra">
          {[p.estado, formatoVenta({ ...p, otrosMedios: null }).join(" y ")].filter(Boolean).join(" · ")}
        </p>
        {r.publicos.length > 0 && (
          <p className="text-sm">Para: {r.publicos.map(nombrePublico).join(" · ")}</p>
        )}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded border border-black/10 bg-humo px-2">{p.anios} años</span>
          <span className="rounded border border-black/10 bg-humo px-2">Mayoreo desde {textoMayoreo(p.mayoreoMinimo, p.mayoreoUnidad)}</span>
        </div>
        <Link
          href={`/proveedores/${p.slug}`}
          className="etiqueta mt-auto block rounded border border-marino/60 py-2.5 text-center hover:bg-marino hover:text-humo"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
