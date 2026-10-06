# Plan de implementación — V1 Episodio/Consulta (giMedic) + deuda técnica

Fuente: [`contex/giMedic_V1_Episodio_Consulta.md`](../contex/giMedic_V1_Episodio_Consulta.md)

## 1. Alcance confirmado

- Solo episodios tipo **OUTPATIENT**: Historia clínica, Consulta actual, Evolución, Receta e
  indicaciones, Documentos, Resumen.
- **No se modifica** el código compartido de Emergencias/Hospitalización/Cirugía, aunque hoy
  viva en el mismo archivo (`encounters.service.ts`). Se extrae la lógica de consulta ambulatoria
  a un módulo propio, aplicando SOLID (SRP) para separar responsabilidades por tipo de episodio.
- Arquitectura de datos: migrar Historia clínica/Consulta actual/Evolución/Receta a **modelos
  Prisma estructurados nuevos** (dejan de depender del JSON libre `EncounterSectionRecord.formDataJson`
  como fuente de verdad). Documentos reutiliza la infraestructura ya existente
  `ClinicalDocument`/`DocumentVersion`/`DocumentType`.
- Catálogo CIE-10: el usuario importará un dataset oficial (CSV/JSON) vía seed.
- Catálogo de medicamentos: se crea desde cero (nombre, principio activo, presentación).
- "Finalizar" vs "Firmar": se renombra a **Finalizar/FINALIZED** y se elimina la semántica de
  firma para estos 5 tabs (el endpoint actual `.../records/:id/sign` exige password y marca
  `SIGNED`, lo cual es la "firma simulada" que el documento prohíbe mientras no exista FEA real).

## 2. Hallazgos de auditoría de código (deuda técnica a corregir)

| Hallazgo | Ubicación | Problema |
| --- | --- | --- |
| God-service | `src/encounters/application/services/encounters.service.ts` (~3500+ líneas) | Maneja OUTPATIENT+EMERGENCY+HOSPITALIZATION+SURGERY con decenas de `if` por tipo/tabKey; duplica escritura (JSON blob + tablas espejo vía `$executeRaw`); repite bloques de `auditLog.create` inline en cada rama. |
| God-component | `apps/web/src/features/episodes/components/EpisodeDetailPage.tsx` (~9000+ líneas) | Un solo componente renderiza los 4 tipos de episodio vía schema data-driven (`episode-profile-schema.ts`); difícil de testear/mantener. |
| Sin catálogos clínicos | `src/catalog/catalog.module.ts` (vacío) | No existe catálogo CIE-10 ni de medicamentos; todos los campos (`cie10`, `medicationName`, `dose`) son texto libre sin validación ni autocompletado. |
| Firma simulada | Endpoint `POST /encounters/:n/records/:id/sign` | Pide password y marca `EncounterRecordStatus.SIGNED` como si fuera FEA real — prohibido por la regla 0.1/0.10 del documento mientras no exista firma avanzada real. |
| Enum de auditoría incompleto | `AuditAction` (Prisma) | Falta FINALIZE, UPDATE_DRAFT, CREATE_VERSION, DOWNLOAD, MODIFY_FINALIZED_DENIED, CLOSE_EPISODE requeridos por la regla 0.5. |
| Infra reutilizable sin usar | `ClinicalDocument` + `DocumentVersion` (hash, status history, versión inmutable) y `Diagnosis`/`Allergy`/`Problem`/`MedicationStatement`/`VitalSign` | Ya implementan exactamente el patrón de versionado/snapshot pedido por el documento, pero hoy no se usan para estos 5 tabs. |
| Validación de entrada débil | Form data tipada como `Record<string, unknown>` | Sin DTOs/class-validator por tipo de registro → riesgo de mass-assignment (OWASP A03/A04). |
| Sin política de retención/exportación | No existe lógica de conservación configurable (0.6) ni endpoint de exportación de expediente completo (0.11) | Hoy solo hay borrado lógico ad hoc por módulo; no hay garantía uniforme de "no eliminación física" ni exportación consolidada con trazabilidad. |

## 3. Decisiones de arquitectura

