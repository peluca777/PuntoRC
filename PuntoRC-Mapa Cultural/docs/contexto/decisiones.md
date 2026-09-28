# Registro de Decisiones de Arquitectura (ADR) - PuntoRC

Este documento es el registro inmutable de decisiones técnicas y arquitectónicas tomadas para **PuntoRC - Mapa Cultural**. Cada decisión sigue el estándar ADR con fecha, estado, justificación técnica y consecuencias.

---

## 🛡️ Protocolo de Autorización Previa Obligatoria (Guardrails)
* **Regla Inquebrantable**: Ninguna decisión existente, regla de negocio, contrato de datos o convención acordada podrá ser modificada o eliminada de este documento sin la **aprobación explícita y previa del usuario**.
* En caso de requerirse un cambio, el agente debe exponer:
  1. La decisión que se pretende alterar.
  2. La justificación técnica del cambio.
  3. Los impactos colaterales en la UI, el almacenamiento o la estructura del código.

---

## ADR-001: Stack Pedagógico Frontend Vanilla (HTML5 + Tailwind CDN + Vanilla JS)
* **Fecha y Hora**: 2026-09-18 00:03:00 -03:00
* **Estado**: Aceptado
* **Contexto**: El proyecto está orientado a estudiantes y desarrolladores principiantes. Se requiere una curva de aprendizaje accesible sin la sobrecarga cognitiva de bundlers (Webpack, Vite), node_modules gigantes o frameworks reactivos complejos.
* **Decisión**:
  - Utilizar **HTML5 semántico nativo**.
  - Utilizar **TailwindCSS vía CDN** para maquetación ágil y responsive.
  - Utilizar **Vanilla JavaScript puro** sin dependencias externas.
  - Prohibir estrictamente el uso de estilos en línea (`style="..."`).
* **Consecuencias**: El proyecto puede ejecutarse directamente abriendo el archivo `index.html` en el navegador, sin necesidad de compilar ni instalar servidores de desarrollo, manteniendo un código limpio y legible.

---

## ADR-002: Base de Datos Simulada en `localStorage` con Inicialización por Semillas
* **Fecha y Hora**: 2026-09-18 00:03:10 -03:00
* **Estado**: Aceptado
* **Contexto**: Se requiere persistir eventos creados por administradores, gestionar favoritos y almacenar sesiones de usuario sin contar con una infraestructura de backend o base de datos externa.
* **Decisión**:
  - Centralizar la persistencia en el almacenamiento local del navegador (`localStorage`).
  - Implementar funciones defensivas (`safeJsonParse`) que inicialicen colecciones vacías o con datos semilla (*seeds* de Río Cuarto) si las claves no existen previamente.
* **Consecuencias**: Independencia total de servicios externos de red; persistencia consistente a lo largo de las sesiones del usuario en el mismo navegador.

---

## ADR-003: Mapa Interactivo como Modal Overlay de Pantalla Completa
* **Fecha y Hora**: 2026-09-18 00:03:15 -03:00
* **Estado**: Modificado por ADR-006
* **Contexto**: La visualización de la cartelera sobre un mapa físico es el diferencial de la plataforma. La navegación móvil requiere un acceso inmediato y sin distracciones.
* **Decisión**:
  - Implementar el mapa como una capa emergente (*modal overlay*) a pantalla completa con `z-index: 50`.
  - Bloquear el scroll del `<body>` (`overflow-hidden`) mientras el mapa o cualquier modal esté activo.
  - Incorporar un selector de fecha dinámico integrado en la cabecera flotante del mapa.
* **Consecuencias**: Experiencia inmersiva en celulares y desktops, eliminando solapamientos o scrolls accidentales del fondo de la página.

---

## ADR-004: Paleta Bimodal Inicial (Naranja Vibrante)
* **Fecha y Hora**: 2026-09-18 00:03:20 -03:00
* **Estado**: Reemplazado por ADR-006 (Pivote visual a Modo Oscuro Dominante y Violeta Neón).

---

## ADR-005: Control de Acceso y Gestión de Roles en Cliente (Admin vs. Visitante)
* **Fecha y Hora**: 2026-09-18 00:03:25 -03:00
* **Estado**: Aceptado
* **Contexto**: Se requiere demostrar el funcionamiento de un Panel de Administrador para crear, editar y eliminar eventos, conviviendo con la experiencia del visitante común.
* **Decisión**:
  - Simular un sistema de autenticación en `localStorage` con dos perfiles de usuario predefinidos: Administrador (`admin@puntorc.com`) y Visitante.
  - Desbloquear el acceso al botón "Panel de Administrador" en la barra de navegación únicamente cuando la sesión activa posee el rol `'admin'`.
