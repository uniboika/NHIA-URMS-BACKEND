import type { OperationalDataRow, QuarterlyBlock } from "@/lib/api";

export const REPORT_TYPES = [
  { id: "all", label: "Full Operational Report" },
  { id: "general", label: "General Information" },
  { id: "cemonc", label: "CEmONC" },
  { id: "ffp", label: "FFP" },
  { id: "gifship_enrolments", label: "GIFSHIP Enrolments" },
  { id: "gifship_premium", label: "Premium on GIFSHIP" },
  { id: "ops", label: "OPS" },
  { id: "fsship_enrolments", label: "FSSHIP Enrolments" },
  { id: "extra_dependants", label: "Extra Dependants" },
  { id: "extra_dependant_premium", label: "Extra-Dependant Premium" },
  { id: "additional_dependants", label: "Additional Dependants" },
  { id: "change_of_provider", label: "Change of Provider" },
  { id: "bhcpf_schemes", label: "BHCPF / Schemes" },
  { id: "complaints", label: "Complaints" },
  { id: "igr", label: "IGR" },
  { id: "qa", label: "Quality Assurance" },
  { id: "accreditation_requests", label: "Accreditation Requests" },
  { id: "accreditation_conducted", label: "Accreditation Conducted" },
  { id: "marketing", label: "Marketing / Advocacy" },
  { id: "stakeholders_media", label: "Stakeholders / Media" },
  { id: "reconciliation", label: "Reconciliation / Indebtedness" },
] as const;

export type ReportTypeId = (typeof REPORT_TYPES)[number]["id"];

type ColKind = "text" | "num" | "money";

function hasFractionalPart(n: number): boolean {
  return Math.abs(n % 1) > 1e-9;
}

