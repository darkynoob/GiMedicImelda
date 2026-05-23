import { UserStatus } from '@prisma/client';
import type { SeedDeps } from './_context';

export async function seedAuth({ prisma, ctx }: SeedDeps) {
  const { ids } = ctx;

  await prisma.role.createMany({
    data: [
      {
        id: ids.roles.tenantAdmin,
        code: 'TENANT_ADMIN',
        name: 'Administrador del Tenant',
        description: 'Administra configuración y usuarios del cliente',
      },
      {
        id: ids.roles.physician,
        code: 'PHYSICIAN',
        name: 'Médico',
        description: 'Profesional de salud que captura y firma documentos clínicos',
      },
    ],
  });

  await prisma.permission.createMany({
    data: [
      {
        id: ids.permissions.patientsRead,
        code: 'patients.read',
        name: 'Leer pacientes',
        description: 'Permite consultar expedientes y datos básicos de pacientes',
      },
      {
        id: ids.permissions.patientsCreate,
        code: 'patients.create',
        name: 'Crear pacientes',
        description: 'Permite registrar nuevos pacientes',
      },
      {
        id: ids.permissions.patientsUpdate,
        code: 'patients.update',
        name: 'Actualizar pacientes',
        description: 'Permite modificar datos de pacientes existentes',
      },
      {
        id: ids.permissions.patientsAttachmentsManage,
        code: 'patients.attachments.manage',
        name: 'Gestionar adjuntos de pacientes',
        description: 'Permite subir y eliminar archivos adjuntos de pacientes',
      },
      {
        id: ids.permissions.documentsSign,
        code: 'documents.sign',
        name: 'Firmar documentos',
        description: 'Permite firmar documentos clínicos',
      },
    ],
  });

  await prisma.user.createMany({
    data: [
      {
        id: ids.users.valeria,
        tenantId: ids.tenants.nova,
        facilityId: ids.facilities.novaHospital,
        specialtyId: ids.specialties.onco,
        email: 'valeria.ruiz@nova.mx',
        passwordHash: '$2b$10$uHL0lWopEGm5i0AyrNjFBuJK8ild6DUZ0y3D1F.pLzA3OfD5Adm.q',
        firstName: 'Valeria',
        lastName: 'Ruiz',
        middleName: 'Santos',
        fullName: 'Valeria Ruiz Santos',
        professionalLicense: 'CED-ONCO-1001',
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date('2026-03-01T08:00:00-06:00'),
      },
      {
        id: ids.users.ernesto,
        tenantId: ids.tenants.horizonte,
        facilityId: ids.facilities.horizonteClinic,
        specialtyId: ids.specialties.gastro,
        email: 'ernesto.salas@horizonte.mx',
        passwordHash: '$2b$10$uHL0lWopEGm5i0AyrNjFBuJK8ild6DUZ0y3D1F.pLzA3OfD5Adm.q',
        firstName: 'Ernesto',
        lastName: 'Salas',
        middleName: 'Moreno',
        fullName: 'Ernesto Salas Moreno',
        professionalLicense: 'CED-GASTRO-2002',
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date('2026-03-02T09:00:00-06:00'),
      },
    ],
  });

  await prisma.userRole.createMany({
    data: [
      {
        id: ids.userRoles.valeriaAdmin,
        userId: ids.users.valeria,
        roleId: ids.roles.tenantAdmin,
      },
      {
        id: ids.userRoles.ernestoPhysician,
        userId: ids.users.ernesto,
        roleId: ids.roles.physician,
      },
    ],
  });

  await prisma.rolePermission.createMany({
    data: [
      {
        id: ids.rolePermissions.adminPatientsRead,
        roleId: ids.roles.tenantAdmin,
        permissionId: ids.permissions.patientsRead,
      },
      {
        id: ids.rolePermissions.adminPatientsCreate,
        roleId: ids.roles.tenantAdmin,
        permissionId: ids.permissions.patientsCreate,
      },
      {
        id: ids.rolePermissions.adminPatientsUpdate,
        roleId: ids.roles.tenantAdmin,
        permissionId: ids.permissions.patientsUpdate,
      },
      {
        id: ids.rolePermissions.adminPatientsAttachmentsManage,
        roleId: ids.roles.tenantAdmin,
        permissionId: ids.permissions.patientsAttachmentsManage,
      },
      {
        id: ids.rolePermissions.physicianPatientsRead,
        roleId: ids.roles.physician,
        permissionId: ids.permissions.patientsRead,
      },
      {
        id: ids.rolePermissions.physicianDocumentsSign,
        roleId: ids.roles.physician,
        permissionId: ids.permissions.documentsSign,
      },
    ],
  });
}
