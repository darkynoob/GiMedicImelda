# Progreso de ejecución — Plan Episodio/Consulta

Referencia: [plan-episodio-consulta.md](./plan-episodio-consulta.md)

Leyenda: ✅ hecho · 🔄 en progreso · ⬜ no iniciado · ⚠️ diferido (con motivo)

## Fase 0 — Fundación compartida

| Tarea | Estado | Notas |
| --- | --- | --- |
| Ampliar `AuditAction` (FINALIZE, UPDATE_DRAFT, CREATE_VERSION, DOWNLOAD, MODIFY_FINALIZED_DENIED, CLOSE_EPISODE) | ✅ | Migración `20261006210725_clinical_catalogs_and_audit_actions`. |
| Nuevo enum técnico `ClinicalDocumentStatus` (DRAFT/FINALIZED) | ✅ | Migración `20261006211331_clinical_document_status_enum`. Lo usarán los modelos de Fase 1-4. |
| Modelos `IcdCatalogEntry` / `MedicationCatalogEntry` | ✅ | Catálogos globales (no por tenant), con `isActive` para desactivar sin borrar históricos. |
| `ClinicalCatalogModule` (búsqueda CIE-10 + medicamentos) | ✅ | `GET /catalog/cie10?q=`, `GET /catalog/medications?q=` (JWT requerido). Código en `src/catalog/`. |
| Seed loader CIE-10 desde CSV/JSON | ✅ | `npm run catalog:seed:icd10 -- <archivo>` (soporta `.csv` con encabezado `code,description[,chapter]` o `.json`). Pendiente de que el usuario entregue el dataset real para ejecutarlo. |
| Seed básico de medicamentos | ✅ | `npm run catalog:seed:medications` — 12 medicamentos de arranque ya sembrados en la BD local. |
| `ClinicalAuditService` | ✅ | `src/outpatient-consultation/shared/services/clinical-audit.service.ts`. Append-only (solo `create`). |
| `ClinicalDocumentVersioningService` (genérico) | ✅ | `src/outpatient-consultation/shared/services/clinical-document-versioning.service.ts`. Puerto `ClinicalVersionPort` para que cada tab (Fase 1-4) lo implemente contra su propio modelo. 5 tests unitarios pasando. |
| `PatientClinicalSnapshotService` | ✅ | `src/outpatient-consultation/shared/services/patient-clinical-snapshot.service.ts`. Arma el snapshot de identidad paciente/profesional/sede exigido por la regla 0.3. |
| `ClinicalSignatureAdapter` (no-op) | ✅ | `src/outpatient-consultation/shared/services/clinical-signature.adapter.ts`. Devuelve `NOT_IMPLEMENTED`; no genera hashes/certificados simulados. |
| Módulo `OutpatientConsultationModule` (skeleton) | ✅ | Registrado en `app.module.ts`. Por ahora solo expone los servicios compartidos; los controllers por tab se agregan en Fases 1-6. |
| Política de retención (0.6) | ⚠️ | Diferido: no hay todavía documentos clínicos concretos (Fase 1-5) sobre los cuales aplicar la política. Se implementará junto con los modelos de cada tab para no crear una tabla de configuración sin consumidores reales. |
| Exportación de expediente completo (0.11) | ⚠️ | Diferido por la misma razón: no existe aún contenido Finalizado que exportar. Se construirá en Fase 6/7 una vez existan Historia clínica, Consulta, Evolución, Receta y Documentos reales. |
| Build + tests sin romper nada existente | ✅ | `npm run build` OK. Suite de tests: 12/15 pasan; las 3 fallas son **preexistentes** en `patients.service.spec.ts` (mocks incompletos de `this.prisma`, no relacionado con estos cambios — no se tocó ese archivo). |

