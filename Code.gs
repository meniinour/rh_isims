/**
 * ============================================================
 *  RH PLATFORM – Main Entry Point
 *  Google Apps Script | Web App Router
 * ============================================================
 */

// ─── GLOBAL CONFIG ───────────────────────────────────────────
var CONFIG = {
  SPREADSHEET_ID: '1mRgdd4dYeVjgrPn_V7abKuuU_OMsU5Hh60y3TmJjx1I',
  SHEET_EMPLOYEES : 'Employees',
  SHEET_POSTES    : 'Postes',
  SHEET_MISSIONS  : 'Missions',
  SHEET_ABSENCES  : 'Absences',
  SHEET_SKILLS    : 'Skills',
  SHEET_DOCUMENTS : 'Documents',
  SHEET_AFFECTATIONS: 'Affectations',
  DRIVE_DOCS_FOLDER_ID: '10PzwszNZ_-u0MIVRRX0ivQ_zJBq14JAY',
  DRIVE_JUSTIFICATIFS_FOLDER: 'rh_justificatifs',
  APP_VERSION: '1.1.0'
};

/**
 * ============================================================
 *  getPrintTemplate  –  patch à ajouter dans votre Code.gs
 *  (ou le fichier qui contient déjà getPrintTemplate)
 * ============================================================
 *
 *  Appel depuis absences.html :
 *    callServer('getPrintTemplate', ['tpl-absence', { ...data }], callback)
 */

