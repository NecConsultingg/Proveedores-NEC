-- Catálogo que sube el proveedor desde «Mi negocio» (16-nov-2026).
--   * Hasta 12 modelos, 1 foto cada uno, en el bucket público «catalogo», carpeta <proveedor_id>/.
--   * Cada modelo nuevo o editado queda «pendiente»; el perfil público solo muestra los «aprobados».
--   * NEC los revisa en el panel (Catálogo): admin medio o superadmin aprueba o rechaza con comentario.

alter table public.catalogo_items
  add column estado text not null default 'aprobado' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  add column comentario_revision text,
  add column revisado_por uuid references public.equipo(id),
  add column revisado_en timestamptz,
  add column actualizado_en timestamptz not null default now(),
  add constraint catalogo_nombre_largo check (length(nombre) between 2 and 80),
  add constraint catalogo_descripcion_largo check (descripcion is null or length(descripcion) <= 300),
  add constraint catalogo_precio_largo check (precio_mayoreo is null or length(precio_mayoreo) <= 40);
create index on public.catalogo_items (proveedor_id);
create index on public.catalogo_items (estado);
create index on public.catalogo_items (revisado_por);

-- El público solo ve modelos aprobados de proveedores publicados.
drop policy "catalogo de publicados visible" on public.catalogo_items;
create policy "catalogo aprobado de publicados visible" on public.catalogo_items for select
  using (estado = 'aprobado' and exists (select 1 from public.proveedores p where p.id = catalogo_items.proveedor_id and p.publicado));

-- ---------- Fotos: cada proveedor sube y borra solo en su carpeta ----------
create function public.mi_proveedor_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select (public.cuenta_actual()).proveedor_id
$$;
revoke execute on function public.mi_proveedor_id() from public, anon;
grant execute on function public.mi_proveedor_id() to authenticated;

create policy "proveedor sube fotos a su carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and (storage.foldername(name))[1] = public.mi_proveedor_id()::text);
-- Supabase necesita poder «ver» el archivo para borrarlo.
create policy "proveedor ve fotos de su carpeta" on storage.objects for select to authenticated
  using (bucket_id = 'catalogo' and (storage.foldername(name))[1] = public.mi_proveedor_id()::text);
create policy "proveedor borra fotos de su carpeta" on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and (storage.foldername(name))[1] = public.mi_proveedor_id()::text);

-- ---------- Proveedor ----------
create function public.proveedor_mi_catalogo() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'nombre', i.nombre, 'descripcion', i.descripcion, 'precio_mayoreo', i.precio_mayoreo,
      'foto_url', i.foto_url, 'publicos', i.publicos, 'estado', i.estado, 'comentario_revision', i.comentario_revision,
      'orden', i.orden) order by i.orden, i.creado_en)
    from public.catalogo_items i where i.proveedor_id = x.proveedor_id), '[]'::jsonb);
end $$;

create function public.proveedor_catalogo_guardar(item uuid, p_nombre text, p_descripcion text, p_precio text,
                                                  p_foto_url text, p_publicos text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  x public.cuentas_proveedor;
  esp uuid;
  carpeta text;
  nuevo uuid;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  if x.debe_cambiar then raise exception 'Primero cambia tu contraseña temporal'; end if;
  if x.registro_enviado_en is null then raise exception 'Primero completa tu registro'; end if;
  if coalesce(length(trim(p_nombre)), 0) < 2 then raise exception 'Escribe el nombre del modelo'; end if;
  if p_foto_url is null then raise exception 'Agrega una foto del modelo'; end if;
  carpeta := '/storage/v1/object/public/catalogo/' || x.proveedor_id::text || '/';
  if position(carpeta in p_foto_url) = 0 or p_foto_url !~ '^https://[a-z0-9]+\.supabase\.co/' then
    raise exception 'La foto debe subirse desde esta pantalla';
  end if;
  if exists (select 1 from unnest(coalesce(p_publicos, '{}')) p where not p = any (enum_range(null::public.publico)::text[])) then
    raise exception 'Público no válido';
  end if;

  if item is null then
    if (select count(*) from public.catalogo_items where proveedor_id = x.proveedor_id) >= 12 then
      raise exception 'Tu catálogo ya tiene 12 modelos, el máximo. Borra uno para agregar otro.';
    end if;
    select especialidad_id into esp from public.proveedores where id = x.proveedor_id;
    insert into public.catalogo_items (proveedor_id, nombre, descripcion, precio_mayoreo, foto_url, publicos, categoria_id,
                                       orden, estado)
    values (x.proveedor_id, trim(p_nombre), nullif(trim(p_descripcion), ''), nullif(trim(p_precio), ''), p_foto_url,
            coalesce(p_publicos, '{}')::public.publico[], esp,
            coalesce((select max(orden) + 1 from public.catalogo_items where proveedor_id = x.proveedor_id), 0), 'pendiente')
    returning id into nuevo;
  else
    update public.catalogo_items
       set nombre = trim(p_nombre), descripcion = nullif(trim(p_descripcion), ''),
           precio_mayoreo = nullif(trim(p_precio), ''), foto_url = p_foto_url,
           publicos = coalesce(p_publicos, '{}')::public.publico[],
           estado = 'pendiente', comentario_revision = null, revisado_por = null, revisado_en = null, actualizado_en = now()
     where id = item and proveedor_id = x.proveedor_id
     returning id into nuevo;
    if nuevo is null then raise exception 'Modelo no encontrado'; end if;
  end if;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, case when item is null then 'proveedor_agrega_modelo' else 'proveedor_edita_modelo' end,
          'catalogo', nuevo, null, jsonb_build_object('nombre', trim(p_nombre)), null);
  return jsonb_build_object('id', nuevo);
