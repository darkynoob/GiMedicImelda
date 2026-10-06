import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { EvolutionNoteService } from '../application/services/evolution-note.service';
import { SaveEvolutionNoteDraftDto } from '../application/dto/save-evolution-note-draft.dto';

@Controller('encounters/:encounterNumber/evolution-notes')
@UseGuards(JwtAuthGuard)
export class EvolutionNoteController {
  constructor(private readonly evolutionNoteService: EvolutionNoteService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.evolutionNoteService.listByEncounter(
      request.user.tenantId,
      encounterNumber,
    );
  }

  @Get(':noteId')
  getDetail(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('noteId') noteId: string,
  ) {
    return this.evolutionNoteService.getNoteDetail(
      request.user.tenantId,
      encounterNumber,
      noteId,
    );
  }

  @Post()
  createNote(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: SaveEvolutionNoteDraftDto,
  ) {
    return this.evolutionNoteService.createNote(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }

  @Post(':noteId/draft')
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('noteId') noteId: string,
    @Body() input: SaveEvolutionNoteDraftDto,
  ) {
    return this.evolutionNoteService.saveDraft(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      noteId,
      input,
    );
  }

  @Post(':noteId/finalize')
  finalize(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('noteId') noteId: string,
  ) {
    return this.evolutionNoteService.finalize(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      noteId,
    );
  }

  @Post(':noteId/new-version')
  createNewVersion(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('noteId') noteId: string,
    @Body() input: SaveEvolutionNoteDraftDto,
  ) {
    return this.evolutionNoteService.createNewVersion(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      noteId,
      input,
    );
  }
}
