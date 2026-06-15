import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dedupeFindings, type Finding, type RawFinding } from "@/lib/security/dedupe";

export function useSecurityFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("security-findings", {
        method: "GET",
      });
      if (invokeErr) throw invokeErr;
      const raw: RawFinding[] = (data?.findings ?? []) as RawFinding[];
      setFindings(dedupeFindings(raw));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load security findings");
      setFindings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const manageFinding = useCallback(
    async (scanner: string, internal_id: string, action: "mark_fixed" | "ignore", explanation: string) => {
      const { error: invokeErr } = await supabase.functions.invoke("security-findings", {
        method: "POST",
        body: { action, scanner, internal_id, explanation },
      });
      if (invokeErr) throw invokeErr;
      await refresh();
    },
    [refresh],
  );

  return { findings, loading, error, refresh, manageFinding };
}
