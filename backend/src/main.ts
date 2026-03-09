import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ensure JSON bodies are parsed for all routes and preserve raw body for Stripe webhook signature verification.
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl?.includes('/payments/webhook')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('PhysioMatch API')
    .setDescription('API für die PhysioMatch Plattform - Freie Termine. Sofort gefunden.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentifizierung')
    .addTag('users', 'Benutzerverwaltung')
    .addTag('practices', 'Praxisverwaltung')
    .addTag('therapists', 'Therapeutenverwaltung')
    .addTag('appointments', 'Terminverwaltung')
    .addTag('availability', 'Verfügbarkeit')
    .addTag('payments', 'Zahlungen & Abonnements')
    .addTag('search', 'Suche nach freien Terminen')
    .addTag('health', 'Systemzustand')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 PhysioMatch API läuft auf: http://localhost:${port}`);
  console.log(`📚 API Dokumentation: http://localhost:${port}/api/docs`);
}

bootstrap();
