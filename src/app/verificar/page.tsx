import type { Metadata } from "next";
import { FormularioVerificar } from "./formulario";

export const metadata: Metadata = { title: "Verificar número o cuenta" };

export default function Verificar() {
  return (
    <>
      <section className="patron-nec text-humo">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <p className="etiqueta text-acero">Antes de pagar</p>
          <h1 className="titulo mt-3 text-3xl sm:text-4xl">Verificar número o cuenta</h1>
          <p className="mt-3 text-humo/90">
            ¿Te escribió alguien que dice ser un proveedor del directorio, o te pidieron pagar a una cuenta? Escríbela aquí
            y te decimos si es el contacto oficial que NEC confirmó con el dueño.
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
