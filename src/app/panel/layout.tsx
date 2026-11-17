import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { salir } from "@/app/acceso/acciones";
import { NOMBRE_NIVEL, obtenerMiembro, rango, rpc, type Nivel } from "@/lib/panel";

export const metadata: Metadata = {
  title: { default: "Panel NEC", template: "%s · Panel NEC" },
  robots: { index: false, follow: false },
};

const MENU: { href: string; texto: string; minimo: Nivel }[] = [
  { href: "/panel", texto: "Resumen", minimo: "staff" },
  { href: "/panel/solicitudes", texto: "Solicitudes", minimo: "staff" },
  { href: "/panel/proveedores", texto: "Proveedores", minimo: "staff" },
  { href: "/panel/aprobaciones", texto: "Aprobaciones", minimo: "staff" },
  { href: "/panel/catalogo", texto: "Catálogo", minimo: "staff" },
  { href: "/panel/equipo", texto: "Equipo", minimo: "admin_medio" },
  { href: "/panel/bitacora", texto: "Bitácora", minimo: "admin_medio" },
  { href: "/panel/contrasena", texto: "Cambiar contraseña", minimo: "staff" },
];

export default function LayoutPanel({ children }: LayoutProps<"/panel">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-5 py-12 text-pizarra">Cargando panel…</p>}>
      <Marco>{children}</Marco>
    </Suspense>
  );
}

async function Marco({ children }: { children: React.ReactNode }) {
  const m = await obtenerMiembro();
  // Aviso en el menú: cuántos cambios (incluidos registros nuevos de proveedores) esperan tu aprobación.
  const avisos = rango(m.nivel) >= 2
    ? await rpc<{ por_aprobar_por_mi: number }>("panel_resumen").catch(() => null)
    : null;
  const contador: Record<string, number> = {
    "/panel/aprobaciones": avisos?.por_aprobar_por_mi ?? 0,
  };
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-5">
        <div className="rounded-md bg-marino p-4 text-humo">
          <p className="etiqueta text-acero">Panel NEC</p>
          <p className="mt-1 font-semibold">{m.nombre}</p>
          <p className="text-sm text-humo/80">{NOMBRE_NIVEL[m.nivel]}</p>
        </div>
        <nav className="flex flex-wrap gap-2 md:flex-col">
          {MENU.filter((i) => rango(m.nivel) >= rango(i.minimo)).map((i) => (
            <Link key={i.href} href={i.href} className="rounded px-3 py-2 hover:bg-arena">
              {i.texto}
              {(contador[i.href] ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white">{contador[i.href]}</span>
              )}
            </Link>
          ))}
        </nav>
        <form action={salir}>
          <button className="text-sm text-pizarra underline">Cerrar sesión</button>
        </form>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
