import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioAcceso } from "./formulario";

export const metadata: Metadata = { title: "Acceso del equipo NEC", robots: { index: false, follow: false } };

const ERRORES: Record<string, string> = {
  enlace: "El enlace ya se usó o venció. Pide uno nuevo.",
  "sin-acceso": "Tu correo no tiene acceso al panel NEC o tu cuenta está desactivada.",
};

export default function Acceso({ searchParams }: PageProps<"/acceso">) {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="etiqueta text-pizarra">Uso interno</p>
      <h1 className="titulo mt-2 text-3xl">Panel NEC</h1>
      <p className="mt-3 text-pizarra">
        Escribe tu correo y te enviamos un enlace para entrar. No necesitas contraseña. El enlace sirve una sola vez.
      </p>
      <Suspense>
        <AvisoError searchParams={searchParams} />
      </Suspense>
      <div className="mt-6">
        <FormularioAcceso />
      </div>
    </div>
  );
}

async function AvisoError({ searchParams }: Pick<PageProps<"/acceso">, "searchParams">) {
  const { error } = await searchParams;
  const texto = typeof error === "string" ? ERRORES[error] : undefined;
  return texto ? <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">{texto}</p> : null;
}