export function formatMetricValue(
  val: string | number | null | undefined,
  kind: ColKind
): string {
  if (val === null || val === undefined || val === "") return "—";
  if (kind === "text") return String(val);
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";

  const frac = hasFractionalPart(n);

  if (kind === "money") {
    return `₦${n.toLocaleString("en-NG", {
      minimumFractionDigits: frac ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return n.toLocaleString("en-NG", {
    minimumFractionDigits: frac ? 2 : 0,
    maximumFractionDigits: frac ? 2 : 0,
  });
}

export interface ColDef {
  key: string;
  label: string;
  kind: ColKind;
  get: (row: OperationalDataRow) => string | number | null | undefined;
  width?: number;
}

export interface SectionDef {
  id: ReportTypeId;
  title: string;
  columns: ColDef[];
}

const Q_LABELS = ["Q1", "Q2", "Q3", "Q4", "Sub-Total"] as const;

export function isQuarterlySection(section: SectionDef): boolean {
  return (
    section.columns.length === 5 &&
    section.columns[0]?.label === "Q1" &&
    section.columns[4]?.label === "Sub-Total"
  );
}

/** Header/cell styling for Q1–Q4 and Sub-Total columns */
export function quarterColumnClasses(label: string, part: "head" | "cell"): string {
  if (label === "Q1" || label === "Q2" || label === "Q3") {
    return part === "head"
      ? "text-slate-500 bg-slate-50"
      : "text-slate-500 bg-slate-50/60";
  }
  if (label === "Q4") {
    return part === "head"
      ? "text-[#1a5c3a] bg-[#f0faf5] font-bold"
      : "text-[#1a5c3a] font-bold bg-[#f0faf5]/80";
  }
  if (label === "Sub-Total") {
    return part === "head"
      ? "text-[#1a5c3a] bg-[#dcfce7] font-bold border-l-2 border-[#1a5c3a]/30"
      : "text-[#1a5c3a] font-bold bg-[#dcfce7]/70 border-l-2 border-[#1a5c3a]/20";
  }
  return "";
}

function quarterlyCols(prefix: string, field: keyof OperationalDataRow, kind: ColKind = "num"): ColDef[] {
  return Q_LABELS.map((q) => ({
    key: `${prefix}_${q}`,
    label: q === "Sub-Total" ? "Sub-Total" : q,
    kind,
    get: (row) => {
      const block = row[field] as QuarterlyBlock;
      if (q === "Sub-Total") return block.sub_total;
      const key = q.toLowerCase() as "q1" | "q2" | "q3" | "q4";
      return block[key];
    },
  }));
}

function identityColumns(showZone: boolean): SectionDef {
  const cols: ColDef[] = [
    { key: "sn", label: "S/N", kind: "num", get: (r) => r.sn, width: 48 },
    { key: "state", label: "STATE", kind: "text", get: (r) => r.state, width: 120 },
  ];
  if (showZone) {
    cols.push({ key: "zone", label: "ZONE", kind: "text", get: (r) => r.zone, width: 100 });
  }
  return { id: "all", title: "IDENTITY", columns: cols };
}

export function buildSections(year: number, reportType: ReportTypeId, showZone: boolean): SectionDef[] {
  const identity = identityColumns(showZone);

  const dataSections: SectionDef[] = [
    {
      id: "general",
      title: `GENERAL INFORMATION ${year}`,
      columns: [
        { key: "staff_no", label: "STAFF NO.", kind: "num", get: (r) => r.staff_no },
        { key: "total_vehicles", label: "TOTAL VEHICLES", kind: "num", get: (r) => r.total_vehicles },
        { key: "total_hcf", label: "TOTAL HCF UNDER NHIA", kind: "num", get: (r) => r.total_hcf_under_nhia },
        { key: "accredited_hcf", label: "ACCREDITED HCFs", kind: "num", get: (r) => r.total_accredited_hcf },
        { key: "approved_budget", label: "APPROVED BUDGET", kind: "money", get: (r) => r.approved_budget },
        { key: "amount_utilized", label: "AMOUNT UTILIZED", kind: "money", get: (r) => r.total_amount_utilized },
      ],
    },
    {
      id: "cemonc",
      title: "CEmONC & FFP",
      columns: [
        { key: "cemonc_hcf", label: "ACCREDITED HCF", kind: "num", get: (r) => r.cemonc_accredited_hcf },
        { key: "cemonc_ben", label: "BENEFICIARIES", kind: "num", get: (r) => r.cemonc_beneficiaries },
      ],
    },
    {
      id: "ffp",
      title: "FFP",
      columns: [
        { key: "ffp_fac", label: "ACCREDITED FACILITIES", kind: "num", get: (r) => r.ffp_accredited_facilities },
        { key: "ffp_ben", label: "BENEFICIARIES", kind: "num", get: (r) => r.ffp_beneficiaries },
      ],
    },
    {
      id: "gifship_enrolments",
      title: "GIFSHIP ENROLMENTS",
      columns: quarterlyCols("gifship_enr", "gifship_enrolments"),
    },
    {
      id: "gifship_premium",
      title: "PREMIUM ON GIFSHIP",
      columns: quarterlyCols("gifship_prem", "gifship_premium", "money"),
    },
    {
      id: "ops",
      title: "OPS",
      columns: quarterlyCols("ops", "ops_count"),
    },
    {
      id: "fsship_enrolments",
      title: "FSSHIP ENROLMENTS",
      columns: quarterlyCols("fsship", "fsship_new_enrolments"),
    },
    {
      id: "extra_dependants",
      title: "EXTRA DEPENDANTS",
      columns: quarterlyCols("extra_dep", "extra_dependants"),
    },
    {
      id: "extra_dependant_premium",
      title: "EXTRA-DEPENDANT PREMIUM",
      columns: quarterlyCols("extra_prem", "extra_dependant_premium", "money"),
    },
    {
      id: "additional_dependants",
      title: "ADDITIONAL DEPENDANTS",
      columns: quarterlyCols("add_dep", "additional_dependants"),
    },
    {
      id: "change_of_provider",
      title: "CHANGE OF PROVIDER",
      columns: quarterlyCols("cop", "change_of_provider"),
    },
    {
      id: "bhcpf_schemes",
      title: "BHCPF / SCHEMES",
      columns: [
        { key: "bhcpf_ben", label: "BHCPF BENEFICIARIES", kind: "num", get: (r) => r.bhcpf_beneficiaries },
        { key: "bhcpf_fac", label: "BHCPF FACILITIES", kind: "num", get: (r) => r.bhcpf_facilities },
        { key: "tiship", label: "TISHIP LIVES", kind: "num", get: (r) => r.tiship_lives },
        { key: "mha", label: "MHA LIVES", kind: "num", get: (r) => r.mha_lives },
        { key: "sshia", label: "SSHIA LIVES", kind: "num", get: (r) => r.sshia_lives },
      ],
    },
    {
      id: "complaints",
      title: "COMPLAINTS",
      columns: [
        { key: "comp_reg", label: "REGISTERED", kind: "num", get: (r) => r.complaints_registered },
        { key: "comp_res", label: "RESOLVED", kind: "num", get: (r) => r.complaints_resolved },
        { key: "comp_esc", label: "ESCALATED", kind: "num", get: (r) => r.complaints_escalated },
      ],
    },
    {
      id: "igr",
      title: "IGR",
      columns: quarterlyCols("igr", "igr", "money"),
    },
    {
      id: "qa",
      title: "QUALITY ASSURANCE",
      columns: quarterlyCols("qa", "qa_conducted"),
    },
    {
      id: "accreditation_requests",
      title: "ACCREDITATION REQUESTS",
      columns: quarterlyCols("acc_req", "accreditation_requests"),
    },
    {
      id: "accreditation_conducted",
      title: "ACCREDITATION CONDUCTED",
      columns: quarterlyCols("acc_con", "accreditation_conducted"),
    },
    {
      id: "marketing",
      title: "MARKETING / ADVOCACY",
      columns: quarterlyCols("mkt", "marketing_sensitization"),
    },
    {
      id: "stakeholders_media",
      title: "STAKEHOLDERS / MEDIA",
      columns: [
        { key: "stake", label: "STAKEHOLDER MEETINGS", kind: "num", get: (r) => r.stakeholder_meetings },
        { key: "media", label: "MEDIA APPEARANCES", kind: "num", get: (r) => r.media_appearances },
      ],
    },
    {
      id: "reconciliation",
      title: "RECONCILIATION / INDEBTEDNESS",
      columns: [
        { key: "recon", label: "RECONCILIATION MEETINGS", kind: "num", get: (r) => r.reconciliation_meetings },
        { key: "indebt", label: "TOTAL INDEBTEDNESS", kind: "money", get: (r) => r.total_indebtedness },
        { key: "recovered", label: "AMOUNT RECOVERED", kind: "money", get: (r) => r.amount_recovered },
      ],
    },
  ];

  if (reportType === "all") {
    return [identity, ...dataSections];
  }

  const match = dataSections.find((s) => s.id === reportType);
  return match ? [identity, match] : [identity];
}

export function reportTypeLabel(id: ReportTypeId): string {
  return REPORT_TYPES.find((r) => r.id === id)?.label ?? id.replace(/_/g, " ");
}

/** Three pillar grids for detail view & PDF card export */
export const REPORT_GRID_GROUPS = [
  {
    id: "programmes",
    title: "Programmes & Enrolment",
    sectionIds: [
      "gifship_enrolments", "gifship_premium", "ops", "fsship_enrolments",
      "extra_dependants", "extra_dependant_premium", "additional_dependants",
      "change_of_provider", "bhcpf_schemes", "marketing", "stakeholders_media",
    ],
  },
  {
    id: "finance",
    title: "Finance & Administration",
    sectionIds: ["general", "igr", "reconciliation"],
  },
  {
    id: "quality",
    title: "Quality & Clinical",
    sectionIds: [
      "cemonc", "ffp", "complaints", "qa",
      "accreditation_requests", "accreditation_conducted",
    ],
  },
] as const;

export function groupSectionsForGrids(dataSections: SectionDef[]) {
  return REPORT_GRID_GROUPS.map((grid) => ({
    grid,
    sections: dataSections.filter((s) =>
      (grid.sectionIds as readonly string[]).includes(s.id)
    ),
  })).filter((g) => g.sections.length > 0);
}

export function flattenTableColumns(sections: SectionDef[]) {
  return sections.flatMap((section) =>
    section.columns.map((col) => ({
      ...col,
      header: section.id === "all" ? col.label : `${section.title} — ${col.label}`,
      sectionTitle: section.title,
    }))
  );
}
