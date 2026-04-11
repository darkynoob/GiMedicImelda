# giMedic

Monorepo clinico con backend NestJS + Prisma en la raiz y frontend Vite +
React en `apps/web`.

## Que incluye hoy

- `auth` real con `POST /api/auth/login` y `GET /api/auth/me`
- `dashboard` real con `GET /api/dashboard/summary`
- `patients` real con:
  - `GET /api/patients`
  - `GET /api/patients/:id`
  - `POST /api/patients`
- frontend Vite con rutas:
  - `/login`
  - `/dashboard`
  - `/pacientes`
  - `/pacientes/:patientId`
  - `/pacientes/nuevo`
- documentacion de cambios y pendientes en
  [docs/ui-migration-notes.md](/F:/darky/Documentos/darky/Imelda/gimedic/docs/ui-migration-notes.md)

## En esta fase se adapto

- la pantalla `/pacientes/nuevo` de gi medic
- tomando como referencia estructural la vista de nuevo paciente de
  `clinico-nexus`
- conservando el diseno visual actual de gi medic
- con backend/schema/DTOs alineados para persistir la nueva captura

## Estructura

```text
.
|-- apps/
|   `-- web/                 Frontend Vite + React
|-- prisma/                  Schema, migraciones y seeds
|-- src/                     Backend NestJS
`-- docs/                    Notas de migracion y pendientes
```

## Requisitos

- Node.js 20+
- PostgreSQL disponible localmente
- `.env` configurado con `DATABASE_URL`, `JWT_ACCESS_SECRET` y `CORS_ORIGIN`

## Instalacion

```bash
npm install
```

## Desarrollo

Backend Nest:

```bash
npm run dev:api
```

Frontend Vite:

```bash
npm run dev:web
```

Ambos al mismo tiempo:

```bash
npm run dev
```

## Base de datos

Despues de bajar cambios de schema, aplica migraciones:

```bash
npx prisma migrate deploy
```

Si estas trabajando local y quieres regenerar cliente:

```bash
npx prisma generate
```

## Seeds

Ejecuta el seed despues de preparar la base:

```bash
npm run prisma:seed
```

Credenciales de desarrollo:

- `valeria.ruiz@nova.mx` / `Admin123*`
- `ernesto.salas@horizonte.mx` / `Admin123*`

## Scripts utiles

```bash
npm run build
npm run build:web
npm run build:all
npm test -- --runInBand
npx tsc -p apps/web/tsconfig.json --noEmit
```

## Notas

- la referencia visual/estructural usada para la pantalla nueva esta en
  `contex/clinico-nexus-ref`
- el schema Prisma ya fue extendido para soportar el alta enriquecida de
  pacientes
- `encounters` y `documents` completos aun no estan conectados con el mismo
  nivel de detalle del flujo de alta
