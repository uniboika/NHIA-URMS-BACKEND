export type MonthlyListColumn = {
  key: string;
  label: string;
  format: "naira" | "num";
};

export const SECTION_LIST_COLUMNS: Record<string, MonthlyListColumn[]> = {
  finance: [
    { key: "approved_budget",         label: "Approved Budget (₦)",              format: "naira" },
    { key: "total_amount_utilized",   label: "Total Amount Utilized (₦)",      format: "naira" },
    { key: "igr_amount",              label: "IGR Amount (₦)",                 format: "naira" },
    { key: "total_indebtedness",      label: "Total Indebtedness (₦)",         format: "naira" },
    { key: "amount_recovered",        label: "Amount Recovered (₦)",           format: "naira" },
    { key: "reconciliation_meetings", label: "Reconciliation Meetings",        format: "num"   },
  ],
  admin: [
    { key: "staff_no",       label: "Staff No.",      format: "num" },
    { key: "total_vehicles", label: "Total Vehicles", format: "num" },
  ],
  enrolment: [
    { key: "gifship_enrolments",         label: "GIFSHIP Enrolments",                    format: "num"   },
    { key: "gifship_premium",            label: "Premium on GIFSHIP (₦)",                format: "naira" },
    { key: "ops_count",                  label: "OPS",                                   format: "num"   },
    { key: "fsship_new_enrolments",      label: "New Enrolments / Mop-up (FSSHIP)",      format: "num"   },
    { key: "extra_dependants",           label: "Extra Dependants",                      format: "num"   },
    { key: "extra_dependant_premium",    label: "Premium on Extra-Dependant (₦)",        format: "naira" },
    { key: "additional_dependants",      label: "Additional Dependants",                 format: "num"   },
    { key: "change_of_provider",         label: "Change of Provider",                    format: "num"   },
    { key: "bhcpf_beneficiaries",        label: "BHCPF Beneficiaries",                   format: "num"   },
    { key: "bhcpf_facilities",           label: "BHCPF Accredited Facilities",           format: "num"   },
    { key: "tiship_lives",               label: "TISHIP Lives",                          format: "num"   },
    { key: "participating_institutions", label: "Participating Institutions",            format: "num"   },
    { key: "mha_lives",                  label: "MHA Lives",                             format: "num"   },
    { key: "sshia_lives",                label: "SSHIA Lives",                           format: "num"   },
  ],
  outreach: [
    { key: "marketing_sensitization", label: "Marketing / Sensitization Events", format: "num" },
    { key: "stakeholder_meetings",    label: "Stakeholder Meetings",               format: "num" },
    { key: "media_appearances",       label: "Media Appearances",                  format: "num" },
  ],
  sqa: [
    { key: "total_hcf_under_nhia",          label: "Total HCF Under NHIA",              format: "num" },
    { key: "total_accredited_hcf",          label: "Total Accredited HCFs",             format: "num" },
    { key: "cemonc_accredited_hcf",         label: "Accredited CEmONC HCFs",            format: "num" },
    { key: "cemonc_beneficiaries",          label: "CEmONC Beneficiaries",              format: "num" },
    { key: "ffp_accredited_facilities",     label: "Accredited FFP Facilities",       format: "num" },
    { key: "ffp_beneficiaries",             label: "FFP Beneficiaries",                 format: "num" },
    { key: "qa_conducted",                  label: "QA Conducted (HCFs)",               format: "num" },
    { key: "accreditation_requests",        label: "Accreditation Requests",            format: "num" },
    { key: "accreditation_conducted",       label: "Accreditation Conducted",           format: "num" },
    { key: "mystery_shopping_visited",      label: "Mystery Shopping — Visited",        format: "num" },
    { key: "mystery_shopping_complied",     label: "Mystery Shopping — Complied",       format: "num" },
    { key: "mystery_shopping_non_complied", label: "Mystery Shopping — Non-Complied",     format: "num" },
  ],
  complaints: [
    { key: "complaints_registered", label: "Complaints Registered", format: "num" },
    { key: "complaints_resolved",   label: "Complaints Resolved",   format: "num" },
    { key: "complaints_escalated",  label: "Complaints Escalated",  format: "num" },
  ],
};

export const DEPT_LIST_COLUMNS: Record<string, MonthlyListColumn[]> = {
  finance:    [...SECTION_LIST_COLUMNS.finance, ...SECTION_LIST_COLUMNS.admin],
  programmes: [...SECTION_LIST_COLUMNS.enrolment, ...SECTION_LIST_COLUMNS.outreach],
  sqa:        [...SECTION_LIST_COLUMNS.sqa, ...SECTION_LIST_COLUMNS.complaints],
};

export function formatMonthlyCellValue(value: unknown, format: MonthlyListColumn["format"]): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  if (format === "naira") return `₦ ${n.toLocaleString()}`;
  return n.toLocaleString();
}

export function getColumnsForSection(section: string): MonthlyListColumn[] {
  return SECTION_LIST_COLUMNS[section] ?? [];
}

export function getColumnsForDept(dept: string): MonthlyListColumn[] {
  return DEPT_LIST_COLUMNS[dept] ?? [];
}

/** True when a column applies to this record (mixed dept lists). */
export function columnAppliesToRecord(col: MonthlyListColumn, record: { section?: string }): boolean {
  const section = record.section;
  if (!section) return true;
  const sectionCols = SECTION_LIST_COLUMNS[section];
  return sectionCols?.some(c => c.key === col.key) ?? false;
}
