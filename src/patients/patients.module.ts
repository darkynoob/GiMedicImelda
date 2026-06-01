import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../shared/storage/storage.module';
import { PatientsService } from './application/services/patients.service';
import { PatientSearchService } from './application/services/patient-search.service';
import { PatientAttachmentsService } from './application/services/patient-attachments.service';
import { PatientsController } from './presentation/patients.controller';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientSearchService, PatientAttachmentsService],
  exports: [PatientsService, PatientSearchService, PatientAttachmentsService],
})
export class PatientsModule {}
