import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ATTACHMENT_REPOSITORY } from '../../../shared/persistence/tokens/attachment.token';
import { PATIENT_REPOSITORY } from '../../../shared/persistence/tokens/patient.token';
import type { AttachmentRepository } from '../../../shared/persistence/repositories/attachment.repository';
import type { PatientRepository } from '../../../shared/persistence/repositories/patient.repository';
import { S3StorageService } from '../../../shared/storage/s3-storage.service';

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class PatientAttachmentsService {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepository,
    private readonly s3: S3StorageService,
  ) {}

  async uploadAttachmentsForTenant(
    tenantId: string,
    userId: string,
    patientId: string,
    files: UploadedAttachmentFile[],
  ) {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient || patient.tenantId !== tenantId) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (!files.length) {
      throw new BadRequestException('Selecciona al menos un archivo');
    }

    const results: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: string;
      uploadedAt: string;
    }> = [];

    for (const file of files) {
      if (!file.buffer?.length) {
        throw new BadRequestException(
          'Uno de los archivos no contiene datos válidos',
        );
      }

      const key = `patients/${tenantId}/${patientId}/${randomUUID()}-${this.sanitizeFileName(file.originalname)}`;
      await this.s3.upload(key, file.buffer, file.mimetype);

      const attachment = await this.attachmentRepository.create({
        tenant: { connect: { id: tenantId } },
        patient: { connect: { id: patientId } },
        fileName: file.originalname,
        mimeType: file.mimetype,
        storageKey: key,
        fileSizeBytes: BigInt(file.size),
        uploadedByUser: { connect: { id: userId } },
        metadataJson: {
          origin: 'patient-profile',
          section: 'documentos',
        },
      });

      results.push({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSizeBytes: attachment.fileSizeBytes.toString(),
        uploadedAt: attachment.uploadedAt.toISOString(),
      });
    }

    return results;
  }

  async deleteAttachmentForTenant(
    tenantId: string,
    patientId: string,
    attachmentId: string,
  ) {
    const attachment = await this.attachmentRepository.findById(attachmentId);

    if (
      !attachment ||
      attachment.tenantId !== tenantId ||
      attachment.patientId !== patientId
    ) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.attachmentRepository.delete(attachmentId);
    await this.s3.delete(attachment.storageKey);

    return { success: true };
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
