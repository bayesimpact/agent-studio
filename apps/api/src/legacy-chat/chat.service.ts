import type { FunctionCall, GenerateContentResponse, ToolListUnion } from "@google/genai"
import { Injectable, type MessageEvent } from "@nestjs/common"
import { Observable, type Subscriber } from "rxjs" // import type { Action } from "src/action-plan-builder/action-plan-builder.abstract"
import { v4 } from "uuid"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AIService } from "../ai/ai.service"
import type { AIServiceProvider } from "../common/interfaces/ai-service.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatRepository } from "./chat.repository"
import { ChatSession } from "./models/chat-session.model"
import { Message } from "./models/message.model"

@Injectable()
export class ChatService {
  private serviceProviders: Map<string, AIServiceProvider> = new Map()
  private tools: ToolListUnion

  constructor(
    private aiService: AIService,
    private chatRepository: ChatRepository,
  ) {
    // Build tools from all registered providers
    const allDeclarations = [
      ...Array.from(this.serviceProviders.values()).map((p) => p.getFunctionDeclaration()),
    ]

    this.tools = [
      {
        functionDeclarations: allDeclarations,
      },
    ]
  }

  private registerServiceProvider(provider: AIServiceProvider): void {
    const declaration = provider.getFunctionDeclaration()
    if (!declaration.name) {
      throw new Error("Function declaration name is required")
    }
    this.serviceProviders.set(declaration.name, provider)
    this.aiService.registerServiceProvider(provider)
  }

  /**
   * Process function calls from LLM response
   * Follows proper conversational flow: assistant (with tool_calls) → tool → assistant (answer)
   * IMPORTANT: All tool responses must be added before saving to maintain proper message pairing
   */
  private async processFunctionCalls(
    functionCalls: FunctionCall[],
    session: ChatSession,
    toolCallsMessageId: string,
    subscriber: Subscriber<MessageEvent>,
  ): Promise<ChatSession> {
    const updatedSession = session

    // Check if we have any backend function calls (that need cityName for geolocation)
    const backendFunctionCalls = functionCalls.filter(
      (fc) => fc.name && this.serviceProviders.has(fc.name),
    )

    const functionCallsData = functionCalls.map((fc) => ({
      name: fc.name,
      args: fc.args,
    }))
    console.log("functionCallsData", backendFunctionCalls)

    // Notify frontend about function calls
    subscriber.next({
      data: JSON.stringify({
        type: "function_calls",
        messageId: toolCallsMessageId,
        functionCalls: functionCallsData,
      }),
    } as MessageEvent)

    // Process backend function calls
    if (backendFunctionCalls.length > 0) {
      for (let i = 0; i < backendFunctionCalls.length; i++) {
        const functionCall = backendFunctionCalls[i]

        // a function call without a name is not valid
        if (!functionCall?.name) continue

        const provider = this.serviceProviders.get(functionCall.name)
        if (provider) {
          // TODO: Implement function call processing
          // // Create progress callback for action plan builder
          // const options =
          //   functionCall.name === "build_action_plan"
          //     ? {
          //         onProgress: (message: string) => {
          //           subscriber.next({
          //             data: JSON.stringify({
          //               type: "action_plan_progress",
          //               messageId: toolCallsMessageId,
          //               message,
          //             }),
          //           } as MessageEvent)
          //         },
          //       }
          //     : undefined
          // const result = (await provider.executeFunction(functionCall, options)) as {
          //   success: boolean
          //   actionPlan: Action[]
          //   message: string
          // }
          // // Check if this is an action plan builder result and stream it to frontend
          // if (functionCall.name === "build_action_plan" && result.actionPlan) {
          //   subscriber.next({
          //     data: JSON.stringify({
          //       type: "action_plan_update",
          //       messageId: toolCallsMessageId,
          //       actionPlan: result.actionPlan,
          //     }),
          //   } as MessageEvent)
          // }
          // // Add tool response message with proper tool_call_id
          // updatedSession = updatedSession.addToolResponse(functionCall.name, {
          //   result,
          // })
          // // DO NOT save yet - we need all tool responses before saving
        } else {
          console.warn(`No provider found for function: ${functionCall.name}`)
        }
      }
    }

    // NOW save once with all tool responses
    this.chatRepository.save(updatedSession)

    return updatedSession
  }

  async createSession(country: "fr" | "us"): Promise<ChatSession> {
    const sessionId = v4()
    const initialMessage = new Message(
      v4(),
      country === "fr" ? "Comment puis-je vous aider aujourd'hui ?" : "How can I assist you today?",
      "assistant",
      new Date(),
    )
    const session = new ChatSession(sessionId, [initialMessage], country, new Date())
    this.chatRepository.save(session)
    return session
  }

