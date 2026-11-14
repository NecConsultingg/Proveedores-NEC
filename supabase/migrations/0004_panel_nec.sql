-- Panel NEC: equipo con 3 niveles, propuestas de cambio con aprobación y bitácora automática.
-- Decidido el 10–14 nov 2026 (ver DISENO.md).
--
-- Diseño de seguridad:
--   * Las tablas nuevas tienen RLS activo y NINGUNA política: nadie las lee ni escribe directo.
--   * Todo pasa por funciones `panel_*` (SECURITY DEFINER) que revisan el nivel de quien llama.
--   * Quién llama = correo del token de sesión de Supabase (solo existe si el correo está confirmado),
--     buscado en la tabla `equipo` y activo.
--   * Reglas: nadie aprueba su propio cambio; sello y baja los aprueba solo un superadministrador;
--     el superadministrador puede editar directo (queda en bitácora); las cuentas se desactivan, no se borran.

create type public.nivel_equipo as enum ('staff', 'admin_medio', 'superadmin');

create table public.equipo (
  id uuid primary key default gen_random_uuid(),
  correo text not null unique check (correo = lower(correo) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre text not null,
  nivel public.nivel_equipo not null,
  activo boolean not null default true,
  creado_por uuid references public.equipo(id),
  creado_en timestamptz not null default now(),
  desactivado_en timestamptz
);

create table public.cambios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('alta', 'edicion', 'baja', 'sello')),
  proveedor_id uuid references public.proveedores(id) on delete set null,
  datos jsonb not null default '{}',
  motivo text not null check (length(trim(motivo)) >= 3),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'aplicado_directo')),
  propuesto_por uuid not null references public.equipo(id),
  propuesto_en timestamptz not null default now(),
  revisado_por uuid references public.equipo(id),
  revisado_en timestamptz,
  comentario_revision text,
  constraint proveedor_requerido check (tipo = 'alta' or proveedor_id is not null)
);
create index on public.cambios (estado, propuesto_en desc);
create index on public.cambios (proveedor_id);
create index on public.cambios (propuesto_por);
create index on public.cambios (revisado_por);

create table public.bitacora (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  miembro_id uuid references public.equipo(id),
  correo text,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  antes jsonb,
  despues jsonb,
  motivo text
);
create index on public.bitacora (fecha desc);
create index on public.bitacora (miembro_id);

alter table public.equipo enable row level security;
alter table public.cambios enable row level security;
alter table public.bitacora enable row level security;
-- Sin políticas a propósito: solo las funciones panel_* acceden.

insert into public.equipo (correo, nombre, nivel) values
  ('necconsultingg@gmail.com', 'NEC Consulting', 'superadmin'),
  ('urielnex45@gmail.com', 'Uriel', 'superadmin');

-- ---------- Funciones internas ----------

create function public.miembro_actual() returns public.equipo
language sql stable security definer set search_path = '' as $$
  select e.* from public.equipo e
  where e.activo and e.correo = lower(coalesce(auth.jwt() ->> 'email', ''))
    and coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
  limit 1
$$;

create function public.rango(n public.nivel_equipo) returns int
language sql immutable set search_path = '' as $$
  select case n when 'staff' then 1 when 'admin_medio' then 2 when 'superadmin' then 3 end
$$;

create function public.exigir_nivel(minimo public.nivel_equipo) returns public.equipo
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo;
begin
  m := public.miembro_actual();
  if m.id is null then
    raise exception 'No tienes acceso al panel NEC' using errcode = '42501';
  end if;
  if public.rango(m.nivel) < public.rango(minimo) then
    raise exception 'Tu nivel no permite esta acción' using errcode = '42501';
  end if;
  return m;
end $$;

create function public.anotar(m public.equipo, accion text, entidad text, entidad_id uuid,
                              antes jsonb, despues jsonb, motivo text) returns void
language sql security definer set search_path = '' as $$
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (m.id, m.correo, accion, entidad, entidad_id, antes, despues, motivo)
$$;

