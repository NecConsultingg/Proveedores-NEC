"use client";

import { useActionState, useState } from "react";
import { activarCuentaProveedor, crearCuentaProveedor, restablecerCuentaProveedor, type EstadoCuenta } from "../acciones";
import { FormaAccion } from "../forma-accion";

export type Cuenta = { correo: string; activa: boolean; debe_cambiar: boolean; creado_en: string; contrasena_temporal_en: string } | null;

const campo = "mt-1 w-full rounded border border-acero bg-white px-3 py-2 focus:border-marino focus:outline-none";
const SITIO = "https://proveedoresnec.com/acceso";

function textoCorreo(negocio: string, correo: string, contrasena: string) {
  return `Hola, equipo de ${negocio}:

Ya tienen su cuenta en el Directorio de Proveedores NEC.

Entren en: ${SITIO}
Usuario: ${correo}
Contraseña temporal: ${contrasena}

La primera vez que entren les pediremos cambiar la contraseña temporal por una suya. Ahí pueden ver cómo aparece su negocio y enviarnos cambios (WhatsApp, descripción, días de tianguis…); el equipo NEC los revisa antes de publicarlos.

Cualquier duda, respondan este correo.

Equipo NEC`;
}

// Sección del panel para crear la cuenta del proveedor, generar contraseñas temporales y desactivarla.
export function CuentaProveedor({ proveedorId, negocio, cuenta }: { proveedorId: string; negocio: string; cuenta: Cuenta }) {
  const [creada, crear, creando] = useActionState<EstadoCuenta, FormData>(crearCuentaProveedor, { ok: false, mensaje: "" });
  const [nueva, restablecer, restableciendo] = useActionState<EstadoCuenta, FormData>(restablecerCuentaProveedor, { ok: false, mensaje: "" });
  const credenciales = (nueva.contrasena ? nueva : creada.contrasena ? creada : null) as EstadoCuenta | null;

  return (
    <section className="rounded-md border border-black/5 bg-white p-6">
      <h2 className="titulo text-xl">Cuenta del proveedor</h2>

      {credenciales?.contrasena && credenciales.correo ? (
        <Credenciales negocio={negocio} correo={credenciales.correo} contrasena={credenciales.contrasena} aviso={credenciales.mensaje} />
      ) : !cuenta ? (
        <>
          <p className="mt-1 text-sm text-pizarra">
            Crea su acceso para que vea su perfil y nos envíe cambios. El sistema genera una contraseña temporal que verás
            una sola vez para mandársela por correo; al entrar, el proveedor la cambia por una suya.
          </p>
          <form action={crear} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="proveedor_id" value={proveedorId} />
            <label className="block min-w-64 flex-1">
              <span className="text-sm font-semibold">Correo del proveedor (será su usuario)</span>
              <input name="correo" type="email" required className={campo} />
            </label>
            <button disabled={creando} className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra disabled:opacity-60">
              {creando ? "Creando…" : "Crear cuenta"}
            </button>
          </form>
          {creada.mensaje && !creada.ok && <p className="mt-3 text-red-700" role="alert">{creada.mensaje}</p>}
        </>
      ) : null}

      {cuenta && (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            Usuario: <b>{cuenta.correo}</b> ·{" "}
            {!cuenta.activa ? (
              <span className="text-red-800">Desactivada</span>
            ) : cuenta.debe_cambiar ? (
              <span>Todavía no cambia su contraseña temporal</span>
            ) : (
              <span className="text-emerald-800">Activa, con contraseña propia</span>
            )}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            {cuenta.activa && (
              <form action={restablecer}
                onSubmit={(e) => {
                  if (!window.confirm("¿Generar una contraseña temporal nueva? La actual deja de servir y se cierran sus sesiones.")) e.preventDefault();
                }}>
                <input type="hidden" name="proveedor_id" value={proveedorId} />
                <button disabled={restableciendo} className="etiqueta rounded border border-marino bg-white px-5 py-2.5 text-marino hover:bg-humo disabled:opacity-60">
                  {restableciendo ? "Generando…" : "Generar contraseña temporal nueva"}
                </button>
              </form>
            )}
            <FormaAccion accion={activarCuentaProveedor} boton={cuenta.activa ? "Desactivar cuenta" : "Reactivar cuenta"}
              estiloBoton={cuenta.activa ? "peligro" : "secundario"}
              confirmar={cuenta.activa ? "¿Desactivar la cuenta? El proveedor ya no podrá entrar." : undefined}
              className="flex items-center gap-2">
              <input type="hidden" name="proveedor_id" value={proveedorId} />
              <input type="hidden" name="activa" value={String(!cuenta.activa)} />
            </FormaAccion>
          </div>
          {nueva.mensaje && !nueva.ok && <p className="text-red-700" role="alert">{nueva.mensaje}</p>}
        </div>
      )}
    </section>
  );
}

function Credenciales({ negocio, correo, contrasena, aviso }: { negocio: string; correo: string; contrasena: string; aviso: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = textoCorreo(negocio, correo, contrasena);
  const asunto = "Tu acceso al Directorio de Proveedores NEC";
  return (
    <div className="mt-3 space-y-3 rounded border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold">{aviso} Copia estos datos ahora: la contraseña no se vuelve a mostrar.</p>
      <p className="text-sm">
        Usuario: <b>{correo}</b> · Contraseña temporal: <b className="font-mono text-base">{contrasena}</b>
      </p>
      <textarea readOnly value={texto} rows={12} className={`${campo} font-mono text-xs`} />
      <div className="flex flex-wrap gap-3">
        <button type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
          }}
          className="etiqueta rounded bg-marino px-5 py-2.5 text-humo hover:bg-pizarra">
          {copiado ? "Copiado ✓" : "Copiar correo"}
        </button>
        <a href={`mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`}
          className="etiqueta rounded border border-marino bg-white px-5 py-2.5 text-marino hover:bg-humo">
          Abrir en mi correo
        </a>
      </div>
    </div>
  );
}
