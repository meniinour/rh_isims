/**
 * ============================================================
 *  EMPLOYEES MODULE
 *  CRUD operations for employee records
 *  FIXES: CIN validation, addEmployee statut, approveEmployee
 * ============================================================
 */

/**
 * Get all employees
 */
/**
 * Get all employees - Version corrigée et robuste
 */
/**
 * Get all employees - via CSV export depuis le sheet externe
 * Même méthode que importPostesFromExternalSheet()
 */
function getEmployees() {
  try {
    var EXTERNAL_EMPLOYEES_SHEET_ID = '1mRgdd4dYeVjgrPn_V7abKuuU_OMsU5Hh60y3TmJjx1I';
    var url = 'https://docs.google.com/spreadsheets/d/' + EXTERNAL_EMPLOYEES_SHEET_ID + '/export?format=csv&sheet=Employees';

    var response = UrlFetchApp.fetch(url);
    var csvContent = response.getContentText();
    var rows = Utilities.parseCsv(csvContent);

    if (rows.length <= 1) {
      Logger.log('⚠️ Sheet externe vide');
      return [];
    }

    var headers = rows[0]; // première ligne = entêtes
    Logger.log('📋 Headers CSV: ' + JSON.stringify(headers));

    return rows.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    }).filter(function(row) {
      // Ignorer les lignes vides (pas d'ID)
      return row['ID'] && String(row['ID']).trim() !== '';
    });

  } catch (e) {
    Logger.log('❌ getEmployees (CSV) error: ' + e.message);
    return [];
  }
}
// Debug function — call from frontend to diagnose empty list
function debugSheets() {
  try {
    var SHEET_ID = '1mRgdd4dYeVjgrPn_V7abKuuU_OMsU5Hh60y3TmJjx1I';
    var ss = SpreadsheetApp.openById(SHEET_ID);
    return {
      ok: true,
      name: ss.getName(),
      sheets: ss.getSheets().map(function(s) {
        var firstRow = s.getLastRow() > 0 ? s.getRange(1,1,1, Math.min(s.getLastColumn(),5)).getValues()[0] : [];
        return { name: s.getName(), rows: s.getLastRow(), headers: firstRow };
      })
    };
  } catch(e) { return { ok: false, error: e.message }; }
}


/**
 * Get a single employee by ID
 */
function getEmployeeById(id) {
  var employees = getEmployees();
  return employees.find(function(e) { return e['ID'] === id; }) || null;
}

/**
 * Add a new employee
 * FIX A+C+E: CIN validation regex, uniqueness check, statut defaults to 'En attente' (admin approval required)
 */
