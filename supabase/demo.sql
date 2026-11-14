-- Lista FICTICIA de proveedores para probar la infraestructura (demo = true).
-- Ningún negocio, número, cuenta ni precio es real. Sin WhatsApp ni CLABE a propósito:
-- un número o cuenta inventados podrían ser de alguien.
-- Se puede volver a correr: primero borra los proveedores de demostración.
-- Quitar todo antes del lanzamiento:  delete from public.proveedores where demo;

delete from public.proveedores where demo;

insert into public.proveedores
  (slug, nombre, especialidad_id, municipio, tipo_ubicacion, anios, mayoreo_minimo, descripcion, dias_tianguis, envios,
   compromiso_devolucion, publicado, consentimiento_publicacion_en, demo)
select v.slug, v.nombre, c.id, v.municipio, v.tipo::public.tipo_ubicacion, v.anios, v.minimo, v.descripcion, v.dias,
       v.envios, v.devolucion, true, current_date, true
from (values
  ('mezclilla-del-valle', 'Mezclilla del Valle', 'jeans', 'San Martín Texmelucan', 'fabrica_y_puesto', 12, 12,
   'Jeans tiro alto para dama, caballero y niño: skinny, mom, wide leg y recto.', 'Lunes y martes', 'Paquetería nacional',
   'Cambio por defecto de fabricación dentro de 7 días, con video del desempaque. No aplica en prendas usadas o lavadas.'),
  ('taller-denim-norte', 'Taller Denim Norte', 'jeans', 'San Martín Texmelucan', 'puesto', 7, 6,
   'Jeans de dama con deslavados de temporada. Mayoreo desde media docena.', 'Lunes y martes', 'Paquetería nacional', null),
  ('denim-atoyac', 'Denim Atoyac', 'jeans', 'San Salvador el Verde', 'fabrica', 9, 12,
   'Jeans de caballero y faldas de mezclilla.', 'Martes', 'Paquetería nacional y entrega en tianguis', null),
  ('denim-sur', 'Denim Sur', 'shorts-y-bermudas', 'San Martín Texmelucan', 'puesto', 5, 12,
   'Bermudas y shorts de mezclilla unisex.', 'Lunes', 'Entrega en tianguis', null),
  ('mezclilla-pequenos', 'Mezclilla Pequeños', 'jeans', 'San Martín Texmelucan', 'fabrica', 10, 12,
   'Jeans y overoles para niña y niño, tallas 2 a 16.', 'Lunes', 'Paquetería nacional',
   'Cambio por talla dentro de 5 días si la prenda llega con etiqueta.'),
  ('jeans-kids-texmelucan', 'Jeans Kids Texmelucan', 'joggers-y-pants', 'Región Texmelucan', 'puesto', 6, 6,
   'Joggers y pants infantiles con bordados.', 'Martes', 'Paquetería nacional', null),
  ('faldas-plaza-centro', 'Faldas Plaza Centro', 'faldas', 'San Martín Texmelucan', 'fabrica_y_puesto', 15, 10,
   'Faldas de mezclilla y gabardina: midi, mini y con abertura.', 'Lunes y martes', 'Paquetería nacional', null),
  ('faldas-tres-cruces', 'Faldas Tres Cruces', 'vestidos', 'Región Texmelucan', 'puesto', 4, 12,
   'Vestidos y faldas casuales en tallas extra.', 'Lunes', 'Entrega en tianguis', null),
  ('blusas-san-rafael', 'Blusas San Rafael', 'blusas', 'Región Texmelucan', 'puesto', 6, 12,
   'Blusas de manta y crop tops bordados.', 'Martes', 'Paquetería nacional', null),
  ('blusas-margarita', 'Blusas Margarita', 'tops-y-bodies', 'San Martín Texmelucan', 'fabrica_y_puesto', 11, 12,
   'Bodies, tops tejidos y blusas de temporada.', 'Lunes y martes', 'Paquetería nacional',
   'Cambio por defecto de costura dentro de 7 días.'),
  ('lenceria-la-aurora', 'Lencería La Aurora', 'lenceria', 'Región Texmelucan', 'puesto', 8, 24,
   'Brasieres, pantaletas y conjuntos por docena.', 'Lunes y martes', 'Paquetería nacional', null),
  ('lenceria-fina-atoyac', 'Lencería Fina Atoyac', 'fajas', 'San Salvador el Verde', 'fabrica', 14, 24,
   'Fajas y lencería de encaje de fabricación propia.', 'Martes', 'Paquetería nacional', null)
) as v(slug, nombre, especialidad, municipio, tipo, anios, minimo, descripcion, dias, envios, devolucion)
join public.categorias c on c.slug = v.especialidad;

