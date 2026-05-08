/**
 * ============================================================
 *  ABSENCES MODULE
 *  CRUD + Admin validation + Analysis for absences
 * ============================================================
 */

var EXTERNAL_ABSENCES_SHEET_ID = '1mRgdd4dYeVjgrPn_V7abKuuU_OMsU5Hh60y3TmJjx1I';

/**
 * Fetch absences from external Google Sheet via CSV export
 * Same pattern as importPostesFromExternalSheet()
 */
function getAbsences() {
  try {
    var url = 'https://docs.google.com/spreadsheets/d/' + EXTERNAL_ABSENCES_SHEET_ID
            + '/gviz/tq?tqx=out:csv&sheet=Absences';
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var csvContent = response.getContentText();

    var rows = Utilities.parseCsv(csvContent);
    if (!rows || rows.length <= 1) return [];

    var headers = rows[0].map(function(h) { return h.trim(); });

    return rows.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    }).filter(function(obj) {
      // Exclure les lignes vides (sans ID)
      return obj[headers[0]] && String(obj[headers[0]]).trim() !== '';
    });

  } catch (e) {
    Logger.log('❌ getAbsences (external) error: ' + e.message);
    return [];
  }
}

function addAbsence(data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_ABSENCES);
    if (!sheet) return { success: false, message: 'Feuille Absences introuvable.' };
    if (!data.employeId) return { success: false, message: 'Employé obligatoire.' };

    var id = generateId('ABS');
    var d1 = new Date(data.dateDebut);
    var d2 = new Date(data.dateFin);
    if (isNaN(d1) || isNaN(d2)) return { success: false, message: 'Dates invalides.' };
    if (d2 < d1) return { success: false, message: 'La date de fin doit être après la date de début.' };

    var duration = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    var employee = getEmployeeById(data.employeId);
    var empName = employee ? (employee['Nom'] + ' ' + employee['Prénom']) : String(data.employeId);

    sheet.appendRow([
      id,
      data.employeId || '',
      empName,
      data.type      || 'Congé',
      data.dateDebut || '',
      data.dateFin   || '',
      duration,
      data.motif     || '',
      'En attente',
      data.justificatifUrl || ''
    ]);

    var empCIN = employee ? String(employee['CIN'] || data.employeId) : data.employeId;
    try {
      notifyAdmin(
        empCIN,
        empName + ' a soumis une demande d\'absence (' + (data.type || 'Congé') + ') du ' + data.dateDebut + ' au ' + data.dateFin,
        'absences'
      );
    } catch(notifErr) { Logger.log('notif warn: ' + notifErr); }

    return { success: true, id: id, message: 'Absence enregistrée. En attente de validation.' };
  } catch (e) {
    Logger.log('❌ addAbsence error: ' + e.message);
    return { success: false, message: e.message };
  }
}

function updateAbsenceStatus(id, statut, motifRefus) {
  try {
    if (statut !== 'Approuvée' && statut !== 'Refusée' && statut !== 'En attente') {
      return { success: false, message: 'Statut invalide.' };
    }
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_ABSENCES);
    if (!sheet) return { success: false, message: 'Feuille Absences introuvable.' };
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        sheet.getRange(i + 1, 9).setValue(statut);
        // Enregistrer le motif de refus dans la colonne 11 si refus
        if (statut === 'Refusée' && motifRefus) {
          var lastCol = sheet.getLastColumn();
          var refusCol = lastCol >= 11 ? 11 : lastCol + 1;
          sheet.getRange(i + 1, refusCol).setValue(motifRefus);
        }

        var empId = String(rows[i][1]);
        var employees = getEmployees();
        var emp = employees.find(function(e) { return String(e['ID']) === empId; });
        if (emp && emp['CIN']) {
          var cin = String(emp['CIN']);
          if (statut === 'Approuvée') {
            notifyEmployee(cin, '✅ Votre demande d\'absence a été approuvée.', 'success', 'absences');
          } else if (statut === 'Refusée') {
            var msg = '❌ Votre demande d\'absence a été refusée.';
            if (motifRefus) msg += ' Motif : ' + motifRefus;
            else msg += ' Contactez votre RH pour plus d\'informations.';
            notifyEmployee(cin, msg, 'danger', 'absences');
          }
        }

        return { success: true, message: 'Statut absence mis à jour : ' + statut };
      }
    }
    return { success: false, message: 'Absence introuvable' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Analyse absences for a given period
 */
function analyzeAbsences(periodDays) {
  periodDays = periodDays || 90;
  var employees = getEmployees();
  var absences  = getAbsences();
  var cutoff    = new Date(new Date().getTime() - periodDays * 24 * 60 * 60 * 1000);

  var analysis = employees.map(function(emp) {
    var empAbs = absences.filter(function(a) {
      return String(a['Employé ID']) === String(emp['ID']) && new Date(a['Date Début']) >= cutoff;
    });
    var totalDays = empAbs.reduce(function(s, a) { return s + (Number(a['Durée (jours)']) || 0); }, 0);
    var types = {};
    empAbs.forEach(function(a) { var t = a['Type'] || 'Autre'; types[t] = (types[t] || 0) + 1; });
    return {
      id       : emp['ID'],
      name     : emp['Nom'] + ' ' + emp['Prénom'],
      dept     : emp['Département'],
      count    : empAbs.length,
      totalDays: totalDays,
      types    : types,
      rate     : Math.round((totalDays / periodDays) * 100)
    };
  });
  analysis.sort(function(a, b) { return b.totalDays - a.totalDays; });
  return { success: true, period: periodDays, data: analysis };
}