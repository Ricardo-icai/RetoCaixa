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

## Alcance

Los documentos originales están en docs/. El esquema preparado para PostgreSQL está en `packages/database/prisma/schema.prisma`, pero la demo web todavía usa memoria del servidor: no hay autenticación ni persistencia conectada. Tampoco hay conexión bancaria, feeds de mercado reales o proveedor de IA externo. La verificación documental es solo una transición simulada de estado; no acredita identidades reales. Las publicaciones iniciales y todos los canales están marcados como ejemplos, sin atribuir movimientos ni consejos a inversores reales. Una red pública necesitaría conectar Prisma, un proveedor KYC autorizado, verificación de creadores, moderación, avisos y controles regulatorios. El chat usa un intérprete local limitado y una orquestación determinista; la voz depende del navegador. Los límites del motor son ilustrativos y no constituyen una evaluación completa de idoneidad.
