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
    const { word, context } = await req.json() as {
      word?: string;
      context?: string;
    };

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No word provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured (missing LOVABLE_API_KEY)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const trimmedWord = word.trim().slice(0, 100);
    const trimmedContext = context ? context.slice(0, 500) : "";

    const systemPrompt = `You are a comprehensive dictionary and language expert. When given a word, provide a detailed definition in the following JSON structure ONLY — no markdown fences, no extra text, just valid JSON:

{
  "word": "the word",
  "phonetic": "pronunciation in IPA or simple phonetic e.g. /wɜːrd/",
  "partOfSpeech": "noun / verb / adjective / etc.",
  "meanings": [
    {
      "definition": "clear definition",
      "example": "example sentence using the word",
      "domain": "general / technical / formal / informal / archaic (optional)"
    }
  ],
  "etymology": "brief word origin and history",
  "synonyms": ["word1", "word2", "word3"],
  "antonyms": ["word1", "word2"],
  "contextualNote": "if a sentence context was provided, explain how the word is used in that specific context"
}

Provide 2-4 meanings if the word has multiple senses. Keep definitions clear and educational. Use web knowledge to give accurate, rich information.`;

    const userMessage = trimmedContext
      ? `Define the word: "${trimmedWord}"\n\nContext sentence: "${trimmedContext}"`
      : `Define the word: "${trimmedWord}"`;

    const response = await fetch(
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
            { role: "user", content: userMessage },
          ],
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is busy right now. Please try again.", retryable: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if the model wrapped the JSON anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let definition;
    try {
      definition = JSON.parse(cleaned);
    } catch {
      // Return raw text as a fallback so the UI can still show something
      definition = { word: trimmedWord, raw };
    }

    return new Response(JSON.stringify({ definition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("define-word error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
