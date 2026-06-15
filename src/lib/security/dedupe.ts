export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type FindingState = "failing" | "fixed" | "ignored";

export interface RawFinding {
  scanner: string;
  id?: string;
  internal_id?: string;
  name?: string;
  title?: string;
  description?: string;
  level?: string;
  severity?: string;
  resource?: string;
  created_at?: string;
  updated_at?: string;
  state?: FindingState;
}

export interface Finding {
  id: string;
  scanner: string;
  sources: string[];
  severity: Severity;
  title: string;
  description: string;
  resource: string;
  firstSeen: string;
  lastSeen: string;
  state: FindingState;
}

const SEV_RANK: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export function normalizeSeverity(level?: string): Severity {
  const l = (level ?? "").toLowerCase();
  if (l === "critical" || l === "fatal") return "critical";
  if (l === "high" || l === "error" || l === "err") return "high";
  if (l === "medium" || l === "warn" || l === "warning" || l === "moderate") return "medium";
  if (l === "low") return "low";
  return "info";
}

function normText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Stable non-crypto hash (FNV-1a) — sync, no Web Crypto required.
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ("00000000" + h.toString(16)).slice(-8);
}

export function dedupeKey(title: string, resource: string, severity: Severity): string {
  return fnv1a(`${normText(title)}|${normText(resource)}|${severity}`);
}

export function dedupeFindings(rows: RawFinding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const r of rows) {
    const severity = normalizeSeverity(r.level ?? r.severity);
    const title = r.name ?? r.title ?? "Untitled finding";
    const resource = r.resource ?? "";
    const description = r.description ?? "";
    const key = dedupeKey(title, resource, severity);
    const firstSeen = r.created_at ?? new Date().toISOString();
    const lastSeen = r.updated_at ?? firstSeen;
    const state: FindingState = r.state ?? "failing";

    const existing = map.get(key);
    if (existing) {
      if (!existing.sources.includes(r.scanner)) existing.sources.push(r.scanner);
      if (firstSeen < existing.firstSeen) existing.firstSeen = firstSeen;
      if (lastSeen > existing.lastSeen) existing.lastSeen = lastSeen;
      if (description.length > existing.description.length) existing.description = description;
    } else {
      map.set(key, {
        id: key,
        scanner: r.scanner,
        sources: [r.scanner],
        severity,
        title,
        description,
        resource,
        firstSeen,
        lastSeen,
        state,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || a.title.localeCompare(b.title),
  );
}

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const out: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) if (f.state === "failing") out[f.severity]++;
  return out;
}
