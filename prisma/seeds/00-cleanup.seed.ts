import type { SeedDeps } from './_context';

export async function cleanupSeed({ prisma }: SeedDeps) {
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.deathRecord.deleteMany();
  await prisma.mpNotification.deleteMany();
  await prisma.discharge.deleteMany();
  await prisma.consentForm.deleteMany();
  await prisma.nursingNote.deleteMany();
  await prisma.imagingReport.deleteMany();
  await prisma.imagingRequest.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labRequest.deleteMany();
  await prisma.procedureRecord.deleteMany();
  await prisma.medicationStatement.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.documentStatusHistory.deleteMany();
  await prisma.documentSignature.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.clinicalDocument.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.patientIdentifier.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.tenant.deleteMany();
}