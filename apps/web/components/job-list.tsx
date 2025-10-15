'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Briefcase, MapPin, FileText, ChevronDown, ChevronUp, ExternalLink, Building2, Sparkles } from 'lucide-react'

interface JobOffer {
  id: string
  title: string
  company: string
  location: string
  contractType?: string
  description?: string
}

interface JobListProps {
  jobs: JobOffer[]
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

export function JobList({ jobs }: JobListProps) {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())

  if (!jobs || jobs.length === 0) {
    return null
  }

  const toggleJob = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  return (
    <div className="space-y-3 mt-4 mb-4">
      {/* Header with gradient */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          {jobs.length} offre{jobs.length > 1 ? 's' : ''} sélectionnée{jobs.length > 1 ? 's' : ''} pour vous
        </span>
      </div>

      {/* Job Cards with staggered animation */}
      <div className="space-y-2">
        {jobs.map((job, index) => {
          const isExpanded = expandedJobs.has(job.id)
          const colors = job.contractType ? getContractTypeColor(job.contractType) : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }

          return (
            <Card
              key={job.id}
              className="group relative hover:shadow-lg transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-background to-muted/20 hover:from-primary/5 hover:to-primary/10"
              style={{
                animationDelay: `${index * 75}ms`,
                animationFillMode: 'both'
              }}
            >
              <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleJob(job.id)}>
                <div className="flex items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon with animated ring */}
                    <div className="relative mt-0.5">
                      <div className="absolute inset-0 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform duration-300" />
                      <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium truncate">{job.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{job.location}</span>
                  </div>
                  {job.contractType && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                      <FileText className="w-3 h-3" />
                      <span>{job.contractType}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Description */}
                {job.description && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`https://candidat.francetravail.fr/offres/recherche/detail/${job.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Voir l'offre complète</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsed state hint */}
                {!isExpanded && job.description && (
                  <button
                    onClick={() => toggleJob(job.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <span>Voir plus de détails</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}