-- Campos que se pueden proponer en altas y ediciones (nunca el sello, el slug ni la marca demo).
create function public.campos_editables() returns text[]
language sql immutable set search_path = '' as $$
  select array['nombre', 'especialidad_id', 'municipio', 'tipo_ubicacion', 'anios', 'mayoreo_minimo', 'descripcion',
               'whatsapp_oficial', 'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'foto_portada_url', 'publicado', 'consentimiento_publicacion_en', 'notas_internas']
$$;

create function public.validar_datos(tipo text, datos jsonb) returns void
language plpgsql immutable set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(datos) <> 'object' then
    raise exception 'Datos inválidos';
  end if;
  if tipo in ('alta', 'edicion') then
    for k in select jsonb_object_keys(datos) loop
      if not k = any(public.campos_editables()) then
        raise exception 'El campo «%» no se puede cambiar desde aquí', k;
      end if;
    end loop;
    if tipo = 'alta' and (datos ->> 'nombre' is null or datos ->> 'especialidad_id' is null or datos ->> 'tipo_ubicacion' is null) then
      raise exception 'Una alta necesita nombre, especialidad y tipo de ubicación';
    end if;
    if tipo = 'edicion' and datos = '{}'::jsonb then
      raise exception 'No hay cambios que proponer';
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

create function public.aplicar_cambio(c public.cambios, m public.equipo) returns uuid
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

  if c.tipo in ('alta', 'edicion') then
    -- «publicado» al final, para que los demás datos (p. ej. la fecha de autorización) ya estén puestos.
    for k, v in select key, value from jsonb_each(c.datos) order by key = 'publicado' loop
      select format_type(a.atttypid, a.atttypmod) into tipo_col
      from pg_attribute a where a.attrelid = 'public.proveedores'::regclass and a.attname = k and not a.attisdropped;
      execute format('update public.proveedores set %I = ($1 #>> ''{}'')::%s where id = $2', k, tipo_col) using v, pid;
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

-- ---------- Funciones del panel (las que llama el sitio) ----------

-- Para la pantalla de acceso: ¿este correo pertenece al equipo activo? (no revela nada más)
create function public.es_correo_equipo(correo text) returns boolean
language sql stable security definer set search_path = '' as $$
  -- $1 y no «correo»: en SQL, un nombre suelto se resolvería como la columna e.correo.
  select exists (select 1 from public.equipo e where e.activo and e.correo = lower(trim($1)))
$$;

create function public.panel_yo() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when m.id is null then null
              else jsonb_build_object('id', m.id, 'nombre', m.nombre, 'correo', m.correo, 'nivel', m.nivel) end
  from (select (public.miembro_actual()).*) m
$$;

create function public.panel_resumen() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo;
begin
  m := public.exigir_nivel('staff');
  return jsonb_build_object(
    'proveedores_publicados', (select count(*) from public.proveedores where publicado and not demo),
    'proveedores_demo', (select count(*) from public.proveedores where demo),
    'proveedores_sin_publicar', (select count(*) from public.proveedores where not publicado),
    'cambios_pendientes', (select count(*) from public.cambios where estado = 'pendiente'),
    'por_aprobar_por_mi', (select count(*) from public.cambios c where c.estado = 'pendiente' and c.propuesto_por <> m.id
                             and (c.tipo in ('alta', 'edicion') and public.rango(m.nivel) >= 2
                                  or c.tipo in ('sello', 'baja') and m.nivel = 'superadmin')),
    'solicitudes_nuevas', (select count(*) from public.solicitudes_auditoria where estado = 'recibida'),
    'solicitudes_total', (select count(*) from public.solicitudes_auditoria)
  );
end $$;

create function public.panel_proveedores() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((
    select jsonb_agg(to_jsonb(p) || jsonb_build_object('especialidad', c.nombre) order by p.nombre)
    from public.proveedores p left join public.categorias c on c.id = p.especialidad_id
  ), '[]'::jsonb);
end $$;

create function public.panel_proveedor(pid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo;
begin
  m := public.exigir_nivel('staff');
  return (
    select to_jsonb(p) || jsonb_build_object(
      'especialidad', c.nombre,
      'cambios', coalesce((select jsonb_agg(jsonb_build_object(
          'id', x.id, 'tipo', x.tipo, 'estado', x.estado, 'datos', x.datos, 'motivo', x.motivo,
          'propuesto_en', x.propuesto_en, 'propuesto_por', e.nombre, 'comentario_revision', x.comentario_revision)
          order by x.propuesto_en desc)
        from public.cambios x join public.equipo e on e.id = x.propuesto_por where x.proveedor_id = p.id), '[]'::jsonb))
    from public.proveedores p left join public.categorias c on c.id = p.especialidad_id
    where p.id = pid
  );
end $$;

create function public.panel_especialidades() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'nombre', s.nombre, 'grupo', g.nombre, 'cupo', s.cupo,
             'ocupados', (select count(*) from public.proveedores p where p.especialidad_id = s.id and p.publicado))
             order by g.orden, s.orden)
    from public.categorias s join public.categorias g on g.id = s.parent_id
    where s.nivel = 3 and s.activa
  ), '[]'::jsonb);
