import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser, unauthorizedResponse } from "../_shared/requireAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse(corsHeaders);

    const { text, scope, pageNumber, pageStart, pageEnd, messages } = await req.json() as {
      text?: string;
      scope?: "page" | "range" | "document";
      pageNumber?: number;
      pageStart?: number;
      pageEnd?: number;
      messages?: ChatMessage[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncated = text && text.length > 14000 ? text.slice(0, 14000) : (text ?? "");
    const scopeLabel =
      scope === "document"
        ? "the document"
        : scope === "range"
          ? `pages ${pageStart ?? pageNumber}–${pageEnd ?? pageNumber}`
          : `page ${pageNumber ?? ""}`;

    const systemPrompt = `You are a helpful reading assistant answering questions about ${scopeLabel} of a PDF.
Use ONLY the text below. If the answer is not in the text, say so briefly. Be concise. Use markdown.

--- BEGIN TEXT ---
${truncated || "(no extractable text)"}
--- END TEXT ---`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is busy. Try again shortly.", retryable: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-document error:", error);
    return new Response(JSON.stringify({ error: "Chat failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
