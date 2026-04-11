# UI Migration Notes

## Estado actual

Esta fase ya no es solo la base Vite. Tambien deja adaptada la ruta
`/pacientes/nuevo` para que capture la estructura operativa de Nexus sin romper
el diseno actual de gi medic.

## Que se tomo de `clinico-nexus`

- la estructura de alta rapida para nuevo paciente
- la separacion por secciones: identidad, contacto, domicilio, seguridad
  clinica y datos adicionales
- el checklist de completitud del alta
- la logica de fecha de nacimiento o edad referida
- la validacion de CURP, telefono y detalle obligatorio de alergias
- la advertencia de posible duplicado, adaptada para usar la API real de
  `patients`

Referencia usada:
- `contex/clinico-nexus-ref/src/pages/NewPatientPage.tsx`

## Que se adapto en gi medic

- se mantuvo el shell visual, layout, cards, botones y sidebar propios de
  gi medic
- se rehizo `apps/web/src/features/patients/components/NewPatientPage.tsx`
  para conservar el look & feel actual pero con el flujo de captura de Nexus
- se preservo el checklist de la pantalla y se enriquecio con nuevas reglas de
  completitud
- el detalle del paciente ahora entiende alergias, unidad medica, telefonos y
  direccion estructurada capturados desde el alta nueva

## Backend y datos

Se extendio el dominio `Patient` para soportar el alta enriquecida:

- `alternatePhone`
- `municipality`
- `neighborhood`
- `street`
- `exteriorNumber`
- `interiorNumber`
- `emergencyContactRelation`
- `patientStatus`
- `patientType`
- `medicalUnit`
- `hasKnownAllergies`
- `allergiesNotes`
- `occupation`
- `educationLevel`
- `religion`
- `primaryLanguage`
- `requiresTranslator`
- `registrationSource`
- `administrativeNotes`

Tambien se ajusto:

- `CreatePatientDto` con nuevas validaciones y transforms
- `PatientsService` para:
  - validar reglas de admision
  - persistir los nuevos campos
  - seguir llenando `addressLine1/addressLine2` como puente con vistas viejas
  - buscar pacientes por telefono y codigo externo ademas de nombre/CURP
- la respuesta `PatientDetailResponse` para exponer los nuevos datos al front

## Migraciones y seeds

- migracion creada:
  - `prisma/migrations/20260410091500_patient_registration_enrichment/migration.sql`
- seeds actualizados:
  - `prisma/seeds/03-patients.seed.ts`
  - `prisma/seeds/07-expansion.seed.ts`

## Archivos modificados en esta fase

- `apps/web/src/components/ui/textarea.tsx`
- `apps/web/src/features/patients/components/NewPatientPage.tsx`
- `apps/web/src/features/patients/components/PatientDetailPage.tsx`
- `apps/web/src/shared/types/contracts.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260410091500_patient_registration_enrichment/migration.sql`
- `prisma/seeds/03-patients.seed.ts`
- `prisma/seeds/07-expansion.seed.ts`
- `src/patients/create-patient.dto.ts`
- `src/patients/application/dto/patient.response.ts`
- `src/patients/application/services/patients.service.ts`
- `src/patients/application/services/patients.service.spec.ts`
- `README.md`
- `docs/ui-migration-notes.md`

## Verificacion ejecutada

- `npx.cmd tsc -p apps/web/tsconfig.json --noEmit`
- `npm.cmd test -- --runInBand`
- `npm.cmd run build`
- `npm.cmd run build:web`
- `npx.cmd prisma generate`

## Pendientes reales

- aplicar la migracion en la base de datos del entorno donde vayas a probar:
  - `npx prisma migrate deploy`
- volver a correr seed si quieres datos demo alineados al nuevo alta:
  - `npm run prisma:seed`
- extender con el mismo nivel de detalle los flujos de `encounters` y
  `documents`
- decidir si los artefactos generados de `apps/web/dist` y
  `apps/web/tsconfig.tsbuildinfo` deben formar parte del commit o limpiarse
  antes de subir
