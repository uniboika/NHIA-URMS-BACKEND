import type { OperationalDataRow, QuarterlyBlock } from "@/lib/api";
import {
  buildSections,
  groupSectionsForGrids,
  formatMetricValue,
  type SectionDef,
} from "@/src/components/annualReportConfig";

export interface StateReportMeta {
  year: number;
  stateName?: string | null;
}

/* ─── Formatting ─────────────────────────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNum(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return formatMetricValue(val, "num");
}

function fmtMoney(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return formatMetricValue(val, "money");
}

function fmtMoneyShort(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(Number(val))) return "—";
  const n = Number(val);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return fmtMoney(n);
}

function pct(part: number, whole: number): number {
  if (!whole || !Number.isFinite(whole)) return 0;
  return Math.min(100, Math.max(0, (part / whole) * 100));
}

function isQuarterlySection(section: SectionDef): boolean {
  return (
    section.columns.length === 5 &&
    section.columns[0]?.label === "Q1" &&
    section.columns[4]?.label === "Sub-Total"
  );
}

function quarterlyBlockFromSection(section: SectionDef, row: OperationalDataRow): QuarterlyBlock {
  const get = (label: string) => {
    const col = section.columns.find((c) => c.label === label);
    const val = col?.get(row);
    return Number(val) || 0;
  };
  return {
    q1: get("Q1"),
    q2: get("Q2"),
    q3: get("Q3"),
    q4: get("Q4"),
    sub_total: get("Sub-Total"),
  };
}

function quarterlyKind(section: SectionDef): "num" | "money" {
  return section.columns[0]?.kind === "money" ? "money" : "num";
}

function isQ4Only(block: QuarterlyBlock): boolean {
  const q1 = block.q1 ?? 0;
  const q2 = block.q2 ?? 0;
  const q3 = block.q3 ?? 0;
  const q4 = block.q4 ?? 0;
  return q1 === 0 && q2 === 0 && q3 === 0 && q4 > 0;
}

function quarterlyCell(val: number, kind: "num" | "money", css: string): string {
  const text = kind === "money" ? fmtMoney(val) : fmtNum(val);
  return `<td class="${css} num">${text}</td>`;
}

function quarterlyTable(
  block: QuarterlyBlock,
  kind: "num" | "money",
  title: string
): string {
  const note = isQ4Only(block)
    ? `<p class="table-note">All activity recorded in Q4 only.</p>`
    : "";

  return `
    <div class="card table-card avoid-break">
      <h3 class="subsection-title">${esc(title)}</h3>
      <table class="data-table quarterly-table">
        <thead>
          <tr>
            <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Sub-Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            ${quarterlyCell(block.q1, kind, "q-muted")}
            ${quarterlyCell(block.q2, kind, "q-muted")}
            ${quarterlyCell(block.q3, kind, "q-muted")}
            ${quarterlyCell(block.q4, kind, "q4-highlight")}
            ${quarterlyCell(block.sub_total, kind, "subtotal-cell")}
          </tr>
        </tbody>
      </table>
      ${note}
    </div>`;
}

function metricTable(section: SectionDef, row: OperationalDataRow): string {
  const rows = section.columns
    .map(
      (col, i) => {
        const val = col.get(row);
        const formatted =
          col.kind === "money"
            ? fmtMoney(val as number)
            : col.kind === "num"
              ? fmtNum(val as number)
              : esc(String(val ?? "—"));
        const align = col.kind === "money" || col.kind === "num" ? "text-right num" : "";
        return `<tr class="${i % 2 === 1 ? "alt" : ""}">
          <td class="metric-label">${esc(col.label)}</td>
          <td class="metric-value ${align}">${formatted}</td>
        </tr>`;
      }
    )
    .join("");

  return `
    <div class="card table-card avoid-break">
      <h3 class="subsection-title">${esc(section.title)}</h3>
      <table class="data-table">
        <thead><tr><th>Metric</th><th class="text-right">Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ─── SVG helpers ────────────────────────────────────────────────────────── */

function iconUsers(): string {
  return `<svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
}

function iconBuilding(): string {
  return `<svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>`;
}

function iconWallet(): string {
  return `<svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h2"/><path d="M2 10h20"/></svg>`;
}

