# Revisión legal de cambios

Para cada nueva función o cambio que afecte a usuarios, datos, países o actividad financiera:

- Revisar `docs/legal-release-review.md` y el comportamiento real antes de modificar avisos legales.
- Documentar el alcance territorial y la aplicabilidad. No afirmar cumplimiento universal, certificaciones o licencias sin evidencia verificable.
- Mantener como pendientes los requisitos no implementados. Las reglas de riesgo y el KYC simulado no acreditan cumplimiento MiFID II, AML o MiCA.
- No activar operaciones financieras reales, biometría, publicidad comportamental ni un nuevo mercado basándose solo en estos textos: requieren una evaluación jurídica y operativa específica y controles verificables.
- Separar aceptación contractual y lectura de privacidad de consentimientos opcionales; nunca premarcarlos.
- Si cambian los documentos aceptados, conservar una copia inmutable de la versión anterior en `docs/legal-archive/`, actualizar sus versiones y probar rechazo de versiones antiguas y de aceptación ausente en el servidor.
- En la entrega indicar controles comprobados y pendientes. Estas instrucciones de desarrollo no sustituyen una revisión jurídica ni constituyen un bloqueo técnico de despliegue.
