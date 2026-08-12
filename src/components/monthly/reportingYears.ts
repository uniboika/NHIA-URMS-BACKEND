/** Current calendar year — use instead of hardcoding e.g. "2025". */
export function currentReportingYear(): string {
  return String(new Date().getFullYear());
}

/**
 * Year options for filters and forms: current year, years present in data,
 * and a short look-back window so new reports can be created before data exists.
 */
export function buildReportingYearOptions(dataYears?: Iterable<number | string | null | undefined>): string[] {
  const current = new Date().getFullYear();
  const years = new Set<number>();

  years.add(current);
  for (let y = current; y >= current - 5; y--) years.add(y);

  if (dataYears) {
    for (const raw of dataYears) {
      const n = Number(raw);
      if (!Number.isNaN(n) && n >= 2000 && n <= current + 1) years.add(n);
    }
  }

  return [...years].sort((a, b) => b - a).map(String);
}
