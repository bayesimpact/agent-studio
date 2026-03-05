import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { WorkersAppModule } from "./workers-app.module"

async function bootstrapWorkersMain() {
  await NestFactory.createApplicationContext(WorkersAppModule)
  Logger.log("Workers app started", "WorkersMain")
}

void bootstrapWorkersMain()
