# Guía para sesiones de usabilidad de IncluAula IA

Esta guía sirve para conducir las sesiones y registrar observaciones. No contiene resultados ni reemplaza el informe final.

## Preparación

1. Inicia el prototipo con `npm run dev` y usa el modo demo para no depender de una clave de IA.
2. Prepara una transcripción aprobada y adaptaciones publicadas para una clase de prueba. Usa contenido ficticio.
3. Invita voluntariamente a personas que representen los perfiles U1, U2 y U3. Como referencia práctica, intenta incluir tres personas por perfil; si el grupo es menor, informa los resultados como exploratorios y no como una estimación representativa.
4. Pide consentimiento para tomar notas. No recolectes nombres, diagnósticos ni grabaciones identificables. Permite retirarse en cualquier momento.
5. Comprueba antes de cada sesión el dispositivo y tecnología de apoyo que la persona desea usar. Para una tarea de lector de pantalla, no sustituyas su configuración habitual sin preguntarle.

## Guion de apertura

> Estamos evaluando la interfaz, no tus habilidades. Te pediré que realices unas tareas y que cuentes lo que esperas encontrar. No te indicaré dónde hacer clic salvo que quieras detener la sesión. Puedes omitir una tarea o terminar cuando quieras.

Pide pensar en voz alta, sin insistir si resulta incómodo. Inicia el cronómetro al terminar de leer cada consigna. No confirmes si una acción fue correcta: observa si la persona reconoce por sí misma el resultado.

## Tareas que se pueden probar en la versión actual

Entrega una consigna a la vez y deja que la persona elija el método de entrada.

| Perfil | Consigna para la persona                                                                      | Ruta de inicio                                                             |      Límite F2 |
| ------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------: |
| U1     | «Activa la lectura en voz alta, ajusta la velocidad y pausa el texto.»                        | Preferencias → lectura en voz alta; selecciona texto antes de pulsar Leer. |  45 s, 4 pasos |
| U1     | «Abre un material y vuelve al inicio usando solo el teclado.»                                 | Inicio, con ratón apartado.                                                |  90 s, 6 pasos |
| U1     | «Cambia el tamaño del texto y el contraste, recarga la página y comprueba si se conservaron.» | Preferencias de accesibilidad.                                             |  45 s, 5 pasos |
| U1     | «Descarga la transcripción de la clase y localiza el archivo.»                                | Vista de clase, con una transcripción aprobada preparada.                  |  45 s, 3 pasos |
| U2     | «Inicia la captura de voz, comprueba que está activa y deténla.»                              | Herramientas IA; autorización de micrófono disponible.                     |  45 s, 3 pasos |
| U2     | «Busca un término equivocado en la transcripción, corrígelo y aprueba el resultado.»          | Herramientas IA, transcripción preparada.                                  | 120 s, 4 pasos |
| U2     | «Revisa el resumen y el glosario, edita un término y publica los cambios.»                    | Herramientas IA, texto de clase preparado.                                 | 180 s, 6 pasos |
| U3     | «Encuentra la definición de “ecosistema”, léela y cierra la definición sin perder tu lugar.»  | Vista de clase, glosario publicado.                                        |  30 s, 2 pasos |
| U3     | «Activa los pictogramas e identifica qué palabra representa uno.»                             | Vista de clase, pictogramas publicados.                                    |  30 s, 2 pasos |
| U3     | «Inicia la lectura guiada, observa el resaltado y pausa y reanuda la voz.»                    | Vista de clase o inicio; voz española disponible.                          |  45 s, 3 pasos |
| U3     | «Activa el modo lectura y luego encuentra cómo salir.»                                        | Inicio → Preferencias.                                                     |  30 s, 2 pasos |

Las tareas de carga PDF/PPT, buzón de reportes, flashcards y reporte estudiantil de errores no se deben probar todavía: no están implementadas en esta versión. No marques una tarea como completada si se entregó ayuda del moderador.

## Registro por tarea

Anota un código anónimo para participante y tarea; no escribas información personal.

| Campo             | Qué registrar                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| Resultado         | Completó / completó con ayuda / abandonó                                               |
| Primer intento    | Sí / no; cuenta como no si reinicia el flujo                                           |
| Tiempo            | Segundos desde el fin de la consigna hasta que reconoce el resultado                   |
| Pasos funcionales | Abrir, seleccionar, completar o confirmar; no cuentes cada tecla ni avance de foco     |
| Desvíos           | Rutas o acciones innecesarias antes del resultado                                      |
| Errores críticos  | Bloqueo, pérdida de cambios o resultado incorrecto grave; describe el impacto          |
| Escala 1–5        | Satisfacción, facilidad percibida y confianza; 1 = muy baja, 5 = muy alta              |
| Observación       | Duda, etiqueta confusa, barrera de teclado/lector o comentario literal breve y anónimo |

## Criterios de aceptación de F2

Calcula por tarea y perfil, no solo un promedio global:

- Éxito ≥ 80 %; primer intento ≥ 75 %; abandono ≤ 10 %; ayuda externa ≤ 20 %.
- Cero errores críticos; al menos 80 % termina dentro de los límites de tiempo y pasos de la matriz F2.
- Máximo dos desvíos por ejecución; satisfacción, facilidad y confianza con promedio ≥ 4/5.

Con una muestra pequeña, presenta los conteos junto a los porcentajes (por ejemplo, «2 de 3») para no exagerar la precisión.

## Cierre

Pregunta: «¿Qué fue lo más difícil?», «¿Qué esperabas que pasara?» y «¿Qué cambiarías primero?». Agradece y detén la captura de notas. Conserva los apuntes anonimizados para el informe posterior.
