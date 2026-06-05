// PDF Generator Module
window.PDFGenerator = (function() {
  function pageBg(doc, W, H) {
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(212, 168, 83);
    doc.rect(0, 0, W, 3, 'F');
  }

  function pageFooter(doc, W, H, today) {
    doc.setFontSize(8);
    doc.setTextColor(74, 85, 104);
    doc.text('Generated on ' + today + '  |  Annamalai University GPA Calculator  |  by ArtisticSigma', W / 2, H - 10, { align: 'center' });
    doc.setFillColor(212, 168, 83);
    doc.rect(0, H - 3, W, 3, 'F');
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r)) { r = 212; g = 168; b = 83; }
    return [r, g, b];
  }

  function drawPieSlice(doc, cx, cy, r, startDeg, endDeg, rgbColor) {
    var steps = Math.max(2, Math.round(Math.abs(endDeg - startDeg) / 3));
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    
    var prevX = cx + r * Math.cos(startDeg * Math.PI / 180 - Math.PI / 2);
    var prevY = cy + r * Math.sin(startDeg * Math.PI / 180 - Math.PI / 2);
    
    for (var i = 1; i <= steps; i++) {
      var angle = (startDeg + (endDeg - startDeg) * i / steps) * Math.PI / 180;
      var nx = cx + r * Math.cos(angle - Math.PI / 2);
      var ny = cy + r * Math.sin(angle - Math.PI / 2);
      
      doc.triangle(cx, cy, prevX, prevY, nx, ny, 'F');
      
      prevX = nx;
      prevY = ny;
    }
  }

  function gradeValToLabel(val, isRA) {
    if (isRA) return 'RA';
    if (val === 10) return 'S';
    if (val === 9) return 'A';
    if (val === 8) return 'B';
    if (val === 7) return 'C';
    if (val === 6) return 'D';
    if (val === 5) return 'E';
    return String(val);
  }

  function gradeClass(ogpa) {
    if (ogpa >= 9) return { label: 'Outstanding', bg: '#3ddc97', color: '#0d1117' };
    if (ogpa >= 8) return { label: 'Excellent',   bg: '#4ecba4', color: '#0d1117' };
    if (ogpa >= 7) return { label: 'Very Good',   bg: '#4f9cf9', color: '#0d1117' };
    if (ogpa >= 6) return { label: 'Good',        bg: '#d4a853', color: '#0d1117' };
    if (ogpa >= 5) return { label: 'Average',     bg: '#f0b060', color: '#0d1117' };
    return               { label: 'Below Average',bg: '#e05c6a', color: '#fff'    };
  }

  return {
    generate: function(name, regNo, dept, year, extra, results) {
      if (!window.jspdf) {
        throw new Error("jsPDF library not loaded");
      }
      
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      var W = doc.internal.pageSize.getWidth();
      var H = doc.internal.pageSize.getHeight();
      var R = results;
      var today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── PAGE 1: COVER ─────────────────────────────────────────
      doc.setFillColor(13, 17, 23);
      doc.rect(0, 0, W, H, 'F');
      doc.setFillColor(212, 168, 83);
      doc.rect(0, 0, W, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(212, 168, 83);
      doc.text('ANNAMALAI UNIVERSITY', W / 2, 22, { align: 'center', charSpace: 2 });

      doc.setDrawColor(42, 52, 65);
      doc.setLineWidth(0.4);
      doc.line(30, 27, W - 30, 27);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(240, 201, 122);
      doc.text('ACADEMIC', W / 2, 50, { align: 'center' });
      doc.text('PERFORMANCE', W / 2, 63, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(123, 136, 150);
      doc.text('REPORT', W / 2, 74, { align: 'center' });

      doc.setDrawColor(212, 168, 83);
      doc.setLineWidth(0.6);
      doc.line(W/2 - 30, 80, W/2 + 30, 80);

      var boxY = 92;
      doc.setFillColor(22, 27, 34);
      doc.setDrawColor(42, 52, 65);
      doc.setLineWidth(0.4);
      doc.roundedRect(20, boxY, W - 40, 70, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(232, 237, 243);
      doc.text(name, W / 2, boxY + 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(123, 136, 150);
      doc.text(dept, W / 2, boxY + 30, { align: 'center' });

      if (regNo) {
        doc.setFontSize(10);
        doc.text('Reg. No: ' + regNo, W / 2, boxY + 41, { align: 'center' });
      }
      if (year) {
        doc.setFontSize(10);
        doc.text(year, W / 2, boxY + (regNo ? 52 : 41), { align: 'center' });
      }
      if (extra) {
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(extra, W / 2, boxY + (regNo || year ? 62 : 41), { align: 'center' });
      }

      var ogpaBoxY = 175;
      doc.setFillColor(30, 35, 43);
      doc.setDrawColor(212, 168, 83);
      doc.setLineWidth(0.8);
      doc.roundedRect(20, ogpaBoxY, (W - 50) / 2, 40, 3, 3, 'FD');
      doc.roundedRect(30 + (W - 50) / 2, ogpaBoxY, (W - 50) / 2, 40, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(240, 201, 122);
      doc.text(R.ogpa.toFixed(2), 20 + (W - 50) / 4, ogpaBoxY + 18, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(123, 136, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(R.mode === 'multi' ? 'OGPA / CGPA' : 'SEMESTER GPA', 20 + (W - 50) / 4, ogpaBoxY + 28, { align: 'center', charSpace: 1 });
      doc.setFontSize(8);
      doc.text('out of 10.0', 20 + (W - 50) / 4, ogpaBoxY + 35, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(78, 203, 164);
      doc.text(R.percent.toFixed(2) + '%', 30 + (W - 50) / 2 + (W - 50) / 4, ogpaBoxY + 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(123, 136, 150);
      doc.text('PERCENTAGE', 30 + (W - 50) / 2 + (W - 50) / 4, ogpaBoxY + 26, { align: 'center', charSpace: 1 });
      doc.setFontSize(8);
      doc.text('(OGPA \u2212 0.25) \u00D7 10', 30 + (W - 50) / 2 + (W - 50) / 4, ogpaBoxY + 34, { align: 'center' });

      var gc = gradeClass(R.ogpa);
      var gcRgb = hexToRgb(gc.bg);
      doc.setFillColor(gcRgb[0], gcRgb[1], gcRgb[2]);
      doc.roundedRect(W/2 - 25, ogpaBoxY + 48, 50, 12, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(gc.color === '#fff' ? 255 : 13, gc.color === '#fff' ? 255 : 17, gc.color === '#fff' ? 255 : 23);
      doc.text(gc.label.toUpperCase(), W / 2, ogpaBoxY + 57, { align: 'center' });

      var statsY = ogpaBoxY + 72;
      var stats = [
        { label: 'Total Credits', val: R.totalCredits.toFixed(1) },
        { label: 'Credit Points', val: R.totalCG.toFixed(2) },
        { label: 'RA / Arrears',  val: String(R.totalRA) },
        { label: 'Semesters',     val: String(R.semResults ? R.semResults.length : 1) }
      ];

      var sw = (W - 40) / 4;
      stats.forEach(function(s, i) {
        var sx = 20 + i * sw + sw / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(232, 237, 243);
        doc.text(s.val, sx, statsY, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(123, 136, 150);
        doc.text(s.label.toUpperCase(), sx, statsY + 8, { align: 'center', charSpace: 0.5 });
      });

      pageFooter(doc, W, H, today);

      // ── PAGE 2: SEMESTER BREAKDOWN ────────────────────────────
      doc.addPage();
      pageBg(doc, W, H);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(240, 201, 122);
      doc.text('Semester-wise Breakdown', 20, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(123, 136, 150);
      doc.text(name + (dept ? ' \u2014 ' + dept : ''), 20, 28);

      if (R.semResults && R.semResults.length) {
        var semRows = R.semResults.map(function(s) {
          return [
            s.label,
            s.semC.toFixed(1),
            s.semCG.toFixed(2),
            s.semGpa.toFixed(2),
            s.semPct.toFixed(2) + '%',
            s.semRA > 0 ? '\u26a0 ' + s.semRA : '\u2014'
          ];
        });

        doc.autoTable({
          startY: 34,
          head: [['Semester', 'Credits', 'Credit Points', 'Sem GPA', 'Sem %', 'RA/AB']],
          body: semRows,
          styles: { font: 'helvetica', fontSize: 10, textColor: [232, 237, 243], fillColor: [22, 27, 34], lineColor: [42, 52, 65], lineWidth: 0.3 },
          headStyles: { fillColor: [28, 35, 48], textColor: [212, 168, 83], fontStyle: 'bold', fontSize: 9, halign: 'left' },
          alternateRowStyles: { fillColor: [18, 22, 30] },
          columnStyles: { 3: { textColor: [240, 201, 122], fontStyle: 'bold' }, 4: { textColor: [78, 203, 164] }, 5: { textColor: [224, 92, 106] } }
        });
      }

      var curY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 90) + 12;

      if (R.allCourseData && R.allCourseData.length) {
        R.allCourseData.forEach(function(sem) {
          if (curY > H - 40) { doc.addPage(); pageBg(doc, W, H); curY = 20; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(212, 168, 83);
          doc.text(sem.label, 20, curY);
          curY += 4;

          var courseRows = sem.courses.map(function(c, idx) {
            var gradeLabel = gradeValToLabel(c.gradeVal, c.isRA);
            return [
              String(idx + 1),
              c.name || '(Unnamed)',
              c.credits.toFixed(1),
              gradeLabel,
              (c.credits * c.gradeVal).toFixed(2),
              c.isArrearCleared ? 'Arrear Cleared' : (c.isRA ? 'Arrear' : 'Pass')
            ];
          });

          doc.autoTable({
            startY: curY,
            head: [['#', 'Subject', 'Credits', 'Grade', 'Cr.Pts', 'Status']],
            body: courseRows,
            styles: { font: 'helvetica', fontSize: 9, textColor: [200, 210, 220], fillColor: [18, 22, 30], lineColor: [42, 52, 65], lineWidth: 0.25 },
            headStyles: { fillColor: [28, 35, 48], textColor: [123, 136, 150], fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [22, 27, 34] },
            columnStyles: {
              0: { halign: 'center', cellWidth: 10 },
              2: { halign: 'center', cellWidth: 20 },
              3: { halign: 'center', cellWidth: 20, textColor: [240, 201, 122] },
              4: { halign: 'right', cellWidth: 22 },
              5: { halign: 'center', cellWidth: 28 }
            },
            didParseCell: function(data) {
              if (data.column.index === 5 && data.section === 'body') {
                if (data.cell.raw === 'Arrear') data.cell.styles.textColor = [224, 92, 106];
                else if (data.cell.raw === 'Arrear Cleared') data.cell.styles.textColor = [56, 189, 248];
                else data.cell.styles.textColor = [78, 203, 164];
              }
            }
          });
          curY = doc.lastAutoTable.finalY + 10;
        });
      }

      pageFooter(doc, W, H, today);

      // ── PAGE 3: CHARTS ────────────────────────────────────────
      doc.addPage();
      pageBg(doc, W, H);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(240, 201, 122);
      doc.text('Visual Analytics', 20, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(123, 136, 150);
      doc.text(name + (dept ? ' \u2014 ' + dept : ''), 20, 28);

      var chartY = 38;

      if (R.semResults && R.semResults.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(212, 168, 83);
        doc.text('SEMESTER GPA TREND', 20, chartY);
        chartY += 6;

        var barMaxW = W - 40;
        var barH = 8;
        var gap = 5;

        R.semResults.forEach(function(s) {
          var pct = s.semGpa / 10;
          var fillW = barMaxW * pct;
          var gc2 = gradeClass(s.semGpa);
          var rgb = hexToRgb(gc2.bg);

          doc.setFillColor(28, 35, 48);
          doc.roundedRect(20, chartY, barMaxW, barH, 2, 2, 'F');

          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.roundedRect(20, chartY, Math.max(fillW, 4), barH, 2, 2, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(232, 237, 243);
          doc.text(s.label, 20, chartY - 1);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(240, 201, 122);
          doc.text(s.semGpa.toFixed(2), 20 + barMaxW + 4, chartY + barH / 2 + 2);

          chartY += barH + gap + 3;
        });
        chartY += 8;
      }

      var pieX = 50, pieY = chartY + 35, pieR = 28;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(212, 168, 83);
      doc.text('OGPA SCORE DIAL', 20, chartY);
      chartY += 5;
      pieY = chartY + 38;

      doc.setFillColor(28, 35, 48);
      doc.circle(pieX, pieY, pieR + 3, 'F');

      var ogpaFraction = R.ogpa / 10;
      drawPieSlice(doc, pieX, pieY, pieR, 0, ogpaFraction * 360, hexToRgb(gradeClass(R.ogpa).bg));

      doc.setFillColor(13, 17, 23);
      doc.circle(pieX, pieY, pieR * 0.55, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(240, 201, 122);
      doc.text(R.ogpa.toFixed(2), pieX, pieY + 2, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(123, 136, 150);
      doc.text('/ 10.0', pieX, pieY + 8, { align: 'center' });

      var legX = pieX + pieR + 12, legY = pieY - 10;
      var gcInfo = gradeClass(R.ogpa);
      var gcRgb2 = hexToRgb(gcInfo.bg);
      
      doc.setFillColor(gcRgb2[0], gcRgb2[1], gcRgb2[2]);
      doc.roundedRect(legX, legY, 6, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(232, 237, 243);
      doc.text('OGPA: ' + R.ogpa.toFixed(2) + ' (' + gcInfo.label + ')', legX + 9, legY + 5);

      doc.setFillColor(74, 85, 104);
      doc.roundedRect(legX, legY + 10, 6, 6, 1, 1, 'F');
      doc.text('Remaining: ' + (10 - R.ogpa).toFixed(2), legX + 9, legY + 15);

      doc.setFillColor(78, 203, 164);
      doc.roundedRect(legX, legY + 22, 6, 6, 1, 1, 'F');
      doc.setTextColor(78, 203, 164);
      doc.text(R.percent.toFixed(2) + '%', legX + 9, legY + 27);
      doc.setTextColor(123, 136, 150);
      doc.text('Percentage Equivalent', legX + 9 + 22, legY + 27);

      chartY = pieY + pieR + 16;

      if (R.allCourseData && R.allCourseData.length) {
        var allCourses = [];
        R.allCourseData.forEach(function(sem) {
          sem.courses.forEach(function(c) { allCourses.push(c); });
        });

        var groups = { outstanding: 0, good: 0, average: 0, below: 0, arrear: 0 };
        allCourses.forEach(function(c) {
          if (c.isRA) groups.arrear++;
          else if (c.gradeVal >= 9) groups.outstanding++;
          else if (c.gradeVal >= 7) groups.good++;
          else if (c.gradeVal >= 5) groups.average++;
          else groups.below++;
        });

        var total = allCourses.length;
        var pieData = [
          { label: 'Outstanding (S/A)', count: groups.outstanding, color: [61, 220, 151] },
          { label: 'Good (B/C)', count: groups.good, color: [79, 156, 249] },
          { label: 'Average (D/E)', count: groups.average, color: [240, 176, 96] },
          { label: 'Below Avg', count: groups.below, color: [224, 92, 106] },
          { label: 'Arrear (RA/AB)', count: groups.arrear, color: [100, 116, 139] }
        ].filter(function(p) { return p.count > 0; });

        if (chartY > H - 80) { doc.addPage(); pageBg(doc, W, H); chartY = 30; }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(212, 168, 83);
        doc.text('SUBJECT PERFORMANCE DISTRIBUTION', 20, chartY);
        chartY += 8;

        var pie2X = 50, pie2Y = chartY + 32, pie2R = 26;
        doc.setFillColor(28, 35, 48);
        doc.circle(pie2X, pie2Y, pie2R + 2, 'F');

        var startAngle = 0;
        pieData.forEach(function(p) {
          if (p.count === 0) return;
          var sweep = (p.count / total) * 360;
          drawPieSlice(doc, pie2X, pie2Y, pie2R, startAngle, startAngle + sweep, p.color);
          startAngle += sweep;
        });

        doc.setFillColor(13, 17, 23);
        doc.circle(pie2X, pie2Y, pie2R * 0.45, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(232, 237, 243);
        doc.text(String(total), pie2X, pie2Y + 2, { align: 'center' });
        doc.setFontSize(7);
        doc.setTextColor(123, 136, 150);
        doc.text('subjects', pie2X, pie2Y + 8, { align: 'center' });

        var leg2X = pie2X + pie2R + 12;
        var leg2Y = pie2Y - (pieData.length * 9) / 2;

        pieData.forEach(function(p, i) {
          doc.setFillColor(p.color[0], p.color[1], p.color[2]);
          doc.roundedRect(leg2X, leg2Y + i * 11, 6, 6, 1, 1, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(232, 237, 243);
          var pct = ((p.count / total) * 100).toFixed(1);
          doc.text(p.label + '  —  ' + p.count + ' (' + pct + '%)', leg2X + 9, leg2Y + i * 11 + 5);
        });

        chartY = pie2Y + pie2R + 18;
      }

      var totalClearedArrears = 0;
      if (R.allCourseData) {
        R.allCourseData.forEach(function(sem) {
          sem.courses.forEach(function(c) { if (c.isArrearCleared) totalClearedArrears++; });
        });
      }

      if (totalClearedArrears > 0) {
        doc.setFontSize(9);
        doc.setTextColor(56, 189, 248);
        doc.text('★ ' + totalClearedArrears + ' arrear subject(s) detected and auto-placed in original semester for accurate OGPA calculation.', 20, chartY);
        chartY += 8;
      }

      pageFooter(doc, W, H, today);

      // Save logic: we extract the generated PDF as a Blob, then append our custom
      // embedded UI state safely at the end of the file so we can parse it back later!
      var safeFileName = 'Report of ' + name + '.pdf';
      var pdfBlob = doc.output('blob');
      
      var payload = {
          uiState: window.app ? window.app.extractState() : {},
          studentInfo: { name: name, regNo: regNo, dept: dept, year: year, extra: extra }
      };
      
      var appendedText = "\n%%ANNAMALAI_CALC_DATA_BEGIN%%" + encodeURIComponent(JSON.stringify(payload)) + "%%ANNAMALAI_CALC_DATA_END%%\n";
      
      var finalBlob = new Blob([pdfBlob, appendedText], { type: 'application/pdf' });
      var url = URL.createObjectURL(finalBlob);
      var a = document.createElement('a');
      a.href = url;
      a.download = safeFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 100);
    }
  };
})();