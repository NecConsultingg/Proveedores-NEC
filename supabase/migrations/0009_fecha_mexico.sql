-- La fecha de autorización del registro se toma con la hora de México (no UTC).
create or replace function public.proveedor_registrar(datos jsonb, acepta boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  x public.cuentas_proveedor;
  k text;
  c public.cambios;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  if x.debe_cambiar then raise exception 'Primero cambia tu contraseña temporal'; end if;
  if x.registro_enviado_en is not null then raise exception 'Tu registro ya fue enviado'; end if;
  if jsonb_typeof(datos) <> 'object' then raise exception 'Datos inválidos'; end if;
  for k in select jsonb_object_keys(datos) loop
    if not k = any(public.campos_proveedor()) then
      raise exception 'El dato «%» lo registra el equipo NEC', k;
    end if;
  end loop;
  if jsonb_typeof(datos -> 'whatsapps') is distinct from 'array' or jsonb_array_length(datos -> 'whatsapps') < 1 then
    raise exception 'Registra al menos un número de WhatsApp';
  end if;
  if datos ->> 'estado_republica' is null then raise exception 'Elige tu estado'; end if;
  if not (coalesce((datos ->> 'vende_presencial')::boolean, false) or coalesce((datos ->> 'vende_en_linea')::boolean, false)
          or coalesce(trim(datos ->> 'otros_medios'), '') <> '') then
    raise exception 'Marca cómo vendes: presencial, en línea u otros medios';
  end if;
  if datos ->> 'anios' is null or datos ->> 'mayoreo_minimo' is null then
    raise exception 'Faltan los años en el negocio o el mínimo de mayoreo';
  end if;
  if not coalesce(acepta, false) then raise exception 'Necesitamos tu autorización para publicar tus datos'; end if;

  -- La autorización de este registro queda como la fecha de autorización de publicación.
  datos := datos || jsonb_build_object('consentimiento_publicacion_en', (now() at time zone 'America/Mexico_City')::date);
  perform public.validar_datos('registro', datos);

  insert into public.cambios (tipo, proveedor_id, datos, motivo, propuesto_por_cuenta)
  values ('registro', x.proveedor_id, datos, 'Registro inicial del proveedor', x.id)
  returning * into c;
  update public.cuentas_proveedor set registro_enviado_en = now() where id = x.id;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, 'proveedor_registro', 'cambio', c.id, null, to_jsonb(c), c.motivo);
  return jsonb_build_object('cambio_id', c.id);
end $$;
