# Directorio de proveedores NEC

Sitio web (PWA) del directorio de proveedores. Piloto: diciembre 2026.

## Arrancar en tu computadora

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Necesita `.env.local` con los datos de Supabase (ver abajo).
El diseño de usuarios, permisos, categorías y cupos está en `../DISENO.md`.

## Conectar Supabase

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/` (0001, 0002, 0003).
3. Copia `.env.example` como `.env.local` y llena la URL y la publishable key (Project Settings → API Keys).
4. Da de alta a los proveedores en **Table Editor → proveedores**: elige su `especialidad_id` (una subcategoría de
   `categorias`). Para que aparezca: `publicado = true` y `consentimiento_publicacion_en` con la fecha en que firmó.
   Sus categorías secundarias (máx. 2) van en `proveedor_categorias`, sus modelos en `catalogo_items` (con
   `categoria_id` y `publicos`) y sus ubicaciones en `ubicaciones` (sin `lat`/`lng` = solo se publica la zona).
5. Las solicitudes de «Quiero ser auditado» llegan a la tabla `solicitudes_auditoria`.

## Panel NEC

- Entrada: **proveedoresnec.com/acceso**. Se escribe el correo y llega un enlace de acceso (sin contraseña).
  Solo reciben enlace los correos dados de alta en la tabla `equipo` y activos.
- Tres niveles: **staff** (propone), **administrador medio** (aprueba altas y ediciones; deja sellos en borrador;
  propone bajas) y **superadministrador** (autoriza sellos y bajas; edita directo; administra el equipo).
- Las reglas viven en la base de datos (`supabase/migrations/0004_panel_nec.sql`): las tablas `equipo`, `cambios`
  y `bitacora` no se leen directo; todo pasa por funciones `panel_*` que revisan el nivel. Supabase marca esas
  funciones como advertencia de seguridad: es esperado.
- Configuración necesaria en Supabase → Authentication → URL Configuration: Site URL `https://proveedoresnec.com`
  y Redirect URLs `https://proveedoresnec.com/**` y `http://localhost:3000/**`.

## Reglas importantes

- **Datos de demostración:** Supabase tiene 12 proveedores ficticios (`demo = true`, cargados con `supabase/demo.sql`).
  Mientras existan, el sitio muestra un aviso amarillo. **Antes del lanzamiento**, bórralos en el SQL Editor:
  `delete from public.proveedores where demo;` (su catálogo se borra solo).
- **Fotos:** súbelas en Supabase → Storage → `catalogo` (máx. 5 MB, jpg/png/webp) y pega la URL pública en
  `foto_portada_url` o en `catalogo_items.foto_url`.

- En el piloto, todos los proveedores van con `estado_sello = 'aliado'`. **No** usar `vigente` («Verificado por
  NEC») hasta que pasen la auditoría de febrero 2027.
- El aviso de privacidad y los términos son **borradores**: deben revisarse con abogado antes de publicar.
- La base de datos no deja publicar más proveedores que el cupo de su especialidad.
- La función `verificar_contacto` es pública a propósito (la usa «Verificar número»); solo responde nombre y tipo de
  coincidencia, nunca la CLABE completa. Supabase la marca como advertencia: es esperado.

## Estructura

- `src/app/` páginas: inicio y directorio, `proveedores/[slug]`, `como-verificamos`, `quiero-ser-auditado`, legales.
- `src/lib/datos.ts` lectura y escritura (Supabase o datos de ejemplo).
- `src/lib/config.ts` fechas del calendario y leyendas.

## Publicación

El proyecto `proveedores-nec` de Vercel está conectado a este repositorio: cada cambio que llega a la rama `main`
se publica solo en **https://proveedoresnec.com** (www redirige al dominio principal; también responde en
https://proveedores-nec.vercel.app). El dominio está comprado en Vercel con renovación automática.
Las variables de Supabase y `NEXT_PUBLIC_SITE_URL` viven en Vercel → proveedores-nec → Settings → Environment Variables.
