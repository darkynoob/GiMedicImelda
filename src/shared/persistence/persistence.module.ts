import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { TENANT_REPOSITORY } from './tokens/tenant.token';
import { PrismaTenantRepository } from './repositories/tenant.repository';
import { SPECIALTY_REPOSITORY } from './tokens/specialty.token';
import { PrismaSpecialtyRepository } from './repositories/specialty.repository';
import { FACILITY_REPOSITORY } from './tokens/facility.token';
import { PrismaFacilityRepository } from './repositories/facility.repository';
import { SERVICEAREA_REPOSITORY } from './tokens/serviceArea.token';
import { PrismaServiceAreaRepository } from './repositories/serviceArea.repository';
import { USER_REPOSITORY } from './tokens/user.token';
import { PrismaUserRepository } from './repositories/user.repository';
import { ROLE_REPOSITORY } from './tokens/role.token';
import { PrismaRoleRepository } from './repositories/role.repository';
import { PERMISSION_REPOSITORY } from './tokens/permission.token';
import { PrismaPermissionRepository } from './repositories/permission.repository';
import { USERROLE_REPOSITORY } from './tokens/userRole.token';
import { PrismaUserRoleRepository } from './repositories/userRole.repository';
import { ROLEPERMISSION_REPOSITORY } from './tokens/rolePermission.token';
import { PrismaRolePermissionRepository } from './repositories/rolePermission.repository';
import { PATIENT_REPOSITORY } from './tokens/patient.token';
import { PrismaPatientRepository } from './repositories/patient.repository';
import { PATIENTIDENTIFIER_REPOSITORY } from './tokens/patientIdentifier.token';
import { PrismaPatientIdentifierRepository } from './repositories/patientIdentifier.repository';
import { MEDICALRECORD_REPOSITORY } from './tokens/medicalRecord.token';
import { PrismaMedicalRecordRepository } from './repositories/medicalRecord.repository';
import { ENCOUNTER_REPOSITORY } from './tokens/encounter.token';
import { PrismaEncounterRepository } from './repositories/encounter.repository';
import { DOCUMENTTYPE_REPOSITORY } from './tokens/documentType.token';
import { PrismaDocumentTypeRepository } from './repositories/documentType.repository';
import { CLINICALDOCUMENT_REPOSITORY } from './tokens/clinicalDocument.token';
import { PrismaClinicalDocumentRepository } from './repositories/clinicalDocument.repository';
import { DOCUMENTVERSION_REPOSITORY } from './tokens/documentVersion.token';
import { PrismaDocumentVersionRepository } from './repositories/documentVersion.repository';
import { DOCUMENTSIGNATURE_REPOSITORY } from './tokens/documentSignature.token';
import { PrismaDocumentSignatureRepository } from './repositories/documentSignature.repository';
import { DOCUMENTSTATUSHISTORY_REPOSITORY } from './tokens/documentStatusHistory.token';
import { PrismaDocumentStatusHistoryRepository } from './repositories/documentStatusHistory.repository';
import { VITALSIGN_REPOSITORY } from './tokens/vitalSign.token';
import { PrismaVitalSignRepository } from './repositories/vitalSign.repository';
import { DIAGNOSIS_REPOSITORY } from './tokens/diagnosis.token';
import { PrismaDiagnosisRepository } from './repositories/diagnosis.repository';
import { PROBLEM_REPOSITORY } from './tokens/problem.token';
import { PrismaProblemRepository } from './repositories/problem.repository';
import { ALLERGY_REPOSITORY } from './tokens/allergy.token';
import { PrismaAllergyRepository } from './repositories/allergy.repository';
import { MEDICATIONSTATEMENT_REPOSITORY } from './tokens/medicationStatement.token';
import { PrismaMedicationStatementRepository } from './repositories/medicationStatement.repository';
import { PROCEDURERECORD_REPOSITORY } from './tokens/procedureRecord.token';
import { PrismaProcedureRecordRepository } from './repositories/procedureRecord.repository';
import { LABREQUEST_REPOSITORY } from './tokens/labRequest.token';
import { PrismaLabRequestRepository } from './repositories/labRequest.repository';
import { LABRESULT_REPOSITORY } from './tokens/labResult.token';
import { PrismaLabResultRepository } from './repositories/labResult.repository';
import { IMAGINGREQUEST_REPOSITORY } from './tokens/imagingRequest.token';
import { PrismaImagingRequestRepository } from './repositories/imagingRequest.repository';
import { IMAGINGREPORT_REPOSITORY } from './tokens/imagingReport.token';
import { PrismaImagingReportRepository } from './repositories/imagingReport.repository';
import { NURSINGNOTE_REPOSITORY } from './tokens/nursingNote.token';
import { PrismaNursingNoteRepository } from './repositories/nursingNote.repository';
import { CONSENTFORM_REPOSITORY } from './tokens/consentForm.token';
import { PrismaConsentFormRepository } from './repositories/consentForm.repository';
import { DISCHARGE_REPOSITORY } from './tokens/discharge.token';
import { PrismaDischargeRepository } from './repositories/discharge.repository';
import { MPNOTIFICATION_REPOSITORY } from './tokens/mpNotification.token';
import { PrismaMpNotificationRepository } from './repositories/mpNotification.repository';
import { DEATHRECORD_REPOSITORY } from './tokens/deathRecord.token';
import { PrismaDeathRecordRepository } from './repositories/deathRecord.repository';
import { ATTACHMENT_REPOSITORY } from './tokens/attachment.token';
import { PrismaAttachmentRepository } from './repositories/attachment.repository';
import { AUDITLOG_REPOSITORY } from './tokens/auditLog.token';
import { PrismaAuditLogRepository } from './repositories/auditLog.repository';
import { PATIENT_COVERAGE_REPOSITORY } from './tokens/patientCoverage.token';
import { PrismaPatientCoverageRepository } from './repositories/patientCoverage.repository';
import { PATIENT_DOCUMENT_REPOSITORY } from './tokens/patientDocument.token';
import { PrismaPatientDocumentRepository } from './repositories/patientDocument.repository';
import { PATIENT_RESPONSIBLE_CONTACT_REPOSITORY } from './tokens/patientResponsibleContact.token';
import { PrismaPatientResponsibleContactRepository } from './repositories/patientResponsibleContact.repository';
import { PATIENT_DEMOGRAPHIC_PROFILE_REPOSITORY } from './tokens/patientDemographicProfile.token';
import { PrismaPatientDemographicProfileRepository } from './repositories/patientDemographicProfile.repository';
import { PATIENT_CLINICAL_PROFILE_REPOSITORY } from './tokens/patientClinicalProfile.token';
import { PrismaPatientClinicalProfileRepository } from './repositories/patientClinicalProfile.repository';
import { PATIENT_BILLING_PROFILE_REPOSITORY } from './tokens/patientBillingProfile.token';
import { PrismaPatientBillingProfileRepository } from './repositories/patientBillingProfile.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaTenantRepository,
    { provide: TENANT_REPOSITORY, useExisting: PrismaTenantRepository },
    PrismaSpecialtyRepository,
    { provide: SPECIALTY_REPOSITORY, useExisting: PrismaSpecialtyRepository },
    PrismaFacilityRepository,
    { provide: FACILITY_REPOSITORY, useExisting: PrismaFacilityRepository },
    PrismaServiceAreaRepository,
    {
      provide: SERVICEAREA_REPOSITORY,
      useExisting: PrismaServiceAreaRepository,
    },
    PrismaUserRepository,
    { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
    PrismaRoleRepository,
    { provide: ROLE_REPOSITORY, useExisting: PrismaRoleRepository },
    PrismaPermissionRepository,
    { provide: PERMISSION_REPOSITORY, useExisting: PrismaPermissionRepository },
    PrismaUserRoleRepository,
    { provide: USERROLE_REPOSITORY, useExisting: PrismaUserRoleRepository },
    PrismaRolePermissionRepository,
    {
      provide: ROLEPERMISSION_REPOSITORY,
      useExisting: PrismaRolePermissionRepository,
    },
    PrismaPatientRepository,
    { provide: PATIENT_REPOSITORY, useExisting: PrismaPatientRepository },
    PrismaPatientIdentifierRepository,
    {
      provide: PATIENTIDENTIFIER_REPOSITORY,
      useExisting: PrismaPatientIdentifierRepository,
    },
    PrismaMedicalRecordRepository,
    {
      provide: MEDICALRECORD_REPOSITORY,
      useExisting: PrismaMedicalRecordRepository,
    },
    PrismaEncounterRepository,
    { provide: ENCOUNTER_REPOSITORY, useExisting: PrismaEncounterRepository },
    PrismaDocumentTypeRepository,
    {
      provide: DOCUMENTTYPE_REPOSITORY,
      useExisting: PrismaDocumentTypeRepository,
    },
    PrismaClinicalDocumentRepository,
    {
      provide: CLINICALDOCUMENT_REPOSITORY,
      useExisting: PrismaClinicalDocumentRepository,
    },
    PrismaDocumentVersionRepository,
    {
      provide: DOCUMENTVERSION_REPOSITORY,
      useExisting: PrismaDocumentVersionRepository,
    },
    PrismaDocumentSignatureRepository,
    {
      provide: DOCUMENTSIGNATURE_REPOSITORY,
      useExisting: PrismaDocumentSignatureRepository,
    },
    PrismaDocumentStatusHistoryRepository,
    {
      provide: DOCUMENTSTATUSHISTORY_REPOSITORY,
      useExisting: PrismaDocumentStatusHistoryRepository,
    },
    PrismaVitalSignRepository,
    { provide: VITALSIGN_REPOSITORY, useExisting: PrismaVitalSignRepository },
    PrismaDiagnosisRepository,
    { provide: DIAGNOSIS_REPOSITORY, useExisting: PrismaDiagnosisRepository },
    PrismaProblemRepository,
    { provide: PROBLEM_REPOSITORY, useExisting: PrismaProblemRepository },
    PrismaAllergyRepository,
    { provide: ALLERGY_REPOSITORY, useExisting: PrismaAllergyRepository },
    PrismaMedicationStatementRepository,
    {
      provide: MEDICATIONSTATEMENT_REPOSITORY,
      useExisting: PrismaMedicationStatementRepository,
    },
    PrismaProcedureRecordRepository,
    {
      provide: PROCEDURERECORD_REPOSITORY,
      useExisting: PrismaProcedureRecordRepository,
    },
    PrismaLabRequestRepository,
    { provide: LABREQUEST_REPOSITORY, useExisting: PrismaLabRequestRepository },
    PrismaLabResultRepository,
    { provide: LABRESULT_REPOSITORY, useExisting: PrismaLabResultRepository },
    PrismaImagingRequestRepository,
    {
      provide: IMAGINGREQUEST_REPOSITORY,
      useExisting: PrismaImagingRequestRepository,
    },
    PrismaImagingReportRepository,
    {
      provide: IMAGINGREPORT_REPOSITORY,
      useExisting: PrismaImagingReportRepository,
    },
    PrismaNursingNoteRepository,
    {
      provide: NURSINGNOTE_REPOSITORY,
      useExisting: PrismaNursingNoteRepository,
    },
    PrismaConsentFormRepository,
    {
      provide: CONSENTFORM_REPOSITORY,
      useExisting: PrismaConsentFormRepository,
    },
    PrismaDischargeRepository,
    { provide: DISCHARGE_REPOSITORY, useExisting: PrismaDischargeRepository },
    PrismaMpNotificationRepository,
    {
      provide: MPNOTIFICATION_REPOSITORY,
      useExisting: PrismaMpNotificationRepository,
    },
    PrismaDeathRecordRepository,
    {
      provide: DEATHRECORD_REPOSITORY,
      useExisting: PrismaDeathRecordRepository,
    },
    PrismaAttachmentRepository,
    { provide: ATTACHMENT_REPOSITORY, useExisting: PrismaAttachmentRepository },
    PrismaAuditLogRepository,
    { provide: AUDITLOG_REPOSITORY, useExisting: PrismaAuditLogRepository },
    PrismaPatientCoverageRepository,
    {
      provide: PATIENT_COVERAGE_REPOSITORY,
      useExisting: PrismaPatientCoverageRepository,
    },
    PrismaPatientDocumentRepository,
    {
      provide: PATIENT_DOCUMENT_REPOSITORY,
      useExisting: PrismaPatientDocumentRepository,
    },
    PrismaPatientResponsibleContactRepository,
    {
      provide: PATIENT_RESPONSIBLE_CONTACT_REPOSITORY,
      useExisting: PrismaPatientResponsibleContactRepository,
    },
    PrismaPatientDemographicProfileRepository,
    {
      provide: PATIENT_DEMOGRAPHIC_PROFILE_REPOSITORY,
      useExisting: PrismaPatientDemographicProfileRepository,
    },
    PrismaPatientClinicalProfileRepository,
    {
      provide: PATIENT_CLINICAL_PROFILE_REPOSITORY,
      useExisting: PrismaPatientClinicalProfileRepository,
    },
    PrismaPatientBillingProfileRepository,
    {
      provide: PATIENT_BILLING_PROFILE_REPOSITORY,
      useExisting: PrismaPatientBillingProfileRepository,
    },
  ],
  exports: [
    PrismaService,
    PrismaTenantRepository,
    TENANT_REPOSITORY,
    PrismaSpecialtyRepository,
    SPECIALTY_REPOSITORY,
    PrismaFacilityRepository,
    FACILITY_REPOSITORY,
    PrismaServiceAreaRepository,
    SERVICEAREA_REPOSITORY,
    PrismaUserRepository,
    USER_REPOSITORY,
    PrismaRoleRepository,
    ROLE_REPOSITORY,
    PrismaPermissionRepository,
    PERMISSION_REPOSITORY,
    PrismaUserRoleRepository,
    USERROLE_REPOSITORY,
    PrismaRolePermissionRepository,
    ROLEPERMISSION_REPOSITORY,
    PrismaPatientRepository,
    PATIENT_REPOSITORY,
    PrismaPatientIdentifierRepository,
    PATIENTIDENTIFIER_REPOSITORY,
    PrismaMedicalRecordRepository,
    MEDICALRECORD_REPOSITORY,
    PrismaEncounterRepository,
    ENCOUNTER_REPOSITORY,
    PrismaDocumentTypeRepository,
    DOCUMENTTYPE_REPOSITORY,
    PrismaClinicalDocumentRepository,
    CLINICALDOCUMENT_REPOSITORY,
    PrismaDocumentVersionRepository,
    DOCUMENTVERSION_REPOSITORY,
    PrismaDocumentSignatureRepository,
    DOCUMENTSIGNATURE_REPOSITORY,
    PrismaDocumentStatusHistoryRepository,
    DOCUMENTSTATUSHISTORY_REPOSITORY,
    PrismaVitalSignRepository,
    VITALSIGN_REPOSITORY,
    PrismaDiagnosisRepository,
    DIAGNOSIS_REPOSITORY,
    PrismaProblemRepository,
    PROBLEM_REPOSITORY,
    PrismaAllergyRepository,
    ALLERGY_REPOSITORY,
    PrismaMedicationStatementRepository,
    MEDICATIONSTATEMENT_REPOSITORY,
    PrismaProcedureRecordRepository,
    PROCEDURERECORD_REPOSITORY,
    PrismaLabRequestRepository,
    LABREQUEST_REPOSITORY,
    PrismaLabResultRepository,
    LABRESULT_REPOSITORY,
    PrismaImagingRequestRepository,
    IMAGINGREQUEST_REPOSITORY,
    PrismaImagingReportRepository,
    IMAGINGREPORT_REPOSITORY,
    PrismaNursingNoteRepository,
    NURSINGNOTE_REPOSITORY,
    PrismaConsentFormRepository,
    CONSENTFORM_REPOSITORY,
    PrismaDischargeRepository,
    DISCHARGE_REPOSITORY,
    PrismaMpNotificationRepository,
    MPNOTIFICATION_REPOSITORY,
    PrismaDeathRecordRepository,
    DEATHRECORD_REPOSITORY,
    PrismaAttachmentRepository,
    ATTACHMENT_REPOSITORY,
    PrismaAuditLogRepository,
    AUDITLOG_REPOSITORY,
    PrismaPatientCoverageRepository,
    PATIENT_COVERAGE_REPOSITORY,
    PrismaPatientDocumentRepository,
    PATIENT_DOCUMENT_REPOSITORY,
    PrismaPatientResponsibleContactRepository,
    PATIENT_RESPONSIBLE_CONTACT_REPOSITORY,
    PrismaPatientDemographicProfileRepository,
    PATIENT_DEMOGRAPHIC_PROFILE_REPOSITORY,
    PrismaPatientClinicalProfileRepository,
    PATIENT_CLINICAL_PROFILE_REPOSITORY,
    PrismaPatientBillingProfileRepository,
    PATIENT_BILLING_PROFILE_REPOSITORY,
  ],
})
export class PersistenceModule {}
