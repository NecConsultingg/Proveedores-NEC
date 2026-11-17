import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioAcceso } from "./formulario";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false, follow: false } };

const ERRORES: Record<string, string> = {
  enlace: "El enlace ya se usó o venció. Pide uno nuevo.",
  "sin-acceso": "Tu cuenta no tiene acceso a esa sección o está desactivada.",
};

export default function Acceso({ searchParams }: PageProps<"/acceso">) {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="etiqueta text-pizarra">Equipo NEC y proveedores</p>
      <h1 className="titulo mt-2 text-3xl">Iniciar sesión</h1>
      <p className="mt-3 text-pizarra">Tu usuario es tu correo.</p>
      <Suspense>
        <AvisoError searchParams={searchParams} />
      </Suspense>
      <div className="mt-6">
        <FormularioAcceso />
      </div>
      <div className="mt-6 space-y-2 text-sm">
        <p>
          <b>Proveedores:</b> si olvidaste tu contraseña, escríbele al equipo NEC y te mandamos una temporal nueva.
        </p>
        <p>
          <b>Equipo NEC:</b>{" "}
          <Link href="/acceso/recuperar" className="underline">¿primera vez o se te olvidó la contraseña?</Link>
        </p>
      </div>
    </div>
  );
}

async function AvisoError({ searchParams }: Pick<PageProps<"/acceso">, "searchParams">) {
  const { error } = await searchParams;
  const texto = typeof error === "string" ? ERRORES[error] : undefined;
  return texto ? <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">{texto}</p> : null;
}
