# Gimedic — Sistema de Gestión Clínica

Plataforma de gestión clínica integral diseñada para hospitales, clínicas y consultorios. Soporta el ciclo completo de atención al paciente: registro, episodios de urgencia, hospitalización, cirugía, consultas ambulatorias y documentación médica.

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Tecnologías Implementadas](#tecnologías-implementadas)
3. [Desglose de Módulos](#desglose-de-módulos)
4. [Diagrama de Proceso](#diagrama-de-proceso)
5. [Primeros Pasos](#primeros-pasos)
6. [Variables de Entorno](#variables-de-entorno)
7. [Scripts Disponibles](#scripts-disponibles)

---

## Arquitectura del Sistema

El proyecto sigue una arquitectura **Monorepo Full-Stack** con separación clara entre backend y frontend:

```
gimedic/
├── src/                  # API Backend — NestJS (Node.js)
│   ├── shared/           # Infraestructura transversal (DB, guards, pipes)
│   ├── auth/             # Autenticación y autorización
│   └── [módulos]/        # Dominios de negocio independientes
│
├── apps/
│   └── web/              # SPA Frontend — React + Vite
│       ├── src/features/ # Funcionalidades por dominio
│       ├── src/components/
│       └── src/lib/
│
└── prisma/               # Esquema de base de datos y migraciones
```

### Patrones Arquitectónicos

| Capa | Descripción |
|------|-------------|
| **Presentación** | Controladores REST (`/presentation`) que exponen endpoints HTTP |
| **Aplicación** | Servicios y DTOs (`/application`) con lógica de negocio y validación |
| **Dominio** | Entidades e interfaces (`/domain`) del núcleo de negocio |
| **Infraestructura** | Repositorios Prisma (`/infrastructure`) y adaptadores externos |

El backend sigue principios de **arquitectura en capas** por módulo con NestJS como framework IoC, mientras que el frontend implementa **Feature-Sliced Design** con React.

### Multi-Tenancy

El sistema soporta múltiples organizaciones (tenants) con aislamiento de datos por sede (`Facility`) y organización (`Tenant`), permitiendo operar en hospitales, clínicas y consultorios de forma independiente.

---

## Tecnologías Implementadas

### Backend

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Node.js** | ≥ 20 | Runtime |
| **NestJS** | ^11 | Framework API REST |
| **TypeScript** | ^5.7 | Lenguaje principal |
| **Prisma ORM** | ^7.4 | Acceso a base de datos y migraciones |
| **PostgreSQL** | ≥ 15 | Base de datos relacional |
| **BullMQ** | ^5 | Colas de tareas asíncronas |
| **Redis** | — | Backend de colas (BullMQ) |
| **Passport / JWT** | — | Autenticación con tokens JWT |
| **bcrypt** | ^6 | Hash seguro de contraseñas |
| **Helmet** | ^8 | Cabeceras de seguridad HTTP |
| **AWS S3 SDK** | ^3 | Almacenamiento de archivos adjuntos |
| **class-validator** | ^0.15 | Validación de DTOs |

### Frontend

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **React** | ^19 | Biblioteca de UI |
| **Vite** | ^7 | Bundler y servidor de desarrollo |
| **TypeScript** | ^5.7 | Lenguaje principal |
| **TailwindCSS** | ^3.4 | Estilos utilitarios |
| **React Router DOM** | ^7 | Enrutamiento SPA |
| **TanStack Query** | ^5 | Estado del servidor y caché |
| **Lucide React** | — | Iconografía |
| **Vitest** | ^3 | Testing unitario |
| **Testing Library** | ^16 | Testing de componentes |

### DevOps / Tooling

| Herramienta | Rol |
|-------------|-----|
| **npm Workspaces** | Monorepo con workspaces |
| **ESLint** | Linting de código |
| **Prettier** | Formateo de código |
| **Jest** | Testing E2E (backend) |
| **concurrently** | Ejecución paralela de dev servers |

---

## Desglose de Módulos

### Módulos del Backend (`src/`)

#### Infraestructura Transversal

| Módulo | Descripción |
|--------|-------------|
| `shared/persistence` | Módulo Prisma compartido, conexión y repositorio base |
| `auth` | Autenticación JWT, guards, estrategias Passport |
| `audits` | Registro de auditoría de operaciones críticas |
| `tenants` | Gestión de organizaciones (multi-tenancy) |
| `users` | Gestión de usuarios, roles y permisos |
| `facilities` | Sedes y establecimientos de salud |

#### Gestión de Pacientes

| Módulo | Descripción |
|--------|-------------|
| `patients` | Registro, actualización y consulta de pacientes |
| `medical-records` | Expedientes clínicos por paciente |
| `documents` | Documentos clínicos generados en atenciones |
| `attachments` | Archivos adjuntos (imágenes, PDFs) vía S3 |
| `consents` | Consentimientos informados |

#### Episodios de Atención

| Módulo | Descripción |
|--------|-------------|
| `encounters` | Episodios de atención generales |
| `emergency` | Consultas y evoluciones de urgencias |
| `hospitalization` | Ingresos, evoluciones y altas hospitalarias |
| `nursing` | Turnos y registros de enfermería |
| `surgery` | Documentación quirúrgica |

#### Soporte Clínico

| Módulo | Descripción |
|--------|-------------|
| `catalog` | Catálogos médicos (diagnósticos CIE-10, medicamentos, etc.) |
| `diagnostics` | Resultados de estudios de diagnóstico |
| `dashboard` | Métricas y resúmenes operativos |
| `ai` | Integración con modelos de IA para asistencia clínica |

### Módulos del Frontend (`apps/web/src/features/`)

| Feature | Descripción |
|---------|-------------|
| `auth` | Login, sesión y control de acceso |
| `patients` | Listado, registro y perfil de pacientes |
| `dashboard` | Panel principal con métricas |
| `episodes` | Visualización de episodios de atención |

---

## Diagrama de Proceso

### Registro y Primera Consulta de Paciente

El siguiente diagrama ilustra el flujo completo desde el registro de un nuevo paciente hasta la creación de su primer episodio de atención:

```mermaid
sequenceDiagram
    actor Recepcionista
    participant FE as Frontend (React SPA)
    participant API as Backend (NestJS API)
    participant DB as Base de Datos (PostgreSQL)
    participant S3 as Almacenamiento (AWS S3)

    Recepcionista->>FE: Completa formulario de registro
    FE->>API: POST /patients (datos del paciente)
    API->>API: Validación de DTO (class-validator)
    API->>DB: INSERT Patient + MedicalRecord
    DB-->>API: patient_id, record_id
    API-->>FE: 201 Created { patientId }

    Note over FE,API: Carga opcional de documentos de identidad

    Recepcionista->>FE: Adjunta documento de identidad
    FE->>API: POST /attachments (archivo)
    API->>S3: Upload archivo
    S3-->>API: URL del archivo
    API->>DB: INSERT Attachment (vinculado al paciente)
    API-->>FE: 201 Created { attachmentId }

    Note over FE,API: Inicio del episodio de atención

    Recepcionista->>FE: Crea nuevo episodio (consulta/urgencia)
    FE->>API: POST /encounters { patientId, type, facilityId }
    API->>DB: INSERT Encounter (status: OPEN)
    DB-->>API: encounter_id
    API-->>FE: 201 Created { encounterId }

    Note over FE,DB: El médico puede ahora acceder al episodio
```

---

## Primeros Pasos

### Prerrequisitos

- Node.js ≥ 20
- PostgreSQL ≥ 15
- Redis (para BullMQ)
- npm ≥ 10

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd gimedic

# Instalar dependencias (backend + frontend via workspaces)
npm install

# Aplicar migraciones de base de datos
npx prisma migrate deploy

# Ejecutar seed inicial de datos
npm run prisma:seed
```

### Desarrollo

```bash
# Iniciar backend (puerto 3000) y frontend (puerto 5173) en paralelo
npm run dev

# Solo backend
npm run dev:api

# Solo frontend
npm run dev:web
```

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/gimedic"

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=gimedic-attachments

# CORS (producción)
CORS_ORIGIN=https://your-domain.com

# Entorno
NODE_ENV=development
```

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend y frontend en modo desarrollo |
| `npm run dev:api` | Solo backend con hot-reload |
| `npm run dev:web` | Solo frontend con Vite HMR |
| `npm run build` | Compila el backend |
| `npm run build:all` | Compila backend y frontend |
| `npm run test` | Tests unitarios del backend |
| `npm run test:web` | Tests del frontend (Vitest) |
| `npm run test:e2e` | Tests end-to-end |
| `npm run prisma:seed` | Ejecuta el seed de la base de datos |
| `npm run lint` | Linting con ESLint |

---

> Monorepo clinico con backend NestJS + Prisma en la raiz y frontend Vite +
> React en `apps/web`.

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
