# TACRE — Sistema de Cotizaciones

App de cotizaciones para Taller Creativo. Un solo archivo HTML, sin instalación.

## Cómo usarla
Abre `index.html` con doble clic en cualquier navegador (Chrome recomendado). No necesita servidor.

**Usuarios de prueba:** admin/admin123 · ana/ana123 · carlos/carlos123 · jefe/jefe123

## Cómo desarrollarla con Claude Code
1. Abre esta carpeta en Claude Code: `claude` (dentro de la carpeta del proyecto).
2. Claude lee `CLAUDE.md` automáticamente y ya conoce todo el contexto.
3. Pídele cambios en lenguaje normal, ej.:
   - "agrega un campo de teléfono del cliente en la cotización"
   - "que el PDF muestre el logo también en el pie"
   - "conviértela en PWA instalable"

## Estructura
```
tacre/
├── index.html            ← la app completa (editar aquí)
├── manifest.webmanifest  ← PWA: nombre, colores e iconos
├── sw.js                 ← PWA: service worker (offline)
├── icon-192/512/180.png  ← iconos de la app instalada
├── CLAUDE.md             ← contexto para Claude Code (no borrar)
├── README.md             ← este archivo
└── .gitignore
```

## Instalarla como app (PWA)
La carpeta debe servirse por **HTTPS** (GitHub Pages, Netlify…) o `http://localhost`.
- **Android (Chrome):** abrir la URL → menú ⋮ → "Instalar aplicación".
- **iPhone/iPad (Safari):** abrir la URL → botón Compartir → "Añadir a pantalla de inicio".
Tras la primera carga funciona **sin internet**. Con doble clic (`file://`) sigue
funcionando como siempre, solo que sin instalación ni offline.

## Respaldos
Dentro de la app, pestaña **Respaldo BD** (solo admin): descarga/restaura toda la base
de datos en JSON. Hazlo antes de cambios grandes.

## Versión
v5.5 — PWA instalable + transiciones + soporte completo iPhone/iPad/Android. Lista para entrega al cliente.