### Backend
- Nuevo módulo Nest dedicado a consulta ambulatoria (tentativamente
  `src/outpatient-consultation/`), montado bajo `/encounters/:encounterNumber/...`, que NO
  modifica `EncountersModule` (éste conserva el lifecycle genérico del episodio: listar, meta,
  crear, actualizar, adjuntos).
- Servicios compartidos y reutilizables (preparados para que, a futuro, Emergency/Hospital
  también puedan adoptarlos sin reescritura):
  - `ClinicalAuditService`: wrapper único de `AuditLog.create` con los campos obligatorios de
    la regla 0.5 (tenant, usuario, profesional, paciente, expediente, episodio, documento,
    tipo, versión, fecha/hora servidor, acción, resultado). Append-only.
  - `ClinicalDocumentVersioningService`: máquina de estados genérica — un solo borrador
    editable a la vez, `finalize()` valida mínimos y congela snapshot, nueva versión solo
    permitida desde la última finalizada, bloqueo real de UPDATE/DELETE en backend (no solo UI).
  - `PatientClinicalSnapshotService`: extraído de la lógica actual de `legalContext` en
    `encounters.service.ts`; construye el snapshot de identidad del paciente/profesional/sede
    para embeberlo en cada versión finalizada.
  - `ClinicalSignatureAdapter`: interfaz + implementación no-op (hook preparado para la FEA
    real futura, sin certificados/tokens/hashes simulados).
  - `ClinicalCatalogModule`: catálogo CIE-10 (modelo `IcdCatalogEntry`, seed loader del dataset
    que el usuario proveerá) y catálogo de medicamentos (modelo `MedicationCatalogEntry`), con
    endpoints de búsqueda/autocomplete.
- Modelos Prisma nuevos (migraciones **aditivas**, no tocan tablas de Emergency/Hospital):
  `ClinicalHistory`/`ClinicalHistoryVersion`, `ConsultationNote`/`ConsultationNoteVersion`,
  `EvolutionNote`/`EvolutionNoteVersion` (distingue nota clínica cronológica vs versión
  documental de corrección), `Prescription`/`PrescriptionVersion`/`PrescriptionMedication`.
  Las colecciones repetibles de diagnósticos/medicamentos/signos vitales se insertan también en
  las tablas compartidas `Diagnosis`/`MedicationStatement`/`VitalSign` (tageadas por origen),
  para que Resumen y el timeline puedan consultarlas sin reparsear JSON.
- "Documentos" (6 subtipos) reutiliza `ClinicalDocument`+`DocumentVersion`+`DocumentType`: se
  agregan 6 `DocumentType` nuevos vía seed + DTOs de validación discriminados por tipo + lógica
  de cierre formal de episodio para "Nota de cierre".
- Compatibilidad: las filas históricas de `EncounterSectionRecord` para estos tabs no se
  eliminan; se muestran en modo lectura y se ofrece migración "on write" (el primer guardado
  nuevo parte de un mapeo de los datos legacy, sin pérdida de información).

### Frontend
- Extraer cada tab de `EpisodeDetailPage.tsx` a su propio componente bajo
  `apps/web/src/features/episodes/components/tabs/` (`HistoriaClinicaTab`,
  `ConsultaActualTab`, `EvolucionTab`, `RecetaTab`, `DocumentosTab`, `ResumenTab`).
- Componentes compartidos nuevos: `VitalSignsInput`, `DiagnosisSelector` (CIE-10),
  `MedicationOrderInput`, `ClinicalDocumentStatusBar` (Borrador/Finalizado + versión),
  `ClinicalDocumentLegalData`, `ClinicalAuditTrail`.
- Cutover incremental tipo *strangler fig*: la UI actual de cada tab convive hasta que el tab
  nuevo la reemplaza, para reducir riesgo de regresión.

## 4. Fases de ejecución

Cada fase debe quedar verificable de forma independiente antes de iniciar la siguiente.

### Fase 0 — Fundación compartida (bloquea todo lo demás)
- Ampliar `AuditAction` (migración aditiva): FINALIZE, UPDATE_DRAFT, CREATE_VERSION, DOWNLOAD,
  MODIFY_FINALIZED_DENIED, CLOSE_EPISODE.
