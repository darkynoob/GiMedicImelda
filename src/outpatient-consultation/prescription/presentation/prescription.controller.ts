import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { PrescriptionService } from '../application/services/prescription.service';
import { SavePrescriptionDraftDto } from '../application/dto/save-prescription-draft.dto';

@Controller('encounters/:encounterNumber/prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.prescriptionService.listByEncounter(
      request.user.tenantId,
      encounterNumber,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SavePrescriptionDraftDto,
  ) {
    return this.prescriptionService.createPrescription(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }

  @Post(':prescriptionId/draft')
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() input: SavePrescriptionDraftDto,
  ) {
    return this.prescriptionService.saveDraft(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      prescriptionId,
      input,
    );
  }

  @Post(':prescriptionId/finalize')
  finalize(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.prescriptionService.finalize(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      prescriptionId,
    );
  }

  @Post(':prescriptionId/new-version')
  createNewVersion(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() input: SavePrescriptionDraftDto,
  ) {
    return this.prescriptionService.createNewVersion(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      prescriptionId,
      input,
    );
  }

  @Post(':prescriptionId/versions/:versionId/download')
  registerDownload(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('prescriptionId') prescriptionId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.prescriptionService.registerOfficialDownload(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      prescriptionId,
      versionId,
    );
  }
}
