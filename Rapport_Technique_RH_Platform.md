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

### 4. Chapitre 3 : Architecture Technique (Le cœur du projet)
L'application repose sur l'écosystème **Google Workspace**, offrant une solution "Serverless" robuste :
*   **Frontend :** Interfaces web dynamiques développées en HTML5, CSS3 (avec Glassmorphism) et JavaScript.
*   **Backend :** Logic métier propulsé par **Google Apps Script (GAS)**, assurant une intégration native avec les services Google (Gmail pour notifications, Drive pour stockage).
*   **Base de Données :** Utilisation de **Google Sheets** comme base de données relationnelle structurée (Tables : Employees, Missions, Absences, Postes).

### 5. Chapitre 4 : Le Moteur de Recommandation Intelligent
C'est l'innovation majeure du projet. Contrairement à une gestion manuelle, notre moteur utilise une **Algorithmique de Scoring Pondéré** (Multi-Criteria Decision Making) :
*   **Compétences (40%) :** Correspondance directe entre les besoins de la mission et le profil.
*   **Poste & Expérience (20%) :** Adéquation hiérarchique et ancienneté.
*   **Charge de Travail (20%) :** Analyse des missions actives pour éviter le burnout.
*   **Taux d'Absence (15%) :** Fiabilité basée sur l'historique récent (90 jours).
*   **Expérience/Ancienneté (5%) :** Valorisation de la fidélité.

### 6. Chapitre 5 : Dashboard et KPIs RH
La plateforme intègre un tableau de bord analytique permettant de suivre en temps réel :
*   **Top Performers :** Employés ayant le meilleur score composite (compétences/assiduité).
*   **Taux d'absentéisme par département :** Pour identifier les zones de tension.
*   **Distribution de la charge :** Visualisation des missions assignées par rapport aux capacités.

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
