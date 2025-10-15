'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Send, User, Bot } from 'lucide-react'
import { SendMessageDto } from '@repo/api/chat/dto/send-message.dto';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { JobList } from './job-list';

interface FunctionCallData {
  name: string
  args: Record<string, any>
}

interface JobOffer {
  id: string
  title: string
  company: string
  location: string
  contractType?: string
  description?: string
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
  jobList?: JobOffer[]
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
              // Check if this is a joblist_display function call
              const joblistCall = data.functionCalls?.find((fc: FunctionCallData) => fc.name === 'joblist_display')

              // Filter out frontend-only function calls from display (they're shown visually instead)
              const backendFunctionCalls = data.functionCalls?.filter((fc: FunctionCallData) => fc.name !== 'joblist_display')

              // Store function calls in the message and mark as processing
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === data.messageId
                    ? {
                        ...msg,
                        // Only show backend function calls in the status box
                        functionCalls: backendFunctionCalls?.length > 0 ? backendFunctionCalls : msg.functionCalls,
                        isProcessingFunctions: true,
                        // Extract job list if it's a joblist_display call
                        jobList: joblistCall?.args?.jobs || msg.jobList
                      }
                    : msg
                )
              )
              // Reset content for the next response after function calls
              currentContent = ''
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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
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
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
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
                          if (message.functionCalls && message.functionCalls.length > 0) {
                            e.currentTarget.style.setProperty('--status-bg', '#bacfca');
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (message.functionCalls && message.functionCalls.length > 0) {
                            e.currentTarget.style.setProperty('--status-bg', '#e9eeed');
                          }
                        }}
                        onClick={() => {
                          if (message.functionCalls && message.functionCalls.length > 0) {
                            const newExpanded = new Set(expandedFunctions)
                            if (newExpanded.has(message.id)) {
                              newExpanded.delete(message.id)
                            } else {
                              newExpanded.add(message.id)
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
                            {message.isInitializing
                              ? 'Processing your request...'
                              : message.isProcessingFunctions && message.functionCalls
                              ? `Calling tools: ${message.functionCalls.map(fc => fc.name).join(', ')}...`
                              : message.isFinished && message.functionCalls
                              ? `✓ Called tools: ${message.functionCalls.map(fc => fc.name).join(', ')}`
                              : message.content
                              ? 'Answering...'
                              : 'Processing...'}
                          </span>
                          {message.functionCalls && message.functionCalls.length > 0 && (
                            <span className="ml-auto text-xs" style={{ color: '#597f77' }}>
                              {expandedFunctions.has(message.id) ? '▼' : '▶'} Show details
                            </span>
                          )}
                        </div>

                        {/* Expandable details - only for function calls */}
                        {message.functionCalls && message.functionCalls.length > 0 && expandedFunctions.has(message.id) && (
                          <div className="mt-3 space-y-2">
                            {message.functionCalls.map((fc, idx) => (
                              <div key={idx} className="pt-2" style={{ borderTopWidth: '1px', borderTopColor: '#bacfca' }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: '#124742' }}>
                                    🔧 {fc.name}
                                  </span>
                                </div>
                                <div className="text-xs font-mono" style={{ color: '#597f77' }}>
                                  {Object.entries(fc.args).map(([key, value]) => (
                                    <div key={key} className="truncate">
                                      <span className="font-semibold">{key}:</span>{' '}
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job List Display */}
                  {message.jobList && message.jobList.length > 0 && (
                    <JobList jobs={message.jobList} />
                  )}

                  {/* Message Text Content */}
                  {message.content && (
                    <>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
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
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
              // className="w-16"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}