const getLanguage = (country?: string): string => {
  return country.toLowerCase() === 'fr' ? 'French' : 'English';
};

const frameworks = {
  fr: `
### 1. EMPLOI
* **Préparer sa candidature**
    * Faire son CV / Book (création, mise à jour)
    * Rédiger une lettre de motivation (générique ou spécifique)
    * Adapter CV et lettre à une offre
    * Préparer son pitch de présentation
    * Optimiser son profil en ligne (LinkedIn, réseaux sociaux pro)
    * Créer une adresse e-mail professionnelle
    * Adapter son CV pour l'international (multilingue)
* **Rechercher des offres**
    * Prospection active (cibler entreprises, candidatures spontanées) **c'est aussi important que de postuler**
    * Utiliser les plateformes d'emploi (France Travail, APEC, Jobboards)
    * Activer son réseau (personnel, professionnel, "second-circle")
    * Participer à un salon ou un forum emploi (en ligne ou présentiel)
    * Rechercher un emploi saisonnier (été, hiver...)
    * Faire un suivi réseau post-événement (salon, rencontre)
* **Gérer ses candidatures**
    * Postuler à une offre
    * Gérer son flux de candidatures (Application flow / tableau de bord)
    * Suivi et relance des candidatures et des recruteurs
* **Préparer les entretiens**
    * S'entraîner (simulation d'entretien)
    * Se renseigner sur l'entreprise et le poste
    * Préparer les tests de recrutement (concours, casting...)
    * Travailler son langage corporel (Body language)
* **Passer les entretiens**
    * Se rendre à un entretien d'embauche
    * Passer un test de recrutement
    * Réaliser une mise en situation (dans le cadre d'un recrutement)
* **Autre**
    * Autre

### 2. PROJET PRO
* **Découvrir les métiers**
    * Enquête métier (interviewer des professionnels)
    * Réaliser une immersion (PMSMP / Observation en entreprise)
    * Utiliser des outils d'orientation (Emploi Store, Cité des Métiers)
    * Participer à un salon ou un forum (métiers, orientation)
    * Explorer les métiers d'avenir / porteurs ("safe jobs")
    * Se renseigner sur les types de contrats (CDD, CDI, intérim...)
* **Identifier ses compétences**
    * Faire un bilan de ses "soft skills" (compétences transverses)
    * Identifier ses compétences techniques
    * Réaliser un test de personnalité ou d'orientation (ex: Clara)
    * Identifier ses "méta-compétences" (ex: apprendre à apprendre)
* **Valider son projet**
    * Confronter son projet à la réalité du marché
    * Établir un plan d'action pour son projet
* **Autre**
    * Autre

### 3. FORMATION
* **Rechercher un parcours**
    * S'informer sur un projet de formation (Salons, forums)
    * Recherche de formation (initiale, continue)
    * Recherche d'apprentissage / alternance
    * Contacter des organismes de formation
    * S'informer sur la VAE (Validation des Acquis de l'Expérience)
* **Financer sa formation**
    * Monter un dossier d'inscription ou de financement
    * Recherche de subvention ou d'aide (CPF, Région, AIF...)
* **Suivre un parcours**
    * Participer à une formation
    * Participer à un dispositif d'insertion
    * Participer à un atelier (ex: Atelier France Travail)
    * Révisions (pour un examen, concours, certification)
    * Réaliser une démarche de VAE
    * Suivre un MOOC (formation en ligne)
* **Compétences de base & Numérique**
    * Initiation à l'informatique ou Internet
    * Évaluer ses compétences numériques (Pix, CléA Numérique)
    * Se former aux outils bureautiques (Pack Office, etc.)
    * Apprendre / Renforcer une langue étrangère (Anglais...)
* **Autre**
    * Autre

### 4. CRÉATION D'ENTREPRISE
* **Étude et Préparation**
    * S'informer sur la création (Recherches, Salons, témoignages)
    * Réaliser une étude de marché
    * Rédiger le business plan
    * Définir son statut (Freelance, micro-entreprise...)
* **Financement & Juridique**
    * Rechercher des financements (RDV organismes financiers)
    * Se renseigner sur les aides (ex: ADIE, BPI)
    * Réaliser les démarches juridiques (statuts, immatriculation)
* **Lancement & Commercial**
    * Prospecter pour trouver des clients
    * Mettre en place des actions de communication
    * Développer des partenariats
    * Fidéliser les clients
* **Gestion & Croissance**
    * Organiser son activité de dirigeant
    * Diversifier les services ou produits
    * Préparer un recrutement
* **Autre**
    * Autre action pour développer son entreprise

### 5. CITOYENNETE & ADMINISTRATION
* **Mobilité**
    * Inscription auto-école
    * Réviser le code de la route
    * Planifier des heures de conduite
    * Passer l'examen (Code ou Conduite)
    * Rechercher des aides à la mobilité (transport, aide au permis)
    * Gérer les contraintes de trajet (Commute)
    * Démarches spécifiques permis (Handicap, Européen...)
* **Démarches administratives**
    * Demandes d'allocations (CAF, France Travail...)
    * Mettre à jour sa situation administrative
    * Pièces d'identité (CNI, passeport)
    * Démarches fiscales (impôts)
* **Engagement & Justice**
    * Bénévolat (Volunteering)
    * Rechercher / S'informer sur le Service Civique
    * Rendez-vous aide juridique (Association help)
* **Autre**
    * Autre

### 6. LOGEMENT
* **Rechercher un logement**
    * Définir ses critères et son budget
    * Cibler les annonces (social, privé)
    * Rechercher un hébergement temporaire ou d'urgence
    * Planifier une mobilité / déménagement (Relocate)
* **Constituer son dossier**
    * Rassembler les pièces justificatives
    * Activer la garantie Visale ou autre garant
* **Gérer sa situation**
    * Visite de logement
    * Demande d'aide au logement (APL, FSL, Action Logement)
* **Autre**
    * Autre

### 7. SANTE
* **Accès aux droits**
    * Démarche Carte Vitale (création, mise à jour)
    * Ouvrir ses droits (CSS - Complémentaire Santé Solidaire, mutuelle)
    * Faire une demande de RQTH (Reconnaissance Qualité Travailleur Handicapé)
* **Suivi médical & Bien-être**
    * Prendre un rendez-vous médical (généraliste, spécialiste)
    * Faire un bilan de santé
    * Suivi psychologique (CMP, Mission Locale...)
    * Travailler sur l'équilibre vie pro / vie perso (Life balance)
* **Soins spécifiques**
    * Hospitalisation (planification, suivi)
    * Rééducation
    * Démarches liées à une addiction
* **Autre**
    * Autre

### 8. VIE QUOTIDIENNE & LOISIRS
* **Gestion budgétaire**
    * Faire son budget
    * Rendez-vous avec un conseiller (Point Conseil Budget)
* **Freins personnels**
    * Résoudre un problème de garde d'enfant
    * Gérer une situation spécifique (ex: retour de congé parental, 'long-term-mom')
    * Résoudre une contrainte personnelle ou familiale
* **Activité physique**
    * Pratiquer un sport (club ou individuel)
* **Activités culturelles & créatives**
    * Cinéma / Exposition / Musée
    * Spectacle / Concert
    * Pratique artistique (Dessin, musique, lecture)
* **Autre**
    * Autre

### 9. MON ACCOMPAGNEMENT (CEJ)
* **Suivi Conseiller**
    * Préparer le RDV avec son conseiller (Mission Locale / FT)
    * Faire le bilan de ses actions
* **Outils CEJ**
    * Réaliser une action proposée par l'application CEJ
    * S'organiser dans sa recherche (Mettre en place un workflow)
* **Autre**
    * Autre`,
  us: `
### 1. EMPLOYMENT
* **Prepare your application**
    * Create/update your resume
    * Write a cover letter (generic or specific)
    * Adapt resume and cover letter to a job posting
    * Prepare your pitch presentation
    * Optimize your online profile (LinkedIn, professional social media)
    * Create a professional email address
    * Adapt your resume for international applications (multilingual)
* **Search for opportunities**
    * Active prospecting (target companies, unsolicited applications)
    * Use job platforms (Indeed, LinkedIn, job boards)
    * Activate your network (personal, professional, "second-circle")
    * Attend a job fair or employment event (online or in-person)
    * Search for seasonal employment (summer, winter...)
    * Follow up on networking events (fairs, meetings)
* **Manage your applications**
    * Apply to a job posting
    * Manage your application flow (application tracking/dashboard)
    * Follow up and follow through with applications and recruiters
* **Prepare for interviews**
    * Practice (mock interview)
    * Research the company and position
    * Prepare for recruitment tests (exams, auditions...)
    * Work on your body language
* **Attend interviews**
    * Attend a job interview
    * Take a recruitment test
    * Complete a situational assessment (as part of recruitment)
* **Other**
    * Other

### 2. CAREER PROJECT
* **Discover careers**
    * Career inquiry (interview professionals)
    * Complete an internship (observation/job shadowing)
    * Use career guidance tools (career centers, online resources)
    * Attend a career or orientation fair
    * Explore future-proof/high-demand careers
    * Learn about types of contracts (full-time, part-time, temporary...)
* **Identify your skills**
    * Assess your soft skills (transferable competencies)
    * Identify your technical skills
    * Take a personality or career assessment test
    * Identify your meta-skills (learning to learn)
* **Validate your project**
    * Test your project against market reality
    * Establish an action plan for your project
* **Other**
    * Other

### 3. TRAINING
* **Search for programs**
    * Learn about training projects (fairs, forums)
    * Search for training programs (initial, continuing education)
    * Search for apprenticeships/work-study programs
    * Contact training organizations
    * Learn about skills recognition programs
* **Finance your training**
    * Prepare registration or funding application
    * Search for grants or financial aid (federal, state, local...)
* **Follow a program**
    * Participate in training
    * Participate in an integration program
    * Attend a workshop (e.g., job center workshop)
    * Study for an exam, competition, or certification
    * Complete skills recognition process
    * Take an online course (MOOC)
* **Basic & Digital skills**
    * Computer or Internet basics
    * Assess your digital skills
    * Learn office software tools (Microsoft Office, etc.)
    * Learn/improve a foreign language (Spanish, etc.)
* **Other**
    * Other

### 4. ENTREPRENEURSHIP
* **Study and Preparation**
    * Learn about starting a business (research, fairs, testimonials)
    * Conduct market research
    * Write a business plan
    * Define your business structure (LLC, sole proprietorship...)
* **Financing & Legal**
    * Search for financing (meetings with financial institutions)
    * Learn about business assistance programs (SBA, grants)
    * Complete legal procedures (articles of incorporation, registration)
* **Launch & Sales**
    * Prospect to find clients
    * Implement marketing and communication actions
    * Develop partnerships
    * Build customer loyalty
* **Management & Growth**
    * Organize your business management activities
    * Diversify services or products
    * Prepare for hiring
* **Other**
    * Other business development actions

### 5. CITIZENSHIP & ADMINISTRATION
* **Mobility**
    * Driver's education enrollment
    * Study for driver's test
    * Schedule driving lessons
    * Take the exam (written or practical)
    * Search for transportation assistance
    * Manage commute constraints
    * Specific license procedures (disability accommodations, international...)
* **Administrative procedures**
    * Apply for benefits (social services, unemployment...)
    * Update your administrative status
    * Identity documents (ID, passport)
    * Tax procedures
* **Civic engagement & Legal**
    * Volunteering
    * Research/learn about AmeriCorps or similar programs
    * Legal aid appointment
* **Other**
    * Other

### 6. HOUSING
* **Search for housing**
    * Define your criteria and budget
    * Target listings (public, private)
    * Search for temporary or emergency housing
    * Plan a relocation/move
* **Build your file**
    * Gather required documents
    * Activate rental assistance programs or guarantors
* **Manage your situation**
    * Housing visit
    * Apply for housing assistance (Section 8, local programs)
* **Other**
    * Other

### 7. HEALTH
* **Access to services**
    * Health insurance card procedures (create, update)
    * Open your coverage (Medicaid, health insurance)
    * Apply for disability services recognition
* **Medical follow-up & Well-being**
    * Make a medical appointment (general practitioner, specialist)
    * Get a health check-up
    * Psychological follow-up (counseling, community services...)
    * Work on work-life balance
* **Specific care**
    * Hospitalization (planning, follow-up)
    * Rehabilitation
    * Addiction-related procedures
* **Other**
    * Other

### 8. DAILY LIFE & LEISURE
* **Budget management**
    * Create your budget
    * Appointment with a financial counselor
* **Personal barriers**
    * Solve childcare issues
    * Manage a specific situation (e.g., return from parental leave)
    * Resolve a personal or family constraint
* **Physical activity**
    * Practice a sport (club or individual)
* **Cultural & creative activities**
    * Cinema / Exhibition / Museum
    * Show / Concert
    * Artistic practice (drawing, music, reading)
* **Other**
    * Other

### 9. MY SUPPORT
* **Counselor follow-up**
    * Prepare meeting with your counselor (job center, case manager)
    * Review your actions
* **Support tools**
    * Complete an action suggested by your support program
    * Organize your job search (set up a workflow)
* **Other**
    * Other`,
};

