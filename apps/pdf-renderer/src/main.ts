import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { configureApp } from "./app-setup"

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  configureApp(app)
  const port = Number(process.env.PORT) || 3001
  await app.listen(port)
  new Logger("Bootstrap").log(`pdf-renderer listening on port ${port}`)
}

void bootstrap()
