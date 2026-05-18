import type { Row, Table } from '@tanstack/react-table';

/* =========================================================
   Helpers
========================================================= */

function getExportableColumns<T extends object>(table: Table<T>) {
  return table.getVisibleLeafColumns().filter((column) => !column.id.startsWith('__'));
}

function getHeaderLabel(column: any): string {
  if (typeof column.columnDef.header === 'string') {
    return column.columnDef.header;
  }

  return column.id;
}

function getCellRawValue<T extends object>(row: Row<T>, columnId: string): any {
  const value = row.getValue(columnId);

  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return value;
}

function getCellStringValue<T extends object>(row: Row<T>, columnId: string): string {
  const value = getCellRawValue(row, columnId);

  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getSafeFileName(fileName: string, extension: string) {
  const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;

  if (fileName.toLowerCase().endsWith(cleanExtension.toLowerCase())) {
    return fileName;
  }

  return `${fileName}${cleanExtension}`;
}

function normalizeSheetName(name: string) {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim();

  if (!cleaned) return 'Sheet1';

  return cleaned.substring(0, 31);
}

function getGlobalGC() {
  return typeof window !== 'undefined' ? (window as any).GC : (globalThis as any).GC;
}

function resolveGC(spreadSheetsModule: any) {
  /**
   * Different bundlers expose MESCIUS/SpreadJS differently:
   * - module.default
   * - module.GC
   * - module itself
   * - window.GC / globalThis.GC
   */
  return getGlobalGC() || spreadSheetsModule?.default || spreadSheetsModule?.GC || spreadSheetsModule;
}

function resolveExcelIOConstructor(excelIOModule: any, GC: any) {
  /**
   * @mescius/spread-excelio may expose IO directly,
   * or attach it to GC.Spread.Excel.IO as a side effect.
   */
  const globalGC = getGlobalGC();

  const candidates = [
    GC?.Spread?.Excel?.IO,
    globalGC?.Spread?.Excel?.IO,

    excelIOModule?.IO,
    excelIOModule?.Excel?.IO,
    excelIOModule?.Spread?.Excel?.IO,

    excelIOModule?.default?.IO,
    excelIOModule?.default?.Excel?.IO,
    excelIOModule?.default?.Spread?.Excel?.IO,

    /**
     * Some CJS/ESM interop cases expose the constructor itself as default.
     */
    typeof excelIOModule?.default === 'function' ? excelIOModule.default : undefined,
    typeof excelIOModule === 'function' ? excelIOModule : undefined,
  ];

  return candidates.find((candidate) => typeof candidate === 'function');
}

/* =========================================================
   CSV Export
========================================================= */

export function exportCSV<T extends object>(rows: Row<T>[], table: Table<T>, fileName = 'export.csv') {
  const columns = getExportableColumns(table);

  const headers = columns.map((column) => escapeCsv(getHeaderLabel(column)));

  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = getCellStringValue(row, column.id);
        return escapeCsv(value);
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...body].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  downloadBlob(blob, getSafeFileName(fileName, '.csv'));
}

/* =========================================================
   Excel Export using MESCIUS SpreadJS Excel IO
========================================================= */

