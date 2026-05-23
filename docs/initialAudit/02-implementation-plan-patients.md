# Plan de implementación — Módulo Pacientes

> Fecha: mayo 2026  
> Basado en: [01-architecture-analysis.md](./01-architecture-analysis.md)  
> Estado general: ✅ COMPLETADO

---

## Objetivos

Aplicar las mejoras identificadas en el análisis de arquitectura comenzando por el módulo de pacientes, como módulo piloto que establece el patrón para el resto del sistema.

---

## Fase 1 — Seguridad: RBAC + Rate Limiting ✅

**Archivos modificados / creados:**

| Archivo | Acción |
|---------|--------|
| `src/auth/domain/auth-jwt-payload.interface.ts` | Agregado campo `permissions: string[]` |
| `src/auth/application/services/auth.service.ts` | `login()` y `refresh()` derivan y embeben `permissionCodes` en JWT |
| `src/auth/infrastructure/decorators/require-permissions.decorator.ts` | CREADO — `@RequirePermissions(...codes)` |
| `src/auth/infrastructure/permissions.guard.ts` | CREADO — valida permisos del JWT contra metadata del endpoint |
| `src/auth/auth.module.ts` | `PermissionsGuard` exportado |
| `src/patients/presentation/patients.controller.ts` | `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions()` por endpoint |
| `src/app.module.ts` | `ThrottlerModule.forRoot({throttlers:[{ttl:60000, limit:120}]})` + `APP_GUARD` global |
| `prisma/seeds/02-auth.seed.ts` | 5 permisos + 6 rolePermissions (tenantAdmin + physician) |
| `prisma/seeds/_context.ts` | Constantes de permisos y rolePermissions agregadas |

**Permisos definidos:**
- `patients.read` — tenantAdmin + physician
- `patients.create` — tenantAdmin
- `patients.update` — tenantAdmin
- `patients.attachments.manage` — tenantAdmin
- `documents.sign` — physician

**Throttle por endpoint:**
- `POST /patients` → 20 req/min
- `PATCH /patients/:id` → 20 req/min
- `POST /patients/:id/attachments` → 10 req/min
- Global → 120 req/min

---

## Fase 2 — Descomposición del God Class ✅

**Archivos creados:**

| Archivo | Responsabilidad |
|---------|----------------|
| `src/patients/application/services/patient-search.service.ts` | `listByTenant` + búsqueda + mapeo de lista |
| `src/patients/application/services/patient-attachments.service.ts` | `uploadAttachmentsForTenant` + `deleteAttachmentForTenant` (S3) |

**`PatientsService` conserva:**
- `createForTenant`
- `getDetailByTenant`
- `updateForTenant`
- Todos los métodos `sync*` internos de transacción

**Actualizaciones:**
- `patients.module.ts` — importa `StorageModule`, registra y exporta los 3 servicios
- `patients.controller.ts` — inyecta los 3 servicios, enruta a cada uno

---

## Fase 3 — Migración de archivos a S3 ✅

**`PatientAttachmentsService` (nuevo):**
- Reemplaza `mkdir/writeFile/unlink` con `S3StorageService.upload/delete`
- Key S3: `patients/{tenantId}/{patientId}/{uuid}-{sanitizedName}`
- Usa `ATTACHMENT_REPOSITORY` en lugar de `this.prisma.attachment.*`

**Archivos creados:**
- `src/shared/storage/s3-storage.service.ts` — wrapper sobre `@aws-sdk/client-s3`
- `src/shared/storage/storage.module.ts` — exporta `S3StorageService`

**Variables de entorno requeridas:**
```
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

---

## Fase 4 — Capa de repositorios completa ✅

**Problema:** 6 entidades accedidas con `this.prisma.*` directo en `getDetailByTenant`.

**Tokens creados** (`src/shared/persistence/tokens/`):
- `PATIENT_COVERAGE_REPOSITORY`
- `PATIENT_DOCUMENT_REPOSITORY`
- `PATIENT_RESPONSIBLE_CONTACT_REPOSITORY`
- `PATIENT_DEMOGRAPHIC_PROFILE_REPOSITORY`
- `PATIENT_CLINICAL_PROFILE_REPOSITORY`
- `PATIENT_BILLING_PROFILE_REPOSITORY`

**Repositorios creados** (`src/shared/persistence/repositories/`):
- `patientCoverage.repository.ts` — `findManyByPatient(tenantId, patientId)`
- `patientDocument.repository.ts` — `findManyByPatient(tenantId, patientId)`
- `patientResponsibleContact.repository.ts` — `findByPatient(patientId)`
- `patientDemographicProfile.repository.ts` — `findByPatient(patientId)`
- `patientClinicalProfile.repository.ts` — `findByPatient(patientId)`
- `patientBillingProfile.repository.ts` — `findByPatient(patientId)`

**`persistence.module.ts`** — todos los nuevos providers + exports registrados.

**`PatientsService`** — inyecta los 6 repositorios; `getDetailByTenant` ya no usa `this.prisma.*` para estas entidades.

---

## Fase 5 — DX: Swagger + versionado ✅

| Archivo | Cambio |
|---------|--------|
| `src/main.ts` | `setGlobalPrefix('api/v1')` + Swagger en `/api/docs` (solo no-producción) |
| `src/patients/create-patient.dto.ts` | Importa `CURP_REGEX`, `PHONE_REGEX` desde shared |
| `src/patients/update-patient.dto.ts` | Importa `CURP_REGEX`, `RFC_REGEX`, `PHONE_REGEX` desde shared |
| `src/patients/application/services/patients.service.ts` | Importa regex desde shared (elimina duplicados locales) |
| `src/shared/constants/validation-patterns.ts` | CREADO — fuente única de `CURP_REGEX`, `RFC_REGEX`, `PHONE_REGEX` |

**Swagger disponible en:** `http://localhost:3000/api/docs`

---

## Resultado final

- `npm run build` → ✅ sin errores
- God Class reducida de 1668 líneas → 3 servicios cohesivos
- 0 llamadas `this.prisma.*` directas en lógica de lectura de pacientes
- Todos los endpoints del módulo protegidos por RBAC granular
- Archivos migrados de disco local a S3
- API versionada y documentada automáticamente

---

## Próximo módulo a refactorizar

Aplicar el mismo patrón en orden de prioridad:

1. **`emergency/`** — mayor volumen de endpoints, sin RBAC
2. **`hospitalization/`** — flujos complejos de admisión/alta
3. **`encounters/`** — núcleo clínico transversal
4. **`documents/`** — firma digital, requiere permisos específicos
5. **`auth/users/`** — gestión de usuarios y roles
