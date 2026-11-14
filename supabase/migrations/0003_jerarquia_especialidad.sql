-- Jerarquía de categorías, cupo por especialidad, públicos como filtro, CLABE oficial,
-- ubicaciones con mapa y verificación de contactos. Decidido el 10-nov-2026.
--
-- Reglas:
--   * Jerarquía de 3 niveles: sector (1) → categoría (2) → subcategoría (3).
--   * Cada proveedor tiene UNA especialidad (subcategoría) y ocupa UN lugar del cupo de esa especialidad.
--   * Puede tener hasta 2 categorías secundarias (subcategorías): aparece en ellas, pero no ocupa lugar.
--   * El público (dama, caballero…) es un filtro que sale de su catálogo, no forma parte del cupo.
--   * Las categorías se archivan (activa = false), no se borran.

create type public.publico as enum ('dama', 'caballero', 'nina', 'nino', 'bebe', 'unisex');

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categorias(id),
  nivel smallint not null check (nivel in (1, 2, 3)),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  cupo smallint check (cupo between 1 and 30),
  orden smallint not null default 0,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint raiz_sin_padre check ((nivel = 1) = (parent_id is null)),
  constraint cupo_solo_en_subcategoria check (cupo is null or nivel = 3),
  constraint subcategoria_con_cupo check (nivel <> 3 or cupo is not null)
);
create index on public.categorias (parent_id);

create function public.validar_categoria() returns trigger language plpgsql set search_path = '' as $$
declare nivel_padre smallint; ocupados int;
begin
  if new.parent_id is not null then
    select nivel into nivel_padre from public.categorias where id = new.parent_id;
    if nivel_padre is distinct from new.nivel - 1 then
      raise exception 'La categoría padre debe ser del nivel %', new.nivel - 1;
    end if;
  end if;
  if tg_op = 'UPDATE' and new.nivel = 3 then
    select count(*) into ocupados from public.proveedores where especialidad_id = new.id and publicado;
    if new.cupo < ocupados then
      raise exception 'No se puede bajar el cupo a %: ya hay % proveedores publicados', new.cupo, ocupados;
    end if;
  end if;
  return new;
end $$;

-- ---------- Catálogo de categorías inicial ----------
insert into public.categorias (nivel, slug, nombre, orden, activa) values
  (1, 'textil', 'Textil y confección', 1, true),
  (1, 'calzado', 'Calzado', 2, false),
  (1, 'accesorios', 'Accesorios', 3, false);

insert into public.categorias (parent_id, nivel, slug, nombre, orden)
select s.id, 2, v.slug, v.nombre, v.orden
from public.categorias s,
  (values ('pantalones', 'Pantalones', 1), ('blusas-y-playeras', 'Blusas y playeras', 2), ('camisas', 'Camisas', 3),
          ('faldas-y-vestidos', 'Faldas y vestidos', 4), ('ropa-interior', 'Ropa interior', 5),
          ('chamarras-y-sudaderas', 'Chamarras y sudaderas', 6)) as v(slug, nombre, orden)
where s.slug = 'textil';

insert into public.categorias (parent_id, nivel, slug, nombre, cupo, orden)
select c.id, 3, v.slug, v.nombre, v.cupo, v.orden
from (values
  ('pantalones', 'jeans', 'Jeans', 8, 1),
  ('pantalones', 'gabardina', 'Pantalón de gabardina', 5, 2),
  ('pantalones', 'joggers-y-pants', 'Joggers y pants', 5, 3),
  ('pantalones', 'shorts-y-bermudas', 'Shorts y bermudas', 5, 4),
  ('blusas-y-playeras', 'blusas', 'Blusas', 5, 1),
  ('blusas-y-playeras', 'playeras', 'Playeras', 5, 2),
  ('blusas-y-playeras', 'tops-y-bodies', 'Tops y bodies', 5, 3),
  ('camisas', 'camisa-casual', 'Camisa casual', 5, 1),
  ('camisas', 'camisa-vestir', 'Camisa de vestir', 5, 2),
  ('faldas-y-vestidos', 'faldas', 'Faldas', 5, 1),
  ('faldas-y-vestidos', 'vestidos', 'Vestidos', 5, 2),
  ('faldas-y-vestidos', 'conjuntos', 'Conjuntos', 5, 3),
  ('ropa-interior', 'lenceria', 'Lencería', 5, 1),
  ('ropa-interior', 'ropa-interior-basica', 'Ropa interior básica', 5, 2),
  ('ropa-interior', 'fajas', 'Fajas', 5, 3),
  ('chamarras-y-sudaderas', 'chamarras', 'Chamarras', 5, 1),
  ('chamarras-y-sudaderas', 'sudaderas', 'Sudaderas', 5, 2)
) as v(padre, slug, nombre, cupo, orden)
join public.categorias c on c.slug = v.padre;

create trigger categorias_validar before insert or update on public.categorias
  for each row execute function public.validar_categoria();

-- ---------- Proveedores: especialidad en vez de línea ----------
alter table public.proveedores add column especialidad_id uuid references public.categorias(id);
update public.proveedores p set especialidad_id = c.id
from public.lineas l, public.categorias c
where p.linea_id = l.id
  and c.slug = case l.slug when 'jeans-dama' then 'jeans' when 'jeans-caballero' then 'jeans'
                           when 'jeans-nino' then 'jeans' else l.slug end;

drop trigger proveedores_cupo on public.proveedores;
drop function public.validar_cupo();
alter table public.proveedores drop column linea_id;
alter table public.proveedores alter column especialidad_id set not null;
create index on public.proveedores (especialidad_id);
drop table public.lineas;

