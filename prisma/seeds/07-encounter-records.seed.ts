import { randomUUID } from 'node:crypto';
import { EncounterRecordStatus, EncounterType } from '@prisma/client';
import type { SeedDeps } from './_context';

function buildOutpatientSections() {
  return {
    'Historia clínica': {
      antecedentesHeredofamiliares: '',
      antecedentesPatologicos: '',
      antecedentesNoPatologicos: '',
      antecedentesGinecoObstetricos: '',
      padecimientoActual: '',
      interrogatorioSistemas: '',
      exploracionFisica: '',
      resultadosPreviosEstudios: '',
      diagnosticosProblemas: '',
      planTerapeutico: '',
      pronostico: '',
      medicacionCronica: '',
      apegoTerapeutico: '',
      factoresRiesgo: '',
    },
    'Consulta actual': {
      tipoConsulta: '',
      motivoConsulta: '',
      padecimientoActualConsulta: '',
      antecedentesReferencia: '',
      signosVitalesConsulta: '',
      exploracionFisicaConsulta: '',
      impresionDiagnostica: '',
      planTerapeuticoConsulta: '',
      consentimientoInformado: '',
      redFlags: '',
      impactoFuncional: '',
      adherenciaTratamiento: '',
    },
    Evolución: {
      fechaEvolucion: '',
      estadoClinicoGeneral: '',
      subjetivo: '',
      objetivo: '',
      analisisDiagnostico: '',
      planEvolucion: '',
      comparacionEvolucionPrevia: '',
      respuestaTratamiento: '',
      escalasClinicas: '',
    },
    'Receta / Indicaciones': {
      encabezadoReceta: '',
      diagnosticoAsociado: '',
      prescripcion: '',
      validacionesSeguridad: '',
      indicacionesSignosAlarma: '',
      datosLegalesReceta: '',
      educacionPaciente: '',
      planSeguimiento: '',
      estudiosSolicitados: '',
      informacionClinicaAdicional: '',
    },
    Documentos: {
      resumenDocumental: '',
      pendientesFirma: '',
      observacionesDocumentales: '',
    },
  };
}

export async function seedEncounterRecords({ prisma, ctx }: SeedDeps) {
  const defaultOutpatientSections = buildOutpatientSections();

  await prisma.encounterProfile.createMany({
    data: [
      {
        id: randomUUID(),
        tenantId: ctx.ids.tenants.nova,
        encounterId: ctx.ids.encounters.anaConsult,
        encounterType: EncounterType.OUTPATIENT,
        sectionsJson: defaultOutpatientSections,
        alertsJson: ['Alergia relevante: Penicilina'],
      },
      {
        id: randomUUID(),
        tenantId: ctx.ids.tenants.horizonte,
        encounterId: ctx.ids.encounters.carlosConsult,
        encounterType: EncounterType.OUTPATIENT,
        sectionsJson: defaultOutpatientSections,
        alertsJson: [],
      },
    ],
  });

  await prisma.encounterSectionRecord.createMany({
    data: [
      {
        id: randomUUID(),
        tenantId: ctx.ids.tenants.nova,
        encounterId: ctx.ids.encounters.anaConsult,
        patientId: ctx.ids.patients.ana,
        encounterType: EncounterType.OUTPATIENT,
        tabKey: 'Consulta actual',
        noteType: 'Nota de consulta',
        title: 'Nota de consulta externa — valoración inicial',
        status: EncounterRecordStatus.SIGNED,
        recordedAt: ctx.dates.anaEncounterOpen,
        authoredByUserId: ctx.ids.users.valeria,
        formDataJson: {
          tipoConsulta: 'PRIMERA_VEZ',
          motivoConsulta: 'Valoración inicial por masa mamaria detectada en autoexploración.',
          padecimientoActualConsulta:
            'Paciente refiere 3 semanas de evolución sin dolor intenso ni secreción.',
          antecedentesReferencia: 'Madre con antecedente de cáncer de mama.',
          signosVitalesConsulta: 'PA 118/76, FC 74, FR 18, Temp 36.6',
          exploracionFisicaConsulta:
            'Nódulo palpable en cuadrante superoexterno de mama izquierda.',
          impresionDiagnostica: 'Lesión mamaria en estudio. BI-RADS pendiente.',
          planTerapeuticoConsulta:
            'Solicitar imagen mamaria, biopsia guiada y control con oncología.',
          consentimientoInformado: 'Paciente acepta plan diagnóstico y seguimiento.',
          redFlags: 'Crecimiento rápido, retracción cutánea o secreción sanguinolenta.',
          impactoFuncional: 'Ansiedad moderada por incertidumbre diagnóstica.',
          adherenciaTratamiento: 'Buena disposición al seguimiento.',
        },
      },
      {
        id: randomUUID(),
        tenantId: ctx.ids.tenants.nova,
        encounterId: ctx.ids.encounters.anaConsult,
        patientId: ctx.ids.patients.ana,
        encounterType: EncounterType.OUTPATIENT,
        tabKey: 'Receta / Indicaciones',
        noteType: 'Receta médica',
        title: 'Receta e indicaciones iniciales',
        status: EncounterRecordStatus.DRAFT,
        recordedAt: ctx.dates.anaEncounterClose,
        authoredByUserId: ctx.ids.users.valeria,
        formDataJson: {
          encabezadoReceta: 'Tratamiento sintomático y cuidados generales.',
          diagnosticoAsociado: 'Lesión mamaria en estudio.',
          prescripcion: 'Paracetamol 500 mg VO cada 8 horas PRN dolor.',
          validacionesSeguridad: 'Sin alergia a paracetamol. Confirmar tolerancia digestiva.',
          indicacionesSignosAlarma:
            'Acudir si presenta fiebre, eritema importante o aumento acelerado del nódulo.',
          datosLegalesReceta: 'Cédula profesional visible y receta simple.',
          educacionPaciente: 'Se explica autoexploración y necesidad de estudios complementarios.',
          planSeguimiento: 'Cita de control en 7 días con resultados de gabinete.',
        },
      },
      {
        id: randomUUID(),
        tenantId: ctx.ids.tenants.horizonte,
        encounterId: ctx.ids.encounters.carlosConsult,
        patientId: ctx.ids.patients.carlos,
        encounterType: EncounterType.OUTPATIENT,
        tabKey: 'Evolución',
        noteType: 'Nota de evolución',
        title: 'Evolución — control gastrointestinal',
        status: EncounterRecordStatus.DRAFT,
        recordedAt: ctx.dates.carlosEncounterClose,
        authoredByUserId: ctx.ids.users.ernesto,
        formDataJson: {
          fechaEvolucion: ctx.dates.carlosEncounterClose.toISOString(),
          estadoClinicoGeneral: 'ESTABLE',
          subjetivo: 'Persistencia de reflujo nocturno, mejoría parcial con dieta.',
          objetivo:
            'Abdomen blando, sin datos de irritación peritoneal. Signos vitales estables.',
          analisisDiagnostico:
            'ERGE probable y dispepsia funcional. Se descartan datos de abdomen agudo.',
          planEvolucion:
            'Ajuste de inhibidor de bomba, medidas higiénico-dietéticas y control.',
          comparacionEvolucionPrevia: 'Mejoría ligera respecto a visita previa.',
          respuestaTratamiento: 'Respuesta parcial al esquema previo.',
          escalasClinicas: 'Sin escalas aplicadas.',
        },
      },
    ],
  });
}
