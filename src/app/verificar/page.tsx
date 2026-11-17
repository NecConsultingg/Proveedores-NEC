import type { Metadata } from "next";
import { FUNCIONES } from "@/lib/config";
import { FormularioVerificar } from "./formulario";

export const metadata: Metadata = { title: FUNCIONES.clabe ? "Verificar número o cuenta" : "Verificar número" };

export default function Verificar() {
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <p className="etiqueta text-acero">Antes de pagar</p>
          <h1 className="titulo mt-3 text-3xl sm:text-4xl">{FUNCIONES.clabe ? "Verificar número o cuenta" : "Verificar número"}</h1>
          <p className="mt-3 text-humo/90">
            {FUNCIONES.clabe
              ? "¿Te escribió alguien que dice ser un proveedor del directorio, o te pidieron pagar a una cuenta? Escríbela aquí y te decimos si es el contacto oficial que NEC confirmó con el dueño."
              : "¿Te escribió alguien que dice ser un proveedor del directorio? Escribe el número aquí y te decimos si es el WhatsApp oficial que NEC confirmó con el dueño."}
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-10">
        <FormularioVerificar />
        <p className="mt-6 text-sm text-pizarra">
          Solo revisamos contra los proveedores publicados en este directorio. No guardamos el número que escribes.
        </p>
      </div>
    </>
  );
}
