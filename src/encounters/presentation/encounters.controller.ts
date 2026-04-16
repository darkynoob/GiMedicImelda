import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/application/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CreateEncounterDto } from '../create-encounter.dto';
import { UpdateEncounterDto } from '../update-encounter.dto';
import { EncountersQueryDto } from '../application/dto/encounters-query.dto';
import { EncountersService } from '../application/services/encounters.service';

@Controller('encounters')
@UseGuards(JwtAuthGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: EncountersQueryDto,
  ) {
    return this.encountersService.listByTenant(request.user.tenantId, query);
  }

  @Get('meta')
  meta(@Req() request: AuthenticatedRequest) {
    return this.encountersService.getMetaByTenant(
      request.user.tenantId,
      request.user.sub,
    );
  }

  @Get(':encounterNumber')
  detail(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.encountersService.getDetailByTenant(
      request.user.tenantId,
      encounterNumber,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateEncounterDto,
  ) {
    return this.encountersService.createForTenant(
      {
        tenantId: request.user.tenantId,
        userId: request.user.sub,
      },
      input,
    );
  }

  @Patch(':encounterNumber')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: UpdateEncounterDto,
  ) {
    return this.encountersService.updateForTenant(
      request.user.tenantId,
      encounterNumber,
      input,
    );
  }
}
