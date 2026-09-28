# Flujo de Trabajo SDD y Definition of Done - PuntoRC

Este documento define la metodología de desarrollo estructurada basada en **Spec-Driven Development (Gentle-AI)** y los criterios rigurosos de entrega (**Definition of Done**).

---

## 1. Ciclo de Construcción Secuencial (4 Pasos)

```
[Paso 1: Esqueleto HTML5] ──► [Paso 2: Tailwind & Temas] ──► [Paso 3: Lógica Storage] ──► [Paso 4: DOM & Mapa]
  - Maquetación semántica       - Clases utilitarias           - Semillas de eventos        - Render de tarjetas
  - Contenedores y modales      - Switch Claro / Oscuro        - Simulación de Auth/Roles   - Pines y rebotes en mapa
  - Accesibilidad básica        - Grilla responsive            - Funciones CRUD             - Filtros por fecha
```

### Paso 1: Esqueleto HTML5 Semántico y Vistas
* Construir la estructura completa del documento: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
* Disponer los contenedores base para el Hero Slider, la Cartelera Cultural, el botón flotante del mapa (FAB), los modales (Detalles, Auth, Mapa) y el Panel de Administración.

### Paso 2: Estilos con TailwindCSS y Soporte Bimodal
* Aplicar las clases utilitarias de TailwindCSS para maquetación mobile-first (1 columna en móvil, 3-4 en desktop).
* Implementar el switch de modo claro y modo oscuro con persistencia de preferencia.
* Establecer el color de acento naranja (`orange-500`) en llamadas a la acción, pines e íconos interactivos.

### Paso 3: Lógica de Persistencia y Autenticación (`localStorage`)
* Configurar el módulo `storageService.js` con datos semilla (*seeds*) de espacios culturales de Río Cuarto.
* Implementar registro y login simulado con diferenciación de roles (`user` y `admin`).
* Desarrollar las operaciones CRUD para el Panel de Administrador (crear, editar, eliminar eventos).

### Paso 4: Inyección en el DOM, Lógica del Mapa y Filtros
* Renderizar dinámicamente las tarjetas de eventos desde el estado local.
* Construir la interactividad del lienzo del mapa: renderizado de pines geolocalizados, animación de rebote y apertura del modal de detalles al hacer clic.
* Conectar el selector de fechas flotante para filtrar en tiempo real los eventos y pines visibles.

---

## 2. Definition of Done (DoD) del Proyecto
Para considerar cualquier fase o componente como terminado, deben cumplirse **sin excepción** los siguientes criterios:

1. **Cero Estilos Inline**: No debe existir ningún atributo `style="..."` en el marcado HTML.
2. **Consola Limpia**: Sin errores rojos (`Uncaught TypeError`, fallos de parseo) ni warnings críticos en las DevTools del navegador.
3. **Comprobación de los 4 Estados de UI**:
   - ⌛ **Loading**: Indicadores visuales durante transiciones o carga inicial de eventos.
   - 📭 **Empty**: Mensaje claro e instructivo cuando una búsqueda o fecha seleccionada no arroje eventos (ej: *"No hay eventos programados para este día"* con botón para ver todos).
   - ⚠️ **Error**: Mensajes contextuales legibles si faltan campos obligatorios en el formulario o al intentar acciones inválidas.
   - ✅ **Success**: Avisos visibles de éxito tras guardar un evento en el panel admin, sugerir un evento o alternar favoritos.
4. **Verificación Responsive Multi-Dispositivo**:
   - Probado en emulador móvil (375px - 414px) verificando: ausencia de scroll horizontal, navegación colapsable funcional y botón flotante del mapa visible y cliqueable.
   - Probado en escritorio (> 1024px) verificando: distribución armónica en grilla de 3-4 columnas.
5. **Control de Scroll del Body**: El `<body>` debe aplicar `overflow-hidden` al abrir el mapa o cualquier modal y restaurarlo al cerrarlos.

---

## 3. Protocolo Permanente de Control de Versiones (Git Local)

A partir de la inicialización del repositorio Git local, rige la siguiente disciplina obligatoria:

1. **Pre-condición de Inicio (Git Clean Check)**:
   - **Antes** de comenzar cualquier modificación (Fast-Path o Ciclo SDD), se debe verificar que el árbol de trabajo esté limpio (`git status`).
   - Si existen cambios pendientes de una sesión anterior no commiteados, se debe informar al usuario de inmediato antes de continuar o escribir código nuevo.
2. **Post-condición de Entrega (Commit Descriptivo)**:
   - **Después** de completar y verificar cada cambio funcional o estético con los 4 estados UI y sin regresiones, se debe realizar un commit local con mensaje descriptivo y convencional (ej: `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`).
3. **Ámbito Local**:
   - No vincular remotos externos sin autorización explícita del usuario.

