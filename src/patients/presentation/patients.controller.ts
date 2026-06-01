import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../../auth/application/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/infrastructure/permissions.guard';
import { RequirePermissions } from '../../auth/infrastructure/decorators/require-permissions.decorator';
import { PatientsQueryDto } from '../application/dto/patients-query.dto';
import { PatientsService } from '../application/services/patients.service';
import { PatientSearchService } from '../application/services/patient-search.service';
import { PatientAttachmentsService } from '../application/services/patient-attachments.service';
import { CreatePatientDto } from '../create-patient.dto';
import { UpdatePatientDto } from '../update-patient.dto';

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientSearchService: PatientSearchService,
    private readonly patientAttachmentsService: PatientAttachmentsService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequirePermissions('patients.create')
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreatePatientDto,
  ) {
    return this.patientsService.createForTenant(
      request.user.tenantId,
      request.user.sub,
      input,
    );
  }

  @Get()
  @RequirePermissions('patients.read')
  list(@Req() request: AuthenticatedRequest, @Query() query: PatientsQueryDto) {
    return this.patientSearchService.listByTenant(request.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('patients.read')
  detail(@Req() request: AuthenticatedRequest, @Param('id') patientId: string) {
    return this.patientsService.getDetailByTenant(
      request.user.tenantId,
      patientId,
    );
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequirePermissions('patients.update')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') patientId: string,
    @Body() input: UpdatePatientDto,
  ) {
    return this.patientsService.updateForTenant(
      request.user.tenantId,
      patientId,
      input,
    );
  }

  @Post(':id/attachments')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @RequirePermissions('patients.attachments.manage')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadAttachments(
    @Req() request: AuthenticatedRequest,
    @Param('id') patientId: string,
    @UploadedFiles() files: UploadedAttachmentFile[],
  ) {
    return this.patientAttachmentsService.uploadAttachmentsForTenant(
      request.user.tenantId,
      request.user.sub,
      patientId,
      files,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  @RequirePermissions('patients.attachments.manage')
  removeAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('id') patientId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.patientAttachmentsService.deleteAttachmentForTenant(
      request.user.tenantId,
      patientId,
      attachmentId,
    );
  }
}
