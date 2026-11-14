import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="titulo text-3xl">No encontramos esta página</h1>
      <p className="mt-3 text-pizarra">Puede que el proveedor ya no esté en el directorio.</p>
      <Link href="/" className="etiqueta mt-6 inline-block rounded bg-marino px-5 py-3 text-humo">Volver al directorio</Link>
    </div>
  );
}
