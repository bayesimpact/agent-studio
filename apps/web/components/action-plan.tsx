'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  ChevronDown,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CTAType = 'url' | 'phone' | 'email';

interface CTA {
  name: string;
  type: CTAType;
  value: string;
}

interface Action {
  id: string;
  categories: string[];
  content: string;
  title: string;
  cta?: CTA;
}

interface ActionPlanProps {
  planItems: Action[];
}

const categoryColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  //FR
  Emploi: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Formation: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  Social: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  Réseau: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Administratif: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  //EN
  Employment: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Training: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  Education: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  Network: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Administrative: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  'Career Guidance': {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

const getCategoryColor = (category: string) => {
  return (
    categoryColors[category] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
    }
  );
};

export function ActionPlan({ planItems }: ActionPlanProps) {
  // Track which actions have been expanded
  const [expandedActions, setExpandedActions] = useState<Set<string>>(
    new Set(),
  );

  if (!planItems || planItems.length === 0) {
    return null;
  }

  const toggleExpand = (actionId: string) => {
    setExpandedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3 mt-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          Support Plan
          {/*Plan d'accompagnement*/}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {planItems.map((action, index) => {
          const isExpanded = expandedActions.has(action.id);

          return (
            <Card
              key={action.id}
              className="group relative hover:shadow-lg transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-primary/5 to-primary/8 hover:from-primary/10 hover:to-primary/15 border-primary/20"
              style={{
                animationDelay: `${index * 75}ms`,
                animationFillMode: 'both',
              }}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => toggleExpand(action.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="relative mt-0.5">
                      <div className="absolute inset-0 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform duration-300" />
                      <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {action.title}
                      </CardTitle>

                      {/* Categories */}
                      {action.categories && action.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {action.categories.map((category, idx) => {
                            const colors = getCategoryColor(category);
                            return (
                              <div
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                {category}
                              </div>
                            );
                          })}
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
                  <div className="pt-2 border-t">
                    {/* Action content */}
                    <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {action.content}
                      </ReactMarkdown>
                    </div>

                    {/* Call to Action */}
                    {action.cta && (
                      <div className="mt-3">
                        {action.cta.type === 'url' && (
                          <a
                            href={action.cta.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <span>{action.cta.name}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {action.cta.type === 'phone' && (
                          <a
                            href={`tel:${action.cta.value}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{action.cta.name}</span>
                          </a>
                        )}
                        {action.cta.type === 'email' && (
                          <a
                            href={`mailto:${action.cta.value}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{action.cta.name}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
