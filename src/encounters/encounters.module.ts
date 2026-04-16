import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EncountersService } from './application/services/encounters.service';
import { EncountersController } from './presentation/encounters.controller';

@Module({
  imports: [AuthModule],
  controllers: [EncountersController],
  providers: [EncountersService],
  exports: [EncountersService],
})
export class EncountersModule {}