end $$;

create function public.panel_proponer(tipo text, proveedor uuid, datos jsonb, motivo text, directo boolean default false)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.equipo;
  c public.cambios;
  pid uuid;
begin
  m := public.exigir_nivel(case when tipo in ('sello', 'baja') then 'admin_medio'::public.nivel_equipo
                                else 'staff'::public.nivel_equipo end);
  perform public.validar_datos(tipo, coalesce(datos, '{}'::jsonb));
  if directo and (m.nivel <> 'superadmin' or tipo in ('sello', 'baja')) then
    raise exception 'Solo un superadministrador edita directo, y nunca el sello ni una baja';
  end if;
  if tipo <> 'alta' and not exists (select 1 from public.proveedores where id = proveedor) then
    raise exception 'Proveedor no encontrado';
  end if;

  insert into public.cambios (tipo, proveedor_id, datos, motivo, propuesto_por, estado, revisado_por, revisado_en)
  values (tipo, case when tipo = 'alta' then null else proveedor end, coalesce(datos, '{}'::jsonb), motivo, m.id,
          case when directo then 'aplicado_directo' else 'pendiente' end,
          case when directo then m.id end, case when directo then now() end)
  returning * into c;

  perform public.anotar(m, case when directo then 'editar_directo' else 'proponer_' || tipo end,
                        'cambio', c.id, null, to_jsonb(c), motivo);
  if directo then
    pid := public.aplicar_cambio(c, m);
  end if;
  return jsonb_build_object('cambio_id', c.id, 'estado', c.estado, 'proveedor_id', coalesce(pid, c.proveedor_id));
end $$;

create function public.panel_cambios(filtro text default 'pendiente') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'tipo', c.tipo, 'estado', c.estado, 'datos', c.datos, 'motivo', c.motivo,
      'propuesto_en', c.propuesto_en, 'propuesto_por_id', c.propuesto_por, 'propuesto_por', e.nombre,
      'revisado_por', r.nombre, 'revisado_en', c.revisado_en, 'comentario_revision', c.comentario_revision,
      'proveedor_id', c.proveedor_id, 'proveedor', p.nombre) order by c.propuesto_en desc)
    from public.cambios c
    join public.equipo e on e.id = c.propuesto_por
    left join public.equipo r on r.id = c.revisado_por
    left join public.proveedores p on p.id = c.proveedor_id
    where filtro = 'todos' or c.estado = filtro
  ), '[]'::jsonb);
end $$;

create function public.panel_resolver(cambio uuid, aprobar boolean, comentario text default null) returns jsonb
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
  end if;
  update public.cambios
     set estado = case when aprobar then 'aprobado' else 'rechazado' end,
         revisado_por = m.id, revisado_en = now(), comentario_revision = comentario
   where id = c.id;
  perform public.anotar(m, case when aprobar then 'aprobar_' else 'rechazar_' end || c.tipo, 'cambio', c.id,
                        null, jsonb_build_object('comentario', comentario), c.motivo);
  return jsonb_build_object('ok', true);
end $$;

create function public.panel_solicitudes() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((select jsonb_agg(to_jsonb(s) order by s.recibida_en desc) from public.solicitudes_auditoria s), '[]'::jsonb);
end $$;

create function public.panel_estado_solicitud(solicitud uuid, nuevo text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.equipo; antes text;
begin
  m := public.exigir_nivel('staff');
  if nuevo in ('preseleccionado', 'no_seleccionado') and public.rango(m.nivel) < 2 then
    raise exception 'La preselección la decide un administrador';
  end if;
  select estado into antes from public.solicitudes_auditoria where id = solicitud;
  if antes is null then raise exception 'Solicitud no encontrada'; end if;
  update public.solicitudes_auditoria set estado = nuevo where id = solicitud;
  perform public.anotar(m, 'estado_solicitud', 'solicitud', solicitud,
                        jsonb_build_object('estado', antes), jsonb_build_object('estado', nuevo), null);
  return jsonb_build_object('ok', true);
end $$;

create function public.panel_equipo() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('admin_medio');
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'correo', e.correo, 'nombre', e.nombre,
           'nivel', e.nivel, 'activo', e.activo, 'creado_en', e.creado_en, 'desactivado_en', e.desactivado_en)
           order by e.activo desc, public.rango(e.nivel) desc, e.nombre) from public.equipo e), '[]'::jsonb);
