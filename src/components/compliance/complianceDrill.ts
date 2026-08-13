import type { DrillRow } from "@/components/dashboard/DashboardDrillPanel";
import { countFindingStatuses, quarterFromWeek, ratingLabel, filterCompleteComplianceReports } from "./complianceConstants";

export type ComplianceDrillKind =
  | "total"
  | "fully"
  | "partially"
  | "non"
  | "violations"
  | "enforcement";

export const COMPLIANCE_DRILL_TITLES: Record<ComplianceDrillKind, string> = {
  total: "All Facility Reports",
  fully: "Fully Compliant Findings",
  partially: "Partially Compliant Findings",
  non: "Non-Compliant Findings",
  violations: "Violations Recorded",
  enforcement: "Enforcement Actions",
};

const statusLabel = (status?: string | null) => {
  const map: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
  };
  return map[status ?? ""] ?? status ?? "—";
};

function reportGeo(r: any) {
  return {
    state_name: r.state?.description ?? null,
    zone_name: r.zone?.description ?? null,
    state_id: r.state_id ?? null,
    zone_id: r.zone_id ?? null,
  };
}

function periodLabel(r: any) {
  const q = r.reporting_quarter ?? quarterFromWeek(Number(r.reporting_week));
  return `Q${q} · ${r.reporting_year}`;
}

export function computeComplianceKpis(reports: any[]) {
  const complete = filterCompleteComplianceReports(reports);
  let fully = 0;
  let partially = 0;
  let non = 0;
  let violations = 0;
  let enforcement = 0;

  for (const r of complete) {
    const fc = r.finding_counts ?? countFindingStatuses(r.findings);
    fully += fc.fully_compliant;
    partially += fc.partially_compliant;
    non += fc.non_compliant;
    if ((r.violations ?? []).length > 0) violations += 1;
    if ((r.enforcement_actions ?? []).length > 0) enforcement += 1;
  }

  return {
    total: reports.length,
    fully,
    partially,
    non,
    violations,
    enforcement,
  };
}

export function buildComplianceDrillRows(reports: any[], kind: ComplianceDrillKind): DrillRow[] {
  const complete = filterCompleteComplianceReports(reports);
  if (kind === "total") {
    return reports.map((r) => {
      const fc = r.finding_counts ?? countFindingStatuses(r.findings);
      const geo = reportGeo(r);
      return {
        id: r.id,
        reference: r.reference_id,
        title: r.facility_name || "—",
        subtitle: `${periodLabel(r)} · ${fc.fully_compliant} fully · ${fc.partially_compliant} partial · ${fc.non_compliant} non · Officer: ${r.officer_name || "—"}`,
        status: statusLabel(r.status),
        date: r.date_submitted,
        ...geo,
      };
    });
  }

  if (kind === "fully" || kind === "partially" || kind === "non") {
    const statusKey =
      kind === "fully" ? "fully_compliant"
        : kind === "partially" ? "partially_compliant"
          : "non_compliant";
    const rows: DrillRow[] = [];
    for (const r of complete) {
      const geo = reportGeo(r);
      for (const f of r.findings ?? []) {
        if (f.status !== statusKey) continue;
        rows.push({
          id: `${r.id}-${f.section}-${f.indicator}`,
          reference: r.reference_id,
          title: r.facility_name || "—",
          subtitle: `${f.section} · ${f.indicator}${f.remarks ? ` · ${f.remarks}` : ""}`,
          status: ratingLabel(f.status),
          date: r.date_submitted,
          ...geo,
        });
      }
    }
    return rows;
  }

  if (kind === "violations") {
    const rows: DrillRow[] = [];
    for (const r of complete) {
      const violations = r.violations ?? [];
      if (!violations.length) continue;
      const geo = reportGeo(r);
      violations.forEach((v: any, idx: number) => {
        rows.push({
          id: `${r.id}-v-${idx}`,
          reference: r.reference_id,
          title: r.facility_name || "—",
          subtitle: `${v.nature_of_violation || "Violation"} · ${v.nhia_act_section || "NHIA Act —"} · ${v.occurrences ?? 0} occurrence(s)${v.action_taken ? ` · Action: ${v.action_taken}` : ""}`,
          status: v.action_taken ? "Action taken" : "Recorded",
          date: r.date_submitted,
          ...geo,
        });
      });
    }
    return rows;
  }

  // enforcement
  const rows: DrillRow[] = [];
  for (const r of complete) {
    const actions = r.enforcement_actions ?? [];
    if (!actions.length) continue;
    const geo = reportGeo(r);
    actions.forEach((e: any, idx: number) => {
      rows.push({
        id: `${r.id}-e-${idx}`,
        reference: r.reference_id,
        title: r.facility_name || "—",
        subtitle: `${e.enforcement_action || "Enforcement"}${e.details ? ` · ${e.details}` : ""}`,
        status: e.enforcement_action || "Enforcement",
        date: r.date_submitted,
        ...geo,
      });
    });
  }
  return rows;
}

export function parseReportIdFromDrillRow(row: DrillRow): number | null {
  if (typeof row.id === "number") return row.id;
  const idMatch = String(row.id).match(/^(\d+)(?:-|$)/);
  return idMatch ? Number(idMatch[1]) : null;
}
