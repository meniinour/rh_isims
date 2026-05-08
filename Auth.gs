/**
 * ============================================================
 *  AUTH MODULE
 *  CIN-based login for employees, credentials for admin
 *  Session tokens via PropertiesService
 * ============================================================
 */

var ADMIN_CIN      = 'ADMIN';
var ADMIN_PASSWORD = 'admin2025';   // Change after first deploy!
var SESSION_DURATION_MS = 2 * 60 * 60 * 1000;  // 2 hours

// ── Setup Users sheet ─────────────────────────────────────────
function setupUsersSheet(ss) {
  var sheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
  sheet.clearContents();
  var headers = ['CIN','PasswordHash','EmployeeID','Role','Nom','Prénom','LastLogin'];
  sheet.getRange(1,1,1,headers.length).setValues([headers])
    .setBackground('#1a1a2e').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Insert default admin row
  sheet.appendRow([ADMIN_CIN, hashPassword(ADMIN_PASSWORD), 'ADMIN-001', 'admin', 'Admin', 'Système', '']);
  return sheet;
}

// ── Simple deterministic hash (GAS-compatible) ─────────────────
function hashPassword(password) {
  var hash = 0;
  var str = password + 'RH_SALT_2025';
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'H' + Math.abs(hash).toString(16).toUpperCase();
}

// ── Register employee credentials ─────────────────────────────
function registerEmployeeCredentials(cin, password, employeeId) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users') || setupUsersSheet(ss);
    var rows = sheet.getDataRange().getValues();

    // Check if CIN already exists
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(cin)) {
        return { success: false, message: 'Ce CIN est déjà enregistré' };
      }
    }

    var employee = getEmployeeById(employeeId);
    var nom    = employee ? employee['Nom']    : '';
    var prenom = employee ? employee['Prénom'] : '';

    sheet.appendRow([
      String(cin),
      hashPassword(password),
      employeeId,
      'employee',
      nom,
      prenom,
      ''
    ]);

    return { success: true, message: 'Compte créé avec succès' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── Login ─────────────────────────────────────────────
function login(cin, password, role) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users') || setupUsersSheet(ss);
    var rows = sheet.getDataRange().getValues();
    var hashed = hashPassword(password);

    // ── Check registered users first ────────────────────────
    for (var i = 1; i < rows.length; i++) {
      var rowCin  = String(rows[i][0]);
      var rowHash = String(rows[i][1]);
      var rowRole = String(rows[i][3]);

      if (rowCin === String(cin) && rowHash === hashed) {
        if (role && rowRole !== role) {
          return { success: false, message: 'Rôle incorrect pour ce compte' };
        }
        var token = generateSessionToken(rowCin, rowRole);
        sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
        return {
          success   : true,
          token     : token,
          role      : rowRole,
          employeeId: rows[i][2],
          nom       : rows[i][4],
          prenom    : rows[i][5],
          cin       : rowCin,
          firstLogin: false
        };
      }
    }

    // ── Auto-login fallback: CIN = default password ─────────────
    // If employee exists in Employees sheet with this CIN
    // and password matches CIN (default) → auto-register & log in
    if (!role || role === 'employee') {
      var hashedCin = hashPassword(String(cin)); // CIN is the default password
      if (hashed === hashedCin) {
        // Check if employee exists with this CIN
        var employees = getEmployees();
        var emp = employees.find(function(e) {
          return String(e['CIN']).trim() === String(cin).trim();
        });
        if (emp) {
          // Check CIN not already registered (wrong password case above handled)
          var alreadyExists = rows.slice(1).some(function(r) { return String(r[0]) === String(cin); });
          if (!alreadyExists) {
            // Auto-register with CIN = password
            sheet.appendRow([
              String(cin),
              hashedCin,
              emp['ID'],
              'employee',
              emp['Nom'],
              emp['Prénom'],
              new Date().toISOString()
            ]);
          }
          var token = generateSessionToken(String(cin), 'employee');
          return {
            success   : true,
            token     : token,
            role      : 'employee',
            employeeId: emp['ID'],
            nom       : emp['Nom'],
            prenom    : emp['Prénom'],
            cin       : String(cin),
            firstLogin: true  // Flag: using default CIN password
          };
        }
      }
    }

    return { success: false, message: 'CIN ou mot de passe incorrect' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── Session token ─────────────────────────────────────────────
function generateSessionToken(cin, role) {
  var token = 'TK-' + Math.random().toString(36).substr(2,16).toUpperCase() + '-' + Date.now();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SESSION_' + token, JSON.stringify({
    cin      : cin,
    role     : role,
    expires  : Date.now() + SESSION_DURATION_MS
  }));
  return token;
}

// ── Validate session ──────────────────────────────────────────
function validateSession(token) {
  if (!token) return { valid: false };
  try {
    var props = PropertiesService.getScriptProperties();
    var raw   = props.getProperty('SESSION_' + token);
    if (!raw) return { valid: false };
    var session = JSON.parse(raw);
    if (Date.now() > session.expires) {
      props.deleteProperty('SESSION_' + token);
      return { valid: false, message: 'Session expirée' };
    }
    return { valid: true, cin: session.cin, role: session.role };
  } catch (e) {
    return { valid: false };
  }
}

// ── Logout ────────────────────────────────────────────────────
function logout(token) {
  try {
    PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// ── Get employee by CIN ───────────────────────────────────────
function getEmployeeByCIN(cin) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) return null;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(cin)) {
        var empId = rows[i][2];
        var emp   = getEmployeeById(empId);
        return emp;
      }
    }
    return null;
  } catch (e) { return null; }
}

// ── Get all registered users (admin view) ─────────────────────
function getAllUsers() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users') || setupUsersSheet(ss);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var headers = data[0];
    return data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      delete obj['PasswordHash'];  // Never send passwords to client
      return obj;
    });
  } catch (e) { return []; }
}

// ── Change password ───────────────────────────────────────────
function changePassword(cin, oldPassword, newPassword) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: 'Système non initialisé' };
    var rows = sheet.getDataRange().getValues();
    var oldHash = hashPassword(oldPassword);
    var newHash = hashPassword(newPassword);

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(cin) && rows[i][1] === oldHash) {
        sheet.getRange(i + 1, 2).setValue(newHash);
        return { success: true, message: 'Mot de passe modifié' };
      }
    }
    return { success: false, message: 'Ancien mot de passe incorrect' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── Init including Users sheet ────────────────────────────────
function initializeAppFull() {
  var result = initializeApp();
  var ss = getSpreadsheet();
  setupUsersSheet(ss);
  Logger.log('✅ Auth module initialized. Admin CIN: ' + ADMIN_CIN + ' / Password: ' + ADMIN_PASSWORD);
  return result;
}
