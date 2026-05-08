/**
 * ============================================================
 *  MISSIONS MODULE
 *  CRUD   FIX: getMissions() via CSV export (same as Postes method)
 *  NEW: getEmployeesByDeptForMission() for smart assignment
 * ============================================================
 */

var EXTERNAL_MISSIONS_SHEET_ID = '1mRgdd4dYeVjgrPn_V7abKuuU_OMsU5Hh60y3TmJjx1I';

/**
 * Get all missions — via UrlFetchApp CSV export
 * Exactement comme importPostesFromExternalSheet() dans Postes.gs
 */
function getMissions() {
  try {
    var url = 'https://docs.google.com/spreadsheets/d/' + EXTERNAL_MISSIONS_SHEET_ID
            + '/export?format=csv&sheet=Missions';

    var response = UrlFetchApp.fetch(url);
    var csvContent = response.getContentText();
    var rows = Utilities.parseCsv(csvContent);

    if (rows.length <= 1) {
      Logger.log('⚠️ getMissions CSV: feuille vide');
      return [];
    }

    var headers = rows[0];
    Logger.log('📋 getMissions headers: ' + JSON.stringify(headers));

    return rows.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    }).filter(function(row) {
      return row['ID'] && String(row['ID']).trim() !== '';
    });

  } catch (e) {
    Logger.log('❌ getMissions CSV error: ' + e.message);
    return [];
  }
}

/**
 * NEW: Get employees filtered by department — used for smart assignment in HTML
 * Returns employees with Statut = 'Actif' in the given department
 */
function getEmployeesByDeptForMission(departement) {
  try {
    var employees = getEmployees();
    return employees.filter(function(e) {
      var matchDept = !departement || String(e['Département']).trim() === String(departement).trim();
      var isActif   = e['Statut'] === 'Actif';
      return matchDept && isActif;
    });
  } catch (e) {
    Logger.log('❌ getEmployeesByDeptForMission error: ' + e.message);
    return [];
  }
}

/**
 * Add a new mission
 */
function addMission(data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_MISSIONS);
    if (!sheet) return { success: false, message: 'Feuille Missions introuvable.' };
    var id = generateId('MIS');

    var employeeDisplay = '';
    if (data.employeAffecteId) {
      var emp = getEmployeeById(data.employeAffecteId);
      employeeDisplay = emp ? (emp['Nom'] + ' ' + emp['Prénom']) : data.employeAffecteId;
    } else if (data.employeAffecte) {
      employeeDisplay = data.employeAffecte;
    }

    sheet.appendRow([
      id,
      data.titre        || '',
      data.description  || '',
      data.departement  || '',
      data.dateDebut    || '',
      data.dateFin      || '',
      data.statut       || 'Ouverte',
      Array.isArray(data.competencesRequises)
        ? data.competencesRequises.join(', ')
        : (data.competencesRequises || ''),
      data.priorite     || 'Normale',
      employeeDisplay
    ]);

    if (data.employeAffecteId) {
      var aSheet = ss.getSheetByName(CONFIG.SHEET_AFFECTATIONS);
      if (aSheet) {
        aSheet.appendRow([
          generateId('AFF'),
          id,
          data.employeAffecteId,
          new Date().toISOString().split('T')[0],
          0,
          'Actif'
        ]);
      }
    }

    return { success: true, id: id, message: 'Mission créée avec succès' };
  } catch (e) {
    Logger.log('❌ addMission error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Update a mission
 */
function updateMission(id, data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_MISSIONS);
    if (!sheet) return { success: false, message: 'Feuille Missions introuvable.' };
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        sheet.getRange(i + 1, 1, 1, 10).setValues([[
          id,
          data.titre           !== undefined ? data.titre           : rows[i][1],
          data.description     !== undefined ? data.description     : rows[i][2],
          data.departement     !== undefined ? data.departement     : rows[i][3],
          data.dateDebut       !== undefined ? data.dateDebut       : rows[i][4],
          data.dateFin         !== undefined ? data.dateFin         : rows[i][5],
          data.statut          !== undefined ? data.statut          : rows[i][6],
          Array.isArray(data.competencesRequises)
            ? data.competencesRequises.join(', ')
            : (data.competencesRequises !== undefined ? data.competencesRequises : rows[i][7]),
          data.priorite        !== undefined ? data.priorite        : rows[i][8],
          data.employeAffecte  !== undefined ? data.employeAffecte  : rows[i][9]
        ]]);
        return { success: true, message: 'Mission mise à jour' };
      }
    }
    return { success: false, message: 'Mission introuvable' };
  } catch (e) {
    Logger.log('❌ updateMission error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Delete a mission
 */
function deleteMission(id) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_MISSIONS);
    if (!sheet) return { success: false, message: 'Feuille Missions introuvable.' };
    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Mission supprimée' };
      }
    }
    return { success: false, message: 'Mission introuvable' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Assign an employee to a mission
 */
function assignEmployeeToMission(missionId, employeeId) {
  try {
    var ss = getSpreadsheet();
    var mSheet = ss.getSheetByName(CONFIG.SHEET_MISSIONS);
    if (!mSheet) return { success: false, message: 'Feuille Missions introuvable.' };
    var rows = mSheet.getDataRange().getValues();

    var employee = getEmployeeById(employeeId);
    var employeeName = employee
      ? (employee['Nom'] + ' ' + employee['Prénom'])
      : employeeId;

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(missionId)) {
        mSheet.getRange(i + 1, 10).setValue(employeeName);
        mSheet.getRange(i + 1, 7).setValue('En cours');

        var aSheet = ss.getSheetByName(CONFIG.SHEET_AFFECTATIONS);
        if (aSheet) {
          var score = recommendEmployeesForMission(missionId);
          var empScore = 0;
          if (score && score.recommendations) {
            var found = score.recommendations.find(function(r) { return r.id === employeeId; });
            if (found) empScore = found.score;
          }
          aSheet.appendRow([
            generateId('AFF'),
            missionId,
            employeeId,
            new Date().toISOString().split('T')[0],
            empScore,
            'Actif'
          ]);
        }

        return { success: true, message: 'Employé "' + employeeName + '" affecté à la mission' };
      }
    }
    return { success: false, message: 'Mission introuvable' };
  } catch (e) {
    Logger.log('❌ assignEmployeeToMission error: ' + e.message);
    return { success: false, message: e.message };
  }
}
