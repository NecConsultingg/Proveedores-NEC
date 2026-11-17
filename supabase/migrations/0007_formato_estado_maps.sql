-- 16-nov-2026 (pedido de Rubén):
--   * Calzado se vuelve UNA sola especialidad (2 lugares): 5 especialidades en total.
--   * «Dónde vende» (fábrica/puesto) se reemplaza por «Formato de venta»: presencial, en línea y otros medios.
--   * «Municipio» se reemplaza por «Estado» (lista de los 32 estados).
--   * Enlace de Google Maps que pega el proveedor y se muestra al público como botón.
-- Las columnas viejas (tipo_ubicacion, municipio) se conservan pero dejan de ser obligatorias.

-- ---------- Calzado: una sola especialidad ----------
update public.categorias set slug = 'calzado-general', nombre = 'Calzado', cupo = 2, orden = 1 where slug = 'tenis';
update public.categorias set activa = false where slug = 'zapatos';

-- ---------- Estados de la República ----------
create function public.estados_mexico() returns text[]
language sql immutable set search_path = '' as $$
  select array['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
               'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
               'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
               'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
               'Yucatán', 'Zacatecas']
$$;

-- ---------- Proveedores ----------
alter table public.proveedores alter column tipo_ubicacion drop not null, alter column municipio drop not null;
alter table public.proveedores
  add column vende_presencial boolean not null default false,
  add column vende_en_linea boolean not null default false,
  add column otros_medios text check (length(otros_medios) <= 300),
  add column estado_republica text check (estado_republica = any (public.estados_mexico())),
  add column maps_url text check (
    length(maps_url) <= 500 and
    maps_url ~ '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.)?google\.com(\.mx)?/maps|maps\.google\.com(\.mx)?/)'
  );
grant select (vende_presencial, vende_en_linea, otros_medios, estado_republica, maps_url) on public.proveedores to anon, authenticated;

-- ---------- Solicitudes de «Quiero ser auditado» ----------
alter table public.solicitudes_auditoria alter column tipo_ubicacion drop not null, alter column municipio drop not null;
alter table public.solicitudes_auditoria
  add column vende_presencial boolean not null default false,
  add column vende_en_linea boolean not null default false,
  add column otros_medios text check (length(otros_medios) <= 300),
  add column estado_republica text check (estado_republica = any (public.estados_mexico()));
grant insert (vende_presencial, vende_en_linea, otros_medios, estado_republica) on public.solicitudes_auditoria to anon, authenticated;

-- ---------- Campos que se pueden proponer ----------
create or replace function public.campos_editables() returns text[]
language sql immutable set search_path = '' as $$
  select array['nombre', 'especialidad_id', 'municipio', 'tipo_ubicacion', 'anios', 'mayoreo_minimo', 'descripcion',
               'whatsapp_oficial', 'clabe_oficial', 'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'foto_portada_url', 'publicado', 'consentimiento_publicacion_en', 'notas_internas',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'estado_republica', 'maps_url']
$$;

create or replace function public.campos_proveedor() returns text[]
language sql immutable set search_path = '' as $$
  select array['estado_republica', 'municipio', 'anios', 'mayoreo_minimo', 'descripcion', 'whatsapp_oficial', 'clabe_oficial',
               'banco', 'dias_tianguis', 'envios', 'compromiso_devolucion',
               'vende_presencial', 'vende_en_linea', 'otros_medios', 'maps_url']
$$;

-- Una alta ya no exige «dónde vende» (tipo_ubicacion): basta nombre y especialidad.
create or replace function public.validar_datos(tipo text, datos jsonb) returns void
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
    if tipo = 'alta' and (datos ->> 'nombre' is null or datos ->> 'especialidad_id' is null) then
      raise exception 'Una alta necesita nombre y especialidad';
    end if;
    if tipo = 'edicion' and datos = '{}'::jsonb then
      raise exception 'No hay cambios que proponer';
    end if;
    if datos ? 'estado_republica' and datos ->> 'estado_republica' is not null and not (datos ->> 'estado_republica') = any(public.estados_mexico()) then
      raise exception 'Elige un estado de la lista';
    end if;
    if datos ? 'maps_url' and datos ->> 'maps_url' is not null and (datos ->> 'maps_url') !~
       '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.)?google\.com(\.mx)?/maps|maps\.google\.com(\.mx)?/)' then
      raise exception 'El enlace de ubicación debe ser de Google Maps (empieza con https://maps.app.goo.gl/…)';
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

-- «Mi negocio» devuelve también los campos nuevos.
create or replace function public.proveedor_mi_negocio() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare x public.cuentas_proveedor;
begin
  x := public.cuenta_actual();
  if x.id is null then raise exception 'No tienes una cuenta de proveedor activa' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'correo', x.correo, 'debe_cambiar', x.debe_cambiar,
      'id', p.id, 'slug', p.slug, 'nombre', p.nombre, 'especialidad', s.nombre,
      'estado_republica', p.estado_republica, 'vende_presencial', p.vende_presencial, 'vende_en_linea', p.vende_en_linea,
      'otros_medios', p.otros_medios, 'maps_url', p.maps_url,
      'anios', p.anios, 'mayoreo_minimo', p.mayoreo_minimo, 'descripcion', p.descripcion,
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

-- estados_mexico() queda ejecutable por todos: la usan las restricciones al guardar solicitudes públicas.
