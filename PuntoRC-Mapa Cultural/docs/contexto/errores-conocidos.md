# Errores Conocidos, Gotchas de Maquetado y Soluciones - PuntoRC

Este documento es una guía defensiva para prevenir los errores más comunes al maquetar con HTML5, TailwindCSS y JavaScript Vanilla.

---

## 1. Gotchas Críticos y Soluciones Técnicas

### 🐛 Gotcha 1: Doble Scroll al Abrir Modales o el Mapa Interactivo
* **Síntoma**: El usuario hace scroll dentro de un modal o en el mapa interactivo y el contenido de fondo de la página se sigue desplazando, desorientando la vista.
* **Causa**: El elemento `<body>` conserva su capacidad de desplazamiento mientras el modal tiene su propio overflow.
* **Solución Técnica Obligatoria**:
  ```javascript
  // Al abrir cualquier modal o el mapa overlay:
  document.body.classList.add('overflow-hidden');

  // Al cerrar el modal o el mapa:
  document.body.classList.remove('overflow-hidden');
  ```

---

### 🐛 Gotcha 2: Conflictos de `z-index` en Dispositivos Móviles
* **Síntoma**: El botón flotante del mapa queda oculto detrás de las tarjetas, o por el contrario, aparece flotando por encima del modal a pantalla completa.
* **Causa**: Uso aleatorio o desordenado de índices de apilamiento (`z-index`).
* **Solución Técnica (Escala Oficial de Capas)**:
  - `z-0` a `z-10`: Contenido base (Hero, grilla de tarjetas, pie de página).
  - `z-20`: Menú desplegable hamburguesa en móviles.
  - `z-30`: Barra de navegación fija superior (`<header>`).
  - `z-40`: Botón flotante circular del mapa (`fixed bottom-6 right-6 z-40`).
  - `z-50`: Modales emergentes y Overlay del Mapa a pantalla completa.
  - `z-60`: Alertas flotantes (toasts) o notificaciones temporales de éxito/error.

---

### 🐛 Gotcha 3: Fallo de Parseo y Lecturas Nulas en `localStorage`
* **Síntoma**: La consola arroja `Uncaught SyntaxError: Unexpected token u in JSON at position 0` o `TypeError: Cannot read properties of null`.
* **Causa**: Hacer `JSON.parse(localStorage.getItem('clave'))` directamente cuando la clave aún no fue inicializada o contiene un valor corrupto.
* **Solución Técnica Defensiva**:
  ```javascript
  function safeGetStorage(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.warn(`Error al leer ${key} de localStorage, usando fallback:`, error);
      return fallback;
    }
  }
  ```

---

### 🐛 Gotcha 4: Scroll Horizontal Involuntario en Pantallas Pequeñas
* **Síntoma**: En teléfonos celulares, la pantalla se mueve ligeramente de izquierda a derecha mostrando un espacio blanco vacío.
* **Causa**: Elementos con anchos rígidos (ej: `w-[500px]`), imágenes sin `max-w-full`, o márgenes/paddings negativos desbordados.
* **Solución Técnica**:
  - Aplicar `w-full max-w-full overflow-x-hidden` en el contenedor raíz.
  - Todas las imágenes deben incluir `class="w-full h-auto object-cover"`.
  - Probar siempre con el inspector de DevTools a 375px de ancho.

---

### 🐛 Gotcha 5: Uso Incorrecto de Elementos `<div>` para Acciones Cliqueables
* **Síntoma**: El sitio no puede ser navegado mediante el teclado (tecla `Tab` y `Enter`) y los lectores de pantalla no anuncian el elemento interactivo.
* **Causa**: Asignar `@click` o `addEventListener('click')` a un simple `<div>` o `<span>`.
* **Solución Técnica**:
  - Usar **siempre la etiqueta `<button type="button">`** para cualquier acción que no sea un enlace de navegación a otra página.
  - Si es navegación, usar `<a>` con `href` válido.

---

### 🐛 Gotcha 6: Contraste Visual Deficiente en Modo Oscuro/Claro
* **Síntoma**: Textos ilegibles o bordes invisibles al cambiar entre temas.
* **Causa**: Olvidar definir pares de clases en Tailwind (ej: poner sólo `text-slate-800` sin su variante `dark:text-slate-100`).
* **Solución Técnica**:
  - Verificar siempre las parejas de utilidades: `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`, `border-slate-200 dark:border-slate-800`.

---

### 🐛 Gotcha 7: Desbordamiento Horizontal en Botoneras con 3 o Más Acciones
* **Síntoma**: Al agregar un botón extra a una botonera existente, el último botón queda cortado o invisible por desbordamiento horizontal, especialmente en viewports móviles.
* **Causa**: Contenedores `flex-row` sin `flex-wrap` que no permiten el salto de línea cuando el ancho total de los hijos supera al contenedor padre.
* **Contexto del incidente**: Al añadir el botón "Añadir a Google Calendar" al modal de detalle de evento (4 botones en `flex-col sm:flex-row gap-3` sin `flex-wrap`), el botón "Compartir" quedó recortado en viewports estrechos.
* **Solución Técnica**:
  - Para botoneras con 3 o más acciones, usar **siempre** `flex-wrap` con un `gap` adecuado:
    ```html
    <div class="flex flex-wrap gap-2">
      <button class="flex-1 min-w-[160px] ...">Acción principal</button>
      <button class="shrink-0 ...">Acción secundaria</button>
      <button class="shrink-0 ...">Acción terciaria</button>
    </div>
    ```
  - El botón principal puede llevar `flex-1 min-w-[Xpx]` para crecer hasta ocupar el ancho disponible pero nunca bajar de un mínimo legible.
  - Los botones secundarios deben llevar `shrink-0` para no comprimirse.
  - Como alternativa, considerar `grid grid-cols-2 gap-2` para layouts de 4 botones parejos.

