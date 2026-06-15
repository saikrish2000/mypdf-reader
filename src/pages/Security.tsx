import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSecurityFindings } from "@/hooks/useSecurityFindings";
import { countBySeverity, type Severity } from "@/lib/security/dedupe";

const SEV_COLORS: Record<Severity, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-black",
  low: "bg-yellow-400 text-black",
  info: "bg-muted text-muted-foreground",
};

export default function Security() {
  const { findings, loading, error, refresh } = useSecurityFindings();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");

  const counts = useMemo(() => countBySeverity(findings), [findings]);
  const totalFailing = counts.critical + counts.high + counts.medium + counts.low;

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      if (sevFilter !== "all" && f.severity !== sevFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !f.title.toLowerCase().includes(q) &&
          !f.description.toLowerCase().includes(q) &&
          !f.sources.join(",").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [findings, sevFilter, search]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5" /> Security
          </h1>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["critical", "high", "medium", "low", "info"] as Severity[]).map((s) => (
            <button
              key={s}
              onClick={() => setSevFilter(sevFilter === s ? "all" : s)}
              className={`rounded-lg border border-border p-3 text-left transition hover:border-foreground/40 ${
                sevFilter === s ? "ring-2 ring-foreground/40" : ""
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s}</div>
              <div className="text-2xl font-bold">{counts[s]}</div>
            </button>
          ))}
        </section>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search findings, scanners, descriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {sevFilter !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setSevFilter("all")}>
              Clear filter
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && totalFailing === 0 && !error && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <h2 className="text-lg font-semibold">All clear</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No open findings across any connected scanner (Supabase, Supabase-Lov, Wiz, Aikido).
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((f) => (
              <li key={f.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${SEV_COLORS[f.severity]}`}>
                        {f.severity}
                      </span>
                      <h3 className="font-medium">{f.title}</h3>
                    </div>
                    {f.resource && (
                      <div className="mt-1 text-xs text-muted-foreground">Resource: {f.resource}</div>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      {f.sources.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <span>Last seen {new Date(f.lastSeen).toLocaleDateString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {loading && <div className="mt-6 text-center text-sm text-muted-foreground">Loading scan results…</div>}

        <footer className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          Sources are aggregated and deduped across all connected scanners. Connect Wiz or Aikido at the workspace
          level to add more sources.
        </footer>
      </main>
    </div>
  );
}