export async function exportXLSX<T extends object>(rows: Row<T>[], table: Table<T>, fileName = 'export.xlsx') {
  const columns = getExportableColumns(table);

  if (!columns.length) {
    throw new Error('No visible columns available to export.');
  }

  /**
   * MESCIUS packages.
   * @mescius/spread-excelio is the SpreadJS client-side Excel IO plugin
   * used for XLSX export/import. The plugin provides Excel IO save/open behavior.
   * Docs show save(json, successCallback, errorCallback, options).
   */
  const spreadSheetsModule: any = await import('@mescius/spread-sheets');
  const excelIOModule: any = await import('@mescius/spread-excelio');

  const GC = resolveGC(spreadSheetsModule);

  if (!GC?.Spread?.Sheets?.Workbook) {
    throw new Error('MESCIUS SpreadJS Workbook was not found. Please verify @mescius/spread-sheets is installed and imported correctly.');
  }

  const ExcelIOConstructor = resolveExcelIOConstructor(excelIOModule, GC);

  if (!ExcelIOConstructor) {
    console.error('MESCIUS spreadSheetsModule:', spreadSheetsModule);
    console.error('MESCIUS excelIOModule:', excelIOModule);
    console.error('MESCIUS global GC:', getGlobalGC());

    throw new Error(
      'MESCIUS Excel IO constructor was not found. Please verify @mescius/spread-excelio is installed and compatible with @mescius/spread-sheets.'
    );
  }

  const host = document.createElement('div');

  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '-10000px';
  host.style.width = '1200px';
  host.style.height = '800px';
  host.style.opacity = '0';
  host.style.pointerEvents = 'none';

  document.body.appendChild(host);

  let workbook: any;

  try {
    workbook = new GC.Spread.Sheets.Workbook(host, {
      sheetCount: 1,
    });

    workbook.suspendPaint();

    const sheet = workbook.getSheet(0);

    sheet.name(normalizeSheetName(fileName.replace(/\.(xlsx|xls)$/i, '') || 'Export'));

    sheet.suspendPaint();

    const rowCount = rows.length + 1;
    const columnCount = columns.length;

    sheet.setRowCount(rowCount);
    sheet.setColumnCount(columnCount);

    if (sheet.options) {
      sheet.options.rowHeaderVisible = false;
      sheet.options.colHeaderVisible = false;
      sheet.options.gridline = {
        showVerticalGridline: true,
        showHorizontalGridline: true,
      };
    }

    /**
     * Header row
     */
    columns.forEach((column, columnIndex) => {
      const headerLabel = getHeaderLabel(column);

      sheet.setValue(0, columnIndex, headerLabel);

      const estimatedWidth = Math.max(90, Math.min(320, column.getSize ? column.getSize() : 150));

      sheet.setColumnWidth(columnIndex, estimatedWidth);
    });

    /**
     * Body rows
     */
    rows.forEach((row, rowIndex) => {
      columns.forEach((column, columnIndex) => {
        const value = getCellRawValue(row, column.id);

        sheet.setValue(rowIndex + 1, columnIndex, value);
      });
    });

    /**
     * Styling
     */
    const headerRange = sheet.getRange(0, 0, 1, columnCount);

    headerRange.font('bold 10pt Arial');
    headerRange.foreColor('#FFFFFF');
    headerRange.backColor('#1976D2');
    headerRange.hAlign(GC.Spread.Sheets.HorizontalAlign.center);
    headerRange.vAlign(GC.Spread.Sheets.VerticalAlign.center);

    const allRange = sheet.getRange(0, 0, rowCount, columnCount);

    allRange.font('10pt Arial');
    allRange.vAlign(GC.Spread.Sheets.VerticalAlign.top);
    allRange.wordWrap(true);

    sheet.setRowHeight(0, 32);

    for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
      sheet.setRowHeight(rowIndex, 24);
    }

    /**
     * Freeze header row.
     */
    sheet.frozenRowCount(1);

    /**
     * Add Excel-like filter.
     */
    if (GC.Spread.Sheets.Filter?.HideRowFilter && GC.Spread.Sheets.Range) {
      const range = new GC.Spread.Sheets.Range(0, 0, rowCount, columnCount);
      sheet.rowFilter(new GC.Spread.Sheets.Filter.HideRowFilter(range));
    }

    sheet.resumePaint();
    workbook.resumePaint();

    const excelIO = new ExcelIOConstructor();

    const json = workbook.toJSON({
      includeBindingSource: true,
      ignoreFormula: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      excelIO.save(
        json,
        (resultBlob: Blob) => {
          resolve(resultBlob);
        },
        (error: any) => {
          reject(error?.errorMessage || error || new Error('MESCIUS Excel export failed.'));
        },
        {
          xlsxStrictMode: false,
        }
      );
    });

    downloadBlob(blob, getSafeFileName(fileName, '.xlsx'));
  } finally {
    try {
      if (workbook && typeof workbook.destroy === 'function') {
        workbook.destroy();
      }
    } catch {
      // ignore cleanup error
    }

    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }
}

/* =========================================================
   PDF Export
========================================================= */

export async function exportPDF<T extends object>(rows: Row<T>[], table: Table<T>, fileName = 'export.pdf') {
  const columns = getExportableColumns(table);

  const headers = columns.map((column) => getHeaderLabel(column));

  const body = rows.map((row) => columns.map((column) => getCellStringValue(row, column.id)));

  const { jsPDF } = await import('jspdf');

  const autoTableModule: any = await import('jspdf-autotable');

  const autoTable = autoTableModule.default || autoTableModule.autoTable || autoTableModule;

  const doc = new jsPDF({
    orientation: headers.length > 6 ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  autoTable(doc, {
    head: [headers],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
    },
    margin: {
      top: 30,
      left: 20,
      right: 20,
      bottom: 30,
    },
  });

  doc.save(getSafeFileName(fileName, '.pdf'));
}

/* =========================================================
   Universal Export
========================================================= */

export async function exportTableData<T extends object>({
  type,
  rows,
  table,
  fileName,
}: {
  type: 'csv' | 'xlsx' | 'pdf';
  rows: Row<T>[];
  table: Table<T>;
  fileName?: string;
}) {
  const baseFileName = fileName || 'export';

  if (type === 'csv') {
    exportCSV(rows, table, baseFileName);
    return;
  }

  if (type === 'xlsx') {
    await exportXLSX(rows, table, baseFileName);
    return;
  }

  if (type === 'pdf') {
    await exportPDF(rows, table, baseFileName);
  }
}
