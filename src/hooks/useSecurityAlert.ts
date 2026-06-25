import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { dedupeFindings, type Finding, type RawFinding } from "@/lib/security/dedupe";

/** Lightweight hook for navbar alert dot — only fetches when user is signed in. */
export function useSecurityAlert() {
  const { user } = useAuth();
  const [hasHighSeverity, setHasHighSeverity] = useState(false);

  const check = useCallback(async () => {
    if (!user) {
      setHasHighSeverity(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("security-findings", { method: "GET" });
      if (error) return;
      const raw: RawFinding[] = (data?.findings ?? []) as RawFinding[];
      const findings = dedupeFindings(raw);
      const alert = findings.some(
        (f) => f.state === "failing" && (f.severity === "critical" || f.severity === "high"),
      );
      setHasHighSeverity(alert);
    } catch {
      // ignore — dot stays off
    }
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  return { hasHighSeverity, refresh: check };
}

export type { Finding };
