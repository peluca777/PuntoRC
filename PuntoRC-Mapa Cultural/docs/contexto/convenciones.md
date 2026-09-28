# Convenciones de Código, Semántica y Diseño - PuntoRC

---

## 1. Semántica HTML5
Para garantizar accesibilidad (a11y), indexabilidad y estructura profesional, se exige el uso estricto de etiquetas semánticas:
* `<header>` y `<nav>`: Para la barra superior de navegación (desktop) y la Bottom Navigation Bar (móvil).
* `<main>`: Envoltorio del contenido central del documento (`#main-content`).
* `<section>`: Delimitador de bloques temáticos principales (Hero Slider, Cartelera, Panel Admin).
* `<article>`: Para cada tarjeta individual de evento en la cartelera y cada slide del hero.
* `<footer>`: Para el pie de página y formulario de sugerencias.
* `<button>`: **Obligatorio para cualquier elemento interactivo o cliqueable**. Prohibido usar `<div>` o `<span>` con listeners de clic para simular botones.
* `<form>`, `<input>`, `<select>`, `<textarea>`: Con sus respectivos `<label>` y atributos `for` e `id` para formularios accesibles.
* `<img>`: Obligatoriamente acompañadas de un atributo `alt` descriptivo.

---

## 2. Tipografía (Google Fonts: Montserrat + Inter)
Se carga la combinación en el `<head>` del documento:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
```
* **Títulos, Encabezados, Logo y Botones**: `'Montserrat', sans-serif` (`font-montserrat`, con pesos altos `font-bold` / `font-extrabold`). Otorga el aspecto geométrico, ancho y moderno característico de aplicaciones de eventos como Jodify.
* **Párrafos, Fechas, Ubicaciones y Metadatos**: `'Inter', sans-serif` (`font-inter`, `font-normal` / `font-medium`) para lectura descansada y nítida.

---

## 3. Paleta de Colores y Gestión de Temas (Modo Oscuro Dominante)
Se implementa una estética de **Modo Oscuro dominante y sofisticado** con soporte para conmutación mediante clase `dark` en `<html>`:

### A. Modo Oscuro Dominante (`class="dark"`)
* **Fondo general de página**: Negro abismal `bg-zinc-950` / `bg-black`
* **Superficies (Cards, Modales, Navbars, Footer)**: `bg-zinc-900` / `bg-zinc-900/90` con bordes sutiles `border border-zinc-800`
* **Texto Primario**: `text-white` o `text-zinc-100`
* **Texto Secundario (metadatos, fechas)**: `text-zinc-400` / `text-zinc-500`
* **Inputs y Controles**: `bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500`

### B. Modo Claro (Soporte Bimodal)
* **Fondo general de página**: `bg-zinc-50` / `bg-white`
* **Superficies (Cards, Modales, Navbars)**: `bg-white` con bordes suaves `border border-zinc-200`
* **Texto Primario**: `text-zinc-900`
* **Texto Secundario**: `text-zinc-600`
* **Inputs y Controles**: `bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400`

### C. Color de Acento Maestro: Violeta Neón Vibrante
* **Color Base**: `purple-600` (`#9333ea`) con hover en `purple-500` (`#a855f7`) y variantes de luz `purple-400`.
* **Aplicación**: Botones principales (CTA), enlaces activos, badges de categoría, pines del mapa interactivo, estrellas de favoritos, pill central del mapa en la Bottom Nav y sombras de acento (`shadow-purple-500/40`).
* **Propósito**: Genera un aura nocturna de evento cultural en vivo con contraste superior sobre el fondo negro abismal.

---

## 4. Diseño Responsive y Navegación Móvil App-Like
* **Smartphones (< 768px)**:
  - **Bottom Navigation Bar fija** (`fixed bottom-0 left-0 right-0 z-40 h-16 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800`):
    * 4 destinos distribuidos equitativamente: **Inicio**, **Explorar**, **Mapa** (botón pill central 3D elevado) y **Perfil**.
    * Reemplaza por completo el menú hamburguesa para una ergonomía táctil óptima con el pulgar.
  - **Eliminación del FAB flotante en móvil**: El acceso al mapa está centralizado en el tab **Mapa** de la Bottom Nav.
  - **Espaciado inferior en `<body>`**: `pb-16 md:pb-0` para evitar que la barra tape contenido.
  - Cartelera en **1 sola columna vertical** (`grid-cols-1`).
