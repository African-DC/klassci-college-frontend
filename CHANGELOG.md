# Changelog

Toutes les évolutions notables de KLASSCI College Frontend (Next.js) sont
documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et
le projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Fixed
- Répercuter un tarif ne crée plus de dette chez des familles qui n'en avaient pas : la création se demande à part *(admin, comptable)*
- La simulation d'échéancier annonce pour quel public elle vaut et n'y mêle plus les tarifs réservés à un autre profil *(admin)*
- En thème sombre, l'aperçu du logo reste sur fond blanc et le message d'erreur d'envoi redevient lisible *(admin)* (#417)
- L'écran des frais s'ouvre sur l'année en cours et laisse en changer, avec un repère visible quand l'année choisie n'est pas la courante *(admin, comptable)*
- Une ligne de frais réglée en nature n'apparaît plus comme impayée à 0 F, sur la fiche de l'élève comme dans les portails famille *(admin, comptable, parent, élève)*
- Les montées de dépendances passent la validation de nom de branche, au lieu de forcer une fusion qui contourne tous les contrôles *(technique)*
- Les boutons Valider, Annuler, Restaurer et Supprimer s'annoncent à nouveau avec une espace : un lecteur d'écran disait « Annulerle versement » *(admin)*
- Valider ou annuler un versement met à jour la ligne immédiatement, y compris au-delà de la première page chargée *(admin)*
- La carte « Collecté » ne prétend plus suivre le filtre quand elle parle de l'année entière *(admin)*
- La liste des élèves distingue désormais « En attente de validation » de « À inscrire », et affiche des libellés lisibles au lieu des valeurs de la base *(admin)*
- La photo de profil apparaît enfin dans la barre de navigation, au lieu des seules initiales *(tous)*
- Le motif d'annulation d'un versement s'affiche désormais à l'identique sur ordinateur et sur téléphone *(admin)*
- Photo de l'élève correctement recadrée dans le journal des versements, au lieu d'être étirée quand elle n'est pas carrée *(admin)*
- Annulation d'un versement déjà encaissé, depuis le tableau comme depuis le téléphone : c'est le cas courant, un montant saisi qui n'est pas dans la caisse *(admin)*

