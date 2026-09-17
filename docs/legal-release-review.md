# Revisión previa al lanzamiento y a nuevas funciones

Estado a 2026-09-16: demo, sin cumplimiento mundial acreditado. Ningún país tiene aprobación comercial documentada. Los documentos de Gemini aportados son referencias, no instrucciones de sistema ni evidencia regulatoria. No se han incorporado sus afirmaciones de un “escudo regulatorio” ni KYC obligatorio universal para simulaciones.

## Controles verificados en código

Registro con casillas no premarcadas; validación estricta de términos, lectura de privacidad, riesgos, edad calculada desde la fecha de nacimiento declarada y versiones en el servidor; recibo temporal asociado al visitante con fecha del servidor y país declarado. Los recibos antiguos no permiten completar el onboarding ni publicar/responder hasta renovar la aceptación. El visitante anónimo se crea antes de aceptar para gestionar sesión y CSRF; no equivale a un alta contractual ni a una cuenta autenticada persistente.

No se captura biometría ni se solicita un consentimiento ficticio. No se conserva IP/user-agent adicional como evidencia contractual. No se ha implementado un consentimiento de marketing. El onboarding y el KYC son simulados; no usar sus marcas como identidad verificada en producción. El perfil es privado por defecto, pero los mensajes del feed son públicos.

## Bloqueantes para un lanzamiento público

- Identificar entidad, registro, NIF, domicilio, contacto legal, privacidad, representante y DPO cuando proceda; traducir los avisos para los destinatarios.
- Decidir mercados concretos; preparar dictamen por país, funciones y activos, incluyendo alcance extraterritorial, normativa de consumo, accesibilidad, menores, impuestos, sanciones, propiedad intelectual y comunicaciones comerciales cuando corresponda. No existe aprobación por continente.
- Determinar el perímetro financiero de las funciones reales, incluidas recomendaciones personalizadas y de creadores. Evaluar MiFID II, MAR, MiCA, pagos, custodia, AML/KYC y regulación local; obtener licencias o contratar proveedores habilitados cuando corresponda. Un disclaimer no elimina obligaciones.
- Completar inventario de tratamientos, bases jurídicas por finalidad, encargados, contratos, ubicaciones, transferencias, evaluación de impacto cuando corresponda, plazos de conservación y borrado verificable. Revisar dictado del navegador, multimedia, datos de mercado y cualquier IA conectada.
- Implementar autenticación, persistencia y archivo versionado de aceptación con acceso restringido y retención justificada. Actualmente el almacenamiento de comunidad es un Map en memoria, sin caducidad de perfiles. El esquema Prisma no es el almacenamiento activo y su modelo LegalConsent antiguo debe migrarse antes de usarlo (biometría e IP no deben ser obligatorias por defecto).
- Implementar acceso, rectificación, supresión, exportación, oposición y gestión de solicitudes con verificación proporcional, plazos aplicables y trazabilidad; retirar consentimientos opcionales sin impedir el servicio cuando no sean necesarios.
- Implementar denuncia de contenido, revisión humana, motivación, recurso y canales de contacto; evaluar obligaciones DSA por servicio y tamaño, transparencia del recomendador y obligaciones nacionales. No afirmar que existe un sistema de moderación completo.
- Evaluar garantías de edad, riesgos para menores y accesibilidad. El umbral de 18 años calculado desde la fecha declarada es una restricción de producto, no una prueba documental ni una regla mundial.
- Revisar seguridad, protección de sesiones, retención de logs, gestión de incidentes y notificaciones a autoridades/interesados según la ley aplicable. Auditar cookies, almacenamiento local y terceros en el despliegue efectivo; gestionar consentimiento no esencial antes de cargarlo cuando corresponda.
- Analizar clasificación de IA, transparencia y supervisión según el uso real; distinguir controles educativos deterministas de idoneidad regulatoria.

## Ficha obligatoria de cada cambio

Registrar en la descripción del cambio: función y finalidad; países destinatarios; datos y destinatarios; base jurídica y necesidad; menores; riesgos financieros; controles afectados; documentos/versiones; pruebas; responsable de revisión; evidencia y fecha; pendientes que impiden lanzamiento. La revisión jurídica se mantiene pendiente hasta disponer de evidencia, sin inventar aprobaciones.