end $$;

create function public.panel_alta_miembro(correo text, nombre text, nivel public.nivel_equipo) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.equipo; nuevo public.equipo;
begin
  m := public.exigir_nivel('admin_medio');
  if m.nivel = 'admin_medio' and nivel <> 'staff' then
    raise exception 'Un administrador medio solo da de alta staff';
  end if;
  insert into public.equipo (correo, nombre, nivel, creado_por)
  values (lower(trim(correo)), trim(nombre), nivel, m.id)
  returning * into nuevo;
  perform public.anotar(m, 'alta_miembro', 'equipo', nuevo.id, null, to_jsonb(nuevo), null);
  return jsonb_build_object('id', nuevo.id);
exception when unique_violation then
  raise exception 'Ese correo ya está en el equipo';
end $$;

create function public.panel_activar_miembro(miembro uuid, p_activo boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.equipo; obj public.equipo;
begin
  m := public.exigir_nivel('admin_medio');
  select * into obj from public.equipo where id = miembro;
  if obj.id is null then raise exception 'Miembro no encontrado'; end if;
  if obj.id = m.id then raise exception 'No puedes desactivar tu propia cuenta'; end if;
  if m.nivel = 'admin_medio' and obj.nivel <> 'staff' then
    raise exception 'Un administrador medio solo administra cuentas de staff';
  end if;
  if not p_activo and obj.nivel = 'superadmin'
     and (select count(*) from public.equipo e where e.nivel = 'superadmin' and e.activo) <= 2 then
    raise exception 'Debe haber al menos 2 superadministradores activos';
  end if;
  update public.equipo set activo = p_activo,
         desactivado_en = case when p_activo then null else now() end
   where id = miembro;
  perform public.anotar(m, case when p_activo then 'reactivar_miembro' else 'desactivar_miembro' end, 'equipo', miembro,
                        jsonb_build_object('activo', obj.activo), jsonb_build_object('activo', p_activo), null);
  return jsonb_build_object('ok', true);
end $$;

create function public.panel_bitacora(limite int default 200) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('admin_medio');
  return coalesce((select jsonb_agg(to_jsonb(b) order by b.fecha desc)
                   from (select * from public.bitacora order by fecha desc limit least(limite, 1000)) b), '[]'::jsonb);
end $$;

-- ---------- Permisos de ejecución ----------
revoke execute on function public.miembro_actual(), public.exigir_nivel(public.nivel_equipo),
  public.anotar(public.equipo, text, text, uuid, jsonb, jsonb, text), public.aplicar_cambio(public.cambios, public.equipo),
  public.validar_datos(text, jsonb), public.campos_editables(), public.rango(public.nivel_equipo)
  from public, anon, authenticated;

revoke execute on function public.panel_yo(), public.panel_resumen(), public.panel_proveedores(),
  public.panel_proveedor(uuid), public.panel_especialidades(), public.panel_proponer(text, uuid, jsonb, text, boolean),
  public.panel_cambios(text), public.panel_resolver(uuid, boolean, text), public.panel_solicitudes(),
  public.panel_estado_solicitud(uuid, text), public.panel_equipo(), public.panel_alta_miembro(text, text, public.nivel_equipo),
  public.panel_activar_miembro(uuid, boolean), public.panel_bitacora(int)
  from public, anon;
grant execute on function public.panel_yo(), public.panel_resumen(), public.panel_proveedores(),
  public.panel_proveedor(uuid), public.panel_especialidades(), public.panel_proponer(text, uuid, jsonb, text, boolean),
  public.panel_cambios(text), public.panel_resolver(uuid, boolean, text), public.panel_solicitudes(),
  public.panel_estado_solicitud(uuid, text), public.panel_equipo(), public.panel_alta_miembro(text, text, public.nivel_equipo),
  public.panel_activar_miembro(uuid, boolean), public.panel_bitacora(int)
  to authenticated;

revoke execute on function public.es_correo_equipo(text) from public, authenticated;
grant execute on function public.es_correo_equipo(text) to anon;
