import Image from "next/image";
import Link from "next/link";

export function Encabezado() {
  return (
    <header className="bg-marino text-humo border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center" aria-label="Inicio · Directorio NEC">
          <Image src="/brand/nec-principal-blanco.png" alt="NEC" width={92} height={51} priority />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-7 etiqueta">
          <Link href="/#directorio" className="hidden sm:inline hover:text-acero">Directorio</Link>
          <Link href="/verificar" className="whitespace-nowrap hover:text-acero">
            <span className="sm:hidden">Verificar</span>
            <span className="hidden sm:inline">Verificar número</span>
          </Link>
          <Link href="/como-verificamos" className="hidden whitespace-nowrap hover:text-acero md:inline">Cómo verificamos</Link>
          <Link
            href="/quiero-ser-auditado"
            className="whitespace-nowrap rounded bg-arena px-3 py-2 text-marino hover:bg-white"
          >
            Soy proveedor
          </Link>
        </nav>
      </div>
    </header>
  );
}
