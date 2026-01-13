import { Controller, type MessageEvent, Post, Query, Sse } from "@nestjs/common"
import type { Observable } from "rxjs"
import type { PrendresoinService } from "./prendresoin.service"

@Controller("prendresoin")
export class PrendresoinController {
  constructor(private readonly prendresoinService: PrendresoinService) {}

  @Post("create-session")
  async createSession(): Promise<{
    sessionId: string
    message: {
      id: string
      content: string
      sender: string
      timestamp: Date
    }
  }> {
    console.log("Creating new prendresoin session")
    const session = await this.prendresoinService.createSession()

    const initialMessage = session.messages[0]

    if (!initialMessage || !initialMessage.content) {
      throw new Error("Session created without initial message")
    }

    return {
      sessionId: session.id,
      message: {
        id: initialMessage.id,
        content: initialMessage.content,
        sender: initialMessage.sender,
        timestamp: initialMessage.timestamp,
      },
    }
  }

  @Sse("message-stream")
  streamMessage(
    @Query("sessionId") sessionId: string,
    @Query("content") content: string,
  ): Observable<MessageEvent> {
    console.log(`New message in session ${sessionId}: ${content}`)
    return this.prendresoinService.handleMessageStream(sessionId, content)
  }
}