end $$;

create function public.proveedor_catalogo_borrar(item uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  x public.cuentas_proveedor;
  borrado public.catalogo_items;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  delete from public.catalogo_items where id = item and proveedor_id = x.proveedor_id returning * into borrado;
  if borrado.id is null then raise exception 'Modelo no encontrado'; end if;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, 'proveedor_borra_modelo', 'catalogo', item, to_jsonb(borrado), null, null);
  return jsonb_build_object('foto_url', borrado.foto_url);
end $$;

-- ---------- Panel NEC ----------
create function public.panel_catalogo(filtro text default 'pendiente') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.exigir_nivel('staff');
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'nombre', i.nombre, 'descripcion', i.descripcion, 'precio_mayoreo', i.precio_mayoreo,
      'foto_url', i.foto_url, 'publicos', i.publicos, 'estado', i.estado, 'comentario_revision', i.comentario_revision,
      'actualizado_en', i.actualizado_en, 'proveedor_id', p.id, 'proveedor', p.nombre, 'revisado_por', e.nombre,
      'revisado_en', i.revisado_en) order by i.actualizado_en desc)
    from public.catalogo_items i join public.proveedores p on p.id = i.proveedor_id
    left join public.equipo e on e.id = i.revisado_por
    where filtro = 'todos' or i.estado = filtro), '[]'::jsonb);
end $$;

create function public.panel_catalogo_resolver(item uuid, aprobar boolean, comentario text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.equipo; i public.catalogo_items;
begin
  m := public.exigir_nivel('admin_medio');
  select * into i from public.catalogo_items where id = item for update;
  if i.id is null then raise exception 'Modelo no encontrado'; end if;
  if not aprobar and coalesce(trim(comentario), '') = '' then raise exception 'Escribe qué debe corregir el proveedor'; end if;
  update public.catalogo_items
     set estado = case when aprobar then 'aprobado' else 'rechazado' end,
         comentario_revision = case when aprobar then null else trim(comentario) end,
         revisado_por = m.id, revisado_en = now()
   where id = item;
  perform public.anotar(m, case when aprobar then 'aprobar_modelo' else 'rechazar_modelo' end, 'catalogo', item,
                        null, jsonb_build_object('nombre', i.nombre, 'comentario', comentario), null);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.panel_resumen() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare m public.equipo; modelos int;
begin
  m := public.exigir_nivel('staff');
  modelos := (select count(*) from public.catalogo_items where estado = 'pendiente');
  return jsonb_build_object(
    'proveedores_publicados', (select count(*) from public.proveedores where publicado and not demo),
    'proveedores_demo', (select count(*) from public.proveedores where demo),
    'proveedores_sin_publicar', (select count(*) from public.proveedores where not publicado),
    'cambios_pendientes', (select count(*) from public.cambios where estado = 'pendiente'),
    'registros_nuevos', (select count(*) from public.cambios where estado = 'pendiente' and tipo = 'registro'),
    'modelos_por_revisar', modelos,
    'por_aprobar_por_mi', (select count(*) from public.cambios c where c.estado = 'pendiente'
                             and c.propuesto_por is distinct from m.id
                             and (c.tipo in ('alta', 'edicion', 'registro') and public.rango(m.nivel) >= 2
                                  or c.tipo in ('sello', 'baja') and m.nivel = 'superadmin')),
    'solicitudes_nuevas', (select count(*) from public.solicitudes_auditoria where estado = 'recibida'),
    'solicitudes_total', (select count(*) from public.solicitudes_auditoria)
  );
end $$;

revoke execute on function public.proveedor_mi_catalogo(), public.proveedor_catalogo_guardar(uuid, text, text, text, text, text[]),
  public.proveedor_catalogo_borrar(uuid), public.panel_catalogo(text), public.panel_catalogo_resolver(uuid, boolean, text)
  from public, anon;
grant execute on function public.proveedor_mi_catalogo(), public.proveedor_catalogo_guardar(uuid, text, text, text, text, text[]),
  public.proveedor_catalogo_borrar(uuid), public.panel_catalogo(text), public.panel_catalogo_resolver(uuid, boolean, text)
  to authenticated;