- Implementar `ClinicalAuditService`, `ClinicalDocumentVersioningService`,
  `PatientClinicalSnapshotService`, `ClinicalSignatureAdapter` (no-op).
- Implementar `ClinicalCatalogModule`: modelos + seed loader CIE-10 (dataset del usuario) y
  catálogo de medicamentos + endpoints de búsqueda.
- Crear el nuevo módulo Nest vacío con wiring de rutas bajo `/encounters/:encounterNumber/...`.
- Implementar política de conservación (regla 0.6): configurable por tenant/institución, base
  normativa mínima de 5 años desde el último acto médico sin tope superior; soporte para
  cancelación lógica con motivo, usuario, fecha/hora y trazabilidad (nunca eliminación física).
- Implementar exportación de expediente completo (regla 0.11): endpoint que compila todos los
  documentos Finalizados de un episodio/expediente preservando identidad, versión, autoría,
  fecha/hora y trazabilidad (no solo el PDF individual por documento).

### Fase 1 — Historia clínica (depende de Fase 0)
Cobertura: separación clínica, versionamiento (un borrador editable), estado
Borrador/Finalizado sin firma, auditoría básica, padecimiento actual, antecedentes
heredofamiliares/personales patológicos y no patológicos, alergias desde perfil clínico del
paciente con snapshot, antecedentes gineco-obstétricos tipados, terminología sin abreviaturas,
interrogatorio por aparatos y sistemas, exploración física estructurada (signos vitales
tipados), diagnósticos vía catálogo CIE-10, estudios previos repetibles, tratamiento
farmacológico y medicación crónica estructurados, apego terapéutico, factores de riesgo, datos
legales/profesionales con snapshot, preparación para FEA futura.

