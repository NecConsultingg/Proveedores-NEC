-- NEC · Directorio de proveedores · Esquema del piloto (diciembre 2026)
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- En el piloto NEC administra los datos desde el panel de Supabase (Table Editor).
-- El sitio público solo puede LEER proveedores publicados y CREAR solicitudes.

create extension if not exists "pgcrypto";

-- Líneas de producto con cupo (3–5 lugares por línea)
create table public.lineas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  cupo smallint not null default 5 check (cupo between 1 and 10),
  orden smallint not null default 0,
  creado_en timestamptz not null default now()
);

create type public.estado_sello as enum ('aliado', 'vigente', 'suspendido', 'retirado');
create type public.tipo_ubicacion as enum ('fabrica', 'puesto', 'fabrica_y_puesto');

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  linea_id uuid not null references public.lineas(id),
  municipio text not null default 'San Martín Texmelucan',
  tipo_ubicacion public.tipo_ubicacion not null,
  anios smallint not null default 0 check (anios >= 0),
  mayoreo_minimo smallint not null default 6 check (mayoreo_minimo > 0),
  descripcion text,
  -- Zona A: solo NEC
  estado_sello public.estado_sello not null default 'aliado',
  evaluado_en date,
  proxima_revision date,
  -- Zona C: contacto oficial (solo se publica el que NEC confirmó con el dueño)
  whatsapp_oficial text check (whatsapp_oficial ~ '^[0-9]{12,13}$'),
  -- Zona B: datos del proveedor
  dias_tianguis text,
  envios text,
  compromiso_devolucion text,
  foto_portada_url text,
  -- Control interno
  publicado boolean not null default false,
  consentimiento_publicacion_en date, -- fecha en que firmó la autorización para publicar sus datos
  notas_internas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- No se puede publicar sin autorización firmada
  constraint publicar_requiere_consentimiento check (not publicado or consentimiento_publicacion_en is not null)
);
create index on public.proveedores (linea_id);

create table public.catalogo_items (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio_mayoreo text,
  foto_url text,
  orden smallint not null default 0,
  creado_en timestamptz not null default now()
);
create index on public.catalogo_items (proveedor_id, orden);

-- Solicitudes del formulario «Quiero ser auditado» (convocatoria dic 2026 – ene 2027)
create table public.solicitudes_auditoria (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  nombre_responsable text not null,
  whatsapp text not null,
  correo text,
  linea_slug text not null,
  tipo_ubicacion public.tipo_ubicacion not null,
  municipio text not null,
  anios smallint not null,
  redes text,
  cliente_nec boolean not null default false,
  comentarios text,
  acepta_aviso_privacidad boolean not null check (acepta_aviso_privacidad),
  estado text not null default 'recibida'
    check (estado in ('recibida', 'contactado', 'preseleccionado', 'no_seleccionado', 'auditando')),
  recibida_en timestamptz not null default now()
);

-- Mantener actualizado_en
create function public.tocar_actualizado_en() returns trigger language plpgsql set search_path = '' as $$
begin new.actualizado_en = now(); return new; end $$;
create trigger proveedores_actualizado before update on public.proveedores
  for each row execute function public.tocar_actualizado_en();

-- Cupo: no publicar más proveedores que el cupo de su línea
create function public.validar_cupo() returns trigger language plpgsql set search_path = '' as $$
declare ocupados int; limite int;
begin
  if new.publicado then
    select cupo into limite from public.lineas where id = new.linea_id;
    select count(*) into ocupados from public.proveedores
      where linea_id = new.linea_id and publicado and id <> new.id;
    if ocupados >= limite then
      raise exception 'La línea ya tiene sus % lugares ocupados', limite;
    end if;
  end if;
  return new;
end $$;
create trigger proveedores_cupo before insert or update on public.proveedores
  for each row execute function public.validar_cupo();

-- ---------- Seguridad (Row Level Security) ----------
alter table public.lineas enable row level security;
alter table public.proveedores enable row level security;
alter table public.catalogo_items enable row level security;
alter table public.solicitudes_auditoria enable row level security;

create policy "lineas visibles" on public.lineas for select using (true);
create policy "proveedores publicados visibles" on public.proveedores for select using (publicado);
create policy "catalogo de publicados visible" on public.catalogo_items for select
  using (exists (select 1 from public.proveedores p where p.id = proveedor_id and p.publicado));
-- El público puede enviar solicitudes, pero nunca leerlas.
-- Solo entran como 'recibida' y con el aviso de privacidad aceptado.
create policy "cualquiera envía solicitud" on public.solicitudes_auditoria for insert to anon, authenticated
  with check (acepta_aviso_privacidad and estado = 'recibida');

-- El sitio público no debe ver columnas internas: se quita el permiso a toda la tabla
-- y se devuelve solo a las columnas públicas (revocar columnas sueltas no basta en Postgres).
revoke select on public.proveedores from anon, authenticated;
grant select (id, slug, nombre, linea_id, municipio, tipo_ubicacion, anios, mayoreo_minimo, descripcion,
  estado_sello, evaluado_en, proxima_revision, whatsapp_oficial, dias_tianguis, envios,
  compromiso_devolucion, foto_portada_url, publicado)
  on public.proveedores to anon, authenticated;

-- ---------- Datos iniciales ----------
insert into public.lineas (slug, nombre, cupo, orden) values
  ('jeans-dama', 'Jeans dama', 5, 1),
  ('jeans-caballero', 'Jeans caballero', 5, 2),
  ('jeans-nino', 'Jeans niño', 5, 3),
  ('faldas', 'Faldas', 5, 4),
  ('blusas', 'Blusas', 5, 5),
  ('lenceria', 'Lencería', 5, 6);
