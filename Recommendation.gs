/**
 * ============================================================
 *  RECOMMENDATION ENGINE v3.0
 *  5-criteria scoring: skills(mission) + poste match + workload + absence + experience
 *  NEW: recommendEmployeesForPoste, getHRPerformanceDashboard,
 *       getTopPerformers, getWorkloadDistribution
 * ============================================================
 */

/**
 * Recommend best employees for a mission (weighted scoring)
 *  - Skill match (mission)   40%
 *  - Poste compatibility     20%
 *  - Workload                20%
 *  - Absence rate            15%
 *  - Experience (tenure)      5%
 */
function recommendEmployeesForMission(missionId) {
  try {
    var missions     = getMissions();
    var employees    = getEmployees();
    var absences     = getAbsences();
    var affectations = getAffectations();

    var mission = missions.find(function(m) { return String(m['ID']) === String(missionId); });
    if (!mission) return { success: false, message: 'Mission introuvable (ID: ' + missionId + ')' };

    var requiredSkills = parseSkills(mission['Compétences Requises'] || '');
    var today = new Date();
    var ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    var activeEmployees = employees.filter(function(e) { return e['Statut'] === 'Actif'; });
    if (!activeEmployees.length) return { success: false, message: 'Aucun employé actif.' };

    var recommendations = activeEmployees.map(function(emp) {
      var empSkills = parseSkills(emp['Compétences'] || '');

      // ── 1. Mission Skill Score (0-100) ───────────────────────
      var matchedSkills = [], partialSkills = [];
      requiredSkills.forEach(function(rs) {
        var rsLow = rs.toLowerCase();
        var exact = empSkills.some(function(es) { return es.toLowerCase() === rsLow; });
        var partial = !exact && empSkills.some(function(es) {
          var esLow = es.toLowerCase();
          return esLow.indexOf(rsLow) !== -1 || rsLow.indexOf(esLow) !== -1;
        });
        if (exact) matchedSkills.push(rs);
        else if (partial) partialSkills.push(rs);
      });
      var skillScore = 50;
      if (requiredSkills.length > 0) {
        skillScore = Math.round(((matchedSkills.length + partialSkills.length * 0.5) / requiredSkills.length) * 100);
      }

      // ── 2. Poste Compatibility Score (0-100) ─────────────────
      var posteScore = 50;
      var posteSkillsRequired = [];
      var poste = getPosteByTitle(emp['Poste'] || '');
      if (poste) {
        posteSkillsRequired = parseSkills(poste['Compétences Requises'] || '');
        if (posteSkillsRequired.length > 0) {
          var posteMatched = posteSkillsRequired.filter(function(ps) {
            return empSkills.some(function(es) {
              return es.toLowerCase() === ps.toLowerCase() ||
                     es.toLowerCase().indexOf(ps.toLowerCase()) !== -1;
            });
          });
          posteScore = Math.round((posteMatched.length / posteSkillsRequired.length) * 100);
        }
      }

      // ── 3. Workload Score (0-100) ─────────────────────────────
      var activeMissions = affectations.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) && a['Statut'] === 'Actif';
      }).length;
      var workloadScore = Math.max(0, 100 - activeMissions * 20);

      // ── 4. Absence Score (0-100) ──────────────────────────────
      var recentAbsences = absences.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) &&
               a['Statut'] === 'Approuvée' &&
               new Date(a['Date Début']) >= ninetyDaysAgo;
      });
      var absenceDays = recentAbsences.reduce(function(s, a) { return s + (Number(a['Durée (jours)']) || 0); }, 0);
      var absenceScore = Math.max(0, 100 - absenceDays * 5);

      // ── 5. Tenure Score (0-100) ───────────────────────────────
      var hireDate = emp['Date Embauche'] ? new Date(emp['Date Embauche']) : null;
      var tenureYears = hireDate ? (today - hireDate) / (1000 * 60 * 60 * 24 * 365) : 0;
      var tenureScore = Math.min(100, Math.round(tenureYears * 20)); // 5 years = 100

      // ── Weighted Total ────────────────────────────────────────
      var totalScore = Math.round(
        skillScore    * 0.40 +
        posteScore    * 0.20 +
        workloadScore * 0.20 +
        absenceScore  * 0.15 +
        tenureScore   * 0.05
      );

      // ── AI Explanation ────────────────────────────────────────
      var reasons = [];
      var allMatched = matchedSkills.concat(partialSkills);
      if (requiredSkills.length === 0) reasons.push('Aucune compétence spécifique requise.');
      else if (skillScore >= 80) reasons.push('Excellente correspondance (' + allMatched.length + '/' + requiredSkills.length + ' skills).');
      else if (skillScore >= 50) reasons.push('Correspondance partielle (' + allMatched.length + '/' + requiredSkills.length + ' skills).');
      else reasons.push('Compétences limitées (' + allMatched.length + '/' + requiredSkills.length + ' skill(s)).');

      if (posteScore >= 80) reasons.push('Très compatible avec son poste (' + posteScore + '%).');
      else if (posteScore >= 50) reasons.push('Partiellement compatible avec son poste.');

      if (activeMissions === 0) reasons.push('Entièrement disponible (0 mission active).');
      else if (workloadScore >= 60) reasons.push('Charge modérée (' + activeMissions + ' mission(s)).');
      else reasons.push('Charge élevée (' + activeMissions + ' missions).');

      if (absenceDays === 0) reasons.push('Présence exemplaire sur 90 jours.');
      else if (absenceScore >= 70) reasons.push('Taux d\'absence acceptable (' + absenceDays + 'j/90j).');
      else reasons.push('Absentéisme notable (' + absenceDays + 'j/90j).');

      return {
        id           : emp['ID'],
        name         : emp['Nom'] + ' ' + emp['Prénom'],
        email        : emp['Email'],
        poste        : emp['Poste'],
        departement  : emp['Département'],
        score        : totalScore,
        reason       : reasons.join(' '),
        details      : {
          skillScore    : skillScore,
          posteScore    : posteScore,
          workloadScore : workloadScore,
          absenceScore  : absenceScore,
          tenureScore   : tenureScore,
          matchedSkills : matchedSkills,
          partialSkills : partialSkills,
          empSkills     : empSkills,
          activeMissions: activeMissions,
          absenceDays   : absenceDays
        }
      };
    });

    recommendations.sort(function(a, b) { return b.score - a.score; });
    return {
      success        : true,
      missionId      : missionId,
      missionTitle   : mission['Titre'],
      missionDept    : mission['Département'],
      requiredSkills : requiredSkills,
      totalAnalyzed  : activeEmployees.length,
      recommendations: recommendations.slice(0, 5)
    };
  } catch (e) {
    Logger.log('❌ recommendEmployeesForMission error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Recommend employees for a given POSTE (internal mobility / recruitment)
 */
function recommendEmployeesForPoste(posteId) {
  try {
    var poste     = getPosteById(posteId);
    var employees = getEmployees();
    var absences  = getAbsences();
    var affectations = getAffectations();
    var today = new Date();
    var ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (!poste) return { success: false, message: 'Poste introuvable' };
    var requiredSkills = parseSkills(poste['Compétences Requises'] || '');

    var activeEmployees = employees.filter(function(e) { return e['Statut'] === 'Actif'; });

    var recommendations = activeEmployees.map(function(emp) {
      var empSkills = parseSkills(emp['Compétences'] || '');
      var matchedSkills = [], partialSkills = [];

      requiredSkills.forEach(function(rs) {
        var rsLow = rs.toLowerCase();
        var exact = empSkills.some(function(es) { return es.toLowerCase() === rsLow; });
        var partial = !exact && empSkills.some(function(es) {
          var esLow = es.toLowerCase();
          return esLow.indexOf(rsLow) !== -1 || rsLow.indexOf(esLow) !== -1;
        });
        if (exact) matchedSkills.push(rs);
        else if (partial) partialSkills.push(rs);
      });

      var skillScore = requiredSkills.length > 0
        ? Math.round(((matchedSkills.length + partialSkills.length * 0.5) / requiredSkills.length) * 100)
        : 50;

      var activeMissions = affectations.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) && a['Statut'] === 'Actif';
      }).length;
      var workloadScore = Math.max(0, 100 - activeMissions * 20);

      var absenceDays = absences.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) &&
               a['Statut'] === 'Approuvée' && new Date(a['Date Début']) >= ninetyDaysAgo;
      }).reduce(function(s, a) { return s + (Number(a['Durée (jours)']) || 0); }, 0);
      var absenceScore = Math.max(0, 100 - absenceDays * 5);

      var hireDate = emp['Date Embauche'] ? new Date(emp['Date Embauche']) : null;
      var tenureYears = hireDate ? (today - hireDate) / (1000 * 60 * 60 * 24 * 365) : 0;
      var tenureScore = Math.min(100, Math.round(tenureYears * 20));

      var totalScore = Math.round(
        skillScore    * 0.55 +
        workloadScore * 0.20 +
        absenceScore  * 0.15 +
        tenureScore   * 0.10
      );

      var missingSkills = requiredSkills.filter(function(rs) {
        return matchedSkills.indexOf(rs) === -1 && partialSkills.indexOf(rs) === -1;
      });

      return {
        id           : emp['ID'],
        name         : emp['Nom'] + ' ' + emp['Prénom'],
        email        : emp['Email'],
        poste        : emp['Poste'],
        departement  : emp['Département'],
        score        : totalScore,
        details      : {
          skillScore    : skillScore,
          workloadScore : workloadScore,
          absenceScore  : absenceScore,
          tenureScore   : tenureScore,
          matchedSkills : matchedSkills,
          partialSkills : partialSkills,
          missingSkills : missingSkills,
          empSkills     : empSkills,
          activeMissions: activeMissions,
          absenceDays   : absenceDays
        }
      };
    });

    recommendations.sort(function(a, b) { return b.score - a.score; });
    return {
      success        : true,
      posteId        : posteId,
      posteTitle     : poste['Titre'],
      posteCategorie : poste['Catégorie'],
      requiredSkills : requiredSkills,
      totalAnalyzed  : activeEmployees.length,
      recommendations: recommendations.slice(0, 5)
    };
  } catch (e) {
    Logger.log('❌ recommendEmployeesForPoste error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Auto-assign the top-scoring employee to a mission
 */
function autoAssignBestEmployee(missionId) {
  var result = recommendEmployeesForMission(missionId);
  if (!result.success || !result.recommendations.length) {
    return { success: false, message: 'Aucun employé disponible pour cette mission.' };
  }
  return assignEmployeeToMission(missionId, result.recommendations[0].id);
}

/**
 * HR Performance Dashboard — all KPIs in one call
 */
function getHRPerformanceDashboard() {
  try {
    var employees    = getEmployees();
    var missions     = getMissions();
    var absences     = getAbsences();
    var affectations = getAffectations();
    var today        = new Date();
    var thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    var activeEmp = employees.filter(function(e) { return e['Statut'] === 'Actif'; });

    // ── Top performers ────────────────────────────────────────
    var topPerformers = getTopPerformers(5);

    // ── Absence rate per department (30 days) ─────────────────
    var deptAbsence = {};
    var deptCount   = {};
    activeEmp.forEach(function(e) {
      var d = e['Département'] || 'Autre';
      deptCount[d] = (deptCount[d] || 0) + 1;
    });
    absences.forEach(function(a) {
      if (a['Statut'] === 'Approuvée' && new Date(a['Date Début']) >= thirtyDaysAgo) {
        var emp = employees.find(function(e) { return String(e['ID']) === String(a['Employé ID']); });
        var dept = emp ? (emp['Département'] || 'Autre') : 'Autre';
        deptAbsence[dept] = (deptAbsence[dept] || 0) + (Number(a['Durée (jours)']) || 0);
      }
    });

    // ── Workload distribution by employee ────────────────────
    var workloadMap = {};
    affectations.forEach(function(a) {
      if (a['Statut'] === 'Actif') {
        workloadMap[a['Employé ID']] = (workloadMap[a['Employé ID']] || 0) + 1;
      }
    });
    var overloaded = [];
    Object.keys(workloadMap).forEach(function(id) {
      if (workloadMap[id] >= 3) {
        var emp = employees.find(function(e) { return String(e['ID']) === String(id); });
        if (emp) overloaded.push({ name: emp['Nom'] + ' ' + emp['Prénom'], missions: workloadMap[id] });
      }
    });
    overloaded.sort(function(a, b) { return b.missions - a.missions; });

    // ── Missions without employee ─────────────────────────────
    var unassigned = missions.filter(function(m) {
      return (m['Statut'] === 'Ouverte' || m['Statut'] === 'En cours') &&
             (!m['Employé Affecté'] || String(m['Employé Affecté']).trim() === '');
    }).length;

    // ── Employees without skills ──────────────────────────────
    var noSkills = employees.filter(function(e) {
      return e['Statut'] === 'Actif' && (!e['Compétences'] || String(e['Compétences']).trim() === '');
    }).length;

    // ── Absence rate by dept (%) ──────────────────────────────
    var deptAbsenceRate = {};
    Object.keys(deptCount).forEach(function(d) {
      deptAbsenceRate[d] = {
        employees  : deptCount[d],
        absenceDays: deptAbsence[d] || 0,
        rate       : deptCount[d] > 0
          ? Math.round(((deptAbsence[d] || 0) / (deptCount[d] * 30)) * 100)
          : 0
      };
    });

    // ── Mission status breakdown ──────────────────────────────
    var missionStatus = {};
    missions.forEach(function(m) {
      var s = m['Statut'] || 'Autre';
      missionStatus[s] = (missionStatus[s] || 0) + 1;
    });

    return {
      success         : true,
      topPerformers   : topPerformers,
      overloadedEmployees: overloaded,
      deptAbsenceRate : deptAbsenceRate,
      missionStatus   : missionStatus,
      unassignedMissions: unassigned,
      noSkillsCount   : noSkills,
      totalActive     : activeEmp.length
    };
  } catch (e) {
    Logger.log('❌ getHRPerformanceDashboard error: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Get top N employees by composite AI score
 */
function getTopPerformers(n) {
  n = n || 5;
  try {
    var employees    = getEmployees();
    var absences     = getAbsences();
    var affectations = getAffectations();
    var today        = new Date();
    var ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    var activeEmp = employees.filter(function(e) { return e['Statut'] === 'Actif'; });

    var scored = activeEmp.map(function(emp) {
      var empSkills = parseSkills(emp['Compétences'] || '');

      var activeMissions = affectations.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) && a['Statut'] === 'Actif';
      }).length;
      var workloadScore = Math.min(100, activeMissions * 20); // more missions = higher performance

      var absenceDays = absences.filter(function(a) {
        return String(a['Employé ID']) === String(emp['ID']) &&
               a['Statut'] === 'Approuvée' && new Date(a['Date Début']) >= ninetyDaysAgo;
      }).reduce(function(s, a) { return s + (Number(a['Durée (jours)']) || 0); }, 0);
      var presenceScore = Math.max(0, 100 - absenceDays * 5);

      var skillsScore = Math.min(100, empSkills.length * 10); // 10 skills = 100

      var hireDate = emp['Date Embauche'] ? new Date(emp['Date Embauche']) : null;
      var tenureYears = hireDate ? (today - hireDate) / (1000 * 60 * 60 * 24 * 365) : 0;
      var tenureScore = Math.min(100, Math.round(tenureYears * 20));

      var compositeScore = Math.round(
        skillsScore   * 0.35 +
        presenceScore * 0.30 +
        workloadScore * 0.25 +
        tenureScore   * 0.10
      );

      return {
        id          : emp['ID'],
        name        : emp['Nom'] + ' ' + emp['Prénom'],
        poste       : emp['Poste'],
        departement : emp['Département'],
        score       : compositeScore,
        skillsCount : empSkills.length,
        activeMissions: activeMissions,
        absenceDays : absenceDays
      };
    });

    scored.sort(function(a, b) { return b.score - a.score; });
    return scored.slice(0, n);
  } catch (e) {
    Logger.log('❌ getTopPerformers error: ' + e.message);
    return [];
  }
}

/**
 * Get workload distribution (active missions per employee)
 */
function getWorkloadDistribution() {
  try {
    var employees    = getEmployees();
    var affectations = getAffectations();

    var map = {};
    affectations.forEach(function(a) {
      if (a['Statut'] === 'Actif') {
        map[a['Employé ID']] = (map[a['Employé ID']] || 0) + 1;
      }
    });

    var result = employees
      .filter(function(e) { return e['Statut'] === 'Actif'; })
      .map(function(emp) {
        return {
          id          : emp['ID'],
          name        : emp['Nom'] + ' ' + emp['Prénom'],
          departement : emp['Département'],
          missions    : map[emp['ID']] || 0
        };
      });

    result.sort(function(a, b) { return b.missions - a.missions; });
    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get all affectations
 */
function getAffectations() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_AFFECTATIONS);
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
    Logger.log('❌ getAffectations error: ' + e.message);
    return [];
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

/**
 * Helper: parse comma/semicolon-separated skill string into array
 */
function parseSkills(str) {
  if (!str) return [];
  return str.split(/[,;]/).map(function(s) { return s.trim(); }).filter(Boolean);
}

/**
 * Get administrative alerts for the dashboard
 */
function getAdminAlerts() {
  var alerts    = [];
  var absences  = getAbsences();
  var employees = getEmployees();

  var pendingNoJustif = absences.filter(function(a) {
    return a['Statut'] === 'En attente' && (!a['JustificatifUrl'] || String(a['JustificatifUrl']).trim() === '');
  });
  if (pendingNoJustif.length > 0) {
    alerts.push({ type:'warning', title:'Justificatifs manquants', message: pendingNoJustif.length + ' absence(s) en attente sans justificatif.', action:'absences' });
  }

  var pendingEmployees = employees.filter(function(e) { return e['Statut'] === 'En attente'; });
  if (pendingEmployees.length > 0) {
    alerts.push({ type:'info', title:'Validation requise', message: pendingEmployees.length + ' employé(s) en attente de validation.', action:'employees' });
  }

  var thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  var stats = {};
  absences.forEach(function(a) {
    var d = new Date(a['Date Début']);
    if (d >= thirtyDaysAgo && a['Statut'] === 'Approuvée') {
      var id = a['Employé ID'];
      stats[id] = (stats[id] || 0) + Number(a['Durée (jours)'] || 0);
    }
  });
  for (var empId in stats) {
    if (stats[empId] > 5) {
      var emp = employees.find(function(e) { return String(e['ID']) === String(empId); });
      alerts.push({ type:'danger', title:'Absentéisme élevé', message: (emp ? (emp['Nom'] + ' ' + emp['Prénom']) : empId) + ' : ' + stats[empId] + ' jours en 30 jours.', action:'employees' });
    }
  }
  return alerts;
}
