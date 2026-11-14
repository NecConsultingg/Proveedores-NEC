// Se muestra mientras haya proveedores ficticios (columna `demo` en Supabase).
export function AvisoDemo({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Datos de demostración.</strong> Estos proveedores, modelos y precios son ficticios y sirven solo para
        probar el directorio. No los contactes ni compres con base en ellos.
      </p>
    </div>
  );
}
