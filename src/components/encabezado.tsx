import Image from "next/image";
import Link from "next/link";

export function Encabezado() {
  return (
    <header className="bg-marino text-humo border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Inicio · Directorio NEC">
          <Image src="/brand/nec-isotipo-blanco.png" alt="NEC" width={26} height={31} priority className="sm:hidden" />
          <Image src="/brand/nec-principal-blanco.png" alt="NEC" width={92} height={51} priority className="hidden sm:block" />
        </Link>
        <nav className="etiqueta flex items-center gap-2.5 sm:gap-7">
          <Link href="/#directorio" className="hidden sm:inline hover:text-acero">Directorio</Link>
          <Link href="/verificar" className="whitespace-nowrap hover:text-acero">
            <span className="sm:hidden">Verificar</span>
            <span className="hidden sm:inline">Verificar número</span>
          </Link>
          <Link href="/como-verificamos" className="hidden whitespace-nowrap hover:text-acero md:inline">Cómo verificamos</Link>
          <Link
            href="/quiero-ser-auditado"
            className="whitespace-nowrap rounded bg-arena px-2.5 py-2 text-marino hover:bg-white sm:px-3"
          >
            <span className="sm:hidden">Proveedor</span>
            <span className="hidden sm:inline">Soy proveedor</span>
          </Link>
          <Link
            href="/acceso"
            className="whitespace-nowrap rounded border border-acero px-2.5 py-2 hover:border-humo hover:text-white sm:px-3"
          >
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
