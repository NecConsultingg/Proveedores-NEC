import Image from "next/image";
import type { EstadoSello } from "@/lib/tipos";

const TEXTO: Record<EstadoSello, string> = {
  aliado: "Aliado NEC",
  vigente: "Verificado por NEC",
  suspendido: "Sello suspendido",
  retirado: "Sello retirado",
};

export function textoSello(estado: EstadoSello, evaluadoEn: string | null) {
  if (estado === "vigente" && evaluadoEn) return `Verificado ${new Date(evaluadoEn).getFullYear()}`;
  return TEXTO[estado];
}

export function InsigniaSello({ estado, evaluadoEn }: { estado: EstadoSello; evaluadoEn: string | null }) {
  const oscuro = estado === "vigente" || estado === "aliado";
  return (
    <span
      className={`etiqueta inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
        oscuro ? "bg-marino text-humo" : "bg-red-100 text-red-900"
      }`}
    >
      {oscuro && <Image src="/brand/nec-isotipo-blanco.png" alt="" width={9} height={11} />}
      {textoSello(estado, evaluadoEn)}
    </span>
  );
}
