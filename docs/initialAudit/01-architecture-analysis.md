# Análisis de Arquitectura — Gimedic Backend

> Fecha: mayo 2026  
> Alcance: Revisión del backend NestJS antes de iniciar refactorización modular

---

## Stack tecnológico verificado

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS ^11, TypeScript ^5.7 |
| ORM | Prisma ^7.4 + PostgreSQL ≥ 15 |
| Auth | @nestjs/jwt ^11, passport-jwt ^4, bcrypt ^6 |
| Colas | BullMQ ^5 + Redis |
| Almacenamiento | AWS S3 SDK v3 (`@aws-sdk/client-s3`) |
| HTTP hardening | Helmet ^8 |
| Frontend | React ^19 + Vite ^7 + TanStack Query ^5 (apps/web/) |

**Nota importante:** El proyecto NO es Next.js. Es un monorepo npm workspaces:
- Raíz → NestJS API
- `apps/web/` → React SPA (Vite)

---

## Patrón arquitectónico base

Arquitectura en capas por módulo NestJS:

```
presentation/   → Controllers (HTTP)
application/    → Services + DTOs
infrastructure/ → Repositories (Prisma)
domain/         → Interfaces + tipos
```

- Repository pattern con tokens DI (`Symbol`)
- `@Global() PersistenceModule` exporta todos los repositorios
- Multi-tenancy: `tenantId` en cada entidad, enforced en servicios
- RBAC: `User → UserRole → Role → RolePermission → Permission.code`

---

## Hallazgos (8 problemas identificados)

### 1. God Class — `PatientsService` (CRÍTICO)
- **Archivo:** `src/patients/application/services/patients.service.ts` (1668 líneas)
- **Problema:** Un solo servicio concentra búsqueda, detalle, creación, actualización, attachments y ~15 métodos privados de mapeo/validación
- **7 dependencias inyectadas** en constructor
- **Impacto:** Alta dificultad de test, mantenimiento y extensión

### 2. Almacenamiento de archivos en disco local (CRÍTICO)
- **Archivo:** `uploadAttachmentsForTenant` usa `node:fs/promises` (`writeFile`, `mkdir`, `unlink`)
- **Ruta:** `uploads/patients/{tenantId}/{patientId}/`
- **Problema:** No funciona en entornos sin estado (containers, serverless); archivos se pierden en redeploy
- **Debe migrarse a:** AWS S3 (ya tiene el SDK instalado)

### 3. Sin enforcement de permisos RBAC (CRÍTICO)
- **Problema:** `JwtAuthGuard` solo valida que el token sea válido; nunca verifica `permissions[]`
- Los permisos se almacenan en BD (`Permission.code`) pero nunca se comprueban en endpoints
- Cualquier usuario autenticado puede llamar cualquier endpoint

### 4. Sin rate limiting
- **Problema:** No hay protección contra abuso de API (brute force, flooding)
- `@nestjs/throttler` no estaba instalado

### 5. Sin versionado de API
- **Problema:** Todos los endpoints bajo `/api` sin versión; cambios breaking afectan a todos los clientes inmediatamente

### 6. Regex duplicados (CURP, RFC, PHONE) (MENOR)
- **Archivos afectados:**
  - `src/patients/create-patient.dto.ts`
  - `src/patients/update-patient.dto.ts`
  - `src/patients/application/services/patients.service.ts`
- **Problema:** Misma expresión regular definida 3 veces; riesgo de inconsistencia

### 7. Sin Swagger / OpenAPI
- **Problema:** No existe documentación automática de la API; integración con frontend y terceros es manual
- `@nestjs/swagger` no estaba instalado

### 8. Bypass del patrón repositorio en `getDetailByTenant` (ARQUITECTURA)
- **Problema:** El método `getDetailByTenant` accede directamente a Prisma para 6 entidades:
  - `this.prisma.patientResponsibleContact`
  - `this.prisma.patientCoverage`
  - `this.prisma.patientDocument`
  - `this.prisma.patientDemographicProfile`
  - `this.prisma.patientClinicalProfile`
  - `this.prisma.patientBillingProfile`
- Estas 6 entidades no tenían repositorios registrados en `PersistenceModule`
- Viola el patrón de abstracción establecido en el proyecto

---

## Evaluación global

| Aspecto | Estado |
|---------|--------|
| Arquitectura base (capas, DI) | ✅ Sólida |
| Multi-tenancy | ✅ Consistente |
| Seguridad (RBAC) | ❌ No enforced |
| Seguridad (rate limiting) | ❌ Ausente |
| Escalabilidad de archivos | ❌ Disco local |
| Cohesión de servicios | ❌ God Class |
| Abstracción de repositorios | ⚠️ Incompleta (6 entidades) |
| Documentación API | ❌ Ausente |
| Versionado API | ❌ Ausente |
