import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { MongoExceptionFilter } from './filters/mongo-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:8080', // your frontend origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // credentials: true, // if you're using cookies
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // transform: true,
      // whitelist: true,
      // forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => Object.values(err.constraints ?? {}).join(', '));
        return new Error(messages.join(' - '));
      },
    }),
  );
  app.useGlobalFilters(new MongoExceptionFilter());
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;

  const config = new DocumentBuilder()
    .setTitle('HustTicketing API')
    .setDescription('HustTicketing API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port);

  console.log(`Application is running on port: ${port}`);
}

bootstrap();
