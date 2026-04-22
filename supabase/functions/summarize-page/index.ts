import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, pageNumber } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided to summarize" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "AI summarization is not configured. Please set the LOVABLE_API_KEY environment variable in your Supabase project settings." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Trim very long pages to keep latency/cost reasonable
    const truncated = text.length > 12000 ? text.slice(0, 12000) : text;

    const systemPrompt = `You are a clear, concise reading assistant. Given the raw text of a single PDF page, produce:
1. A 2-3 sentence summary of the main idea.
2. 3-5 bullet points capturing key takeaways.
Use plain markdown. Do NOT invent information that is not in the text. If the page has very little meaningful content (e.g. cover page, table of contents, blank), say so briefly.`;

    // Retry with exponential backoff on 429
    const maxAttempts = 3;
    let response: Response | null = null;
    let lastStatus = 0;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
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
                content: `Summarize page ${pageNumber ?? ""} of this PDF:\n\n${truncated}`,
              },
            ],
          }),
        },
      );
      lastStatus = response.status;
      if (response.status !== 429) break;
      if (attempt < maxAttempts - 1) {
        const backoff = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    if (!response || !response.ok) {
      if (lastStatus === 429) {
        return new Response(
          JSON.stringify({
            error: "The AI service is busy right now. Please wait a few seconds and retry.",
            retryable: true,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("summarize-page error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
