'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { ScrollArea } from '@repo/ui/scroll-area'
import { Send, User, Bot, Briefcase, MapPin } from 'lucide-react'
import { SendMessageDto } from '@repo/api/chat/dto/send-message.dto';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CarePlan } from './care-plan';
import { ProfileDisplay } from './profile-display';

interface FunctionCallData {
  name: string
  args: Record<string, any>
}

interface DetailItem {
  id: string
  title: string
  description?: string
  location?: string
  // Job-specific
  company?: string
  contractType?: string
  // Service-specific
  contact?: string
  serviceType?: string
}

interface CarePlanItem {
  id: string
  type: 'job_search' | 'service'
  title: string
  description?: string // Used when service has no nested items
  location?: string
  contact?: string // Used when service has no nested items
  serviceType?: string // Used when service has no nested items
  items?: DetailItem[] // For both job_search and service types
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
  carePlanItems?: CarePlanItem[]
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set())
  const [currentCarePlan, setCurrentCarePlan] = useState<CarePlanItem[] | null>(null)
  const [currentProfile, setCurrentProfile] = useState<any | null>(null)
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
              // Check if this is a display_care_plan function call
              const carePlanCall = data.functionCalls?.find((fc: FunctionCallData) => fc.name === 'display_care_plan')

              // Update the fixed care plan display
              if (carePlanCall?.args?.planItems) {
                setCurrentCarePlan(carePlanCall.args.planItems)
              }

              // Check if this is a display_profile function call
              const profileCall = data.functionCalls?.find((fc: FunctionCallData) => fc.name === 'display_profile')

              // Update the profile display
              if (profileCall?.args) {
                setCurrentProfile(profileCall.args)
              }

              // Filter out frontend-only function calls from display (they're shown visually instead)
              const backendFunctionCalls = data.functionCalls?.filter((fc: FunctionCallData) =>
                fc.name !== 'display_care_plan' && fc.name !== 'display_profile'
              )

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
      'search_resources': 'Recherche de ressources',
      'jobs_search': 'Recherche d\'offres d\'emploi',
      'events_search': 'Recherche d\'événements',
      'services_search': 'Recherche de services',
      'workshops_search': 'Recherche d\'ateliers',
      'display_care_plan': 'Création du plan d\'accompagnement',
      'display_profile': 'Mise à jour du profil',
    }
    return labels[functionName] || functionName
  }

  const formatFunctionCalls = (functionCalls: FunctionCallData[]): string => {
    if (functionCalls.length === 1 && functionCalls[0]) {
      return getFunctionLabel(functionCalls[0].name)
    }
    return functionCalls.map(fc => getFunctionLabel(fc.name)).join(', ')
  }

  // Translate parameter names to French user-friendly labels
  const getParamLabel = (paramName: string): string => {
    const labels: Record<string, string> = {
      'jobTitles': 'Métiers recherchés',
      'cityName': 'Ville',
      'provider': 'Type de recherche',
      'workshopTypes': 'Types d\'ateliers',
      'thematiques': 'Thématique',
      'startDate': 'Date de début',
      'endDate': 'Date de fin',
      'contractTypes': 'Types de contrat',
    }
    return labels[paramName] || paramName
  }

  // Translate provider values to French
  const getProviderLabel = (provider: string): string => {
    const labels: Record<string, string> = {
      'jobs': 'Offres d\'emploi',
      'events': 'Événements',
      'services': 'Services sociaux',
      'workshops': 'Ateliers',
    }
    return labels[provider] || provider
  }

  // Format parameter value based on type and name
  const formatParamValue = (key: string, value: any): string => {
    if (key === 'provider') {
      return getProviderLabel(String(value))
    }
    if (Array.isArray(value)) {
      // For thematiques, show only first item + count if multiple
      if (key === 'thematiques' && value.length > 1) {
        // Extract the readable part after '--'
        const firstItem = value[0].split('--').pop() || value[0]
        return `${firstItem} (+${value.length - 1})`
      }
      // For thematiques with single item, show readable part
      if (key === 'thematiques' && value.length === 1) {
        return value[0].split('--').pop() || value[0]
      }
      return value.join(', ')
    }
    return String(value)
  }

  // Get provider badge component for a given provider value
  const getProviderBadge = (provider: string) => {
    const badges: Record<string, { name: string; color: string }> = {
      'jobs': { name: 'France Travail', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'events': { name: 'France Travail', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      'services': { name: 'Data Inclusion', color: 'bg-green-50 text-green-700 border-green-200' },
      'workshops': { name: 'Ateliers', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    }
    return badges[provider] || null
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
      {/* LEFT PANEL - Care Plan - Fixed position */}
      <div className="fixed left-4 top-[120px] w-96 h-[calc(80vh-40px)] z-10">
        <Card className="h-full flex flex-col bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Plan d'action</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {currentCarePlan && currentCarePlan.length > 0 ? (
                <CarePlan planItems={currentCarePlan} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Briefcase className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Votre plan d'action apparaîtra ici une fois créé.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE PANEL - Chat Interface */}
      <div className="mx-auto max-w-4xl px-4" style={{ marginLeft: '416px', marginRight: '416px' }}>
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
                                ? 'Traitement de votre demande...'
                                : message.isProcessingFunctions && message.functionCalls
                                ? `🔍 ${formatFunctionCalls(message.functionCalls)}...`
                                : message.isFinished && message.functionCalls
                                ? `✓ ${formatFunctionCalls(message.functionCalls)}`
                                : message.content
                                ? 'Réponse en cours...'
                                : 'Traitement...'}
                            </span>
                            {message.functionCalls && message.functionCalls.length > 0 && (
                              <span className="ml-auto text-xs" style={{ color: '#597f77' }}>
                                {expandedFunctions.has(message.id) ? '▼' : '▶'} Détails
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
                                      🔧 {getFunctionLabel(fc.name)}
                                    </span>
                                  </div>
                                  <div className="text-xs space-y-1.5" style={{ color: '#597f77' }}>
                                    {Object.entries(fc.args).map(([key, value]) => {
                                      // Special handling for provider parameter - show as badge
                                      if (key === 'provider') {
                                        const badge = getProviderBadge(String(value))
                                        if (badge) {
                                          return (
                                            <div key={key} className="flex items-center gap-1.5">
                                              <span className="font-semibold">{getParamLabel(key)}:</span>
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${badge.color}`}>
                                                {badge.name}
                                              </span>
                                            </div>
                                          )
                                        }
                                      }
                                      // Default handling for other parameters
                                      return (
                                        <div key={key} className="truncate">
                                          <span className="font-semibold">{getParamLabel(key)}:</span>{' '}
                                          {formatParamValue(key, value)}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL - Profile - Fixed position */}
      <div className="fixed right-4 top-[120px] w-96 h-[calc(80vh-40px)] z-10">
        <Card className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-bold text-blue-900">
                Votre profil
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {currentProfile ? (
                <div className="space-y-4">
                  {/* Mandatory Information */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Informations principales</h4>

                    {/* Location */}
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500">Localisation</span>
                        <p className="text-sm font-medium text-gray-900">{currentProfile.mandatory.cityName}</p>
                      </div>
                    </div>

                    {/* Primary Category */}
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                      <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500">Priorité principale</span>
                        <p className="text-sm font-medium text-gray-900">
                          {currentProfile.mandatory.primaryCategory}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category-Specific Details */}
                  {currentProfile.categorySpecific && Object.keys(currentProfile.categorySpecific).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Détails</h4>

                      {/* Desired Jobs */}
                      {currentProfile.categorySpecific.desiredJobs && currentProfile.categorySpecific.desiredJobs.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Métiers recherchés</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.categorySpecific.desiredJobs.map((job: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {job}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Project Type */}
                      {currentProfile.categorySpecific.projectType && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Type de projet</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.categorySpecific.projectType}</p>
                          </div>
                        </div>
                      )}

                      {/* Activity Types */}
                      {currentProfile.categorySpecific.activityTypes && currentProfile.categorySpecific.activityTypes.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Activités</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.categorySpecific.activityTypes.map((activity: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {activity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Need Types */}
                      {currentProfile.categorySpecific.needTypes && currentProfile.categorySpecific.needTypes.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Besoins</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.categorySpecific.needTypes.map((need: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {need}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formation Type */}
                      {currentProfile.categorySpecific.formationType && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Type de formation</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.categorySpecific.formationType}</p>
                          </div>
                        </div>
                      )}

                      {/* Housing Need */}
                      {currentProfile.categorySpecific.housingNeed && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Besoin logement</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.categorySpecific.housingNeed}</p>
                          </div>
                        </div>
                      )}

                      {/* Health Needs */}
                      {currentProfile.categorySpecific.healthNeeds && currentProfile.categorySpecific.healthNeeds.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Besoins santé</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.categorySpecific.healthNeeds.map((need: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {need}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Information */}
                  {currentProfile.optional && Object.keys(currentProfile.optional).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Informations complémentaires</h4>

                      {/* Age */}
                      {currentProfile.optional.age && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Âge</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.optional.age} ans</p>
                          </div>
                        </div>
                      )}

                      {/* Education Level */}
                      {currentProfile.optional.educationLevel && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Niveau d'études</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.optional.educationLevel}</p>
                          </div>
                        </div>
                      )}

                      {/* Experience Level */}
                      {currentProfile.optional.experienceLevel && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Expérience</span>
                            <p className="text-sm font-medium text-gray-900">{currentProfile.optional.experienceLevel}</p>
                          </div>
                        </div>
                      )}

                      {/* Contract Types */}
                      {currentProfile.optional.contractTypes && currentProfile.optional.contractTypes.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Types de contrat</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.optional.contractTypes.map((contract: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                >
                                  {contract}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobility Flags */}
                      {(currentProfile.optional.hasVehicle || currentProfile.optional.hasDriversLicense) && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Mobilité</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentProfile.optional.hasDriversLicense && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Permis
                                </span>
                              )}
                              {currentProfile.optional.hasVehicle && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Véhicule
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Other Flags */}
                      {(currentProfile.optional.hasDisability || currentProfile.optional.financialDifficulties || currentProfile.optional.cvAssistance) && (
                        <div className="flex flex-wrap gap-2">
                          {currentProfile.optional.hasDisability && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg">
                              <span className="text-xs font-medium text-gray-700">Situation de handicap</span>
                            </div>
                          )}
                          {currentProfile.optional.financialDifficulties && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg">
                              <span className="text-xs font-medium text-gray-700">Difficultés financières</span>
                            </div>
                          )}
                          {currentProfile.optional.cvAssistance && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg">
                              <span className="text-xs font-medium text-gray-700">Besoin d'aide pour le CV</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-sm font-medium text-blue-600 mb-2">
                    En cours de création...
                  </p>
                  <p className="text-xs text-gray-600">
                    Je collecte vos informations pour créer votre profil personnalisé.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}