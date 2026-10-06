import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { EpisodeSummaryService } from '../application/services/episode-summary.service';

@Controller('encounters/:encounterNumber/summary')
@UseGuards(JwtAuthGuard)
export class EpisodeSummaryController {
  constructor(private readonly episodeSummaryService: EpisodeSummaryService) {}

  @Get()
  getSummary(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.episodeSummaryService.getSummary(request.user.tenantId, encounterNumber);
  }
}