* **Tablets y Escritorio ($\ge$ 768px)**:
  - Bottom Nav oculta (`md:hidden`).
  - Navbar superior completa con buscador extendido, botón 3D "Ver en Mapa" integrado (`#btn-open-map-desktop`), switch de tema, favoritos y login.
  - Cartelera en grilla de 2 a 4 columnas (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

## 5. Microinteracciones, Glassmorphism y Botones
* **Barra de Navegación Superior (Glassmorphism)**:
  - **Clases obligatorias**: `fixed top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-white/10`
  - Vidrio esmerilado translúcido de alto contraste que deja entrever sutilmente el contenido subyacente manteniendo legibilidad perfecta de logos y controles.
* **Botonera de Filtros de Categoría**:
  - **Estructura y forma**: Píldora (`rounded-full`) con padding ergonómico (`px-4 py-2 text-sm font-montserrat`).
  - **Sin emojis**: Todos los emojis sustituidos por íconos SVG vectoriales (`w-4 h-4`) limpios en formato silueta/línea.
  - **Estado Inactivo**: Fondo translúcido `bg-white/5`, borde sutil `border border-white/10`, texto gris `text-zinc-400`.
  - **Hover y Estado Activo**: Transición a tonos violetas `hover:bg-purple-900/40 hover:border-purple-500 hover:text-white`, resplandor neón `shadow-[0_0_15px_rgba(168,85,247,0.2)]`.
  - **Sincronización de ícono**: Uso de la clase `group` en el botón y `group-hover:text-purple-400` en el SVG con `transition-all duration-300`.
* **Botones Principales (Efecto 3D Táctil)**:
  - **Clases obligatorias**: `bg-purple-600 hover:bg-purple-500 text-white font-montserrat font-bold border-b-4 border-purple-900 shadow-lg shadow-purple-500/40 active:border-b-0 active:translate-y-1 transition-all duration-150 cursor-pointer`
  - **Sensación física**: Simulan profundidad con un borde inferior oscuro de 4px que colapsa físicamente en `active:` produciendo un desplazamiento vertical hacia abajo (`translate-y-1`).
* **Tarjetas de Eventos**: Elevación suave con sombra neón al pasar el cursor (`transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-900/20 hover:border-purple-500/40`).
* **Pines del Mapa**: Animación sutil de rebote o escalado al posar el cursor (`transition-transform hover:scale-125 duration-200`).

---

## 6. Prohibición Absoluta de Archivos Monolíticos y Separación de Responsabilidades (SRP)
* **Regla Inquebrantable**: **PROHIBICIÓN ABSOLUTA DE ARCHIVOS MONOLÍTICOS**. La estructura HTML, las hojas de estilo y la lógica JS deben vivir en archivos independientes. Se prohíbe incrustar lógica de negocio, datos (ej. `DEFAULT_EVENTS`) o manejo del DOM dentro de etiquetas `<script>` o `<style>` en el `index.html`.
* **Estructura Desacoplada Obligatoria**:
  - `index.html`: Únicamente esqueleto y estructura semántica de la UI. Cero bloques `<script>` de lógica o datos embebidos.
  - `styles.css`: Hojas de estilo y personalizaciones visuales desacopladas.
  - `js/`: Directorio modular organizado por dominios aplicando el **Patrón Repository**:
    - `js/data.js`: Semillas de datos (`DEFAULT_EVENTS`), constantes y configuraciones iniciales.
    - `js/repository.js`: Abstracción de persistencia local (`localStorage`) para eventos, favoritos y sincronizaciones de Google Calendar (`CalendarRepository`).
    - `js/calendar.js`: Servicio cliente de Google Identity Services (OAuth 2.0) y Google Calendar API v3.
    - `js/admin.js`: Controladores del modo administrador, modal CRUD y validación de formularios.
    - `js/image-editor.js`: Editor y optimizador nativo Canvas para compresión y recorte de imágenes 16:9.
    - `js/app.js`: Orquestador de la UI, ciclo de vida, carrusel hero dinámico, filtros y modales.

---

## 7. Convenciones de Integración: Google Calendar & OAuth 2.0
* **Autenticación Frontend**: Exclusivamente mediante Google Identity Services (GIS) Token Model (`google.accounts.oauth2.initTokenClient`), sin enviar credenciales secretas al cliente.
* **Huso Horario Estándar**: Toda fecha enviada a la API de Calendar debe formatearse en RFC3339 con offset `-03:00` y timezone `America/Argentina/Cordoba`.
* **Resiliencia de Sincronización**:
  - Si una petición devuelve código HTTP `401` (Unauthorized), la sesión local debe revocarse y limpiarse inmediatamente, solicitando al usuario reautenticarse mediante un Toast no intrusivo.
  - Al ejecutar `DELETE` en Google Calendar, respuestas `404` o `410` se tratan como éxito idempotente, removiendo el `googleEventId` de `localStorage`.