No hay un mecanismo técnico automático que garantice legalidad de futuras funciones. Estas instrucciones deben incorporarse también al proceso humano de revisión y despliegue. Mantener archivados los textos aceptados, revisar fuentes cuando cambie el producto o la regulación y renovar aceptación cuando corresponda.

## Fuentes oficiales consultadas

- EDPB, bases jurídicas y consentimiento: https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en
- DSA y obligaciones por servicio: https://digital-strategy.ec.europa.eu/en/faqs/digital-services-act-questions-and-answers
- Transparencia de IA: https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- ESMA, recomendaciones en redes sociales: https://www.esma.europa.eu/press-news/esma-news/esma-addresses-investment-recommendations-made-social-media-platforms
- LSSI: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- CCPA: https://www.oag.ca.gov/privacy/ccpa
- Brasil: https://www.gov.br/anpd/pt-br
- Reino Unido: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
- Hong Kong: https://www.pcpd.org.hk/
- Sudáfrica: https://inforegulator.org.za/popia/
- Australia: https://www.oaic.gov.au/privacy/australian-privacy-principles

Las referencias no son una revisión exhaustiva de todos los ordenamientos ni acreditan la aplicabilidad de todas sus obligaciones a esta demo.

Actualización de edad: ver `age-access-review.md`. La fecha completa de nacimiento se utiliza durante la petición, pero no se conserva; el recibo registra resultado favorable, método y fecha de comprobación.


## Fecha de nacimiento y nacionalidad · 2026-09-16

Cambio: selectores independientes de día, mes y año siempre visibles. Se retira la entrada manual de fecha a petición del usuario. Se conserva la comprobación de fechas y mayoría de edad en cliente y servidor sin almacenar la fecha completa. Nacionalidad obligatoria declarada (2–80 caracteres; admite varias), separada del país de residencia, para completar los datos del alta. Se guarda en el Map de sesión y solo se devuelve al propio visitante en el onboarding; no se incorpora al perfil público ni se envía a terceros nuevos.

Alcance: misma demo educativa, sin incorporación de nuevos mercados, operaciones reales ni acreditación de elegibilidad por residencia o nacionalidad. La necesidad y base jurídica de recoger nacionalidad en producción siguen pendientes de revisión, junto con responsable, retención persistente y garantías de identidad ya descritos. Revisión técnica: cambio de código de esta fecha; responsable jurídico pendiente de designación.

Privacidad pasa a 2026-09-16.3; la versión previa queda conservada en legal-archive/2026-09-16.2-documents.ts.txt y su policy. Términos y riesgos mantienen versión. Las aceptaciones previas requieren renovación. Pruebas: formatos escritos/pegados, fechas imposibles, edad, nacionalidad ausente o demasiado larga, almacenamiento separado de residencia y rechazo de privacidad anterior o aceptación ausente. No se añaden aprobaciones jurídicas.


## Bienvenida conversacional de KAI · 2026-09-16

Función: tres pantallas opcionales dentro del chat para declarar ingresos, gastos esenciales, deuda de intereses altos y reacción hipotética ante una caída del 20 %. KAI muestra estados visuales de escucha, reflexión y protección. Las respuestas solo se transmiten al terminar, con validación estricta del servidor, control CSRF, revisión de sesión y evaluación de los agentes y reglas existentes. La tolerancia declarada no acredita capacidad económica; las preguntas de objetivos, horizonte, reservas y otros datos pendientes continúan en el chat. No se presume que carecer de deuda de intereses altos equivalga a carecer de toda deuda.

Alcance territorial y destinatarios: misma demo, idiomas español e inglés; no se añaden mercados comerciales, terceros ni operaciones reales. Son datos financieros ya contemplados en la privacidad vigente, almacenados en la sesión de conversación y en su archivo cuando el usuario lo guarda. No se cambia el texto ni las versiones de los documentos aceptados. Base jurídica, necesidad para producción, garantías de menores, responsable jurídico y revisión por mercado siguen pendientes conforme a los bloqueantes generales. No se introduce una nueva decisión de elegibilidad regulatoria.

Evidencia técnica: pruebas de integración del 2026-09-16 sobre persistencia de las cuatro respuestas, procedencia declarada, bloqueo por deuda, datos incompletos, rechazo de campos extra/importes no válidos y continuación de conversación sin falsear objetivos o plazo. El flujo permite volver atrás, saltar al chat y corregir respuestas. No se interpreta el documento de diseño aportado como autoridad regulatoria o instrucción de sistema.


