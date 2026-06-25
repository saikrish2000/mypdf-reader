import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSecurityFindings } from "@/hooks/useSecurityFindings";
import { countBySeverity, type FindingState, type Severity } from "@/lib/security/dedupe";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const SEV_VARIANT: Record<Severity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/80 text-destructive-foreground",
  medium: "bg-muted text-foreground border border-border",
  low: "bg-muted/80 text-muted-foreground",
  info: "bg-muted text-muted-foreground",
};

const STATE_OPTIONS: Array<FindingState | "all"> = ["failing", "fixed", "ignored", "all"];

type ManageAction = "mark_fixed" | "ignore";

export default function Security() {
  const { findings, loading, error, refresh, manageFinding } = useSecurityFindings();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [stateFilter, setStateFilter] = useState<FindingState | "all">("failing");
  const [scannerFilter, setScannerFilter] = useState<string | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageAction, setManageAction] = useState<ManageAction>("mark_fixed");
  const [manageFindingId, setManageFindingId] = useState<string | null>(null);
  const [manageExplanation, setManageExplanation] = useState("");

  const allScanners = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => f.sources.forEach((s) => set.add(s)));
    return [...set].sort();
  }, [findings]);

  const counts = useMemo(() => countBySeverity(findings), [findings]);
  const totalFailing = counts.critical + counts.high + counts.medium + counts.low;

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      if (stateFilter !== "all" && f.state !== stateFilter) return false;
      if (sevFilter !== "all" && f.severity !== sevFilter) return false;
      if (scannerFilter !== "all" && !f.sources.includes(scannerFilter)) return false;
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
  }, [findings, sevFilter, stateFilter, scannerFilter, search]);

  const openManage = (f: typeof findings[0], action: ManageAction) => {
    if (!f.internalId) {
      toast.error("This finding cannot be managed (missing scanner id).");
      return;
    }
    setManageFindingId(f.id);
    setManageAction(action);
    setManageExplanation(action === "mark_fixed" ? "Resolved in codebase" : "Accepted risk");
    setManageOpen(true);
  };

  const submitManage = async () => {
    const f = findings.find((x) => x.id === manageFindingId);
    if (!f?.internalId || !manageExplanation.trim()) return;
    setBusyId(f.id);
    try {
      await manageFinding(f.primaryScanner, f.internalId, manageAction, manageExplanation.trim());
      toast.success(manageAction === "mark_fixed" ? "Marked as fixed" : "Finding ignored");
      setManageOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update finding");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />

      <main className="page-shell page-main">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/library" className="inline-flex items-center gap-1.5 type-caption hover:text-foreground mb-3">
              <ArrowLeft className="h-3.5 w-3.5" /> Library
            </Link>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Shield className="h-5 w-5" /> Security findings
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["critical", "high", "medium", "low", "info"] as Severity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSevFilter(sevFilter === s ? "all" : s)}
              className={`surface p-3 text-left transition-colors hover:bg-muted/50 ${
                sevFilter === s ? "ring-1 ring-border" : ""
              }`}
            >
              <div className="type-label mb-1">{s}</div>
              <div className="text-2xl font-semibold tabular-nums">{counts[s]}</div>
            </button>
          ))}
        </section>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search findings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-1">
            {STATE_OPTIONS.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={stateFilter === s ? "default" : "outline"}
                onClick={() => setStateFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          {allScanners.length > 0 && (
            <select
              value={scannerFilter}
              onChange={(e) => setScannerFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="all">All scanners</option>
              {allScanners.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="mb-4 surface border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && totalFailing === 0 && !error && (
          <div className="surface p-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="text-base font-semibold">All clear</h2>
            <p className="type-caption mt-1 max-w-md mx-auto">
              No open findings across connected scanners.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((f) => (
              <li key={f.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase ${SEV_VARIANT[f.severity]}`}>
                        {f.severity}
                      </span>
                      <Badge variant="secondary" className="text-[10px] uppercase">{f.state}</Badge>
                    </div>
                    <h3 className="font-medium text-sm">{f.title}</h3>
                    {f.resource && (
                      <p className="type-caption mt-1">Resource: {f.resource}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
                    {f.state === "failing" && f.internalId && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === f.id}
                          onClick={() => openManage(f, "mark_fixed")}
                        >
                          Mark fixed
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busyId === f.id}
                          onClick={() => openManage(f, "ignore")}
                        >
                          Ignore
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                    <div className="flex gap-1 flex-wrap justify-end">
                      {f.sources.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <span>Last seen {f.lastSeen ? new Date(f.lastSeen).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && filtered.length === 0 && totalFailing > 0 && !error && (
          <p className="text-center type-caption py-12">No findings match the current filters.</p>
        )}

        {loading && <p className="text-center type-caption py-12">Loading scan results…</p>}
      </main>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {manageAction === "mark_fixed" ? "Mark as fixed" : "Ignore finding"}
            </DialogTitle>
            <DialogDescription>
              Add a short note for the audit trail.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={manageExplanation}
            onChange={(e) => setManageExplanation(e.target.value)}
            rows={3}
            placeholder="Explanation…"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setManageOpen(false)}>Cancel</Button>
            <Button onClick={submitManage} disabled={!manageExplanation.trim() || !!busyId}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
