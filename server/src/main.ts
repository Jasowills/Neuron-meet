import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const isProduction = configService.get<string>("NODE_ENV") === "production";

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN", "http://localhost:5173"),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix for API routes
  app.setGlobalPrefix("api");

  // Serve static files in production (client build)
  if (isProduction) {
    const clientPath = join(__dirname, "../..", "../client/dist");
    app.useStaticAssets(clientPath);
    app.setViewEngine("html");
  }

  await app.listen(port);
  console.log(`🚀 Neuron Meet server running on http://localhost:${port}`);
}

bootstrap();
