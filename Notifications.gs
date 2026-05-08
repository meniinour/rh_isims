/**
 * ============================================================
 *  NOTIFICATIONS MODULE
 *  In-app notification system (no email)
 *  Sheet: Notifications
 *  Columns: ID | DestType | DestCIN | Message | Type | Lu | Date | ActionURL
 * ============================================================
 */

var NOTIF_SHEET = 'Notifications';

/**
 * Setup the Notifications sheet with headers
 */
function setupNotificationsSheet(ss) {
  var sheet = ss.getSheetByName(NOTIF_SHEET) || ss.insertSheet(NOTIF_SHEET);
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell || firstCell === '') {
    var headers = ['ID','DestType','DestCIN','Message','Type','Lu','Date','ActionURL'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#1a1a2e').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(4, 300);
  }
  return sheet;
}

/**
 * Create a notification
 * @param {string} destType  - 'admin' | 'employee'
 * @param {string} destCIN   - CIN of the recipient (use 'ADMIN' for admin)
 * @param {string} message   - Notification text
 * @param {string} type      - 'info' | 'success' | 'warning' | 'danger'
 * @param {string} actionURL - Optional page to navigate to (e.g. 'absences')
 */
function createNotification(destType, destCIN, message, type, actionURL) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(NOTIF_SHEET) || setupNotificationsSheet(ss);
    var id = generateId('NOTIF');
    sheet.appendRow([
      id,
      destType    || 'admin',
      String(destCIN || 'ADMIN'),
      message     || '',
      type        || 'info',
      'non',
      new Date().toISOString(),
      actionURL   || ''
    ]);
    return { success: true, id: id };
  } catch (e) {
    Logger.log('❌ createNotification error: ' + e.message);
    return { success: false };
  }
}

/**
 * Get notifications for the current user (admin or employee)
 * Returns last 20, most recent first
 */
function getMyNotifications(cin, role) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(NOTIF_SHEET);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var headers = data[0];

    var notifs = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });

    return notifs.filter(function(n) {
      if (role === 'admin') {
        return String(n['DestType']) === 'admin';
      } else {
        return String(n['DestType']) === 'employee' &&
               String(n['DestCIN'])  === String(cin);
      }
    }).sort(function(a, b) {
      return new Date(b['Date']) - new Date(a['Date']);
    }).slice(0, 20);
  } catch (e) {
    Logger.log('❌ getMyNotifications error: ' + e.message);
    return [];
  }
}

/**
 * Count unread notifications for a user
 */
function getUnreadCount(cin, role) {
  var notifs = getMyNotifications(cin, role);
  return notifs.filter(function(n) { return String(n['Lu']) === 'non'; }).length;
}

/**
 * Mark a single notification as read
 */
function markNotificationRead(notifId) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(NOTIF_SHEET);
    if (!sheet) return { success: false };
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(notifId)) {
        sheet.getRange(i + 1, 6).setValue('oui');
        return { success: true };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Mark ALL notifications as read for a user
 */
function markAllNotificationsRead(cin, role) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(NOTIF_SHEET);
    if (!sheet) return { success: true };
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var destType = String(rows[i][1]);
      var destCIN  = String(rows[i][2]);
      var lu       = String(rows[i][5]);
      var isMatch  = (role === 'admin' && destType === 'admin') ||
                     (role === 'employee' && destType === 'employee' && destCIN === String(cin));
      if (isMatch && lu === 'non') {
        sheet.getRange(i + 1, 6).setValue('oui');
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Notify admin of an employee action
 * Called from any employee-triggered operation
 */
function notifyAdmin(cin, action, actionURL) {
  var msg = '👤 [CIN: ' + cin + '] ' + action;
  createNotification('admin', 'ADMIN', msg, 'info', actionURL || '');
}

/**
 * Notify a specific employee (by CIN)
 */
function notifyEmployee(cin, message, type, actionURL) {
  createNotification('employee', cin, message, type || 'info', actionURL || '');
}

/**
 * Check all pending absences and create alerts for unjustified ones (>2 days pending)
 * Called periodically or manually
 */
function checkUnjustifiedAbsences() {
  try {
    var absences  = getAbsences();
    var employees = getEmployees();
    var cutoff    = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // older than 2 days

    absences.forEach(function(a) {
      if (a['Statut'] === 'En attente' &&
          (!a['JustificatifUrl'] || String(a['JustificatifUrl']).trim() === '') &&
          new Date(a['Date Début']) <= cutoff) {

        // Find employee CIN
        var emp = employees.find(function(e) { return String(e['ID']) === String(a['Employé ID']); });
        if (!emp) return;
        var cin = String(emp['CIN'] || '');

        // Notify the employee
        if (cin) {
          notifyEmployee(
            cin,
            '⚠️ Votre absence du ' + a['Date Début'] + ' est en attente sans justificatif. Veuillez fournir un justificatif.',
            'warning',
            'absences'
          );
        }
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
