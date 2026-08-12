import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";
import type { OperationalDataRow } from "@/lib/api";
import {
  flattenTableColumns,
  reportTypeLabel,
  formatMetricValue,
  type ReportTypeId,
  type SectionDef,
} from "@/src/components/annualReportConfig";
import { buildStateReportHtml } from "./annualReportStateHtml";

export interface ExportMeta {
  year: number;
  reportType: ReportTypeId;
  title: string;
  stateSelected: boolean;
  zoneName?: string | null;
  stateName?: string | null;
}

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;

const BRAND: [number, number, number] = [26, 92, 58];
const BRAND_LIGHT: [number, number, number] = [240, 250, 245];
const TEXT_MUTED: [number, number, number] = [102, 102, 102];

function slugify(text: string): string {
  return text.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60);
}

function buildFilename(meta: ExportMeta, ext: string): string {
  const scope = meta.stateName ? slugify(meta.stateName) : "All_States";
  return `NHIA_Annual_Report_${meta.year}_${scope}_${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function cellValue(
  row: OperationalDataRow,
  col: { get: (r: OperationalDataRow) => string | number | null | undefined; kind: "text" | "num" | "money" }
): string {
  return formatMetricValue(col.get(row), col.kind);
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export function downloadAnnualReportExcel(
  rows: OperationalDataRow[],
  sections: SectionDef[],
  meta: ExportMeta
) {
  if (!rows.length) return;

  const columns = flattenTableColumns(sections);
  const headers = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((col) => cellValue(row, col)));

  const ws = XLSX.utils.aoa_to_sheet([
    [meta.title],
    [`Year: ${meta.year}`, `Report type: ${reportTypeLabel(meta.reportType)}`],
    [],
    headers,
    ...body,
  ]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.min(Math.max(h.length, 12), 28) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Annual Report");
  XLSX.writeFile(wb, buildFilename(meta, "xlsx"));
}

// ─── HTML → PDF (state dashboard) ─────────────────────────────────────────────

const CAPTURE_SCALE = 2;

/** Slice a tall canvas into full PDF pages with no gaps between pages */
function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement): void {
  const pdfWidth = PAGE_W;
  const pdfHeight = PAGE_H;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Height in canvas pixels that fits one PDF page
  const pageSliceHeight = Math.floor((pdfHeight / pdfWidth) * canvasWidth);
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvasHeight) {
    const sliceHeight = Math.min(pageSliceHeight, canvasHeight - offsetY);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvasWidth;
    sliceCanvas.height = sliceHeight;

    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) break;

    ctx.drawImage(
      canvas,
      0, offsetY, canvasWidth, sliceHeight,
      0, 0, canvasWidth, sliceHeight
    );

    const slicePdfHeight = (sliceHeight * pdfWidth) / canvasWidth;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      sliceCanvas.toDataURL("image/png", 1.0),
      "PNG",
      0,
      0,
      pdfWidth,
      slicePdfHeight
    );

    offsetY += sliceHeight;
    pageIndex += 1;
  }
}

async function renderHtmlToPdf(html: string, filename: string): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "900px";
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create export frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 500);
  });

  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  await new Promise((r) => setTimeout(r, 400));

  const target = doc.querySelector(".report-container") as HTMLElement | null;
  if (!target) {
    document.body.removeChild(iframe);
    throw new Error("Report container not found");
  }

  const contentHeight = target.scrollHeight;
  iframe.style.height = `${contentHeight + 40}px`;
  await new Promise((r) => setTimeout(r, 200));

  const canvas = await html2canvas(target, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: "#f4f4f4",
    width: 900,
    windowWidth: 900,
    height: contentHeight,
    windowHeight: contentHeight,
    logging: false,
  });

  document.body.removeChild(iframe);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  addCanvasToPdf(pdf, canvas);
  pdf.save(filename);
}

/**
 * Per-state PDF — executive dashboard layout via self-contained HTML.
 * Always exports the full operational report regardless of UI filter.
 */
export async function downloadAnnualReportPdfState(
  row: OperationalDataRow,
  meta: ExportMeta
): Promise<void> {
  const html = buildStateReportHtml(row, {
    year: meta.year,
    stateName: meta.stateName,
  });
  await renderHtmlToPdf(html, buildFilename(meta, "pdf"));
}

/** Optional: download the same report as a self-contained HTML file */
export function downloadAnnualReportHtmlState(
  row: OperationalDataRow,
  meta: ExportMeta
): void {
  const html = buildStateReportHtml(row, { year: meta.year, stateName: meta.stateName });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(meta, "html");
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF table — all states ───────────────────────────────────────────────────

function drawBrandHeader(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NATIONAL HEALTH INSURANCE AUTHORITY", MARGIN, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("State Office Operational Annual Report", MARGIN, 16);
  doc.setFontSize(7);
  doc.text(subtitle, PAGE_W - MARGIN, 14, { align: "right" });
}

export function downloadAnnualReportPdfTable(
  rows: OperationalDataRow[],
  sections: SectionDef[],
  meta: ExportMeta
) {
  if (!rows.length) return;

  const columns = flattenTableColumns(sections);
  const headers = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((col) => cellValue(row, col)));

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  drawBrandHeader(doc, meta.title);

  let y = 28;
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Generated ${new Date().toLocaleString("en-NG")}`, MARGIN, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body,
    styles: { fontSize: 5.5, cellPadding: 1.2, overflow: "linebreak" },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: BRAND_LIGHT },
    margin: { left: 8, right: 8 },
  });

  doc.save(buildFilename(meta, "pdf"));
}

export async function downloadAnnualReport(
  format: "pdf" | "excel",
  rows: OperationalDataRow[],
  sections: SectionDef[],
  meta: ExportMeta
): Promise<void> {
  if (!rows.length) {
    throw new Error("No data to export");
  }

  if (format === "excel") {
    downloadAnnualReportExcel(rows, sections, meta);
    return;
  }

  if (meta.stateSelected) {
    await downloadAnnualReportPdfState(rows[0], meta);
  } else {
    downloadAnnualReportPdfTable(rows, sections, meta);
  }
}
