/**
 * ============================================================
 *  POSTES MODULE v3.0
 *  Management of job positions (fiches de poste)
 *  NEW: Dual-write to external catalogue sheet (18IKELEQ...)
 *       Upsert import, writePosteToExternalSheet
 * ============================================================
 */

var EXTERNAL_POSTES_SHEET_ID = '18IKELEQ_lqw7PYyhg95xlSKxz8JMIxOZvwvlEcqVAMA';

/**
 * Write or update a poste in the external catalogue Google Sheet.
 * Finds the row by Titre (column C = index 2), updates if found, appends if not.
 * External sheet columns: N°, Direction, Titre, Rel.Fonct, Rel.Ext, Supérieur, Remplaçant, Tâches, Formation, Expérience, Compétences
 */
function writePosteToExternalSheet(data) {
  try {
    var ss = SpreadsheetApp.openById(EXTERNAL_POSTES_SHEET_ID);
    var sheets = ss.getSheets();
    var sheet = sheets[0]; // Use first sheet of catalogue

    var values = sheet.getDataRange().getValues();
    var headerRowIdx = -1;
    // Find header row (contains 'N°' or 'Titre')
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (row[0] === 'N°' || String(row[2]).toLowerCase() === 'titre') {
        headerRowIdx = i;
        break;
      }
    }
    var dataStartRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;

    // Look for existing row with same Titre (col index 2)
    var existingRowIdx = -1;
    for (var j = dataStartRow; j < values.length; j++) {
      if (values[j][2] && String(values[j][2]).toLowerCase().trim() === String(data.titre || '').toLowerCase().trim()) {
        existingRowIdx = j + 1; // 1-indexed sheet row
        break;
      }
    }

    var rowData = [
      existingRowIdx > 0 ? values[existingRowIdx - 1][0] : (sheet.getLastRow() - dataStartRow + 1), // N°
      data.categorie        || '',
      data.titre            || '',
      data.relationsFonct   || '',
      data.relationsExt     || '',
      data.superieur        || '',
      data.remplacant       || '',
      data.taches           || '',
      data.formation        || '',
      data.experience       || '',
      Array.isArray(data.competencesRequises)
        ? data.competencesRequises.join(', ')
        : (data.competencesRequises || '')
    ];

    if (existingRowIdx > 0) {
      sheet.getRange(existingRowIdx, 1, 1, rowData.length).setValues([rowData]);
      Logger.log('✅ Poste mis à jour dans le sheet externe: ' + data.titre);
    } else {
      sheet.appendRow(rowData);
      Logger.log('✅ Poste ajouté dans le sheet externe: ' + data.titre);
    }
    return { success: true };
  } catch (e) {
    Logger.log('⚠️ writePosteToExternalSheet error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Get all job positions
 */
function getPostes() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_POSTES);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var headers = data[0];
    return data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
  } catch (e) {
    Logger.log('❌ getPostes error: ' + e.message);
    return [];
  }
}

/**
 * Add a new job position
 * NEW: includes competencesRequises field
 */
