# PuntoRC - Mapa Cultural

## Sistema Operativo Antigravity y Reglas del Proyecto

Este repositorio opera bajo el sistema de reglas y directivas de ingeniería de Antigravity.

@.agents/rules/antigravity_global_rules.md

---

## Contexto Vivo del Proyecto (Gentle-AI SDD)
Toda la arquitectura, convenciones, decisiones, glosario, flujo y lecciones aprendidas se encuentran centralizadas y enlazadas para carga permanente:

@docs/contexto/arquitectura.md
@docs/contexto/convenciones.md
@docs/contexto/decisiones.md
@docs/contexto/glosario.md
@docs/contexto/flujo-de-trabajo.md
@docs/contexto/errores-conocidos.md

---

## Directivas Rápidas del Proyecto
- **Stack**: HTML5 semántico + TailwindCSS (vía CDN) + Vanilla JavaScript modular.
- **Persistencia**: Almacenamiento local `localStorage` con semillas (*seeds*) de Río Cuarto.
- **Identidad Visual**: Modo Oscuro dominante (Negro abismal `zinc-950`) con acento Violeta Neón (`purple-600`), tipografía Montserrat + Inter, y navegación app-like (Bottom Nav en móviles).
- **Límites Técnicos**: Prohibidos frameworks SPA, backends externos, bases de datos remotas y estilos inline (`style="..."`).