## Fase 1 — Historia clínica
🔄 Backend implementado; **frontend pendiente**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Modelos `ClinicalHistory` / `ClinicalHistoryVersion` | ✅ | Migración `20261006212910_clinical_history`. ~70 campos estructurados (sin textarea genérico) cubriendo las secciones 5-21 del capítulo 1 del documento. |
| Trazabilidad de origen en tablas compartidas | ✅ | `Diagnosis`/`VitalSign`/`MedicationStatement` ahora tienen `sourceType`/`sourceVersionId` (migración `20261006212910_clinical_history`) para que Resumen/timeline no tengan que reparsear JSON. |
| `ClinicalHistoryService` (implementa el puerto `ClinicalVersionPort`) | ✅ | `src/outpatient-consultation/clinical-history/application/services/clinical-history.service.ts`. Un borrador editable a la vez, finalize con validación mínima, nueva versión solo desde Finalizada, snapshot de alergias al crear versión, snapshot legal/identidad al finalizar, reflejo a tablas compartidas al finalizar. |
| DTOs con `class-validator` | ✅ | `save-clinical-history-draft.dto.ts` + `clinical-history-items.dto.ts` (estudios previos, medicamentos, diagnósticos secundarios como colecciones tipadas, no JSON libre). |
| Endpoints REST | ✅ | `GET/POST /encounters/:encounterNumber/clinical-history`, `.../draft`, `.../finalize`, `.../new-version` (verificado con la app arrancada: rutas registradas, DI resuelta sin errores). |
| Auditoría | ✅ | CREATE / UPDATE_DRAFT / FINALIZE / CREATE_VERSION / MODIFY_FINALIZED_DENIED vía `ClinicalAuditService`. |
| Build + boot real de la app | ✅ | `npm run build` OK; arranque real de Nest confirmó resolución de dependencias y mapeo de rutas (se corrigió un bug real: `CatalogModule` y `ClinicalHistoryModule` no importaban `AuthModule`, causando que `JwtAuthGuard` no pudiera inyectar `JwtService`). |
| Tests (unit/e2e específicos de Historia clínica) | ⬜ | Pendiente (se reutilizan los tests genéricos de versionado de Fase 0). |
| Frontend (tab Historia clínica) | ⬜ | Pendiente: extraer de `EpisodeDetailPage.tsx`/`episode-profile-schema.ts` un componente propio que consuma estos endpoints nuevos y los componentes compartidos (`VitalSignsInput`, `DiagnosisSelector`, etc., aún no creados). |
| Alta de nuevas alergias desde este tab (spec 1.8) | ⬜ | Solo se lee/copia el snapshot de alergias existentes del paciente; falta el flujo para agregar una alergia nueva desde Historia clínica (probablemente ya exista un endpoint en Patients a reutilizar). |

## Fase 2 — Consulta actual
🔄 Backend implementado; **frontend pendiente**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Modelos `ConsultationNote` / `ConsultationNoteVersion` | ✅ | Migración `20261006214313_consultation_note`. Cubre secciones 3-16 del capítulo 2: contexto, padecimiento actual del día, signos vitales, exploración por aparatos, impresión diagnóstica, plan terapéutico, "Información y aceptación durante la consulta" (renombrado según spec 2.12), hallazgos de riesgo, impacto funcional, adherencia. |
| DTOs compartidos entre tabs | ✅ | `DiagnosisItemDto`/`MedicationOrderItemDto`/`PriorStudyItemDto` movidos a `src/outpatient-consultation/shared/dto/clinical-item.dto.ts` y reutilizados por Historia clínica (evita la duplicación que señalaba la regla 0.7). |
| Antecedentes de referencia (solo lectura) | ✅ | `getDetail` devuelve `referenceContext` con alergias/medicación crónica del perfil del paciente (`encounterId: null`), sin duplicarlos ni permitir edición desde este tab. |
| IMC calculado | ✅ | Se calcula en el servicio a partir de peso/talla y se devuelve en la respuesta; no se almacena dos veces. |
| `ConsultationNoteService` (puerto `ClinicalVersionPort`) | ✅ | Mismo patrón que Historia clínica: borrador único, finalize valida motivo principal obligatorio, nueva versión solo desde Finalizada, reflejo a `Diagnosis`/`VitalSign`/`MedicationStatement` con `sourceType='CONSULTATION_NOTE_VERSION'`. |
| Endpoints REST | ✅ | `GET/POST /encounters/:encounterNumber/consultation-note[/draft|/finalize|/new-version]`. |
| Build + boot real | ✅ | Verificado arrancando la app compilada: módulo y rutas inicializan sin errores de DI. |
| Frontend (tab Consulta actual) | ⬜ | Pendiente. |

