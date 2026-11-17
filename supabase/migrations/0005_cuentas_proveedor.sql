-- Cuentas de proveedor (16-nov-2026).
--
-- NEC crea la cuenta desde el panel: el sistema genera una contraseña temporal que se muestra UNA vez
-- para mandársela al proveedor por correo. Al entrar la primera vez, el proveedor la cambia por una propia.
-- El proveedor ve su perfil y propone cambios; esos cambios entran a Aprobaciones como cualquier otro.
--
-- Seguridad: igual que el panel. Tabla con RLS y sin políticas; todo pasa por funciones SECURITY DEFINER.
-- La contraseña temporal nunca se guarda en claro ni entra a la bitácora (solo su hash en auth.users).

create table public.cuentas_proveedor (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null unique references public.proveedores(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  correo text not null unique check (correo = lower(correo) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  activa boolean not null default true,
  debe_cambiar boolean not null default true,
  creado_por uuid references public.equipo(id),
  creado_en timestamptz not null default now(),
  contrasena_temporal_en timestamptz not null default now()
);
create index on public.cuentas_proveedor (creado_por);
alter table public.cuentas_proveedor enable row level security;

-- Los cambios pueden venir del equipo o de la cuenta del proveedor (uno y solo uno).
alter table public.cambios alter column propuesto_por drop not null;
alter table public.cambios add column propuesto_por_cuenta uuid references public.cuentas_proveedor(id) on delete set null;
alter table public.cambios add constraint quien_propone check (propuesto_por is not null or propuesto_por_cuenta is not null);
create index on public.cambios (propuesto_por_cuenta);

-- ---------- Funciones internas ----------

create function public.cuenta_actual() returns public.cuentas_proveedor
language sql stable security definer set search_path = '' as $$
  select c.* from public.cuentas_proveedor c
  where c.activa and c.user_id = auth.uid() and coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
  limit 1
$$;

-- Contraseña temporal fácil de dictar: sin 0/O, 1/l/I. Ej. «Nec-7kq4-Xm9t».
create function public.contrasena_temporal() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alfabeto text := 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  s text := '';
  i int;
begin
  for i in 0..7 loop
    s := s || substr(alfabeto, (get_byte(b, i) % length(alfabeto)) + 1, 1);
    if i = 3 then s := s || '-'; end if;
  end loop;
  return 'Nec-' || s;
end $$;

-- Pone una contraseña en auth.users y cierra las sesiones abiertas de ese usuario.
create function public.fijar_contrasena(uid uuid, clave text) returns void
language sql security definer set search_path = '' as $$
  update auth.users set encrypted_password = extensions.crypt(clave, extensions.gen_salt('bf', 10)),
                        updated_at = now()
   where id = uid;
  delete from auth.sessions where user_id = uid;
$$;

-- Campos que el proveedor puede proponer él mismo (nombre, especialidad y publicación los maneja NEC).
create function public.campos_proveedor() returns text[]
language sql immutable set search_path = '' as $$
  select array['municipio', 'anios', 'mayoreo_minimo', 'descripcion', 'whatsapp_oficial', 'clabe_oficial', 'banco',
               'dias_tianguis', 'envios', 'compromiso_devolucion']
$$;

-- ---------- Panel NEC: administrar cuentas de proveedor ----------

create function public.panel_crear_cuenta_proveedor(proveedor uuid, correo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  c text := lower(trim(correo));
  uid uuid;
  clave text := public.contrasena_temporal();
  nueva public.cuentas_proveedor;
begin
  m := public.exigir_nivel('admin_medio');
  if c !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Escribe un correo válido'; end if;
  if not exists (select 1 from public.proveedores where id = proveedor) then raise exception 'Proveedor no encontrado'; end if;
  if exists (select 1 from public.cuentas_proveedor where proveedor_id = proveedor) then
    raise exception 'Este proveedor ya tiene cuenta. Usa «Generar contraseña temporal nueva».';
  end if;
  if exists (select 1 from public.cuentas_proveedor x where x.correo = c) then
    raise exception 'Ese correo ya es la cuenta de otro proveedor';
  end if;
  if exists (select 1 from public.equipo e where e.correo = c) then
    raise exception 'Ese correo es de alguien del equipo NEC; usa otro para el proveedor';
  end if;

  select id into uid from auth.users u where lower(u.email) = c;
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', c,
            extensions.crypt(clave, extensions.gen_salt('bf', 10)), now(),
            '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', c, 'email_verified', true), 'email', now(), now());
  else
    -- Ya existía un usuario de Supabase con ese correo (sin equipo ni otra cuenta): se reutiliza.
    perform public.fijar_contrasena(uid, clave);
    update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()), banned_until = null where id = uid;
  end if;

  insert into public.cuentas_proveedor (proveedor_id, user_id, correo, creado_por)
  values (proveedor, uid, c, m.id) returning * into nueva;
  perform public.anotar(m, 'crear_cuenta_proveedor', 'proveedor', proveedor, null,
                        jsonb_build_object('correo', c), null);
  return jsonb_build_object('correo', c, 'contrasena', clave);