* **Consecuencias**: Permite practicar conceptos de autorización, vistas protegidas e interacción CRUD en el DOM sin complejidad de servidores.

---

## ADR-006: Pivote Visual a Modo Oscuro Dominante, Acento Violeta Neón y Navegación App-Like (Bottom Nav)
* **Fecha y Hora**: 2026-09-18 02:15:00 -03:00
* **Estado**: Aceptado (Aprobado explícitamente por el usuario)
* **Contexto**: Se busca una experiencia visual más inmersiva, moderna y con sensación de aplicación móvil nativa (app-like) para los usuarios en smartphones, mejorando la ergonomía táctil con el pulgar.
* **Decisión**:
  1. **Fondo negro abismal**: Adopción de `bg-zinc-950` / `bg-black` como fondo dominante oscuro.
  2. **Acento Violeta Neón**: Reemplazo del naranja por Violeta Neón (`purple-600` / `purple-500` / `purple-400`) en botones, pines, badges y links activos.
  3. **Bottom Navigation Bar móvil**: Se elimina el menú hamburguesa superior y se implementa una barra fija inferior (`fixed bottom-0 w-full z-40 h-16`) con 4 tabs equitativos: Inicio, Explorar, Mapa (destacado) y Perfil.
  4. **Acceso al Mapa adaptativo**: 
     - En móvil: el acceso al mapa reside en el tab central elevado de la Bottom Nav. Se elimina el botón flotante circular (FAB) para no saturar la pantalla táctil.
     - En desktop: se añade un botón prominente "Ver en Mapa" en la barra de navegación superior fija (`#btn-open-map-desktop`).
* **Consecuencias**: Mayor limpieza visual en pantallas pequeñas, ergonomía nativa móvil, navegación más rápida y estética contemporánea para una cartelera cultural.

---

## ADR-007: Soporte Bimodal Claro/Oscuro, Vista de Perfil con Favoritos y Panel CRUD Integrado
* **Fecha y Hora**: 2026-09-22 03:30:00 -03:00
* **Estado**: Aceptado (Aprobado explícitamente por el usuario)
* **Contexto**: Se requiere permitir a los usuarios alternar entre Modo Oscuro y Modo Claro con fondos limpios y sombras suaves sin perder los acentos violeta/fucsia de la marca; contar con un modal de Perfil con gestión dinámica de eventos favoritos guardados en `localStorage`; e integrar un panel CRUD administrativo activable mediante un interruptor estilo iOS para editar o crear eventos en tiempo real directamente sobre el DOM.
* **Decisión**:
  1. **Alineación del Hero**: Se ajustó `#hero`, `#cartelera` y `footer` al contenedor estándar `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` para una alineación simétrica en todas las resoluciones.
  2. **Modo Claro Bimodal**: Clases `bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-800` en Light Mode y fondos profundos `bg-zinc-950` en Dark Mode. Alternancia persistida en `localStorage` (`puntorc_theme`).
  3. **Modal de Perfil y Favoritos (`#profile-modal-overlay`)**: Integra cabecera de usuario explorador, contador dinámico sincronizado con botones de corazón, grilla de tarjetas guardadas y estado vacío guiado hacia la cartelera.
  4. **Modo Administrador (CRUD) con Switch iOS**: Un toggle switch accesible en la vista de perfil activa el modo administrador, persistido en `localStorage` (`puntorc_admin_mode`).
  5. **Herramientas de Edición y Creación**: Cuando el modo admin está activo, se despliega una barra flotante superior (`#admin-floating-banner`) con acceso a "+ Nuevo Evento" y botones "✏️ Editar" en cada tarjeta y en el modal SPA, permitiendo modificar título, categoría, fecha, lugar, precio, cupos/disponibilidad y foto, o eliminar el evento con feedback vía Toast.
* **Consecuencias**: Flexibilidad visual para usuarios de día y noche, interactividad completa de favoritos sin backend, y capacidad pedagógica para administrar el contenido de la cartelera en tiempo real con persistencia en el navegador.

---

