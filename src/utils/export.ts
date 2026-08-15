import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports tabular data as a styled CSV file
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports data as a formatted Excel (.xlsx) workbook
 */
export function exportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = headers.map((_, i) => {
    let maxLen = headers[i].length;
    rows.forEach(r => {
      const cellVal = String(r[i] || '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exports a professional PDF financial report with Qasber Technologies LLP header
 */
export function exportReportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  totalsRow?: string[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QASBER TECHNOLOGIES LLP', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Command Center Report', 14, 19);

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr}`, 196, 12, { align: 'right' });
  doc.text(`Doc Ref: QAS-RPT-${Date.now().toString().slice(-6)}`, 196, 19, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 44);

  const tableBody = [...rows];
  if (totalsRow) {
    tableBody.push(totalsRow);
  }

  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: function (data) {
      if (totalsRow && data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [224, 231, 255];
        data.cell.styles.textColor = [30, 27, 75];
      }
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Qasber Technologies LLP • Confidential Financial Document • Page ' + i + ' of ' + pageCount,
      105,
      287,
      { align: 'center' }
    );
  }

  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`${safeFilename}_report.pdf`);
}
