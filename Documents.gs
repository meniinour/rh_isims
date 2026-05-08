/**
 * ============================================================
 *  DOCUMENTS MODULE
 *  Drive folder scanning → DOCX → Google Doc → text extraction
 *  FIX I: Drive Advanced Service properly used
 *  BONUS: Duplicate prevention by email + CIN, error logs
 * ============================================================
 */

/**
 * MAIN: Process all .docx files in the "rhdoc" Drive folder
 * Requires Drive Advanced Service (enabled in appsscript.json)
 */
function processAllFiles() {
  try {
    Logger.log('📂 Starting document processing in folder: ' + CONFIG.DRIVE_DOCS_FOLDER_ID);
    var folder = DriveApp.getFolderById(CONFIG.DRIVE_DOCS_FOLDER_ID);
    var fileIterator = folder.getFiles();
    var results = [];
    var processedCount = 0;
    var errorCount = 0;

    while (fileIterator.hasNext()) {
      var file = fileIterator.next();
      var mime = file.getMimeType();
      var name = file.getName().toLowerCase();

      // Process .docx, Google Docs, and Word documents
      if (name.endsWith('.docx') ||
          name.endsWith('.doc') ||
          mime === MimeType.GOOGLE_DOCS ||
          mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mime === 'application/msword') {
        Logger.log('📄 Processing: ' + file.getName());
        var result = processSingleFile(file);
        results.push(result);
        if (result.success) processedCount++;
        else errorCount++;
      } else {
        Logger.log('⏭️ Skipping (unsupported type): ' + file.getName() + ' [' + mime + ']');
      }
    }

    Logger.log('✅ Done. Processed: ' + processedCount + ' | Errors: ' + errorCount);
    return { success: true, count: processedCount, errors: errorCount, results: results };
  } catch (e) {
    Logger.log('❌ processAllFiles error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Process a single file: convert → extract → store → create employee
 */
function processSingleFile(file) {
  var fileName = file.getName();
  try {
    var googleDoc = convertDocxToGoogleDoc(file);
    var rawText   = extractTextFromDoc(googleDoc);
    var data      = extractStructuredData(rawText, fileName);
    storeDocumentData(data);

    Logger.log('  ✅ ' + fileName + ' → Name: ' + data.name + ' | Email: ' + data.email);
    return { file: fileName, success: true, data: data };
  } catch (e) {
    Logger.log('  ❌ ' + fileName + ': ' + e.message);
    storeDocumentData({ fileName: fileName, error: e.message, status: 'Erreur' });
    return { file: fileName, success: false, error: e.message };
  }
}

/**
 * Convert a Word file (.docx) to Google Docs format
 * FIX I: Uses Drive Advanced Service (Drive.Files.insert)
 *         with proper error message if not enabled.
 */
function convertDocxToGoogleDoc(file) {
  // Already a Google Doc — open directly
  if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
    return DocumentApp.openById(file.getId());
  }

  // FIX I: Use Drive Advanced Service for conversion
  // This requires "Drive API" to be added in Services.
  try {
    var blob = file.getBlob();
    var resource = {
      title   : file.getName().replace(/\.(docx?|doc)$/i, '') + ' (Converti)',
      mimeType: MimeType.GOOGLE_DOCS,
      parents : [{ id: CONFIG.DRIVE_DOCS_FOLDER_ID }]
    };

    // Drive.Files.insert with convert:true converts the blob to Google Docs
    var converted = Drive.Files.insert(resource, blob, { convert: true });
    Logger.log('  🔄 Converted: ' + file.getName() + ' → Doc ID: ' + converted.id);
    return DocumentApp.openById(converted.id);
  } catch (e) {
    // Provide a clear error if the Drive Advanced Service is not enabled
    if (e.message && (e.message.indexOf('Drive') !== -1 || e.message.indexOf('not defined') !== -1)) {
      throw new Error(
        '❌ Drive Advanced Service non activé. ' +
        'Dans l\'éditeur Apps Script : Éditeur > + Ajouter un service > Drive API. ' +
        'Erreur originale: ' + e.message
      );
    }
    throw e;
  }
}

/**
 * Extract full text from a Google Doc
 */
function extractTextFromDoc(doc) {
  return doc.getBody().getText();
}

/**
 * Extract structured fields from raw CV text
 */
function extractStructuredData(text, fileName) {
  // ── Name ─────────────────────────────────────────────────────
  var name = '';
  var namePatterns = [
    /(?:nom\s*(?:complet)?|name|candidat)\s*[:\-]\s*([A-ZÀ-Ÿa-zà-ÿ][\w\s'\-]{2,40})/i,
    /^([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+){1,3})\s*$/m
  ];
  namePatterns.some(function(re) {
    var m = text.match(re);
    if (m) { name = m[1].trim(); return true; }
    return false;
  });

  // ── Email ─────────────────────────────────────────────────────
  var emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  var email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // ── Phone ─────────────────────────────────────────────────────
  var phoneMatch = text.match(/(?:\+?[\d\s\-\(\)]{8,16})/);
  var phone = phoneMatch ? phoneMatch[0].trim() : '';

  // ── Skills ────────────────────────────────────────────────────
  var skills = [];
  var skillSectionMatch = text.match(
    /(?:comp[eé]tences?|skills?|technologies?|outils?|expertise)[^\n]*\n([\s\S]{10,600}?)(?:\n[A-ZÀ-Ÿ]{3,}|\n\n|$)/i
  );
  if (skillSectionMatch) {
    var skillBlock = skillSectionMatch[1];
    skills = skillBlock
      .split(/[\n,;•\-–\|\/]/)
      .map(function(s) { return s.trim(); })
      .filter(function(s) { return s.length > 1 && s.length < 60; })
      .slice(0, 20);
  }

  // ── CIN ───────────────────────────────────────────────────────
  var cinMatch = text.match(/(?:CIN|Carte d['']identité|ID national)\s*[:\-]?\s*(\d{8})/i);
  var cin = cinMatch ? cinMatch[1] : null;
  // Only generate a random CIN if none found (will be flagged as auto-generated)
  var cinAutoGenerated = !cinMatch;
  if (!cin) {
    cin = '0' + Math.floor(Math.random() * 9000000 + 1000000); // Random 8-digit starting with 0
  }

  // ── Poste ─────────────────────────────────────────────────────
  var posteMatch = text.match(/(?:Poste|Titre|Profil|Fonction)\s*[:\-]?\s*([A-Za-zÀ-ÿ\s]{4,40})/i);
  var poste = posteMatch ? posteMatch[1].trim() : 'Consultant';

  // ── Department guess from keywords ───────────────────────────
  var dept = '';
  var deptMap = {
    'informatique'       : 'IT',
    'développement'      : 'IT',
    'it'                 : 'IT',
    'software'           : 'IT',
    'finance'            : 'Finance',
    'comptabilité'       : 'Finance',
    'rh'                 : 'Ressources Humaines',
    'ressources humaines': 'Ressources Humaines',
    'marketing'          : 'Marketing',
    'ventes'             : 'Commercial',
    'commercial'         : 'Commercial',
    'logistique'         : 'Logistique',
    'ingénierie'         : 'Ingénierie'
  };
  var lText = text.toLowerCase();
  Object.keys(deptMap).some(function(k) {
    if (lText.indexOf(k) !== -1) { dept = deptMap[k]; return true; }
    return false;
  });

  return {
    fileName       : fileName,
    name           : name,
    email          : email,
    phone          : phone,
    skills         : skills,
    department     : dept || 'RH (Candidature)',
    cin            : cin,
    cinAutoGenerated: cinAutoGenerated,
    poste          : poste,
    status         : 'Traité',
    processedAt    : new Date().toISOString().split('T')[0]
  };
}

/**
 * Store extracted document data into Documents sheet
 * BONUS: Skip duplicate employees (check by email AND cin)
 */
function storeDocumentData(data) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_DOCUMENTS);
  if (!sheet) return null;
  var id    = generateId('DOC');

  sheet.appendRow([
    id,
    data.fileName    || '',
    data.name        || '',
    data.email       || '',
    data.phone       || '',
    Array.isArray(data.skills) ? data.skills.join(', ') : '',
    data.processedAt || new Date().toISOString().split('T')[0],
    data.status      || (data.error ? 'Erreur' : 'Traité')
  ]);

  // Auto-create employee if we have enough info
  if (data.name && data.email && !data.error) {
    var employees = getEmployees();

    // BONUS: Check duplicate by email
    var existsByEmail = employees.some(function(e) {
      return String(e['Email']).toLowerCase() === String(data.email).toLowerCase();
    });

    // BONUS: Check duplicate by CIN (only if not auto-generated)
    var existsByCin = !data.cinAutoGenerated && employees.some(function(e) {
      return String(e['CIN']).trim() === String(data.cin).trim();
    });

    if (existsByEmail) {
      Logger.log('  ⏭️ Skipping employee creation (email exists): ' + data.email);
    } else if (existsByCin) {
      Logger.log('  ⏭️ Skipping employee creation (CIN exists): ' + data.cin);
    } else {
      var nameParts = data.name.split(' ');
      var nom    = nameParts.slice(0, -1).join(' ') || data.name;
      var prenom = nameParts.slice(-1)[0] || '';

      var result = addEmployee({
        nom        : nom,
        prenom     : prenom,
        email      : data.email,
        telephone  : data.phone,
        departement: data.department || 'RH (Candidature)',
        poste      : data.poste || 'Candidat Auto',
        competences: Array.isArray(data.skills) ? data.skills : [],
        statut     : 'Candidat',
        cin        : data.cin,
        password   : 'candidate123'
      });
      Logger.log('  👤 Employee created: ' + data.name + ' → ' + (result.success ? result.id : result.message));
    }
  }
  return id;
}

/**
 * Get all processed documents
 */
function getDocuments() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_DOCUMENTS);
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
    Logger.log('❌ getDocuments error: ' + e.message);
    return [];
  }
}

/**
 * Trigger document processing from the web app
 */
function triggerDocumentProcessing() {
  return processAllFiles();
}

/**
 * Upload a justificatif (image/pdf) to Drive
 */
function uploadJustificatif(fileData, fileName, mimeType) {
  try {
    var folders = DriveApp.getFoldersByName(CONFIG.DRIVE_JUSTIFICATIFS_FOLDER);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(CONFIG.DRIVE_JUSTIFICATIFS_FOLDER);
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (e) {
    Logger.log('❌ uploadJustificatif error: ' + e.message);
    return { success: false, message: e.message };
  }
}
