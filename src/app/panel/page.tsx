import Link from "next/link";
import { obtenerMiembro, rpc } from "@/lib/panel";

type Resumen = {
  proveedores_publicados: number;
  proveedores_demo: number;
  proveedores_sin_publicar: number;
  cambios_pendientes: number;
  registros_nuevos: number;
  por_aprobar_por_mi: number;
  solicitudes_nuevas: number;
  solicitudes_total: number;
};

export default async function ResumenPanel() {
  const [m, r] = await Promise.all([obtenerMiembro(), rpc<Resumen>("panel_resumen")]);
  const tarjetas = [
    { titulo: "Registros nuevos de proveedores", valor: r.registros_nuevos, href: "/panel/aprobaciones", destacar: r.registros_nuevos > 0 },
    { titulo: "Por aprobar por ti", valor: r.por_aprobar_por_mi, href: "/panel/aprobaciones", destacar: r.por_aprobar_por_mi > 0 },
    { titulo: "Cambios pendientes (todos)", valor: r.cambios_pendientes, href: "/panel/aprobaciones" },
    { titulo: "Solicitudes nuevas", valor: r.solicitudes_nuevas, href: "/panel/solicitudes", destacar: r.solicitudes_nuevas > 0 },
    { titulo: "Proveedores reales publicados", valor: r.proveedores_publicados, href: "/panel/proveedores" },
    { titulo: "Proveedores sin publicar", valor: r.proveedores_sin_publicar, href: "/panel/proveedores" },
    { titulo: "Proveedores de demostración", valor: r.proveedores_demo, href: "/panel/proveedores" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo text-3xl">Hola, {m.nombre}</h1>
        <p className="mt-1 text-pizarra">Resumen del directorio.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <Link
            key={t.titulo}
            href={t.href}
            className={`rounded-md border p-5 hover:border-marino ${t.destacar ? "border-amber-400 bg-amber-50" : "border-black/5 bg-white"}`}
          >
            <p className="text-sm text-pizarra">{t.titulo}</p>
            <p className="titulo mt-1 text-3xl">{t.valor}</p>
          </Link>
        ))}
      </div>
      {r.proveedores_demo > 0 && (
        <p className="rounded border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          El directorio todavía muestra {r.proveedores_demo} proveedores de demostración. Antes del lanzamiento oficial
          hay que borrarlos (ver la lista de lanzamiento en el manual del equipo).
        </p>
      )}
    </div>
  );
}
