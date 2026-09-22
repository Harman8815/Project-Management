import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  ValidationPipe,
  VersioningType,
  Logger,
} from "@nestjs/common";
import { AppModule } from "./app.module";
import { setupApiDocs } from "./docs/api-documentation";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigin = process.env.CORS_ORIGIN || "*";
  app.enableCors({
    origin: corsOrigin,
    credentials: corsOrigin !== "*",
  });

  setupApiDocs(app);

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0", () => {
    Logger.log(`API Documentation available at http://localhost:${port}/api/docs`);
    Logger.log(`NestJS application running on port ${port}`);
  });
}
bootstrap();
