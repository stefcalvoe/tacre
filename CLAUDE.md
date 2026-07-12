# TACRE — Sistema de Cotizaciones

Producto comercial para **Taller Creativo** (tallercreativo.com.mx, Azcapotzalco, CDMX).
Lo construye Stef Calvo para vendérselo al cliente ya funcional.

## Qué es
App de una sola página (single HTML) para crear, aprobar y enviar cotizaciones/proformas
de mobiliario y diseño. Flujo multi-rol con catálogo de materiales, escenarios de margen,
exportación a PDF y compartir por WhatsApp/Email.

## Stack (NO cambiar sin razón)
- **1 archivo HTML** (`index.html`), vanilla JavaScript, sin framework, sin build.
- Persistencia: `localStorage` (claves con prefijo `tacre_`).
- PDF: jsPDF 2.5.1 + jspdf-autotable 3.5.25 (A4, margen 14mm).
- Excel: SheetJS (xlsx) por CDN.
- Fuente: Inter (Google Fonts). Todo por CDN, funciona con doble clic (`file://`).

## Marca
- Morado `#5a2d82` · Turquesa `#00a8a8`. Variables CSS en `:root` (`--p`, `--t`, etc.).
- Logo: engranaje morado + bombilla turquesa con letras TA/CRE. Va embebido como
  `const LOGO_B64="data:image/png;base64,..."` e inyectado en runtime en login, navbar,
  vista preliminar y PDF. **Un solo logo, mismo estándar en todos lados.**

## Roles y flujo de estados
Roles: `vendedor`, `costos`, `jefe`, `admin` (guardados como array; las pestañas se arman
según los roles del usuario).

Flujo: `borrador → pendiente_costos → pendiente_jefe → aprobada → enviada → aceptada/rechazada/negociacion`
- `rechazada` puede volver a `borrador` **o** directo a `pendiente_costos`.
- `negociacion` puede cerrar en `aceptada`/`rechazada` o volver a `enviada`.
- La función `transicionValida(actual, nuevo)` es la única fuente de verdad. Editar SIEMPRE ahí.

## Reglas de cálculo
- Precio ítem: si tiene materiales, `precioUnit = Σ(costoUnit × cantidad)`; si no, precio manual.
- `calcularTotales()` NO sobrescribe el precio manual del vendedor (BUG-10).
- Escenarios del jefe: `costoTotal = base(materiales) + Σ(costos adicionales)`; luego
  `precio = costoTotal × (1 + margen%)`. Costos adicionales son `pct` o `monto`.
- Totales: `total = (subtotal − descuento) × (1 + IVA%)`.

## Usuarios demo (solo primera carga)
admin/admin123 · ana/ana123 (vendedor) · carlos/carlos123 (costos) · jefe/jefe123
Contraseñas hasheadas con SHA-256 + sal. Admin: stearcesoto@hotmail.com.

## localStorage
`tacre_cotizaciones` · `tacre_usuarios` · `tacre_materiales` · `tacre_config`
Folios: `COT-0001` con `padStart(4,'0')`, contador en `config.nextFolio`.
Hay Respaldo/Restauración a JSON en la pestaña de admin.

## Convenciones de trabajo
- Ediciones puntuales con edits dirigidos, no reescribir todo el archivo (rompe el logo y
  paneles que ya funcionan).
- Cada bug/mejora se marca en el código con comentario `// FIX-NN:` o `// BUG-NN:`.
- Guardas defensivas `if(el)` en todo `getElementById` que pueda no existir aún.
- Todo dato de usuario pasa por `sanitize()` antes de ir a `innerHTML` (anti-XSS).
- Versionado explícito: v5.2 → v5.3 → ... El título y el pie del PDF llevan la versión.

## Estado actual: v5.6 (datos demo)
Nuevo en v5.6 (MEJ-25): 8 cotizaciones de demostración (una por estado del flujo) con
folios `DEMO-xxxx` que NO consumen el contador real. Botones cargar/borrar en Respaldo BD
(admin). `_demoCots()` genera fechas relativas a hoy y calcula subtotal/total/precioFinal
coherentes con las reglas de cálculo. Publicada en https://stefcalvoe.github.io/tacre/
(repo público stefcalvoe/tacre; actualizar = push a `main` Y `gh-pages`, y subir la
versión del CACHE en sw.js para que las PWA instaladas refresquen).

## Historial v5.5 (PWA instalable)
Nuevo en v5.5 (MEJ-24): PWA — `manifest.webmanifest` + `sw.js` (stale-while-revalidate,
offline tras 1ª carga, incluye CDNs) + `icon-192/512/180.png` (generados del logo, fondo
blanco, margen maskable) + metas iOS standalone. El SW solo se registra bajo http/https;
en `file://` la app funciona igual que siempre. Para instalarla en el teléfono hace falta
hospedarla en HTTPS (GitHub Pages/Netlify) o servirla en la red local.

## Historial v5.4 (motion & mobile)
Corregido en v5.3: rechazada→costos, salidas de negociación, PDF en estados finales,
logo corporativo estándar, portapapeles con fallback `execCommand` para `file://`.
Nuevo en v5.4:
- FIX-11: `abrirJefeAprob` sincroniza `precioUnit` desde materiales al abrir (antes el
  margen se calculaba sobre el precio manual viejo, p.ej. $1 en vez de $34,275).
- MEJ-20: sistema de transiciones (keyframes al final del `<style>`): modales con
  pop/fade y cierre animado (`closeModal` espera la clase `.closing` 210ms), tabs y
  cards con entrada escalonada, toast por clase `.show`, login animado.
- Móvil: modales = bottom-sheet en ≤600px; FIX-21 ✕ de imágenes visible en táctil;
  FIX-22 inputs a 16px en `(hover:none),(pointer:coarse)` (evita zoom iOS); MEJ-23
  `inputmode=decimal` vía MutationObserver; safe-areas (`env()`) y `dvh/svh` Safari;
  `prefers-reduced-motion` respetado.

## Próximos pasos
1. ~~PWA~~ ✅ hecho en v5.5. Falta: hospedar en HTTPS (GitHub Pages) para instalarla en teléfonos.
2. Compartir PDF nativo en móvil con `navigator.share({files})` (hoja de compartir → WhatsApp).
3. Empaquetado desktop (Tauri) para `.exe`/`.dmg`.
4. Login que auto-cargue datos de cliente/proyecto/empresa.
5. Sincronización multi-dispositivo (localStorage no se comparte entre navegador del
   vendedor y del jefe — conversar backend liviano con el cliente).

## Gotchas conocidos
- El logo directo inline base64 en heredocs grandes falla; usar `base64 -w 0 archivo`.
- Web Share API ignora `text` si van archivos; `mailto:` no adjunta; por eso se descarga
  el PDF y se copia el texto por separado.
- autotable 3.5.25: usar `doc.autoTable.previous.finalY` para el Y siguiente.
- No mezclar Firebase compat SDK con imports ES module (elegir uno si algún día se usa).
