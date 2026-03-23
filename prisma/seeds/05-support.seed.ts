import type { SeedDeps } from './_context';
import { dec } from './_context';

export async function seedSupport({ prisma, ctx }: SeedDeps) {
  const { ids, dates } = ctx;

  await prisma.vitalSign.createMany({
    data: [
      {
        id: ids.vitalSigns.anaVs,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        takenAt: dates.anaTakenAt,
        weightKg: dec('63.50'),
        heightCm: dec('164.00'),
        temperatureC: dec('36.6'),
        heartRate: 76,
        respiratoryRate: 18,
        systolicBp: 118,
        diastolicBp: 76,
        oxygenSaturation: dec('98.00'),
        painScale: 2,
      },
      {
        id: ids.vitalSigns.carlosVs,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        takenAt: dates.carlosTakenAt,
        weightKg: dec('81.20'),
        heightCm: dec('175.00'),
        temperatureC: dec('36.7'),
        heartRate: 82,
        respiratoryRate: 19,
        systolicBp: 126,
        diastolicBp: 82,
        oxygenSaturation: dec('97.00'),
        painScale: 4,
      },
    ],
  });

  await prisma.diagnosis.createMany({
    data: [
      {
        id: ids.diagnoses.anaDx,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        code: 'N63',
        description: 'Masa mamaria no especificada en estudio',
        diagnosisType: 'PRESUNTIVO',
        isPrimary: true,
      },
      {
        id: ids.diagnoses.carlosDx,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        code: 'K21.9',
        description: 'Enfermedad por reflujo gastroesofágico sin esofagitis',
        diagnosisType: 'DEFINITIVO',
        isPrimary: true,
      },
    ],
  });

  await prisma.problem.createMany({
    data: [
      {
        id: ids.problems.anaProblem,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        description: 'Nódulo mamario en estudio',
        status: 'ACTIVO',
        onsetAt: new Date('2025-11-20T00:00:00-06:00'),
      },
      {
        id: ids.problems.carlosProblem,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        description: 'Reflujo gastroesofágico crónico',
        status: 'ACTIVO',
        onsetAt: new Date('2024-08-10T00:00:00-06:00'),
      },
    ],
  });

  await prisma.allergy.createMany({
    data: [
      {
        id: ids.allergies.anaAllergy,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        substance: 'Penicilina',
        reaction: 'Exantema cutáneo',
        severity: 'MODERADA',
        status: 'ACTIVA',
      },
      {
        id: ids.allergies.carlosAllergy,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        substance: 'Mariscos',
        reaction: 'Urticaria',
        severity: 'LEVE',
        status: 'ACTIVA',
      },
    ],
  });

  await prisma.medicationStatement.createMany({
    data: [
      {
        id: ids.meds.anaMed,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        medicationName: 'Paracetamol',
        dose: '500 mg',
        route: 'VO',
        frequency: 'Cada 8 horas',
        startDate: new Date('2026-01-15T00:00:00-06:00'),
        endDate: new Date('2026-01-18T00:00:00-06:00'),
        notes: 'Uso en caso de dolor',
      },
      {
        id: ids.meds.carlosMed,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        medicationName: 'Omeprazol',
        dose: '20 mg',
        route: 'VO',
        frequency: 'Cada 24 horas',
        startDate: new Date('2026-02-03T00:00:00-06:00'),
        endDate: new Date('2026-03-03T00:00:00-06:00'),
        notes: 'Tomar antes del desayuno',
      },
    ],
  });

  await prisma.procedureRecord.createMany({
    data: [
      {
        id: ids.procedures.anaProc,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        code: 'PROC-BIOPSIA-01',
        description: 'Solicitud y preparación para biopsia guiada',
        performedAt: new Date('2026-01-15T10:10:00-06:00'),
        performerUserId: ids.users.valeria,
        notes: 'Se orienta a paciente sobre preparación',
      },
      {
        id: ids.procedures.carlosProc,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        code: 'PROC-ENDO-PLAN',
        description: 'Planeación de endoscopia digestiva alta',
        performedAt: new Date('2026-02-03T11:10:00-06:00'),
        performerUserId: ids.users.ernesto,
        notes: 'Se agenda estudio para la siguiente semana',
      },
    ],
  });

  await prisma.labRequest.createMany({
    data: [
      {
        id: ids.labRequests.anaLabReq,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        requestedByUserId: ids.users.valeria,
        requestedAt: dates.anaRequestedAt,
        studyName: 'Biometría hemática',
        clinicalQuestion: 'Valoración preprocedimiento',
        status: 'REPORTADO',
      },
      {
        id: ids.labRequests.carlosLabReq,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        requestedByUserId: ids.users.ernesto,
        requestedAt: dates.carlosRequestedAt,
        studyName: 'Pruebas de función hepática',
        clinicalQuestion: 'Descartar alteración hepática asociada',
        status: 'REPORTADO',
      },
    ],
  });

  await prisma.labResult.createMany({
    data: [
      {
        id: ids.labResults.anaLabRes,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        labRequestId: ids.labRequests.anaLabReq,
        studyName: 'Biometría hemática',
        resultText: 'Sin anemia, leucocitos dentro de rango',
        interpretedBy: 'Laboratorio Nova',
        reportedAt: dates.anaReportedAt,
        incidents: 'Sin incidentes',
      },
      {
        id: ids.labResults.carlosLabRes,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        labRequestId: ids.labRequests.carlosLabReq,
        studyName: 'Pruebas de función hepática',
        resultText: 'AST/ALT dentro de rango normal',
        interpretedBy: 'Laboratorio Horizonte',
        reportedAt: dates.carlosReportedAt,
        incidents: 'Sin incidentes',
      },
    ],
  });

  await prisma.imagingRequest.createMany({
    data: [
      {
        id: ids.imagingRequests.anaImgReq,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        requestedByUserId: ids.users.valeria,
        requestedAt: dates.anaRequestedAt,
        studyName: 'Ultrasonido mamario',
        clinicalQuestion: 'Caracterización de nódulo',
        status: 'REPORTADO',
      },
      {
        id: ids.imagingRequests.carlosImgReq,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        requestedByUserId: ids.users.ernesto,
        requestedAt: dates.carlosRequestedAt,
        studyName: 'Ultrasonido abdominal',
        clinicalQuestion: 'Evaluación de dolor epigástrico persistente',
        status: 'REPORTADO',
      },
    ],
  });

  await prisma.imagingReport.createMany({
    data: [
      {
        id: ids.imagingReports.anaImgRep,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        imagingRequestId: ids.imagingRequests.anaImgReq,
        studyName: 'Ultrasonido mamario',
        resultText: 'Lesión sólida BI-RADS 4, se recomienda correlación histológica',
        interpretedBy: 'Radiología Nova',
        reportedAt: dates.anaReportedAt,
        incidents: 'Sin incidentes',
      },
      {
        id: ids.imagingReports.carlosImgRep,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        imagingRequestId: ids.imagingRequests.carlosImgReq,
        studyName: 'Ultrasonido abdominal',
        resultText: 'Sin hallazgos patológicos relevantes',
        interpretedBy: 'Imagenología Horizonte',
        reportedAt: dates.carlosReportedAt,
        incidents: 'Sin incidentes',
      },
    ],
  });

  await prisma.nursingNote.createMany({
    data: [
      {
        id: ids.nursingNotes.anaNurse,
        tenantId: ids.tenants.nova,
        encounterId: ids.encounters.anaConsult,
        patientId: ids.patients.ana,
        authoredByUserId: ids.users.valeria,
        noteAt: new Date('2026-01-15T09:50:00-06:00'),
        habitusExterior: 'Adecuado, consciente y orientada',
        observations: 'Se brinda orientación para estudios complementarios',
        painScale: 2,
        fallRiskLevel: 'BAJO',
      },
      {
        id: ids.nursingNotes.carlosNurse,
        tenantId: ids.tenants.horizonte,
        encounterId: ids.encounters.carlosConsult,
        patientId: ids.patients.carlos,
        authoredByUserId: ids.users.ernesto,
        noteAt: new Date('2026-02-03T11:05:00-06:00'),
        habitusExterior: 'Paciente estable, afebril',
        observations: 'Tolera exploración abdominal sin datos de alarma',
        painScale: 4,
        fallRiskLevel: 'BAJO',
      },
    ],
  });
}