## ADR-008: Desacoplamiento Arquitectónico, Prohibición de Monolitos y Patrón Repository
* **Fecha y Hora**: 2026-09-22 07:15:00 -03:00
* **Estado**: Aceptado (Mandato de Guardas y Rescate de Clean Code)
* **Contexto**: El archivo `index.html` acumuló más de 2.700 líneas concentrando markup, Tailwind y más de 1.150 líneas de JavaScript imperativo, violando los principios de Clean Code, SRP y el Definition of Done global.
* **Decisión**:
  1. **Purificación de `index.html`**: Reducir el archivo a únicamente estructura semántica y maquetación de la UI, eliminando etiquetas `<script>` con lógica o datos inline.
  2. **Extracción CSS**: Centralizar reglas de scrollbar y utilidades en `styles.css`.
  3. **Modularización JS por Dominios y Patrón Repository en `js/`**:
     - `js/data.js`: Semillas `DEFAULT_EVENTS` (con propiedad `isFeatured`), constantes y mapeo de categorías e iconos SVG.
     - `js/repository.js`: `EventRepository` para centralizar lecturas, mutaciones, filtrados y persistencia en `localStorage`.
     - `js/admin.js`: Controladores del modo administrador, interruptor estilo iOS y formulario CRUD modal.
     - `js/app.js`: Orquestación de UI, renderizado del Hero dinámico, auto-ocultamiento de flechas en móvil, favoritos, filtros y modales.
* **Consecuencias**: Mantenibilidad superior, separación estricta de responsabilidades (SRP), código pedagógico de alto nivel y cumplimiento riguroso de las directivas de ingeniería de Antigravity.

## ADR-009: Edición Local de Imágenes vía Canvas Nativo con Compresión Obligatoria
* **Fecha y Hora**: 2026-09-22 09:30:00 -03:00
* **Estado**: Aceptado (Aprobado explícitamente por el usuario). Modificado por ADR-011 (aumento de resolución máxima a 1920x1080)
* **Contexto**: El campo de imagen del formulario CRUD solo aceptaba URLs externas (Unsplash, etc.). Se requiere permitir la subida de archivos de imagen locales desde el dispositivo del administrador y ofrecer un editor de recorte visual para ambas fuentes, sin agregar librerías externas ni modificar el contrato de datos (`repository.js`).
* **Decisión**:
  1. **Toggle URL/Archivo**: Selector de tabs accesible (role="tab") en el formulario CRUD que alterna entre pegar una URL externa o subir un archivo local (`FileReader → dataURL`).
  2. **Editor de Recorte Canvas Nativo**: Modal con `<canvas>` que renderiza la imagen completa, superpone un cuadro de selección draggable/resizable con proporción fija **16:9** (coincidente con `aspect-video` de las cards) y guías de tercios.
  3. **Compresión Obligatoria**: Toda imagen recortada o subida localmente se redimensiona a un máximo de **1000px de ancho** y se exporta como `canvas.toDataURL('image/jpeg', 0.8)` antes de persistir. Esto mitiga el riesgo de saturar `localStorage` (~5 MB de cuota) con cadenas base64 pesadas.
  4. **CORS Handling**: Imágenes externas se cargan con `crossOrigin="anonymous"`. Si el dominio bloquea CORS y el canvas queda "tainted", se muestra un toast informativo sugiriendo subir el archivo localmente.
  5. **Módulo Desacoplado `js/image-editor.js`**: La lógica del editor (~350 líneas) vive en su propio archivo IIFE siguiendo el Patrón SRP (ADR-008), expuesto como `PuntoRC.ImageEditor` y consumido por `admin.js`.
* **Alternativas Evaluadas**:
  - **Cropper.js**: Descartada por violar ADR-001 (prohibición de dependencias externas) y la filosofía pedagógica del proyecto.
  - **Integrar todo en `admin.js`**: Descartada por violar ADR-008 (prohibición de monolitos y SRP).
* **Consecuencias**: Las imágenes en base64 comprimidas pesan ~80-150 KB cada una. Con ~10 eventos usando imagen local, el consumo estimado es ~1.5-2 MB de los ~5 MB disponibles en `localStorage`. La compresión obligatoria mantiene este riesgo controlado. El modelo de datos (`Event.image: string`) no cambia; acepta tanto URLs como dataURLs de forma transparente.

