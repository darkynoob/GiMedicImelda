import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientsService } from './application/services/patients.service';
import { PatientsController } from './presentation/patients.controller';

@Module({
  imports: [AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