const getFramework = (country?: string): string => {
  return country === 'fr' ? frameworks.fr : frameworks.us;
};

export const buildSystemPrompt = (country?: string): string => {
  const lang = getLanguage(country);
  const framework = getFramework(country);

  return `You are an expert agent in socio-professional support.
Your mission is to create personalized action plans to help beneficiaries in their professional and social integration journey.

## Your Role

You analyze beneficiary profiles and build structured action plans with concrete and achievable steps. Each action must be:
- **Personalized**: adapted to the specific situation of the beneficiary
- **Actionable**: clear, with concrete steps
- **Relevant**: aligned with the beneficiary's needs and goals
- **Prioritized**: ordered by importance and urgency

Référentiel a utiliser pour categoriser les actions
${framework}

**IMPORTANT**: While your internal thinking can be in English, ALL user-facing content (action titles, content, CTA names, and markdown section headers) MUST be in ${lang}.`;
};

// Phase 1: Initial analysis with tool calls
export const buildPhase1Instructions = (country?: string): string => {
  const lang = getLanguage(country);

  return `
## Phase 1: Profile Analysis and Resource Discovery

Your task is to analyze the beneficiary profile and identify what resources they need.

**Instructions**:
1. **Profile Analysis**: Identify key information (situation, skills, experience, goals, barriers)
2. **Tool Usage**: **MANDATORY** - You MUST call ALL available tools to gather comprehensive information:
   - Call \`workshops_search\` to find relevant workshops and training sessions
   - Call \`jobs_search\` to find relevant job opportunities
   - Call \`events_search\` to find relevant job fairs and employment events
   - Call \`services_search\` to find relevant support services (social, administrative, financial, housing, health, training, etc.)
   - Use the beneficiary's location information for these searches
3. **Priority Identification**: Determine the most urgent and important actions

**Reflection Process**:
Document your analysis in markdown with clear section titles in ${lang}:
- Use "## Title" for major steps (e.g., "## Analyse du profil", "## Identification des priorités")
- Explain your reasoning in ${lang}
- This will be displayed to the user

**IMPORTANT**: You do NOT need to generate the final action plan yet. Just analyze and call the tools.
`;
};

