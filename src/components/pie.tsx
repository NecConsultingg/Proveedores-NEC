import Image from "next/image";
import Link from "next/link";
import { AVISO_LEGAL } from "@/lib/config";

export function Pie() {
  return (
    <footer className="bg-marino text-humo/85">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_2fr]">
        <div className="space-y-3">
          <Image src="/brand/nec-principal-blanco.png" alt="NEC" width={92} height={51} />
          <div className="flex flex-col gap-1 text-sm">
            <Link href="/como-verificamos" className="hover:text-white">Cómo verificamos</Link>
            <Link href="/verificar" className="hover:text-white">Verificar número o cuenta</Link>
            <Link href="/quiero-ser-auditado" className="hover:text-white">Quiero ser auditado</Link>
            <Link href="/aviso-de-privacidad" className="hover:text-white">Aviso de privacidad</Link>
            <Link href="/terminos" className="hover:text-white">Términos y condiciones</Link>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{AVISO_LEGAL}</p>
      </div>
    </footer>
  );
}
