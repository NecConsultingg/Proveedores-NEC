import type { Metadata } from "next";
import { Confirmar } from "./confirmar";

export const metadata: Metadata = { title: "Entrando al panel", robots: { index: false, follow: false } };

export default function PaginaConfirmar() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="etiqueta text-pizarra">Panel NEC</p>
      <Confirmar />
    </div>
  );
}