function iconAlert(): string {
  return `<svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
}

function donutChart(percent: number, size = 140): string {
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent < 15 ? "#dc3545" : percent < 50 ? "#f0ad4e" : "#4CAF50";

  return `
    <svg class="donut-chart" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e8e8e8" stroke-width="16"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="16"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"/>
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-pct">${percent.toFixed(1)}%</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-label">Used</text>
    </svg>`;
}

function hBar(label: string, value: number, max: number, formatted: string): string {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return `
    <div class="h-bar-row">
      <div class="h-bar-label">${esc(label)}</div>
      <div class="h-bar-track">
        <div class="h-bar-fill" style="width:${width}%"></div>
      </div>
      <div class="h-bar-value num">${formatted}</div>
    </div>`;
}

/* ─── Section builders ───────────────────────────────────────────────────── */

function kpiCard(icon: string, label: string, value: string): string {
  return `
    <div class="kpi-card avoid-break">
      <div class="kpi-icon-wrap">${icon}</div>
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value num">${value}</div>
    </div>`;
}

function sectionHeader(title: string): string {
  return `<div class="section-header avoid-break">${esc(title.toUpperCase())}</div>`;
}

function buildCover(row: OperationalDataRow, meta: StateReportMeta): string {
  const stateOffice = `${row.state} State Office`;
  return `
    <header class="hero avoid-break">
      <div class="hero-band">
        <div class="logo-placeholder">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <circle cx="32" cy="32" r="30" fill="#ffffff" opacity="0.15"/>
            <text x="32" y="38" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">NHIA</text>
          </svg>
        </div>
        <div class="hero-text">
          <h1 class="hero-org">National Health Insurance Authority</h1>
          <h2 class="hero-state">${esc(stateOffice)}</h2>
          <p class="hero-year">${meta.year} Annual Report</p>
        </div>
        <div class="hero-year-badge">${meta.year}</div>
      </div>
      <div class="hero-meta">
        <span>S/N: ${fmtNum(row.sn)}</span>
        ${row.zone ? `<span>Zone: ${esc(row.zone)}</span>` : ""}
        <span>Reporting Year: ${row.reporting_year}</span>
        <span>Generated: ${esc(new Date().toLocaleString("en-NG"))}</span>
        <span>Full Operational Report (All Sections)</span>
      </div>
    </header>`;
}

function buildExecutiveSummary(row: OperationalDataRow): string {
  const budget = row.approved_budget ?? 0;
  const utilized = row.total_amount_utilized ?? 0;
  const utilPct = pct(utilized, budget);
  const lowUtil = utilPct < 25;

  const kpis = [
    { icon: iconUsers(), label: "Staff Strength", value: fmtNum(row.staff_no) },
    { icon: iconBuilding(), label: "Total Vehicles", value: fmtNum(row.total_vehicles) },
    { icon: iconBuilding(), label: "HCF Under NHIA", value: fmtNum(row.total_hcf_under_nhia) },
    { icon: iconBuilding(), label: "Accredited HCFs", value: fmtNum(row.total_accredited_hcf) },
    { icon: iconUsers(), label: "GIFSHIP Enrolments", value: fmtNum(row.gifship_enrolments.sub_total) },
    { icon: iconUsers(), label: "BHCPF Beneficiaries", value: fmtNum(row.bhcpf_beneficiaries) },
    { icon: iconWallet(), label: "IGR (Annual)", value: fmtMoney(row.igr.sub_total) },
    { icon: iconAlert(), label: "Complaints Registered", value: fmtNum(row.complaints_registered) },
  ];

  const kpiGrid = kpis.map((k) => kpiCard(k.icon, k.label, k.value)).join("");

  return `
    <section class="report-section">
      <h2 class="section-title">Executive Summary</h2>
      <div class="kpi-grid">${kpiGrid}</div>
      <div class="budget-card avoid-break">
        <div class="budget-card-header">
          <h3>Budget Utilization</h3>
          ${lowUtil ? `<span class="badge badge-warning">Low utilization</span>` : ""}
        </div>
        <div class="budget-card-body">
          <div class="budget-summary">
            <p class="budget-main num">
              <strong>${fmtMoneyShort(utilized)}</strong> Utilized of <strong>${fmtMoneyShort(budget)}</strong> Budget
            </p>
            <p class="budget-pct num">${utilPct.toFixed(1)}% Used</p>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill ${lowUtil ? "progress-warning" : ""}" style="width:${utilPct}%"></div>
            </div>
          </div>
          ${lowUtil ? `<p class="budget-warning">Only ${utilPct.toFixed(1)}% of budget utilized</p>` : ""}
        </div>
      </div>
      <p class="coverage-note">
        Data source: Monthly departmental reports · Coverage:
        ${row.months_with_data.finance} finance months,
        ${row.months_with_data.programmes} programmes months,
        ${row.months_with_data.sqa} SQA months
      </p>
    </section>`;
}

function enrolmentQ4Callout(row: OperationalDataRow): string {
  const enrolBlocks = [
    row.gifship_enrolments,
    row.fsship_new_enrolments,
    row.extra_dependants,
    row.additional_dependants,
    row.change_of_provider,
  ];
  const allQ4 = enrolBlocks.every(isQ4Only);
  const anyActivity = enrolBlocks.some((b) => (b.sub_total ?? 0) > 0);
  if (!allQ4 || !anyActivity) return "";

  return `<div class="callout callout-success avoid-break">All enrolments occurred in Q4</div>`;
}

function buildBhcpfSection(row: OperationalDataRow): string {
  const values = [
    { label: "BHCPF Beneficiaries", value: row.bhcpf_beneficiaries ?? 0 },
    { label: "TISHIP Lives", value: row.tiship_lives ?? 0 },
    { label: "SSHIA Lives", value: row.sshia_lives ?? 0 },
    { label: "MHA Lives", value: row.mha_lives ?? 0 },
    { label: "BHCPF Facilities", value: row.bhcpf_facilities ?? 0 },
  ];
  const max = Math.max(...values.map((v) => v.value), 1);

  const bars = values
    .map((v) => hBar(v.label, v.value, max, fmtNum(v.value)))
    .join("");

  return `
    <div class="card avoid-break">
      <h3 class="subsection-title">BHCPF / Scheme Performance</h3>
      <div class="h-bar-chart">${bars}</div>
    </div>`;
}

function renderStandardSection(section: SectionDef, row: OperationalDataRow): string {
  if (section.id === "bhcpf_schemes") return buildBhcpfSection(row);
  if (isQuarterlySection(section)) {
    return quarterlyTable(
      quarterlyBlockFromSection(section, row),
      quarterlyKind(section),
      section.title
    );
  }
  return metricTable(section, row);
}

function buildFinanceSection(row: OperationalDataRow, sections: SectionDef[]): string {
  const budget = row.approved_budget ?? 0;
  const utilized = row.total_amount_utilized ?? 0;
  const remaining = Math.max(0, budget - utilized);
  const utilPct = pct(utilized, budget);
  const lowUtil = utilPct < 25;

  const general = sections.find((s) => s.id === "general");
  const igrSection = sections.find((s) => s.id === "igr");
  const otherFinance = sections.filter((s) => s.id !== "general" && s.id !== "igr");

  return `
    <section class="report-section">
      ${sectionHeader("Finance & Administration")}
      <div class="finance-grid">
        <div class="card budget-viz-card avoid-break">
          <h3 class="subsection-title">Budget Utilization</h3>
          <div class="budget-viz-body">
            ${donutChart(utilPct)}
            <div class="budget-stats">
              <div class="stat-row"><span>Budget Allocation</span><strong class="num">${fmtMoney(budget)}</strong></div>
              <div class="stat-row"><span>Amount Utilized</span><strong class="num">${fmtMoney(utilized)}</strong></div>
              <div class="stat-row"><span>Remaining Balance</span><strong class="num">${fmtMoney(remaining)}</strong></div>
              <div class="stat-row"><span>Utilization</span><strong class="num">${utilPct.toFixed(1)}%</strong></div>
            </div>
          </div>
          ${lowUtil ? `<span class="badge badge-warning badge-block">Only ${utilPct.toFixed(1)}% of budget utilized</span>` : ""}
          <div class="util-bar-lg">
            <div class="util-bar-lg-fill ${lowUtil ? "progress-warning" : ""}" style="width:${utilPct}%"></div>
          </div>
        </div>
        <div class="card igr-card avoid-break">
          <h3 class="subsection-title">IGR</h3>
          <div class="igr-kpi">
            <div class="kpi-icon-wrap">${iconWallet()}</div>
            <div class="kpi-label">Internally Generated Revenue (Annual)</div>
            <div class="kpi-value num">${fmtMoney(row.igr.sub_total)}</div>
          </div>
        </div>
      </div>
      ${general ? metricTable(general, row) : ""}
      ${igrSection ? quarterlyTable(row.igr, "money", igrSection.title) : ""}
      ${otherFinance.map((s) => renderStandardSection(s, row)).join("")}
    </section>`;
}

function buildQualitySection(row: OperationalDataRow, sections: SectionDef[]): string {
  const registered = row.complaints_registered ?? 0;
  const resolved = row.complaints_resolved ?? 0;
  const escalated = row.complaints_escalated ?? 0;
  const resolutionPct = pct(resolved, registered);

  const reqTotal = row.accreditation_requests.sub_total ?? 0;
  const conTotal = row.accreditation_conducted.sub_total ?? 0;
  const accPositive = conTotal >= reqTotal;

  const qaSection = sections.find((s) => s.id === "qa");
  const accReqSection = sections.find((s) => s.id === "accreditation_requests");
  const accConSection = sections.find((s) => s.id === "accreditation_conducted");

  const handledIds = new Set([
    "cemonc", "ffp", "complaints", "qa", "accreditation_requests", "accreditation_conducted",
  ]);
  const remaining = sections.filter((s) => !handledIds.has(s.id));

  return `
    <section class="report-section">
      ${sectionHeader("Quality & Clinical Services")}

      <div class="dual-cards">
        <div class="service-card avoid-break">
          <div class="service-icon">${iconUsers()}</div>
          <h3>CEmONC</h3>
          <p class="service-value num">${fmtNum(row.cemonc_beneficiaries)}</p>
          <p class="service-label">Beneficiaries</p>
          <p class="service-sub num">${fmtNum(row.cemonc_accredited_hcf)} accredited HCFs</p>
        </div>
        <div class="service-card avoid-break">
          <div class="service-icon">${iconUsers()}</div>
          <h3>FFP</h3>
          <p class="service-value num">${fmtNum(row.ffp_beneficiaries)}</p>
          <p class="service-label">Beneficiaries</p>
          <p class="service-sub num">${fmtNum(row.ffp_accredited_facilities)} accredited facilities</p>
        </div>
      </div>

      <div class="card complaints-card avoid-break">
        <h3 class="subsection-title">Complaints Management</h3>
        <div class="complaints-stats">
          <div><span class="complaint-label">Registered</span><strong class="num">${fmtNum(registered)}</strong></div>
          <div><span class="complaint-label">Resolved</span><strong class="num">${fmtNum(resolved)}</strong></div>
          <div><span class="complaint-label">Escalated</span><strong class="num">${fmtNum(escalated)}</strong></div>
        </div>
        <div class="resolution-bar">
          <div class="resolution-done" style="width:${resolutionPct}%"></div>
        </div>
        <p class="resolution-rate num">${resolutionPct.toFixed(1)}% Resolution Rate</p>
        <span class="badge badge-success">${resolutionPct.toFixed(1)}% complaint resolution rate</span>
      </div>

      <div class="card accreditation-card avoid-break">
        <h3 class="subsection-title">Accreditation</h3>
        <div class="accreditation-viz">
          <div class="acc-stat ${accPositive ? "acc-positive" : ""}">
            <span class="acc-number num">${fmtNum(reqTotal)}</span>
            <span class="acc-label">Requests Received</span>
          </div>
          <div class="acc-arrow">→</div>
          <div class="acc-stat acc-positive">
            <span class="acc-number num">${fmtNum(conTotal)}</span>
            <span class="acc-label">Accreditations Conducted</span>
          </div>
        </div>
        ${accPositive ? `<span class="badge badge-success">Positive completion status</span>` : ""}
      </div>

      ${qaSection ? quarterlyTable(row.qa_conducted, "num", qaSection.title) : ""}
      ${accReqSection ? quarterlyTable(row.accreditation_requests, "num", accReqSection.title) : ""}
      ${accConSection ? quarterlyTable(row.accreditation_conducted, "num", accConSection.title) : ""}
      ${remaining.map((s) => renderStandardSection(s, row)).join("")}
    </section>`;
}

function buildProgrammesSection(row: OperationalDataRow, sections: SectionDef[]): string {
  const sectionHtml = sections.map((s) => renderStandardSection(s, row)).join("");

  return `
    <section class="report-section">
      ${sectionHeader("Programmes & Enrolment")}
      ${enrolmentQ4Callout(row)}
      <div class="section-stack">${sectionHtml}</div>
    </section>`;
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #222222;
  background: #f4f4f4;
  -webkit-font-smoothing: antialiased;
  letter-spacing: normal;
  font-variant-numeric: tabular-nums;
}

.num {
  font-variant-numeric: tabular-nums;
  letter-spacing: normal;
  word-spacing: normal;
  white-space: nowrap;
}

.report-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.report-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  overflow: hidden;
}

.report-body { padding: 32px; }

/* Hero */
.hero { background: #ffffff; }
.hero-band {
  background: #1a5c3a;
  color: #ffffff;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.logo-placeholder { flex-shrink: 0; }
.hero-text { flex: 1; }
.hero-org {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: normal;
  margin-bottom: 4px;
}
.hero-state {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: normal;
  opacity: 0.95;
}
.hero-year {
  font-size: 15px;
  font-weight: 500;
  opacity: 0.85;
  margin-top: 4px;
}
.hero-year-badge {
  background: #4CAF50;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  padding: 12px 20px;
  border-radius: 8px;
  letter-spacing: normal;
}
.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 14px 32px;
  font-size: 13px;
  color: #666666;
  border-bottom: 1px solid #e8e8e8;
}

/* Sections */
.report-section { margin-bottom: 32px; }
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a5c3a;
  margin-bottom: 20px;
}
.section-header {
  background: #1a5c3a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
  margin-bottom: 20px;
  letter-spacing: normal;
}
.section-stack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.kpi-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: center;
}
.kpi-icon-wrap {
  color: #1a5c3a;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}
.kpi-icon { width: 28px; height: 28px; }
.kpi-label {
  font-size: 13px;
  color: #666666;
  margin-bottom: 6px;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #222222;
}

/* Budget card */
.budget-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}
.budget-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.budget-card-header h3 { font-size: 15px; font-weight: 700; color: #222222; }
.budget-main { font-size: 15px; color: #222222; margin-bottom: 4px; }
.budget-pct { font-size: 32px; font-weight: 700; color: #1a5c3a; margin-bottom: 12px; }
.budget-warning { font-size: 14px; color: #dc3545; font-weight: 600; margin-top: 10px; }
.progress-wrap { margin-top: 8px; }
.progress-bar {
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 4px;
}
.progress-warning { background: #dc3545; }

/* Badges */
.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}
.badge-warning { background: #fde8ea; color: #dc3545; }
.badge-success { background: #e8f5e9; color: #1a5c3a; }
.badge-block { display: block; text-align: center; margin-top: 12px; }

/* Callout */
.callout {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}
.callout-success {
  background: #e8f5e9;
  color: #1a5c3a;
  border-left: 4px solid #4CAF50;
}

.coverage-note { font-size: 13px; color: #666666; }

/* Cards */
.card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}
.subsection-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a5c3a;
  margin-bottom: 14px;
}

/* Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  background: #1a5c3a;
  color: #ffffff;
  font-weight: 700;
  padding: 10px 12px;
  text-align: left;
  letter-spacing: normal;
}
.data-table th.text-right, .data-table td.text-right { text-align: right; }
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e8e8e8;
}
.data-table tr.alt td { background: #f0faf5; }
.data-table .metric-label { color: #666666; font-weight: 600; }
.data-table .metric-value { font-weight: 700; color: #222222; }
.quarterly-table td { text-align: center; }
.q-muted { color: #aaaaaa !important; }
.q4-highlight {
  color: #1a5c3a !important;
  font-weight: 700 !important;
  background: #f0faf5 !important;
}
.subtotal-cell { font-weight: 700; background: #e8f5e9 !important; }
.table-note {
  font-size: 13px;
  color: #666666;
  font-style: italic;
  margin-top: 8px;
}

/* Horizontal bars */
.h-bar-chart { display: flex; flex-direction: column; gap: 12px; }
.h-bar-row { display: grid; grid-template-columns: 140px 1fr auto; gap: 12px; align-items: center; }
.h-bar-label { font-size: 13px; font-weight: 600; color: #666666; }
.h-bar-track {
  height: 12px;
  background: #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}
.h-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a5c3a, #4CAF50);
  border-radius: 6px;
}
.h-bar-value { font-size: 14px; font-weight: 700; color: #222222; min-width: 80px; text-align: right; }

/* Finance */
.finance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.budget-viz-body {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 12px;
}
.donut-chart .donut-pct { font-size: 22px; font-weight: 700; fill: #222222; }
.donut-chart .donut-label { font-size: 11px; fill: #666666; }
.budget-stats { flex: 1; }
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.stat-row span { color: #666666; }
.stat-row strong { color: #222222; }
.util-bar-lg {
  height: 10px;
  background: #e8e8e8;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 12px;
}
.util-bar-lg-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 5px;
}
.igr-card .igr-kpi { text-align: center; padding: 16px 0; }
.igr-card .kpi-value { font-size: 36px; color: #1a5c3a; }

/* Quality */
.dual-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.service-card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  text-align: center;
}
.service-icon { color: #1a5c3a; margin-bottom: 8px; display: flex; justify-content: center; }
.service-card h3 { font-size: 15px; font-weight: 700; color: #1a5c3a; margin-bottom: 8px; }
.service-value { font-size: 36px; font-weight: 700; color: #222222; }
.service-label { font-size: 14px; color: #666666; }
.service-sub { font-size: 13px; color: #666666; margin-top: 6px; }

.complaints-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  text-align: center;
}
.complaint-label { display: block; font-size: 13px; color: #666666; margin-bottom: 4px; }
.complaints-stats strong { font-size: 28px; font-weight: 700; color: #222222; }
.resolution-bar {
  height: 12px;
  background: #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}
.resolution-done {
  height: 100%;
  background: #4CAF50;
  border-radius: 6px;
}
.resolution-rate { font-size: 15px; font-weight: 700; color: #1a5c3a; margin-bottom: 10px; }

.accreditation-viz {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
}
.acc-stat { text-align: center; }
.acc-number { display: block; font-size: 32px; font-weight: 700; color: #222222; }
.acc-label { font-size: 13px; color: #666666; }
.acc-positive .acc-number { color: #1a5c3a; }
.acc-arrow { font-size: 24px; color: #4CAF50; font-weight: 700; }

/* Print */
@media print {
  body { background: #ffffff; }
  .report-wrapper { max-width: 100%; padding: 0; }
  .report-container { box-shadow: none; border-radius: 0; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}

.report-footer {
  text-align: center;
  padding: 20px 32px;
  font-size: 12px;
  color: #666666;
  border-top: 1px solid #e8e8e8;
}
`;

/* ─── Public API ─────────────────────────────────────────────────────────── */

export function buildStateReportHtml(row: OperationalDataRow, meta: StateReportMeta): string {
  const allSections = buildSections(meta.year, "all", false);
  const dataSections = allSections.filter((s) => s.id !== "all");
  const grids = groupSectionsForGrids(dataSections);

  const programmesGrid = grids.find((g) => g.grid.id === "programmes");
  const financeGrid = grids.find((g) => g.grid.id === "finance");
  const qualityGrid = grids.find((g) => g.grid.id === "quality");

  const body = `
    ${buildCover(row, meta)}
    <div class="report-body">
      ${buildExecutiveSummary(row)}
      ${programmesGrid ? buildProgrammesSection(row, programmesGrid.sections) : ""}
      ${financeGrid ? buildFinanceSection(row, financeGrid.sections) : ""}
      ${qualityGrid ? buildQualitySection(row, qualityGrid.sections) : ""}
    </div>
    <footer class="report-footer">
      ${esc(row.state)} · ${meta.year} · National Health Insurance Authority · State Office Annual Report
    </footer>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NHIA ${esc(row.state)} ${meta.year} Annual Report</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-container">
      ${body}
    </div>
  </div>
</body>
</html>`;
}