## Fase 3 — Evolución
🔄 Backend implementado; **frontend pendiente**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Modelos `EvolutionNote` (nota cronológica) + `EvolutionNoteVersion` (versión documental) | ✅ | Migraciones `20261006215052_evolution_note` y `20261006215358_evolution_note_proposed_medications`. Distingue explícitamente "Nota de evolución #1, #2..." (`noteNumber` único por episodio) de "Versión 1, 2..." de esa misma nota (spec 3.3), evitando la confusión que señalaba la regla. |
| SOAP completo + escalas clínicas | ✅ | Subjetivo/Objetivo (signos vitales estructurados)/Análisis (CIE-10 + vínculo opcional a `Problem` longitudinal)/Plan (pronóstico, cambio de tratamiento, medicamentos propuestos estructurados). Glasgow desglosado ocular/verbal/motor (el total se calcula en el servicio/frontend, no se duplica en BD), Karnofsky, riesgo cardiovascular, EVA reutilizado del bloque Objetivo. |
| Comparación con evolución previa | ✅ | `getNoteDetail` resuelve en el servicio (sin copiar dinámicamente) la última nota con versión Finalizada anterior dentro del mismo episodio; el profesional captura manualmente tendencia/análisis comparativo. |
| `EvolutionNoteService` (puerto `ClinicalVersionPort` por nota) | ✅ | Cada `EvolutionNote` tiene su propio ciclo borrador→finalizado→nueva versión independiente de las demás notas del episodio. |
| Endpoints REST | ✅ | `GET/POST /encounters/:encounterNumber/evolution-notes[/:noteId][/draft\|/finalize\|/new-version]`. |
| Build + boot real | ✅ | Verificado arrancando la app compilada: módulo y 6 rutas inicializan sin errores de DI. |
| Validaciones de rango (Glasgow 3-15 vía componentes, EVA 0-10, SpO2 0-100, Karnofsky 0-100) | ✅ | Vía `class-validator`; **no** se acotan valores clínicos como FC/TA/temperatura (regla 3.22: advertencia, no bloqueo — queda como responsabilidad del frontend mostrar la advertencia). |
| Frontend (tab Evolución) | ⬜ | Pendiente. |
| Envío de medicamentos propuestos a Receta e indicaciones | ⬜ | Hoy solo se guarda el snapshot estructurado (`proposedMedicationsJson`); falta el flujo de "enviar/vincular" una vez exista Fase 4 (Receta). |

