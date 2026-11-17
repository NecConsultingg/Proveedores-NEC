-- Registro del proveedor en su primer ingreso (16-nov-2026).
--
--   1. NEC da de alta solo: correo, nombre del negocio y especialidad (panel_alta_con_cuenta). El sistema crea
--      el proveedor sin publicar y su cuenta con contraseña temporal, en un solo paso.
--   2. El proveedor entra, cambia la contraseña y llena su registro (proveedor_registrar): estado, formato de
--      venta, 1 a 5 WhatsApp, años, mayoreo, etc., y autoriza la publicación.
--   3. El registro llega al panel como cambio tipo «registro» (aviso en Resumen y Aprobaciones). Al aprobarlo se
--      aplican los datos; si se rechaza, el proveedor lo corrige y lo vuelve a enviar.

-- ---------- Hasta 5 números de WhatsApp ----------
alter table public.proveedores add column whatsapps text[] check (
  whatsapps is null or (cardinality(whatsapps) between 1 and 5
                        and array_to_string(whatsapps, ',') ~ '^[0-9]{12,13}(,[0-9]{12,13}){0,4}$')
);
grant select (whatsapps) on public.proveedores to anon, authenticated;

-- whatsapp_oficial queda como el número principal (= el primero de la lista), para el botón y el verificador.
create function public.sincronizar_whatsapps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.whatsapps is not null and (tg_op = 'INSERT' or new.whatsapps is distinct from old.whatsapps) then
    new.whatsapp_oficial := new.whatsapps[1];
  elsif new.whatsapps is null and new.whatsapp_oficial is not null then
    new.whatsapps := array[new.whatsapp_oficial];
  end if;
  return new;
end $$;
create trigger proveedores_whatsapps before insert or update on public.proveedores
  for each row execute function public.sincronizar_whatsapps();

-- El verificador revisa todos los números.
create or replace function public.verificar_contacto(valor text)
returns table(slug text, nombre text, tipo text)
language sql stable security definer set search_path = '' as $$
  with v as (select regexp_replace(coalesce(valor, ''), '\D', '', 'g') as d)
  select p.slug, p.nombre, case when p.clabe_oficial = v.d then 'clabe' else 'whatsapp' end
  from public.proveedores p, v
  where p.publicado
    and length(v.d) >= 10
    and (p.whatsapp_oficial = v.d
         or v.d = any (coalesce(p.whatsapps, '{}'))
         or (length(v.d) = 10 and ('52' || v.d = p.whatsapp_oficial or '52' || v.d = any (coalesce(p.whatsapps, '{}'))))
         or p.clabe_oficial = v.d)
  limit 3;
$$;

-- ---------- Registro ----------
alter table public.cuentas_proveedor add column registro_enviado_en timestamptz;

alter table public.cambios drop constraint cambios_tipo_check;
alter table public.cambios add constraint cambios_tipo_check check (tipo in ('alta', 'edicion', 'baja', 'sello', 'registro'));

