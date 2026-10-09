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
|                                BARRA DE NAVEGACIÓN SUPERIOR                             |
| Desktop: [Logo PuntoRC]  [Buscador]  [Switch Sol/Luna]  [Ver en Mapa] [Favoritos] [Perfil] |
| Móvil:   [Logo PuntoRC]  --------------------------------  [Tema] [Campana] [Lupa]      |
|          [#mobile-search-panel (desplegable)] | [#mobile-notif-panel (desplegable)]     |
+-----------------------------------------------------------------------------------------+
|                       BANNER FLOTANTE ADMIN (visible si isAdminMode = true)             |
| [Status Activo]  "Modo Administrador Activo"  [+ Nuevo Evento]  [Salir del modo admin]  |
+-----------------------------------------------------------------------------------------+
|                               HERO / SLIDER ROTATIVO COMPACTO                           |
|       Carrusel de altura reducida (h-190/280/380px) destacando eventos top de Río IV    |
+-----------------------------------------------------------------------------------------+
|                     CARTELERA CULTURAL — CARDS HORIZONTALES (1 col móv / 2 col desk)    |
|   Filtros de categoría (Música, Teatro, Feria, Cine, Taller, Jazz)                      |
|   [Card Horizontal 1]                     [Card Horizontal 2]                           |
|   - Miniatura + SoldOut/Admin             - Miniatura + SoldOut/Admin                   |
|   - Info (Título, Cat, Ubic, Precio)      - Info (Título, Cat, Ubic, Precio)            |
|   - Bloque fecha vertical con divisor     - Bloque fecha vertical con divisor           |
|   - Acciones: Bookmark + Chevron          - Acciones: Bookmark + Chevron                |
|   [Mensaje "No hay más eventos" en móvil]                                               |
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
|                     PIE DE PÁGINA (FOOTER — Sólo Desktop, hidden md:block)              |
|   - Enlaces a redes sociales y créditos alineados con max-w-7xl                         |
|   - Formulario interactivo "Sugerir un evento" (en móvil se reubicará en Perfil)        |
+-----------------------------------------------------------------------------------------+
|                  BOTTOM NAVIGATION BAR (Móvil únicamente: fixed bottom-0)               |
|      [ Inicio ]        [ Explorar (Lupa) ]        [ 📍 Mapa (Central) ]     [ Perfil ]  |
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
3. **Capa de Datos de Dominio (`js/data.js`)**: Semillas iniciales (`DEFAULT_EVENTS` con `isFeatured`), constantes y mapeos de iconos SVG.
4. **Capa de Persistencia y Repositorio (`js/repository.js`)**: Implementación del **Patrón Repository** (`EventRepository`, `FavoritesRepository`) que encapsula y desacopla la persistencia en `localStorage`.
5. **Capa de Administración (`js/admin.js`)**: Gestión del modo administrador, interruptor estilo iOS y formulario modal CRUD con soporte para eventos destacados.
6. **Capa de Orquestación UI (`js/app.js`)**: Ciclo de vida, tema bimodal, Hero compacto dinámico, auto-ocultamiento de flechas en móvil, favoritos con bookmark, renderizado de cards horizontales compactas con bloque de fecha (`splitEventDate`), paneles móviles de búsqueda y notificaciones con exclusión mutua, y modales SPA.

