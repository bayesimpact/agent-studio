import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { AIService } from '../ai/ai.service';
import { ChatSession } from '../chat/models/chat-session.model';
import { Message } from '../chat/models/message.model';

interface PrendresoinSession {
  id: string;
  messages: Message[];
  country: 'fr';
  createdAt: Date;
}

@Injectable()
export class PrendresoinService {
  private sessions: Map<string, PrendresoinSession> = new Map();

  constructor(private aiService: AIService) {}

  async createSession(): Promise<PrendresoinSession> {
    const sessionId = v4();
    const initialMessage = new Message(
      v4(),
      "Bienvenue sur Prendre Soin! Comment puis-je vous aider aujourd'hui?",
      'assistant',
      new Date(),
    );

    const session: PrendresoinSession = {
      id: sessionId,
      messages: [initialMessage],
      country: 'fr',
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  handleMessageStream(
    sessionId: string,
    content: string,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const session = this.sessions.get(sessionId);
          if (!session) {
            subscriber.next({
              data: JSON.stringify({
                type: 'error',
                error: `Session ${sessionId} not found`,
              }),
            } as MessageEvent);
            subscriber.complete();
            return;
          }

          // Add user message to session
          const userMessage = new Message(
            v4(),
            content,
            'user',
            new Date(),
          );
          session.messages.push(userMessage);

          const messageId = v4();
          const timestamp = new Date();

          // Send start event
          subscriber.next({
            data: JSON.stringify({
              type: 'start',
              messageId,
              timestamp: timestamp.toISOString(),
            }),
          } as MessageEvent);

          // Create ChatSession from current session
          const chatSession = new ChatSession(
            session.id,
            session.messages,
            session.country,
            session.createdAt,
          );

          // Define system prompt for Prendre Soin
          const masterPrompt = `Today's date: ${new Date().toString()}

## Persona and Objective
You are Prendre Soin, a compassionate and supportive AI assistant focused on caregiving and wellbeing.
You provide helpful, empathetic guidance to people caring for loved ones or seeking support for their own wellbeing.

## Communication Style
- Be warm, empathetic, and non-judgmental
- Provide practical, actionable advice
- Listen carefully and validate emotions
- Offer encouragement and support
- Use clear, accessible language in French

## Scope
You can help with:
- Caregiving advice and resources
- Self-care and wellbeing tips
- Emotional support and active listening
- Information about available support services
- Practical guidance for daily challenges

Always prioritize safety and encourage users to seek professional help when needed.`;

          // Stream AI response
          let fullText = '';
          const streamGenerator = this.aiService.generateChatStream({
            chatSession,
            masterPrompt,
          });

          for await (const chunk of streamGenerator) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              subscriber.next({
                data: JSON.stringify({
                  type: 'chunk',
                  messageId,
                  content: text,
                }),
              } as MessageEvent);
            }
          }

          // Add assistant message to session
          const assistantMessage = new Message(
            messageId,
            fullText,
            'assistant',
            timestamp,
          );
          session.messages.push(assistantMessage);

          // Send end event
          subscriber.next({
            data: JSON.stringify({
              type: 'end',
              messageId,
            }),
          } as MessageEvent);

          subscriber.complete();
        } catch (error) {
          console.error('Error in message stream:', error);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              error: 'An error occurred',
            }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }
}
