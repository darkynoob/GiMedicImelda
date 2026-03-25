import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/application/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { PatientsQueryDto } from '../application/dto/patients-query.dto';
import { PatientsService } from '../application/services/patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: PatientsQueryDto,
  ) {
    return this.patientsService.listByTenant(request.user.tenantId, query);
  }

  @Get(':id')
  detail(
    @Req() request: AuthenticatedRequest,
    @Param('id') patientId: string,
  ) {
    return this.patientsService.getDetailByTenant(
      request.user.tenantId,
      patientId,
    );
  }
}
