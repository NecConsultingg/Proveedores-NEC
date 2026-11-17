import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEnlace } from "./formulario";

export const metadata: Metadata = { title: "Crear o recuperar contraseña", robots: { index: false, follow: false } };

export default function Recuperar() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="etiqueta text-pizarra">Panel NEC</p>
      <h1 className="titulo mt-2 text-3xl">Crear o recuperar contraseña</h1>
      <p className="mt-3 text-pizarra">
        ¿Es tu primera vez o se te olvidó la contraseña? Escribe tu correo y te mandamos un enlace. Al abrirlo eliges tu
        nueva contraseña. El enlace sirve una sola vez y vence en una hora.
      </p>
      <div className="mt-6">
        <FormularioEnlace />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/acceso" className="underline">Volver a iniciar sesión</Link>
      </p>
    </div>
  );
}
