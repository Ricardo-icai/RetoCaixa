# KAI — Investment Copilot Demo

Demo ejecutable de los fragmentos adjuntos, con Next.js, React, TypeScript y Tailwind.

## Ejecutar

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:3000, que lleva a `/community`. Los visitantes pueden publicar debates y microlecciones, responder y marcar contenido útil. `/channels` muestra perfiles ficticios de ejemplo con movimientos simulados y consejos educativos gratuitos; seguir un canal reúne sus publicaciones en el filtro «Siguiendo». `/simulator` conserva los controles de inversión y protección; la inversión requiere confirmación y solo actualiza el saldo simulado de la página. `/chat` ofrece una conversación guiada con perfil y aportaciones simuladas en memoria del servidor.

## Verificar

```sh
npm run build
npm --prefix apps/web run typecheck
node --experimental-strip-types --test tests/*.test.mjs
```

## Alcance

Los documentos originales están en docs/. Esta demo no implementa todavía la especificación completa. No hay conexión bancaria, feeds de mercado reales, proveedor de IA externo, autenticación ni persistencia. El chat usa un intérprete local limitado y una orquestación determinista; las funciones de voz dependen de las API y los permisos del navegador. Las publicaciones iniciales de la comunidad y todos los canales están marcados como ejemplos. No se atribuyen movimientos ni consejos a inversores reales. Las publicaciones y suscripciones de visitantes se guardan en la memoria del servidor y desaparecen al reiniciarlo; no hay cuentas, verificación de creadores, avisos externos ni moderación. No se debe desplegar la comunidad como red pública sin esos controles y almacenamiento persistente. Las noticias son ejemplos y están etiquetadas. Los límites del motor son ilustrativos y no constituyen una evaluación completa de idoneidad. El coste mostrado es un ejemplo, no una tarifa real.