function getPrintTemplate(templateName, data) {
  try {
    var tpl = HtmlService.createTemplateFromFile(templateName);

    // ── helpers ──────────────────────────────────────────
    function esc(v) { return String(v || '').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function fmtDate(d) {
      if (!d) return '__ / __ / ______';
      var dd = new Date(d);
      if (isNaN(dd)) return String(d);
      return Utilities.formatDate(dd, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    }

    function addDays(d, n) {
      var r = new Date(d); r.setDate(r.getDate() + n); return r;
    }

    function checkbox(type, key) {
      var match = String(type || '').toLowerCase().trim() === key.toLowerCase().trim();
      return { cls: match ? 'on' : '', mark: match ? '✓' : '' };
    }

    // ── remplissage des variables ─────────────────────────
    var d = data || {};

    // Référence & date
    tpl.id         = esc(d.id        || '–');
    tpl.date_today = esc(d.date_today || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'));

    // Agent
    tpl.nom        = esc(d.nom      || '');
    tpl.prenom     = esc(d.prenom   || '');
    tpl.cin        = esc(d.cin      || '–');
    tpl.poste      = esc(d.poste    || '–');
    tpl.departement= esc(d.departement || '–');

    // Type checkboxes
    var types = {
      conge      : 'Congé annuel',
      maladie    : 'Maladie',
      maternite  : 'Congé maternité',
      paternite  : 'Congé paternité',
      formation  : 'Formation',
      solde      : 'Sans solde',
      autre      : 'Autre'
    };
    Object.keys(types).forEach(function(k) {
      var cb = checkbox(d.type, types[k]);
      tpl['cb_' + k] = cb.cls;
      tpl['ck_' + k] = cb.mark || '&nbsp;';
    });

    // Dates
    tpl.debut  = esc(fmtDate(d.debut));
    tpl.fin    = esc(fmtDate(d.fin));
    tpl.duree  = esc(String(d.duree  || '–'));
    tpl.motif  = esc(d.motif || '');

    // Reprise = fin + 1 jour
    if (d.fin) {
      try { tpl.reprise = esc(fmtDate(addDays(d.fin, 1))); }
      catch(e2) { tpl.reprise = '–'; }
    } else {
      tpl.reprise = '–';
    }

    // Statut stamp
    var statut = String(d.statut || 'En attente');
    if (statut === 'Approuvée') {
      tpl.stamp_class = 'ok';
      tpl.stamp_text  = '✓ Approuvée';
    } else if (statut === 'Refusée') {
      tpl.stamp_class = 'ko';
      tpl.stamp_text  = '✗ Refusée';
    } else {
      tpl.stamp_class = '';
      tpl.stamp_text  = 'En attente de décision';
    }

    return tpl.evaluate().getContent();

  } catch(e) {
    Logger.log('❌ getPrintTemplate error: ' + e.message);
    return '<p style="color:red;font-family:sans-serif;padding:20px">Erreur template : ' + e.message + '</p>';
  }
}

/**
 * Web-App entry point: GET requests
 * FIX: Removed duplicate 'case login' (was dead code)
 */
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'login';
  var html;

  switch (page) {
    case 'emp-dashboard':
      html = HtmlService.createTemplateFromFile('emp-dashboard');
      break;
    case 'admin-dashboard':
      html = HtmlService.createTemplateFromFile('admin-dashboard');
      break;
    case 'skills-form':
      html = HtmlService.createTemplateFromFile('skills-form');
      break;
    case 'tasks-page':
      html = HtmlService.createTemplateFromFile('tasks-page');
      break;
    case 'employees':
      html = HtmlService.createTemplateFromFile('employees');
      break;
    case 'missions':
      html = HtmlService.createTemplateFromFile('missions');
      break;
    case 'absences':
      html = HtmlService.createTemplateFromFile('absences');
      break;
    case 'documents':
      html = HtmlService.createTemplateFromFile('documents');
      break;
    case 'recommendation':
      html = HtmlService.createTemplateFromFile('recommendation');
      break;
    case 'postes':
      html = HtmlService.createTemplateFromFile('postes');
      break;
    case 'ia-dashboard':
      html = HtmlService.createTemplateFromFile('ia-dashboard');
      break;
    case 'dashboard':
      html = HtmlService.createTemplateFromFile('dashboard');
      break;
    case 'demandes':
      html = HtmlService.createTemplateFromFile('demandes');
      break;
    case 'admin-demandes':
      html = HtmlService.createTemplateFromFile('admin-demandes');
      break;
    case 'admin-absences-employee':
      html = HtmlService.createTemplateFromFile('admin-absences-employee');
      break;
    case 'landing':
      html = HtmlService.createTemplateFromFile('landing');
      break;
    case 'login':
    default:
      html = HtmlService.createTemplateFromFile('login');
  }

  return html.evaluate()
    .setTitle('RH Platform – ISIMS Edition')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include partial HTML files (CSS / JS snippets)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get Web App URL for safe navigation
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * ── TASK 2 FIX: Initialize and store Spreadsheet ID ──────────
 * Run this once from the Apps Script editor before deploying.
 * It saves the correct Spreadsheet ID into PropertiesService so
 * all modules resolve it consistently.
 */
function initializeApp() {
  var props = PropertiesService.getScriptProperties();
  var idToUse = CONFIG.SPREADSHEET_ID;
  
  // Save/update the ID to ensure it matches CONFIG
  props.setProperty('SPREADSHEET_ID', idToUse);
  
  var ss = SpreadsheetApp.openById(idToUse);
  setupSheets(ss);
  setupUsersSheet(ss);
  
  Logger.log('✅ App initialized. Spreadsheet ID: ' + idToUse);
  return { success: true, id: idToUse };
}

/**
 * Return the active Spreadsheet (auto-initialize if needed)
 * FIX: Consistent ID resolution – PropertiesService > CONFIG > create new
 */
function getSpreadsheet() {
  var id = CONFIG.SPREADSHEET_ID;
  var ss = SpreadsheetApp.openById(id);
  
  // Force update PropertiesService just in case
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  
  // Safety check: if Employees sheet is missing, run setup
  if (!ss.getSheetByName(CONFIG.SHEET_EMPLOYEES)) {
    setupSheets(ss);
  }
  
  return ss;
}

/**
 * Create / configure all sheets with headers
 */
function setupSheets(ss) {
  var sheets = {
    Employees: ['ID','Nom','Prénom','Email','Téléphone','Département','Poste','Date Embauche','Statut','Compétences','Salaire','CIN'],
    Postes:    ['ID','Catégorie','Titre','Relations Fonctionnelles','Relations Externes','Supérieur Hiérarchique','Remplaçant','Tâches','Formation','Expérience','Compétences Requises'],
    Missions:  ['ID','Titre','Description','Département','Date Début','Date Fin','Statut','Compétences Requises','Priorité','Employé Affecté'],
    Absences:  ['ID','Employé ID','Employé Nom','Type','Date Début','Date Fin','Durée (jours)','Motif','Statut','JustificatifUrl'],
    Skills:    ['ID','Nom Compétence','Catégorie','Description','Niveau'],
    Documents: ['ID','Fichier','Nom Extrait','Email Extrait','Téléphone Extrait','Compétences Extraites','Date Traitement','Statut'],
    Affectations: ['ID','Mission ID','Employé ID','Date Affectation','Score Recommandation','Statut'],
    Notifications: ['ID','DestType','DestCIN','Message','Type','Lu','Date','ActionURL']
  };

  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Feuille 1');

  Object.keys(sheets).forEach(function(name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

    var headers = sheets[name];
    // Only set headers if row 1 is empty (don't overwrite existing data)
    var firstCell = sheet.getRange(1, 1).getValue();
    if (!firstCell || firstCell === '') {
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setBackground('#1a1a2e')
                 .setFontColor('#ffffff')
                 .setFontWeight('bold')
                 .setFontSize(11);
    }
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 60);
    headers.forEach(function(_, i) {
      if (i > 0) sheet.setColumnWidth(i + 1, 150);
    });
  });

  // Delete original blank sheet if it's not one of ours
  if (defaultSheet && !sheets[defaultSheet.getName()]) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  Logger.log('✅ All sheets configured.');
}

/**
 * Generate a unique ID with a prefix
 */
function generateId(prefix) {
  return prefix + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
}

/**
 * Return the deployed Web App URL (used for client-side navigation)
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * ── TASK 4 FIX: Server-side CIN uniqueness check ─────────────
 * Called from the client before proceeding to Step 2 of the wizard.
 */
function checkCinUnique(cin) {
  try {
    var cinStr = String(cin).trim();
    // Server-side format validation
    if (!/^\d{8}$/.test(cinStr)) {
      return { unique: false, message: 'Le CIN doit comporter exactement 8 chiffres.' };
    }
    var employees = getEmployees();
    var exists = employees.some(function(e) { return String(e['CIN']).trim() === cinStr; });
    if (exists) {
      return { unique: false, message: 'Ce numéro CIN existe déjà dans la base de données.' };
    }
    return { unique: true };
  } catch (e) {
    return { unique: false, message: 'Erreur lors de la vérification: ' + e.message };
  }
}

/**
 * Quick health check – run this manually in the editor first
 */
function testWorkflow() {
  Logger.log('=== RH Platform Health Check ===');
  var init = initializeApp();
  Logger.log('Spreadsheet ID: ' + init.id);
  var emps = getEmployees();
  Logger.log('Employees count: ' + emps.length);
  var missions = getMissions();
  Logger.log('Missions count: ' + missions.length);
  Logger.log('=== Done ===');
}
