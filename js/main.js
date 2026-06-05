(function() {
'use strict';

// ── GRADE TABLE — Annamalai University ───────────────────────
var GRADES = [
  { label: 'S  \u2014 10.0', value: 10, isRA: false },
  { label: 'A  \u2014  9.0', value: 9,  isRA: false },
  { label: 'B  \u2014  8.0', value: 8,  isRA: false },
  { label: 'C  \u2014  7.0', value: 7,  isRA: false },
  { label: 'D  \u2014  6.0', value: 6,  isRA: false },
  { label: 'E  \u2014  5.0', value: 5,  isRA: false },
  { label: 'RA \u2014  0.0', value: 0,  isRA: true  },
  { label: 'AB \u2014  0.0', value: 0,  isRA: true  },
];

var semId = 0;
var courseIdCounter = 0;
var currentMode = 'multi';
var lastCalcResults = null;
var extractedStudentInfo = {};

var GRADE_MAP = { 'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'RA': 0, 'AB': 0 };

function getGradeOptions(defaultValue) {
  if (defaultValue === undefined) defaultValue = 10;
  return GRADES.map(function(g) {
    var sel = (!g.isRA && g.value === defaultValue) ? ' selected' : (g.isRA && defaultValue === 0 && g.label.startsWith('RA')) ? ' selected' : '';
    return '<option value="' + g.value + '" data-ra="' + g.isRA + '"' + sel + '>' + g.label + '</option>';
  }).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function gradeClass(ogpa) {
  if (ogpa >= 9) return { label: 'Outstanding', bg: '#3ddc97', color: '#0d1117' };
  if (ogpa >= 8) return { label: 'Excellent',   bg: '#4ecba4', color: '#0d1117' };
  if (ogpa >= 7) return { label: 'Very Good',   bg: '#4f9cf9', color: '#0d1117' };
  if (ogpa >= 6) return { label: 'Good',        bg: '#d4a853', color: '#0d1117' };
  if (ogpa >= 5) return { label: 'Average',     bg: '#f0b060', color: '#0d1117' };
  return               { label: 'Below Average',bg: '#e05c6a', color: '#fff'    };
}

function clearError() {
  var el = document.getElementById('errorMsg');
  el.textContent = ''; el.classList.remove('visible');
}

function showError(msg) {
  var el = document.getElementById('errorMsg');
  el.textContent = msg; el.classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setScanStatus(type, msg) {
  var el = document.getElementById('scanStatus');
  el.className = 'scan-status';
  if (!type) { el.style.display = 'none'; return; }
  if (type === 'loading') {
    el.innerHTML = '<div class="spin"></div><span>' + msg + '</span>';
  } else if (type === 'success') {
    el.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>' + msg + '</span>';
  } else {
    el.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>' + msg + '</span>';
  }
  el.classList.add(type);
  el.style.display = 'flex';
}

function buildSemBlock(id, title) {
  var block = document.createElement('div');
  block.className = 'sem-block';
  block.id = 'sem-' + id;
  
  var removeBtn = currentMode === 'multi'
    ? '<button class="sem-btn danger" onclick="app.removeSemester(' + id + ')">'
      + '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
      + ' Remove</button>'
    : '';
    
  var actionsDiv = removeBtn ? '<div class="sem-actions">' + removeBtn + '</div>' : '';
  
  block.innerHTML =
    '<div class="sem-header">'
      + '<div class="sem-title-row">'
        + '<span class="sem-num" id="semtitle-' + id + '" contenteditable="true" spellcheck="false" onblur="app.saveState()">' + title + '</span>'
        + '<span class="sem-gpa-preview" id="preview-' + id + '">GPA: \u2014</span>'
      + '</div>'
      + actionsDiv
    + '</div>'
    + '<div class="tbl-head"><div>#</div><div>Course Name</div><div>Credits (C\u1d62)</div><div>Grade</div><div></div></div>'
    + '<div class="courses-list" id="courses-' + id + '"></div>'
    + '<div class="add-course-row">'
      + '<button class="btn-add-course" onclick="app.addCourse(' + id + ')">'
        + '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
        + ' Add Course'
      + '</button>'
    + '</div>';
    
  document.getElementById('semestersWrap').appendChild(block);
  return block;
}

function reNumberSemesters() {
  if (currentMode !== 'multi') return;
  document.querySelectorAll('.sem-block').forEach(function(block, i) {
    var el = block.querySelector('.sem-num');
    if (el && el.textContent.startsWith('Semester')) {
        el.textContent = 'Semester ' + (i + 1);
    }
  });
  app.saveState();
}

function reNumberCourses(semBlockId) {
  var list = document.getElementById('courses-' + semBlockId);
  if (!list) return;
  list.querySelectorAll('.course-row .row-num').forEach(function(el, i) { el.textContent = i + 1; });
}

function livePreview(semBlockId) {
  var list = document.getElementById('courses-' + semBlockId);
  if (!list) return;
  var sumCG = 0, sumC = 0;
  list.querySelectorAll('.course-row').forEach(function(row) {
    var c = parseFloat(row.querySelector('.course-credits').value);
    var g = parseFloat(row.querySelector('.course-grade').value);
    if (!isNaN(c) && c > 0) { sumCG += c * g; sumC += c; }
  });
  var preview = document.getElementById('preview-' + semBlockId);
  if (preview) preview.textContent = sumC > 0 ? 'GPA: ' + (sumCG / sumC).toFixed(2) : 'GPA: \u2014';
  app.saveState();
}

const app = {
  extractState: function() {
    let state = { mode: currentMode, semesters: [] };
    document.querySelectorAll('.sem-block').forEach(function(block) {
        let title = block.querySelector('.sem-num').textContent;
        let semObj = { title: title, courses: [] };
        
        block.querySelectorAll('.course-row').forEach(function(row) {
            let name = row.querySelector('.course-name').value;
            let credits = row.querySelector('.course-credits').value;
            let grade = row.querySelector('.course-grade').value;
            let isArrearCleared = row.dataset.arrearCleared === '1';
            semObj.courses.push({ name, credits, grade, isArrearCleared });
        });
        state.semesters.push(semObj);
    });
    return state;
  },

  restoreState: function(state) {
    if (!state || !state.semesters) return;
    app.setMode(state.mode || 'multi');
    document.getElementById('semestersWrap').innerHTML = '';
    semId = 0; courseIdCounter = 0;
    
    state.semesters.forEach(sem => {
        semId++;
        let id = semId;
        buildSemBlock(id, sem.title);
        sem.courses.forEach(c => {
            app.addCourse(id, c.name, c.credits, parseFloat(c.grade), c.isArrearCleared);
        });
        livePreview(id);
    });
    app.saveState();
  },

  saveState: function() {
    if (window.Storage) {
        window.Storage.saveData(app.extractState());
    }
  },

  triggerPdfUpload: function() { 
      document.getElementById('pdfInput').click(); 
  },
  
  handlePdfUpload: function(files) {
    if (!files || !files.length) return;
    var file = files[0];
    
    setScanStatus('loading', 'Scanning PDF for previous session data...');
    
    var reader = new FileReader();
    reader.onload = function(e) { 
        var text = e.target.result;
        var match = text.match(/%%ANNAMALAI_CALC_DATA_BEGIN%%(.*?)%%ANNAMALAI_CALC_DATA_END%%/s);
        
        if (match && match[1]) {
            try {
                var jsonStr = decodeURIComponent(match[1]);
                var payload = JSON.parse(jsonStr);
                
                if (payload.studentInfo) {
                    extractedStudentInfo = payload.studentInfo;
                }
                if (payload.uiState) {
                    app.restoreState(payload.uiState);
                    setScanStatus('success', 'Successfully restored your previous calculation session! You can now add your next semester.');
                } else {
                    throw new Error("Invalid payload");
                }
            } catch(err) {
                setScanStatus('error', 'Found data, but it was corrupted. Please fill manually.');
            }
        } else {
            setScanStatus('error', 'No restorable session data found in this PDF. Please ensure it is a report generated by this tool.');
        }
    };
    reader.onerror = function() {
        setScanStatus('error', 'Failed to read the PDF file.');
    };
    // readAsText is perfectly fine because we appended our ASCII-safe string at the very end of the binary blob
    reader.readAsText(file);
  },

  setMode: function(mode) {
    currentMode = mode;
    document.getElementById('tab-multi').classList.toggle('active', mode === 'multi');
    document.getElementById('tab-single').classList.toggle('active', mode === 'single');
    document.getElementById('addSemRow').style.display = mode === 'multi' ? '' : 'none';
    document.getElementById('semBreakdown').style.display = mode === 'multi' ? '' : 'none';
    document.getElementById('cgpaLabel').textContent = mode === 'multi' ? 'CGPA / OGPA' : 'Semester GPA';
    var calcLabel = mode === 'multi' ? 'Calculate OGPA' : 'Calculate GPA';
    document.getElementById('calcBtn').innerHTML =
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v10H2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg> ' + calcLabel;
    
    document.getElementById('resultsArea').classList.remove('visible');
    document.getElementById('downloadReportBtn').classList.remove('visible');
    
    semId = 0; courseIdCounter = 0;
    document.getElementById('semestersWrap').innerHTML = '';
    clearError();
    if (mode === 'multi') { app.addSemester(); app.addSemester(); }
    else app.addSemester('Courses');
    app.saveState();
  },

  addSemester: function(customLabel) {
    semId++;
    var id = semId;
    var semIndex = document.querySelectorAll('.sem-block').length + 1;
    var title = customLabel || (currentMode === 'multi' ? 'Semester ' + semIndex : 'Courses');
    buildSemBlock(id, title);
    app.addCourse(id); app.addCourse(id); app.addCourse(id);
    app.saveState();
  },

  removeSemester: function(id) {
    var block = document.getElementById('sem-' + id);
    if (!block) return;
    block.style.opacity = '0';
    block.style.transform = 'translateX(12px)';
    block.style.transition = 'all 0.2s ease';
    setTimeout(function() { block.remove(); reNumberSemesters(); }, 200);
  },

  addCourse: function(semBlockId, name, credits, gradeVal, wasArrearCleared) {
    name = name || ''; credits = credits || ''; gradeVal = gradeVal !== undefined ? gradeVal : 10;
    wasArrearCleared = wasArrearCleared || false;
    courseIdCounter++;
    var cid = courseIdCounter;
    var list = document.getElementById('courses-' + semBlockId);
    if (!list) return;
    var n = list.querySelectorAll('.course-row').length + 1;
    var row = document.createElement('div');
    row.className = 'course-row' + (wasArrearCleared ? ' arrear-cleared' : '');
    row.id = 'crow-' + cid;
    if (wasArrearCleared) row.dataset.arrearCleared = '1';
    
    row.innerHTML =
      '<div class="row-num">' + n + '</div>'
      + '<div style="position:relative;display:flex;align-items:center;gap:6px;">'
        + '<input type="text" placeholder="Course name (optional)" value="' + escHtml(name) + '" class="course-name" style="flex:1" oninput="app.saveState()">'
        + (wasArrearCleared ? '<span class="arrear-tag" style="white-space:nowrap;flex-shrink:0">&#10003; Arrear</span>' : '')
      + '</div>'
      + '<input type="number" placeholder="e.g. 4" min="0.5" max="12" step="0.5" value="' + credits + '" class="course-credits" oninput="app.livePreview(' + semBlockId + ')">'
      + '<select class="course-grade" onchange="app.onGradeChange(this,' + cid + ',' + semBlockId + ')">' + getGradeOptions(gradeVal) + '</select>'
      + '<button class="btn-remove" onclick="app.removeCourse(' + cid + ',' + semBlockId + ')" title="Remove">'
        + '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
      + '</button>';
      
    list.appendChild(row);
    reNumberCourses(semBlockId);
    
    var isRA = GRADES.find(function(g) { return g.value === gradeVal && g.isRA; });
    if (isRA) {
      row.classList.add('ra-row');
      row.querySelector('select').classList.add('ra-select');
    }
  },

  livePreview: function(semBlockId) { livePreview(semBlockId); },

  onGradeChange: function(sel, cid, semBlockId) {
    var isRA = sel.options[sel.selectedIndex].dataset.ra === 'true';
    var row = document.getElementById('crow-' + cid);
    if (row) {
      row.classList.toggle('ra-row', isRA);
      sel.classList.toggle('ra-select', isRA);
      var next = row.nextElementSibling;
      if (next && next.classList.contains('ra-warning')) next.remove();
      if (isRA) {
        var warn = document.createElement('div');
        warn.className = 'ra-warning';
        warn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0"><path d="M6 1L11 10H1L6 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 5v2M6 8.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
          + ' Credits still count toward denominator \u2014 0 credit points earned until subject passed.';
        row.insertAdjacentElement('afterend', warn);
      }
    }
    livePreview(semBlockId);
  },

  removeCourse: function(cid, semBlockId) {
    var row = document.getElementById('crow-' + cid);
    if (!row) return;
    var next = row.nextElementSibling;
    if (next && next.classList.contains('ra-warning')) next.remove();
    row.style.opacity = '0';
    row.style.transform = 'translateX(12px)';
    row.style.transition = 'all 0.18s ease';
    setTimeout(function() { row.remove(); reNumberCourses(semBlockId); livePreview(semBlockId); }, 180);
  },

  calculate: function() {
    clearError();
    var semBlocks = document.querySelectorAll('.sem-block');
    if (semBlocks.length === 0) { showError('Please add at least one semester.'); return; }
    
    var totalCG = 0, totalC = 0, totalRA = 0;
    var semResults = [];
    var hasError = false;
    var allCourseData = [];
    
    semBlocks.forEach(function(block) {
      if (hasError) return;
      var rows = block.querySelectorAll('.course-row');
      var semCG = 0, semC = 0, semRA = 0;
      var semCourses = [];
      
      rows.forEach(function(row) {
        if (hasError) return;
        var creditsInput = row.querySelector('.course-credits');
        var gradeSelect  = row.querySelector('.course-grade');
        var nameInput    = row.querySelector('.course-name');
        var c = parseFloat(creditsInput.value);
        var g = parseFloat(gradeSelect.value);
        var isRA = gradeSelect.options[gradeSelect.selectedIndex].dataset.ra === 'true';
        var isArrearCleared = row.dataset.arrearCleared === '1';
        
        if (isNaN(c) || c <= 0) {
          creditsInput.style.borderColor = 'var(--danger)';
          showError('One or more credit fields are empty or invalid \u2014 please fill them in.');
          hasError = true; return;
        } else {
          creditsInput.style.borderColor = '';
        }
        
        semCG += c * g;
        semC  += c;
        if (isRA) semRA++;
        semCourses.push({
          name: nameInput ? nameInput.value : '',
          credits: c,
          gradeVal: g,
          isRA: isRA,
          isArrearCleared: isArrearCleared
        });
      });
      
      if (hasError || semC === 0) return;
      var semGpa = semCG / semC;
      var semPct = Math.max(0, (semGpa - 0.25) * 10);
      var semLabel = block.querySelector('.sem-num').textContent;
      semResults.push({ label: semLabel, semCG: semCG, semC: semC, semGpa: semGpa, semPct: semPct, semRA: semRA, courses: semCourses });
      allCourseData.push({ label: semLabel, courses: semCourses });
      totalCG += semCG;
      totalC  += semC;
      totalRA += semRA;
    });
    
    if (hasError) return;
    if (totalC === 0) { showError('Total credit hours cannot be zero \u2014 please add at least one course.'); return; }
    
    var ogpa = totalCG / totalC;
    var percent = Math.max(0, (ogpa - 0.25) * 10);
    var gInfo = gradeClass(ogpa);
    
    document.getElementById('cgpaVal').textContent = ogpa.toFixed(2);
    document.getElementById('percentVal').textContent = percent.toFixed(2) + '%';
    document.getElementById('totalCredits').textContent = totalC.toFixed(1);
    document.getElementById('weightedSum').textContent = totalCG.toFixed(2);
    document.getElementById('raCount').textContent = totalRA;
    
    var badge = document.getElementById('gradeBadge');
    badge.textContent = gInfo.label;
    badge.style.background = gInfo.bg;
    badge.style.color = gInfo.color;
    
    var tbody = document.getElementById('semTableBody');
    tbody.innerHTML = '';
    semResults.forEach(function(s) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + s.label + '</td>'
        + '<td>' + s.semC.toFixed(1) + '</td>'
        + '<td>' + s.semCG.toFixed(2) + '</td>'
        + '<td class="gpa-cell">' + s.semGpa.toFixed(2) + '</td>'
        + '<td class="pct-cell">' + s.semPct.toFixed(2) + '%</td>'
        + '<td class="ra-cell">' + (s.semRA > 0 ? '\u26a0 ' + s.semRA : '\u2014') + '</td>';
      tbody.appendChild(tr);
    });
    
    lastCalcResults = {
      ogpa: ogpa, percent: percent, totalCredits: totalC, totalCG: totalCG,
      totalRA: totalRA, gradeClass: gInfo.label, semResults: semResults,
      allCourseData: allCourseData, mode: currentMode
    };
    
    var area = document.getElementById('resultsArea');
    area.classList.remove('visible');
    void area.offsetWidth;
    area.classList.add('visible');
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    var dlBtn = document.getElementById('downloadReportBtn');
    dlBtn.classList.remove('visible');
    void dlBtn.offsetWidth;
    setTimeout(function() { dlBtn.classList.add('visible'); }, 400);
    
    app.saveState();
  },

  resetAll: function() {
    semId = 0; courseIdCounter = 0;
    document.getElementById('semestersWrap').innerHTML = '';
    document.getElementById('resultsArea').classList.remove('visible');
    document.getElementById('downloadReportBtn').classList.remove('visible');
    clearError();
    lastCalcResults = null;
    if (currentMode === 'multi') { app.addSemester(); app.addSemester(); }
    else app.addSemester('Courses');
    if (window.Storage) window.Storage.clearData();
  },

  openReportModal: function() {
    if (extractedStudentInfo.name && !document.getElementById('rName').value) {
      document.getElementById('rName').value = extractedStudentInfo.name;
    }
    if (extractedStudentInfo.reg_no && !document.getElementById('rRegNo').value) {
      document.getElementById('rRegNo').value = extractedStudentInfo.reg_no;
    }
    if (extractedStudentInfo.department && !document.getElementById('rDept').value) {
      document.getElementById('rDept').value = extractedStudentInfo.department;
    }
    if (extractedStudentInfo.year && !document.getElementById('rYear').value) {
        document.getElementById('rYear').value = extractedStudentInfo.year;
    }
    if (extractedStudentInfo.extra && !document.getElementById('rExtra').value) {
        document.getElementById('rExtra').value = extractedStudentInfo.extra;
    }
    
    document.getElementById('reportModal').classList.add('visible');
    document.getElementById('genProgress').classList.remove('visible');
    document.getElementById('confirmReportBtn').disabled = false;
  },

  closeReportModal: function() {
    document.getElementById('reportModal').classList.remove('visible');
  },

  generatePDF: function() {
    var name = document.getElementById('rName').value.trim();
    var dept = document.getElementById('rDept').value.trim();
    if (!name) { document.getElementById('rName').focus(); return; }
    if (!dept) { document.getElementById('rDept').focus(); return; }
    var regNo = document.getElementById('rRegNo').value.trim();
    var year  = document.getElementById('rYear').value.trim();
    var extra = document.getElementById('rExtra').value.trim();
    var progress = document.getElementById('genProgress');
    var confirmBtn = document.getElementById('confirmReportBtn');
    
    // Save these manually edited details to student info
    extractedStudentInfo = { name: name, regNo: regNo, dept: dept, year: year, extra: extra };
    
    progress.classList.add('visible');
    progress.innerHTML = '<div class="spin"></div><span>Building your PDF...</span>';
    confirmBtn.disabled = true;
    
    setTimeout(function() {
      try {
        if (!window.PDFGenerator) throw new Error("PDFGenerator module missing.");
        window.PDFGenerator.generate(name, regNo, dept, year, extra, lastCalcResults);
        progress.classList.remove('visible');
        confirmBtn.disabled = false;
        app.closeReportModal();
      } catch(e) {
        progress.innerHTML = '<span style="color:var(--danger)">PDF error: ' + e.message + '</span>';
        confirmBtn.disabled = false;
      }
    }, 100);
  }
};

window.app = app;

document.getElementById('reportModal').addEventListener('click', function(e) {
  if (e.target === this) app.closeReportModal();
});

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    let saved = window.Storage ? window.Storage.loadData() : null;
    if (saved && saved.semesters && saved.semesters.length > 0) {
        app.restoreState(saved);
    } else {
        app.addSemester('Semester 1');
        app.addSemester('Semester 2');
    }
});

})();