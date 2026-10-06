import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { ConsultationNoteService } from '../application/services/consultation-note.service';
import { SaveConsultationNoteDraftDto } from '../application/dto/save-consultation-note-draft.dto';

@Controller('encounters/:encounterNumber/consultation-note')
@UseGuards(JwtAuthGuard)
export class ConsultationNoteController {
  constructor(private readonly consultationNoteService: ConsultationNoteService) {}

  @Get()
  getDetail(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.consultationNoteService.getDetail(
      request.user.tenantId,
      encounterNumber,
    );
  }

  @Post('draft')
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SaveConsultationNoteDraftDto,
  ) {
    return this.consultationNoteService.saveDraft(
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
    return this.consultationNoteService.finalize(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
    );
  }

  @Post('new-version')
  createNewVersion(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SaveConsultationNoteDraftDto,
  ) {
    return this.consultationNoteService.createNewVersion(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }
}
