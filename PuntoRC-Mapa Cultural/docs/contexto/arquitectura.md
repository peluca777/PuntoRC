# Arquitectura del Sistema - PuntoRC (Mapa Cultural)

## 1. Visión y Propósito
**PuntoRC - Mapa Cultural** es una plataforma web para la difusión y gestión de la cartelera cultural de la ciudad de Río Cuarto (inspirada en la experiencia de carteleras como Elvis Entradas). Su diferencial técnico y funcional radica en un **mapa interactivo geolocalizado a pantalla completa** que posiciona las actividades en sus respectivos espacios culturales y permite filtrarlas dinámicamente mediante un selector de fechas.

---

## 2. Stack Técnico Oficial (Gentle-AI SDD)
El proyecto se construye bajo un enfoque 100% frontend nativo, pedagógico y modular:
* **Estructura y Semántica**: HTML5 nativo estándar.
* **Estilos y Layout**: TailwindCSS v3 (cargado vía CDN) con configuración de modo oscuro basada en clases (`darkMode: 'class'`).
* **Comportamiento e Interactividad**: JavaScript puro (Vanilla JS), organizado modularmente sin dependencias externas.
* **Persistencia de Datos**: Almacenamiento local del navegador (`localStorage`).
* **Identidad Visual**: Modo Oscuro dominante (fondo negro abismal `bg-zinc-950`), Modo Claro limpio (`bg-slate-50`), acento Violeta Neón (`purple-600` / `purple-500`) y tipografía Google Fonts (*Montserrat* + *Inter*).

---

## 3. Mapa de Módulos y Componentes de Interfaz

