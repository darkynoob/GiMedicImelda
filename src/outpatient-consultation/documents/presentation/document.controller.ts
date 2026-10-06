import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../auth/application/interfaces/authenticated-request.interface';
import { DocumentService } from '../application/services/document.service';
import { CreateDocumentDto } from '../application/dto/create-document.dto';
import { SaveDocumentContentDto } from '../application/dto/save-document-content.dto';

@Controller('encounters/:encounterNumber/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
  ) {
    return this.documentService.list(request.user.tenantId, encounterNumber);
  }

  @Get(':documentId')
  getDetail(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.getDetail(
      request.user.tenantId,
      encounterNumber,
      documentId,
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Body() input: CreateDocumentDto,
  ) {
    const { documentTypeCode, ...content } = input;
    return this.documentService.create(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      documentTypeCode,
      content,
    );
  }

  @Post(':documentId/draft')
  saveDraft(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('documentId') documentId: string,
    @Body() input: SaveDocumentContentDto,
  ) {
    return this.documentService.saveDraft(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      documentId,
      input,
    );
  }

  @Post(':documentId/finalize')
  finalize(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.finalize(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      documentId,
    );
  }

  @Post(':documentId/new-version')
  createNewVersion(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('documentId') documentId: string,
    @Body() input: SaveDocumentContentDto,
  ) {
    return this.documentService.createNewVersion(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      documentId,
      input,
    );
  }

  @Post(':documentId/download')
  registerDownload(
    @Req() request: AuthenticatedRequest,
    @Param('encounterNumber') encounterNumber: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.registerOfficialDownload(
      request.user.tenantId,
      request.user.sub,
      encounterNumber,
      documentId,
    );
  }
}
