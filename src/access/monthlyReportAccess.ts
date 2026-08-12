export function getMonthlyReportContext(role: string, user?: {
  state_id?: number;
  zone_id?: number;
  role_config?: { report_scope?: string; can_create_monthly?: boolean };
} | null) {
  const stateScoped = user?.role_config?.report_scope === "state"
    || (!user?.role_config && ["state-officer", "state-coordinator", "department-officer"].includes(role));
  const canCreate = user?.role_config?.can_create_monthly
    ?? ["state-officer", "state-coordinator", "department-officer", "admin"].includes(role);
  return {
    defaultStateId: stateScoped && user?.state_id ? String(user.state_id) : null,
    defaultZoneId: user?.zone_id ? String(user.zone_id) : null,
    canCreateMonthly: canCreate,
  };
}
