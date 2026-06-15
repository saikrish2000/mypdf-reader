import { describe, it, expect } from "vitest";
import { dedupeFindings, normalizeSeverity, dedupeKey, countBySeverity } from "./dedupe";

describe("normalizeSeverity", () => {
  it("maps scanner-specific levels to canonical severity", () => {
    expect(normalizeSeverity("ERROR")).toBe("high");
    expect(normalizeSeverity("critical")).toBe("critical");
    expect(normalizeSeverity("warn")).toBe("medium");
    expect(normalizeSeverity(undefined)).toBe("info");
  });
});

describe("dedupeKey", () => {
  it("is stable across punctuation/whitespace differences", () => {
    expect(dedupeKey("Open  RLS!", "public.users", "high")).toBe(
      dedupeKey("open rls", "public.users", "high"),
    );
  });
});

describe("dedupeFindings", () => {
  it("merges identical findings from multiple scanners", () => {
    const out = dedupeFindings([
      { scanner: "supabase", name: "Missing RLS", resource: "public.x", level: "error", created_at: "2026-01-01", updated_at: "2026-01-02" },
      { scanner: "wiz", name: "missing rls", resource: "public.x", level: "high", created_at: "2025-12-01", updated_at: "2026-01-05" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].sources.sort()).toEqual(["supabase", "wiz"]);
    expect(out[0].firstSeen).toBe("2025-12-01");
    expect(out[0].lastSeen).toBe("2026-01-05");
  });

  it("keeps distinct findings separate and sorts by severity", () => {
    const out = dedupeFindings([
      { scanner: "a", name: "Low thing", level: "low" },
      { scanner: "b", name: "Critical thing", level: "critical" },
    ]);
    expect(out.map((f) => f.severity)).toEqual(["critical", "low"]);
  });

  it("counts only failing findings by severity", () => {
    const out = dedupeFindings([
      { scanner: "a", name: "x", level: "high", state: "failing" },
      { scanner: "a", name: "y", level: "high", state: "ignored" },
    ]);
    expect(countBySeverity(out)).toMatchObject({ high: 1 });
  });
});