-- Categorías secundarias (máximo 2 por proveedor)
insert into public.proveedor_categorias (proveedor_id, categoria_id)
select p.id, c.id
from (values
  ('mezclilla-del-valle', 'shorts-y-bermudas'),
  ('denim-atoyac', 'faldas'),
  ('mezclilla-pequenos', 'joggers-y-pants'),
  ('faldas-plaza-centro', 'blusas'),
  ('faldas-tres-cruces', 'faldas'),
  ('blusas-margarita', 'blusas'),
  ('lenceria-fina-atoyac', 'lenceria')
) as v(slug, categoria)
join public.proveedores p on p.slug = v.slug
join public.categorias c on c.slug = v.categoria;

-- Catálogo: cada modelo con su subcategoría y públicos
insert into public.catalogo_items (proveedor_id, categoria_id, publicos, nombre, descripcion, precio_mayoreo, orden)
select p.id, c.id, v.publicos::public.publico[], v.nombre, v.descripcion, v.precio, v.orden
from (values
  ('mezclilla-del-valle', 'jeans', '{dama}', 'Modelo 101', 'Skinny tiro alto · tallas 3 a 15', '$210', 1),
  ('mezclilla-del-valle', 'jeans', '{dama}', 'Modelo 102', 'Mom jeans · tallas 5 a 13', '$230', 2),
  ('mezclilla-del-valle', 'jeans', '{caballero}', 'Modelo 201', 'Recto clásico · tallas 28 a 38', '$240', 3),
  ('mezclilla-del-valle', 'jeans', '{nina,nino}', 'Modelo 301', 'Skinny infantil · tallas 4 a 16', '$160', 4),
  ('mezclilla-del-valle', 'shorts-y-bermudas', '{dama}', 'Short 401', 'Short tiro alto · tallas 3 a 13', null, 5),
  ('taller-denim-norte', 'jeans', '{dama}', 'Deslavado nieve', 'Skinny · tallas 3 a 13', '$190', 1),
  ('taller-denim-norte', 'jeans', '{dama}', 'Rotos premium', 'Boyfriend · tallas 5 a 15', '$220', 2),
  ('denim-atoyac', 'jeans', '{caballero}', 'Recto clásico', 'Tallas 28 a 38', '$230', 1),
  ('denim-atoyac', 'jeans', '{caballero}', 'Slim stretch', 'Tallas 28 a 36', '$245', 2),
  ('denim-atoyac', 'faldas', '{dama}', 'Falda de mezclilla', 'Midi · tallas 3 a 15', null, 3),
  ('denim-sur', 'shorts-y-bermudas', '{unisex}', 'Bermuda', 'Tallas 28 a 38', '$160', 1),
  ('denim-sur', 'shorts-y-bermudas', '{dama}', 'Short deshilado', 'Tallas 3 a 13', '$140', 2),
  ('mezclilla-pequenos', 'jeans', '{nina}', 'Overol', 'Tallas 2 a 10', '$175', 1),
  ('mezclilla-pequenos', 'jeans', '{nino}', 'Recto parches', 'Tallas 4 a 16', '$160', 2),
  ('mezclilla-pequenos', 'joggers-y-pants', '{nino}', 'Jogger mezclilla', 'Tallas 4 a 16', '$150', 3),
  ('jeans-kids-texmelucan', 'joggers-y-pants', '{nina,nino}', 'Jogger bordado', 'Tallas 4 a 14', '$130', 1),
  ('jeans-kids-texmelucan', 'joggers-y-pants', '{bebe}', 'Pants bebé', 'Tallas 0 a 24 meses', null, 2),
  ('faldas-plaza-centro', 'faldas', '{dama}', 'Midi abertura', 'Mezclilla · tallas 3 a 15', '$170', 1),
  ('faldas-plaza-centro', 'faldas', '{dama}', 'Mini botones', 'Mezclilla · tallas 3 a 13', '$140', 2),
  ('faldas-plaza-centro', 'blusas', '{dama}', 'Blusa campesina', 'Unitalla', '$120', 3),
  ('faldas-tres-cruces', 'vestidos', '{dama}', 'Vestido camisero', 'Tallas extra 18 a 24', '$210', 1),
  ('faldas-tres-cruces', 'faldas', '{dama}', 'Midi plisada', 'Tallas extra 18 a 24', '$185', 2),
  ('blusas-san-rafael', 'blusas', '{dama}', 'Manta bordada', 'Unitalla', '$120', 1),
  ('blusas-san-rafael', 'blusas', '{dama}', 'Crop top', 'Chica a grande', '$95', 2),
  ('blusas-margarita', 'tops-y-bodies', '{dama}', 'Body canalé', 'Chica a extra grande', '$110', 1),
  ('blusas-margarita', 'blusas', '{dama}', 'Top tejido', 'Unitalla', '$130', 2),
  ('lenceria-la-aurora', 'lenceria', '{dama}', 'Conjunto encaje', 'Tallas 32 a 38', '$95', 1),
  ('lenceria-la-aurora', 'lenceria', '{dama}', 'Pantaleta algodón (docena)', 'Chica a extra grande', '$180', 2),
  ('lenceria-fina-atoyac', 'fajas', '{dama}', 'Faja colombiana', 'Tallas 28 a 40', '$320', 1),
  ('lenceria-fina-atoyac', 'fajas', '{caballero}', 'Faja reductora caballero', 'Tallas 30 a 44', '$290', 2),
  ('lenceria-fina-atoyac', 'lenceria', '{dama}', 'Brasier push-up', 'Tallas 32 a 40', '$140', 3)
) as v(slug, categoria, publicos, nombre, descripcion, precio, orden)
join public.proveedores p on p.slug = v.slug
join public.categorias c on c.slug = v.categoria;

