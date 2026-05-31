const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function parseJsonObject(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("OpenAI response was not valid JSON");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GPTAPI") ?? Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Missing GPTAPI or OPENAI_API_KEY secret" }, 500);

  let payload: { text?: string; prompt?: string; language?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON request body" }, 400);
  }

  const patentText = String(payload.text ?? payload.prompt ?? "").trim();
  const language = payload.language === "ja" ? "Japanese" : "English";
  if (!patentText) return json({ error: "Missing patent text" }, 400);

  const prompt = `Analyze this patent text in ${language}. Return JSON only with this exact shape:
{
  "keywords": [{ "term": string, "count": number, "type": "term" | "phrase", "score": number, "evidence": string }],
  "clusters": [{ "code": string, "title": string, "jaTitle": string, "matched": string[], "score": number, "confidence": "high" | "medium" | "low" }],
  "signals": { "sections": number, "uniqueTerms": number, "claimsCues": number, "density": number, "topKeyword": string }
}
Use concise evidence snippets copied from the text. Prefer technical patent terms over generic words. Suggest CPC/IPC-like clusters, but do not provide legal advice.

Patent text:
${patentText.slice(0, 14000)}`;

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract structured patent keywords and classification-style research clusters. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const openAiBody = await openAiResponse.json();
    if (!openAiResponse.ok) {
      return json({ error: "OpenAI request failed", details: openAiBody }, openAiResponse.status);
    }

    const content = openAiBody.choices?.[0]?.message?.content;
    if (typeof content !== "string") return json({ error: "OpenAI response did not include message content" }, 502);

    return json({ analysis: parseJsonObject(content), usage: openAiBody.usage ?? null });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected AI parsing error" }, 500);
  }
});
