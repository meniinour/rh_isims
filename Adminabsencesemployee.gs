/**
 * ============================================================
 *  ADMIN ABSENCES PAR EMPLOYÉ – MODULE GS
 *  Page : admin-absences-employee
 *  Fonctions exposées via processRequest() / callServer()
 * ============================================================
 *
 *  Fonctions disponibles :
 *   - getAbsencesGroupedByEmployee()   → toutes les absences regroupées par employé
 *   - getAbsencesByEmployee(employeId) → absences d'un seul employé
 *   - getAbsenceStats()                → stats globales (total, en attente, approuvées, refusées)
 *   - getAbsenceStatsPerEmployee()     → stats par employé (nb absences, jours totaux)
 *   - updateAbsenceStatus(id, statut, motifRefus)  → approuver / refuser (déjà dans Absences.gs, réexposé ici)
 *   - printAbsenceSheet(absenceId)     → retourne HTML d'impression pour une absence
 * ============================================================
 */


/* ────────────────────────────────────────────────────────────
   1. ABSENCES GROUPÉES PAR EMPLOYÉ
   Retourne un tableau d'objets { employee, absences[] }
   ──────────────────────────────────────────────────────────── */
function getAbsencesGroupedByEmployee() {
  try {
    var employees = getEmployees();   // déjà défini dans votre codebase
    var absences  = getAbsences();    // déjà défini dans Absences.gs

    // Construire un index employés
    var empIndex = {};
    employees.forEach(function(e) {
      empIndex[String(e['ID'])] = e;
    });

    // Grouper les absences
    var groups = {};
    absences.forEach(function(a) {
      var eid = String(a['Employé ID'] || '');
      if (!groups[eid]) {
        groups[eid] = {
          employee : empIndex[eid] || null,
          employeId: eid,
          absences : []
        };
      }
      groups[eid].absences.push(a);
    });

    // Convertir en tableau, tri : En attente d'abord, puis par nom
    var result = Object.values(groups);
    result.sort(function(a, b) {
      var aPend = a.absences.filter(function(x) { return x['Statut'] === 'En attente'; }).length;
      var bPend = b.absences.filter(function(x) { return x['Statut'] === 'En attente'; }).length;
      if (bPend !== aPend) return bPend - aPend;
      var aN = a.employee ? (a.employee['Nom'] || '') : '';
      var bN = b.employee ? (b.employee['Nom'] || '') : '';
      return aN.localeCompare(bN);
    });

    return { success: true, data: result };
  } catch(e) {
    Logger.log('❌ getAbsencesGroupedByEmployee: ' + e.message);
    return { success: false, message: e.message, data: [] };
  }
}


/* ────────────────────────────────────────────────────────────
   2. ABSENCES D'UN SEUL EMPLOYÉ
   ──────────────────────────────────────────────────────────── */
