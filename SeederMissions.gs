function seedMissions() {
  var missionsData = [
  {
    "titre": "Agent de sécurité",
    "description": "Assure la sécurité des locaux, des biens et des personnes au sein de l’établissement. • Veille au bien-être de toutes les personnes présentes et garantit un accueil de qualité. • Réagit face aux comportements suspects ou délictueux. • Responsable de l’ouverture et de la fermeture des locaux (portes principales, salles d’enseignement, etc.). • Veille au respect du règlement intérieur lors des activités et animations. • Contribue à l’amélioration continue de la qualité des services rendus.",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "enseignement de base, Vigilance, Lucidité, Autonomie, Anticipation"
  },
  {
    "titre": "Agent de service",
    "description": "Nettoyage des salles de classe, des bureaux des enseignants et des espaces communs. • Distribution des fournitures internes. • Assistance ponctuelle dans l'organisation logistique. • Réalisation de courses locales pour l’établissement. • Participation à l'aménagement et au réaménagement des meubles et équipements. • Engagement actif dans la mise en place et le maintien du système qualité (accueil, prestations). • Amélioration continue de la qualité des services fournis",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "enseignement de base, Maîtrise des techniques de nettoyage, Organisation et gestion du temps, Attention au détail, Flexibilité et réactivité, Respect des normes de sécurité et d’hygiène, Communication efficace"
  },
  {
    "titre": "Chargé administratif de scolarité et examens",
    "description": "Gestion des dossiers d’admission, d’inscription et de réinscription. • Saisir et mettre à jour les données des étudiants dans les plateformes de gestion des notes et les systèmes de gestion de scolarité (inscriptions, changements de parcours, certificats, notes examens, etc.). • Accompagner les étudiants dans leurs démarches administratives. • Préparation des listes des groupes des étudiants, des procès-verbaux, des relevés de notes, attestations de réussite, certificats de scolarité, cartes étu",
    "departement": "Pédagogie",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, Langue française, Connaissance des procédures de scolarité., Maîtrise des outils bureautiques., Organisation et rigueur., Capacité à travailler en équipe., Sens de l’accueil et de la communication., Discrétion professionnelle., Réactivité et polyvalence."
  },
  {
    "titre": "Chargé du bureau d'ordre",
    "description": "Réception des courriers en arrivée et départ (lettres, fax, colis) • Enregistrement des courriers dans la plateforme de gestion du bureau d’ordre (GEC) • Préparation des bordereaux d'expéditions • Dépouillement et ventilation des courriers • Reproduction et distribution des courriers  • Archivage et classement des courriers  • Participation active dans la mise en place et le maintien du dispositif qualité (accueil, prestation) • Amélioration continue de la qualité de la prestation",
    "departement": "Administration",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Organisation rigoureuse."
  },
  {
    "titre": "Chargé du prêt bibliothèque",
    "description": "Accueillir, orienter et renseigner les utilisateurs sur le fonctionnement du service de prêt. • Tenir à jour les bases de données relatives aux prêts (registre ou système informatisé). • Alerter sur les retards ou pertes d’ouvrages et appliquer les procédures de relance. • Collaborer avec le responsable de la bibliothèque pour optimiser la circulation des ouvrages. • Participer à la mise en rayon et au rangement des livres empruntés. • Participer à l’inventaire périodique des documents prêtés et",
    "departement": "Pédagogie",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, Maîtrise des outils de gestion documentaire., Sens du service et de l’accueil des usagers., Rigueur., Gestion du temps et des priorités., Esprit d’équipe."
  },
  {
    "titre": "Chargé du service financier",
    "description": "Gestion et suivi de l’exécution budgétaire de l’établissement, du laboratoire et projets de recherche. • Gérer les flux de dépenses : engagements, dégagements, mandats, devis, BC, services faits, factures, dossiers de missions, arrêtés de remboursements, contrats, etc. • Participer à la préparation et à la mise à jour des conventions budgétaires. • Participer à la préparation des consultations et des appels d’offres.  • Contrôler la conformité des conventions budgétaires. • Collecter et contrôle",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, Langue française, Comptabilité publique., Élaboration budgétaire., Gestion des dépenses., Reporting., Marchés publics., Outils numériques., Rigueur et discrétion Confidentialité., Réactivité."
  },
  {
    "titre": "Chargé(e) de la scolarité et de la logistique pédagogique",
    "description": "Réception, orientation et information des étudiants au service scolarité. • Mise à jour régulière des fichiers étudiants. • Réception des demandes courantes (copies des relevés de notes, attestations de réussite, certificats de scolarité, cartes étudiantes, etc.) • Pointage quotidien des présences des enseignants selon les emplois du temps. • Signaler les absences des enseignants au chargé des emplois du temps. • Afficher les avis d’absence, de rattrapage, de contrôles (DS), etc. • Participer à ",
    "departement": "Pédagogie",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "enseignement de base, Expérience en scolarité universitaire, Maîtrise des procédures administratives, Connaissance du milieu éducatif, Outils bureautiques et logiciels scolaires, Organisation et gestion des priorités, Rigueur et autonomie, Communication écrite et orale, Discrétion et confidentialité, Travail en équipe et polyvalence"
  },
  {
    "titre": "Chauffeur",
    "description": "Assurer le transport du personnel et des étudiants selon les besoins de l’établissement. • Assurer les courses relatives aux différents services de l'établissement • Veiller à la sécurité et au confort des passagers durant les trajets. • Maintenir le véhicule en bon état de fonctionnement (entretien, nettoyage, vérifications techniques). • Respecter les horaires et les itinéraires définis pour les trajets. • Informer la direction en cas de panne, d’accident ou de tout autre problème lié au véhic",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Expérience de conduite., Connaissance des itinéraires., Conduite sécuritaire., Organisation., Réactivité., Discrétion., Autonomie."
  },
  {
    "titre": "Chef service technique et Infrastructure",
    "description": "Manager l’équipe technique (Assistant service technique). • Participer aux comités d’infrastructure et d’achats concernant les solutions et équipements informatiques (spécification des besoins, rédaction des consultations, des cahiers des charges, des contrats de maintenance et de prestations de services) • Planifier, organiser et coordonner les interventions techniques (électricité, climatisation, maintenance informatique, sécurité des données, serveurs, réseau, caméras de surveillance etc.). •",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Ingénieur en informatique, Bonne expérience dans la gestion technique., Compétences en planification., Réactivité., Aptitude à collaborer., Rigueur., Communication."
  },
  {
    "titre": "Chargé de la pédagogie",
    "description": "Réception des demandes de badges d’accès aux locaux de l’établissement. • Transmission des demandes de badges au chargé administratif de scolarité et examens. • Réception des fiches de vœux des enseignants.  • Réception des répartitions des enseignements. • Elaborer les emplois du temps en coordination avec la direction des études et les directeurs de départements. • Réception des autorisations d’absences et planification des séances de rattrapage. • Notification et suivie des retards, absences,",
    "departement": "Pédagogie",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Langue française, Maîtrise des outils de planification., Capacité d'organisation., Réactivité face aux changements., Aisance relationnelle., Connaissance des règles pédagogiques., Discrétion et confidentialité., Gestion des priorités."
  },
  {
    "titre": "Magasinier",
    "description": "Réceptionner les livraisons de matériel, de fournitures ou d’équipements, vérifier leur conformité avec les bons de commande. • Tenir à jour les registres ou le système informatique pour le suivi des stocks et la traçabilité des mouvements de matériel. • Organiser le rangement des produits dans le respect des normes de sécurité, d’accessibilité et de conservation. • Répartir le matériel ou les fournitures selon les demandes des différents services pédagogiques et administratifs. • Réaliser des i",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Langue française, Maîtrise de la gestion des stocks., Organisation et rigueur., Capacité d’anticipation., Réactivité., Travail en équipe et communication interservices., Autonomie et sens des responsabilités"
  },
  {
    "titre": "Responsable de la bibliothèque",
    "description": "Veiller au bon fonctionnement quotidien, à l’organisation des espaces et à la gestion des collections. • Veiller à l’efficacité des prêts et de retours des ouvrages, à la gestion les demandes de prolongation les réservations de documents, des réclamations et besoins spécifiques des usagers de la bibliothèque • Accompagner les étudiants et les enseignants dans l’utilisation des ressources disponibles et des outils numériques (plateforme Biruni.tn, etc.). • Encadrer et coordonner le travail du per",
    "departement": "Pédagogie",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, - Maîtrise des systèmes de gestion documentaire., Sens de l’organisation., Encadrement d’équipe., Rigueur dans le suivi des inventaires., Adaptabilité technologique., Communication et travail collaboratif."
  },
  {
    "titre": "RESPONSABLE RESSOURCES HUMAINES",
    "description": "Accueil et information du personnel (prise de poste) • Accompagner le personnel dans leurs démarches administratives. • Suivi et élaboration des états de présence du personnel administratif. • Gestion et suivi des demandes et dossiers du personnel (congés, attestations de travail, accidents de travail, détachements, etc.) • Élaboration des listes d'absences pour les bénéficiaires d’indemnités.   • Préparation des notes numéros professionnels et des primes de rendement. • Gestion des questionnair",
    "departement": "Autre",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, Langue française, Gestion administrative, Dialogue social., Évaluation., Développement RH., Gestion des conflits., Confidentialité."
  },
  {
    "titre": "Responsable Service Scolarité",
    "description": "Manager l’équipe du service de scolarité (Chargés administratifs de scolarité et examens, chargés de la scolarité et de la logistique pédagogique, chargé d’emploi et de la présence). • Former l’équipe du service de scolarité à l’usage des plateformes de gestion des notes et les systèmes de gestion de scolarité. • Assurer l’accès aux systèmes de gestion de scolarité et aux plateformes de gestion des notes. • Etablir le besoin du service scolarité en termes d’équipement, licences et fournitures bu",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Maîtrise / licence / Mastère ou équivalent, Langue française, Compétence en gestion des examens, Gestion des équipes administratives., Rigueur administrative., Communication., Analyse et reporting des données académiques., Gestion des priorités."
  },
  {
    "titre": "Secrétaire de la direction des départements",
    "description": "Assurer la liaison entre les enseignants et le Directeur de département en matière de communication, de circulation de l’information et de gestion des demandes administratives ou pédagogiques. • Assurer la gestion et le suivi administratif des stages étudiants (stages ouvriers, PFA, PFE). • Publier sur le site web de l’institut les informations et annonces relatives à la recherche de stages et aux opportunités offertes aux étudiants. • Assurer le suivi et le traitement des documents de stage, no",
    "departement": "Administration",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "bac+3, - Compétences en rédaction et communication,, - Diplomatie et bienveillance,, - Autonomie"
  },
  {
    "titre": "Secrétaire de la direction",
    "description": "Assurer la gestion des courriers (réception, tri, diffusion et archivage), • Rédiger et mettre en forme des documents officiels (rapports, notes, comptes rendus, emails),  • Organiser et classer les dossiers administratifs,    • Assurer le suivi des demandes et des décisions prises par la direction,  • Gestion de l’agenda et des réunions,  • Accueil et communication,  • Gestion des documents et suivi des dossiers,  • Coordination avec les services internes et externes",
    "departement": "Administration",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "bac+3, - Compétences en rédaction et communication,, - Diplomatie et bienveillance,, - Autonomie"
  },
  {
    "titre": "Secrétaire du secrétaire général",
    "description": "Assurer la gestion des courriers (réception, tri, diffusion et archivage), • Rédiger et mettre en forme des documents officiels (rapports, notes, comptes rendus, emails),  • Organiser et classer les dossiers administratifs,    • Assurer le suivi des demandes et des décisions prises par le secrétaire général,  • Gestion de l’agenda et des réunions,  • Accueil et communication,  • Gestion des documents et suivi des dossiers,  • Coordination avec les services internes et externes  • Participation a",
    "departement": "Administration",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "bac+3, - Compétences en rédaction et communication,, - Diplomatie et bienveillance,, - Autonomie"
  },
  {
    "titre": "Assistant service technique",
    "description": "Assurer l’entretien de base des installations techniques (électricité, éclairage, ventilation…). • Participer à la mise en place, au raccordement ou au démontage de matériel pédagogique, bureautique ou audiovisuel. • Préparer les salles, installer les équipements nécessaires (microphones, vidéoprojecteurs, etc.) et intervenir en cas de besoin technique. • Collaborer avec des prestataires extérieurs (techniciens spécialisés, entreprises de maintenance) et assurer un suivi des travaux réalisés. • ",
    "departement": "Logistique",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Technicien en informatique, Compétences de base en maintenance, Capacité à diagnostique et d’intervention rapide, Connaissance des règles de sécurité, Esprit d’équipe et collaboration, Autonomie"
  },
  {
    "titre": "Standardiste",
    "description": "Accueil téléphonique • Gestion des appels téléphoniques  • Transmission, interne et externe, des informations fiables, claires et rapides. • Gestion des urgences et coordination avec les équipes appropriées (sécurité, soins médicaux, etc.) • Garantir le respect de la confidentialité des informations personnelles et professionnelles. • Participation active dans la mise en place et le maintien du dispositif qualité (accueil, prestations) • Amélioration continue de la qualité de la prestation",
    "departement": "Administration",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Langue arabe, Langue française, Accueil, Téléphonie, Communication, Sang-froid, Service, Orientation, Discrétion, Priorisation"
  },
  {
    "titre": "Agent de tirage",
    "description": "Veiller à la bonne marche des imprimantes, photocopieuses, et autres équipements de reproduction. • Préparer, imprimer et distribuer les documents nécessaires pour les enseignants et administrateurs (supports pédagogiques, examens, documents administratifs). • Assurer le contrôle régulier de l’état des équipements, effectuer les réparations de base ou signaler les pannes. • Veiller à l'approvisionnement en papier, encre et autres consommables nécessaires au bon fonctionnement des équipements. • ",
    "departement": "Autre",
    "priorite": "Normale",
    "dateDebut": "2025-05-01",
    "dateFin": "2025-12-31",
    "statut": "Ouverte",
    "competencesRequises": "Langue française, Langue arabe, Vigilance, Lucidité, Autonomie, Anticipation"
  }
];
  
  var results = [];
  missionsData.forEach(function(m) {
    try {
      var res = addMission(m);
      results.push(res);
    } catch(e) {
      Logger.log("Erreur pour " + m.titre + ": " + e.message);
    }
  });
  Logger.log(results.length + " missions ajoutées.");
  return results;
}