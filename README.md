# giMedic

Monorepo clínico con backend NestJS + Prisma en la raíz y frontend Vite + React en `apps/web`.

## Qué incluye esta fase

- `auth` real con `POST /api/auth/login` y `GET /api/auth/me`
- `dashboard` real con `GET /api/dashboard/summary`
- `patients` real con `GET /api/patients` y `GET /api/patients/:id`
- frontend Vite con rutas:
  - `/login`
  - `/dashboard`
  - `/patients`
  - `/patients/:patientId`
- documentación de cambios y pendientes en [docs/ui-migration-notes.md](/F:/darky/Documentos/darky/Imelda/gimedic/docs/ui-migration-notes.md)

## Estructura

```text
.
|-- apps/
|   `-- web/                 Frontend Vite + React
|-- prisma/                  Schema y seeds
|-- src/                     Backend NestJS
`-- docs/                    Notas de migración y pendientes
```

## Requisitos

- Node.js 20+
- PostgreSQL disponible localmente
- `.env` configurado con `DATABASE_URL`, `JWT_ACCESS_SECRET` y `CORS_ORIGIN`

## Instalación

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

## Seeds

Ejecuta el seed después de preparar la base:

```bash
npm run prisma:seed
```

Si tu entorno no tiene ese alias, usa:

```bash
npx prisma db seed
```

Credenciales de desarrollo:

- `valeria.ruiz@nova.mx` / `Admin123*`
- `ernesto.salas@horizonte.mx` / `Admin123*`

## Scripts útiles

```bash
npm run build
npm run build:web
npm run build:all
npm test -- --runInBand
npm run test:web
```

## Notas

- La UI actual es una base propia inspirada en la dirección del proyecto objetivo, pero la réplica exacta de `clinico-nexus` sigue pendiente hasta que ese repo exista dentro de `contex`.
- El schema Prisma no fue modificado en esta fase.
- `encounters` y `documents` completos aún no están conectados al frontend; quedó preparada la arquitectura para extenderlos.
