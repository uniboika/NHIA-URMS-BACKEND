/** Lookup lists from Compliance Officer Template.xlsx */

export const OWNERSHIP_OPTIONS = [
  "Public", "Private", "Faith-Based", "Other (Specify)",
];

export const FACILITY_TYPE_OPTIONS = [
  "PHC", "Primary", "Secondary", "Other",
];

export const COMPLAINT_CATEGORIES = [
  "Delay/Denial of Service",
  "Poor Attitude of Staff",
  "Drug Unavailability",
  "Illegal Charges",
  "Other",
];

export const ESCALATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "state_office", label: "State Office" },
  { value: "zonal_office", label: "Zonal Office" },
  { value: "enforcement_department", label: "Enforcement Department" },
];

export const ENFORCEMENT_ACTIONS = [
  "Verbal Warning Issued",
  "Written Compliance Notice Issued",
  "Corrective Action Plan Requested",
  "Escalation to State Office",
  "Escalation to Zonal Office",
  "Escalation to Enforcement Department",
  "Recommendation for Sanctions",
  "None",
];

export const COMPLIANCE_RATINGS = [
  { value: "fully_compliant", label: "Fully Compliant" },
  { value: "partially_compliant", label: "Partially Compliant" },
  { value: "non_compliant", label: "Non-Compliant" },
];

export const CONFIRMATION_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const COMPLIANCE_SECTIONS: Record<string, string[]> = {
  "Service Delivery": [
    "Enrollees received services without denial or delays",
    "Illegal co-payments demanded",
    "Approved benefit package adhered to",
    "Emergency care provided without prior authorization",
    "Referral protocols followed",
  ],
  "Medicines & Consumables": [
    "Prescribed medicines available",
    "NHIA medicines list used",
    "Alternative arrangement during stock-out",
  ],
  "Provider-HMO Interface": [
    "Timely submission of claims",
    "Prompt receipt of payments",
    "Dispute with HMO",
  ],
};

export function currentISOWeek(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function quarterFromWeek(week: number): number {
  return Math.min(4, Math.ceil(week / 13) || 1);
}

export function ratingLabel(v: string): string {
  return COMPLIANCE_RATINGS.find(r => r.value === v)?.label ?? v;
}

export type ComplianceFormStep = "header" | "findings" | "complaints" | "violations" | "enforcement";

export const COMPLIANCE_LIFECYCLE: {
  id: ComplianceFormStep;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  { id: "header", label: "1. Report & Facility", shortLabel: "Report", description: "Report header & facility details" },
  { id: "findings", label: "2. Findings", shortLabel: "Findings", description: "Record compliance findings" },
  { id: "complaints", label: "3. Complaints", shortLabel: "Complaints", description: "Complaint summary for the facility" },
  { id: "violations", label: "4. Violations", shortLabel: "Violations", description: "Violations observed during review" },
  { id: "enforcement", label: "5. Enforcement", shortLabel: "Enforcement", description: "Enforcement actions & final review" },
];

export function complianceStepLabel(step: ComplianceFormStep): string {
  return COMPLIANCE_LIFECYCLE.find(s => s.id === step)?.shortLabel ?? step;
}

export function getComplianceStepCompletion(data: {
  refId?: string | null;
  registered?: boolean;
  findingsCount?: number;
  complaintsReceived?: string | number;
  complaintSummary?: string;
  complaintCategoriesCount?: number;
  resolvedAtFacility?: string | number;
  escalatedTo?: string;
  violationsCount?: number;
  enforcementsCount?: number;
  reviewedBy?: string;
  stateRemarks?: string;
}): Record<ComplianceFormStep, boolean> {
  return {
    header: !!(data.registered || data.refId),
    findings: (data.findingsCount ?? 0) > 0,
    complaints: !!(Number(data.complaintsReceived) || data.complaintSummary?.trim()
      || (data.complaintCategoriesCount ?? 0) > 0
      || Number(data.resolvedAtFacility) > 0
      || (data.escalatedTo && data.escalatedTo !== "none")),
    violations: (data.violationsCount ?? 0) > 0,
    enforcement: (data.enforcementsCount ?? 0) > 0 || !!data.reviewedBy?.trim() || !!data.stateRemarks?.trim(),
  };
}

/** KPI stats and drill-downs only include submitted reports with all mandatory steps complete. */
export function isComplianceReportComplete(report: any): boolean {
  if (report.status !== "submitted" && report.status !== "approved") return false;

  const completion = getComplianceStepCompletion({
    refId: report.reference_id,
    registered: true,
    findingsCount: (report.findings ?? []).length,
    complaintsReceived: report.complaints_received,
    complaintSummary: report.complaint_summary,
    complaintCategoriesCount: parseComplaintCategories(report.complaint_categories).length,
    resolvedAtFacility: report.resolved_at_facility,
    escalatedTo: report.escalated_to,
    violationsCount: (report.violations ?? []).length,
    enforcementsCount: (report.enforcement_actions ?? []).length,
    reviewedBy: report.reviewed_by,
    stateRemarks: report.state_office_remarks,
  });

  return (
    completion.header
    && completion.findings
    && completion.complaints
    && completion.enforcement
  );
}

export function filterCompleteComplianceReports(reports: any[]): any[] {
  return reports.filter(isComplianceReportComplete);
}

export function firstOpenComplianceStep(completion: Record<ComplianceFormStep, boolean>): ComplianceFormStep {
  const open = COMPLIANCE_LIFECYCLE.find(s => !completion[s.id]);
  return open?.id ?? "enforcement";
}

export function nextComplianceStep(step: ComplianceFormStep): ComplianceFormStep | null {
  const idx = COMPLIANCE_LIFECYCLE.findIndex(s => s.id === step);
  if (idx < 0 || idx >= COMPLIANCE_LIFECYCLE.length - 1) return null;
  return COMPLIANCE_LIFECYCLE[idx + 1].id;
}

/** MySQL/Sequelize JSON columns may return a string — normalize to string[] */
export function parseComplaintCategories(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return raw.split(",").map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export type FindingStatusCounts = {
  fully_compliant: number;
  partially_compliant: number;
  non_compliant: number;
};

export function countFindingStatuses(findings: { status?: string }[] | null | undefined): FindingStatusCounts {
  const counts: FindingStatusCounts = {
    fully_compliant: 0,
    partially_compliant: 0,
    non_compliant: 0,
  };
  for (const f of findings ?? []) {
    const key = f.status as keyof FindingStatusCounts;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}
