import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de almacenamiento en AWS S3.
 * Abstrae las operaciones de subida y eliminación de archivos para que
 * los consumidores no dependan directamente del SDK de S3.
 */
@Injectable()
export class S3StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });

    this.bucket =
      this.configService.get<string>('AWS_S3_BUCKET') ?? 'gimedic-attachments';
  }

  /**
   * Sube un archivo al bucket de S3.
   * @param key  Ruta dentro del bucket, p.ej. `patients/{tenantId}/{patientId}/{uuid}-{name}`
   * @param body Buffer con el contenido del archivo
   * @param contentType MIME type del archivo
   * @returns La misma key para almacenarla en la base de datos
   */
  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.debug(`Archivo subido a S3: ${key}`);
    return key;
  }

  /**
   * Elimina un archivo del bucket de S3.
   * No lanza excepción si el archivo no existe (idempotente).
   * @param key Ruta del archivo dentro del bucket
   */
  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.debug(`Archivo eliminado de S3: ${key}`);
    } catch (error) {
      this.logger.warn(`No se pudo eliminar el archivo de S3 (${key}): ${error}`);
    }
  }
}
