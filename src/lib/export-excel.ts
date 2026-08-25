import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { ProtaData, ProtaItem, ProsemData } from "@/types/modul";
import type { Workspace } from "@/types/workspace";
import { BULAN_NAMES } from "@/lib/constants";

// Helper for cell borders
const applyBorder = (cell: ExcelJS.Cell) => {
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
};

export const exportProtaProsemToExcel = async (
  workspace: Workspace,
  protaData: ProtaData | null,
  prosemSem1: ProsemData | null,
  prosemSem2: ProsemData | null
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ModulAjar.Online";
  wb.created = new Date();

  // 1. Export Prota
  if (protaData?.prota && protaData.prota.length > 0) {
    const isKBC = workspace.curriculum === 'kbc';
    const wsProta = wb.addWorksheet("Program Tahunan");

    // Define columns
    const columns: Partial<ExcelJS.Column>[] = [
      { header: "No", key: "no", width: 5 },
      { header: "Tujuan Pembelajaran", key: "tp", width: 45 },
      { header: "Materi Pokok", key: "materi", width: 40 },
      { header: "JP", key: "jp", width: 8 },
      { header: "Dimensi Profil Lulusan", key: "profil", width: 30 },
    ];
    if (isKBC) columns.push({ header: "Panca Cinta", key: "panca_cinta", width: 20 });
    columns.push({ header: "Keterangan", key: "keterangan", width: 25 });
    
    wsProta.columns = columns;

    // Style Header
    wsProta.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      applyBorder(cell);
    });
    wsProta.getRow(1).height = 30;

    // Add Data
    protaData.prota.forEach((item: ProtaItem) => {
      const rowData: Record<string, any> = {
        no: item.no,
        tp: item.tujuan_pembelajaran,
        materi: item.materi_pokok,
        jp: item.alokasi_jp,
        profil: item.dimensi_profil_lulusan?.join(', ') || item.profil_pelajar_pancasila?.join(', ') || '-',
        keterangan: item.keterangan || ""
      };
      if (isKBC) rowData.panca_cinta = item.panca_cinta || "";
      
      const row = wsProta.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        applyBorder(cell);
        cell.alignment = { vertical: 'top', wrapText: true, horizontal: colNumber === 1 || colNumber === 4 ? 'center' : 'left' };
      });
    });
  }

  // 2. Export Prosem
  const buildProsemSheet = (semData: ProsemData, sheetName: string) => {
    const ws = wb.addWorksheet(sheetName);

    const allWeekKeys: string[] = [];
    semData.months.forEach(m => {
      for (let w = 1; w <= m.mingguCount; w++) {
        allWeekKeys.push(`${m.tahun}-${String(m.bulan).padStart(2, '0')}-W${w}`);
      }
    });

    const eventWeekMap: Record<string, any> = {};
    semData.events.forEach(ev => {
      const key = `${semData.months[0]?.tahun || 2025}-${String(ev.bulan).padStart(2, '0')}-W${ev.mingguKe}`;
      if (allWeekKeys.includes(key)) {
        eventWeekMap[key] = ev;
      }
    });

    // Row 1 & 2: Header arrays
    const headerRow1: any[] = ["No", "Tujuan Pembelajaran", "Materi", "JP"];
    const headerRow2: any[] = ["", "", "", ""];
    
    semData.months.forEach(m => {
      headerRow1.push(`${BULAN_NAMES[m.bulan]?.substring(0, 3)} ${m.tahun}`);
      for (let i = 1; i < m.mingguCount; i++) headerRow1.push("");
      for (let w = 1; w <= m.mingguCount; w++) headerRow2.push(w);
    });

    ws.addRow(headerRow1);
    ws.addRow(headerRow2);

    // Merge & Style Headers
    ws.mergeCells(1, 1, 2, 1); // No
    ws.mergeCells(1, 2, 2, 2); // TP
    ws.mergeCells(1, 3, 2, 3); // Materi
    ws.mergeCells(1, 4, 2, 4); // JP

    let currentCol = 5; // 1-based index
    semData.months.forEach(m => {
      if (m.mingguCount > 1) {
        ws.mergeCells(1, currentCol, 1, currentCol + m.mingguCount - 1);
      }
      currentCol += m.mingguCount;
    });

    // Header styling
    [1, 2].forEach(rowIndex => {
      ws.getRow(rowIndex).eachCell((cell) => {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        applyBorder(cell);
      });
    });
    ws.getRow(1).height = 20;

    // Define Columns Width
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 40;
    ws.getColumn(3).width = 30;
    ws.getColumn(4).width = 6;
    for (let i = 5; i < 5 + allWeekKeys.length; i++) {
      ws.getColumn(i).width = 4;
    }

    // Data Rows
    semData.rows.forEach(rowData => {
      const rowDataArray = [rowData.no, rowData.tujuan_pembelajaran, rowData.materi_pokok, rowData.alokasi_jp];
      
      allWeekKeys.forEach(wk => {
        const cell = rowData.weeks[wk];
        const event = eventWeekMap[wk];
        
        if (event) {
          rowDataArray.push("");
        } else {
          rowDataArray.push(cell?.hasActivity ? "✓" : "");
        }
      });
      
      const row = ws.addRow(rowDataArray);
      row.eachCell((cell, colNumber) => {
        applyBorder(cell);
        cell.alignment = { 
          vertical: 'top', 
          wrapText: true, 
          horizontal: (colNumber === 1 || colNumber === 4 || colNumber >= 5) ? 'center' : 'left' 
        };
      });
    });

    // Event Rows
    semData.events.forEach(ev => {
      const evRowData: any[] = [`${ev.nama} (${ev.tipe})`, "", "", ""];
      allWeekKeys.forEach(wk => {
        const weekBulan = parseInt(wk.split('-')[1]);
        const weekNum = parseInt(wk.split('W')[1]);
        const isThisWeek = weekBulan === ev.bulan && weekNum === ev.mingguKe;
        evRowData.push(isThisWeek ? "■" : "");
      });
      
      const row = ws.addRow(evRowData);
      
      // Merge first 4 cols
      ws.mergeCells(row.number, 1, row.number, 4);
      
      row.eachCell((cell, colNumber) => {
        applyBorder(cell);
        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { bold: true, color: { argb: 'FF4B5563' } }; // Gray 600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Gray 50
        } else if (colNumber >= 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (cell.value === "■") {
            cell.font = { color: { argb: 'FF9CA3AF' } }; // Gray 400
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Gray 100
          }
        }
      });
    });
  };

  if (prosemSem1 && prosemSem1.rows.length > 0) buildProsemSheet(prosemSem1, "Program Semester 1");
  if (prosemSem2 && prosemSem2.rows.length > 0) buildProsemSheet(prosemSem2, "Program Semester 2");

  if (wb.worksheets.length === 0) {
    alert("Data Prota / Prosem kosong, tidak ada yang bisa diekspor.");
    return;
  }

  // Save the file
  const buffer = await wb.xlsx.writeBuffer();
  const safeFilename = `${workspace.subject}_Kls${workspace.grade}_ProtaProsem.xlsx`.replace(/[^a-z0-9_.-]/gi, '_');
  saveAs(new Blob([buffer]), safeFilename);
};
