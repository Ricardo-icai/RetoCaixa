# KAI — Investment Copilot Demo

Demo ejecutable de los fragmentos adjuntos, con Next.js, React, TypeScript y Tailwind.

## Ejecutar

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:3000. El onboarding de `/verify-identity` recoge los objetivos del inversor, la visibilidad y los tres consentimientos, y simula el cambio KYC de `PENDING` a `VERIFIED` sin capturar documentos ni biometría. Después, `/community` prioriza el feed «Para ti» según esos objetivos. Los visitantes verificados pueden publicar debates y microlecciones, responder y marcar contenido útil. `/channels` muestra perfiles ficticios de ejemplo con movimientos simulados y consejos educativos gratuitos; seguir un canal reúne sus publicaciones en «Siguiendo». `/simulator` conserva los controles de inversión y protección, y `/chat` ofrece una conversación guiada con KAI.

## Verificar

```sh
npm run build
npm --prefix apps/web run typecheck
node --experimental-strip-types --test tests/*.test.mjs
DATABASE_URL='postgresql://user:password@localhost:5432/stoxia' npm --prefix packages/database run validate
```

## Feed conectado con KAI

«Para ti» selecciona hasta diez publicaciones: siete relacionadas con los intereses y necesidades de aprendizaje detectados durante el chat, y tres de otros temas. Por ejemplo, hablar de ETF da prioridad a fondos; una deuda costosa detectada por el perfil da prioridad a gestionar el dinero. Se combinan las preguntas recientes, los objetivos, la experiencia, la capacidad financiera y el riesgo evaluados por la orquestación existente. Las preguntas recientes pesan más que las antiguas; los objetivos del onboarding sirven como punto de partida. Sin contexto se muestra una selección variada.

La mezcla se calcula en el servidor a partir de la cookie de sesión, sin incluir mensajes ni importes del chat en la respuesta del feed. Se actualiza al entrar en la pantalla o al recuperar el foco. Cada publicación permite consultar por qué aparece. Guardar una conversación conserva su contexto educativo; resetear elimina el del chat activo; borrar una conversación guardada elimina su influencia. La memoria es temporal: caduca con la sesión después de 24 horas de inactividad y se pierde al reiniciar el servidor.

La proporción 70/30 es un objetivo sujeto al catálogo disponible: nunca se repiten publicaciones para completarla. Los filtros de temas y «Siguiendo» conservan el catálogo completo. La demo incluye 30 microlecciones adicionales para explorar la mezcla; actualmente son tarjetas de texto, sin vídeos ni un servicio de reels. La interpretación usa reglas locales y cinco temas educativos, no comprensión semántica general ni un modelo de recomendación entrenado.

## Alcance

Los documentos originales están en docs/. El esquema preparado para PostgreSQL está en `packages/database/prisma/schema.prisma`, pero la demo web todavía usa memoria del servidor: no hay autenticación ni persistencia conectada. Tampoco hay conexión bancaria, feeds de mercado reales o proveedor de IA externo. La verificación documental es solo una transición simulada de estado; no acredita identidades reales. Las publicaciones iniciales y todos los canales están marcados como ejemplos, sin atribuir movimientos ni consejos a inversores reales. Una red pública necesitaría conectar Prisma, un proveedor KYC autorizado, verificación de creadores, moderación, avisos y controles regulatorios. El chat usa un intérprete local limitado y una orquestación determinista; la voz depende del navegador. Los límites del motor son ilustrativos y no constituyen una evaluación completa de idoneidad.

### Historial de activos

Configura `TWELVE_DATA_API_KEY` en `apps/web/.env.local` (solo servidor) y reinicia Next.js para habilitar el historial. No uses un prefijo `NEXT_PUBLIC_` para la clave. Sin credenciales, el gráfico muestra un estado de desconexión y no inventa barras históricas.

`GET /api/market?action=history&symbol=AAPL&exchange=NASDAQ&currency=USD&period=1D` devuelve cierres históricos. Periodos admitidos: `1D` (5 minutos), `1W` (30 minutos), `1M` y `1Y` (diario). Las ventanas terminan en la última barra disponible. La interfaz consulta cada 60 segundos; la caché y agrupación de solicitudes son locales al proceso. La latencia, cobertura, cuotas y autorización de visualización dependen del contrato de Twelve Data; este flujo no es streaming tick a tick. Verificar suscripción y licencias antes de exposición pública. Los errores se muestran sin sustituir datos reales por simulaciones.