create function public.validar_especialidad() returns trigger language plpgsql set search_path = '' as $$
declare nivel_cat smallint; limite int; ocupados int;
begin
  select nivel, cupo into nivel_cat, limite from public.categorias where id = new.especialidad_id;
  if nivel_cat <> 3 then
    raise exception 'La especialidad debe ser una subcategoría';
  end if;
  if new.publicado then
    select count(*) into ocupados from public.proveedores
      where especialidad_id = new.especialidad_id and publicado and id <> new.id;
    if ocupados >= limite then
      raise exception 'La especialidad ya tiene sus % lugares ocupados', limite;
    end if;
  end if;
  return new;
end $$;
create trigger proveedores_especialidad before insert or update on public.proveedores
  for each row execute function public.validar_especialidad();

-- CLABE oficial (antisuplantación). Se publica solo la terminación; la completa se usa en «Verificar».
alter table public.proveedores
  add column clabe_oficial text check (clabe_oficial ~ '^[0-9]{18}$'),
  add column banco text,
  add column clabe_terminacion text generated always as (right(clabe_oficial, 4)) stored;

-- Categorías secundarias: máximo 2, no ocupan lugar del cupo.
create table public.proveedor_categorias (
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id),
  primary key (proveedor_id, categoria_id)
);
create index on public.proveedor_categorias (categoria_id);

create function public.validar_secundaria() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select nivel from public.categorias where id = new.categoria_id) <> 3 then
    raise exception 'La categoría secundaria debe ser una subcategoría';
  end if;
  if exists (select 1 from public.proveedores where id = new.proveedor_id and especialidad_id = new.categoria_id) then
    raise exception 'La especialidad no puede repetirse como categoría secundaria';
  end if;
  if (select count(*) from public.proveedor_categorias where proveedor_id = new.proveedor_id) >= 2 then
    raise exception 'Máximo 2 categorías secundarias por proveedor';
  end if;
  return new;
end $$;
create trigger proveedor_categorias_validar before insert on public.proveedor_categorias
  for each row execute function public.validar_secundaria();

-- Catálogo: cada modelo con su subcategoría y públicos (de aquí salen los filtros).
alter table public.catalogo_items
  add column categoria_id uuid references public.categorias(id),
  add column publicos public.publico[] not null default '{}';
create index on public.catalogo_items (categoria_id);

-- Ubicaciones: puesto exacto con mapa; fábrica solo por zona salvo que el proveedor autorice.
-- Si no hay coordenadas, solo se publica la zona. La dirección privada nunca se publica.
create table public.ubicaciones (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  tipo public.tipo_ubicacion not null check (tipo in ('fabrica', 'puesto')),
  descripcion_publica text not null,   -- ej. «Tianguis de San Martín, pasillo 14, puesto 32» o «Col. Centro»
  lat numeric(9, 6),
  lng numeric(9, 6),
  direccion_privada text,              -- solo NEC
  orden smallint not null default 0,
  creado_en timestamptz not null default now(),
  constraint coordenadas_completas check ((lat is null) = (lng is null))
);
create index on public.ubicaciones (proveedor_id);

-- Solicitudes: la línea pasa a ser especialidad.
alter table public.solicitudes_auditoria rename column linea_slug to especialidad_slug;

-- ---------- Seguridad ----------
alter table public.categorias enable row level security;
alter table public.proveedor_categorias enable row level security;
alter table public.ubicaciones enable row level security;

create policy "categorias activas visibles" on public.categorias for select using (activa);
create policy "secundarias de publicados visibles" on public.proveedor_categorias for select
  using (exists (select 1 from public.proveedores p where p.id = proveedor_id and p.publicado));
create policy "ubicaciones de publicados visibles" on public.ubicaciones for select
  using (exists (select 1 from public.proveedores p where p.id = proveedor_id and p.publicado));

revoke select on public.proveedores from anon, authenticated;
grant select (id, slug, nombre, especialidad_id, municipio, tipo_ubicacion, anios, mayoreo_minimo, descripcion,
  estado_sello, evaluado_en, proxima_revision, whatsapp_oficial, banco, clabe_terminacion, dias_tianguis, envios,
  compromiso_devolucion, foto_portada_url, publicado, demo)
  on public.proveedores to anon, authenticated;

revoke select on public.ubicaciones from anon, authenticated;
grant select (id, proveedor_id, tipo, descripcion_publica, lat, lng, orden) on public.ubicaciones to anon, authenticated;

-- «Verificar número»: dice si un WhatsApp o una CLABE es el contacto oficial de un proveedor publicado.
-- No expone nada más. Acepta 10 dígitos (agrega el 52), 12–13 dígitos de WhatsApp o 18 de CLABE.
create function public.verificar_contacto(valor text)
returns table (slug text, nombre text, tipo text)
language sql stable security definer set search_path = '' as $$
  with v as (select regexp_replace(coalesce(valor, ''), '\D', '', 'g') as d)
  select p.slug, p.nombre, case when p.clabe_oficial = v.d then 'clabe' else 'whatsapp' end
  from public.proveedores p, v
  where p.publicado
    and length(v.d) >= 10
    and (p.whatsapp_oficial = v.d
         or (length(v.d) = 10 and p.whatsapp_oficial = '52' || v.d)
         or p.clabe_oficial = v.d)
  limit 3;
$$;
revoke execute on function public.verificar_contacto(text) from public;
grant execute on function public.verificar_contacto(text) to anon, authenticated;
