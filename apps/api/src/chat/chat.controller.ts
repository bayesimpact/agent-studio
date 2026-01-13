import { Controller, type MessageEvent, Post, Query, Sse } from "@nestjs/common"
import type { CreateChatSessionResponseDto } from "@repo/api"
import type { Observable } from "rxjs"
import type { ChatService } from "./chat.service"

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse("message-stream")
  streamMessage(
    @Query("sessionId") sessionId: string,
    @Query("content") content: string,
    @Query("country") country?: string,
  ): Observable<MessageEvent> {
    console.log(`new message ${sessionId}, country: ${country}`)
    return this.chatService.handleMessageStream(sessionId, content)
  }

  @Post("create-session")
  async createSession(
    @Query("country") country: "fr" | "us",
  ): Promise<CreateChatSessionResponseDto> {
    console.log(`create session, country: ${country}`)
    const chatSession = await this.chatService.createSession(country)

    const initialMessage = chatSession.messages[0]
    if (!initialMessage) {
      throw new Error("Session created without initial message")
    }

    return {
      sessionId: chatSession.id,
      message: {
        id: initialMessage.id,
        content: initialMessage.content,
        timestamp: initialMessage.timestamp,
        sender: initialMessage.sender,
      },
    }
  }
}
