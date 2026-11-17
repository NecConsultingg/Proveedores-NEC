-- Catálogo del piloto (16-nov-2026): solo las categorías que hoy tienen proveedores reales.
-- Las demás se archivan (activa = false), no se borran: se reactivan cuando lleguen proveedores.
--
--   Pantalones → Jeans (3 lugares, cerrado a los 3 mezclilleros) · Pantalón de vestir (2)
--   Blusas     → Blusas (1)
--   Camisas    → Camisas (1)
--   Calzado    → Tenis (1) · Zapatos (1)
--
-- Dama / caballero / niña / niño, juvenil o curvy NO son categorías: salen del catálogo de cada proveedor
-- (filtro «Para») y de su descripción.

-- 1) Archivar todo lo de nivel 2 y 3; abajo se reactiva solo lo que se usa.
update public.categorias set activa = false where nivel in (2, 3);

-- 2) Pantalones
update public.categorias set activa = true, orden = 1 where slug = 'pantalones';
update public.categorias set activa = true, orden = 1, cupo = 3 where slug = 'jeans';
update public.categorias set activa = true, orden = 2, cupo = 2, slug = 'pantalon-de-vestir', nombre = 'Pantalón de vestir'
 where slug = 'gabardina';

-- 3) Blusas (la subcategoría cambia de slug primero para dejar «blusas» a la categoría)
update public.categorias set activa = true, orden = 1, cupo = 1, slug = 'blusa', nombre = 'Blusas' where slug = 'blusas' and nivel = 3;
update public.categorias set activa = true, orden = 2, slug = 'blusas', nombre = 'Blusas' where slug = 'blusas-y-playeras';

-- 4) Camisas
update public.categorias set activa = true, orden = 3 where slug = 'camisas';
update public.categorias set activa = true, orden = 1, cupo = 1, slug = 'camisa', nombre = 'Camisas' where slug = 'camisa-casual';

-- 5) Calzado: se activa su sector y se crea la categoría con tenis y zapatos
update public.categorias set activa = true, slug = 'sector-calzado' where slug = 'calzado' and nivel = 1;
insert into public.categorias (parent_id, nivel, slug, nombre, orden, activa)
select id, 2, 'calzado', 'Calzado', 4, true from public.categorias where slug = 'sector-calzado';
insert into public.categorias (parent_id, nivel, slug, nombre, cupo, orden, activa)
select c.id, 3, v.slug, v.nombre, 1, v.orden, true
from public.categorias c, (values ('tenis', 'Tenis', 1), ('zapatos', 'Zapatos', 2)) as v(slug, nombre, orden)
where c.slug = 'calzado' and c.nivel = 2;
