# Rapport de Stage : Conception et Développement d'une Plateforme de Gestion Intelligente des Ressources Humaines

---

## 📘 PAGE DE GARDE (Structure suggérée)
**République Tunisienne**  
**Ministère de l’Enseignement Supérieur et de la Recherche Scientifique**  
**[Nom de votre institution, ex: ISIM SFAX]**

**RAPPORT DE FIN D’ÉTUDES**  
*En vue de l’obtention du Diplôme de [Votre Diplôme]*

**Sujet :**  
### Conception et développement d’une application web full-stack de gestion des ressources humaines avec moteur de recommandations intelligent.

**Réalisé par :** [Votre Nom]  
**Encadrant Entreprise :** [Nom]  
**Encadrant Académique :** [Nom]  

**Session :** Juin 2026

---

## 📑 TABLE DES MATIÈRES (Structure Professionnelle)

1.  **Introduction Générale**
2.  **Chapitre 1 : Cadre Général du Projet**
    *   1.1 Présentation de l'organisme d'accueil
    *   1.2 Problématique
    *   1.3 Objectifs du projet
    *   1.4 Méthodologie adoptée (Scrum/ScrumBan)
3.  **Chapitre 2 : Analyse et Spécification des Besoins**
    *   2.1 Identification des acteurs
    *   2.2 Besoins fonctionnels
    *   2.3 Besoins non-fonctionnels
    *   2.4 Modélisation UML (Cas d'utilisation)
4.  **Chapitre 3 : Conception du Système**
    *   3.1 Architecture logicielle (Modèle MVC)
    *   3.2 Conception de la base de données (Schéma Relationnel / Google Sheets)
    *   3.3 Design des interfaces (UI/UX)
5.  **Chapitre 4 : Réalisation et Implémentation**
    *   4.1 Environnement de développement
    *   4.2 Choix technologiques (Google Apps Script, HTML5/CSS3/JS)
    *   4.3 Le Moteur de Recommandation Intelligent (Logique de Scoring)
    *   4.4 Module d'analyse de documents (Parsing de CV)
6.  **Chapitre 5 : Tests et Évaluation**
    *   5.1 Scénarios de tests fonctionnels
    *   5.2 Tableaux de bord et indicateurs RH (KPIs)
    *   5.3 Déploiement et mise en production
7.  **Conclusion et Perspectives**

---

## 📝 CONTENU DÉTAILLÉ (À intégrer dans votre rapport)

### 1. Introduction Générale
Le monde de l'entreprise moderne exige une réactivité accrue et une gestion optimisée du capital humain. Ce projet s'inscrit dans cette dynamique en proposant une plateforme de gestion des RH intelligente, capable non seulement de centraliser les données administratives mais aussi d'assister les décideurs dans l'affectation des missions et l'analyse de la performance.

### 2. Chapitre 1 : Méthodologie ScrumBan
Pour ce projet, nous avons opté pour la méthodologie **ScrumBan**, combinant la structure de Scrum (Sprints, Backlog) avec la flexibilité visuelle de Kanban.
*   **Pourquoi ?** L'intégration de modules expérimentaux comme le moteur de recommandation nécessitait des ajustements constantes. Scrum nous a permis de livrer des versions incrémentales (Auth, Gestion Employés, Dashboard), tandis que Kanban a facilité la gestion du flux de travail quotidien.

### 3. Chapitre 2 : Analyse UML (Exemple de texte)
*   **Acteurs :** Administrateur RH (gestion complète), Employé (consultation profil, missions, demandes d'absences).
*   **Cas d'utilisation principal :** L'Administrateur peut générer des recommandations automatiques pour une mission spécifique. Le système analyse les compétences, la charge actuelle et l'historique d'absences pour proposer le candidat idéal.

### 4. Chapitre 3 : Architecture Technique et Écosystème
L'application repose sur l'écosystème **Google Workspace**, offrant une solution "Serverless" robuste, hautement disponible et sans coût d'infrastructure :
*   **Frontend (Interface Utilisateur) :** 
    *   Interfaces web dynamiques développées en **HTML5** et **CSS3** (utilisant le concept de Glassmorphism).
    *   Utilisation de polices modernes (**Google Fonts : Inter, Poppins**) et d'icônes vectorielles pour une esthétique premium.
    *   **Navigation Centralisée :** Système de menu dynamique injecté par JavaScript (`isims-scripts.html`) qui s'adapte en temps réel selon les droits de l'utilisateur (Admin vs Employé).
*   **Backend (Logique Métier) :** 
    *   Logic métier entièrement propulsé par **Google Apps Script (GAS)** (basé sur le moteur JavaScript V8). 
    *   *Note technique :* Contrairement aux architectures classiques (Python/Django ou PHP), GAS permet une intégration "native" et sécurisée avec les services Google sans gestion de serveur.
    *   Communication via `google.script.run` pour des appels asynchrones entre le client et le serveur.
*   **Base de Données & Stockage :** 
    *   **Google Sheets** fait office de base de données relationnelle (Tables : `Employees`, `Missions`, `Absences`, `Demandes`, `Postes`).
    *   **Google Drive API** pour le stockage sécurisé des pièces jointes (justificatifs d'absence, templates de documents).

### 5. Chapitre 4 : Implémentation des Modules Clés

#### 4.1 Le Moteur de Recommandation Intelligent
C'est l'innovation majeure du projet. Le moteur utilise une **Algorithmique de Scoring Pondéré** (Multi-Criteria Decision Making) développée en JavaScript :
*   **Compétences (40%) :** Correspondance sémantique entre les besoins de la mission et le profil de l'employé.
*   **Poste & Adéquation (20%) :** Vérification de la compatibilité du poste actuel avec la mission.
*   **Charge de Travail (20%) :** Analyse dynamique des affectations en cours pour prévenir la surcharge.
*   **Fiabilité (15%) :** Calculé sur le taux d'absence approuvé des 90 derniers jours.
*   **Ancienneté (5%) :** Valorisation de l'expérience au sein de l'entreprise.

#### 4.2 Module de Gestion des Demandes (Templates Dynamiques)
Ce module permet une flexibilité totale pour l'administration :
*   **Moteur de Templates :** L'administrateur peut créer des types de demandes (ex: Matériel, Télétravail) avec des formulaires personnalisables (champs texte, dates, listes).
*   **Workflow d'approbation :** Cycle de vie complet (En attente → Approuvée/Refusée) avec notification automatique et obligation de justifier les refus.

#### 4.3 Gestion des Absences et Suivi Individuel
*   **Vue Admin :** Interface de monitoring permettant de filtrer les absences par employé, département ou statut.
*   **Vue Employé :** Espace restreint permettant de soumettre une demande et de suivre son avancement en temps réel.

### 6. Chapitre 5 : Sécurité et Authentification
*   **Sécurisation par Rôle :** Implémentation d'une couche d'authentification robuste (`Auth.gs`) différenciant les droits Admin et Employé.
*   **Session Management :** Utilisation du `PropertiesService` de Google et du `localStorage` côté client pour maintenir une session sécurisée et éviter les accès non autorisés.
*   **Protection des Données :** Filtrage systématique des données côté serveur (GAS) avant envoi au client, garantissant qu'un employé ne puisse jamais accéder aux données de ses collègues ou à l'administration.

### 7. Chapitre 6 : Résultats et Évaluation (KPIs)
Le dashboard RH permet une visualisation stratégique :
*   **Top Performers :** Classement dynamique basé sur le score de recommandation global.
*   **Analyse de l'Absentéisme :** Identification des tendances par département.
*   **Optimisation des Affectations :** Réduction du temps de sélection des équipes de mission grâce aux suggestions automatiques.

---

## 🚀 DÉTAILS TECHNIQUES POUR L'ORAL / ANNEXES

### Langages et Outils :
*   **IDE :** Visual Studio Code avec CLASP (Command Line Apps Script Projects).
*   **Langages :** JavaScript (ES6+), HTML5, CSS3.
*   **APIs :** Google Apps Script API, Drive API (pour le parsing de documents), Spreadsheet Service.
*   **IA de Parsing :** Implémentation d'un module de reconnaissance de texte pour extraire automatiquement les informations des CV (.docx) déposés sur Google Drive.

### Tests Effectués :
1.  **Tests Unitaires :** Validation des fonctions de calcul de score (Recommendation.gs).
2.  **Tests d'Intégration :** Flux complet depuis le dépôt d'un CV jusqu'à la création automatique d'une fiche employé.
3.  **Tests de Performance :** Temps de réponse du moteur sur une base de 100+ employés (Score calculé en < 1s).

---

## 🏁 CONCLUSION ET PERSPECTIVES

### Conclusion
Ce projet a permis de concevoir une solution innovante et légère pour la gestion des RH. En s'appuyant sur l'écosystème **Google Workspace**, nous avons pu déployer une application full-stack sécurisée, sans coût d'hébergement, tout en intégrant des fonctionnalités avancées de recommandation basées sur les données. La centralisation des processus (absences, demandes, missions) offre un gain de productivité immédiat pour l'administrateur.

### Perspectives Futures
*   **Intégration de l'IA Générative (LLM) :** Utiliser Gemini pour générer des synthèses de performance ou des offres d'emploi basées sur les besoins d'une mission.
*   **Application Mobile :** Déployer l'interface via AppSheet pour un accès natif sur smartphone.
*   **Notifications Push :** Intégrer un service de notifications en temps réel pour alerter les employés dès qu'une mission leur est assignée.

**"L'intelligence au service de l'humain."**
