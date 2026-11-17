import type { Metadata } from "next";
import { FormularioContrasena } from "@/app/panel/contrasena/formulario";
import { obtenerNegocio } from "@/lib/mi-negocio";

export const metadata: Metadata = { title: "Contraseña" };

export default async function ContrasenaProveedor() {
  const n = await obtenerNegocio();
  return (
    <section className="rounded-md border border-black/5 bg-white p-6">
      <h1 className="titulo text-2xl">{n.debe_cambiar ? "Bienvenido. Elige tu contraseña" : "Cambiar contraseña"}</h1>
      <p className="mt-2 text-pizarra">
        {n.debe_cambiar
          ? "Entraste con la contraseña temporal que te mandamos. Cámbiala por una tuya para seguir; solo tú la vas a conocer."
          : "Tu usuario es tu correo:"}{" "}
        {!n.debe_cambiar && <b>{n.correo}</b>}
      </p>
      <div className="mt-5">
        <FormularioContrasena correo={n.correo} proveedor />
      </div>
    </section>
  );
}
