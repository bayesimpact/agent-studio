'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Send, User, Bot, Briefcase } from 'lucide-react'
import { SendMessageDto } from '@repo/api/chat/dto/send-message.dto';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { ActionPlan } from './action-plan';
import { MentionInput, MentionInputRef } from './mention-input';

interface FunctionCallData {
  name: string
  args: Record<string, any>
}

type CTAType = 'url' | 'phone' | 'email'

interface CTA {
  name: string
  type: CTAType
  value: string
}

interface Action {
  id: string
  categories: string[]
  content: string
  title: string
  cta?: CTA
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant' | 'function'
  timestamp: Date
  functionCalls?: FunctionCallData[]
  isProcessingFunctions?: boolean
  isInitializing?: boolean
  isFinished?: boolean
  progressMessage?: string
  progressHistory?: string[]
  progressText?: string
  currentProgressTitle?: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())
  const [currentActionPlan, setCurrentActionPlan] = useState<Action[] | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<MentionInputRef>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/chat/create-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        setSessionId(data.sessionId)
        setMessages([
          {
            id: data.message.id,
            content: data.message.content,
            sender: data.message.sender,
            timestamp: new Date(data.message.timestamp),
            isFinished: true,
          },
        ])
      } catch (error) {
        console.error('Failed to create session:', error)
        setMessages([
          {
            id: '1',
            content: 'Failed to initialize chat. Please refresh the page.',
            sender: 'assistant',
            timestamp: new Date(),
            isFinished: true,
          },
        ])
      }
    }
    initializeSession()
    inputRef.current?.focus()
  }, [apiUrl])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Add immediate loading indicator
    const loadingMessageId = `loading-${Date.now()}`
    setMessages(prev => [
      ...prev,
      {
        id: loadingMessageId,
        content: '',
        sender: 'assistant',
        timestamp: new Date(),
        isInitializing: true,
      },
    ])

    try {
      const payload: SendMessageDto = {
        sessionId,
        content: userMessage.content,
      }

      // Use EventSource for SSE
      const eventSource = new EventSource(
        `${apiUrl}/chat/message-stream?${new URLSearchParams({
          sessionId: payload.sessionId,
          content: payload.content,
        })}`
      )

      let currentMessageId = ''
      let currentContent = ''

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'start':
              currentMessageId = data.messageId
              currentContent = ''
              // Replace loading message with actual message
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === loadingMessageId
                    ? {
                        id: currentMessageId,
                        content: '',
                        sender: 'assistant' as const,
                        timestamp: new Date(data.timestamp),
                        isInitializing: false,
                      }
                    : msg
                )
              )
              break

            case 'chunk':
              currentContent += data.content
              // Update the message with accumulated content and stop processing indicator
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === data.messageId
                    ? { ...msg, content: currentContent, isProcessingFunctions: false }
                    : msg
                )
              )
              break

            case 'function_calls':
              // Show backend function calls in the status box
              const backendFunctionCalls = data.functionCalls

              // Store function calls in the message and mark as processing
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === data.messageId
                    ? {
                        ...msg,
                        // Only show backend function calls in the status box
                        functionCalls: backendFunctionCalls?.length > 0 ? backendFunctionCalls : msg.functionCalls,
                        isProcessingFunctions: true,
                      }
                    : msg
                )
              )
              // Reset content for the next response after function calls
              currentContent = ''
              break

            case 'action_plan_progress':
              // Update progress message and accumulate markdown text
              if (data.message) {
                setMessages(prev =>
                  prev.map(msg => {
                    if (msg.id !== data.messageId) return msg

                    // Accumulate full progress text without extra newlines
                    const newProgressText = (msg.progressText || '') + data.message

                    // Extract the last markdown header (# Title) as current title
                    const headerMatch = data.message.match(/^#+\s+(.+)$/m)
                    const newTitle = headerMatch ? headerMatch[1] : msg.currentProgressTitle

                    return {
                      ...msg,
                      progressText: newProgressText,
                      currentProgressTitle: newTitle,
                      progressMessage: newTitle || data.message,
                    }
                  })
                )
              }
              break

            case 'action_plan_update':
              // Update the action plan from the function result
              if (data.actionPlan) {
                setCurrentActionPlan(data.actionPlan)
              }
              break

            case 'end':
              // Mark message as finished
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === data.messageId
                    ? { ...msg, isFinished: true, isProcessingFunctions: false }
                    : msg
                )
              )
              eventSource.close()
              setIsLoading(false)
              break

            case 'error':
              console.error('Stream error:', data.error)
              eventSource.close()
              setMessages(prev => [
                ...prev,
                {
                  id: Date.now().toString(),
                  content: data.error,
                  sender: 'assistant',
                  timestamp: new Date(),
                  isFinished: true,
                },
              ])
              setIsLoading(false)
              break
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      })

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        eventSource.close()
        if (isLoading) {
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: 'Sorry, something went wrong. Please try again.',
            sender: 'assistant',
            timestamp: new Date(),
            isFinished: true,
          }
          setMessages(prev => [...prev, errorMessage])
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, something went wrong. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        isFinished: true,
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Translate function names to French user-friendly labels
  const getFunctionLabel = (functionName: string): string => {
    const labels: Record<string, string> = {
      // 'fetch_beneficiary_profile': 'Récupération du profil dans Notion',
      'fetch_beneficiary_profile': 'Fetching profile in Notion',
    }
    return labels[functionName] || functionName
  }

  const formatFunctionCalls = (functionCalls: FunctionCallData[]): string => {
    if (functionCalls.length === 1 && functionCalls[0]) {
      return getFunctionLabel(functionCalls[0].name)
    }
    return functionCalls.map(fc => getFunctionLabel(fc.name)).join(', ')
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Auto-focus input when AI finishes responding
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  return (
    <div className="w-full h-[80vh] relative">
      {/* LEFT PANEL - Action Plan - Fixed position */}
      <div className="fixed left-4 top-[120px] w-96 h-[calc(80vh-40px)] z-10">
        <Card className="h-full flex flex-col bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            {/*<CardTitle className="text-lg font-bold">Plan d'action</CardTitle>*/}
            <CardTitle className="text-lg font-bold">Action plan</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {currentActionPlan && currentActionPlan.length > 0 ? (
                <ActionPlan planItems={currentActionPlan} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {/*Votre plan d'action apparaîtra ici une fois créé.*/}
                    Your action plan will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE PANEL - Chat Interface */}
      <div className="mx-auto max-w-4xl px-4" style={{ marginLeft: '416px' }}>
        <Card className="h-[80vh] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4 pt-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.sender === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Merged Message Content */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'max-w-xs lg:max-w-md xl:max-w-lg bg-primary text-primary-foreground ml-auto'
                        : 'w-full max-w-2xl bg-muted'
                    }`}
                  >
                    {/* Status Box - Shows loading/processing states or finished function calls */}
                    {message.sender === 'assistant' && (!message.isFinished || (message.functionCalls && message.functionCalls.length > 0)) && (
                      <div className="mb-3">
                        <div
                          className={`px-3 py-2 rounded-md border ${
                            message.functionCalls && message.functionCalls.length > 0
                              ? 'cursor-pointer transition-colors'
                              : ''
                          }`}
                          style={{
                            backgroundColor: 'var(--status-bg, #e9eeed)',
                            borderColor: 'var(--status-border, #bacfca)',
                          }}
                          onMouseEnter={(e) => {
                            if (message.functionCalls && message.functionCalls.length > 0 && !expandedFunctions.has(message.id)) {
                              e.currentTarget.style.setProperty('--status-bg', '#bacfca');
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (message.functionCalls && message.functionCalls.length > 0 && !expandedFunctions.has(message.id)) {
                              e.currentTarget.style.setProperty('--status-bg', '#e9eeed');
                            }
                          }}
                          onClick={(e) => {
                            if (message.functionCalls && message.functionCalls.length > 0) {
                              const newExpanded = new Set(expandedFunctions)
                              if (newExpanded.has(message.id)) {
                                newExpanded.delete(message.id)
                              } else {
                                newExpanded.add(message.id)
                                // Reset hover effect when opening
                                e.currentTarget.style.setProperty('--status-bg', '#e9eeed')
                              }
                              setExpandedFunctions(newExpanded)
                            }
                          }}
                        >
                          {/* Summary line */}
                          <div className="flex items-center gap-2">
                            {!message.isFinished && (
                              <div className="animate-spin w-3 h-3 border-2 rounded-full" style={{ borderColor: '#597f77', borderTopColor: 'transparent' }}></div>
                            )}
                            <span className="text-xs font-semibold" style={{ color: '#124742' }}>
                              {message.progressMessage ||
                               (message.isInitializing ? 'Processing request...' :
                                message.isProcessingFunctions && message.functionCalls ? `🔍 ${formatFunctionCalls(message.functionCalls)}...` :
                                message.isFinished && message.functionCalls ? `✓ ${formatFunctionCalls(message.functionCalls)}` :
                                message.content ? 'Replying...' :
                                'Processing...')}
                            </span>
                            {message.functionCalls && message.functionCalls.length > 0 && (
                              <span className="ml-auto text-xs" style={{ color: '#597f77' }}>
                                {expandedFunctions.has(message.id) ? '▼' : '▶'} Détails
                              </span>
                            )}
                          </div>

                          {/* Expandable details - show full progress markdown */}
                          {message.functionCalls && message.functionCalls.length > 0 && expandedFunctions.has(message.id) && (
                            <div className="mt-3 pt-2" style={{ borderTopWidth: '1px', borderTopColor: '#bacfca' }}>
                              {message.progressText ? (
                                <div className="text-xs markdown-content hide-code" style={{ color: '#597f77' }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                    {message.progressText}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <div className="text-xs" style={{ color: '#597f77' }}>
                                  {/*Aucune information de progression disponible*/}
                                  No progress information available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Text Content */}
                    {message.content && (
                      <>
                        <div className="text-sm markdown-content">
                          {message.sender === 'user' ? (
                            <p>{message.content}</p>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-6 pt-4 border-t">
            <div className="flex gap-2">
              <MentionInput
                ref={inputRef}
                value={inputValue}
                onChange={setInputValue}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                className="w-10 h-10 flex justify-center items-center px-2 rounded-full"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}