import * as React from "react";
import { motion } from "motion/react";
import {
  MapPin, Calendar, Building2, Users, Wallet, Heart, Baby,
  AlertTriangle, ShieldCheck, Award, Megaphone, Handshake,
  Scale, BarChart3, Layers, Landmark, Stethoscope,
} from "lucide-react";
import type { OperationalDataRow } from "@/lib/api";
import type { SectionDef, ReportTypeId } from "./annualReportConfig";
import { reportTypeLabel, groupSectionsForGrids, formatMetricValue, isQuarterlySection, quarterColumnClasses } from "./annualReportConfig";

export { formatMetricValue };

const SECTION_THEME: Record<string, { icon: React.ElementType; accent: string; light: string; border: string }> = {
  general: { icon: Building2, accent: "#059669", light: "#ecfdf5", border: "#a7f3d0" },
  cemonc: { icon: Heart, accent: "#e11d48", light: "#fff1f2", border: "#fecdd3" },
  ffp: { icon: Baby, accent: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe" },
  gifship_enrolments: { icon: Users, accent: "#16a34a", light: "#f0fdf4", border: "#bbf7d0" },
  gifship_premium: { icon: Wallet, accent: "#2563eb", light: "#eff6ff", border: "#bfdbfe" },
  ops: { icon: Stethoscope, accent: "#0891b2", light: "#ecfeff", border: "#a5f3fc" },
  fsship_enrolments: { icon: Users, accent: "#ea580c", light: "#fff7ed", border: "#fed7aa" },
  extra_dependants: { icon: Users, accent: "#0284c7", light: "#f0f9ff", border: "#bae6fd" },
  extra_dependant_premium: { icon: Wallet, accent: "#4f46e5", light: "#eef2ff", border: "#c7d2fe" },
  additional_dependants: { icon: Users, accent: "#0d9488", light: "#f0fdfa", border: "#99f6e4" },
  change_of_provider: { icon: Layers, accent: "#d97706", light: "#fffbeb", border: "#fde68a" },
  bhcpf_schemes: { icon: BarChart3, accent: "#9333ea", light: "#faf5ff", border: "#e9d5ff" },
  complaints: { icon: AlertTriangle, accent: "#f59e0b", light: "#fffbeb", border: "#fde68a" },
  igr: { icon: Wallet, accent: "#1d4ed8", light: "#eff6ff", border: "#93c5fd" },
  qa: { icon: ShieldCheck, accent: "#0d9488", light: "#f0fdfa", border: "#5eead4" },
  accreditation_requests: { icon: Award, accent: "#ca8a04", light: "#fefce8", border: "#fde047" },
  accreditation_conducted: { icon: Award, accent: "#65a30d", light: "#f7fee7", border: "#bef264" },
  marketing: { icon: Megaphone, accent: "#db2777", light: "#fdf2f8", border: "#f9a8d4" },
  stakeholders_media: { icon: Handshake, accent: "#475569", light: "#f8fafc", border: "#cbd5e1" },
  reconciliation: { icon: Scale, accent: "#15803d", light: "#f0fdf4", border: "#86efac" },
};

const DEFAULT_THEME = { icon: BarChart3, accent: "#145c3f", light: "#f0fdf7", border: "#d4e8dc" };

const GRID_UI: Record<string, { subtitle: string; icon: React.ElementType; headerBg: string }> = {
  programmes: {
    subtitle: "GIFSHIP, FSSHIP, schemes & outreach",
    icon: Users,
    headerBg: "from-green-600 to-emerald-700",
  },
  finance: {
    subtitle: "Budget, IGR & reconciliation",
    icon: Landmark,
    headerBg: "from-blue-600 to-indigo-700",
  },
  quality: {
    subtitle: "CEmONC, FFP, QA & complaints",
    icon: ShieldCheck,
    headerBg: "from-teal-600 to-cyan-700",
  },
};

function enrichGrids(dataSections: SectionDef[]) {
  return groupSectionsForGrids(dataSections).map(({ grid, sections }) => ({
    grid: { ...grid, ...GRID_UI[grid.id] },
    sections,
  }));
}

function getTheme(sectionId: string) {
  return SECTION_THEME[sectionId] ?? DEFAULT_THEME;
}

function QuarterlyTiles({ section, row }: { section: SectionDef; row: OperationalDataRow }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-500">
        Quarterly breakdown (sums from monthly reports per quarter)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {section.columns.map((col) => {
          const qClass = quarterColumnClasses(col.label, "cell");
          return (
            <div
              key={col.key}
              className={`rounded-xl px-3 py-2.5 border ${qClass || "bg-white/80 border-white"}`}
            >
              <p className="text-[10px] font-bold uppercase opacity-80">{col.label}</p>
              <p className="text-base font-black tabular-nums mt-1">
                {formatMetricValue(col.get(row), col.kind)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportTypeCard({ section, row }: { section: SectionDef; row: OperationalDataRow }) {
  const theme = getTheme(section.id);
  const Icon = theme.icon;
  const quarterly = isQuarterlySection(section);

  const headline = quarterly
    ? formatMetricValue(section.columns[4]?.get(row), section.columns[4]?.kind ?? "num")
    : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ backgroundColor: theme.light, borderColor: theme.border }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/60">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">{section.title}</p>
          {headline && (
            <p className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: theme.accent }}>
              Annual total: {headline}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        {quarterly ? (
          <QuarterlyTiles section={section} row={row} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.columns.map((col) => (
              <div
                key={col.key}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-white px-4 py-3"
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase leading-tight flex-1">
                  {col.label}
                </span>
                <span className="text-base font-black tabular-nums shrink-0" style={{ color: theme.accent }}>
                  {formatMetricValue(col.get(row), col.kind)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportGridColumn({
  grid,
  sections,
  row,
  index,
  exportMode,
}: {
  grid: { id: string; title: string; subtitle: string; icon: React.ElementType; headerBg: string };
  sections: SectionDef[];
  row: OperationalDataRow;
  index: number;
  exportMode?: boolean;
}) {
  const GridIcon = grid.icon;
  if (!sections.length) return null;

  const inner = (
    <>
      <div className={`px-4 py-3.5 bg-gradient-to-r ${grid.headerBg} text-white shrink-0`}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <GridIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{grid.title}</p>
            <p className="text-[10px] text-white/75">{grid.subtitle}</p>
          </div>
        </div>
        <p className="text-[10px] font-semibold mt-2 text-white/60">
          {sections.length} report type{sections.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="p-4 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
        {sections.map((section) => (
          <ReportTypeCard key={section.id} section={section} row={row} />
        ))}
      </div>
    </>
  );

  const className =
    "flex flex-col rounded-2xl border border-[#d4e8dc] bg-white shadow-sm overflow-hidden h-full";

  if (exportMode) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={className}
    >
      {inner}
    </motion.div>
  );
}

function StateHero({
  row,
  year,
  reportType,
}: {
  row: OperationalDataRow;
  year: number;
  reportType: ReportTypeId;
}) {
  const initials = row.state
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickStats = [
    { label: "GIFSHIP", value: formatMetricValue(row.gifship_enrolments.sub_total, "num") },
    { label: "IGR", value: formatMetricValue(row.igr.sub_total, "money") },
    { label: "Complaints", value: formatMetricValue(row.complaints_registered, "num") },
  ].filter((s) => s.value !== "—");

  return (
    <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#0f3d2a] via-[#145c3f] to-[#1a7a52] text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black shadow-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-black tracking-tight">{row.state}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                #{row.sn}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
              {row.zone && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {row.zone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {year}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold border border-white/20">
                {reportTypeLabel(reportType)}
              </span>
            </div>
          </div>
        </div>

        {quickStats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {quickStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-2 text-center"
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">{s.label}</p>
                <p className="text-sm font-black tabular-nums truncate" title={s.value}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AnnualReportDetailView({
  rows,
  sections,
  year,
  reportType,
  exportMode = false,
}: {
  rows: OperationalDataRow[];
  sections: SectionDef[];
  year: number;
  reportType: ReportTypeId;
  /** Static layout for PDF capture — matches on-screen detail view */
  exportMode?: boolean;
}) {
  const dataSections = sections.filter((s) => s.id !== "all");

  const gridClass = (count: number) => {
    if (exportMode) {
      if (count >= 3) return "grid-cols-3";
      if (count === 2) return "grid-cols-2";
      return "grid-cols-1";
    }
    if (count >= 3) return "grid-cols-1 lg:grid-cols-3";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1";
  };

  return (
    <div className="w-full bg-white">
      {rows.map((row, rowIndex) => {
        const grids = enrichGrids(dataSections);

        const content = (
          <>
            <StateHero row={row} year={year} reportType={reportType} />

            <div className="p-4 sm:p-6 bg-gradient-to-b from-[#f8fdfb] to-white">
              {grids.length > 0 ? (
                <div className={`grid gap-5 items-start ${gridClass(grids.length)}`}>
                  {grids.map(({ grid, sections: gridSections }, i) => (
                    <ReportGridColumn
                      key={grid.id}
                      grid={grid}
                      sections={gridSections}
                      row={row}
                      index={i}
                      exportMode={exportMode}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400 py-8">No report sections to display</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#e8f5ee] bg-[#f0fdf7]/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#5a7a6a]">
              <span>
                Computed from approved monthly departmental reports — not the manual annual submission form
              </span>
              <span className="font-semibold tabular-nums">
                {row.months_with_data.finance}F · {row.months_with_data.programmes}P · {row.months_with_data.sqa}SQA months
              </span>
            </div>
          </>
        );

        const articleClass =
          "rounded-3xl border border-[#d4e8dc] bg-white shadow-lg shadow-emerald-900/5 overflow-hidden";

        if (exportMode) {
          return (
            <article key={row.state_id} className={articleClass}>
              {content}
            </article>
          );
        }

        return (
          <motion.article
            key={row.state_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.06, duration: 0.4 }}
            className={articleClass}
          >
            {content}
          </motion.article>
        );
      })}
    </div>
  );
}
