# Consolidación de navegación · 2026-09-16

Se aplica la propuesta `gemini-code-1789582877037.md` a las cuatro pantallas existentes: Feed (`/community`), Invertir (`/simulator`), Aprender con KAI (`/chat`) y Red (`/channels`, incluidos sus detalles).

El estado `activeTab` usa el tipo `FEED | TRADE | LEARN | NETWORK`, derivado de la ruta en `AppShell`. La ruta es la fuente única de estado para soportar enlaces directos, recarga, historial y gestos. No se duplican pantallas ni se añaden placeholders. `_app.tsx` aloja el contenedor compartido; `index.tsx` conserva la entrada por onboarding y usa la ruta del primer tab del catálogo compartido.

El contenedor es móvil con ancho máximo de 448 px y se amplía en escritorio para conservar las vistas existentes. Se mantiene el scroll del documento para que formularios y textos legales largos sean accesibles. La barra fija reserva 96 px más el área segura inferior. Ajustes está en el encabezado compartido, fuera de las cuatro pestañas principales. El tutorial utiliza los nuevos nombres.

Los cuatro PNG de `apps/web/public/icons/` se generaron con la herramienta integrada `image_gen`, se inspeccionaron y optimizaron a 128 px conservando alpha. Los prompts exactos están en `navigation-icons-prompts.json`.

## Revisión del cambio

Finalidad: presentación y navegación. No se incorporan países, tratamientos de datos, destinatarios, proveedores en ejecución ni actividades financieras. La generación de iconos es una herramienta de desarrollo, no una integración que reciba datos de usuarios. Se mantienen los límites de la demo, el registro y los documentos legales existentes sin cambios de versión. La revisión jurídica general sigue pendiente según `legal-release-review.md`.

Accesibilidad: enlaces reales, destino etiquetado, indicador `aria-current`, iconos decorativos sin texto duplicado, foco visible, soporte para movimiento reducido y área segura inferior. Esto no acredita conformidad integral de accesibilidad.

Validación: TypeScript, compilación Next.js, pruebas existentes y comprobación de rutas y recursos generados. No se ha realizado una auditoría visual interactiva en navegador.
