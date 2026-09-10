# KAI — Investment Copilot Demo

Demo ejecutable de los fragmentos adjuntos, con Next.js, React, TypeScript y Tailwind.

## Ejecutar

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:3000. Los controles permiten probar los estados de inversión y protección. La inversión requiere confirmación y solo actualiza el saldo simulado de la sesión; recargar reinicia los datos.

## Verificar

```sh
npm run build
npm --prefix apps/web run typecheck
node --experimental-strip-types --test tests/decision-engine.test.mjs
```

## Alcance

Los documentos originales están en docs/. Esta demo ensambla los archivos entregados; no implementa todavía la especificación completa. No hay conexión bancaria, feeds de mercado reales, voz, orquestación de agentes, autenticación ni persistencia. Las noticias son ejemplos y están etiquetadas. Los límites del motor son ilustrativos y no constituyen una evaluación completa de idoneidad. El coste mostrado es un ejemplo, no una tarifa real.
