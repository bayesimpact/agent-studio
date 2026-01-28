import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:5173",
      "https://caseai-connect-web.vercel.app",
      "https://connect-web-flax.vercel.app",
      "https://connect.caseai.org",
    ],
    credentials: true,
  })
  await app.listen(3000)
}

void bootstrap()
