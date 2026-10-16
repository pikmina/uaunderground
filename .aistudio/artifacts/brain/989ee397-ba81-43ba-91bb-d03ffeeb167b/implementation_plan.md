# Plan de Implementación: Herosphere

Transformación integral de la plataforma al canal de noticias y chismes de la industria heroica **Herosphere**. Se reestructuran las páginas principales, se unifica el formulario de personajes, se simplifican las tarjetas de personaje unificando Comentarios y Rumores en **Opiniones**, y se eliminan las referencias exclusivas a la UA.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas y revisiones del usuario**:
>
> 1. **Migración de Datos**: Reclasificar automáticamente los personajes existentes como *Aspirantes a Héroes*.
> 2. **Formato del Muro de Chismes**: Feed principal en 2 columnas (columna izquierda para la lista de chismes y columna derecha para los filtros verticales por Grupo y Ocupación).
> 3. **Barra de Navegación**: Menú superior dinámico con accesos a Herosphere (`/muro`), Héroes (`/heroes`), Celebridades (`/celebridades`) y Aspirantes a Héroes (`/aspirantes`).
> 4. **Unificación de Tarjetas de Personajes**: Integrar las secciones de *Comentarios* y *Chismes/Rumores* de cada tarjeta en un único apartado denominado **Opiniones**.

---

## 1. Visión General y Concepto Principal

- **Nombre de la plataforma**: **Herosphere** (anteriormente UA Underground).
- **Enfoque**: Portal de noticias, opiniones, clasificaciones y rumores de toda la industria heroica (héroes profesionales, figuras públicas, celebridades y jóvenes aspirantes).
- **Ruta por defecto tras autenticación**: `/muro` (Muro de Chismes / Herosphere).

---

## 2. Experiencia de Usuario y Diseño Visual

### A. Estructura de Páginas y Navegación
- **Herosphere (Inicio / Muro)** (`/muro` o `/`):
  - Columna 1 (Ancho principal): Lista vertical de chismes y opiniones con sus reacciones, interacción y badges de personaje.
  - Columna 2 (Barra lateral): Filtros verticales con buscador de personajes, filtro por Grupo y filtro por Ocupación/Clase.
- **Héroes** (`/heroes`):
  - Catálogo de Héroes profesionales con buscador al 100% de ancho, selector de ocupación y tarjetas de perfil.
- **Celebridades** (`/celebridades`):
  - Sección dedicada a figuras públicas, famosos y celebridades de la industria.
- **Aspirantes a Héroes** (`/aspirantes`):
  - Catálogo de estudiantes y jóvenes promesas del heroísmo.

### B. Tarjeta de Personaje & Detalle (Unificación de Opiniones)
- En la tarjeta del personaje y en su modal de detalle, se eliminan las pestañas duplicadas de *Comentarios* y *Chismes/Rumores*.
- Se fusiona todo en una sola sección interactiva llamada **Opiniones**, donde los usuarios pueden leer, publicar y reaccionar a todas las valoraciones y comentarios sobre ese personaje.

### C. Formulario Unificado de Personajes (Admin & Modal)
- **Campos**:
  - Nombre (texto)
  - Alias / Apodo (texto)
  - Quirk / Don (texto)
  - Grupo: Select con las opciones `Aspirantes a Héroes`, `Héroes`, `Celebridades`, `Otros`.
  - Ocupación / Clase: Select dinámico con opción para ingresar/agregar nuevas opciones personalizadas.
  - Rankings: Mantener clasificaciones actuales (*Best Hero*, *Atractivo*, *Caos*, *Carisma*) con opción de agregar nuevos rankings.
  - Edad: Campo opcional.

---

## 3. Decisiones de Producto y Arquitectura

1. **Renombrado General & Limpieza de Marca**:
   - Actualización de metadatos del sitio (`metadata.json`, `<title>`, `og:title`, headers) para reflejar la marca **Herosphere**.
   - Eliminación de textos específicos de la "UA" en botones, diálogos y descripciones.
2. **Simplificación de Interacción**:
   - Unificación de hilos de comentarios y rumores en el componente de detalle y tarjetas bajo el nombre **Opiniones**.
3. **Modelo de Datos Unificado**:
   - Ajuste de la interfaz `Character` para admitir `group` y flexibilidad en `classCourse` (Ocupación/Clase).
   - Mantenimiento de la persistencia en Firebase Firestore y sincronización en tiempo real.

---

## 4. Arquitectura Técnica y Estrategia de Datos

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           TopNavbar & Router                                   │
│    [/muro] (Herosphere)   │   [/heroes]   │   [/celebridades]   │ [/aspirantes]   │
└───────────┬───────────────┴───────┬───────┴─────────┬───────┴───────┬──────────┘
            │                       │                 │               │
┌───────────▼───────────┐     ┌─────▼─────┐     ┌─────▼─────┐   ┌─────▼─────┐
│ Herosphere (RumorFeed)│     │  Heroes   │     │Celebridades│  │Aspirantes │
│  [Feed]   │ [Sidebar] │     │ View Grid │     │ View Grid │   │ View Grid │
└───────────┬───────────┘     └───────────┘     └───────────┘   └───────────┘
            │
┌───────────▼────────────────────────────────────────────────────────────────────┐
│              Firebase Firestore / Local Store (Character & Rumor)              │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Plan de Verificación de Integración
1. Compilar y verificar sintaxis con `compile_applet`.
2. Probar la navegación entre `/muro`, `/heroes`, `/celebridades` y `/aspirantes`.
3. Validar la unificación de la sección Opiniones en la vista y modal del personaje.
4. Validar el formulario unificado en la consola de administración.