create or replace function public.campos_editables() returns text[]
language sql immutable set search_path = '' as $$
  select array['nombre', 'especialidad_id', 'municipio', 'tipo_ubicacion', 'anios', 'mayoreo_minimo', 'descripcion',
               'whatsapp_oficial', 'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'foto_portada_url', 'publicado', 'consentimiento_publicacion_en', 'notas_internas',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'estado_republica', 'maps_url', 'whatsapps']
$$;

create or replace function public.campos_proveedor() returns text[]
language sql immutable set search_path = '' as $$
  select array['estado_republica', 'municipio', 'anios', 'mayoreo_minimo', 'descripcion', 'whatsapp_oficial', 'whatsapps',
               'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'maps_url']
$$;

create or replace function public.validar_datos(tipo text, datos jsonb) returns void
language plpgsql immutable set search_path = '' as $$
declare k text; n int;
begin
  if jsonb_typeof(datos) <> 'object' then
    raise exception 'Datos inválidos';
  end if;
  if tipo in ('alta', 'edicion', 'registro') then
    for k in select jsonb_object_keys(datos) loop
      if not k = any(public.campos_editables()) then
        raise exception 'El campo «%» no se puede cambiar desde aquí', k;
      end if;
    end loop;
    if tipo = 'alta' and (datos ->> 'nombre' is null or datos ->> 'especialidad_id' is null) then
      raise exception 'Una alta necesita nombre y especialidad';
    end if;
    if tipo in ('edicion', 'registro') and datos = '{}'::jsonb then
      raise exception 'No hay cambios que proponer';
    end if;
    if datos ? 'estado_republica' and datos ->> 'estado_republica' is not null and not (datos ->> 'estado_republica') = any(public.estados_mexico()) then
      raise exception 'Elige un estado de la lista';
    end if;
    if datos ? 'maps_url' and datos ->> 'maps_url' is not null and (datos ->> 'maps_url') !~
       '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.)?google\.com(\.mx)?/maps|maps\.google\.com(\.mx)?/)' then
      raise exception 'El enlace de ubicación debe ser de Google Maps (empieza con https://maps.app.goo.gl/…)';
    end if;
    if datos ? 'whatsapps' and jsonb_typeof(datos -> 'whatsapps') <> 'null' then
      if jsonb_typeof(datos -> 'whatsapps') <> 'array' then raise exception 'Lista de WhatsApp inválida'; end if;
      n := jsonb_array_length(datos -> 'whatsapps');
      if n < 1 or n > 5 then raise exception 'Registra de 1 a 5 números de WhatsApp'; end if;
      if exists (select 1 from jsonb_array_elements_text(datos -> 'whatsapps') w where w !~ '^[0-9]{12,13}$') then
        raise exception 'Cada WhatsApp debe tener 10 dígitos';
      end if;
    end if;
  elsif tipo = 'sello' then
    if not (datos ->> 'estado_sello') = any(array['vigente', 'suspendido']) then
      raise exception 'El sello solo puede proponerse como vigente o suspendido';
    end if;
    if datos ->> 'estado_sello' = 'vigente' and (datos ->> 'evaluado_en' is null or datos ->> 'proxima_revision' is null) then
      raise exception 'Un sello vigente necesita fecha de evaluación y de próxima revisión';
    end if;
  end if;
end $$;

-- Igual que antes, más: listas (whatsapps) y el tipo «registro» (se aplica como una edición).
create or replace function public.aplicar_cambio(c public.cambios, m public.equipo) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := c.proveedor_id;
  antes jsonb;
  k text;
  v jsonb;
  tipo_col text;
  base text;
  slug_nuevo text;
  n int := 1;
begin
  if c.tipo = 'alta' then
    base := trim(both '-' from regexp_replace(lower(translate(c.datos ->> 'nombre',
              'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
    slug_nuevo := base;
    while exists (select 1 from public.proveedores where slug = slug_nuevo) loop
      n := n + 1;
      slug_nuevo := base || '-' || n;
    end loop;
    insert into public.proveedores (slug, nombre, especialidad_id, tipo_ubicacion, publicado)
    values (slug_nuevo, c.datos ->> 'nombre', (c.datos ->> 'especialidad_id')::uuid,
            (c.datos ->> 'tipo_ubicacion')::public.tipo_ubicacion, false)
    returning id into pid;
    update public.cambios set proveedor_id = pid where id = c.id;
  end if;

  select to_jsonb(p) into antes from public.proveedores p where p.id = pid;
  if antes is null then
    raise exception 'El proveedor ya no existe';
  end if;

  if c.tipo in ('alta', 'edicion', 'registro') then
    -- «publicado» al final, para que los demás datos (p. ej. la fecha de autorización) ya estén puestos.
    for k, v in select key, value from jsonb_each(c.datos) order by key = 'publicado' loop
      select format_type(a.atttypid, a.atttypmod) into tipo_col
      from pg_attribute a where a.attrelid = 'public.proveedores'::regclass and a.attname = k and not a.attisdropped;
      if jsonb_typeof(v) = 'array' then
        execute format('update public.proveedores set %I = array(select jsonb_array_elements_text($1))::%s where id = $2',
                       k, tipo_col) using v, pid;
      else
        execute format('update public.proveedores set %I = ($1 #>> ''{}'')::%s where id = $2', k, tipo_col) using v, pid;
      end if;
    end loop;
  elsif c.tipo = 'sello' then
    update public.proveedores
       set estado_sello = (c.datos ->> 'estado_sello')::public.estado_sello,
           evaluado_en = coalesce((c.datos ->> 'evaluado_en')::date, evaluado_en),
           proxima_revision = coalesce((c.datos ->> 'proxima_revision')::date, proxima_revision)
     where id = pid;
  elsif c.tipo = 'baja' then
    update public.proveedores set publicado = false, estado_sello = 'retirado' where id = pid;
  end if;

  perform public.anotar(m, 'aplicar_' || c.tipo, 'proveedor', pid, antes,
                        (select to_jsonb(p) from public.proveedores p where p.id = pid), c.motivo);
  return pid;
end $$;

-- Igual que antes, más: si se rechaza un registro, el proveedor puede corregirlo y reenviarlo.
create or replace function public.panel_resolver(cambio uuid, aprobar boolean, comentario text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  c public.cambios;
begin
  m := public.exigir_nivel('admin_medio');
  select * into c from public.cambios where id = cambio for update;
  if c.id is null then raise exception 'Cambio no encontrado'; end if;
  if c.estado <> 'pendiente' then raise exception 'Este cambio ya fue resuelto'; end if;
  if c.propuesto_por = m.id then raise exception 'Nadie aprueba su propio cambio'; end if;
  if c.tipo in ('sello', 'baja') and m.nivel <> 'superadmin' then
    raise exception 'El sello y las bajas los aprueba un superadministrador';
  end if;
  if not aprobar and coalesce(trim(comentario), '') = '' then
    raise exception 'Escribe el motivo del rechazo';
  end if;

  if aprobar then
    perform public.aplicar_cambio(c, m);
  elsif c.tipo = 'registro' then
    update public.cuentas_proveedor set registro_enviado_en = null where id = c.propuesto_por_cuenta;
  end if;
  update public.cambios
     set estado = case when aprobar then 'aprobado' else 'rechazado' end,
         revisado_por = m.id, revisado_en = now(), comentario_revision = comentario
   where id = c.id;
  perform public.anotar(m, case when aprobar then 'aprobar_' else 'rechazar_' end || c.tipo, 'cambio', c.id,
                        null, jsonb_build_object('comentario', comentario), c.motivo);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.panel_resumen() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo;
begin
  m := public.exigir_nivel('staff');
  return jsonb_build_object(
    'proveedores_publicados', (select count(*) from public.proveedores where publicado and not demo),
    'proveedores_demo', (select count(*) from public.proveedores where demo),
    'proveedores_sin_publicar', (select count(*) from public.proveedores where not publicado),
    'cambios_pendientes', (select count(*) from public.cambios where estado = 'pendiente'),
    'registros_nuevos', (select count(*) from public.cambios where estado = 'pendiente' and tipo = 'registro'),
    'por_aprobar_por_mi', (select count(*) from public.cambios c where c.estado = 'pendiente'
                             and c.propuesto_por is distinct from m.id
                             and (c.tipo in ('alta', 'edicion', 'registro') and public.rango(m.nivel) >= 2
                                  or c.tipo in ('sello', 'baja') and m.nivel = 'superadmin')),
    'solicitudes_nuevas', (select count(*) from public.solicitudes_auditoria where estado = 'recibida'),
    'solicitudes_total', (select count(*) from public.solicitudes_auditoria)
  );
end $$;

-- ---------- Panel: alta con cuenta en un paso ----------
create function public.panel_alta_con_cuenta(nombre text, especialidad uuid, correo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  base text;
  slug_nuevo text;
  n int := 1;
  pid uuid;
  r jsonb;
begin
  m := public.exigir_nivel('admin_medio');
  if coalesce(length(trim(nombre)), 0) < 2 then raise exception 'Escribe el nombre del negocio'; end if;
  if not exists (select 1 from public.categorias where id = especialidad and nivel = 3 and activa) then
    raise exception 'Elige una especialidad';
  end if;
  base := trim(both '-' from regexp_replace(lower(translate(trim(nombre),
            'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'proveedor'; end if;
  slug_nuevo := base;
  while exists (select 1 from public.proveedores where slug = slug_nuevo) loop
    n := n + 1;
    slug_nuevo := base || '-' || n;
  end loop;
  insert into public.proveedores (slug, nombre, especialidad_id, publicado)
  values (slug_nuevo, trim(nombre), especialidad, false)
  returning id into pid;
  perform public.anotar(m, 'alta_con_cuenta', 'proveedor', pid, null,
                        (select to_jsonb(p) from public.proveedores p where p.id = pid), null);
  -- Crea la cuenta; si el correo no sirve, se deshace también el alta.
  r := public.panel_crear_cuenta_proveedor(pid, correo);
  return r || jsonb_build_object('proveedor_id', pid);
end $$;

-- ---------- Proveedor: a dónde va y su registro ----------
create or replace function public.mi_destino() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  if (public.miembro_actual()).id is not null then
    return jsonb_build_object('tipo', 'equipo');
  end if;
  x := public.cuenta_actual();
  if x.id is not null then
    return jsonb_build_object('tipo', 'proveedor', 'debe_cambiar', x.debe_cambiar,
                              'falta_registro', x.registro_enviado_en is null);
  end if;
  return jsonb_build_object('tipo', null);
end $$;

create function public.proveedor_registrar(datos jsonb, acepta boolean) returns jsonb
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
  datos := datos || jsonb_build_object('consentimiento_publicacion_en', current_date);
  perform public.validar_datos('registro', datos);

  insert into public.cambios (tipo, proveedor_id, datos, motivo, propuesto_por_cuenta)
  values ('registro', x.proveedor_id, datos, 'Registro inicial del proveedor', x.id)
  returning * into c;
  update public.cuentas_proveedor set registro_enviado_en = now() where id = x.id;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, 'proveedor_registro', 'cambio', c.id, null, to_jsonb(c), c.motivo);
  return jsonb_build_object('cambio_id', c.id);
end $$;

-- Cambios posteriores: solo con el registro ya aprobado.
create or replace function public.proveedor_proponer(datos jsonb, motivo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  x public.cuentas_proveedor;
  k text;
  c public.cambios;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  if x.debe_cambiar then raise exception 'Primero cambia tu contraseña temporal'; end if;
  if x.registro_enviado_en is null then raise exception 'Primero completa tu registro'; end if;
  if exists (select 1 from public.cambios where propuesto_por_cuenta = x.id and tipo = 'registro' and estado = 'pendiente') then
    raise exception 'Tu registro está en revisión. Cuando lo aprobemos podrás enviar cambios.';
  end if;
  if jsonb_typeof(datos) <> 'object' or datos = '{}'::jsonb then raise exception 'No hay cambios que enviar'; end if;
  for k in select jsonb_object_keys(datos) loop
    if not k = any(public.campos_proveedor()) then
      raise exception 'El dato «%» lo cambia el equipo NEC; escríbenos', k;
    end if;
  end loop;
  perform public.validar_datos('edicion', datos);
  if coalesce(length(trim(motivo)), 0) < 3 then raise exception 'Cuéntanos brevemente por qué cambia'; end if;
  if (select count(*) from public.cambios where propuesto_por_cuenta = x.id and estado = 'pendiente') >= 5 then
    raise exception 'Tienes 5 cambios en revisión. Espera a que el equipo NEC los revise.';
  end if;

  insert into public.cambios (tipo, proveedor_id, datos, motivo, propuesto_por_cuenta)
  values ('edicion', x.proveedor_id, datos, trim(motivo), x.id)
  returning * into c;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, 'proveedor_propone', 'cambio', c.id, null, to_jsonb(c), c.motivo);
  return jsonb_build_object('cambio_id', c.id);
end $$;

create or replace function public.proveedor_mi_negocio() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'correo', x.correo, 'debe_cambiar', x.debe_cambiar,
      'falta_registro', x.registro_enviado_en is null,
      'registro_en_revision', exists (select 1 from public.cambios r where r.propuesto_por_cuenta = x.id
                                        and r.tipo = 'registro' and r.estado = 'pendiente'),
      'ultimo_rechazo', (select r.comentario_revision from public.cambios r where r.propuesto_por_cuenta = x.id
                           and r.tipo = 'registro' and r.estado = 'rechazado' order by r.revisado_en desc limit 1),
      'id', p.id, 'slug', p.slug, 'nombre', p.nombre, 'especialidad', s.nombre,
      'estado_republica', p.estado_republica, 'vende_presencial', p.vende_presencial, 'vende_en_linea', p.vende_en_linea,
      'otros_medios', p.otros_medios, 'maps_url', p.maps_url, 'whatsapps', p.whatsapps,
      'anios', p.anios, 'mayoreo_minimo', p.mayoreo_minimo, 'descripcion', p.descripcion,
      'whatsapp_oficial', p.whatsapp_oficial, 'clabe_oficial', p.clabe_oficial, 'banco', p.banco,
      'dias_tianguis', p.dias_tianguis, 'envios', p.envios, 'compromiso_devolucion', p.compromiso_devolucion,
      'publicado', p.publicado, 'estado_sello', p.estado_sello, 'evaluado_en', p.evaluado_en,
      'proxima_revision', p.proxima_revision,
      'cambios', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'tipo', c.tipo, 'estado', c.estado, 'datos', c.datos, 'motivo', c.motivo, 'propuesto_en', c.propuesto_en,
          'revisado_en', c.revisado_en, 'comentario_revision', c.comentario_revision) order by c.propuesto_en desc)
        from public.cambios c where c.propuesto_por_cuenta = x.id), '[]'::jsonb))
    from public.proveedores p left join public.categorias s on s.id = p.especialidad_id
    where p.id = x.proveedor_id
  );
end $$;

revoke execute on function public.panel_alta_con_cuenta(text, uuid, text), public.proveedor_registrar(jsonb, boolean)
  from public, anon;
grant execute on function public.panel_alta_con_cuenta(text, uuid, text), public.proveedor_registrar(jsonb, boolean)
  to authenticated;
revoke execute on function public.sincronizar_whatsapps() from public, anon, authenticated;
