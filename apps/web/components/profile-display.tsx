'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/shad/card'
import { Accessibility, Briefcase, Calendar, Car, DollarSign, FileText, GraduationCap, MapPin, User } from 'lucide-react'

interface ProfileMandatory {
  cityName: string
  primaryCategory: 'emploi' | 'projet-pro' | 'sport-loisirs' | 'citoyennete' | 'formation' | 'logement' | 'sante'
}

interface ProfileCategorySpecific {
  // EMPLOI
  desiredJobs?: string[]
  // PROJET PRO
  projectType?: 'stage' | 'formation' | 'alternance' | 'enquete-metier'
  // SPORT ET LOISIRS
  activityTypes?: string[]
  // CITOYENNETE
  needTypes?: string[]
  // FORMATION
  formationType?: 'professionnelle' | 'apprentissage' | 'atelier' | 'subvention'
  // LOGEMENT
  housingNeed?: 'recherche' | 'dossier' | 'visite' | 'achat' | 'aide' | 'autre'
  // SANTE
  healthNeeds?: string[]
}

interface ProfileOptional {
  age?: number
  educationLevel?: 'sans-diplome' | 'cap-bep' | 'bac' | 'bac+2' | 'bac+3' | 'bac+5-plus'
  experienceLevel?: 'debutant' | '1-3ans' | '3-5ans' | '5ans+'
  contractTypes?: ('CDI' | 'CDD' | 'interim' | 'alternance')[]
  hasVehicle?: boolean
  hasDriversLicense?: boolean
  hasDisability?: boolean
  financialDifficulties?: boolean
}

interface ProfileDisplayProps {
  mandatory: ProfileMandatory
  categorySpecific?: ProfileCategorySpecific
  optional?: ProfileOptional
}

const categoryLabels: Record<string, string> = {
  'emploi': 'Recherche d\'emploi',
  'projet-pro': 'Projet professionnel',
  'sport-loisirs': 'Sport et loisirs',
  'citoyennete': 'Citoyenneté et démarches',
  'formation': 'Formation',
  'logement': 'Logement',
  'sante': 'Santé',
}

const educationLabels: Record<string, string> = {
  'sans-diplome': 'Sans diplôme',
  'cap-bep': 'CAP/BEP',
  'bac': 'Baccalauréat',
  'bac+2': 'Bac+2',
  'bac+3': 'Bac+3',
  'bac+5-plus': 'Bac+5 et plus',
}

const experienceLabels: Record<string, string> = {
  'debutant': 'Débutant',
  '1-3ans': '1-3 ans',
  '3-5ans': '3-5 ans',
  '5ans+': '5 ans et plus',
}

const projectTypeLabels: Record<string, string> = {
  'stage': 'Stage',
  'formation': 'Formation',
  'alternance': 'Alternance',
  'enquete-metier': 'Enquête métier',
}

const formationTypeLabels: Record<string, string> = {
  'professionnelle': 'Formation professionnelle',
  'apprentissage': 'Apprentissage',
  'atelier': 'Atelier',
  'subvention': 'Recherche de subvention',
}

const housingNeedLabels: Record<string, string> = {
  'recherche': 'Recherche de logement',
  'dossier': 'Constitution d\'un dossier',
  'visite': 'Visite de logement',
  'achat': 'Achat immobilier',
  'aide': 'Demande d\'aide au logement',
  'autre': 'Autre besoin logement',
}

export function ProfileDisplay({ mandatory, categorySpecific, optional }: ProfileDisplayProps) {
  return (
    <Card className="my-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md">
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

      <CardContent className="space-y-4">
        {/* Mandatory Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Informations principales</h4>

          {/* Location */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-gray-500">Localisation</span>
              <p className="text-sm font-medium text-gray-900">{mandatory.cityName}</p>
            </div>
          </div>

          {/* Primary Category */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-gray-500">Priorité principale</span>
              <p className="text-sm font-medium text-gray-900">
                {categoryLabels[mandatory.primaryCategory] || mandatory.primaryCategory}
              </p>
            </div>
          </div>
        </div>

        {/* Category-Specific Information */}
        {categorySpecific && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Détails spécifiques</h4>

            {/* EMPLOI - Desired Jobs */}
            {categorySpecific.desiredJobs && categorySpecific.desiredJobs.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Métiers recherchés</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categorySpecific.desiredJobs.map((job, idx) => (
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

            {/* PROJET PRO - Project Type */}
            {categorySpecific.projectType && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Type de projet</span>
                  <p className="text-sm font-medium text-gray-900">
                    {projectTypeLabels[categorySpecific.projectType] || categorySpecific.projectType}
                  </p>
                </div>
              </div>
            )}

            {/* SPORT ET LOISIRS - Activity Types */}
            {categorySpecific.activityTypes && categorySpecific.activityTypes.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Activités d'intérêt</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categorySpecific.activityTypes.map((activity, idx) => (
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

            {/* CITOYENNETE - Need Types */}
            {categorySpecific.needTypes && categorySpecific.needTypes.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Besoins</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categorySpecific.needTypes.map((need, idx) => (
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

            {/* FORMATION - Formation Type */}
            {categorySpecific.formationType && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Type de formation</span>
                  <p className="text-sm font-medium text-gray-900">
                    {formationTypeLabels[categorySpecific.formationType] || categorySpecific.formationType}
                  </p>
                </div>
              </div>
            )}

            {/* LOGEMENT - Housing Need */}
            {categorySpecific.housingNeed && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Besoin logement</span>
                  <p className="text-sm font-medium text-gray-900">
                    {housingNeedLabels[categorySpecific.housingNeed] || categorySpecific.housingNeed}
                  </p>
                </div>
              </div>
            )}

            {/* SANTE - Health Needs */}
            {categorySpecific.healthNeeds && categorySpecific.healthNeeds.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Besoins santé</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categorySpecific.healthNeeds.map((need, idx) => (
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
        {optional && Object.keys(optional).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Informations complémentaires</h4>

            {/* Age */}
            {optional.age && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Âge</span>
                  <p className="text-sm font-medium text-gray-900">{optional.age} ans</p>
                </div>
              </div>
            )}

            {/* Education Level */}
            {optional.educationLevel && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Niveau d'études</span>
                  <p className="text-sm font-medium text-gray-900">
                    {educationLabels[optional.educationLevel] || optional.educationLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Experience Level */}
            {optional.experienceLevel && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Expérience</span>
                  <p className="text-sm font-medium text-gray-900">
                    {experienceLabels[optional.experienceLevel] || optional.experienceLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Contract Types */}
            {optional.contractTypes && optional.contractTypes.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Types de contrat préférés</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {optional.contractTypes.map((contract, idx) => (
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

            {/* Mobility */}
            {(optional.hasVehicle !== undefined || optional.hasDriversLicense !== undefined) && (
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                <Car className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500">Mobilité</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {optional.hasDriversLicense && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Permis de conduire
                      </span>
                    )}
                    {optional.hasVehicle && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Véhicule disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other flags */}
            <div className="flex flex-wrap gap-2">
              {optional.hasDisability && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg">
                  <Accessibility className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Situation de handicap</span>
                </div>
              )}
              {optional.financialDifficulties && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Difficultés financières</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
