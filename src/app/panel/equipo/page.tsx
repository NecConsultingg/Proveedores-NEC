import { NOMBRE_NIVEL, exigir, fecha, rpc, type Nivel } from "@/lib/panel";
import { activarMiembro, altaMiembro } from "../acciones";
import { FormaAccion } from "../forma-accion";

type Integrante = { id: string; correo: string; nombre: string; nivel: Nivel; activo: boolean; creado_en: string; desactivado_en: string | null };

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";

export default async function Equipo() {
  const m = await exigir("admin_medio");
  const equipo = await rpc<Integrante[]>("panel_equipo");
  const esSuper = m.nivel === "superadmin";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo text-3xl">Equipo NEC</h1>
        <p className="mt-1 text-pizarra">
          Las cuentas se desactivan, nunca se borran. {esSuper ? "Debe haber al menos 2 superadministradores activos." : "Como administrador medio solo administras cuentas de staff."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-marino text-humo">
            <tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Nivel</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {equipo.map((e) => {
              const puede = e.id !== m.id && (esSuper || e.nivel === "staff");
              return (
                <tr key={e.id} className={`border-t border-black/5 ${e.activo ? "" : "text-pizarra"}`}>
                  <td className="px-3 py-2 font-semibold">{e.nombre}{e.id === m.id && " (tú)"}</td>
                  <td className="px-3 py-2">{e.correo}</td>
                  <td className="px-3 py-2">{NOMBRE_NIVEL[e.nivel]}</td>
                  <td className="px-3 py-2">{e.activo ? "Activo" : `Desactivado ${fecha(e.desactivado_en)}`}</td>
                  <td className="px-3 py-2">
                    {puede && (
                      <FormaAccion accion={activarMiembro} boton={e.activo ? "Desactivar" : "Reactivar"}
                        estiloBoton={e.activo ? "peligro" : "secundario"}
                        confirmar={e.activo ? `¿Desactivar a ${e.nombre}? Ya no podrá entrar al panel.` : undefined}
                        className="flex items-center gap-2">
                        <input type="hidden" name="miembro_id" value={e.id} />
                        <input type="hidden" name="activo" value={String(!e.activo)} />
                      </FormaAccion>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-md border border-black/5 bg-white p-6">
        <h2 className="titulo text-xl">Agregar integrante</h2>
        <p className="mt-1 text-sm text-pizarra">La primera vez, la persona abre proveedoresnec.com/acceso/recuperar con el correo que registres aquí y crea su propia contraseña (nadie más la conoce). Una cuenta por persona.</p>
        <FormaAccion accion={altaMiembro} boton="Agregar" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block"><span className="text-sm font-semibold">Nombre</span><input name="nombre" required className={campo} /></label>
            <label className="block"><span className="text-sm font-semibold">Correo</span><input name="correo" type="email" required className={campo} /></label>
            <label className="block">
              <span className="text-sm font-semibold">Nivel</span>
              <select name="nivel" defaultValue="staff" className={campo}>
                <option value="staff">Staff</option>
                {esSuper && <option value="admin_medio">Administrador medio</option>}
                {esSuper && <option value="superadmin">Superadministrador</option>}
              </select>
            </label>
          </div>
        </FormaAccion>
      </section>
    </div>
  );
}
