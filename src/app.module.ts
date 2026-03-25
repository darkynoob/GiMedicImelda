import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { PatientsModule } from './patients/patients.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { EncountersModule } from './encounters/encounters.module';
import { DocumentsModule } from './documents/documents.module';
import { ConsentsModule } from './consents/consents.module';
import { AuditsModule } from './audits/audits.module';
import { CatalogModule } from './catalog/catalog.module';
import { ConsultationsnestModule } from './g/consultationsnest/consultationsnest.module';
import { EmergencyModule } from './emergency/emergency.module';
import { HospitalizationModule } from './hospitalization/hospitalization.module';
import { NursingModule } from './nursing/nursing.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { SurgeryModule } from './surgery/surgery.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AiModule } from './ai/ai.module';
import { PersistenceModule } from './shared/persistence/persistence.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PersistenceModule,
    AuthModule,
    DashboardModule,
    UsersModule,
    TenantsModule,
    FacilitiesModule,
    PatientsModule,
    MedicalRecordsModule,
    EncountersModule,
    DocumentsModule,
    ConsentsModule,
    AuditsModule,
    CatalogModule,
    ConsultationsnestModule,
    EmergencyModule,
    HospitalizationModule,
    NursingModule,
    DiagnosticsModule,
    SurgeryModule,
    AttachmentsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
