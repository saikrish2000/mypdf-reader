#!/usr/bin/env node
/**
 * Fails the CI build when any high/critical security finding is currently
 * failing in the Lovable scan results (covers Supabase, Supabase-Lov, and
 * connector scanners like Wiz/Aikido).
 *
 * Required env: LOVABLE_API_KEY, LOVABLE_PROJECT_ID
 */
import { writeFileSync, appendFileSync } from "node:fs";

const { LOVABLE_API_KEY, LOVABLE_PROJECT_ID, GITHUB_STEP_SUMMARY } = process.env;

if (!LOVABLE_API_KEY || !LOVABLE_PROJECT_ID) {
  console.error("Missing LOVABLE_API_KEY or LOVABLE_PROJECT_ID — skipping gate.");
  process.exit(0);
}

const url = `https://api.lovable.dev/v1/projects/${LOVABLE_PROJECT_ID}/security/findings`;

let findings = [];
try {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` } });
  if (!res.ok) {
    console.error(`Scan API responded ${res.status}; failing closed.`);
    process.exit(1);
  }
  const data = await res.json();
  findings = Array.isArray(data) ? data : data.findings ?? [];
} catch (e) {
  console.error("Failed to call scan API:", e.message);
  process.exit(1);
}

writeFileSync("security-findings.json", JSON.stringify(findings, null, 2));

const HIGH = new Set(["high", "critical", "error", "fatal"]);
const blocking = findings.filter(
  (f) => HIGH.has(String(f.level ?? f.severity ?? "").toLowerCase()) && (f.state ?? "failing") === "failing",
);

const summary = [
  "## Security Gate",
  "",
  `Total findings: **${findings.length}**`,
  `High/critical failing: **${blocking.length}**`,
  "",
];
if (blocking.length) {
  summary.push("| Severity | Scanner | Title |", "| --- | --- | --- |");
  for (const f of blocking) {
    summary.push(`| ${f.level ?? f.severity} | ${f.scanner_name ?? "?"} | ${(f.name ?? f.title ?? "").replace(/\|/g, "\\|")} |`);
  }
}
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, summary.join("\n") + "\n");
console.log(summary.join("\n"));

if (blocking.length > 0) {
  console.error(`FAIL: ${blocking.length} high/critical finding(s) blocking the build.`);
  process.exit(1);
}
console.log("OK: no blocking findings.");