## Fase 4 — Receta e indicaciones
🔄 Backend implementado; **frontend y PDF real pendientes**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Modelos `Prescription` (parent, folio estable) + `PrescriptionVersion` | ✅ | Migración `20261006215904_prescription`. Varias recetas por episodio, cada una con su propio folio único y versionamiento independiente. |
| Folio y código de verificación | ✅ | Folio generado al crear la receta (`RX-YYYYMMDD-XXXXXX`, único, con reintento ante colisión); código de verificación generado solo al Finalizar (único por versión, nunca reutilizado). |
| Tipo de receta restringido a V1 | ✅ | DTO solo acepta `ORDINARIA`/`OTRA` (`ANTIBIOTICO`/`CONTROL_ESPECIAL` rechazados hasta implementar reglas regulatorias, spec 4.6). |
| Medicamento estructurado sin campos duplicados | ✅ | Dosis separada en cantidad+unidad, frecuencia predefinida + intervalo en horas, duración consolidada (value+unit), sin "Duración" y "Duración (días)" por separado. |
| Validaciones de seguridad honestas | ✅ | Alergias (match real contra perfil del paciente o `ALLERGY_INFO_UNAVAILABLE` si no hay datos — nunca "sin alertas" falso), duplicidad terapéutica (por nombre exacto + principio activo vía catálogo, marcando `LIMITED_ENGINE` cuando no se puede resolver), interacciones siempre `NOT_CONFIGURED` (sin inventar motor). Se recalculan en cada guardado. |
| Próxima cita como fuente única | ✅ | Un solo campo `nextAppointmentDate`; no hay duplicado entre "Receta" y "Plan de seguimiento". |
| Finalización con mínimos y alerta crítica | ✅ | Exige medicamento o indicación clínica, campos mínimos por medicamento completos, y confirmación/justificación si hay alergia detectada (`criticalAlertAcknowledged`). |
| Descargas reales | ✅ | Endpoint `.../versions/:versionId/download` solo sobre versión Finalizada, incrementa `downloadCount` real y registra auditoría `DOWNLOAD` (vista previa nunca lo incrementa). |
| Build + boot real | ✅ | Verificado arrancando la app compilada: módulo y 6 rutas inicializan sin errores de DI. |
| PDF real (binario) | ⬜ | **No implementado.** Se dejó la estructura de datos y el flag `officialPdfAvailableAt`, pero la generación real del PDF (plantilla, librería, marca BORRADOR/NO FIRMADO) requiere elegir una librería de PDF — pendiente de decisión y de la Fase de frontend. |
| Frontend (tab Receta) | ⬜ | Pendiente. |

## Fase 5 — Documentos
🔄 Backend implementado; **frontend y PDF real pendientes**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Reutilización de `ClinicalDocument`/`DocumentVersion`/`DocumentType` | ✅ | Tal como decidió el plan: no se crearon modelos nuevos. `DocumentType` se auto-provisiona por tenant la primera vez que se usa cada uno de los 6 subtipos (no requiere seed manual). |
| Nuevo estado técnico `FINALIZED` en `DocumentStatus` | ✅ | Migración `20261006220747_document_finalized_status_and_downloads` (aditiva). El tab Documentos usa únicamente `DRAFT`/`FINALIZED`, nunca `SIGNED` (evita la "firma simulada" prohibida por la regla 0.1; los valores legacy del enum quedan intactos para quien ya los use). |
| 6 subtipos con contenido estructurado propio | ✅ | Solicitud de laboratorio, solicitud de imagenología, referencia/contrarreferencia, consentimiento informado (con testigos y autorización de contingencias), certificado/constancia, nota de cierre — cada uno con sus propios campos validados vía DTO, no un textarea genérico. |
| Reglas mínimas de finalización por tipo | ✅ | Implementadas una por una según spec 5.14 (motivo+estudios para laboratorio, riesgos/beneficios/alternativas para consentimiento, etc.). |
| Nota de cierre cierra el episodio | ✅ | Al finalizar una `CLOSURE_NOTE`, el servicio cambia `Encounter.status` a `CLOSED` y registra auditoría `CLOSE_EPISODE` — nunca se cierra por simplemente seleccionar un estado. |
| Hash de integridad por versión | ✅ | Se reutiliza `DocumentVersion.hashSha256` (ya existía en el modelo) recalculado en cada guardado/finalización. |
| Descargas reales | ✅ | Endpoint `.../:documentId/download` solo sobre documento Finalizado, incrementa `downloadCount` real (campo nuevo) y registra auditoría `DOWNLOAD`. |
| Build + boot real | ✅ | Verificado arrancando la app compilada: módulo y rutas inicializan sin errores de DI. |
| PDF real (binario) | ⬜ | Mismo pendiente que Fase 4: falta elegir librería de PDF e implementar la plantilla con marca BORRADOR/NO FIRMADO. |
| Frontend (tab Documentos) | ⬜ | Pendiente. |

