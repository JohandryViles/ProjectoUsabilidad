# Auditoría del frontend de IncluAula IA

Revisión del código del integrante A (commit `4b5ef28`) frente a los requisitos de F2 (RF-01…RF-21), el menú de accesibilidad de F3 y los criterios de formularios de F4 (WCAG 2.2). La realizó el integrante B al integrar las funciones de IA.

**Método:** lectura del código, ejecución de `npm run check` (lint, pruebas y build), recorrido de la interfaz con un navegador sin cabeza en escritorio y a 320 px de ancho, y `npm audit`.

**Límites:** no sustituye la evaluación con usuarios ni las auditorías con herramientas externas del integrante C. No se probó con lectores de pantalla reales (NVDA, VoiceOver, TalkBack).

## 1. Lo que ya está bien

- Hay enlace «Saltar al contenido principal», landmarks con nombre y `lang="es"` (2.4.1, 1.3.1, 3.1.1).
- El panel de preferencias usa el `<dialog>` nativo: Escape lo cierra y el foco vuelve al botón que lo abrió (2.1.2, 2.4.3).
- Las preferencias se guardan en el navegador y, si el almacenamiento está bloqueado, se muestra un aviso (RF-07).
- Las pruebas automáticas verifican el contraste de los tres temas, incluido 7:1 en alto contraste (1.4.3, 1.4.11).
- Los iconos son decorativos por diseño y cada control tiene nombre propio (1.1.1, 4.1.2).
- Los mensajes de estado se anuncian con una región `role="status"` separada del aviso visual (4.1.3).
- Los objetivos táctiles miden 44 px o más (2.5.8).
- Se respeta `prefers-reduced-motion` y además existe una preferencia propia para reducir el movimiento.

## 2. Hallazgos corregidos en esta entrega

| #   | Hallazgo                                                                                                                                                                    | Criterio       | Ubicación                                  | Corrección                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| C1  | El indicador de foco no cubría `textarea`, `select`, `summary` ni los elementos con `tabindex`; los formularios nuevos se habrían quedado sin foco visible.                 | 2.4.7          | `src/styles.css:126`                       | Se añadieron esos selectores a la regla de `:focus-visible`.                                 |
| C2  | La búsqueda de la biblioteca solo tenía `aria-label` y un placeholder: no había etiqueta visible y el placeholder desaparece al escribir.                                   | 3.3.2, 2.5.3   | `src/App.jsx:189`                          | Se añadió un `<label>` visible asociado al campo; el placeholder pasa a ser solo un ejemplo. |
| C3  | El `id="dialog-title"` estaba fijo en el código: dos diálogos abiertos a la vez repetirían el id y romperían `aria-labelledby`.                                             | 4.1.2          | `src/components/Modal.jsx:7`               | El id se genera con `useId()`.                                                               |
| C4  | El avatar de la cabecera tenía `role="img"` y el nombre «Espacio de estudiante», pero no aporta información: era ruido para el lector de pantalla.                          | 1.1.1          | `src/components/Layout.jsx:99`             | Se marcó como decorativo (`aria-hidden`) y se ajustó la prueba.                              |
| C5  | Al añadir el destino «Herramientas IA», la barra de navegación móvil desbordaba en horizontal a 320 px. Lo introdujo esta misma entrega y se detectó en la revisión visual. | 1.4.10         | `src/styles.css`, sección del integrante B | La barra pasa a varias filas en pantallas estrechas.                                         |
| C6  | Los textos de cabecera de cada página estaban en ternarios anidados repetidos (difícil añadir páginas).                                                                     | Mantenibilidad | `src/App.jsx:28`                           | Se sustituyeron por un mapa `PAGE_COPY`.                                                     |
| C7  | Con el tamaño «Extra grande» (150 %), los filtros de la biblioteca desbordaban a 320 px.                                                                                    | 1.4.10         | `src/styles.css`, sección de preferencias  | Los filtros pasan a otra línea.                                                              |

## 3. Menú de accesibilidad ampliado (F3)

Se añadieron al panel de preferencias las opciones que pide F3 y otras habituales en menús de accesibilidad. Están agrupadas y todas se guardan en el navegador:

| Opción                                                          | Para quién                       | Requisito / criterio                                |
| --------------------------------------------------------------- | -------------------------------- | --------------------------------------------------- |
| Color normal / suave / escala de grises                         | Sensibilidad visual, TDAH        | Comodidad visual                                    |
| Tamaño «Extra grande» (150 %)                                   | Baja visión                      | RF-07, 1.4.4                                        |
| Letra más legible                                               | Dislexia, baja visión            | RF-07                                               |
| Guía de lectura (franja que sigue al puntero o al foco)         | Dislexia, TDAH                   | T5-U3                                               |
| Modo lectura con «Salir del modo lectura» siempre visible       | TDAH                             | RF-19                                               |
| Lectura en voz alta con pausa, detener y velocidad de 0,5× a 2× | Ceguera, baja visión, dislexia   | RF-02, 4.1.2 (la velocidad se anuncia: «1,5 veces») |
| Subtítulos grandes                                              | Sordera, hipoacusia, baja visión | RF-01                                               |
| Pictogramas por defecto                                         | Discapacidad cognitiva           | RF-17                                               |
| Foco más visible                                                | Teclado, pulsadores, baja visión | 2.4.7 (2.4.13 como mejora)                          |
| Resaltar enlaces                                                | Baja visión, daltonismo          | 1.4.1                                               |
| Cursor grande                                                   | Baja visión, motricidad          | Comodidad                                           |

