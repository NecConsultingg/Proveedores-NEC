import Link from "next/link";
import { obtenerMiembro, rango, rpc } from "@/lib/panel";
import type { Especialidad } from "../campos";
import { FormularioAlta } from "./formulario";

export default async function NuevoProveedor() {
  const [m, especialidades] = await Promise.all([obtenerMiembro(), rpc<Especialidad[]>("panel_especialidades")]);
  return (
    <div className="space-y-5">
      <Link href="/panel/proveedores" className="text-sm underline">← Proveedores</Link>
      <h1 className="titulo text-3xl">Nuevo proveedor</h1>
      <p className="max-w-3xl text-pizarra">
        Aquí solo registras el <b>correo</b>, el <b>nombre del negocio</b> y su <b>especialidad</b>. El sistema crea la cuenta
        y te da una contraseña temporal para mandársela. Al entrar por primera vez, el proveedor cambia la contraseña y llena
        el registro de su negocio; cuando lo envíe te aparecerá en <b>Aprobaciones</b> para revisarlo antes de publicar.
      </p>
      {rango(m.nivel) >= 2 ? (
        <FormularioAlta especialidades={especialidades} />
      ) : (
        <p className="rounded border border-black/5 bg-white p-4">Las altas con cuenta las hace un administrador medio o un superadministrador.</p>
      )}
    </div>
  );
}
