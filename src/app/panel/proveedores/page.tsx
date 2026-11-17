import Link from "next/link";
import { rpc } from "@/lib/panel";

export type ProveedorPanel = {
  id: string;
  slug: string;
  nombre: string;
  especialidad: string | null;
  especialidad_id: string;
  municipio: string | null;
  tipo_ubicacion: string | null;
  estado_republica: string | null;
  vende_presencial: boolean;
  vende_en_linea: boolean;
  otros_medios: string | null;
  maps_url: string | null;
  whatsapps: string[] | null;
  anios: number;
  mayoreo_minimo: number;
  descripcion: string | null;
  estado_sello: string;
  evaluado_en: string | null;
  proxima_revision: string | null;
  whatsapp_oficial: string | null;
  clabe_oficial: string | null;
  banco: string | null;
  dias_tianguis: string | null;
  envios: string | null;
  compromiso_devolucion: string | null;
  foto_portada_url: string | null;
  publicado: boolean;
  consentimiento_publicacion_en: string | null;
  notas_internas: string | null;
  demo: boolean;
};

export default async function ProveedoresPanel() {
  const proveedores = await rpc<ProveedorPanel[]>("panel_proveedores");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo text-3xl">Proveedores</h1>
          <p className="mt-1 text-pizarra">{proveedores.length} en total, incluidos los no publicados.</p>
        </div>
        <Link href="/panel/proveedores/nuevo" className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra">
          Proponer alta
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-marino text-humo">
            <tr>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2">Especialidad</th>
              <th className="px-3 py-2">Sello</th>
              <th className="px-3 py-2">Publicado</th>
              <th className="px-3 py-2">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} className="border-t border-black/5 hover:bg-humo">
                <td className="px-3 py-2">
                  <Link href={`/panel/proveedores/${p.id}`} className="font-semibold underline">
                    {p.nombre}
                  </Link>
                  {p.demo && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900">demo</span>}
                </td>
                <td className="px-3 py-2">{p.especialidad ?? "—"}</td>
                <td className="px-3 py-2 capitalize">{p.estado_sello}</td>
                <td className="px-3 py-2">{p.publicado ? "Sí" : "No"}</td>
                <td className="px-3 py-2">
                  {p.whatsapp_oficial ? "WhatsApp ✓" : "Sin WhatsApp"} · {p.clabe_oficial ? "CLABE ✓" : "Sin CLABE"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
