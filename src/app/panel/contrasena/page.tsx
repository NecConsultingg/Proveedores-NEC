import type { Metadata } from "next";
import { obtenerMiembro } from "@/lib/panel";
import { FormularioContrasena } from "./formulario";

export const metadata: Metadata = { title: "Contraseña" };

export default async function Contrasena() {
  const m = await obtenerMiembro();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo text-3xl">Tu contraseña</h1>
        <p className="mt-1 text-pizarra">
          Cuenta: <span className="font-semibold">{m.correo}</span>. Si llegaste desde el enlace del correo, aquí eliges la
          contraseña con la que vas a entrar.
        </p>
      </div>
      <section className="rounded-md border border-black/5 bg-white p-6">
        <FormularioContrasena correo={m.correo} />
      </section>
    </div>
  );
}