end $$;

create function public.panel_restablecer_cuenta_proveedor(proveedor uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  x public.cuentas_proveedor;
  clave text := public.contrasena_temporal();
begin
  m := public.exigir_nivel('admin_medio');
  select * into x from public.cuentas_proveedor where proveedor_id = proveedor for update;
  if x.id is null then raise exception 'Este proveedor no tiene cuenta'; end if;
  if not x.activa then raise exception 'La cuenta está desactivada; reactívala primero'; end if;
  perform public.fijar_contrasena(x.user_id, clave);
  update public.cuentas_proveedor set debe_cambiar = true, contrasena_temporal_en = now() where id = x.id;
  perform public.anotar(m, 'restablecer_cuenta_proveedor', 'proveedor', proveedor, null,
                        jsonb_build_object('correo', x.correo), null);
  return jsonb_build_object('correo', x.correo, 'contrasena', clave);
end $$;

create function public.panel_activar_cuenta_proveedor(proveedor uuid, p_activa boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  x public.cuentas_proveedor;
begin
  m := public.exigir_nivel('admin_medio');
  select * into x from public.cuentas_proveedor where proveedor_id = proveedor for update;
  if x.id is null then raise exception 'Este proveedor no tiene cuenta'; end if;
  update public.cuentas_proveedor set activa = p_activa where id = x.id;
  update auth.users set banned_until = case when p_activa then null else 'infinity'::timestamptz end where id = x.user_id;
  if not p_activa then delete from auth.sessions where user_id = x.user_id; end if;
  perform public.anotar(m, case when p_activa then 'reactivar_cuenta_proveedor' else 'desactivar_cuenta_proveedor' end,
                        'proveedor', proveedor, jsonb_build_object('activa', x.activa), jsonb_build_object('activa', p_activa), null);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Para cualquiera con sesión: ¿a dónde lo mando? ----------

create function public.mi_destino() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  if (public.miembro_actual()).id is not null then
    return jsonb_build_object('tipo', 'equipo');
  end if;
  x := public.cuenta_actual();
  if x.id is not null then
    return jsonb_build_object('tipo', 'proveedor', 'debe_cambiar', x.debe_cambiar);
  end if;
  return jsonb_build_object('tipo', null);
end $$;

-- ---------- Área «Mi negocio» (cuenta del proveedor) ----------

create function public.proveedor_mi_negocio() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'correo', x.correo, 'debe_cambiar', x.debe_cambiar,
      'id', p.id, 'slug', p.slug, 'nombre', p.nombre, 'especialidad', s.nombre, 'tipo_ubicacion', p.tipo_ubicacion,
      'municipio', p.municipio, 'anios', p.anios, 'mayoreo_minimo', p.mayoreo_minimo, 'descripcion', p.descripcion,
      'whatsapp_oficial', p.whatsapp_oficial, 'clabe_oficial', p.clabe_oficial, 'banco', p.banco,
      'dias_tianguis', p.dias_tianguis, 'envios', p.envios, 'compromiso_devolucion', p.compromiso_devolucion,
      'publicado', p.publicado, 'estado_sello', p.estado_sello, 'evaluado_en', p.evaluado_en,
      'proxima_revision', p.proxima_revision,
      'cambios', coalesce((select jsonb_agg(jsonb_build_object(
          'id', c.id, 'estado', c.estado, 'datos', c.datos, 'motivo', c.motivo, 'propuesto_en', c.propuesto_en,
          'revisado_en', c.revisado_en, 'comentario_revision', c.comentario_revision) order by c.propuesto_en desc)
        from public.cambios c where c.propuesto_por_cuenta = x.id), '[]'::jsonb))
    from public.proveedores p left join public.categorias s on s.id = p.especialidad_id
    where p.id = x.proveedor_id
  );
end $$;

