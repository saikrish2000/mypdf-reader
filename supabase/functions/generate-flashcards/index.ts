import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser, unauthorizedResponse } from "../_shared/requireAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireAuthenticatedUser(req);
    if (!user) return unauthorizedResponse(corsHeaders);

    const { text, pageNumber, highlightQuotes } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
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

    const truncated = text.length > 12000 ? text.slice(0, 12000) : text;
    const highlights = Array.isArray(highlightQuotes) ? highlightQuotes.slice(0, 20) : [];
    const highlightBlock = highlights.length
      ? `\n\nUser highlights to prioritize:\n${highlights.map((q: string) => `- ${q}`).join("\n")}`
      : "";

    const systemPrompt = `You generate study flashcards from PDF text. Return ONLY valid JSON: {"cards":[{"front":"question or term","back":"answer or definition"}]}
Create 5-10 flashcards. Use only information from the text. No markdown in JSON values.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Page ${pageNumber ?? ""} text:\n${truncated}${highlightBlock}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      return new Response(
        JSON.stringify({
          error: status === 429 ? "AI is busy. Try again shortly." : "AI gateway error",
          retryable: status === 429,
        }),
        { status: status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { cards: [] };

    return new Response(JSON.stringify({ cards: parsed.cards ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-flashcards error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