-- Ubicaciones: los puestos con coordenadas aproximadas del centro de San Martín Texmelucan (ficticias);
-- las fábricas solo por zona, sin coordenadas.
insert into public.ubicaciones (proveedor_id, tipo, descripcion_publica, lat, lng, orden)
select p.id, v.tipo::public.tipo_ubicacion, v.descripcion, v.lat, v.lng, v.orden
from (values
  ('mezclilla-del-valle', 'puesto', 'Tianguis de San Martín · pasillo 14, puesto 32 (ejemplo)', 19.2840, -98.4380, 1),
  ('mezclilla-del-valle', 'fabrica', 'Fábrica en Col. Centro, San Martín Texmelucan', null, null, 2),
  ('taller-denim-norte', 'puesto', 'Tianguis de San Martín · pasillo 3, puesto 8 (ejemplo)', 19.2846, -98.4372, 1),
  ('denim-atoyac', 'fabrica', 'Fábrica en San Salvador el Verde', null, null, 1),
  ('denim-sur', 'puesto', 'Tianguis de San Martín · pasillo 9, puesto 21 (ejemplo)', 19.2836, -98.4386, 1),
  ('mezclilla-pequenos', 'fabrica', 'Fábrica en San Martín Texmelucan', null, null, 1),
  ('jeans-kids-texmelucan', 'puesto', 'Tianguis de San Martín · pasillo 20, puesto 5 (ejemplo)', 19.2851, -98.4377, 1),
  ('faldas-plaza-centro', 'puesto', 'Tianguis de San Martín · pasillo 6, puesto 40 (ejemplo)', 19.2843, -98.4369, 1),
  ('faldas-plaza-centro', 'fabrica', 'Fábrica en San Martín Texmelucan', null, null, 2),
  ('faldas-tres-cruces', 'puesto', 'Tianguis de San Martín · pasillo 11, puesto 2 (ejemplo)', 19.2838, -98.4375, 1),
  ('blusas-san-rafael', 'puesto', 'Tianguis de San Martín · pasillo 17, puesto 13 (ejemplo)', 19.2848, -98.4383, 1),
  ('blusas-margarita', 'puesto', 'Tianguis de San Martín · pasillo 2, puesto 27 (ejemplo)', 19.2842, -98.4391, 1),
  ('blusas-margarita', 'fabrica', 'Fábrica en San Martín Texmelucan', null, null, 2),
  ('lenceria-la-aurora', 'puesto', 'Tianguis de San Martín · pasillo 8, puesto 19 (ejemplo)', 19.2834, -98.4381, 1),
  ('lenceria-fina-atoyac', 'fabrica', 'Fábrica en San Salvador el Verde', null, null, 1)
) as v(slug, tipo, descripcion, lat, lng, orden)
join public.proveedores p on p.slug = v.slug;
