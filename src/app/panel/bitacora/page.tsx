import { exigir, fecha, rpc } from "@/lib/panel";

type Registro = {
  id: number;
  fecha: string;
  correo: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  antes: Record<string, unknown> | null;
  despues: Record<string, unknown> | null;
  motivo: string | null;
};

const IGNORAR = new Set(["actualizado_en", "creado_en", "clabe_terminacion"]);

// Qué campos cambiaron entre «antes» y «después» (para no mostrar el registro completo).
function diferencias(a: Record<string, unknown> | null, d: Record<string, unknown> | null) {
  if (!a || !d) return [];
  return Object.keys(d).filter((k) => !IGNORAR.has(k) && JSON.stringify(a[k]) !== JSON.stringify(d[k]));
}

export default async function Bitacora() {
  await exigir("admin_medio");
  const registros = await rpc<Registro[]>("panel_bitacora", { limite: 300 });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="titulo text-3xl">Bitácora</h1>
        <p className="mt-1 text-pizarra">Todo lo que hace el equipo en el panel queda aquí. No se puede editar ni borrar. Últimos 300 registros.</p>
      </div>
      {registros.length === 0 && <p className="rounded border border-black/10 bg-white p-6">Sin registros todavía.</p>}
      <div className="overflow-x-auto rounded-md border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-marino text-humo">
            <tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Quién</th><th className="px-3 py-2">Acción</th><th className="px-3 py-2">Detalle</th></tr>
          </thead>
          <tbody>
            {registros.map((r) => {
              const cambiados = diferencias(r.antes, r.despues);
              return (
                <tr key={r.id} className="border-t border-black/5 align-top">
                  <td className="whitespace-nowrap px-3 py-2">{fecha(r.fecha)}</td>
                  <td className="px-3 py-2">{r.correo}</td>
                  <td className="px-3 py-2">{r.accion.replaceAll("_", " ")}</td>
                  <td className="px-3 py-2">
                    {r.motivo && <p>Motivo: {r.motivo}</p>}
                    {cambiados.length > 0 && (
                      <p className="text-pizarra">
                        {cambiados.map((k) => {
                          const v = (x: unknown) => (k === "clabe_oficial" && x ? `••••${String(x).slice(-4)}` : JSON.stringify(x));
                          return `${k}: ${v(r.antes?.[k])} → ${v(r.despues?.[k])}`;
                        }).join(" · ")}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
