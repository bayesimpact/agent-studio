import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3002",
      "https://caseai-connect-web.vercel.app",
      "https://connect.caseai.org",
      "https://prendresoin-web.vercel.app",
      "https://prendresoin-web.vercel.app",
      "https://prendresoin.ft-qvr.connect.caseai.org",
      "https://prendresoin.francetravail.connect.caseai.org/",
    ],
    credentials: true,
  })
  await app.listen(3000)
}

void bootstrap()
