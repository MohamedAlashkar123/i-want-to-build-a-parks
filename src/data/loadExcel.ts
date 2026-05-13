import ExcelJS from 'exceljs';

export type ExcelSheetSummary = {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  firstRowValues: Array<string | number | boolean | null>;
};

export const excelFileName = 'Parks CCTV Inventory v4.xlsx';

const excelFileUrl = `/${excelFileName}`;

function normalizeCellValue(value: ExcelJS.CellValue): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text;
  }

  if (typeof value === 'object' && 'result' in value) {
    return normalizeCellValue(value.result as ExcelJS.CellValue);
  }

  return String(value);
}

export async function loadExcelSummary(): Promise<ExcelSheetSummary[]> {
  const response = await fetch(excelFileUrl);

  if (!response.ok) {
    throw new Error('تعذر تحميل ملف البيانات. يرجى التأكد من وجود الملف داخل مجلد public.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  return workbook.worksheets.map((worksheet) => {
    const firstRow = worksheet.getRow(1);
    const firstRowValues = Array.isArray(firstRow.values)
      ? firstRow.values.slice(1).map((value) => normalizeCellValue(value as ExcelJS.CellValue))
      : [];

    return {
      sheetName: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      firstRowValues,
    };
  });
}
