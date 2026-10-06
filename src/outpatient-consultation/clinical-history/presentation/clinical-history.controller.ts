import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { ClinicalHistoryService } from '../application/services/clinical-history.service';
import { SaveClinicalHistoryDraftDto } from '../application/dto/save-clinical-history-draft.dto';

@Controller('encounters/:encounterNumber/clinical-history')
@UseGuards(JwtAuthGuard)
export class ClinicalHistoryController {
  constructor(private readonly clinicalHistoryService: ClinicalHistoryService) {}

  @Get()
  getDetail(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.clinicalHistoryService.getDetail(
      request.user.tenantId,
      encounterNumber,
    );
  }

  @Post('draft')
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SaveClinicalHistoryDraftDto,
  ) {
    return this.clinicalHistoryService.saveDraft(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }

  @Post('finalize')
  finalize(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.clinicalHistoryService.finalize(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
    );
  }

  @Post('new-version')
  createNewVersion(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SaveClinicalHistoryDraftDto,
  ) {
    return this.clinicalHistoryService.createNewVersion(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }
}