function getAbsencesByEmployee(employeId) {
  try {
    if (!employeId) return { success: false, message: 'employeId manquant.', data: [] };

    var absences  = getAbsences();
    var employees = getEmployees();

    var emp = employees.find(function(e) { return String(e['ID']) === String(employeId); }) || null;
    var mine = absences.filter(function(a) { return String(a['Employé ID']) === String(employeId); });

    // Trier par date début décroissante
    mine.sort(function(a, b) {
      return new Date(b['Date Début']) - new Date(a['Date Début']);
    });

    return {
      success  : true,
      employee : emp,
      absences : mine,
      stats    : _buildEmpStats(mine)
    };
  } catch(e) {
    Logger.log('❌ getAbsencesByEmployee: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ────────────────────────────────────────────────────────────
   3. STATS GLOBALES
   ──────────────────────────────────────────────────────────── */
function getAbsenceStats() {
  try {
    var absences  = getAbsences();
    var employees = getEmployees();

    var empIds = new Set(absences.map(function(a) { return String(a['Employé ID']); }));

    return {
      success          : true,
      total            : absences.length,
      enAttente        : absences.filter(function(a) { return a['Statut'] === 'En attente'; }).length,
      approuvees       : absences.filter(function(a) { return a['Statut'] === 'Approuvée'; }).length,
      refusees         : absences.filter(function(a) { return a['Statut'] === 'Refusée'; }).length,
      employesConcernes: empIds.size,
      totalEmployes    : employees.length
    };
  } catch(e) {
    Logger.log('❌ getAbsenceStats: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ────────────────────────────────────────────────────────────
   4. STATS PAR EMPLOYÉ (pour les badges de la fiche)
   ──────────────────────────────────────────────────────────── */
function getAbsenceStatsPerEmployee() {
  try {
    var employees = getEmployees();
    var absences  = getAbsences();

    var result = employees.map(function(emp) {
      var mine = absences.filter(function(a) { return String(a['Employé ID']) === String(emp['ID']); });
      return {
        employeId : emp['ID'],
        nom       : (emp['Nom'] || '') + ' ' + (emp['Prénom'] || ''),
        poste     : emp['Poste'] || '',
        dept      : emp['Département'] || '',
        cin       : emp['CIN'] || '',
        stats     : _buildEmpStats(mine)
      };
    });

    // Tri : plus d'absences d'abord
    result.sort(function(a, b) { return b.stats.total - a.stats.total; });

    return { success: true, data: result };
  } catch(e) {
    Logger.log('❌ getAbsenceStatsPerEmployee: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ────────────────────────────────────────────────────────────
   5. IMPRESSION HTML D'UNE ABSENCE
   Retourne le HTML d'impression prêt pour window.print()
   ──────────────────────────────────────────────────────────── */
function printAbsenceSheet(absenceId) {
  try {
    var absences = getAbsences();
    var a = absences.find(function(x) { return String(x['ID']) === String(absenceId); });
    if (!a) return { success: false, message: 'Absence introuvable.' };

    var employees = getEmployees();
    var emp = employees.find(function(e) { return String(e['ID']) === String(a['Employé ID']); }) || {};

    var html = _buildAbsencePrintHtml({
      id          : a['ID']            || '–',
      nom         : emp['Nom']         || (a['Employé Nom'] || '–'),
      prenom      : emp['Prénom']      || '',
      cin         : emp['CIN']         || '–',
      poste       : emp['Poste']       || '–',
      departement : emp['Département'] || '–',
      type        : a['Type']          || '',
      debut       : a['Date Début']    || '',
      fin         : a['Date Fin']      || '',
      duree       : a['Durée (jours)'] || '–',
      motif       : a['Motif']         || '',
      statut      : a['Statut']        || 'En attente',
      date_today  : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')
    });

    return { success: true, html: html };
  } catch(e) {
    Logger.log('❌ printAbsenceSheet: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ────────────────────────────────────────────────────────────
   6. SUPPRIMER UNE ABSENCE (admin)
   ──────────────────────────────────────────────────────────── */
function deleteAbsenceAdmin(absenceId) {
  try {
    if (!absenceId) return { success: false, message: 'ID manquant.' };
    var ss    = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_ABSENCES);
    if (!sheet) return { success: false, message: 'Feuille Absences introuvable.' };

    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(absenceId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Absence supprimée.' };
      }
    }
    return { success: false, message: 'Absence introuvable.' };
  } catch(e) {
    Logger.log('❌ deleteAbsenceAdmin: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ────────────────────────────────────────────────────────────
   7. MODIFIER UNE ABSENCE (admin peut tout modifier)
   ──────────────────────────────────────────────────────────── */
function updateAbsenceAdmin(absenceId, data) {
  try {
    if (!absenceId) return { success: false, message: 'ID manquant.' };
    var ss    = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_ABSENCES);
    if (!sheet) return { success: false, message: 'Feuille Absences introuvable.' };

    var d1 = new Date(data.dateDebut);
    var d2 = new Date(data.dateFin);
    if (isNaN(d1) || isNaN(d2)) return { success: false, message: 'Dates invalides.' };
    if (d2 < d1) return { success: false, message: 'La date de fin doit être après la date de début.' };

    var duration = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(absenceId)) {
        // Colonnes : ID(1) EmpID(2) EmpNom(3) Type(4) Début(5) Fin(6) Durée(7) Motif(8) Statut(9) JustifUrl(10)
        if (data.type)      sheet.getRange(i + 1, 4).setValue(data.type);
        if (data.dateDebut) sheet.getRange(i + 1, 5).setValue(data.dateDebut);
        if (data.dateFin)   sheet.getRange(i + 1, 6).setValue(data.dateFin);
                            sheet.getRange(i + 1, 7).setValue(duration);
        if (data.motif !== undefined) sheet.getRange(i + 1, 8).setValue(data.motif);
        if (data.statut)    sheet.getRange(i + 1, 9).setValue(data.statut);

        return { success: true, message: 'Absence mise à jour.' };
      }
    }
    return { success: false, message: 'Absence introuvable.' };
  } catch(e) {
    Logger.log('❌ updateAbsenceAdmin: ' + e.message);
    return { success: false, message: e.message };
  }
}


/* ============================================================
   HELPERS PRIVÉS
   ============================================================ */

/**
 * Calcule les stats pour un tableau d'absences d'un seul employé
 */
function _buildEmpStats(absences) {
  var totalDays = absences.reduce(function(s, a) {
    return s + (parseInt(a['Durée (jours)']) || 0);
  }, 0);

  var byType = {};
  absences.forEach(function(a) {
    var t = a['Type'] || 'Autre';
    byType[t] = (byType[t] || 0) + 1;
  });

  return {
    total    : absences.length,
    enAttente: absences.filter(function(a) { return a['Statut'] === 'En attente'; }).length,
    approuvee: absences.filter(function(a) { return a['Statut'] === 'Approuvée'; }).length,
    refusee  : absences.filter(function(a) { return a['Statut'] === 'Refusée'; }).length,
    totalDays: totalDays,
    byType   : byType
  };
}

/**
 * Génère le HTML d'impression d'une fiche absence
 */
function _buildAbsencePrintHtml(d) {
  var statutColor = d.statut === 'Approuvée' ? '#16a34a'
                  : d.statut === 'Refusée'   ? '#dc2626'
                  : '#d97706';

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">' +
    '<title>Fiche Absence – ' + d.nom + ' ' + d.prenom + '</title>' +
    '<style>' +
      'body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:0;padding:32px}' +
      'h1{font-size:20px;margin-bottom:4px}' +
      '.subtitle{color:#666;font-size:12px;margin-bottom:24px}' +
      'table{width:100%;border-collapse:collapse;margin-bottom:24px}' +
      'th,td{border:1px solid #ddd;padding:9px 13px;text-align:left}' +
      'th{background:#f3f4f6;font-weight:600;width:35%}' +
      '.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;color:white;background:' + statutColor + '}' +
      '.footer{margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#666}' +
      '.sig{border-top:1px solid #ccc;padding-top:8px;width:200px;text-align:center}' +
      '@media print{button{display:none}}' +
    '</style></head><body>' +
    '<h1>📋 Fiche de Demande d\'Absence</h1>' +
    '<div class="subtitle">RH Platform · Généré le ' + d.date_today + ' · Réf. ' + d.id + '</div>' +
    '<table>' +
      '<tr><th>Nom & Prénom</th><td><strong>' + d.nom + ' ' + d.prenom + '</strong></td></tr>' +
      '<tr><th>CIN</th><td>' + d.cin + '</td></tr>' +
      '<tr><th>Poste</th><td>' + d.poste + '</td></tr>' +
      '<tr><th>Département</th><td>' + d.departement + '</td></tr>' +
    '</table>' +
    '<table>' +
      '<tr><th>Type d\'absence</th><td>' + d.type + '</td></tr>' +
      '<tr><th>Date de début</th><td>' + d.debut + '</td></tr>' +
      '<tr><th>Date de fin</th><td>' + d.fin + '</td></tr>' +
      '<tr><th>Durée</th><td><strong>' + d.duree + ' jour(s)</strong></td></tr>' +
      '<tr><th>Motif</th><td>' + (d.motif || '–') + '</td></tr>' +
      '<tr><th>Statut</th><td><span class="badge">' + d.statut + '</span></td></tr>' +
    '</table>' +
    '<div class="footer">' +
      '<div class="sig">Signature Employé<br><br><br></div>' +
      '<div class="sig">Visa RH<br><br><br></div>' +
      '<div class="sig">Visa Direction<br><br><br></div>' +
    '</div>' +
    '</body></html>';
}