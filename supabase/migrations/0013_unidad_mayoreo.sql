-- Unidad del mínimo de mayoreo (16-nov-2026): el proveedor elige piezas, paquetes, docenas, pares, etc.
-- Los que ya existen quedan en «piezas», que era lo que se mostraba.
alter table public.proveedores
  add column mayoreo_unidad text not null default 'piezas' check (length(trim(mayoreo_unidad)) between 2 and 30);
grant select (mayoreo_unidad) on public.proveedores to anon, authenticated;

create or replace function public.campos_editables() returns text[]
language sql immutable set search_path = '' as $$
  select array['nombre', 'especialidad_id', 'municipio', 'tipo_ubicacion', 'anios', 'mayoreo_minimo', 'descripcion',
               'whatsapp_oficial', 'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'foto_portada_url', 'publicado', 'consentimiento_publicacion_en', 'notas_internas',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'estado_republica', 'maps_url', 'whatsapps', 'mayoreo_unidad']
$$;

create or replace function public.campos_proveedor() returns text[]
language sql immutable set search_path = '' as $$
  select array['estado_republica', 'municipio', 'anios', 'mayoreo_minimo', 'descripcion', 'whatsapp_oficial', 'whatsapps',
               'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'maps_url', 'mayoreo_unidad']
$$;

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
      'anios', p.anios, 'mayoreo_minimo', p.mayoreo_minimo, 'mayoreo_unidad', p.mayoreo_unidad, 'descripcion', p.descripcion,
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
