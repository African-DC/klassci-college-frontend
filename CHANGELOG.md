# Changelog

Toutes les évolutions notables de KLASSCI College Frontend (Next.js) sont
documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et
le projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Changed

- Vue Table de la page Matières refondue avec groupage par catalogue : chaque matière apparaît une seule fois (au lieu de 5 lignes dupliquées par niveau), avec un chevron pour déplier les instances et voir coefficient, heures et enseignant pour chaque niveau. Filtres « par niveau » et « avec/sans enseignant » et bandeau de stats : matières uniques, instances totales, heures cumulées *(admin)*.

### Added

- Suivi des présences enseignant sur la fiche `/admin/teachers/[id]` : nouvel onglet « Présences » avec taux de présence, absences, retards cumulés en minutes et compteur d'auto-déclarations à valider. L'admin saisit en un clic absence ou retard en choisissant la date, le créneau EDT concerné et un motif *(admin)*.
- Auto-déclaration côté enseignant : bouton « Me déclarer absent » sur le tableau de bord prof pour signaler une absence ou un retard. La déclaration arrive en attente de validation côté admin avec un encart d'avertissement amber pour rappeler le contact secrétariat si urgent *(enseignant)*.
- Validation en deux clics côté admin : panel amber « Auto-déclarations en attente » sur la fiche enseignant, boutons Valider (vert) et Rejeter (rose) avec un champ de notes administratives optionnel et un dialog de confirmation pour le rejet *(admin)*.
- Personnalisation de l'identité visuelle des PDFs depuis les paramètres de l'établissement : nouvel onglet « Identité visuelle » avec sélecteurs de couleur principale et d'accent, devise de l'école et site web, avec un aperçu en direct du reçu qui se met à jour à chaque modification. Touch targets h-11 mobile *(admin)*.
- L'aperçu en direct reproduit fidèlement le rendu du reçu avec bandeau République de Côte d'Ivoire, logo, code MENA, devise en italique, montant gradient, tableau d'allocation avec pastilles colorées et pied de page personnalisé *(admin)*.
- Bouton « Aperçu PDF » qui télécharge un bordereau du jour pour vérifier l'identité visuelle appliquée *(admin)*.
- Versement caissier Wave-style : 3 champs seulement (montant, méthode, référence), l'allocation aux frais impayés se fait automatiquement par priorité avec un aperçu en direct qui montre où va chaque XOF avant de valider *(admin)*.
- Aperçu d'allocation interactif dans le formulaire de versement : pastilles vertes/oranges/grises indiquent quels frais seront soldés ou complétés, et un encart amber prévient si le montant dépasse la dette restante *(admin)*.
- Connexion multi-tenant : un utilisateur d'établissement arrive sur `college.klassci.com/login?c=<slug>` (lien WhatsApp, email d'invitation), l'établissement s'affiche au-dessus du formulaire et reste mémorisé pour les visites suivantes *(admin, enseignant, parent, élève)* (#183).
- Aperçu du lien de connexion généré dans le formulaire de création de tenant, avec conseil de choisir un slug court et mémorable (ex : `lmab`, `cca-2026`) — l'admin du super-admin sait exactement ce que recevra le nouvel établissement *(super-admin)* (#183).
- Section super-admin complète (`/super-admin/*`) : tableau de bord pour onboarder une école sans SSH ni terminal. Liste des tenants avec taille de base, formulaire de création en 3 étapes (nom + slug avec disponibilité vérifiée en direct, compte administrateur, détails optionnels) et progression visible des étapes pendant les 10-30 secondes du provisioning *(super-admin)* (#176).
- Gestion des tokens d'accès personnels (`/super-admin/pats`) pour le CLI et les agents IA : création avec scopes, expiration en jours, copie en un clic du token clair (montré une seule fois), liste avec statut (actif / expiré / révoqué), révocation avec confirmation *(super-admin)* (#176).
- Diagnostic plateforme (`/super-admin/diagnose`) : vue d'ensemble de l'état du backend, de la base, de Redis et de la configuration SMTP avec rafraîchissement automatique toutes les 30 secondes et un bouton de rafraîchissement manuel *(super-admin)* (#176).
- Lecture des logs (`/super-admin/logs`) : viewer terminal noir, sélection du service (backend / frontend / celery / nginx), pause/reprise du tail, badges qui indiquent le nombre de secrets masqués et si la sortie est tronquée *(super-admin)* (#176).
- Fiche détail d'un tenant (`/super-admin/tenants/[slug]`) : 6 statistiques (utilisateurs / élèves / enseignants / personnel / inscriptions / paiements), paramètres de l'établissement et version de migration en cours *(super-admin)* (#176).

### Fixed

- Liste des bulletins refondue : nom complet de l'élève, matricule et avatar à initiales s'affichent désormais au lieu d'identifiants techniques `#3`. La fenêtre de détail montre l'élève, sa classe, la moyenne générale, le rang `1/3`, la mention complète et le détail par matière avec coefficient *(admin)*.
- Page DREN qui ne chargeait plus depuis l'ajout du champ moyenne par classe : le tableau de bord des statistiques affiche désormais correctement l'effectif, la répartition garçons/filles, le taux de réussite et le détail par niveau *(admin)*.
- Téléchargement d'un PDF en erreur : un toast d'erreur clair apparaît désormais avec le message du serveur (ex : bibliothèque PDF manquante), au lieu d'un silence trompeur où l'admin ne savait pas ce qui se passait *(admin, parent, enseignant)*.
- Fiche élève / onglet « Parcours » : les graphes Moyennes et Absences par trimestre affichent désormais les vraies données du bulletin et non plus un faux message « Pas encore de notes » alors que les bulletins existent *(admin)*.
- Tableau de bord parent qui affichait toujours « Connexion au serveur impossible » depuis le ship du portail parent : on voit désormais pour chaque enfant la classe, la moyenne, le nombre d'absences et le solde restant à payer, en un coup d'œil dès la connexion *(parent)*.
- Quand la session expire silencieusement, on n'affiche plus l'identité de l'ancien utilisateur sur la barre de navigation et la page d'accueil : la redirection vers la page de connexion se fait immédiatement, sans flicker de données périmées *(tous)* (#164).
- Page de connexion qui boucle en `ERR_TOO_MANY_REDIRECTS` quand le jeton d'accès est expiré : avec `RefreshTokenError`, le middleware redirigeait `/login → /<portail> → /login` à l'infini car la session restait techniquement « connectée ». La page de connexion est désormais toujours accessible quand la session est en erreur, ce qui permet à l'utilisateur de se reconnecter *(tous)* (#151).
- Bulletins côté admin : la liste, la prévisualisation, la génération, la publication et le téléchargement PDF étaient tous cassés en silence (404 ou réponse Celery vide) car ils visaient les anciens endpoints racine. Tout pointe désormais sur `/reports/bulletins/*` et la génération retourne immédiatement les bulletins créés *(admin)* (#142).

### Added

- Liste des parents côté admin (`/admin/parents`) : entrée dans le menu Scolarité, recherche, pagination, et création/édition/suppression directement depuis la liste avec un compte de connexion optionnel *(admin)* (#161).
- Bouton « Modifier » sur la fiche parent : on peut désormais corriger nom, prénom, téléphone, email, ville et commune sans passer par la fiche d'un élève *(admin)* (#161).
- Fiche détail parent côté admin (`/admin/parents/[id]`) : un seul écran qui montre les enfants liés (en un tap on ouvre la fiche de l'enfant), le téléphone clickable pour appeler, l'email, la ville/commune, le statut du compte (En attente / Actif / Désactivé) *(admin)* (#157).
- Onglet « Documents » fonctionnel sur la fiche élève admin : deux cartes pour télécharger le certificat de scolarité et l'attestation de fréquentation au format PDF officiel République de Côte d'Ivoire en un clic. Boutons mobile-friendly h-11 *(admin)* (#145).
- Page « Documents » côté portail parent : `/parent/children/[id]/documents` permet au parent de télécharger lui-même le certificat de scolarité et l'attestation de fréquentation de son enfant depuis son téléphone. Layout Wave-style mobile-first *(parent)* (#145).
- Bouton « Documents » ajouté à côté de « Notes » et « Frais » sur la liste des enfants côté parent *(parent)* (#145).
- Champs « Nom du chef d'établissement » et « Titre / fonction » dans les paramètres de l'établissement, indispensables pour signer les documents officiels *(admin)* (#145).
- Promotion en masse de fin d'année : nouvelle page « Promotions » qui aide l'admin à transformer en quelques clics les inscriptions valides d'une année vers la suivante, avec aperçu des élèves promus, avertissements de capacité et rapport détaillé des exceptions *(admin)* (#133).
- Mode dictée vocal plein écran pour saisir les notes sans regarder l'écran, optimisé Chrome Android et iOS Safari *(enseignant)* (#108).
- Création d'évaluation déléguée : un admin ou un personnel administratif peut créer une évaluation au nom d'un enseignant, avec sélection explicite du titulaire *(admin)* (#108).
- Matrice rôles × permissions enfin utilisable : groupement à deux niveaux, recherche, pastilles d'actions et libellés français *(admin)* (#108).
- Lien "Rôles & permissions" depuis les paramètres de l'établissement pour découvrir la matrice *(admin)* (#108).
- Hooks de bootstrap E2E (workflow CI avec backend réel + base de données + comptes de test seedés) pour fiabiliser les tests qui passent par le login *(devops)*.
- Page « Mes évaluations » côté portail enseignant : hero avec indicateurs clés, filtre par classe, onglets de statut (À saisir / En retard / Terminées) et bouton « Saisir » qui ouvre la grille de saisie ou le mode dictée *(enseignant)* (#111).

### Changed

- Fiche élève repensée pour le terrain : Vue d'ensemble centrée sur l'action (solde de paiements, parents avec téléphone clickable « Appeler »), bandeau bleu Wave-style pour le reste à payer, accès direct à la classe en un tap. Plus de doublon entre Vue d'ensemble et Profil *(admin)* (#139).
- Fiche élève sur mobile : plus de débordement horizontal, photo réduite, onglets ré-ordonnés par usage (Vue, Paiements, Parents, Inscriptions...), boutons d'action regroupés dans un menu pour éviter les suppressions accidentelles *(admin)* (#139).
- Fiches enseignant et personnel sur mobile : même traitement que la fiche élève — plus de débordement horizontal, photo réduite, onglets qui défilent latéralement, boutons d'action regroupés dans un menu, téléphone enseignant clickable pour appel direct *(admin)* (#149).
- Vue d'ensemble enseignant rendue actionnable : les 4 indicateurs (classes, élèves, heures, disponibilité) sont des cartes clickables qui ouvrent l'onglet correspondant en un tap, plus de doublon « Spécialité » avec l'en-tête, statut de compte plus juste (« En attente » au lieu de « Inactif » pour un compte jamais utilisé) *(admin)* (#151).
- Onglet Profil personnel allégé : plus de doublon « Poste » avec l'en-tête, statut de compte avec le même tri-état que les autres fiches (« En attente » / « Désactivé » / « Actif ») *(admin)*.
- Onglet Paiements de la fiche élève : les boutons d'action « Régénérer les frais » et « Enregistrer un paiement » s'empilent verticalement sur mobile au lieu de déborder hors de l'écran *(admin)* (#141).
- Onglet Profil allégé : le matricule, le genre et l'email apparaissent une seule fois (déjà visibles dans l'en-tête ou la section Compte) au lieu d'être répétés *(admin)* (#141).
- Statut du compte utilisateur plus juste : « En attente » (orange) si l'élève n'a jamais ouvert le portail, « Désactivé » (rouge) seulement si le compte a été explicitement désactivé. Plus de « Inactif » rouge alarmant pour un simple compte non-encore-utilisé *(admin)* (#141).
- Création d'une classe simplifiée : plus de champ « année académique » à choisir. Les classes sont permanentes, l'année est portée par chaque inscription. Le formulaire de classe ne demande que nom, niveau, série, salle et capacité *(admin)* (#97).
- Promotion de fin d'année simplifiée : un seul catalogue de classes pour la source et la cible, les doublons « 6ème A 2025-2026 / 6ème A 2026-2027 » disparaissent *(admin)* (#97).
- Page Inscriptions repensée queue-first : on voit d'un coup d'œil la queue à valider, on valide une inscription en un tap depuis la liste avec confirmation, plus de cartes de KPI redondantes *(admin)* (#121).
- Confirmation propre par dialogue (au lieu du dialogue système du navigateur) avant de quitter le mode dictée avec des saisies non enregistrées *(enseignant)* (#108).
- Page Élèves repensée : on voit enfin la classe de chaque élève d'un coup d'œil, on filtre par classe ou « à inscrire » d'un tap, et la version mobile s'aligne sur le terrain *(admin)* (#116).
- Création d'évaluation : la liste des matières se filtre automatiquement selon la classe choisie, plus rapide à parcourir et impossible de se tromper de matière *(admin)* (#112).
- Saisie des notes : sauvegarde déclenchée après une courte pause, avec retour visuel et statistiques en temps réel *(enseignant)* (#108).
- Page de supervision des notes côté admin : hero card avec indicateurs clés, filtres classe/matière/trimestre, onglets de statut *(admin)* (#108).

### Fixed

- En-tête des pages Inscriptions et Élèves qui débordait à droite sur mobile (le bouton « Nouvelle inscription » mangeait la place du titre) : on empile désormais titre et bouton sur petit écran et on ajuste la taille du titre *(admin)*.
- En-tête de la page Classes qui débordait sur mobile (bouton « Nouvelle classe » coupé hors écran) : même empilement vertical mobile + boutons toggle Arbre/Table qui passent à la ligne si nécessaire *(admin)*.
- Fiche élève qui affichait le nom alternatif de l'image quand la photo n'était pas disponible : on affiche désormais directement les initiales sur fond bleu *(admin)* (#139).
- Liste des inscriptions qui restait en chargement infini après la refonte queue-first : la page demandait plus d'inscriptions à la fois que le serveur ne le permet *(admin)* (#131).
- Sélection de l'enseignant titulaire vide dans le formulaire de création d'évaluation côté admin *(admin)* (#109).
- Initialisation du retour audio du mode dictée hors interaction utilisateur, qui empêchait silencieusement le bip de confirmation sur iPhone *(enseignant)* (#108).
- Bouton micro restait actif après refus de l'autorisation, promettant un fonctionnement impossible *(enseignant)* (#108).
- Tableau de bord enseignant et élève qui boucle sur « Connexion impossible » : alignés avec les nouveaux chemins backend *(enseignant, élève)* (#111).
- Page « Mes notes » du portail enseignant qui était inaccessible (lien sidebar vers une page absente) *(enseignant)* (#111).

### Security

- Endpoint d'exposition des permissions effectives sécurisé par JWT et tenant scope, consommé par le portail pour le gating UI *(tous)* (#108).

## [0.1.0-alpha] - 2026-04-26

Première version alpha déployée en production sur `https://college.klassci.com`. Le périmètre couvre les quatre portails (admin, enseignant, parent, élève) avec une cible mobile-first pensée pour Mme Diallo (52 ans, Itel S661).

### Added

#### Authentification et accès

- Page de connexion premium avec logo KLASSCI, typographie sérif et toggle de visibilité du mot de passe *(tous)*
- Connexion par email et mot de passe avec maintien de session entre les onglets *(tous)*
- Renouvellement automatique de session sans déconnexion intempestive *(tous)*
- Redirection vers le bon portail selon le rôle après connexion *(tous)*
- Mode dégradé : navigation libre quand le serveur est indisponible (développement) *(admin)*

#### Portail admin

- Tableau de bord avec indicateurs clés, graphiques d'inscriptions et flux d'activité récente *(admin)*
- Bandeau d'année académique courante visible sur toutes les pages *(admin)*
- Mode sombre et mode clair, basculables depuis la barre du haut *(admin)*
- Barre latérale complète avec accès rapide à toutes les sections *(admin)*
- Page Année académique : création, mise en cours, archivage avec badge global *(admin)*
- CRUD étudiants avec photo, fiche 360° (profil, inscription, paiements, présences, documents) (#80) *(admin)*
- CRUD enseignants avec photo, onglets évaluations et emploi du temps *(admin)*
- CRUD personnel administratif avec fiches détaillées *(admin)*
- CRUD parents avec rattachement à plusieurs enfants *(admin)*
- Page Niveaux et séries en arborescence type explorateur de fichiers, repliable et modifiable *(admin)*
- Page Classes en arbre avec glisser-déposer entre niveaux et séries *(admin)*
- Page Salles en grille visuelle avec création par lot et liaison aux classes *(admin)*
- Page Matières en kanban : catalogue de matières et assignation par niveau, couleurs personnalisables, glisser-déposer *(admin)*
- Inscriptions : formulaire multi-étapes (nouvelle inscription ou ré-inscription), choix de classe, frais affichés par catégorie obligatoire/optionnelle (#87) *(admin)*
- Frais : configuration multi-niveaux, frais obligatoires et optionnels avec sous-options, montants en FCFA *(admin)*
- Paiements : enregistrement, reçu PDF, filtres par catégorie et plage de dates, recherche, KPIs *(admin)*
- Bulletins : génération, téléchargement PDF individuel et téléchargement par lot pour une classe *(admin)*
- Conseil de classe : table de délibération, génération du PV en PDF *(admin)*
- Statistiques DREN : graphiques, exports Excel et PDF authentifiés *(admin)*
- Présences : appel par grille, historique et statistiques par classe *(admin)*
- Emploi du temps : grille style Google Calendar, créneaux multi-heures, génération automatique avec diagnostic, export PDF *(admin)*
- Notifications : cloche dans la barre du haut avec compteur, page de gestion *(admin)*
- Rôles et permissions : matrice rôles × permissions avec création de rôles personnalisés *(admin)*
- Paramètres : informations école, format des matricules, configuration des trimestres et notifications *(admin)*

#### Portail enseignant

- Tableau de bord enseignant avec accès rapide aux classes du jour *(enseignant)*
- Page Mes classes avec liste des élèves et accès aux évaluations *(enseignant)*
- Page Emploi du temps personnel sur la semaine, samedi inclus *(enseignant)*
- Saisie de présences sur la grille de classe *(enseignant)*
- Saisie des notes par évaluation *(enseignant)*
- Navigation par barre du bas optimisée mobile *(enseignant)*

#### Portail parent

- Tableau de bord avec liste des enfants scolarisés *(parent)*
- Consultation des notes et bulletins par enfant, avec téléchargement PDF *(parent)*
- Suivi des frais et paiements avec barre de progression *(parent)*
- Emploi du temps de chaque enfant *(parent)*
- Navigation par barre du bas optimisée mobile *(parent)*

#### Portail élève

- Tableau de bord élève avec aperçu de la journée *(élève)*
- Consultation des notes et bulletins *(élève)*
- Emploi du temps personnel avec samedi *(élève)*
- Historique des présences et absences *(élève)*
- Suivi de ses frais de scolarité *(élève)*

#### Transverse

- Application en français avec accents propres sur tous les écrans *(tous)*
- Devise XOF affichée en FCFA partout dans l'application *(tous)*
- Photos de profil et avatars avec initiales en repli *(tous)*
- Tableaux avec recherche, tri par colonne et filtres *(admin)*
- Compte utilisateur créé automatiquement à la création d'un étudiant ou enseignant *(admin)*
- Bouton de configuration d'email pour les comptes sans adresse *(admin)*

### Changed

- Interface entièrement repensée en version premium avec en-têtes à icône, cartes KPI cohérentes et palette KLASSCI orange `#F58220` *(admin)*
- Pages détail (étudiants, enseignants, personnel, inscriptions) refondues sur six onglets avec cercle de progression *(admin)*
- Tables d'administration : actions inline (œil, crayon, corbeille) à la place du menu déroulant caché, clic sur la ligne ouvre la fiche *(admin)*
- Création d'évaluation déléguée à un rôle configurable plutôt que limitée aux enseignants (#108) *(admin, enseignant)*
- Boutons d'action rapide du tableau de bord ouvrent directement la modal concernée *(admin)*
- Couleurs des cartes de frais basées sur le caractère obligatoire ou optionnel, plus sur un index arbitraire *(admin)*

### Fixed

- Connexion : protection contre les redirections ouvertes après login *(tous)*
- Connexion : plus de boucle de redirection en cas de session expirée *(tous)*
- Tableau de bord : affichage de zéros à la place du chargement infini quand le serveur ne répond pas *(admin)*
- Inscriptions : matricule désormais obligatoire avec indication de génération automatique et lien vers les paramètres *(admin)*
- Frais : calcul du total corrigé (plus de NaN affiché) et catégories obligatoires/optionnelles correctement séparées *(admin)*
- Paiements : barre de progression visible, totaux toujours à jour après régénération des frais *(admin)*
- Paiements : bouton de régénération des frais désormais visible et fonctionnel *(admin)*
- Étudiants : photo de profil chargée correctement quel que soit l'écran *(admin)*
- Étudiants : modal d'édition ne plante plus, lignes d'inscription cliquables *(admin)*
- Emploi du temps : créneaux multi-heures correctement affichés, format `2h30` au lieu de `2.5h` *(admin)*
- Emploi du temps : boutons « + » présents dans tous les espaces libres avec heure de début intelligente *(admin)*
- Emploi du temps : filtrage des salles par classe et auto-sélection de l'enseignant selon la matière *(admin)*
- Emploi du temps : bouton de génération sort correctement de l'état de chargement *(admin)*
- Emploi du temps des portails enseignant, parent et élève : samedi désormais affiché, plage 07h-18h *(enseignant, parent, élève)*
- Présences : exclusion des élèves non encore pointés du calcul de taux *(admin)*
- Notifications : déduplication et compteur correct *(tous)*
- Téléchargements (DREN, bulletins, reçus) : authentification incluse pour éviter les téléchargements vides *(admin, parent)*

### Security

- Authentification basée sur NextAuth.js v5 avec JWT signé côté serveur *(tous)*
- Token de rafraîchissement stocké en cookie HttpOnly et SameSite Strict, jamais exposé au navigateur *(tous)*
- Liste blanche des hôtes autorisés (`college.klassci.com` et sous-domaines tenants) appliquée dans le middleware (#106, #107) *(infra)*
- Validation runtime des réponses API par schémas Zod, refus des payloads non conformes *(infra)*
- En-têtes de sécurité actifs : Content-Security-Policy en mode Report-Only, HSTS, X-Frame-Options, Permissions-Policy *(infra)*
- Mises à jour majeures : Next.js 15.5.14 (correction de 11 CVE dont 2 critiques), esbuild ≥ 0.25.0 (CVE serveur dev), `lodash` et `picomatch` via overrides *(infra)*
- Liens externes via `Link` Next.js avec routage typé pour bloquer les redirections injectées *(tous)*

### Observability

- Sentry initialisé côté frontend pour la remontée d'erreurs en production *(infra)*
- Tests end-to-end Playwright sur les parcours critiques de connexion *(infra)*

[unreleased]: https://github.com/African-DC/klassci-college-frontend/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/African-DC/klassci-college-frontend/releases/tag/v0.1.0-alpha
