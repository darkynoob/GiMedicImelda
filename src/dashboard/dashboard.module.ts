import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardService } from './application/services/dashboard.service';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
