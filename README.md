# IncluAula IA — Interfaz del integrante A

Frontend en React, Framer Motion y Lucide React. Requiere Node.js 22.13 o posterior compatible (también Node.js 24). Ejecutar `npm install` y `npm run dev`, que levanta el frontend y el servidor de IA del integrante B (ver [Integrante B](#integrante-b--multimedia-e-ia)). Para generar la versión de publicación: `npm run build`. Vite produce `dist/`.

## Alcance

- Sistema de diseño con tokens semánticos en `src/styles.css`: colores, tipografías, espaciado, radios, foco y superficies.
- Temas claro, oscuro y alto contraste; texto al 100 %, 112 %, 125 % y 150 %; espaciado de lectura; reducción de movimiento y modo concentración.
- Layout adaptable, navegación, biblioteca de muestra, búsqueda, filtros y favoritos locales.
- Panel modal de preferencias con controles nativos, foco contenido en el panel, cierre con Escape y restauración del foco.
- Enlace para saltar al contenido, regiones semánticas, nombres de controles, estados de selección y avisos para lectores de pantalla.
- Preferencias persistentes en localStorage. Si el navegador bloquea el almacenamiento, los controles siguen funcionando durante la visita y se muestra un aviso.
- Animaciones con Framer Motion; se respeta `prefers-reduced-motion` y la preferencia interna. Iconos de Lucide React.
- Rutas `#/inicio`, `#/biblioteca` y `#/guardados` compatibles con enlaces directos y con Atrás/Adelante del navegador.
- Tipografía mínima de 0.75 rem (12 px al tamaño normal); bordes interactivos independientes de los separadores decorativos.
- Menú de accesibilidad ampliado: color suave o en grises, texto al 150 %, letra más legible, guía de lectura, modo lectura con salida visible, lectura en voz alta con velocidad, subtítulos grandes, pictogramas por defecto, foco más visible, enlaces subrayados y cursor grande (ver `AUDITORIA.md`, sección 3).

## Límites de integración

Las tarjetas son ejemplos, no lecciones implementadas. Los endpoints de IA, la transcripción, el VTT, los resúmenes, el lenguaje claro, el alt-text y ARASAAC los implementa el integrante B (sección siguiente). La lectura en voz alta usa la síntesis de voz del navegador y resalta palabras cuando el navegador lo admite. La vista de clase muestra transcripciones aprobadas y adaptaciones publicadas para los materiales de ejemplo. El prototipo Figma y las pruebas con participantes requieren una sesión externa; el informe y la presentación se preparan después de validar el funcionamiento.

Los datos de muestra están en `src/data/materials.js`. El panel de detalle muestra solo metadatos. Se puede conectar después con los contenidos y rutas que implementen los demás integrantes. No hay backend ni llamadas a servicios de IA.

## Componentes

`src/main.jsx` monta la aplicación. `App` coordina el layout y los estados. `Layout` reúne la navegación y la cabecera. `HomeIntro` presenta el inicio. `MaterialCard` presenta una tarjeta. `Preferences` reúne preferencias. `Switch` asocia nombre y descripción. `Modal` usa el elemento nativo `dialog`. `IconButton` exige una etiqueta accesible. `icons.jsx` oculta los iconos decorativos del árbol accesible. `useNavigation` sincroniza la vista con la URL. Las funciones de validación y lectura de preferencias están en `src/preferences.js`.

Framer Motion usa `LazyMotion` y carga sus funciones de animación en un archivo separado.

## Tokens y estados

Los temas redefinen las variables `--bg`, `--surface`, `--surface-soft`, `--text`, `--muted`, `--border`, `--primary`, `--primary-hover`, `--on-primary`, `--accent` y `--focus` sin cambiar los componentes. Los atributos `data-theme`, `data-spacing`, `data-motion` y `data-focus` del elemento raíz reflejan las preferencias. `--font-scale` escala la tipografía en rem.

La paleta de referencia Blue Hour usa `#111522`, `#1E263B`, `#303D59`, `#536684`, `#98A9C4` y `#DCE3EF`. El tema claro combina superficies azul hielo con texto azul profundo; el oscuro invierte esa relación. Alto contraste usa azul hielo sobre azul noche y refuerza los bordes. Los tonos intermedios se asignan a bordes, superficies e ilustraciones según el contraste de cada combinación. Las superficies más claras son variantes de la misma paleta.

La tipografía usa fuentes del sistema; no hace solicitudes a Google Fonts. Favoritos y preferencias se almacenan solo en el navegador actual; no representan cuentas ni progreso académico real.

## Comprobaciones del frontend

`npm run check` ejecuta lint, las pruebas de regresión del frontend y del servidor, y la compilación. `npm run format:check` comprueba el formato. Las pruebas cubren nombres accesibles, iconos decorativos, guardados, descripciones de interruptores, persistencia, rutas y búsqueda sin tildes. Las pruebas de paleta leen los tokens reales de CSS y verifican texto y botones a 4.5:1 o más, texto a 7:1 o más en alto contraste, y bordes de controles y foco a 3:1 o más. La configuración de GitHub Actions ejecuta esas mismas comprobaciones cuando el repositorio se aloja en GitHub.

`npm run audit:axe` comprueba las vistas de inicio, biblioteca, herramientas y clase, incluido el diálogo de preferencias y el glosario desplegable. jsdom no evalúa contraste visual; la paleta tiene pruebas separadas y Lighthouse se ejecuta en un navegador real con `npm run audit:lighthouse -- http://localhost:5173/#/clase --only-categories=accessibility` mientras `npm run dev` está activo.

`npm run test:simulation` recorre con datos ficticios la consulta de transcripción aprobada y la apertura/cierre del glosario. Es una prueba funcional automatizada; no sustituye las sesiones con participantes reales ni genera sus métricas.

Esta implementación incluye mecanismos de accesibilidad, pero no constituye una certificación ni sustituye la evaluación asignada al integrante C.

## Integrante B — Multimedia e IA

Backend en `server/` (Node.js + Express 5) y vista «Herramientas IA» (`#/herramientas`) en `src/features/`. Toda salida de IA es un borrador editable: los estudiantes solo ven lo que el docente aprueba. La auditoría del frontend está en [`AUDITORIA.md`](AUDITORIA.md).

### Puesta en marcha

1. `npm install`
2. Opcional: `cp .env.example .env` y escribir `ANTHROPIC_API_KEY`. **Sin clave, el servidor funciona en modo demo** con respuestas de ejemplo, útil para probar los flujos y para las pruebas con usuarios sin costo. Con `AI_MODE=demo` se fuerza el modo demo aunque haya clave.
3. `npm run dev` levanta Vite y la API (puerto 8787). Vite redirige `/api` al servidor. Por separado: `npm run dev:web` y `npm run dev:server`.

La IA usa el SDK oficial de Anthropic (`@anthropic-ai/sdk`) con el modelo `claude-opus-5-5`, salidas estructuradas validadas con Zod y respaldo automático del servidor si el modelo rechaza una solicitud. La clave solo vive en el servidor y nunca llega al navegador. Los subtítulos en directo usan la Web Speech API del navegador (Chrome y Edge); en Firefox se pueden escribir las frases a mano.

### Endpoints

| Ruta                                     | Uso                                                        | RF           |
| ---------------------------------------- | ---------------------------------------------------------- | ------------ |
| `GET /api/health`                        | Modo activo: `claude` o `demo`                             | —            |
| `POST /api/ai/summary`                   | Resumen en lenguaje claro (≤ 150 palabras)                 | RF-12, RF-15 |
| `POST /api/ai/glossary`                  | Glosario con definición y ejemplo cotidiano                | RF-12, RF-16 |
| `POST /api/ai/plain-language`            | «Explicar más fácil», conservando el original              | RF-13, RF-21 |
| `POST /api/ai/alt-text`                  | Descripción de imagen o gráfico (PNG/JPG/WEBP/GIF, ≤ 5 MB) | RF-03, RF-11 |
| `GET /api/pictograms?text=`              | Pictogramas de ARASAAC por palabra, con atribución         | RF-17        |
| `POST/GET/PUT /api/transcripts[/:id]`    | Guardar, revisar y aprobar transcripciones                 | RF-01, RF-10 |
| `GET /api/transcripts/:id/vtt` · `/txt`  | Descarga de subtítulos WebVTT o texto                      | RF-05        |
| `GET/PUT /api/materials/:id/adaptations` | Borrador del docente (`?view=docente`) y versión publicada | RF-12, RF-13 |

Los errores responden `{ error: { code, message, field } }` con un mensaje en español que indica cómo corregir el problema. Los datos se guardan en `server/data/db.json`, ignorado por git. Es un almacenamiento de prototipo, sin cuentas ni roles.

### Pruebas

`npm test` incluye las pruebas del servidor (`server/test/`: VTT, validación, flujo de aprobación, cliente de IA simulado y ARASAAC simulado) y las de la vista de herramientas (`src/test/tools.test.jsx`). No hacen llamadas reales a la IA ni a ARASAAC.

Los pictogramas son de Sergio Palao, origen ARASAAC (https://arasaac.org), licencia CC BY-NC-SA, propiedad del Gobierno de Aragón (España).