### Fase 2 — Consulta actual (depende de Fase 0; reutiliza componentes de Fase 1)
Cobertura: alcance clínico del encuentro, estados/versionamiento, contexto de consulta,
padecimiento actual del día, antecedentes de referencia (solo lectura), signos vitales
estructurados con IMC calculado, exploración física por aparatos, impresión diagnóstica CIE-10,
plan terapéutico con medicamentos estructurados, consentimiento renombrado ("Información y
aceptación durante la consulta"), hallazgos de riesgo, impacto funcional, adherencia, datos
legales, finalización, panel lateral, auditoría.

### Fase 3 — Evolución (depende de Fase 0; reutiliza componentes previos)
Cobertura: distinción explícita nota clínica vs versión documental, nombre dinámico de la
acción según tipo de episodio, SOAP completo, estado general, objetivo con signos vitales
estructurados, análisis/diagnóstico vía CIE-10 con vínculo a problemas longitudinales, plan con
pronóstico y cambios de tratamiento, comparación automática con evolución previa, respuesta al
tratamiento, escalas clínicas (Glasgow desglosado ocular/verbal/motora + total calculado,
Karnofsky, EVA compartido), datos legales con snapshot, timeline, auditoría, validaciones con
advertencia (no bloqueo) para valores extremos.

### Fase 4 — Receta e indicaciones (depende de Fase 0 + catálogo de medicamentos)
Cobertura: folio y código de verificación autogenerados, datos legales consolidados (sin
confundir RFC institucional/profesional ni licencia sanitaria con nombre de unidad), tipo de
receta limitado a Ordinaria/Otra en V1, diagnóstico CIE-10, medicamentos estructurados
(dosis/unidad/vía/frecuencia/duración), validaciones de seguridad honestas (alergias,
duplicidad terapéutica, interacciones — mostrar "motor no configurado" si no hay fuente real,
nunca inventar), signos de alarma, próxima cita como fuente única, educación al paciente, plan
de seguimiento, PDF oficial generado desde snapshot finalizado, contador de descargas real,
auditoría completa.

### Fase 5 — Documentos (depende de Fase 0 + catálogo CIE-10)
Cobertura: arquitectura documental común sobre `ClinicalDocument`/`DocumentVersion`, estados
Borrador/Finalizado, versionamiento diferenciando nuevo documento vs nueva versión, PDF oficial
desde snapshot, formularios específicos para los 6 subtipos (laboratorio, imagenología,
referencia/contrarreferencia, consentimiento informado con testigos y autorización de
contingencias, certificado/constancia, nota de cierre), reglas mínimas de finalización por
tipo, cierre formal de episodio solo desde Nota de cierre finalizada con confirmación explícita,
datos legales consolidados reutilizando el componente compartido, archivos adjuntos vía sistema
existente, panel lateral, timeline, auditoría, compatibilidad con documentos existentes.

### Fase 6 — Resumen (depende de Fases 1–5)
Cobertura: endpoint agregador único (`EpisodeSummaryService`) para evitar N consultas por
tarjeta, encabezado del episodio, datos base editables (con auditoría) solo mientras el episodio
esté abierto, estado clínico rápido, resumen clínico priorizando información Finalizada,
signos vitales más recientes, diagnósticos/problemas consolidados, medicamentos actuales,
última evolución, estudios y resultados, última receta, documentos del episodio, seguimiento y
pendientes, alertas clínicas sin inventar inferencias, timeline resumido, estado documental,
reglas de "fuente de verdad única" sin copias editables duplicadas.

### Fase 7 — Endurecimiento transversal / cierre de deuda técnica
- Terminar de vaciar `encounters.service.ts` de lógica outpatient (solo debe quedar lifecycle
  genérico + helpers compartidos usados también por Emergency/Hospital/Surgery).
- Dividir `EpisodeDetailPage.tsx` en componentes por tab (ver sección Frontend).
- Reemplazar `Record<string, unknown>` por DTOs con `class-validator` en los nuevos endpoints.
- Revisar guards de autorización por rol/tenant/sede en los endpoints nuevos (OWASP A01).
- Tests unitarios: versionado (no permite 2 borradores, bloquea UPDATE/DELETE en finalizado,
  nueva versión solo desde finalizado), auditoría (campos obligatorios presentes).
- Tests e2e por tab: crear borrador → guardar varias veces (misma versión) → finalizar →
  intentar editar (rechazado) → nueva versión (snapshot independiente, `previousVersionId`
  correcto).
- Validar el checklist del capítulo 7 del documento original, punto por punto, antes de cerrar
  cada fase.
- Confirmar que Emergency/Hospitalization/Surgery no sufren regresión (regresión manual + e2e
  existentes de esos módulos).
- Verificar que la política de retención (0.6) se aplique de forma consistente a los 5 modelos
  nuevos y que ningún endpoint permita DELETE físico de contenido clínico o adjuntos.
- Probar la exportación de expediente (0.11) end-to-end: debe incluir todas las versiones
  Finalizadas con su snapshot exacto, sin mezclar datos dinámicos actuales.

## 5. Archivos relevantes como punto de partida

- `src/encounters/application/services/encounters.service.ts`
- `src/shared/persistence/` (patrón `IBaseRepository` a seguir para los modelos nuevos)
- `prisma/schema.prisma` (nuevos modelos + extensión de `AuditAction`)
- `prisma/migrations/` (convención de carpetas con fecha) y `prisma/seeds/`
- `apps/web/src/features/episodes/components/EpisodeDetailPage.tsx`,
  `episode-profile-schema.ts`, `episode-record-config.ts`
- `apps/web/src/features/episodes/api/encounters.service.ts`
- `/memories/repo/patients-module.md` — patrón `encounterId: null` para datos a nivel paciente
  (alergias/medicación crónica), reutilizar al construir snapshots.

## 6. Verificación general

- `npm run build` (Nest) y build de `apps/web` sin errores nuevos en cada fase.
- Checklist de aceptación del capítulo 7 del documento original.
- Tests unitarios y e2e descritos en la Fase 7, aplicados incrementalmente a cada fase cuando
  corresponda (no esperar hasta el final para probar).

## 7. Notas y restricciones permanentes

- FEA sigue fuera de alcance: solo dejar el adapter preparado, sin certificados/tokens/hashes
  simulados ni estados "Firmada".
- No eliminar información histórica ni realizar migraciones destructivas.
- No modificar rutas, navegación global ni funcionalidad de Emergency/Hospitalization/Surgery.
- Ejecutar fase por fase con cutover incremental, no "big bang".
