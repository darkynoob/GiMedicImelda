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
import type { AuthenticatedRequest } from '../../auth/application/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CreateEncounterDto } from '../create-encounter.dto';
import { UpdateEncounterDto } from '../update-encounter.dto';
import { EncountersQueryDto } from '../application/dto/encounters-query.dto';
import { EncounterSectionRecordMutationDto } from '../application/dto/encounter-section-record.dto';
import { SignEncounterRecordDto } from '../application/dto/sign-encounter-record.dto';
import { EncountersService } from '../application/services/encounters.service';

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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

  @Post(':encounterNumber/records')
  createSectionRecord(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: EncounterSectionRecordMutationDto,
  ) {
    return this.encountersService.createSectionRecordForTenant(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      input,
    );
  }

  @Patch(':encounterNumber/records/:recordId')
  updateSectionRecord(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('recordId') recordId: string,
    @Body() input: EncounterSectionRecordMutationDto,
  ) {
    return this.encountersService.updateSectionRecordForTenant(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      recordId,
      input,
    );
  }

  @Post(':encounterNumber/records/:recordId/sign')
  signSectionRecord(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('recordId') recordId: string,
    @Body() input: SignEncounterRecordDto,
  ) {
    return this.encountersService.signSectionRecordForTenant(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      recordId,
      input.password,
    );
  }

  @Get(':encounterNumber/records/:recordId/pdf-preview')
  previewSectionRecordPdf(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('recordId') recordId: string,
  ) {
    return this.encountersService.previewSectionRecordPdfForTenant(
      request.user.tenantId,
      encounterNumber,
      recordId,
    );
  }

  @Post(':encounterNumber/records/:recordId/pdf-download')
  downloadSectionRecordPdf(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('recordId') recordId: string,
  ) {
    return this.encountersService.downloadSectionRecordPdfForTenant(
      request.user.tenantId,
      encounterNumber,
      recordId,
    );
  }

  @Post(':encounterNumber/attachments')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadAttachments(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @UploadedFiles() files: UploadedAttachmentFile[],
  ) {
    return this.encountersService.uploadAttachmentsForTenant(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      files,
    );
  }

  @Delete(':encounterNumber/attachments/:attachmentId')
  removeAttachment(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.encountersService.deleteAttachmentForTenant(
      request.user.tenantId,
      encounterNumber,
      attachmentId,
    );
  }
}
