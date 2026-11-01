# Bitácora 23 — Zoom y galería global en el detalle de producto

Fecha: 2026-10-31
Estado: EJECUTADO
Módulo: Ficha pública de producto / galería de imágenes

## Objetivo

Implementar una experiencia única de visualización de imágenes en la ficha de producto:

1. En PC, al pasar el mouse sobre la imagen principal, mostrar un recuadro lateral con la imagen ampliada y seguir la posición del cursor (estilo Amazon).
2. En Android/táctil, al tocar la imagen, abrir una galería a pantalla completa con desplazamiento horizontal, indicador de posición y botón para volver.
3. Aplicarlo en cualquier vista que muestre el detalle del producto, sin modificar las tarjetas del catálogo ni la estética general.

## Contexto

La tienda tiene una sola ficha pública de producto: `app/(shop)/productos/[slug]/page.tsx`. Todas las secciones (inicio, catálogo, ofertas, destacados, novedades, categorías y Modo Live) enlazan a esa misma ruta. La galería se centralizó en `components/shop/ProductGallery.tsx`, usado únicamente por esa ficha, por lo que el cambio queda global sin tocar las tarjetas.

## Cambios

### `components/shop/ProductGallery.tsx`

- Zoom lateral en PC:
  - Se activa solo con `pointerType === "mouse"` y ancho de ventana mayor o igual a 1024 px.
  - El recuadro se renderiza en un portal sobre `document.body` con `z-[1050]`, por encima del contenido y del panel de compra.
  - Tamaño máximo de 480 px y adaptable al viewport (`40%` del ancho y alto disponible).
  - Se coloca a la derecha de la imagen; si no cabe, a la izquierda; si tampoco cabe, centrado. El `top` se limita al viewport.
  - La imagen se amplía a 2.5x y el `transform-origin` sigue la posición exacta del cursor.
  - Se cierra al salir de la imagen, al hacer scroll o al redimensionar.
  - El panel usa `pointer-events-none` y no altera el layout: título, precio, SKU y botones conservan su posición.
- Táctil:
  - Se eliminó el long-press anterior.
  - Un toque con dedo o lápiz abre la galería modal.
  - Si el dedo se mueve más de 10 px entre `pointerdown` y `pointerup`, no se abre; el gesto queda disponible para el scroll vertical.
  - Los gestos verticales que comienzan sobre la imagen hacen scroll de la página y no abren el modal.
- Mouse:
  - En PC de 1024 px o más, el clic con mouse no abre el modal para no interferir con el hover. Sigue disponible con teclado (`Enter`/`Espacio`).
  - En ventanas menores a 1024 px, donde el zoom por hover no aplica, el clic con mouse abre el modal como alternativa de acceso.
- Al abrir la galería se cierra el zoom y se conserva la imagen activa. Al cerrar, se sincroniza el índice seleccionado y se devuelve el foco a la imagen principal.
- Se añadieron atributos `data-gallery-*` para pruebas automatizadas, sin impacto visual ni de comportamiento.

### `components/shop/ProductGalleryModal.tsx` (nuevo)

- Modal a pantalla completa mediante portal, `z-[2000]`, fondo oscuro translúcido con blur y texto blanco.
- Carrusel horizontal nativo con `scroll-snap` y una diapositiva por imagen.
- Imágenes en `object-contain`, priorizando solo la imagen inicial; el resto se carga de forma diferida.
- Indicador `N de M` en la parte inferior, con `aria-live="polite"`, visible solo cuando hay más de una imagen.
- Botón de volver en la esquina superior izquierda, con tamaño táctil de 44 px y respeto por `env(safe-area-inset-top)`.
- Bloqueo del scroll de fondo, compensando el ancho de la barra de scroll del escritorio.
- Cierre con `Escape`, navegación con flechas izquierda/derecha y realineación al redimensionar u orientar.
- Al cerrar se restaura el overflow y el padding previos del `body`, se conserva la posición de scroll de la página y se devuelve el foco a la imagen.
- Si el producto tiene una sola imagen, el modal funciona sin indicador y sin carrusel adicional.

