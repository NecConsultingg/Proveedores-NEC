import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { salir } from "@/app/acceso/acciones";
import { obtenerNegocio } from "@/lib/mi-negocio";

// Todo aquí depende de la sesión del proveedor: se arma en el servidor en cada visita.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Mi negocio", template: "%s · Mi negocio" },
  robots: { index: false, follow: false },
};

export default function LayoutMiNegocio({ children }: LayoutProps<"/mi-negocio">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl px-5 py-12 text-pizarra">Cargando…</p>}>
      <Marco>{children}</Marco>
    </Suspense>
  );
}

async function Marco({ children }: { children: React.ReactNode }) {
  const n = await obtenerNegocio();
  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-marino px-5 py-4 text-humo">
        <div>
          <p className="etiqueta text-acero">Mi negocio</p>
          <p className="font-semibold">{n.nombre}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {!n.debe_cambiar && <Link href="/mi-negocio" className="underline">Inicio</Link>}
          {!n.debe_cambiar && !n.falta_registro && <Link href="/mi-negocio/catalogo" className="underline">Mi catálogo</Link>}
          {!n.debe_cambiar && <Link href="/mi-negocio/contrasena" className="underline">Cambiar contraseña</Link>}
          <form action={salir}>
            <button className="underline">Cerrar sesión</button>
          </form>
        </nav>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