function addEmployee(data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_EMPLOYEES);
    if (!sheet) return { success: false, message: 'Feuille Employees introuvable.' };

    // ── CIN Validation ────────────────────────────────────────
    var cinStr = String(data.cin || '').trim();
    if (!/^\d{8}$/.test(cinStr)) {
      return { success: false, message: 'Le CIN doit comporter exactement 8 chiffres numériques.' };
    }

    // ── CIN Uniqueness ────────────────────────────────────────
    var employees = getEmployees();
    var cinExists = employees.some(function(e) {
      return String(e['CIN']).trim() === cinStr;
    });
    if (cinExists) {
      return { success: false, message: 'Ce numéro CIN (' + cinStr + ') existe déjà dans la base de données.' };
    }

    // ── Email Uniqueness (optional but recommended) ──────────
    if (data.email) {
      var emailExists = employees.some(function(e) {
        return String(e['Email']).toLowerCase().trim() === String(data.email).toLowerCase().trim();
      });
      if (emailExists) {
        return { success: false, message: 'Cet email existe déjà dans la base de données.' };
      }
    }

    var id = generateId('EMP');
    // FIX E: statut par défaut = 'En attente' pour validation Admin
    var statut = data.statut || 'En attente';

    sheet.appendRow([
      id,
      data.nom        || '',
      data.prenom     || '',
      data.email      || '',
      data.telephone  || '',
      data.departement|| '',
      data.poste      || '',
      data.dateEmbauche || new Date().toISOString().split('T')[0],
      statut,
      Array.isArray(data.competences) ? data.competences.join(', ') : (data.competences || ''),
      data.salaire    || 0,
      cinStr
    ]);

    // Automatically create user account if CIN and password are provided
    if (data.cin && data.password) {
      var authRes = registerEmployeeCredentials(cinStr, data.password, id);
      if (!authRes.success) {
        return { success: true, id: id, message: 'Employé ajouté (statut: En attente), mais erreur création compte: ' + authRes.message };
      }
    }

    return { success: true, id: id, message: 'Employé ajouté avec succès. Statut: En attente de validation Admin.' };
  } catch (e) {
    Logger.log('❌ addEmployee error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * FIX E: Approve or reject an employee (Admin validation)
 * @param {string} id - Employee ID
 * @param {string} decision - 'Actif' | 'Refusé'
 */
function approveEmployee(id, decision) {
  try {
    if (decision !== 'Actif' && decision !== 'Refusé') {
      return { success: false, message: 'Décision invalide. Utiliser "Actif" ou "Refusé".' };
    }
    return updateEmployee(id, { statut: decision });
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Update an employee row
 */
function updateEmployee(id, data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_EMPLOYEES);
    if (!sheet) return { success: false, message: 'Feuille Employees introuvable.' };
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        sheet.getRange(i + 1, 1, 1, 12).setValues([[
          id,
          data.nom        !== undefined ? data.nom        : rows[i][1],
          data.prenom     !== undefined ? data.prenom     : rows[i][2],
          data.email      !== undefined ? data.email      : rows[i][3],
          data.telephone  !== undefined ? data.telephone  : rows[i][4],
          data.departement!== undefined ? data.departement: rows[i][5],
          data.poste      !== undefined ? data.poste      : rows[i][6],
          data.dateEmbauche!== undefined? data.dateEmbauche:rows[i][7],
          data.statut     !== undefined ? data.statut     : rows[i][8],
          Array.isArray(data.competences) ? data.competences.join(', ')
            : (data.competences !== undefined ? data.competences : rows[i][9]),
          data.salaire    !== undefined ? data.salaire    : rows[i][10],
          data.cin        !== undefined ? data.cin        : rows[i][11]
        ]]);
        return { success: true, message: 'Employé mis à jour' };
      }
    }
    return { success: false, message: 'Employé introuvable (ID: ' + id + ')' };
  } catch (e) {
    Logger.log('❌ updateEmployee error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Delete an employee by ID
 */
function deleteEmployee(id) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_EMPLOYEES);
    if (!sheet) return { success: false, message: 'Feuille Employees introuvable.' };
    var rows = sheet.getDataRange().getValues();

    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Employé supprimé' };
      }
    }
    return { success: false, message: 'Employé introuvable' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get employees by department
 */
function getEmployeesByDepartment() {
  var employees = getEmployees();
  var deptMap = {};
  employees.forEach(function(emp) {
    var dept = emp['Département'] || 'Non défini';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  return deptMap;
}

/**
 * Get dashboard stats
 * FIX H: Added null checks + consistent sheet access
 */
function getDashboardStats() {
  try {
    var employees  = getEmployees();
    var missions   = getMissions();
    var absences   = getAbsences();

    var activeEmp    = employees.filter(function(e) { return e['Statut'] === 'Actif'; }).length;
    var pendingEmp   = employees.filter(function(e) { return e['Statut'] === 'En attente'; }).length;
    var openMissions = missions.filter(function(m) {
      return m['Statut'] === 'En cours' || m['Statut'] === 'Ouverte';
    }).length;
    var pendingAbs   = absences.filter(function(a) { return a['Statut'] === 'En attente'; }).length;

    var deptBreakdown = getEmployeesByDepartment();

    var absenceTypes = {};
    absences.forEach(function(a) {
      var t = a['Type'] || 'Autre';
      absenceTypes[t] = (absenceTypes[t] || 0) + 1;
    });

    return {
      totalEmployees  : employees.length,
      activeEmployees : activeEmp,
      pendingEmployees: pendingEmp,
      totalMissions   : missions.length,
      openMissions    : openMissions,
      totalAbsences   : absences.length,
      pendingAbsences : pendingAbs,
      deptBreakdown   : deptBreakdown,
      absenceTypes    : absenceTypes
    };
  } catch (e) {
    Logger.log('❌ getDashboardStats error: ' + e.message);
    return {
      totalEmployees: 0, activeEmployees: 0, pendingEmployees: 0,
      totalMissions: 0, openMissions: 0,
      totalAbsences: 0, pendingAbsences: 0,
      deptBreakdown: {}, absenceTypes: {}
    };
  }
}