### `app/globals.css`

Se conservó el cambio previo del árbol de trabajo que reemplaza las animaciones de lightbox por `zoom-panel-in`, usada únicamente por el recuadro de zoom. No se modificaron tokens, colores, tipografía ni identidad visual.

## Verificación

### Pruebas automatizadas

- `npx tsc --noEmit` → 0 errores.
- `npx eslint components/shop/ProductGallery.tsx components/shop/ProductGalleryModal.tsx` → 0 errores.
- `npm test` → 36/36 PASS.
- `npm run build` → compilación exitosa, 139/139 páginas estáticas. Persiste el aviso no bloqueante `Failed to download dynamic font... Status: 400`, ya existente y ajeno a este cambio.

### Pruebas funcionales con Chrome/CDP

Se usó Chrome 156 headless contra el servidor de desarrollo, con emulación de viewport y eventos de mouse/touch. Resultado: **67/67 comprobaciones OK y sin errores de consola**.

Productos usados:

- `pulcera-tulipan` (producto 3): 2 imágenes.
- `reloj-clasico-dorado` (producto 9): 1 imagen.

PC:

- 1280×900 y 1024×768: el panel aparece al hacer hover, queda dentro del viewport, el origen cambia al mover el cursor por esquinas y zonas bajas, y desaparece al salir.
- Sin desplazamiento de título, precio, SKU ni botón de compra; sin overflow horizontal.
- El clic con mouse no abre el modal en anchos de 1024 px o más.
- Las miniaturas cambian la imagen principal y el estado `aria-current`.
- 900×800: el hover no se activa y el clic con mouse abre el modal; el botón de volver lo cierra y restaura el scroll.

Android/táctil (390×844, emulación táctil):

- El toque abre el modal en la imagen activa.
- El modal expone `role="dialog"`, `aria-modal="true"` y bloquea el scroll de fondo.
- Indicador correcto (`N de M`) según la imagen activa; en el producto de prueba abrió en `2 de 2` porque la imagen principal es la segunda.
- Swipe horizontal en ambos sentidos cambia de imagen y actualiza el indicador.
- El botón de volver cierra el modal, restaura el scroll de la página y mantiene la imagen seleccionada.
- Un gesto vertical sobre la página o sobre la imagen hace scroll y no abre el modal.
- Producto con una sola imagen: abre, muestra una diapositiva, oculta el indicador y cierra correctamente.

Otras vistas:

- `/`, `/productos`, `/ofertas`, `/destacados`, `/novedades` y `/categorias/anillos` cargan sin `[data-gallery-trigger]` ni modal en las tarjetas, y sin overflow horizontal. Las tarjetas no se modificaron.

### Limitaciones de la verificación

- No se probó en un dispositivo Android físico; la validación táctil se hizo con emulación CDP. Queda pendiente la comprobación en un teléfono real.
- En la base de datos no hay una sesión de Modo Live activa (`live_sessions` vacío), por lo que no fue posible ejercitar una ficha con precio exclusivo en vivo. La ficha usa el mismo componente compartido y la misma ruta; el flujo normal quedó verificado.
- El zoom se cierra si el cursor entra en la zona del banner de cookies o sale por las esquinas redondeadas de la imagen; es el comportamiento esperado al abandonar el área de la imagen.

## Archivos

- `components/shop/ProductGallery.tsx`
- `components/shop/ProductGalleryModal.tsx` (nuevo)
- `app/globals.css` (cambio previo de animación, conservado)
- `docs_migracion/23-galeria-global-detalle-producto.md` (nuevo)

## Notas

- No se modificaron tarjetas de producto, carrito, checkout, cookies, WhatsApp, precios, SKU, descripciones, activación/configuración de Modo Live, carga de imágenes ni la paleta.
- No se hicieron cambios en la base de datos ni en Storage.
- No se ejecutaron commits, pushes ni despliegues.
