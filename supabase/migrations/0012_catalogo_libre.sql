-- 16-nov-2026: el catálogo es un activo «líquido»: el proveedor agrega, cambia y borra modelos libremente y se
-- ven de inmediato en su perfil (sin aprobación de NEC). NEC conserva la opción de OCULTAR un modelo desde el panel
-- (estado «rechazado» = oculto, con comentario); si el proveedor lo vuelve a guardar, se muestra otra vez.
create or replace function public.proveedor_catalogo_guardar(item uuid, p_nombre text, p_descripcion text, p_precio text,
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
            coalesce((select max(orden) + 1 from public.catalogo_items where proveedor_id = x.proveedor_id), 0), 'aprobado')
    returning id into nuevo;
  else
    update public.catalogo_items
       set nombre = trim(p_nombre), descripcion = nullif(trim(p_descripcion), ''),
           precio_mayoreo = nullif(trim(p_precio), ''), foto_url = p_foto_url,
           publicos = coalesce(p_publicos, '{}')::public.publico[],
           estado = 'aprobado', comentario_revision = null, revisado_por = null, revisado_en = null, actualizado_en = now()
     where id = item and proveedor_id = x.proveedor_id
     returning id into nuevo;
    if nuevo is null then raise exception 'Modelo no encontrado'; end if;
  end if;
  insert into public.bitacora (miembro_id, correo, accion, entidad, entidad_id, antes, despues, motivo)
  values (null, x.correo, case when item is null then 'proveedor_agrega_modelo' else 'proveedor_edita_modelo' end,
          'catalogo', nuevo, null, jsonb_build_object('nombre', trim(p_nombre)), null);
  return jsonb_build_object('id', nuevo);
end $$;
