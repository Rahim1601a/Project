import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Row, Table } from '@tanstack/react-table';

/* =========================================================
   CSV Export
========================================================= */

export function exportCSV<T extends object>(rows: Row<T>[], table: Table<T>, file = 'export.csv') {
  const columns = table.getAllColumns().filter((c) => !c.id.startsWith('__'));
  const header = columns.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row.getValue(c.id) ?? '';
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
  
  // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + `${header}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', file);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* =========================================================
   Excel (XML) Export
========================================================= */

export function exportXLSX<T extends object>(rows: Row<T>[], table: Table<T>, file = 'export.xlsx') {
  const columns = table.getAllColumns().filter((c) => !c.id.startsWith('__'));
  const header = columns.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));

  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Sheet1"><Table>`;

  xml += '<Row>';
  header.forEach((h: string) => {
    xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
  });
  xml += '</Row>';

  rows.forEach((row) => {
    xml += '<Row>';
    columns.forEach((c) => {
      const val = row.getValue(c.id) ?? '';
      xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', file);
  link.click();
}

/* =========================================================
   PDF Export
========================================================= */

export function exportPDF<T extends object>(rows: Row<T>[], table: Table<T>, file = 'export.pdf') {
  const columns = table.getAllColumns().filter((c) => !c.id.startsWith('__'));
  const headers = columns.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
  const body = rows.map((row) => columns.map((c) => row.getValue(c.id) ?? ''));

  const doc = new jsPDF();
  autoTable(doc, {
    head: [headers],
    body: body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [25, 118, 210] },
  });
  doc.save(file);
}
