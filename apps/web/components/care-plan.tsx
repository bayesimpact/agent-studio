'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Briefcase, MapPin, FileText, ChevronDown, ExternalLink, Building2, Sparkles, HandHeart, Phone, Calendar, Clock, Users, Loader2, Database } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  // Event-specific
  eventDate?: string
  startTime?: string
  endTime?: string
  eventType?: string
  registrationUrl?: string
  organizer?: string
  availableSeats?: number
  totalSeats?: number
  // Workshop-specific
  date?: string
}

interface CarePlanItem {
  id: string
  type: 'job_search' | 'service' | 'event_search' | 'workshop_search'
  title: string
  description?: string // Used when service has no nested items
  location?: string
  contact?: string // Used when service has no nested items
  serviceType?: string // Used when service has no nested items
  provider?: 'ft_offres_emploi' | 'ft_mee' | 'data_inclusion' | 'notion_workshops'
  isLoading?: boolean
  items?: DetailItem[] // For job_search, service, and event_search types
}

interface CarePlanProps {
  planItems: CarePlanItem[]
}

const contractTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  'CDI': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'CDD': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Intérim': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Stage': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Alternance': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
}

const getContractTypeColor = (contractType: string) => {
  for (const [key, value] of Object.entries(contractTypeColors)) {
    if (contractType.includes(key)) {
      return value
    }
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
}

const providerLabels: Record<string, { name: string; color: string }> = {
  'ft_offres_emploi': { name: 'France Travail - Offres d\'emploi', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'ft_mee': { name: 'France Travail - Événements', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'data_inclusion': { name: 'Data Inclusion', color: 'bg-green-50 text-green-700 border-green-200' },
  'notion_workshops': { name: 'Ateliers', color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export function CarePlan({ planItems }: CarePlanProps) {
  // Track which high-level items have been expanded
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  if (!planItems || planItems.length === 0) {
    return null
  }

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-3 mt-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          Plan d'accompagnement
        </span>
      </div>

      {/* High-level Care Plan Items */}
      <div className="space-y-2">
        {planItems.map((planItem, index) => {
          const isExpanded = expandedItems.has(planItem.id)
          const isJobSearch = planItem.type === 'job_search'
          const isService = planItem.type === 'service'
          const isEventSearch = planItem.type === 'event_search'
          const isWorkshopSearch = planItem.type === 'workshop_search'

          return (
            <Card
              key={planItem.id}
              className="group relative hover:shadow-lg transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-primary/5 to-primary/8 hover:from-primary/10 hover:to-primary/15 border-primary/20"
              style={{
                animationDelay: `${index * 75}ms`,
                animationFillMode: 'both'
              }}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => toggleExpand(planItem.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="relative mt-0.5">
                      <div className="absolute inset-0 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform duration-300" />
                      <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                        {isService ? <HandHeart className="w-4 h-4" /> : isEventSearch ? <Calendar className="w-4 h-4" /> : isWorkshopSearch ? <Users className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                          {planItem.title}
                          {planItem.items && planItem.items.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              ({planItem.items.length})
                            </span>
                          )}
                        </CardTitle>
                        {planItem.isLoading && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      {planItem.location && (
                        <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-medium truncate">{planItem.location}</span>
                        </div>
                      )}
                      {planItem.provider && providerLabels[planItem.provider] && (
                        <div className="mt-1.5">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${providerLabels[planItem.provider]?.color || ''}`}>
                            <Database className="w-3 h-3" />
                            <span>{providerLabels[planItem.provider]?.name || ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Expand/Collapse indicator */}
                    <div className="mt-1">
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Expandable Content */}
              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  {/* Service Type with Nested Items: Display service details */}
                  {isService && planItem.items && planItem.items.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {planItem.items.length} service{planItem.items.length > 1 ? 's' : ''} disponible{planItem.items.length > 1 ? 's' : ''}
                      </p>
                      {planItem.items.map((service) => (
                        <Card
                          key={service.id}
                          className="bg-background/50 hover:bg-background transition-colors"
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <HandHeart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {service.title}
                                </h4>
                              </div>
                            </div>

                            {/* Service description in markdown */}
                            {service.description && (
                              <div className="prose prose-sm max-w-none text-xs text-muted-foreground">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {service.description}
                                </ReactMarkdown>
                              </div>
                            )}

                            {/* Service Info Pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {service.location && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                  <MapPin className="w-3 h-3" />
                                  <span>{service.location}</span>
                                </div>
                              )}
                              {service.serviceType && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                  <HandHeart className="w-3 h-3" />
                                  <span>{service.serviceType}</span>
                                </div>
                              )}
                              {service.contact && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                  <Phone className="w-3 h-3" />
                                  <span>{service.contact}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Service Type without Nested Items: Display markdown description */}
                  {isService && !planItem.items && planItem.description && (
                    <div className="pt-2 border-t">
                      <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {planItem.description}
                        </ReactMarkdown>
                      </div>

                      {/* Contact Pills */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {planItem.serviceType && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
                            <HandHeart className="w-3 h-3" />
                            <span>{planItem.serviceType}</span>
                          </div>
                        )}
                        {planItem.contact && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
                            <Phone className="w-3 h-3" />
                            <span>{planItem.contact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job Search Type: Display nested job offers */}
                  {isJobSearch && planItem.items && planItem.items.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {planItem.items.length} offre{planItem.items.length > 1 ? 's' : ''} trouvée{planItem.items.length > 1 ? 's' : ''}
                      </p>
                      {planItem.items.map((job) => {
                        const colors = job.contractType ? getContractTypeColor(job.contractType) : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }

                        return (
                          <Card
                            key={job.id}
                            className="bg-background/50 hover:bg-background transition-colors"
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                    {job.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate max-w-full">{job.company}</p>
                                </div>
                              </div>

                              {/* Job Info Pills */}
                              <div className="flex flex-wrap gap-1.5">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                  <MapPin className="w-3 h-3" />
                                  <span>{job.location}</span>
                                </div>
                                {job.contractType && (
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                                    <FileText className="w-3 h-3" />
                                    <span>{job.contractType}</span>
                                  </div>
                                )}
                              </div>

                              {/* Description and Link */}
                              {job.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {job.description}
                                </p>
                              )}

                              <a
                                href={`https://candidat.francetravail.fr/offres/recherche/detail/${job.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                              >
                                <span>Voir l'offre</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Workshop Search Type: Display nested workshops */}
                  {isWorkshopSearch && planItem.items && planItem.items.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {planItem.items.length} atelier{planItem.items.length > 1 ? 's' : ''} trouvé{planItem.items.length > 1 ? 's' : ''}
                      </p>
                      {planItem.items.map((workshop) => {
                        // Format date
                        const formatDate = (dateString?: string) => {
                          if (!dateString) return ''
                          try {
                            return new Date(dateString).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          } catch {
                            return dateString
                          }
                        }

                        return (
                          <Card
                            key={workshop.id}
                            className="bg-background/50 hover:bg-background transition-colors"
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {workshop.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Workshop description */}
                              {workshop.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {workshop.description}
                                </p>
                              )}

                              {/* Workshop Info Pills */}
                              <div className="flex flex-wrap gap-1.5">
                                {workshop.date && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(workshop.date)}</span>
                                  </div>
                                )}
                                {workshop.location && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                    <MapPin className="w-3 h-3" />
                                    <span>{workshop.location}</span>
                                  </div>
                                )}
                                {workshop.serviceType && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                                    <FileText className="w-3 h-3" />
                                    <span>{workshop.serviceType}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Event Search Type: Display nested events */}
                  {isEventSearch && planItem.items && planItem.items.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {planItem.items.length} événement{planItem.items.length > 1 ? 's' : ''} trouvé{planItem.items.length > 1 ? 's' : ''}
                      </p>
                      {planItem.items.map((event) => {
                        // Format date and time
                        const formatDate = (dateString?: string) => {
                          if (!dateString) return ''
                          try {
                            return new Date(dateString).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          } catch {
                            return dateString
                          }
                        }

                        const formatTime = (timeString?: string) => {
                          if (!timeString) return ''
                          return timeString.substring(0, 5) // HH:MM format
                        }

                        return (
                          <Card
                            key={event.id}
                            className="bg-background/50 hover:bg-background transition-colors"
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {event.title}
                                  </h4>
                                  {event.organizer && (
                                    <p className="text-xs text-muted-foreground">{event.organizer}</p>
                                  )}
                                </div>
                              </div>

                              {/* Event description */}
                              {event.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {event.description}
                                </p>
                              )}

                              {/* Event Info Pills */}
                              <div className="flex flex-wrap gap-1.5">
                                {event.eventDate && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(event.eventDate)}</span>
                                  </div>
                                )}
                                {event.startTime && event.endTime && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                    <MapPin className="w-3 h-3" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.eventType && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                                    <FileText className="w-3 h-3" />
                                    <span>{event.eventType}</span>
                                  </div>
                                )}
                                {event.availableSeats !== undefined && event.totalSeats !== undefined && event.totalSeats > 0 && (
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    event.availableSeats > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    <Users className="w-3 h-3" />
                                    <span>{event.availableSeats > 0 ? `${event.availableSeats} places` : 'Complet'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Registration Link */}
                              {event.registrationUrl && (
                                <a
                                  href={event.registrationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                  <span>S'inscrire à l'événement</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}