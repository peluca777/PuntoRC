# Glosario del Negocio y Componentes de Interfaz - PuntoRC

Este documento compila el lenguaje ubicuo del proyecto para alinear las denominaciones en código, textos de interfaz y documentación.

---

## 1. Términos del Negocio Cultural

* **Cartelera Cultural**: Sección principal de la plataforma que exhibe la grilla de eventos programados en la ciudad de Río Cuarto.
* **Espacio Cultural (Sede)**: Espacio físico o establecimiento donde tiene lugar el evento (por ejemplo: *Elvis Live*, *Teatro Municipal*, *Centro Cultural El Andino*, *Parque del Centro*).
* **Pin de Geolocalización**: Indicador visual posicionado sobre las coordenadas del mapa que señala la ubicación exacta del evento o sede cultural. Incluye animación interactiva y color de acento naranja.
* **Selector de Fecha**: Mando interactivo flotante en el mapa que permite filtrar en tiempo real los eventos y pines mostrados según el día seleccionado.
* **Modal de Detalles**: Ventana emergente flotante con foto ampliada, descripción exhaustiva, datos del espacio cultural, horario, precio y opciones de reserva/favoritos.
* **Panel de Administrador**: Vista de gestión restringida al perfil con rol `admin` para crear nuevos eventos, modificar existentes, eliminarlos y vincular portadas mediante URLs públicas.
* **Favoritos**: Función que permite al usuario marcar eventos con una estrella para consultarlos rápidamente en una vista o filtro dedicado.
* **Sugerencia de Evento**: Formulario en el pie de página para que los vecinos y gestores culturales envíen propuestas de eventos para su posterior revisión.

---

## 2. Componentes de la Interfaz de Usuario (UI)

* **Navbar Superior**: Barra fija o superior con el logotipo de PuntoRC, barra de búsqueda en tiempo real, selector de modo oscuro/claro, contador de favoritos y botones de autenticación / acceso admin.
* **Hero Slider (Carrusel)**: Banner rotativo de gran impacto visual en la cabecera del sitio que promociona los espectáculos más destacados de la semana en Río Cuarto.
* **Card de Evento (Tarjeta)**: Contenedor individual en la cartelera que reúne la imagen de portada, categoría (badge), título, fecha, hora, espacio cultural, botón de favorito y botón de acción "Ver detalles".
* **Botón Flotante de Mapa (Floating Action Button - FAB)**: Botón circular con ícono de mapa ubicado en la esquina inferior derecha de la pantalla (`fixed bottom-6 right-6 z-40`), con acento naranja y visible en todo momento.
* **Overlay del Mapa a Pantalla Completa**: Capa modal que ocupa el 100% del viewport (`z-50`) con fondo opaco, que contiene el lienzo del mapa interactivo, el selector de fecha y el botón de cierre.
* **Switch de Tema**: Alternador visual con íconos de sol y luna para alternar fluidamente entre los estilos claro y oscuro.
* **Modal de Autenticación**: Ventana emergente para iniciar sesión o registrarse, con selector rápido de credenciales para prueba (Admin / Visitante).
* **Editor de Recorte (Crop Editor)**: Modal con `<canvas>` nativo que permite al administrador seleccionar y recortar una región 16:9 de la imagen del evento, con guías de tercios, drag para mover, handles para redimensionar y compresión automática a JPEG 1920x1080/0.8 antes de guardar. Introducido en ADR-009, resolución actualizada en ADR-011.
* **Toggle de Modo de Imagen**: Selector de tabs (Pegar URL / Subir Archivo) en el formulario CRUD que alterna entre ingresar una URL externa o subir un archivo de imagen desde el dispositivo mediante `FileReader`.

---

## 3. Modelos de Datos en `localStorage`

### Entidad Evento (`Event`)
```javascript
{
  id: "evt_1726700000000",
  title: "Recital de Rock en Elvis",
  category: "Música",            // Música | Teatro | Feria | Cine | Taller | Danza
  date: "2026-09-18",             // Formato YYYY-MM-DD
  time: "22:00",                  // Formato HH:MM
  venue: "Elvis Live",            // Nombre del espacio cultural
  address: "Alvear 598, Río Cuarto",
  coords: { x: 45, y: 55 },       // Coordenadas relativas en el lienzo del mapa (%)
  imageUrl: "https://images.unsplash.com/...",
  description: "Una noche a puro rock nacional con las mejores bandas de la región.",
  price: "Entrada anticipada: $5000",
  isFeatured: true                // Indica si aparece en el Hero Slider
}
```

### Entidad Usuario (`User`)
```javascript
{
  id: "usr_001",
  name: "Administrador Río Cuarto",
  email: "admin@puntorc.com",
  role: "admin",                  // 'admin' o 'user'
  favorites: ["evt_1726700000000"]
}
```
