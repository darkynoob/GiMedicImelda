import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function buildAllowedOrigins(): Set<string> {
  const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // These defaults keep local frontend work predictable even if the env file
  // misses one of the usual Vite or local-host combinations.
  const defaultDevelopmentOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4200',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:5173',
  ];

  return new Set([...defaultDevelopmentOrigins, ...configuredOrigins]);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = buildAllowedOrigins();
  const isDevelopment = (process.env.NODE_ENV ?? 'development') !== 'production';

  app.enableCors({
    origin(origin, callback) {
      if (isDevelopment) {
        callback(null, true);
        return;
      }

      // Requests from server tools or same-origin fetches may not send Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