create function public.proveedor_proponer(datos jsonb, motivo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  x public.cuentas_proveedor;
  k text;
  c public.cambios;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  if x.debe_cambiar then raise exception 'Primero cambia tu contraseña temporal'; end if;
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

-- La pantalla de cambio de contraseña la llama después de guardar la nueva.
create function public.proveedor_contrasena_cambiada() returns void
language plpgsql security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  update public.cuentas_proveedor set debe_cambiar = false where id = x.id;
end $$;

-- ---------- Ajustes a funciones del panel para mostrar cambios hechos por proveedores ----------

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
    'por_aprobar_por_mi', (select count(*) from public.cambios c where c.estado = 'pendiente'
                             and c.propuesto_por is distinct from m.id
                             and (c.tipo in ('alta', 'edicion') and public.rango(m.nivel) >= 2
                                  or c.tipo in ('sello', 'baja') and m.nivel = 'superadmin')),
    'solicitudes_nuevas', (select count(*) from public.solicitudes_auditoria where estado = 'recibida'),
    'solicitudes_total', (select count(*) from public.solicitudes_auditoria)
  );
end $$;

create or replace function public.panel_proveedor(pid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo;
begin
  m := public.exigir_nivel('staff');
  return (
    select to_jsonb(p) || jsonb_build_object(
      'especialidad', c.nombre,
      'cuenta', (select jsonb_build_object('correo', a.correo, 'activa', a.activa, 'debe_cambiar', a.debe_cambiar,
                   'creado_en', a.creado_en, 'contrasena_temporal_en', a.contrasena_temporal_en)
                 from public.cuentas_proveedor a where a.proveedor_id = p.id),
      'cambios', coalesce((select jsonb_agg(jsonb_build_object(
          'id', x.id, 'tipo', x.tipo, 'estado', x.estado, 'datos', x.datos, 'motivo', x.motivo,
          'propuesto_en', x.propuesto_en,
          'propuesto_por', coalesce(e.nombre, 'El proveedor (' || a.correo || ')', 'El proveedor'),
          'comentario_revision', x.comentario_revision)
          order by x.propuesto_en desc)
        from public.cambios x
        left join public.equipo e on e.id = x.propuesto_por
        left join public.cuentas_proveedor a on a.id = x.propuesto_por_cuenta
        where x.proveedor_id = p.id), '[]'::jsonb))
    from public.proveedores p left join public.categorias c on c.id = p.especialidad_id
    where p.id = pid
  );
end $$;

create or replace function public.panel_cambios(filtro text default 'pendiente') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'tipo', c.tipo, 'estado', c.estado, 'datos', c.datos, 'motivo', c.motivo,
      'propuesto_en', c.propuesto_en, 'propuesto_por_id', c.propuesto_por,
      'propuesto_por', coalesce(e.nombre, 'El proveedor (' || a.correo || ')', 'El proveedor'),
      'revisado_por', r.nombre, 'revisado_en', c.revisado_en, 'comentario_revision', c.comentario_revision,
      'proveedor_id', c.proveedor_id, 'proveedor', p.nombre) order by c.propuesto_en desc)
    from public.cambios c
    left join public.equipo e on e.id = c.propuesto_por
    left join public.cuentas_proveedor a on a.id = c.propuesto_por_cuenta
    left join public.equipo r on r.id = c.revisado_por
    left join public.proveedores p on p.id = c.proveedor_id
    where filtro = 'todos' or c.estado = filtro
  ), '[]'::jsonb);
end $$;

-- ---------- Permisos de ejecución ----------
revoke execute on function public.cuenta_actual(), public.contrasena_temporal(), public.fijar_contrasena(uuid, text),
  public.campos_proveedor()
  from public, anon, authenticated;

revoke execute on function public.panel_crear_cuenta_proveedor(uuid, text), public.panel_restablecer_cuenta_proveedor(uuid),
  public.panel_activar_cuenta_proveedor(uuid, boolean), public.mi_destino(), public.proveedor_mi_negocio(),
  public.proveedor_proponer(jsonb, text), public.proveedor_contrasena_cambiada()
  from public, anon;
grant execute on function public.panel_crear_cuenta_proveedor(uuid, text), public.panel_restablecer_cuenta_proveedor(uuid),
  public.panel_activar_cuenta_proveedor(uuid, boolean), public.mi_destino(), public.proveedor_mi_negocio(),
  public.proveedor_proponer(jsonb, text), public.proveedor_contrasena_cambiada()
  to authenticated;
