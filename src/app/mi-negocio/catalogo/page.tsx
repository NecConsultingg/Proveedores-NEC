import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerNegocio } from "@/lib/mi-negocio";
import { rpc } from "@/lib/panel";
import { EditorCatalogo, type ItemCatalogo } from "./editor";

export const metadata: Metadata = { title: "Mi catálogo" };

export default async function MiCatalogo() {
  const n = await obtenerNegocio();
  if (n.debe_cambiar) redirect("/mi-negocio/contrasena");
  if (n.falta_registro) redirect("/mi-negocio/registro");
  const items = await rpc<ItemCatalogo[]>("proveedor_mi_catalogo");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="titulo text-3xl">Mi catálogo</h1>
        <p className="mt-1 max-w-2xl text-pizarra">
          Sube hasta 12 modelos con su foto. Lo que agregues, cambies o borres se ve al momento en tu perfil del
          directorio. Usa fotos claras, de frente y con buena luz.
        </p>
      </div>
      <EditorCatalogo items={items} proveedorId={n.id} />
    </div>
  );
}