```
+-----------------------------------------------------------------------------------------+
|                                BARRA DE NAVEGACIÓN SUPERIOR (Desktop)                   |
| [Logo PuntoRC]  [Buscador]  [Switch Sol/Luna]  [Ver en Mapa]  [Favoritos]  [Mi Perfil]   |
+-----------------------------------------------------------------------------------------+
|                       BANNER FLOTANTE ADMIN (visible si isAdminMode = true)             |
| [Status Activo]  "Modo Administrador Activo"  [+ Nuevo Evento]  [Salir del modo admin]  |
+-----------------------------------------------------------------------------------------+
|                               HERO / SLIDER ROTATIVO                                    |
|               Carrusel de banners destacando los eventos top de Río Cuarto              |
+-----------------------------------------------------------------------------------------+
|                               CARTELERA CULTURAL (GRID)                                 |
|   Filtros de categoría (Música, Teatro, Feria, Cine, Taller, Jazz)                      |
|   [Card Evento 1]       [Card Evento 2]       [Card Evento 3]       [Card Evento 4]     |
|   - Foto ilustrativa    - Categoría           - Título              - Fecha y Hora      |
|   - Espacio Cultural    - Ícono Favorito      - Badge Disponibilidad - Botón "Detalles" |
|   - Botón "✏️ Editar" (visible en Modo Administrador)                                   |
+-----------------------------------------------------------------------------------------+
|                                MODAL DETALLES DEL EVENTO (SPA)                          |
|   Vista emergente con foto ampliada, metadatos, cupos y acción "Conseguir Entradas"     |
+-----------------------------------------------------------------------------------------+
|                                MODAL DE PERFIL Y FAVORITOS                              |
|   - Cabecera del usuario explorador de Río Cuarto                                       |
|   - Sección "Mis Favoritos": grilla dinámica con tarjetas guardadas o estado vacío      |
|   - Sección "Modo Administrador (CRUD)": Switch estilo iOS accesible                    |
+-----------------------------------------------------------------------------------------+
|                           MODAL DE EDICIÓN Y CREACIÓN (CRUD)                            |
|   - Formulario para crear o editar títulos, fechas, precios, categorías, cupos y fotos  |
|   - Botón "Eliminar evento" con confirmación y feedback por Toast                       |
+-----------------------------------------------------------------------------------------+
|                                 PIE DE PÁGINA (FOOTER)                                  |
|   - Enlaces a redes sociales y créditos alineados con max-w-7xl                         |
|   - Formulario interactivo "Sugerir un evento" con feedback inmediato                   |
+-----------------------------------------------------------------------------------------+
|                  BOTTOM NAVIGATION BAR (Móvil únicamente: fixed bottom-0)               |
|      [ Inicio ]        [ Explorar ]        [ 📍 Mapa (Pill Central) ]       [ Perfil ]   |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Persistencia Local (`localStorage`) y Semillas de Datos
No se utiliza backend ni API remota. Toda la información reside en `localStorage` bajo claves aisladas:
1. **`puntorc_events_data`**: Colección dinámica de eventos culturales. Se inicializa automáticamente con datos de muestra (*seeds*) de Río Cuarto:
   - *Recital de Rock en Elvis*
   - *Obra de Comedia en el Teatro Municipal*
   - *Feria de Diseño en el C.C. El Andino*
   - *Cine al Aire Libre — Parque del Centro*
   - *Show de Jazz*
   - *Taller de Arte — Cerámica y Mixta*
2. **`puntorc_favorites`**: Lista de identificadores de eventos guardados por el usuario como favoritos.
3. **`puntorc_theme`**: Estado persistido del tema visual (`dark` o `light`).
4. **`puntorc_admin_mode`**: Estado del Modo Administrador ('true' o 'false').
5. **`puntorc_suggestions`**: Registro de sugerencias enviadas por la comunidad.
6. **`puntorc_google_calendar_events`**: Mapeo asociativo entre identificadores de eventos de PuntoRC y los `googleEventId` generados por la API de Google Calendar (`{ [eventId]: googleEventId }`).
7. **`puntorc_google_session`**: Almacenamiento local del token de acceso (`access_token`), tiempo de expiración y perfil público del usuario obtenido vía Google Identity Services (GIS).

---

## 5. Tecnologías Prohibidas (Límites Técnicos Estrictos)
Para garantizar simplicidad conceptual, facilidad de depuración y foco pedagógico:
* ⛔ **Prohibido el uso de librerías o frameworks SPA**: No utilizar React, Angular, Vue, Svelte, ni sus respectivos ecosistemas.
* ⛔ **Prohibido el backend**: No utilizar Node.js, Express, Python, PHP ni entornos de servidor.
* ⛔ **Prohibido bases de datos externas**: No utilizar Firebase, Supabase, MySQL, PostgreSQL ni MongoDB.
* ⛔ **Prohibido estilos CSS en línea (`style="..."`)**: Todos los estilos visuales deben declararse exclusivamente mediante clases de utilidad de TailwindCSS.

---

## 6. Organización de Módulos (Separation of Concerns & Patrón Repository)
Conforme al estándar SDD y ADR-008, el código se divide en capas de responsabilidad única:
1. **Capa de Presentación Markup (`index.html`)**: Esqueleto estructural semántico accesible. Libre de lógica o scripts en línea.
2. **Capa de Estilos (`styles.css`)**: Reglas globales para scrollbars invisibles y transiciones.
3. **Capa de Datos de Dominio (`js/data.js`)**: Semillas iniciales (`DEFAULT_EVENTS` con `isFeatured`), constantes, claves de almacenamiento e iconografía SVG.
4. **Capa de Persistencia y Repositorio (`js/repository.js`)**: Implementación del **Patrón Repository** (`EventRepository`, `FavoritesRepository`, `CalendarRepository`) que encapsula y desacopla la persistencia en `localStorage`.
5. **Capa de Integración de Servicios Externos (`js/calendar.js`)**: Servicio cliente para autenticación OAuth 2.0 (Google Identity Services) y sincronización bidireccional con Google Calendar API v3 (`POST` y `DELETE`), con parser tolerante de fechas a RFC3339.
6. **Capa de Administración (`js/admin.js`)**: Gestión del modo administrador, interruptor estilo iOS y formulario modal CRUD con soporte para eventos destacados.
7. **Capa de Orquestación UI (`js/app.js`)**: Ciclo de vida, tema bimodal, Hero dinámico, auto-ocultamiento de flechas en móvil, favoritos, sincronización con Google Calendar y modales SPA.

