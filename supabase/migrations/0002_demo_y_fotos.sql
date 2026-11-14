-- Marca de datos de demostración y almacenamiento de fotos de catálogo.

-- Proveedores ficticios para probar la infraestructura. El sitio muestra un aviso cuando hay alguno.
-- Para quitarlos antes del lanzamiento:  delete from public.proveedores where demo;
alter table public.proveedores add column demo boolean not null default false;
grant select (demo) on public.proveedores to anon, authenticated;

-- Fotos de catálogo: lectura pública; solo NEC sube archivos (desde el panel de Supabase).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
