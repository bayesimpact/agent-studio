# Walkthroughs du centre d'aide — passation

> But de ce doc : permettre à quelqu'un qui découvre le sujet de **finir** les animations des
> guides. Détails techniques approfondis dans **`apps/help/CLAUDE.md`** (section
> « Walkthrough generation v3 — LIVE » + « Guide Authoring Playbook »).

## En deux phrases

Chaque guide de `apps/help` contient une animation qui **monte la VRAIE app `apps/web`** (store
mocké, thunks off, router mémoire) et la **pilote étape par étape** (navigue, dispatch l'état,
ouvre les vrais overlays). Zéro dérive : vrais composants, vrais libellés, vrais états.

## Fichiers clés

- Moteur : `apps/help/src/walkthroughs/liveWalkthrough.tsx` (`createLiveWalkthrough`, helpers DOM
  `findControl`/`leaf`/`navOf`/`insetOf`…, `resetTransient`).
- Player : `apps/help/src/walkthroughs/LiveWalkthroughPlayer.tsx` (fenêtre, anchor/surbrillance,
  plein écran, blocage des clics, tracker rAF).
- Un guide = un îlot `*Live.tsx` (fournit `seed` + `steps`) + un wrapper
  `apps/help/src/components/*Walkthrough.astro` monté dans le `.mdx`.
- Overlays câblés : `packages/ui/src/shad/overlay-context.tsx` + les 8 primitives shad (dialog,
  sheet, dropdown-menu, popover, select, hover-card, tooltip, drawer).
- Règles & doc détaillée : `apps/help/CLAUDE.md`.

## État d'avancement (validation « 1 guide par catégorie de risque »)

- **A — web-sources** : ✅ fait (`WebSourcesLive.tsx`).
- **B — resource-libraries** : ✅ fait (`ResourceLibrariesLive.tsx`) — routes imbriquées + création.
- **C — add-a-conversation-agent** : ⬜ à faire — **éditeur d'agent à onglets**, le plus gros
  pattern neuf (onglets Prompt / Sources / Resources / Sub-agents…). Prévoir de la cartographie.