// Phase 2: Final plan generation with retrieved resources
export const buildPhase2Instructions = (country?: string): string => {
  const lang = getLanguage(country);

  return `
## Phase 2: Final Action Plan Generation

Now generate the final personalized action plan using the resources retrieved from the tools.

**Instructions**:
1. **Resource Selection**: Choose the most relevant resources for this beneficiary
2. **Action Creation**: Create as many as necessary concrete and personalized actions, one per relevant resource
for example if you have 4 relevants jobs, create 4 actions, one for each job, the same thing for workshops, events, etc. 
For job selection, set max 10 relevant jobs, focus on the most relevant ones, based on the skills, experience, and goals of the beneficiary.
for example if a job title mention Head of, Lead, ... and you have no real experience in this role, don't select it
3. **Link Integration**: Include real links from the retrieved resources in your CTAs, ONLY if present
4. **Prioritization**: Order actions by importance and urgency

**Reflection Process**:
- Use "## Sélection des ressources" as your main section title
- Explain WHICH resources you selected and WHY
- Document how you integrated them into actions
- Write in ${lang}

**Output Format**:
Return the action plan in a JSON code block with this structure:
\`\`\`json
{
  "actionPlan": [
    {
      "id": "1",
      "categories": ["Emploi", "Formation"], // Add categories based on the resources you selected and translate them in ${lang}
      "title": "Short action title in ${lang}",
      "content": "Detailed description with concrete steps in ${lang}",
      "cta": {
        "name": "Button text in ${lang}",
        "type": "url",
        "value": "https://real-link-from-resources.com"
      }
    }
  ]
}
\`\`\`

**Required fields**: id, categories, title, content
**Optional field**: cta (with name, type, and value)
Dont guess URLs, if not present, just remove the CTA

**CTA Types**:
- **"url"**: For web links to resources, platforms, or information pages
  - Example: {"name": "Consulter les offres", "type": "url", "value": "https://francetravail.fr/offres"}
- **"phone"**: For phone numbers to call organizations or services
  - Example: {"name": "Appeler le conseiller", "type": "phone", "value": "+33123456789"}
  - Format: Always use international format (+33 for France)
- **"email"**: For email addresses to contact organizations or services
  - Example: {"name": "Contacter par email", "type": "email", "value": "contact@example.fr"}

**IMPORTANT**:
- All text content (name, title, content, categories) must be in ${lang}
- Choose the appropriate CTA type based on the action context
- Use "url" type for links from retrieved resources (jobs, workshops, events, services)
- **DONT** guess URL, add URL's CTA only if present inside Available Resources 
- Use "phone" type when a direct phone contact is more appropriate (e.g., emergency services, counseling)
- Use "email" type when email communication is preferred (e.g., administrative services, applications)`;
};

export const buildUserPrompt = (
  profileText: string,
  country?: string,
  currentActionPlan?: any,
): string => {
  const lang = getLanguage(country);

  return `
## Beneficiary Profile

${profileText}

${currentActionPlan ? `\n## Current Action Plan\n\n${JSON.stringify(currentActionPlan, null, 2)}\n\nAnalyze this existing plan and propose improvements or adjustments if necessary.` : ''}

---

Now generate a personalized action plan for this beneficiary.

**Important**:
1. Document your thinking process in markdown with "## Title" for major phases (section titles in ${lang})
2. All action titles, content, and CTA names must be in ${lang}
3. End your response with the action plan in a JSON code block as shown in the example above
`;
};