export function PaginaLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
        BORRADOR · Pendiente de revisión por abogado. No publicar en producción sin la versión aprobada.
      </p>
      <h1 className="titulo mt-6 text-3xl">{titulo}</h1>
      <div className="mt-6 space-y-4 [&_h2]:font-titulo [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:text-lg">{children}</div>
    </div>
  );
}