En pantallas de 320 px, la barra del modo lectura y el reproductor de voz se compactan, y `scroll-padding` evita que tapen el elemento enfocado (2.4.11).

## 4. Brechas frente a F2/F3 (pendientes)

| Requisito                                                             | Estado                                                                 | Propuesta                                                                                                                                | Responsable sugerido |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| RF-18: resaltado palabra a palabra durante la lectura                 | La lectura por voz con velocidad (RF-02) ya existe; falta el resaltado | Usar el evento `boundary` de `speechSynthesis` para resaltar la palabra que se lee.                                                      | A (interfaz)         |
| RF-16 y 1.4.13: glosario emergente dentro del texto                   | El glosario se muestra como lista `<dl>` en el detalle del material    | Marcar los términos en el texto con un botón que abra un popover descartable con Escape y que no se cierre al mover el puntero hacia él. | A + B                |
| RF-06, RF-14: reportar una palabra mal transcrita y buzón del docente | No existe                                                              | Reutilizar `PUT /api/transcripts/:id` y añadir `POST /api/reports`; conservar el fragmento seleccionado (3.3.7).                         | B (API) + A          |
| RF-09: subir PDF/PPT de hasta 20 MB                                   | No existe                                                              | Reutilizar la zona de carga de `AltTextPanel` (botón + arrastrar, 2.5.7) con validación de tipo y tamaño.                                | B                    |
| RF-20: tarjetas de repaso                                             | No existe                                                              | Endpoint `/api/ai/flashcards` con el mismo patrón de salida estructurada y revisión docente.                                             | B                    |
| RF-05: notas en PDF accesible                                         | Solo hay TXT y VTT                                                     | Generar un PDF etiquetado desde el resumen aprobado o, como mínimo, una versión HTML imprimible.                                         | B                    |
| Cuentas y roles (docente/estudiante)                                  | No hay autenticación: cualquiera puede publicar adaptaciones           | Antes de un piloto real, proteger `PUT /api/materials/*` y `/api/transcripts` con un rol de docente.                                     | Equipo               |

## 5. Otras mejoras propuestas (sin cambios de código)

1. **Zoom al 200 % y reajuste a 320 px (1.4.4, 1.4.10):** el tamaño interno de texto llega solo al 125 %. Conviene añadir una prueba en navegador (por ejemplo con Playwright) que use zoom al 200 % y ancho de 320 px y compruebe que no hay desplazamiento horizontal. La revisión visual de esta entrega no encontró desbordes después de C5.
2. **Pruebas automáticas con axe:** añadir `vitest-axe` o `@axe-core/playwright` para detectar regresiones de nombres, roles y contraste en cada vista.
3. **`<footer>` dentro de `<main>`** (`src/App.jsx:288`): así no se expone como landmark _contentinfo_. Moverlo fuera de `<main>`.
4. **Título fijo del diálogo** (`src/components/Modal.jsx:45`): todos los diálogos muestran «TU ESPACIO, A TU MANERA», también el de un material. Pasarlo como propiedad.
5. **Aviso visual de 3,5 s** (`src/App.jsx:84`): el lector de pantalla lo recibe por la región de estado, pero el aviso visual desaparece a los 3,5 s, poco tiempo para usuarios con baja visión o lectura lenta (2.2.1 como buena práctica). Mantenerlo hasta que se cierre o alargarlo.
6. **Dividir `App.jsx`** (unas 390 líneas): separar la biblioteca y los modales en componentes propios. Facilitará la vista de clase y el modo lectura.
7. **Dependencias:** `npm audit` informa de 8 vulnerabilidades (3 moderadas, 5 altas), todas en dependencias de desarrollo (`picomatch`, `minimatch`). En producción hay 0. `npm audit fix` sin `--force` resuelve la mayoría; el resto depende de versiones nuevas de las herramientas.
8. **Pictogramas en tema oscuro:** las tarjetas de pictogramas mantienen fondo blanco porque los pictogramas de ARASAAC están dibujados sobre blanco. Validar con usuarios de U3 si en tema oscuro resulta deslumbrante.

## 6. Decisiones de accesibilidad en las funciones del integrante B

- **Revisión docente obligatoria:** toda salida de IA lleva el aviso «Sugerencia de IA · revisa y edita antes de publicar» con texto e icono (1.4.1). Es editable y solo llega a los estudiantes tras una confirmación explícita (3.3.4). La API pública devuelve únicamente lo aprobado (RF-12, RF-13).
- **Subtítulos en directo:** el texto parcial se muestra, pero la región de subtítulos tiene `aria-live="off"` por defecto para no tapar el audio de la clase. El estudiante puede activar la lectura (F3, 4.1.3). Hay «Pausar desplazamiento / Volver al directo» (2.2.2) y un campo para añadir frases a mano si el navegador no admite reconocimiento de voz (Firefox).
- **Errores:** cada error dice qué campo falló y cómo corregirlo, en texto y con `role="alert"`: formato no admitido, límite de 5 MB o texto muy corto (3.3.1, 3.3.3). La carga de imágenes acepta tanto botón como arrastre (2.5.7).
- **Pictogramas:** la palabra se muestra siempre debajo del pictograma, por eso la imagen lleva `alt=""` y no se lee dos veces. Se muestra la atribución de ARASAAC que exige su licencia.
- **Lenguaje claro:** el original y la versión simplificada se muestran lado a lado, con «Volver al original» (RF-21, 3.1.5).
