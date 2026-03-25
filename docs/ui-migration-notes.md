# UI Migration Notes

## Qué se implementó

- Monorepo con frontend Vite en `apps/web`
- capa HTTP backend para `auth`, `dashboard` y `patients`
- sesión JWT básica con guard en Nest y persistencia local en frontend
- dashboard operativo con métricas del tenant autenticado
- listado y detalle de pacientes consumiendo la API real
- documentación y scripts de desarrollo para backend/frontend

## Qué se tomó del objetivo de migración

- shell visual con navegación lateral, top area y tarjetas de trabajo
- enfoque por dominio en lugar de organizar solo por tipo técnico
- SPA Vite que sustituye piezas SSR/Next por React Router + fetch/query client

## Qué se adaptó por Vite

- navegación con `react-router-dom`
- bootstrap con `main.tsx`
- carga de variables mediante `import.meta.env`
- pruebas frontend orientadas a Vitest

## Archivos principales tocados

- `package.json`
- `tsconfig.json`
- `README.md`
- `prisma/seeds/02-auth.seed.ts`
- `src/main.ts`
- `src/app.module.ts`
- `src/auth/**`
- `src/dashboard/**`
- `src/patients/**`
- `apps/web/**`

## Pendientes reales

- sincronizar la UI exacta contra `clinico-nexus` cuando ese repo esté disponible en `contex`
- ampliar frontend/backend para `encounters`, `documents`, `facilities` y `tenants`
- endurecer auth multi-tenant si el login final requiere `tenantCode` explícito
- agregar pruebas frontend de flujo y no solo smoke checks
- validar build/test del frontend fuera del sandbox o con permisos elevados, porque `vite/esbuild` requiere `spawn` y el sandbox lo bloquea
