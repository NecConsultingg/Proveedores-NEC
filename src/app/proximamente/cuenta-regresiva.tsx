"use client";

import { useEffect, useState } from "react";

const UNIDADES = [
  ["días", "días", 86_400_000],
  ["horas", "hrs", 3_600_000],
  ["minutos", "min", 60_000],
  ["segundos", "seg", 1_000],
] as const;

// Cuenta regresiva hasta la apertura. Al llegar a cero recarga para mostrar el directorio.
export function CuentaRegresiva({ hasta }: { hasta: string }) {
  const meta = Date.parse(hasta);
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setAhora(t);
      if (t >= meta) {
        clearInterval(id);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [meta]);

  let resta = ahora === null ? null : Math.max(0, meta - ahora);
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-live="off">
      {UNIDADES.map(([nombre, corto, ms]) => {
        let valor: number | null = null;
        if (resta !== null) {
          valor = Math.floor(resta / ms);
          resta -= valor * ms;
        }
        return (
          <div key={nombre} className="rounded-md border border-acero/40 bg-white/5 px-2 py-4 text-center sm:py-6">
            <p className="titulo text-4xl tabular-nums sm:text-6xl">{valor === null ? "··" : String(valor).padStart(2, "0")}</p>
            <p className="etiqueta mt-2 text-xs text-acero sm:text-sm"><span className="sm:hidden">{corto}</span><span className="hidden sm:inline">{nombre}</span></p>
          </div>
        );
      })}
    </div>
  );
}
