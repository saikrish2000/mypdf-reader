import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface RawFinding {
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
  state?: "failing" | "fixed" | "ignored";
}

/**
 * Aggregates security findings from every available scanner source into a
 * single normalized list. The list is deduped on the client. New scanner
 * sources (Wiz, Aikido, additional connector scanners) only need to push
 * RawFinding[] into `findings` below.
 */
async function loadAllFindings(): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  // Source 1: Lovable scan-results API (Supabase, Supabase-Lov, connector_security_scan = Wiz/Aikido).
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const projectId = Deno.env.get("SUPABASE_URL")?.match(/\/\/([^.]+)\./)?.[1];
  if (apiKey && projectId) {
    try {
      const res = await fetch(
        `https://api.lovable.dev/v1/projects/${projectId}/security/findings`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const items: any[] = Array.isArray(data) ? data : data.findings ?? [];
        for (const item of items) {
          findings.push({
            scanner: item.scanner_name ?? item.scanner ?? "lovable",
            id: item.id,
            internal_id: item.internal_id,
            name: item.name ?? item.title,
            description: item.description,
            level: item.level ?? item.severity,
            resource: item.resource ?? item.metadata?.resource,
            created_at: item.created_at,
            updated_at: item.updated_at ?? item.created_at,
            state: item.state ?? "failing",
          });
        }
      } else {
        // Don't fail the whole call — just consume the body.
        await res.text();
      }
    } catch (_) {
      // Network/transient — ignore so other sources still return.
    }
  }

  return findings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Lightweight auth: require the caller to present a JWT (verify_jwt is off
  // for Lovable-managed functions, so we check the header is present).
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "GET") {
      const findings = await loadAllFindings();
      return new Response(JSON.stringify({ findings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { action, scanner, internal_id, explanation } = body as {
        action?: "mark_fixed" | "ignore";
        scanner?: string;
        internal_id?: string;
        explanation?: string;
      };
      if (!action || !scanner || !internal_id || !explanation) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      const projectId = Deno.env.get("SUPABASE_URL")?.match(/\/\/([^.]+)\./)?.[1];
      if (!apiKey || !projectId) {
        return new Response(JSON.stringify({ error: "Not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(
        `https://api.lovable.dev/v1/projects/${projectId}/security/findings/manage`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operation: action, scanner_name: scanner, internal_id, explanation }),
        },
      );
      const text = await res.text();
      return new Response(text || JSON.stringify({ ok: res.ok }), {
        status: res.ok ? 200 : res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