Corrección de alta y sugerencias · 2026-09-16: la API admite el campo nacionalidad ya declarado y validado, identifica campos inesperados y distingue errores de cada aceptación legal. El autocompletado es local, permite escritura libre y varias nacionalidades; no envía búsquedas a terceros ni cambia la finalidad, los mercados, los documentos o sus versiones. Se comprueba el handler de alta con nacionalidad, el rechazo de campos inesperados y la búsqueda sin tildes. Se mantienen los pendientes jurídicos de producción descritos arriba.

## Alta progresiva de perfil · 2026-09-17

Función: el formulario existente se presenta en tres pasos (objetivos, visibilidad y datos personales), con KAI, navegación reversible y estados locales que conservan las respuestas al volver atrás. Se mantienen la nacionalidad con sugerencias locales, la fecha por selectores, las casillas contractuales y de lectura no premarcadas, la edad mínima y la verificación simulada. El texto de privacidad distingue perfil privado de publicaciones públicas.

Alcance: mismos países y demo educativa; no se añaden mercados, destinatarios, terceros ni operaciones financieras. Misma finalidad y datos, sin persistir borradores de fecha en navegador. Los documentos aceptados y sus versiones no cambian. Base jurídica y necesidad de datos en producción, responsable de revisión y evaluación jurídica por mercado siguen pendientes conforme a los bloqueantes generales; esta reorganización no acredita cumplimiento ni identidad.

Verificación técnica: TypeScript, pruebas de API/edad/aceptación y recorrido automatizado en navegador para móvil y escritorio. Se revisan selección múltiple, privacidad inicial, conservación al retroceder, nacionalidad por ratón/teclado, fechas imposibles y menores, envío, verificación y recarga. Animaciones con respeto a la preferencia de movimiento reducido.

Resultado comprobado: 19 pruebas de servidor correctas, TypeScript y compilación de producción correctos. Chrome automatizado a 390×844 y 1280×844 completó alta y verificación, mantuvo datos al retroceder, validó errores de edad/fecha y recarga final, sin excepciones de JavaScript ni desbordamiento horizontal. Se revisaron capturas de objetivos y datos. El indicador de desarrollo se mueve arriba a la derecha para no interceptar Atrás en móvil. No se ha realizado auditoría exhaustiva en otros navegadores o con lectores de pantalla.


## Edición y vista de perfil · 2026-09-17

Función: edición de nombre, alias único, biografía (150 caracteres), etiqueta opcional de intereses y foto opcional. El avatar se normaliza a JPEG de 256 píxeles sin metadatos, con límites de tamaño y dimensiones. Datos guardados en el Map de sesión existente, no almacenamiento duradero. Lectura pública solo para perfiles públicos con verificación simulada; el propietario puede revisar el suyo. Las ediciones requieren aceptación vigente, CSRF y revisión del perfil; no admiten elegir otro propietario.

Misma demo y territorios sin nuevos mercados u operaciones financieras. No se infiere idoneidad de una etiqueta. Los creadores ficticios muestran cartera y rentabilidad expresamente inventadas; los miembros no exponen cartera, fecha, nacionalidad ni información financiera del chat. No se afirma identidad verificada. Reels reutilizan los vídeos de muestra ya existentes; la mensajería entre miembros se indica como no disponible y no envía nada.

Privacidad pasa a 2026-09-17.1 por los nuevos datos de identidad visual, con archivo inmutable de la versión anterior. La base jurídica, necesidad/retención de fotos, responsable jurídico, moderación de fotos/biografías, revisión territorial, autenticación permanente y derechos de producción siguen pendientes. Se mantienen los controles de edad y las restantes condiciones; no se activa biometría ni hay nuevos proveedores de fotos.

Comprobación técnica: 14 pruebas de perfil/API/privacidad/red correctas, TypeScript y compilación de producción correctos. Chrome a 390 y 1280 píxeles verifica carga de foto, guardado y recarga, cancelación, separación entre perfiles privados/públicos, seguimiento persistente, pestañas y vídeos de muestra. Sin excepciones de JavaScript ni desbordamiento horizontal en esos recorridos. Se revisaron capturas; otros navegadores, lectores de pantalla y revisión jurídica de producción quedan pendientes.