## Fase 6 — Resumen
🔄 Backend implementado; **frontend pendiente**.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Endpoint agregador único | ✅ | `GET /encounters/:encounterNumber/summary` (`EpisodeSummaryService`) — una sola llamada en vez de N por tarjeta (spec 6.22), sin duplicar físicamente la información clínica. |
| Encabezado del episodio | ✅ | Paciente, folio, tipo, estado, fechas de apertura/cierre, responsable, motivo. |
| Estado clínico rápido | ✅ | Alergias (conteo + detalle), problemas activos, medicación crónica, estudios pendientes — todo consultado en vivo desde las tablas fuente (`Allergy`/`Problem`/`MedicationStatement`/`LabRequest`/`ImagingRequest`). |
| Resumen clínico / última evolución / última receta | ✅ | Prioriza información en estado **Finalizado** (Consulta actual, Evolución); no sustituye silenciosamente con Borradores. |
| Diagnósticos/problemas, signos vitales, estudios y resultados | ✅ | Reutiliza las tablas compartidas `Diagnosis`/`VitalSign`/`LabRequest`/`LabResult`/`ImagingRequest`/`ImagingReport` que las Fases 1-5 ya alimentan. |
| Documentos y estado documental | ✅ | Contadores por tipo desde `ClinicalDocument`, estado de Historia clínica/Consulta/conteo de Evoluciones y Recetas. |
| Timeline resumido | ✅ | Derivado de `AuditLog` (acciones `FINALIZE`/`CLOSE_EPISODE`), sin tabla de timeline duplicada ni eventos por autosave. |
| Build + boot real | ✅ | Verificado arrancando la app compilada: módulo y ruta inicializan sin errores de DI. |
| Frontend (tab Resumen) | ⬜ | Pendiente. |
| "Datos base del episodio" editable + auditoría | ⬜ | Ya existe `EncountersService.updateForTenant` (módulo legacy, no tocado); falta confirmar/añadir que esos cambios queden auditados — se revisará en Fase 7. |

## Fase 7 — Endurecimiento transversal
🔄 Parcial.

| Tarea | Estado | Notas |
| --- | --- | --- |
| Guard "episodio abierto" en los 5 servicios de escritura | ✅ | `assertEncounterOpen` nuevo (`shared/services/encounter-status.guard.ts`) aplicado en `create`/`saveDraft`/`finalize`/`createNewVersion` de Historia clínica, Consulta actual, Evolución, Receta y Documentos (no afecta lecturas ni la descarga de PDF, que deben seguir accesibles con el episodio Cerrado). |
| Vaciar `encounters.service.ts` de lógica outpatient | ⬜ | No se tocó (sigue intacto); los módulos nuevos son aditivos y conviven con él. |
| Dividir `EpisodeDetailPage.tsx` | ⬜ | Pendiente de frontend. |
| DTOs con `class-validator` en vez de `Record<string, unknown>` | ✅ | Ya aplicado desde el inicio en los 5 módulos nuevos (no es una tarea pendiente adicional). |
| Tests e2e por tab (draft→finalize→nueva versión→edición rechazada) | ⬜ | Solo existen los 5 tests unitarios del versionado genérico (Fase 0); faltan e2e específicos por tab. |

## Archivos nuevos de Fase 7 (parcial)

- `src/outpatient-consultation/shared/services/encounter-status.guard.ts`

## Frontend (todas las fases)