### Added
- Un tarif peut ne concerner que les nouveaux élèves ou que les anciens : l'autre groupe ne le paie pas du tout *(admin, comptable)*
- À l'inscription, le secrétariat dit si l'élève est nouveau, et le corrige ensuite depuis la fiche : rien n'est deviné à sa place *(admin, secrétariat)* (#419)
- « Régénérer les frais » existe aussi sur la fiche inscription, avec une confirmation qui dit ce qui sera remplacé et ce qui sera conservé *(admin, comptable)* (#419)
- Le formulaire d'encaissement laisse choisir quel frais reçoit quoi, du téléphone à l'ordinateur : un versement inscription et tenue s'enregistre tel qu'il a été payé *(caissier, admin)*
- Onglet « Identité visuelle » : le logo de l'établissement s'envoie, se remplace et se retire, avec aperçu immédiat sur les documents officiels *(admin)*
- Bouton « Bordereau du jour » sur « Ma caisse » : la caissière édite sa propre pièce de caisse, sans dépendre du comptable ni du point journalier auquel elle n'a pas accès *(caissier)*
- Un frais réglé en nature se marque à l'inscription et sur la fiche de frais : la ligne cesse alors d'être due en argent et n'entre plus dans le reste à payer *(admin, secrétariat, comptable)*
- Un élève déjà enregistré est signalé pendant la saisie : matricule identique, ressemblance du nom, ou inscription déjà ouverte sur l'année même non validée *(admin, secrétariat)*
- Sélection de plusieurs inscriptions et validation en une fois, chaque refus étant signalé avec son motif *(admin)*
- Ouvrir la cloche marque comme lues les notifications affichées, et cliquer dessus mène à l'écran où l'on fait l'action attendue *(tous)*
- L'annulation d'un versement demande un motif écrit, affiché ensuite sous le statut dans le journal des paiements *(caissier, comptable, directeur)*
- L'enseignant déclare ses indisponibilités depuis « Mon emploi du temps », sur la même grille que celle de sa fiche côté administration *(enseignant)*
- Le formulaire de créneau affiche la semaine de l'enseignant choisi, cours dans les autres classes et plages fermées, et prévient avant d'enregistrer quand l'horaire visé ne passe pas *(directeur des études, secrétariat, admin)*
- Onglet « Moyens de paiement » dans Paramètres : pour chaque profil qui encaisse, on coche les moyens qu'il a le droit de saisir. Retirer les espèces au comptable prend deux clics, et l'écran prévient qu'autoriser les espèces engage une journée de caisse à ouvrir et à compter *(admin, directeur)*
- Wave, MTN MoMo, Orange Money et Moov Money se choisissent séparément au guichet, au lieu d'un « Mobile Money » unique qui obligeait le comptable à démêler ses relevés *(caissier, comptable, secrétariat)*
- Colonne « Encaissé par » sur l'écran des versements, dans le tableau comme sur les cartes du téléphone, et filtre par caisse pour la comptabilité qui veut contrôler un guichet *(comptable, directeur, caissier)*
- Aperçu avant impression du journal des versements, comme sur les autres écrans qui produisent un document *(comptable, caissier)*
- Après avoir corrigé le montant d'un frais, l'écran demande s'il faut le répercuter sur les inscriptions déjà enregistrées, et montre l'impact chiffré avant de trancher : lignes à mettre à jour, lignes conservées parce qu'un versement y est imputé, écart de dette en francs. Répondre non ne change rien, et la question se repose depuis la grille des frais *(admin, comptable)*
- Champ « Lieu de naissance » à côté de la date, à la création d'un élève, à sa modification et à l'étape élève de l'inscription. Il s'affiche sur la fiche détail et part sur le certificat de scolarité, que l'administration refuse sans la mention « né(e) le ... à ... » *(secrétariat, admin)*
- L'export de la liste des élèves emporte le lieu de naissance à côté de la date *(secrétariat, admin)*
- Bouton « Bordereau du jour » sur le point journalier : le comptable édite la pièce comptable de la journée depuis l'écran où il la consulte, au lieu d'aller la chercher dans l'aperçu des paramètres *(comptable)*
- Chaque caisse du point journalier montre sa ventilation par moyen de paiement, espèces, mobile money, virement et chèque : rapprocher un dépôt bancaire d'une caisse ne demande plus d'ouvrir le détail des versements *(comptable, directeur)*
- Une catégorie de frais décrit ce qu'elle donne droit, ligne par ligne : ce que la famille vient retirer et ce à quoi elle accède. Un exemple guide la première saisie *(admin, comptable)*
- Bouton « Ce que ça couvre » sur la grille des frais et sur le détail des frais d'un élève : le secrétariat répond à un parent sans chercher dans ses papiers *(admin, secrétariat)*
- Bandeau « Ma caisse » qui signale les journées clôturées d'office pendant la nuit et permet de les régulariser en saisissant ce qui avait été compté *(caissier)*
- Une journée non comptée affiche « Écart inconnu » et non un écart nul : le comptable voit la différence entre une caisse qui tombe juste et une caisse que personne n'a ouverte *(caissier, comptable)*
- Chaque tranche de paiement se saisit au choix en pourcentage ou en montant fixe, dans la même grille : « Inscription 37 000 FCFA à la rentrée », puis 35 / 35 / 30 % du reste *(admin, comptable)*
- Simulation en direct sous la grille : on choisit un niveau et la situation de l'élève, affecté ou non, et l'on voit les francs que recevra chaque famille avant d'enregistrer *(admin, comptable)*
- Rapport de fin de trimestre de la DEEP téléchargeable depuis Rapports : on choisit l'année et le trimestre, on obtient le canevas officiel des vingt-sept tableaux, avec aperçu avant impression *(admin, directeur)*
- Bouton « Demande de dossier scolaire » sur la fiche élève : le courrier réclamant le dossier à l'établissement d'origine se télécharge en un clic, scellé pour être vérifiable *(admin)*.
- Billet d'entrée depuis l'écran des présences : sur une absence non régularisée, l'éducateur saisit la date de reprise et le motif, l'absence passe en excusée dans le cahier d'appel et le billet s'imprime *(admin)*.
- Écran « Convocations de parent » : le registre montre qui a été convoqué, quand, et qui est venu. Une convocation s'émet en trois champs, la suite donnée se consigne après le rendez-vous, la convocation se télécharge pour la famille *(admin)*.
- Écran « Autorisations de reprise » : le billet d'annulation de zéro lève le zéro d'office des évaluations manquées pour absence justifiée. Seules les évaluations réellement manquées sur la période sont proposées, le billet se télécharge *(admin)*.
- Case « Abs. » sur la feuille de saisie des notes : un élève absent le jour de l'épreuve reçoit un zéro qui compte dans la moyenne, distinct d'une case laissée vide qui veut dire « pas encore corrigé ». Le mode dictée enregistre désormais la même chose quand on dit « absent » *(enseignant)*.
- Sexe et type de contrat de l'enseignant, permanent, vacataire ou fonctionnaire, à la création comme à la modification de sa fiche. Les deux se lisent sur la fiche, le contrat apparaît aussi dans la liste des enseignants, et l'un comme l'autre s'affichent « Non renseigné » tant qu'ils ne sont pas saisis *(admin)*.
- Bouton « Archiver » sur les fiches élève, parent, enseignant, personnel et inscription : la fiche quitte les listes après un motif et cinq secondes de maintien, et reste récupérable dans la corbeille *(admin, directeur)*.
- Écran « Corbeille » : les fiches retirées des écrans restent conservées, avec qui les a archivées, quand et pourquoi, et se restaurent en un clic *(admin, directeur)*.
- Les gestes qui ne se rattrapent pas demandent un motif et se confirment en maintenant le bouton appuyé, cinq secondes pour archiver, dix pour supprimer définitivement. Le motif part au journal et à la direction *(admin, directeur)*.
- Affectation de l'élève à l'inscription : affecté, réaffecté ou non affecté, avec le numéro de décision demandé uniquement quand il sert. Le montant des frais suit automatiquement *(secrétariat, éducateur)*.
- Un montant de frais peut ne valoir que pour les affectés ou que pour les non affectés. L'arbre des frais affiche la portée, si bien que deux montants sur le même niveau ne passent plus pour un doublon *(comptable)*.
- L'affectation se lit et se corrige partout : pastille de couleur dans la liste des inscriptions, rappel sur la fiche avec le numéro de décision, et modification depuis l'inscription quand la décision du ministère arrive après coup. La liste se filtre par affectés, non affectés ou non renseigné, pour retrouver les dossiers dont l'affectation reste à saisir *(secrétariat, comptable)*.
- Copie de montants de frais : la portée d'affectation suit désormais le montant copié, et les lignes du même niveau se distinguent à l'écran. Un tarif réservé aux affectés ne devient plus applicable à tout le monde à la copie *(comptable)*.

- Écran « Tranches de paiement » : l'établissement découpe le total des frais obligatoires en tranches exprimées en part du total, avec leur date limite. Le total des parts doit faire 100 %, et l'écran le signale en direct tant que ce n'est pas le cas *(comptable)*.
- Échéancier sur la fiche inscription, sous la synthèse des frais : ce qui est dû, à quelle date, ce qui est déjà exigible, et la prochaine échéance. Une famille qui respecte son calendrier est affichée « à jour », même si elle n'a pas encore tout versé *(admin, comptable)*.
- Écran « Ma caisse » pour le caissier : ce qu'il a encaissé aujourd'hui, ventilé par moyen de paiement, et la clôture de journée. Il compte son tiroir, saisit le montant, l'écart s'affiche avant validation et la journée se verrouille *(caissier)*.
- Le « Reste à payer » disparaît des fiches élève et parent pour qui n'a pas le droit de lire les montants, remplacé par une pastille « À jour » ou « En retard » et la date du dernier versement. L'onglet Paiements n'apparaît plus à ces personnes *(éducateur, directeur des études)*.
- Écran « Journal d'audit » : qui a fait quoi, sur quelle fiche et quand, filtrable par action, par type d'information, par personne et par période. Le détail d'une ligne montre uniquement les champs qui ont changé, avant et après *(admin, directeur)*.
- Le comptable ouvre le même écran sur le seul périmètre financier, et le sous-titre le dit : il sait qu'il regarde une partie du journal, pas la totalité *(comptable)*.
- Cadenas sur les documents officiels : quand des échéances arrivées à terme restent dues, le certificat de scolarité, l'attestation de fréquentation et le bulletin affichent le montant exact à régler au lieu d'un bouton qui échoue. Le parent voit où aller payer *(parent, admin)*.
- Dérogation depuis la fiche élève : le chef d'établissement délivre le document malgré la dette après avoir saisi un motif, et l'écran prévient que la décision est enregistrée *(admin, directeur)*.
- Écran « Point journalier » pour le comptable : chaque caisse de la journée avec son total, son écart et son état de clôture, sur n'importe quelle date. Une caisse restée ouverte est signalée *(comptable)*.

### Changed
- Marquer un frais déposé demande maintenant confirmation et nomme l'article : ce geste solde la ligne sans aucun versement *(admin, secrétariat)* (#419)
- Toutes les listes chargent la suite en approchant du bas, au lieu de boutons de page : élèves, inscriptions, enseignants, parents, personnel, classes, niveaux, séries, salles, rôles, corbeille, appels, bulletins, convocations, billets d'annulation *(admin, élève)*
- Les pieds de liste distinguent ce qui est affiché de ce que l'établissement compte, et les compteurs des puces d'inscription déclarent quand ils ne portent que sur le chargé *(admin)*
- Montées de dépendances de `main` reportées sur `develop` : lucide-react 1.14, jsdom 29, postcss 8.5.13 *(technique)*
- Le journal des paiements se charge au fil du défilement : la pagination affichait « Page 1/92 » sans permettre d'atteindre la seconde *(admin)*
- Les chiffres du bandeau suivent les filtres, et chaque carte dit si elle les suit ou parle de l'année entière *(admin)*
- Le créneau se trace directement sur la semaine de l'enseignant : on clique, on descend, l'heure de début et de fin suivent *(admin, directeur des études)*
- La fenêtre d'ajout de créneau occupe la largeur disponible et montre la semaine à côté des champs, au lieu de la reléguer sous un ascenseur *(admin, directeur des études)*
- Les états de la semaine se distinguent par leur matière et non par leur seule couleur : un cours est plein, une indisponibilité hachurée, une heure non déclarée tramée *(tous)*
- Bouton « Actualiser » sur la semaine, et relecture automatique au retour sur l'onglet quand les plages ont bougé ailleurs *(admin, directeur des études)*
- Le mode de paiement du formulaire d'encaissement ne montre que les moyens que la personne connectée peut réellement utiliser : plus de choix proposé puis refusé au moment d'enregistrer *(caissier, comptable, secrétariat)*
- Les versements enregistrés autrefois en « Mobile Money » gardent ce libellé partout et restent filtrables dans le journal des versements : l'historique d'une école ne change pas de sens *(comptable, parent)*
- Le journal des versements s'exporte désormais depuis le serveur : le PDF sort au gabarit officiel de l'établissement, et le classeur Excel porte les couleurs, le logo, la période et les filtres appliqués, au lieu d'un tableau sans identité *(comptable, caissier)*
- La période choisie sur l'écran des versements est appliquée par le serveur : elle portait jusqu'ici sur la seule page affichée, ce qui pouvait masquer des versements de la période *(comptable, caissier)*

- L'écran des évaluations et celui des bulletins s'ouvrent en une fraction de seconde : ils réclamaient toute l'année scolaire au serveur pour n'afficher qu'une vingtaine de lignes, et mettaient plus de quatre secondes à répondre *(admin, directeur des études, enseignant)*
- Le pied de la liste des bulletins annonce le nombre de la classe entière et les flèches de page fonctionnent enfin : elles affichaient « Page 1/1 » quel que soit l'effectif *(admin)*
- Le bandeau « publiez-les » de la liste des bulletins compte les brouillons de toute la classe, plus seulement ceux de la page visible *(admin, directeur des études)*
- Bulletin retenu pour impayé : la carte reste affichée mais grisée, la moyenne montre un tiret plutôt qu'un chiffre, et une phrase dit le trimestre concerné, le montant en retard et d'aller au secrétariat. Le bouton de téléchargement disparaît au lieu d'échouer au clic *(élève, parent)*
- Un lien « Consulter les notes publiées » figure sur chaque bulletin retenu : les notes restent accessibles, et la famille voit que ce n'est pas une panne *(élève, parent)*
- Les écrans « Convocations de parent » et « Autorisations de reprise » ouvrent sur l'année scolaire en cours et se lisent par pages de vingt : ils affichaient jusqu'ici tout l'historique de l'établissement, qui n'est jamais purgé *(éducateur, secrétariat)*
- Formulaire du billet d'annulation de zéro : les évaluations manquées ne se cherchent plus à chaque caractère tapé dans les dates, mais une fois la saisie posée *(éducateur, secrétariat)*
- Le choix de l’élève se fait par recherche, dans les convocations, les autorisations de reprise et les versements : on tape deux lettres, nom ou matricule, au lieu de faire défiler une liste tronquée aux cent premiers *(admin, secrétariat, caissier)*.
- Fiche Personnel : le rôle d'accès propose désormais six métiers (secrétariat, caissier, éducateur, comptable, directeur des études, directeur), chacun accompagné d'une phrase qui dit ce que la personne pourra faire. « Personnel administratif » devient « Secrétariat » *(admin, directeur)*.
- Wizard Nouvelle inscription : le modal ne se ferme plus si on appuie hors du cadre (la saisie n'est plus perdue). L'étape élève et la sélection de classe sont lisibles sur téléphone, avec des boutons assez grands. La liste des classes montre les places encore disponibles, pas seulement le maximum *(admin)*.
- Publication Windows : le frontend standalone est désormais compilé hors production par la CI puis livré comme artefact versionné.
- Déploiement : l'ancien workflow EC2 est retiré. La démo reste sur le serveur Windows, la production vise le VPS Contabo (artefact + restart, aucun build sur le serveur).
- Fiche inscription et onglet Paiements repensés en premium : en-tête avec bandeau de marque (classe, année, statut), synthèse claire des frais (payé, reste à payer, progression), détail de chaque frais avec sa barre d'avancement et son statut, et historique des versements montrant la répartition sur les frais avec le reçu téléchargeable pour chacun *(admin)*.
- Onglet Paiements de la fiche élève : même bandeau de synthèse premium des frais (payé, reste à payer) *(admin)*.
- Fiches élève, enseignant et personnel : la carte « Compte de connexion » passe en bas de page, ce n'est pas l'information principale à l'ouverture de la fiche *(admin)*.
- Page de connexion repensée en version premium : grande photo d'une classe habillée aux couleurs de la marque avec accroche et points forts à gauche, formulaire présenté dans une carte élégante à droite, plus lisible sur mobile comme sur ordinateur *(tous)*.
- Page Frais repensée : la grille des frais obligatoires s'affiche désormais en arbre par niveau (on voit d'un coup ce qu'un élève d'un niveau paie et le total), et les frais optionnels avec leurs options (montant par option) sont visibles et modifiables directement, au lieu d'être cachés derrière un bouton *(admin)*.

### Added

- Inscription élève : prise de photo directe (caméra, aperçu, reprise) avec import de fichier en repli. La photo est enregistrée sur le profil après création. Sur HTTP, la caméra live n'est pas disponible : utiliser HTTPS (`college.klassci.com`) ou l'import. États permission refusée, chargement, erreur et succès couverts *(admin)*.
- Vérification publique enrichie du Sceau numérique institutionnel KLASSCI : état actif, révoqué, remplacé ou expiré, aucune identité d'élève exposée et comparaison du PDF avec l'empreinte signée conservée par KLASSCI *(public)*.
- Page Frais : copie des montants d'une catégorie vers une autre en un clic (choix des niveaux à copier), pour ne plus ressaisir la même grille à chaque trimestre *(admin)*.

### Fixed
- Sur téléphone, la fenêtre d'ajout de créneau débordait à droite : les boutons et les listes étaient coupés *(admin, directeur des études)*
- La grille de disponibilités peignait toute la semaine en « hors des plages déclarées » dès qu'une seule absence était notée *(admin, directeur des études, enseignant)*
- Les bulletins et les statistiques DREN s'ouvraient sur une année sans données au lieu de l'année en cours *(admin)*
- La grille de disponibilités d'un enseignant affichait toute sa semaine en rouge « indisponible » alors qu'il n'avait rien déclaré : une semaine vierge ne ferme plus rien *(admin, directeur des études, enseignant)*
- Le bandeau de la page des versements annonce à la caissière ce qu'elle a encaissé, et non plus les chiffres de toute l'école *(caissier)*
- Le portail se construisait avec une mémoire plafonnée pour un serveur qui n'existe plus, ce qui faisait échouer des mises en ligne au hasard *(devops)*
- L'application saluait chacun par le début de son adresse e-mail : le caissier Ibrahim Tanoh lisait « Bonjour, Cashier3 » alors que l'écran juste en dessous affichait son vrai nom. Le prénom et le nom sont désormais repris de la connexion *(admin, personnel, enseignant, parent, élève)*
- Le bandeau affichait le rôle technique, « Staff », au lieu d'un libellé français *(admin, personnel)*
- Le parent n'avait aucun moyen d'atteindre les bulletins de son enfant : la page existait, aucun lien n'y menait. Un bouton « Bulletins » figure désormais sur la carte de chaque enfant *(parent)*
- Le bouton « PDF » du bulletin fonctionne enfin dans les portails élève et parent : il appelait la page réservée à l'administration et répondait « accès refusé » à une famille qui voyait pourtant le bulletin à l'écran *(élève, parent)*
- La liste « Mes bulletins » de l'élève ne s'affichait pas du tout : l'écran attendait une réponse d'une autre forme que celle envoyée par le serveur *(élève)*
- Le formulaire de nouvelle inscription plantait en arrivant à l'étape de la classe, sur un message technique, et il fallait tout recommencer *(secrétariat, admin)*
- Les compteurs en tête de page ne suivaient plus après une création ou une suppression : l'écran des classes affichait six lignes sous une carte qui en annonçait cinq *(admin)*
- L'éducateur et le secrétariat peuvent enfin délivrer un billet d'annulation de zéro : l'écran cherchait les évaluations manquées dans le cahier de notes de la classe, qu'ils n'ont pas le droit de lire, et répondait « Réessayez dans un instant » à une erreur de droits qui ne se résolvait jamais *(éducateur, secrétariat)*
- Les quatre compteurs du registre des convocations décrivent l'année consultée et non le filtre en cours : cliquer « Tuteur absent » affichait « Convocations 8, Tuteur venu 0, Tuteur absent 8 » *(éducateur)*
- Quand la liste des évaluations manquées ne peut pas être lue, le formulaire affiche enfin la raison au lieu d'inviter à réessayer *(éducateur, secrétariat)*
- Décocher « Abs. » sur la feuille de notes ne transforme plus le zéro d’office en note de 0/20, et ne le fait plus disparaître du bulletin. La case explique désormais qu’un billet de reprise est nécessaire *(enseignant, admin)*.
- Cocher « Abs. » sur un élève déjà noté demande confirmation : sa note ne disparaît plus sans avertissement *(enseignant)*.
- Taper « absent » dans la case de note marque enfin l’absence, comme la case cochée et comme le mot dit à voix haute *(enseignant)*.
- Le mode dictée ne demande plus « Quitter sans enregistrer ? » alors que rien n’a été touché, dès qu’un élève est absent *(enseignant)*.
- Registre des convocations : « Suite donnée » reste éteint tant que le rendez-vous n’a pas eu lieu, avec la raison affichée, au lieu d’échouer au clic *(éducateur)*.
- Plus aucun écran ne glisse latéralement sur téléphone. Les barres d’onglets trop larges, comme celle des Paramètres ou des Présences, défilent maintenant toutes seules à la place de pousser la page entière vers la droite *(tous)*.
- Boîtes de dialogue lisibles sur téléphone : elles ne collent plus aux deux bords de l’écran et, quand le formulaire est plus haut que l’écran, il défile au lieu de sortir par le haut. Sur un petit téléphone, le titre et le bouton d’enregistrement de « Nouveau rôle », « Nouveau personnel », « Nouvelle convocation » et « Autorisation de reprise » étaient devenus inatteignables *(admin, directeur)*.
- Formulaire « Nouvelle inscription » élargi sur grand écran : la saisie de l’élève tient désormais sans serrer les deux colonnes ni faire glisser le contenu *(admin, secrétariat)*.
- Partie élève de l’inscription : sur téléphone, la photo passe au-dessus des boutons « Prendre une photo » et « Importer une photo », dont les libellés étaient coupés au bord de la boîte *(admin, secrétariat)*.
- Page Paiements : les deux dates de la période tiennent enfin dans la carte de filtres sur téléphone, au lieu de déborder d’une quarantaine de pixels *(admin, comptable)*.
- Page Frais : les boutons « Copier des montants » et « Nouveau montant » passent à la ligne sur les écrans étroits au lieu de sortir de la carte *(comptable)*.
- Les écrans réservés à certains rôles s'ouvraient sur « Accès refusé » pendant une fraction de seconde, y compris pour un administrateur, le temps que la session s'établisse *(admin, éducateur, directeur des études)*
- La grille des frais n'affichait que les vingt premiers montants et donnait le reste pour inexistant : des niveaux apparaissaient avec moins de frais qu'ils n'en portent, le total par élève était faux, et recréer un montant manquant se soldait par « doublon possible ». Tous les montants sont désormais chargés *(admin, comptable)*
- Le motif d'une suppression définitive n'apparaît plus dans l'adresse de la requête, donc plus dans les journaux du serveur ni chez les intermédiaires. « Élève exclu pour vol » n'a rien à y faire *(admin)*

- Page Paiements : le bouton « Exporter » est désormais bien visible sur le bandeau bleu (il était blanc sur blanc, invisible tant qu'on ne le survolait pas) *(admin)*.
- Page Frais : à la modification d'un montant, la catégorie est correctement pré-remplie dans le formulaire *(admin)*.
- Session : on n'est plus déconnecté pendant qu'on utilise l'application. Un renouvellement de session simultané pouvait éjecter un utilisateur pourtant actif ; seule une vraie inactivité prolongée déconnecte désormais *(tous)*.
- Mode dictée : la saisie vocale des notes fonctionne à nouveau. Le micro était bloqué par une politique de sécurité du site trop stricte, même quand l'enseignant l'avait autorisé dans le navigateur *(enseignant, admin)*.
- Déconnexion : le bouton « Se déconnecter » ramène toujours vers la page de connexion du site réellement utilisé (college.klassci.com ou autre), et non plus vers une adresse locale invalide *(tous)*.
- Mode dictée : le micro est demandé directement par le navigateur au clic (plus fiable). Quand la reconnaissance vocale est bloquée par le navigateur (fréquent sur Microsoft Edge), le message invite à utiliser Google Chrome ou à saisir au clavier au lieu d'afficher « micro refusé » à tort. Après avoir autorisé le micro dans les réglages, un bouton « Recharger la page » applique le changement. Sur une adresse non sécurisée (http), un message explique que la dictée vocale exige le site sécurisé https *(enseignant, admin)*.
- Conseil de classe : le procès-verbal se charge à nouveau pour une classe et un trimestre ; s'il n'existe pas encore, un bouton « Générer le procès-verbal » le crée à partir des bulletins. Les décisions s'enregistrent, le procès-verbal se valide et se télécharge en PDF *(admin)*.
- Statistiques DREN : les boutons Excel et PDF téléchargent désormais un vrai fichier (classeur Excel ou document PDF) au lieu d'ouvrir des données brutes *(admin)*.
- Page Notes : en choisissant une matière, les évaluations et les compteurs d'onglets (Toutes, À saisir, En retard, Terminées) se mettent bien à jour ; auparavant certaines matières n'affichaient aucune évaluation et les compteurs restaient figés *(admin)*.

### Added

- Section « Compte de connexion » sur la fiche d'un élève, parent, enseignant ou membre du personnel : voir l'état du compte (email, dernière connexion), créer le compte s'il n'existe pas (élève/parent) avec un email pré-rempli et éditable, et réinitialiser le mot de passe. Le mot de passe temporaire est affiché pour être communiqué *(admin, personnel)*.
- Changement de mot de passe obligatoire à la première connexion après création ou réinitialisation par un administrateur : l'utilisateur choisit son propre mot de passe avant d'accéder à son espace *(tous)*.
- Partage du lien de l'application soigné : sur Slack, WhatsApp, Twitter/X, LinkedIn ou par message, le lien college.klassci.com affiche désormais une carte aux couleurs de KLASSCI College (logo, accroche) au lieu d'un lien nu *(tous)*.
- Page Notes : bouton unique « Relevé de notes » qui regroupe l'aperçu et le téléchargement du relevé rempli, plus le téléchargement d'une feuille de notes vierge à remplir à la main (élèves de la classe, matière et trimestre pré-renseignés si choisis) *(admin, enseignant)*.
- Tableau de bord élève : la dernière note obtenue est mise en avant (matière, note sur 20 et intitulé de l'évaluation) *(élève)*.
- Tableau de bord dédié au personnel (secrétariat) : indicateurs orientés inscriptions à valider, prospects à inscrire, paiements en attente et élèves inscrits, avec des actions rapides adaptées (inscription, encaissement, présences, classes, congés) *(personnel)*.
- Tableau de bord enseignant : la carte « Ma performance » affiche désormais directement le score sur 100 et l'appréciation *(enseignant)*.
- Tableau de bord élève enrichi de deux accès rapides : « Mes notes » et « Mes bulletins » *(élève)*.
- Nouvel onglet « MailPulse » dans les Paramètres : activez les notifications parents par email et WhatsApp, réglez l'expéditeur et la clé d'accès (jamais réaffichée), gérez vos destinataires de test avec un interrupteur par adresse ou numéro, envoyez un test (simulation ou réel) et préparez la réponse automatique « INFO » sur WhatsApp *(admin)*.
- Intérim : sur un congé approuvé, la direction choisit un enseignant remplaçant depuis la page Congés ; le demandeur voit qui assure son remplacement sur sa carte « Mes congés » *(admin, enseignant)*.
- Demandes de congé : depuis son profil (et son tableau de bord pour l'enseignant), on demande un congé en quelques secondes et on suit son statut ; une page « Congés » côté administration permet d'approuver ou refuser les demandes en attente *(enseignant, personnel, admin)*.
- Pièces jointes sur l'onglet Documents de la fiche élève : téléversez un PDF ou une image (extrait de naissance, certificat médical, etc.), en choisissant le type dans une liste ou en le créant à la volée ; consultez ou supprimez chaque document *(admin)*.
- Section « Préférences de notifications » sur la page profil : activez ou désactivez l'email et le SMS d'un simple interrupteur ; la cloche dans l'application reste toujours active *(tous)*.
- Nouvel espace « Mon profil », accessible depuis le menu du compte dans tous les portails : sa photo (l'enseignant et le personnel la mettent eux-mêmes), ses informations et son téléphone modifiable en un clic. L'ajout de photo a été retiré des fiches enseignant et personnel côté admin, la photo étant désormais gérée par la personne elle-même *(tous)*.
- Le rôle d'accès d'un membre du personnel (Personnel, Comptable, Directeur) se choisit à la création et se modifie ensuite ; il apparaît désormais clairement dans la liste, sur la fiche détail et dans les formulaires, en plus de son poste *(admin)*.
- Fiches enseignant et élève (admin) dotées du même en-tête premium : photo, contact rapide et indicateurs clés en un coup d'œil (enseignant : nombre de classes, d'élèves et heures par semaine ; élève : classe, taux de présence et reste à payer), les onglets détaillés existants restant inchangés *(admin)*.
- Fiche parent (admin) repensée : en-tête premium avec le récapitulatif financier du foyer (nombre d'enfants, total payé, reste à payer sur l'année), enfants liés présentés en cartes claires avec leur classe, leur statut d'inscription et leur solde de scolarité (barre de progression), boutons de contact rapides (Appeler, WhatsApp, Email) et possibilité de lier un enfant existant en un clic *(admin)*.
- Fiche personnel (admin) repensée : en-tête premium avec photo et contact rapide, plus un onglet « Activité » qui résume les versements encaissés, les inscriptions traitées et la dernière connexion du membre *(admin)*.

- Score de performance des enseignants et suivi d'activité du personnel : l'enseignant consulte « Ma performance » depuis son portail, une note sur 100 avec le détail de chaque critère (assiduité, saisie des notes, prise de l'appel) et son évaluation. La direction dispose d'une page « Performance » avec le classement des enseignants et un tableau d'activité du personnel (versements encaissés, inscriptions traitées). Un critère sans donnée est affiché « données insuffisantes » plutôt que noté zéro *(admin, enseignant)*.
- L'enseignant peut faire l'appel numérique des élèves depuis son portail : un onglet « Faire l'appel » (et un accès rapide sur le tableau de bord) affiche les élèves de la classe, tous présents par défaut ; il suffit de basculer les absents, retards ou excusés puis d'enregistrer. Pensé mobile, gros boutons, lisible en plein soleil *(enseignant)*.
- Gestion des congés et jours fériés dans les Paramètres (onglet « Calendrier », sous les trimestres) : on ajoute ou supprime des périodes (libellé + date de début et de fin). Ces jours n'apparaissent plus dans le cahier de texte, même en plein trimestre *(admin)*.
- Bouton « Ajouter les jours fériés civils » dans la section Congés : pré-remplit en un clic les jours fériés civils fixes ivoiriens qui tombent pendant l'année scolaire en cours (à relire puis enregistrer). Les vacances scolaires et les fêtes religieuses mobiles restent en saisie manuelle *(admin)*.
- Relevé de notes rempli (PDF) téléchargeable et consultable en aperçu depuis la page Notes, une fois une classe, une matière et un trimestre choisis. Cahier de texte de la classe (semaine en cours) ajouté aux documents de la fiche de classe, en téléchargement et en aperçu *(admin, enseignant)*.
- Aperçu PDF sur tous les documents : à côté de chaque bouton « Télécharger », un bouton « Aperçu » ouvre le document dans un nouvel onglet sans le télécharger (bulletins, certificats et attestations, reçus de paiement, liste de classe, rapport de synthèse, PV de conseil, emploi du temps, statistiques DREN). Deux nouveaux documents de classe, la feuille d'appel et la feuille de notes vierges, sont aussi téléchargeables et consultables en aperçu depuis la fiche de classe *(admin, enseignant, parent, élève)*.
- Export en un tap des listes de gestion : bouton « Exporter » (Excel .xlsx ou PDF, aux couleurs de l'établissement) sur les pages Élèves, Paiements (avec total), Notes et Présences. L'export reprend exactement les lignes affichées, filtres compris *(admin)*.
- Socle d'export de données réutilisable : les listes pourront bientôt être exportées en Excel (.xlsx) et en PDF, aux couleurs de l'établissement. L'Excel reste une vraie table exploitable (filtres, tri, colonnes typées), le PDF adopte la présentation sobre des documents officiels *(admin)*.
- Vérification d'un document par saisie manuelle du code : sur la page de vérification, on peut maintenant taper le code « CEV-XXXX-XXXX-XXXX » imprimé au dos du document pour confirmer son authenticité, sans avoir à scanner *(tous)*.
- Fiche de classe repensée en page à onglets (Aperçu, Élèves, Emploi du temps, Matières, Enseignants) avec bandeau bleu-orange et indicateurs clés. Téléchargement en un tap de la liste de classe et du rapport de synthèse (PDF), liste des élèves, emploi du temps par jour, et matières et enseignants déduits de l'emploi du temps *(admin)*.
- Page publique de vérification d'un document scolaire : en scannant le cachet électronique (CEV) d'un certificat, d'une attestation ou d'un bulletin, ou en saisissant son code, n'importe qui confirme en un instant l'authenticité du document (établissement, type, élève, classe, année, date), sans aucun compte *(tous)*.

### Changed

- Page de connexion : le panneau d'accueil s'illustre désormais d'une photo de classe (enseignante et élèves), habillée d'un voile bleu-orange aux couleurs de la marque, pour un accueil plus chaleureux et incarné *(tous)*.
- Police des titres remplacée par Nunito Sans, plus sobre et lisible, à la place de l'ancienne police jugée trop fantaisiste *(tous)*.
- Saisie des notes repensée dans la ligne premium KLASSCI : en-tête au dégradé bleu-orange avec le détail de l'évaluation et les indicateurs clés (saisies, moyenne de la classe, état de sauvegarde), « Mode dictée » mis en avant en orange. Sur grand écran, les élèves s'affichent sur deux colonnes pour moins de défilement ; une seule colonne sur téléphone *(enseignant, admin)*.
- Mode dictée sur grand écran : l'espace est désormais utilisé avec un panneau « Classe » à droite listant tous les élèves et leur note, l'élève en cours surligné, cliquable pour y sauter directement. Sur téléphone, l'affichage plein écran séquentiel reste inchangé *(enseignant, admin)*.
- Page Emploi du temps repensée dans la ligne premium KLASSCI : bandeau bleu-orange rappelant « Semaine type · Année en cours », classe et actions (générer, exporter PDF) regroupées dans une carte de contrôle avec sélection rapide par classe *(admin)*.
- Page Notes repensée dans la ligne premium KLASSCI : bandeau bleu-orange avec les indicateurs clés (évaluations, terminées, en retard, taux de saisie), filtres et actions PDF regroupés, onglets de statut harmonisés *(admin)*.
- Onglet MailPulse aux vraies couleurs de la marque : bandeau sombre, logo enveloppe orange et wordmark « Mail·Pulse », avec l'état de la clé API en pastille. La mise en page a été resserrée pour supprimer la barre de défilement superflue *(admin)*.
- L'onglet Disponibilités d'un enseignant précise désormais qu'il s'agit du planning **annuel** récurrent, base de la génération de l'emploi du temps (et non un réglage semaine par semaine) ; pour une absence ponctuelle, on passe par une demande de congé *(admin)*.
- Emploi du temps : les flèches « Semaine précédente / suivante » sont retirées au profit d'un repère fixe « Semaine type · Année {en cours} ». L'emploi du temps vaut pour toute l'année scolaire ; l'ancien sélecteur laissait croire, à tort, que chaque semaine avait son propre planning *(admin)*.
- Bandeau de synthèse des Frais (élève, parent) repassé au dégradé bleu-orange de la marque, et indicateurs de la page Années scolaires intégrés au bandeau d'en-tête *(tous)*.
- Tableaux de bord enseignant, élève et parent désormais en tête de page sur le bandeau bleu-orange KLASSCI, indicateurs clés intégrés. Pages Promotions, Paramètres, Conseil de classe et Statistiques DREN harmonisées sur le même bandeau *(tous)*.
- Refonte visuelle de toute l'application : chaque page (tableau de bord, listes d'administration, portails enseignant et parent) s'ouvre désormais sur un bandeau au dégradé **bleu et orange** (les deux couleurs du logo KLASSCI), avec les indicateurs clés intégrés en blanc et l'action principale mise en avant en orange. Les en-têtes de section reprennent l'orange de la marque. Identité cohérente du haut de page jusqu'aux moindres détails, vérifiée en mode clair et sombre *(tous)*.
- Pages Frais (élève, parent) avec un bandeau de synthèse bleu marque : total attendu, montant payé en vert et « Reste à payer » mis en avant en orange, avec barre de progression. Plus lisible d'un coup d'œil *(élève, parent)*.
- Page Frais admin refondue : bandeau dégradé bleu, cartes de catégories sobres et lisibles aussi bien en clair qu'en sombre *(admin)*.
- Indicateurs clés des pages de gestion désormais alimentés par un calcul serveur : les chiffres restent exacts même au-delà de 100 lignes (grands établissements), là où ils étaient auparavant tronqués *(admin)*.

### Fixed

- Connexion : les comptes Personnel, Comptable et Directeur étaient refusés à tort (« email ou mot de passe incorrect ») ; ils peuvent désormais se connecter *(personnel, comptable, directeur)*.
- Page Notes : les filtres (Classe, Matière, Trimestre) restaient désalignés tant qu'aucune classe n'était choisie ; ils sont désormais alignés dans tous les cas *(admin)*.
- Page Notes : à la sélection d'une classe, la liste « Matière » affichait toutes les matières de tous les niveaux (doublons). Elle ne propose désormais que les matières réellement enseignées dans la classe choisie *(admin)*.
- Après une mise à jour de la plateforme, un onglet resté ouvert pouvait afficher « Une erreur est survenue / Loading chunk failed » à la navigation ; la page se recharge désormais automatiquement pour récupérer la dernière version *(tous)*.
- Onglet Documents de la fiche élève : les pièces jointes ajoutées sont désormais nettement séparées du formulaire d'envoi (section « Documents ajoutés »), avec un bouton Aperçu pour prévisualiser le PDF ou l'image en plus du téléchargement *(admin)*.
- Onglet Notifications des Paramètres : les options sont plus compactes, la page est moins haute et ne provoque plus de défilement inutile *(admin)*.
- Fiche parent : les enfants liés ne s'affichaient plus (lignes vides, « on ne voit rien ») ; ils réapparaissent avec leur nom, leur classe et leur situation *(admin)*.
- La session ne se ferme plus pendant l'utilisation : tant que vous êtes actif, elle reste ouverte et se prolonge automatiquement. Elle n'expire désormais qu'après une période d'inactivité (mode veille), pas après un délai fixe *(tous)*.
- Mode dictée des notes : le bouton « Mode dictée » de la saisie déléguée admin renvoyait vers le tableau de bord au lieu d'ouvrir la dictée. Il ouvre désormais la saisie vocale et revient à la bonne page en sortie *(admin, enseignant)*.
- Page Frais de l'élève et du parent : la liste restait en chargement infini puis en erreur pour un élève inscrit. Les montants, le total payé, le reste à payer et le statut de chaque frais s'affichent désormais correctement *(élève, parent)*.

### Added

- Indicateurs clés (KPI), recherche instantanée et filtres ajoutés sur les pages de gestion qui en manquaient : Classes, Matières, Niveaux, Années scolaires, Inscriptions, Salles, Notifications, Frais, ainsi que les listes Élèves, Enseignants, Personnel et Parents. La recherche ignore les accents et la casse (taper « traore » trouve « Traoré ») *(admin)*.
- Portails Enseignant et Parent : bandeau d'indicateurs en tête des listes « Mes classes », « Mes évaluations » et « Mes enfants », plus une recherche rapide pour retrouver une classe ou une évaluation *(enseignant, parent)*.
- Fiches détail Élève, Enseignant, Personnel, Parent, Classe, Inscription : la flèche de retour passe à h-11 sur mobile (touch target Itel S661) au lieu de h-8/h-9 trop petit. Aria-label rendu explicite « Retour à la liste des inscriptions » au lieu de « Retour » seul *(admin)*.
- Page Promotions admin : icône d'en-tête masquée aux lecteurs d'écran, bouton « Recommencer » passe à h-11 sur mobile *(admin)*.
- Portail enseignant — fiche « Mes classes » : empty state plus chaleureux « Aucune classe assignée pour le moment » + invite à contacter l'administration. Bouton « Gérer les notes » passe à h-11 sur mobile avec aria-label explicite incluant la classe et la matière, pour mieux distinguer plusieurs cartes côte à côte *(enseignant)*.

- Page Matières admin : la vue Kanban est désormais réservée au mode bureau (drag-drop impossible sous 320 px), la vue mobile bascule automatiquement en table. Le sélecteur Kanban/Table est masqué sur mobile pour éviter la confusion *(admin)*.
- Page Emploi du temps admin : boutons navigation semaine et sélecteur de classe avec aria-label, touch targets h-11 mobile sur Itel S661, boutons d'export PDF et de génération en flex-wrap mobile *(admin)*.
- Portail élève — empty state Notes plus rassurant qui explique « Vos résultats apparaîtront ici dès que vos enseignants saisiront les notes » au lieu d'une phrase opaque *(élève)*.
- Portail élève — empty state Frais désambigué : message guide à contacter le secrétariat si aucun frais n'apparaît malgré inscription validée. Indicateurs « Payé » et « Restant » désormais neutralisés en gris quand aucun frais (au lieu de signal vert trompeur) *(élève)*.
- Icônes décoratives des en-têtes admin enfin masquées aux lecteurs d'écran (aria-hidden) sur les pages Académique, Salles, Notifications, Élèves, Parents, Personnel, Niveaux, Frais, Inscriptions, Matières, Paramètres, Emploi du temps *(tous)*.

- Portail élève — historique de présence sur mobile : la table 4 colonnes est remplacée par des cartes verticales avec jour en clair, heure d'arrivée, notes éventuelles et badge statut coloré. Les boutons de pagination passent à h-11 et reçoivent un aria-label *(élève)*.
- Portail élève — bulletins : empty state plus rassurant qui explique « Vos bulletins apparaîtront ici après publication par l'administration » au lieu d'une phrase opaque. Bouton PDF passe à h-11 mobile + toast succès au téléchargement *(élève)*.
- Portail parent — bulletins : flèche retour passe à h-11 mobile (touch target Itel S661), boutons PDF h-11 mobile avec aria-label explicite. Empty state explique quand les bulletins apparaîtront *(parent)*.
- Portail parent — pages Notes et Frais : flèche retour passe à h-11 mobile pour une meilleure ergonomie sur petit écran *(parent)*.

- Section Bulletins : navigation entre les trois types de rapports (Bulletins, Conseil de classe, Statistiques DREN) désormais visible en onglets cliquables au sommet de chaque page au lieu d'être cachée dans le menu latéral *(admin)*.
- Section Rôles &amp; Permissions : la colonne Permissions du tableau affiche désormais les groupes de permissions accordées au rôle sous forme de pastilles colorées (« Élèves 3, Paiements 2, Notes 4… ») au lieu d'un simple compteur opaque *(admin)*.

- Portail parent — fiche « Mes enfants » : pour chaque enfant non encore inscrit cette année, un encart amber clair explique qu'un enfant est en attente d'inscription, et les boutons Notes/Frais/Emploi du temps sont désactivés avec une infobulle « Disponible après validation de l'inscription ». Les indicateurs Moyenne/Absences/Restant affichent « — » au lieu de chiffres trompeurs *(parent)*.
- Portail parent — lien Documents officiels : nouveau bouton vers les certificats et attestations d'un enfant *(parent)*.
- Portail enseignant — vue Emploi du temps adaptée mobile : liste jour par jour avec couleur par matière au lieu de la grille hebdomadaire 7 colonnes qui n'était pas lisible sur Itel S661 *(enseignant)*.
- Portail enseignant — vue Présences adaptée mobile : cartes par élève avec taux prominent et compteurs présent/absent/retard/excusé en ligne secondaire, au lieu de la table 6 colonnes illisible sous 320 px *(enseignant)*.

- Page Enseignants : boutons d'action inline « Appeler », « WhatsApp » et « Email » à côté du téléphone permettent de joindre un enseignant en un tap, sans passer par sa fiche. Pattern Wave Mobile Money, touch targets adaptés au mobile *(admin)*.
- Pages Parents et Personnel : mêmes boutons d'action inline « Appeler », « WhatsApp » et « Email » en plus de l'ancien lien téléphone. Le tap ouvre l'application native sans recharger la page *(admin)*.
- Page Parents : pastille verte « Compte actif » sur les cartes parents qui ont déjà un compte connecté, pour distinguer en un coup d'œil ceux qui peuvent se connecter au portail *(admin)*.

### Changed

- Tableaux de bord redessinés sur les portails Administration, Enseignant, Élève et Parent : présentation plus claire et épurée, en-tête sobre sans dégradé, indicateurs lisibles d'un coup d'œil et une seule couleur d'accent. Plus lisible en plein soleil sur petit écran *(tous)*.
- Page Paiements sur mobile : la liste des paiements adopte un affichage cartes verticales (montant prominent, statut coloré, méthode, date) au lieu d'une table illisible en scroll horizontal sur Itel S661. Le tap sur une carte ouvre l'aperçu du reçu *(admin)*.
- Page Enseignants sur mobile : la liste adopte le même format compact que la page Élèves (avatar + nom + spécialité + chevron), au lieu de la table desktop scrollable. Tap = ouvre la fiche *(admin)*.
- Pages Classes, Parents et Personnel sur mobile : même format compact avec avatar + nom + sous-titre + chevron, au lieu de la table desktop scrollable. Une pastille colorée d'occupation (vert / amber / rouge) s'affiche à droite de chaque classe pour signaler les classes pleines en un coup d'œil *(admin)*.
- Page Classes : le sélecteur de vue Arbre / Table est désormais caché sur mobile (l'arbre n'était pas lisible sur petit écran). La vue cartes mobile est affichée automatiquement *(admin)*.
- Présences admin : sous-titre dynamique qui rappelle la classe et le jour sélectionnés (« Classe 6ème B · lundi ») au lieu d'un message générique, et filtres (Classe, Date, Créneau) à pleine largeur sur mobile avec touch target h-11 pour Itel S661 *(admin)*.

- Portail parent — page Documents officiels : si l'enfant n'est pas encore inscrit pour l'année courante, un encart amber prévient que les documents ne pourront pas être délivrés tant que l'inscription n'est pas validée, et les boutons de téléchargement affichent « Disponible après inscription » au lieu de générer une erreur 500 *(parent)*.
- Portail parent — empty state Emploi du temps désambigué : distingue clairement « inscription en attente » (encart amber rassurant) de « pas encore publié par l'administration » (encart neutre) *(parent)*.
- Portail élève — jours de la semaine de l'emploi du temps affichés en toutes lettres (Lundi, Mardi, …) au lieu d'abréviations à 3 lettres difficiles à lire en plein soleil *(élève)*.
- Sélecteur de classe sur l'écran Présences enseignant : pleine largeur sur mobile et touch target h-11 (au lieu de h-10 largeur fixe 256 px) *(enseignant)*.

- Formulaire de connexion plus accessible : boutons d'affichage du mot de passe annoncés aux lecteurs d'écran, messages d'alerte (session expirée, erreur d'identifiants) annoncés en temps réel, icônes décoratives masquées aux lecteurs d'écran *(tous)*.
- Indicateurs du tableau de bord admin annoncés en temps réel aux lecteurs d'écran : chaque carte expose son intitulé + sa valeur (« Élèves inscrits : 42 ») au lieu d'un chiffre orphelin *(admin)*.

### Fixed

- Page Paiements : indicateurs "Collecté", "Attendu" et "Taux de recouvrement" affichent désormais une couleur neutre (gris) quand la valeur vaut zéro, au lieu d'un vert success trompeur qui suggérait à tort « tout est payé » alors qu'il n'y a juste aucun paiement enregistré *(admin)*.
- Aperçu et confirmation des bulletins compatibles lecteur d'écran : les boîtes de dialogue décrivent désormais leur contenu aux lecteurs d'écran (« Aperçu détaillé du bulletin de notes avec moyenne, rang, mention et détail par matière », résumé de la génération de bulletins) *(tous)*.
- Mode « Réviser » d'une évaluation : les notes déjà saisies sont désormais pré-remplies dans les champs au lieu de s'afficher vides. L'enseignant ou l'admin peut donc relire et modifier en place les notes existantes au lieu de tout ressaisir *(enseignant, admin)*.
- Paramètres, onglet Identité visuelle : le bouton « Aperçu PDF (bordereau du jour) » génère et ouvre maintenant le document de démonstration au lieu d'afficher l'erreur « Not authenticated » *(admin)*.

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

- Session zombie après expiration du jeton : la barre de navigation et les listes affichaient parfois 28 erreurs 401 en silence sans rediriger vers la page de connexion. Le redirect vers `/login?expired=1` se déclenche désormais dès qu'une requête authentifiée échoue, avec un secours qui force la redirection même si la déconnexion bloque *(tous)*.
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
- Le mot de passe d'un enseignant créé depuis l'emploi du temps n'est plus déductible de son adresse, et s'affiche une fois pour être transmis *(admin)*
- Un identifiant saisi puis validé avant que la page ne soit prête ne peut plus se retrouver dans l'adresse du navigateur *(tous)*

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
