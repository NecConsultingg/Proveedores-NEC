-- Bonetería (16-nov-2026): 1 lugar, como categoría propia dentro de «Textil y confección».
-- Va después de Camisas y antes de Calzado (primero ropa, al final calzado).
-- Una sola especialidad «Bonetería» (calcetines, ropa interior, camisetas y básicos de punto); el detalle
-- de lo que maneja cada proveedor va en su descripción y catálogo, igual que en Blusas o Camisas.

update public.categorias set orden = 5 where slug = 'calzado' and nivel = 2;

insert into public.categorias (parent_id, nivel, slug, nombre, orden, activa)
select id, 2, 'boneteria', 'Bonetería', 4, true from public.categorias where slug = 'textil';

insert into public.categorias (parent_id, nivel, slug, nombre, cupo, orden, activa)
select id, 3, 'boneteria-general', 'Bonetería', 1, 1, true from public.categorias where slug = 'boneteria' and nivel = 2;
