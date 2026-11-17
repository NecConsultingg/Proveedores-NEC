"use client";

import { useState } from "react";

// Campo de contraseña con botón de ojo para ver u ocultar lo que se escribe.
export function CampoContrasena({
  name,
  etiqueta,
  autoComplete,
  minLength,
  className = "mt-1 w-full rounded border border-acero bg-white px-3 py-2.5 pr-12 focus:border-marino focus:outline-none",
}: {
  name: string;
  etiqueta: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="font-semibold">{etiqueta}</span>
      <span className="relative block">
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={className}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 mt-1 flex w-11 items-center justify-center text-pizarra hover:text-marino"
        >
          {visible ? <OjoCerrado /> : <Ojo />}
        </button>
      </span>
    </label>
  );
}

function Ojo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OjoCerrado() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
