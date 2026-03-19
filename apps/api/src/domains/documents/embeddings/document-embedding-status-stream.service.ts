import type { DocumentEmbeddingStatusChangedEventDto } from "@caseai-connect/api-contracts"
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common"
import { Client } from "pg"
import { type Observable, Subject } from "rxjs"
import { DOCUMENT_EMBEDDING_STATUS_CHANGED_CHANNEL } from "./document-embedding-status.constants"

@Injectable()
export class DocumentEmbeddingStatusStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentEmbeddingStatusStreamService.name)
  private readonly eventsSubject = new Subject<DocumentEmbeddingStatusChangedEventDto>()
  private listenerClient: Client | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isShuttingDown = false

  get events$(): Observable<DocumentEmbeddingStatusChangedEventDto> {
    return this.eventsSubject.asObservable()
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === "test") return
    await this.connectAndListen()
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.listenerClient) {
      await this.listenerClient.end().catch(() => undefined)
      this.listenerClient = null
    }
    this.eventsSubject.complete()
  }

  private async connectAndListen(): Promise<void> {
    const databasePort = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined
    const listenerClient = new Client({
      host: process.env.DATABASE_HOST,
      port: databasePort,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    })

    listenerClient.on("notification", (notification) => {
      console.log("NOTIFICATION", notification)
      if (!notification.payload) return
      try {
        const parsedPayload = JSON.parse(
          notification.payload,
        ) as DocumentEmbeddingStatusChangedEventDto
        if (parsedPayload.type !== "document_embedding_status_changed") return
        this.eventsSubject.next(parsedPayload)
      } catch (error) {
        this.logger.warn(
          `Failed to parse document embedding status event payload: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    })

    listenerClient.on("error", (error) => {
      this.logger.error(`Document embedding status listener error: ${error.message}`)
      this.scheduleReconnect()
    })

    listenerClient.on("end", () => {
      this.logger.warn("Document embedding status listener ended")
      this.scheduleReconnect()
    })

    try {
      await listenerClient.connect()
      await listenerClient.query(`LISTEN ${DOCUMENT_EMBEDDING_STATUS_CHANGED_CHANNEL}`)
      this.listenerClient = listenerClient
      this.logger.log(
        `Listening for document embedding status events on ${DOCUMENT_EMBEDDING_STATUS_CHANGED_CHANNEL}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to connect document embedding status listener: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      await listenerClient.end().catch(() => undefined)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown) return
    if (this.reconnectTimeout) return
    if (this.listenerClient) {
      void this.listenerClient.end().catch(() => undefined)
      this.listenerClient = null
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      void this.connectAndListen()
    }, 2000)
  }
}