function addPoste(data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_POSTES);
    if (!sheet) return { success: false, message: 'Feuille Postes introuvable.' };
    var id = generateId('PST');

    sheet.appendRow([
      id,
      data.categorie           || '',
      data.titre               || '',
      data.relationsFonct      || '',
      data.relationsExt        || '',
      data.superieur           || '',
      data.remplacant          || '',
      data.taches              || '',
      data.formation           || '',
      data.experience          || '',
      Array.isArray(data.competencesRequises)
        ? data.competencesRequises.join(', ')
        : (data.competencesRequises || '')
    ]);

    // Sync to external catalogue sheet
    writePosteToExternalSheet(data);

    return { success: true, id: id, message: 'Poste créé avec succès' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Update an existing poste
 */
function updatePoste(id, data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_POSTES);
    if (!sheet) return { success: false, message: 'Feuille Postes introuvable.' };
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        var updatedData = {
          categorie        : data.categorie        !== undefined ? data.categorie        : rows[i][1],
          titre            : data.titre            !== undefined ? data.titre            : rows[i][2],
          relationsFonct   : data.relationsFonct   !== undefined ? data.relationsFonct   : rows[i][3],
          relationsExt     : data.relationsExt     !== undefined ? data.relationsExt     : rows[i][4],
          superieur        : data.superieur        !== undefined ? data.superieur        : rows[i][5],
          remplacant       : data.remplacant       !== undefined ? data.remplacant       : rows[i][6],
          taches           : data.taches           !== undefined ? data.taches           : rows[i][7],
          formation        : data.formation        !== undefined ? data.formation        : rows[i][8],
          experience       : data.experience       !== undefined ? data.experience       : rows[i][9],
          competencesRequises: Array.isArray(data.competencesRequises)
            ? data.competencesRequises.join(', ')
            : (data.competencesRequises !== undefined ? data.competencesRequises : rows[i][10])
        };
        sheet.getRange(i + 1, 1, 1, 11).setValues([[
          id,
          updatedData.categorie, updatedData.titre, updatedData.relationsFonct,
          updatedData.relationsExt, updatedData.superieur, updatedData.remplacant,
          updatedData.taches, updatedData.formation, updatedData.experience,
          updatedData.competencesRequises
        ]]);
        // Sync to external catalogue sheet
        writePosteToExternalSheet(updatedData);
        return { success: true, message: 'Poste mis à jour' };
      }
    }
    return { success: false, message: 'Poste introuvable' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get a single poste by ID
 */
function getPosteById(id) {
  return getPostes().find(function(p) { return String(p['ID']) === String(id); }) || null;
}

/**
 * Get a poste by its titre (title)
 * Used by the recommendation engine to resolve employee's poste
 */
function getPosteByTitle(titre) {
  if (!titre) return null;
  var titlLow = String(titre).toLowerCase().trim();
  return getPostes().find(function(p) {
    return String(p['Titre']).toLowerCase().trim() === titlLow;
  }) || null;
}

/**
 * Match an employee's skills against the required skills of their poste
 * @param {string} employeeId
 * @returns {object} { score, matchedSkills, missingSkills, posteTitle, posteSkills }
 */
function matchEmployeeToPoste(employeeId) {
  try {
    var employee = getEmployeeById(employeeId);
    if (!employee) return { success: false, message: 'Employé introuvable' };

    var posteTitle = employee['Poste'] || '';
    var poste = getPosteByTitle(posteTitle);

    var empSkills    = parseSkills(employee['Compétences'] || '');
    var posteSkills  = poste ? parseSkills(poste['Compétences Requises'] || '') : [];

    if (!posteSkills.length) {
      return {
        success       : true,
        employeeId    : employeeId,
        employeeName  : employee['Nom'] + ' ' + employee['Prénom'],
        posteTitle    : posteTitle,
        posteSkills   : [],
        matchedSkills : [],
        missingSkills : [],
        score         : 100, // No requirements = perfect match
        message       : 'Aucune compétence requise définie pour ce poste.'
      };
    }

    var matchedSkills = [];
    var partialSkills = [];
    var missingSkills = [];

    posteSkills.forEach(function(ps) {
      var psLow = ps.toLowerCase();
      var exact = empSkills.some(function(es) { return es.toLowerCase() === psLow; });
      var partial = !exact && empSkills.some(function(es) {
        var esLow = es.toLowerCase();
        return esLow.indexOf(psLow) !== -1 || psLow.indexOf(esLow) !== -1;
      });
      if (exact)        matchedSkills.push(ps);
      else if (partial) partialSkills.push(ps);
      else              missingSkills.push(ps);
    });

    var score = Math.round(
      ((matchedSkills.length + partialSkills.length * 0.5) / posteSkills.length) * 100
    );

    return {
      success       : true,
      employeeId    : employeeId,
      employeeName  : employee['Nom'] + ' ' + employee['Prénom'],
      posteTitle    : posteTitle,
      posteSkills   : posteSkills,
      matchedSkills : matchedSkills,
      partialSkills : partialSkills,
      missingSkills : missingSkills,
      score         : score
    };
  } catch (e) {
    Logger.log('❌ matchEmployeeToPoste error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Delete a poste
 */
function deletePoste(id) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_POSTES);
    if (!sheet) return { success: false, message: 'Feuille Postes introuvable.' };
    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Poste supprimé' };
      }
    }
    return { success: false, message: 'Poste introuvable' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Import from external public sheet (CSV export)
 */
function importPostesFromExternalSheet() {
  var url = "https://docs.google.com/spreadsheets/d/18IKELEQ_lqw7PYyhg95xlSKxz8JMIxOZvwvlEcqVAMA/export?format=csv";
  try {
    var response = UrlFetchApp.fetch(url);
    var csvContent = response.getContentText();
    return importPostesFromCSV(csvContent);
  } catch (e) {
    return { success: false, message: 'Erreur fetch: ' + e.message };
  }
}

/**
 * Import positions from CSV with UPSERT logic (update if titre exists, insert if not)
 */
function importPostesFromCSV(csvString) {
  try {
    var rows = Utilities.parseCsv(csvString);
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_POSTES);

    // Find header row in CSV
    var startIndex = 0;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === 'N°' || rows[i][0] === 'N' || String(rows[i][2]).toLowerCase() === 'titre') {
        startIndex = i + 1;
        break;
      }
    }

    // Build a map of existing postes by titre (lowercase) → sheet row index (1-based)
    var existingRows = sheet.getDataRange().getValues();
    var existingByTitle = {};
    for (var r = 1; r < existingRows.length; r++) {
      var title = String(existingRows[r][2]).toLowerCase().trim();
      if (title) existingByTitle[title] = r + 1; // 1-based sheet row
    }

    var inserted = 0, updated = 0;
    var newBatch = [];

    for (var j = startIndex; j < rows.length; j++) {
      var row = rows[j];
      if (!row[2] || !row[2].trim()) continue;

      var titre = row[2].trim();
      var rowValues = [
        existingByTitle[titre.toLowerCase()] ? existingRows[existingByTitle[titre.toLowerCase()] - 1][0] : generateId('PST'),
        row[1] || '',  // Catégorie
        titre,
        row[3] || '',  // Relations Fonct
        row[4] || '',  // Relations Ext
        row[5] || '',  // Supérieur
        row[6] || '',  // Remplaçant
        row[7] || '',  // Tâches
        row[8] || '',  // Formation
        row[9] || '',  // Expérience
        row[10] || '' // Compétences
      ];

      if (existingByTitle[titre.toLowerCase()]) {
        // UPDATE existing row
        sheet.getRange(existingByTitle[titre.toLowerCase()], 1, 1, 11).setValues([rowValues]);
        updated++;
      } else {
        // INSERT new row
        newBatch.push(rowValues);
        inserted++;
      }
    }

    if (newBatch.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newBatch.length, 11).setValues(newBatch);
    }

    return { success: true, message: inserted + ' postes ajoutés, ' + updated + ' mis à jour' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