  handleMessageStream(sessionId: string, content: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      ;(async () => {
        try {
          const session = this.chatRepository.findById(sessionId)
          if (!session) {
            subscriber.error(new Error(`Session ${sessionId} not found`))
            return
          }
          console.log(`Processing message for country: ${session.country}`)

          const userMessage = new Message(v4(), content, "user", new Date())
          let updatedSession = session.addMessage(userMessage)
          this.chatRepository.save(updatedSession)

          const messageId = v4()
          const timestamp = new Date()

          // Calculate turn number: count user messages in the session
          const turnNumber = updatedSession.messages.filter((m) => m.sender === "user").length

          // Send start event
          subscriber.next({
            data: JSON.stringify({
              type: "start",
              messageId,
              timestamp: timestamp.toISOString(),
            }),
          } as MessageEvent)

          let fullText = ""

          const streamGenerator = this.aiService.generateContentStream({
            chatSession: updatedSession,
            tools: this.tools,
            turnNumber,
          })

          let lastChunk: GenerateContentResponse | undefined
          for await (const chunk of streamGenerator) {
            lastChunk = chunk
            const chunkText = chunk.text || ""
            fullText += chunkText

            subscriber.next({
              data: JSON.stringify({
                type: "chunk",
                content: chunkText,
                messageId,
              }),
            } as MessageEvent)
          }

          if (lastChunk?.functionCalls && lastChunk.functionCalls.length > 0) {
            const toolCallsData = lastChunk.functionCalls
              .map((fc) => {
                if (!fc.name || !fc.args) return undefined
                return {
                  id: v4(),
                  name: fc.name,
                  arguments: fc.args,
                }
              })
              .filter((tc) => tc !== undefined)

            const assistantToolCallMessage = new Message(
              messageId,
              null, // No text content yet
              "assistant",
              timestamp,
              toolCallsData,
            )
            console.info(assistantToolCallMessage)
            updatedSession = updatedSession.addMessage(assistantToolCallMessage)
            this.chatRepository.save(updatedSession)

            updatedSession = await this.processFunctionCalls(
              lastChunk.functionCalls,
              updatedSession,
              messageId,
              subscriber,
            )

            fullText = ""
            const secondStreamGenerator = this.aiService.generateContentStream({
              chatSession: updatedSession,
              tools: this.tools,
              turnNumber: turnNumber + 0.5, // Use .5 to indicate this is a follow-up within the same turn
            })

            let secondLastChunk: GenerateContentResponse | undefined
            for await (const chunk of secondStreamGenerator) {
              secondLastChunk = chunk
              const chunkText = chunk.text || ""
              fullText += chunkText

              subscriber.next({
                data: JSON.stringify({
                  type: "chunk",
                  content: chunkText,
                  messageId,
                }),
              } as MessageEvent)
            }

            // Handle function calls from second LLM call (e.g., display_action_plan after jobs_search)
            if (secondLastChunk?.functionCalls && secondLastChunk.functionCalls.length > 0) {
              // Save second assistant message with tool_calls
              const secondToolCallsData = secondLastChunk.functionCalls
                .map((fc) => {
                  if (!fc.name || !fc.args) return undefined
                  return {
                    name: fc.name,
                    arguments: fc.args,
                  }
                })
                .filter((tc) => tc !== undefined)

              const secondAssistantToolCallMessage = new Message(
                v4(),
                null,
                "assistant",
                new Date(),
                secondToolCallsData,
              )
              updatedSession = updatedSession.addMessage(secondAssistantToolCallMessage)
              this.chatRepository.save(updatedSession)

              // Execute second round of function calls
              updatedSession = await this.processFunctionCalls(
                secondLastChunk.functionCalls,
                updatedSession,
                messageId,
                subscriber,
              )
            }
          }

          // Save the final complete assistant message with text content
          if (fullText) {
            const assistantMessage = new Message(v4(), fullText, "assistant", new Date())
            updatedSession = updatedSession.addMessage(assistantMessage)
            this.chatRepository.save(updatedSession)
          }

          // Send end event
          subscriber.next({
            data: JSON.stringify({
              type: "end",
              messageId,
              fullContent: fullText,
              timestamp: timestamp.toISOString(),
            }),
          } as MessageEvent)

          subscriber.complete()
        } catch (error) {
          console.error("Error in message stream:", error)
          subscriber.next({
            data: JSON.stringify({
              type: "error",
              error: "Sorry, I encountered an error processing your request.",
            }),
          } as MessageEvent)
          subscriber.complete()
        }
      })()
    })
  }
}
