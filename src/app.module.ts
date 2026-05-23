import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuditsModule } from './audits/audits.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ConsentsModule } from './consents/consents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { DocumentsModule } from './documents/documents.module';
import { EmergencyModule } from './emergency/emergency.module';
import { EncountersModule } from './encounters/encounters.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { ConsultationsnestModule } from './g/consultationsnest/consultationsnest.module';
import { HospitalizationModule } from './hospitalization/hospitalization.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { NursingModule } from './nursing/nursing.module';
import { PatientsModule } from './patients/patients.module';
import { PersistenceModule } from './shared/persistence/persistence.module';
import { SurgeryModule } from './surgery/surgery.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 120 }],
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
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
