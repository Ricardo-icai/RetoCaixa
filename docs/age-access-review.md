# Edad de acceso · revisión 2026-09-16

No existe una edad única que prohíba toda inversión de menores a escala mundial. Deben distinguirse titularidad de activos, contratación autónoma, capacidad y emancipación, representación de padres/tutores, producto e intermediario. Tampoco debe confundirse edad para consentir tratamiento de datos con capacidad para contratar productos financieros.

España: el Código Civil, arts. 240 y 246, establece mayoría de edad a los 18 y capacidad civil general con excepciones. Los arts. 162, 164 y 166 regulan representación y administración/disposición de bienes de menores; el art. 247 contempla límites para emancipados. No se deduce una prohibición absoluta de que un menor sea inversor. Fuente: https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763

Reino Unido: Junior ISA admite menores de 18, incluidas inversiones en acciones y participaciones, con reglas de apertura, gestión y retirada. Fuente: https://www.gov.uk/junior-individual-savings-accounts

Estados Unidos: la SEC describe cuentas de inversión para adolescentes y la participación de sus padres. Fuente: https://www.investor.gov/taking-stock-teen-trading

Estas referencias ilustran diferencias; no se ha auditado cada país. La demo sigue sin ofrecer contratación financiera real ni cuentas tuteladas. Se conserva su umbral de 18 años como política actual de acceso, no como obligación mundial ni como acreditación de elegibilidad para operar. Habilitar menores o inversión real requiere un análisis específico por mercado y producto y un flujo adecuado de representación/protección.

## Cambio implementado

Se sustituye la casilla de mayoría de edad por un único campo de fecha de nacimiento con calendario nativo. Cliente y servidor validan fechas de calendario y edad por años cumplidos, sin aproximaciones por días/365. El servidor determina la fecha civil en Europe/Madrid; el 29 de febrero cumple el umbral el 1 de marzo en años no bisiestos por política de demo, no como interpretación jurídica universal. La validación del servidor no confía en una edad o booleano enviados por el cliente.

La fecha completa solo se usa en la petición de alta: no se incorpora al perfil, al recibo ni a publicaciones. Se registra únicamente umbral superado, método declarativo y fecha de comprobación. No se añade un tercero ni tratamiento biométrico. La base jurídica de producción y las garantías efectivas de edad siguen pendientes conforme al inventario legal general.

Términos y privacidad pasan a versión 2026-09-16.2; las versiones anteriores permanecen archivadas. Los riesgos no cambian. Las aceptaciones antiguas requieren renovación. Se mantienen las casillas contractuales y de lectura, que no son casillas de edad.

Verificación: fechas inválidas/futuras, cumpleaños exacto, día anterior, bisiestos, cambio de fecha por zona horaria y rechazo de intentos de eludir el calendario en el servidor.