- **D — add-a-user** (accès par agent) : ⬜ à faire.
- **E — workspace-admin** (page de réglages) : ⬜ à faire.
- **F — run-an-extraction / chat-with-an-agent** (back réel / limites de l'embed) : ⬜ à faire.
- Déjà faits aussi : `DocumentsLive.tsx`, `AddAdminLive.tsx`.

## Comment créer un nouveau guide (recette)

1. Cartographier la feature dans `apps/web` (routes, composants, factory, seed, libellés locales
   EN/FR). Un agent d'exploration est utile ici.
2. Copier un `*Live.tsx` existant (ex. `ResourceLibrariesLive.tsx`) : `buildEntities()` (données
   neutres), `createLiveWalkthrough({ seed, initialPath, currentIds, routes: studioRoutes })`, puis
   `steps[]`.
3. Toujours **démarrer sur l'overview** puis piloter la navigation jusqu'à la feature.
4. Libellés des captions = **vrais libellés de l'app** (via `makeT("namespace:key")`), EN **et** FR.
5. Créer/rebrancher le `*Walkthrough.astro` sur l'îlot ; supprimer toute ancienne scène v2 orpheline.
6. Réconcilier le `.mdx` (EN+FR) : mêmes étapes / ordre / termes que l'animation.
7. Vérifs : `npx biome check --write <fichiers>` puis `cd apps/help && npx tsc --noEmit`.

## Infra déjà généralisée — à RÉUTILISER, ne pas refaire

- `findControl` (boutons à icône), seeding `currentIds` (routes de détail) — moteur.
- Overlays : portalisés **dans** la fenêtre, non-modal, **non-fermables au clic-dehors**
  (`dismissable:false`) — via `OverlayProvider`.
- `resetTransient` ferme **toutes** les couches overlay entre étapes.
- `transform: translateZ(0)` sur la fenêtre = bloc conteneur des overlays `fixed`.
- Bouton **plein écran** (utile pour les vues larges qui débordent dans la colonne).
- Tracker **rAF** qui épingle l'anchor à sa cible en continu.

## Règle d'auteur importante (sinon incohérences)

**Rien ne doit apparaître avant l'étape qui le crée.** Le seed = l'état « avant » (uniquement le
préexistant). Ce que l'animation crée/téléverse/invite doit être **absent du seed** puis poussé par
`dispatch(<thunk>.fulfilled(...))` à/après son étape. Ne jamais réutiliser le nom/id d'un élément
déjà listé. Réfs : `AddAdminLive` (PENDING_NONE→ONE), `ResourceLibrariesLive`
(BEFORE→CREATED_EMPTY→CREATED_FULL), `DocumentsLive` (BASE→+faq). (Détaillé dans `CLAUDE.md`.)

## ⚠️ Problème ouvert non résolu — anchors

Signalé : « lag, bugs, gros retard voire absence » sur les surbrillances (l'anneau orange).
Plusieurs correctifs de pipeline ont été tentés (tracker rAF, bloc conteneur, reset overlays)
**sans effet visible pour l'utilisateur**. Une sonde headless montrait la page hôte qui scrolle,
mais **ce n'était pas le symptôme observé**.
**→ Le symptôme exact n'a pas encore été reproduit/identifié.** Prochaine action : obtenir une
**capture/vidéo** + l'**URL/port** exact (localhost:4334 vs **déployé** — le déployé n'a pas les
changements récents) + préciser si c'est l'anneau, l'app qui saccade, ou l'enchaînement des étapes.
**Ne pas retoucher l'anchor à l'aveugle** avant d'avoir observé le vrai symptôme. Le drift
self-check logge `[walkthrough] step N … highlighted nothing` en dev (cible absente).

## Plans & travaux prévus (feuille de route)

1. **Finir la validation A→F** (C, D, E, F ci-dessus), en corrigeant les manques du moteur au fur
   et à mesure et en **généralisant** chaque correctif (jamais par feature).
2. **Puis : one-shot de TOUS les guides restants.** Objectif de fond du projet : une fois les
   catégories de risque validées, le moteur doit permettre de documenter **n'importe quelle feature
   (présente ou future) en one-shot**. Après A–F, passer en revue tous les `.mdx` de
   `apps/help/src/content/docs/{en,fr}/` et leur ajouter/aligner une animation live, en réconciliant
   à chaque fois le contenu MDX (EN+FR).
3. **Theming par tenant (couleur par client)** — l'app `apps/help` est **prête** (couleur pilotée
   par variable d'environnement), mais c'est **BLOQUÉ côté infra** : le job de déploiement de
   `help` doit **injecter la couleur du tenant** (variable d'env) au build/déploiement. Action :
   côté infra/CI, brancher la variable de couleur par tenant. Voir aussi la variable d'accent du
   player (`--lwp-accent`) si on veut que l'anneau suive la couleur du tenant.
4. **Dettes techniques / points à surveiller :**
   - La liste d'overlays de `resetTransient` (moteur) et le câblage `OverlayProvider` de
     `packages/ui` sont **tenues en phase à la main**. Si on ajoute une **nouvelle** primitive
     overlay, penser à (a) la câbler au contexte et (b) l'ajouter à `resetTransient`. Amélioration
     possible : rendre `resetTransient` générique (sélecteur `[data-slot$="-content"][data-state="open"]`)
     — attention à ne pas viser des non-overlays (collapsible/accordion ont aussi `data-state`).
   - **Drawer (vaul)** : en mode `dismissable:false` vaul désactive **aussi Échap**, donc un drawer
     *piloté* ne serait pas refermable par le director. Sans impact aujourd'hui (aucun guide n'en
     pilote) — à revoir si un guide utilise un drawer.
   - Optionnel : appliquer la rigueur « état évolutif » à **web-sources** (il montre une source
     existante pendant l'étape « explorer un nouveau site » — acceptable mais perfectible).

## Décisions déjà prises (ne pas re-débattre sauf raison nouvelle)

- **Instance unique** : l'app est montée **une seule fois** ; le player ne la remonte jamais (le
  director navigue + dispatch en place). Choix validé pour la fluidité (pas de flash entre étapes).
- **Délai de chargement ~1,3 s** (chunk de la vraie app, ~2,8 Mo) : **accepté tel quel**. Le
  préchargement sur la page d'accueil a été exploré puis **abandonné**.
- **Style de l'anchor** : anneau simple **clignotant** (clignotement lent, l'anneau ne passe jamais
  à zéro). Les variantes spotlight/crossfade ont été **rejetées**.
- **Marges** : pas de scaling ni de plafond inventés ; on s'appuie sur les marges natives de l'app.
  Pour les vues larges qui débordent dans la colonne étroite, la réponse retenue est le **plein
  écran** (bouton dans le player), pas une réduction à l'échelle.

## Directives de rédaction des guides (rappel — détail dans `CLAUDE.md`)

- Terminologie : toujours « **workspace** » / « **espace de travail** », jamais « project/projet ».
- Les libellés (boutons, menus) doivent **correspondre à la vraie UI** (locales `apps/web`) — les
  guides nourrissent les réponses de l'IA.
- Double public (humain + IA) : niveau de détail, squelette MDX et catégories décrits dans
  `CLAUDE.md` → « Guide Authoring Playbook ».
- Les intros ne mentionnent que **Prev/Next**, jamais les « points » de navigation.

## Lancer / vérifier

- Dev : `cd apps/help && npx astro dev` (→ `http://localhost:4334`).
- Confirmer le code servi : `curl http://localhost:4334/src/walkthroughs/<Fichier>.tsx`.
- Scope : toutes les écritures restent dans `apps/help`, **sauf** le câblage overlay déjà fait dans
  `packages/ui` (exception autorisée).
- Critères de complétion (racine `CLAUDE.md`) : `npm run biome:check` + `npm run typecheck` doivent
  passer. Note : `tsc` lancé depuis `apps/help` remonte un **bruit préexistant** d'alias `@/` sur des
  fichiers `apps/web` (imports résolus au bundle, pas par tsc) — l'ignorer.