## ADR-010: Integración de Google Calendar API v3 con Google Identity Services (OAuth 2.0) y Sincronización Bidireccional
* **Fecha y Hora**: 2026-09-24 01:55:00 -03:00
* **Estado**: Aceptado
* **Contexto**: Se requiere permitir a los usuarios agendar eventos culturales de Río Cuarto directamente en su cuenta personal de Google Calendar y gestionar la eliminación bidireccional desde la app, bajo la restricción estricta de arquitectura 100% frontend (sin backend propio) y persistencia en `localStorage`.
* **Decisión**:
  1. **SDK Oficial Google Identity Services (GIS)**: Inyección asíncrona de `https://accounts.google.com/gsi/client` en `<head>` para gestionar el flujo OAuth 2.0 client-side (Implicit / Token Model) mediante `google.accounts.oauth2.initTokenClient` con el Client ID oficial `17830521576-k28ndr4fjurid8p4fhq5ldah5fafro4o.apps.googleusercontent.com` y scopes `https://www.googleapis.com/auth/calendar.events`, `email` y `profile`.
  2. **Persistencia Desacoplada (`CalendarRepository`)**: Extensión del Patrón Repository en `js/repository.js` con las claves aisladas `puntorc_google_session` (token de acceso, vigencia y datos de perfil) y `puntorc_google_calendar_events` (mapeo `{ [eventId]: googleEventId }`).
  3. **Módulo de Integración Dedicado (`js/calendar.js`)**: Encapsulación de las peticiones REST a `https://www.googleapis.com/calendar/v3/calendars/primary/events` (POST para inserción y DELETE para desvinculación), junto con un parser inteligente de fechas culturales de Río Cuarto a marcas RFC3339 en zona horaria `America/Argentina/Cordoba` (`-03:00`).
  4. **Toggle Dinámico en Tarjeta Modal del Evento**: Botón con feedback interactivo ("Añadir a Google Calendar" vs "Agendado (Quitar)"), estados de carga (`isCalendarSyncing`) y gestión de errores/expiración con notificaciones Toast.
  5. **Sección Dedicada en "Mi Perfil"**: Grilla de "Eventos Agendados en Google Calendar" independiente de favoritos, renderizada dinámicamente cruzando el catálogo de eventos con los identificadores sincronizados, con acciones inmediatas para "Ver" y "Quitar de Calendar".
* **Alternativas Evaluadas**:
  - **Uso de enlaces `calendar.google.com/render?action=TEMPLATE`**: Descartada porque no permite sincronización bidireccional ni eliminación programática (DELETE).
  - **Acoplar llamadas fetch directamente en `app.js`**: Descartada por violar ADR-008 (Single Responsibility Principle) y el Definition of Done global.
* **Consecuencias**: El usuario experimenta una integración moderna y sin fricción con su calendario nativo. Si la sesión expira o es revocada por Google (código HTTP 401), la app se recupera limpiando la sesión local y guiando al usuario con Toast contextual.

---

## ADR-011: Aumento de Resolución Máxima de Imágenes Subidas/Recortadas (1000px → 1920x1080)
* **Fecha y Hora**: 2026-09-26 10:23:00 -03:00
* **Estado**: Aceptado (Aprobado explícitamente por el usuario)
* **Contexto**: ADR-009 fijó `MAX_OUTPUT_W` en 1000px como medida de mitigación del riesgo de saturar la cuota de `localStorage` (~5 MB), estimando un peso de ~80-150 KB por imagen comprimida y una capacidad efectiva de ~10 eventos con imagen local. El usuario decidió priorizar mayor calidad visual a resolución Full HD (1920×1080), aceptando explícitamente el trade-off de menor cantidad de eventos con imagen propia almacenables simultáneamente.
* **Decisión**: Elevar `MAX_OUTPUT_W` de `1000` a `1920` en `js/image-editor.js` (sección CONSTANTES). Las constantes `CROP_ASPECT = 16 / 9` y `JPEG_QUALITY = 0.8` se mantienen sin cambios. Con el aspecto fijo 16:9, el alto resultante queda automáticamente en **1080px**; las funciones `compressImageSource()` y `applyCrop()` ya calculan las dimensiones de forma proporcional a partir de `MAX_OUTPUT_W`, por lo que no requieren modificación.
* **Alternativas Evaluadas**:
  - **Mantener 1000px**: Descartada por decisión explícita del usuario que prioriza calidad visual Full HD.
  - **Valor intermedio (1280px → 720p)**: Descartada; el usuario indicó específicamente 1920px como resolución objetivo.
* **Consecuencias**: Cada imagen comprimida ahora pesa aproximadamente 300-600 KB (antes ~80-150 KB), reduciendo la capacidad efectiva de eventos con imagen local almacenables en `localStorage` de ~10 eventos a aproximadamente 4-6 eventos antes de alcanzar la cuota de ~5 MB. Se recomienda al usuario monitorear el uso de `localStorage` si se suben muchas imágenes locales. El contrato de datos (`Event.image: string`) no cambia.