| Tarea | Estado | Notas |
| --- | --- | --- |
| Clientes API nuevos | ✅ | Uno por tab: `clinical-history.service.ts`, `catalog.service.ts`, `consultation-note.service.ts`, `evolution-note.service.ts`, `prescription.service.ts`, `document.service.ts`, `episode-summary.service.ts`, todos en `apps/web/src/features/episodes/api/`. |
| `DiagnosisSelector` (compartido) | ✅ | Autocomplete contra `GET /catalog/cie10`, guarda código+descripción, nunca texto libre independiente. |
| `VitalSignsInput` (compartido) | ✅ | Grid de campos numéricos con unidad visible + IMC calculado read-only cuando se pasan `weightKey`/`heightKey`. |
| `MedicationOrderInput` (compartido) | ✅ | Colección repetible de medicamentos estructurados (agregar/quitar filas). |
| `ClinicalDocumentStatusBar` (compartido) | ✅ | Borrador/Finalizado + versión + botones Guardar/Finalizar/Nueva versión; nunca muestra "Firmado". |
| `HistoriaClinicaTab` (standalone) | ✅ | Padecimiento actual, antecedentes heredofamiliares (toggles), alergias (snapshot de solo lectura), signos vitales, diagnóstico principal (CIE-10), estudios previos (resumen), tratamiento farmacológico, pronóstico. **No cubre el 100% de los ~70 campos del modelo** (antecedentes personales no patológicos, gineco-obstétricos, interrogatorio por aparatos y sistemas, factores de riesgo, apego terapéutico quedan sin UI todavía). |
| `ConsultaActualTab` (standalone) | ✅ | Contexto de la consulta, padecimiento actual del día, signos vitales + IMC, exploración por 10 aparatos/sistemas (estado+detalle), impresión diagnóstica, plan terapéutico completo (incapacidad, pronóstico, seguimiento), consentimiento, 9 hallazgos de riesgo, impacto funcional, adherencia. Antecedentes de referencia (alergias/medicación crónica) mostrados de solo lectura. No incluye editor de `secondaryDiagnoses` (gap conocido, igual que en Historia clínica). |
| `EvolucionTab` (standalone) | ✅ | Maneja la *lista* de notas (Evolución #1, #2...) con selector lateral y botón "+ Nueva evolución"; cada nota tiene su propio Borrador/Finalizado/Nueva versión. SOAP completo, comparación automática con la evolución previa finalizada, conducta terapéutica propuesta, escalas (Glasgow, Karnofsky, riesgo cardiovascular). |
| `RecetaTab` (standalone) | ✅ | Lista de recetas por folio (una por receta, versionadas). Encabezado, diagnóstico, medicamentos estructurados (dosis+unidad+vía+frecuencia+intervalo+duración), **validaciones de seguridad mostradas tal cual las calcula el backend** (alergias/duplicidad/interacciones, nunca inventadas), signos de alarma, educación al paciente, plan de seguimiento. "Registrar descarga oficial" solo incrementa el contador real (no genera PDF, biblioteca pendiente). |
| `DocumentosTab` (standalone) | ✅ | Lista de documentos con selector de tipo al crear; 6 subtipos con su propio formulario (Laboratorio, Imagenología, Referencia, Consentimiento informado, Certificado, Nota de cierre). Finalizar una Nota de cierre pide confirmación explícita porque cierra el episodio. **Requirió un cambio de backend** (ver abajo) porque no existía forma de leer el contenido de un documento ya creado. |
| `ResumenTab` (standalone) | ✅ | Vista de solo lectura consumiendo `GET /encounters/:encounterNumber/summary` tal cual; sin edición, sin copias de datos. |
| Integración en `EpisodeDetailPage.tsx` | ✅ | **Hecha.** Se agregó la variable `isOutpatientNewClinicalTab` (combina los 5 flags `isConsultationXxxSection` ya existentes, con `isOutpatientDocument` para 'Documentos' porque ese flag se comparte con Emergencias/Hospitalización/Cirugía). Se insertó un nuevo branch `{isOutpatientNewClinicalTab ? (<SectionCard>...6 tabs...) : activeTabDefinition ? (<>...bloque legacy intacto...</>) : null}` que reemplaza el formulario genérico data-driven SOLO para estas 5 combinaciones, sin tocar ni una línea del bloque legacy de ~3200 líneas que sigue sirviendo a Emergencias/Hospitalización/Cirugía/Ambulatorio. Para el tab 'Resumen' se mantuvo intacta la card de edición administrativa ("Datos base del episodio": sede/especialidad/responsable/estado/fechas/motivo) y se reemplazaron solo las cards de resumen clínico viejas por `<ResumenTab/>` cuando `encounterType === 'OUTPATIENT'`. El panel lateral derecho (contadores de alergias, etc.) no se tocó. Verificado con `tsc -b --noEmit` (0 errores), `vitest run` y `npm run build` (Vite) sin regresiones. **Pendiente**: prueba manual en navegador (no se hizo por falta de credenciales de prueba documentadas). |
| Fix de tipado pre-existente en `AppSidebar.tsx` | ✅ | `navSections` no tenía un tipo explícito, por lo que TS no permitía los campos opcionales `hidden`/`roles` en el segundo grupo de items. Esto bloqueaba el build completo de Vite (`tsc -b` fallaba). Se agregó el tipo `NavItem` explícito; no cambia ningún comportamiento, solo tipado. |

## Cómo seguir

1. Backend de las 6 fases de contenido clínico completo, más el guard de episodio abierto y el endpoint `GET /encounters/:encounterNumber/documents/:documentId` agregado para soportar el tab Documentos. Pendientes de Fase 7: tests e2e por tab, y la limpieza de `encounters.service.ts`.
2. Frontend: los 6 tabs ya están construidos e **integrados** en `EpisodeDetailPage.tsx` para episodios OUTPATIENT.
3. **Pendiente real**: probar manualmente en el navegador con un episodio OUTPATIENT real (crear uno desde la UI o usar uno existente) para confirmar visualmente que los 6 tabs cargan y guardan correctamente, y que Emergencias/Hospitalización/Cirugía/Ambulatorio siguen funcionando exactamente igual que antes (no debería haber cambiado nada para ellos, pero conviene confirmarlo con los ojos antes de dar esto por 100% cerrado).
4. Decisión pendiente antes de implementar PDF real: qué librería usar (ej. `pdf-lib`, `puppeteer`, `@react-pdf/renderer`) para Receta y Documentos.
5. Cuando tengas el dataset CIE-10 (CSV/JSON), correr: `npm run catalog:seed:icd10 -- ruta/al/archivo.csv`.
6. Gaps conocidos de UI a cerrar cuando se retome: editor de diagnósticos secundarios (Historia clínica/Consulta actual), antecedentes personales no patológicos/gineco-obstétricos/interrogatorio por aparatos en Historia clínica.

## Bitácora

- **2026-10-06**: Fase 0 ejecutada (fundación compartida backend). Pendientes explícitos: 0.6 y 0.11 (diferidos a cuando existan documentos concretos).
- **2026-10-06**: Fase 1 (Historia clínica) ejecutada en backend: modelos, servicio, DTOs, endpoints, auditoría. Verificado con build + arranque real de la app (rutas mapeadas, DI resuelta). Corregido bug real de módulos sin `AuthModule`. Frontend de este tab queda pendiente.
- **2026-10-06**: Fase 2 (Consulta actual) ejecutada en backend: modelos, servicio, DTOs, endpoints. DTOs de ítems repetibles extraídos a un módulo compartido y reutilizados por Historia clínica. Verificado con build + arranque real. Frontend de este tab queda pendiente.
- **2026-10-06**: Fase 3 (Evolución) ejecutada en backend: modelo de dos niveles (nota cronológica + versión documental), SOAP completo, escalas clínicas, comparación automática con evolución previa, vínculo opcional a problemas longitudinales. Verificado con build + arranque real. Frontend de este tab queda pendiente.
- **2026-10-06**: Fase 4 (Receta e indicaciones) ejecutada en backend: folio/código de verificación, medicamentos estructurados, validaciones de seguridad honestas (alergias/duplicidad/interacciones), descargas reales. Verificado con build + arranque real. PDF real y frontend quedan pendientes.
- **2026-10-06**: Fase 5 (Documentos) ejecutada en backend: reutiliza `ClinicalDocument`/`DocumentVersion`/`DocumentType`, 6 subtipos con contenido estructurado y reglas mínimas propias, Nota de cierre cierra el episodio formalmente. Verificado con build + arranque real. PDF real y frontend quedan pendientes.
- **2026-10-06**: Fase 6 (Resumen) ejecutada en backend: endpoint agregador único de solo lectura sobre las fuentes ya construidas. Verificado con build + arranque real. Frontend queda pendiente.
- **2026-10-06**: Fase 7 (parcial): guard transversal de "episodio abierto" aplicado a los 5 servicios de escritura. Verificado con build + tests + arranque real sin regresiones.
- **2026-10-06**: Frontend — primera tanda: componentes compartidos (`DiagnosisSelector`, `VitalSignsInput`, `MedicationOrderInput`, `ClinicalDocumentStatusBar`) + `HistoriaClinicaTab` standalone y funcional, verificado con type-check (`tsc -b`) y `vitest run` sin regresiones. Integración en `EpisodeDetailPage.tsx` deliberadamente diferida a una sesión dedicada por el riesgo de tocar un archivo de ~10k líneas compartido con Emergencias/Hospitalización/Cirugía sin leerlo completo primero.
- **2026-10-06**: Frontend — segunda tanda: se completaron los 5 tabs restantes como componentes standalone (`ConsultaActualTab`, `EvolucionTab`, `RecetaTab`, `DocumentosTab`, `ResumenTab`), cada uno con su cliente API dedicado. Se detectó y corrigió una laguna real en el backend de Documentos: no existía forma de leer el `contentJson` de un documento ya creado (vivía solo en `DocumentVersion`, nunca expuesto); se agregó `GET /encounters/:encounterNumber/documents/:documentId` + `DocumentService.getDetail()`, verificado con build + arranque real (ruta mapeada, DI resuelta). Se corrigió además un bug de tipado pre-existente en `AppSidebar.tsx` que bloqueaba el build completo de Vite. Verificación final: `tsc -b --noEmit` limpio, `npx vitest run` sin regresiones, `npm run build` (Vite) exitoso, `npx jest` del backend en 12/15 (mismas 3 fallas preexistentes de siempre), arranque real del backend sin errores de DI.
- **2026-10-06**: Frontend — integración final en `EpisodeDetailPage.tsx`. Se leyó la estructura completa del archivo (tabs universales 'Resumen' + 5 tabs schema-driven por `encounterType`, flags `isConsultationXxxSection` ya existentes, bloque único `{activeTabDefinition ? (...) : null}` compartido por TODOS los encounterType). Se insertó `isOutpatientNewClinicalTab` y un nuevo branch que intercepta solo las 5 combinaciones OUTPATIENT+tab nuevo, dejando el bloque legacy de ~3200 líneas sin tocar para Emergencias/Hospitalización/Cirugía/Ambulatorio. Para 'Resumen' se reemplazaron solo las cards de resumen clínico viejas (`outpatientClinicalSummary`) por `<ResumenTab/>`, manteniendo intacta la card de edición administrativa del episodio. Verificado con `tsc -b --noEmit` (0 errores), `vitest run` y `npm run build` (Vite) sin regresiones. Nota: durante la edición, dos `replace_string_in_file` consecutivos con texto casi idéntico causaron que el segundo matcheara el lugar equivocado (el texto recién insertado por el primero); se detectó re-leyendo el archivo y se corrigió antes de continuar — ver memoria de repo para la lección aprendida. **Prueba manual en navegador pendiente** (no se hizo por falta de credenciales de prueba documentadas).

