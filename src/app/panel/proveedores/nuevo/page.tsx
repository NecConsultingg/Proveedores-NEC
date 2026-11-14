import Link from "next/link";
import { obtenerMiembro, rpc } from "@/lib/panel";
import { proponerCambio } from "../../acciones";
import { FormaAccion } from "../../forma-accion";
import { CampoMotivo, CamposProveedor, type Especialidad } from "../campos";

export default async function NuevoProveedor() {
  const [m, especialidades] = await Promise.all([obtenerMiembro(), rpc<Especialidad[]>("panel_especialidades")]);
  return (
    <div className="space-y-5">
      <Link href="/panel/proveedores" className="text-sm underline">← Proveedores</Link>
      <h1 className="titulo text-3xl">Proponer alta de proveedor</h1>
      <p className="text-pizarra">
        El proveedor se crea <b>sin publicar</b> y como «Aliado NEC». Para publicarlo hace falta la fecha de la autorización
        firmada. Confirma el WhatsApp y la CLABE con el dueño antes de capturarlos.
      </p>
      <FormaAccion accion={proponerCambio} boton="Enviar propuesta" className="space-y-5 rounded-md border border-black/5 bg-white p-6">
        <input type="hidden" name="tipo" value="alta" />
        <CamposProveedor especialidades={especialidades} />
        <CampoMotivo ejemplo="Ej. Cliente de NEC, autorización firmada el 20-nov" />
        {m.nivel === "superadmin" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="directo" />
            <span>Aplicar directo (sin aprobación; queda en la bitácora)</span>
          </label>
        )}
      </FormaAccion>
    </div>
  );
}
