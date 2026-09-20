import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
  ValidationPipe,
  VersioningType,
  Logger,
} from "@nestjs/common";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { AppModule } from "./app.module";
import { setupApiDocs } from "./docs/api-documentation";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: "v",
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupApiDocs(app);

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0", () => {
    Logger.log(`API Documentation available at http://localhost:${port}/api/docs`);
    Logger.log(`NestJS application running on port ${port}`);
  });
}
bootstrap();
