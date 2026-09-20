import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export function setupApiDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("ProjeX API")
    .setDescription(
      "Project Management System API - built with NestJS",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addServer("/api")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
}
