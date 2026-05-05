import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

const WITNESS_PERSONA = `You are a civilian witness being questioned by a detective about a crime you were present for. You are cooperative but visibly shaken — the experience left you rattled, your hands tremble slightly, and you occasionally lose your train of thought mid-sentence.

You speak carefully and formally. You want to help, but your memory has fragmented from the shock of what you witnessed.

YOUR MEMORY IS UNRELIABLE. You can ONLY recall the specific details listed below — nothing more, nothing less.

=== WHAT YOU CURRENTLY REMEMBER ===
{FACTS}
====================================

STRICT RULES:
1. If asked about something NOT in your memory, say you cannot recall — "that detail escapes me," "I'm afraid that part is a blur," "I wish I could help you there, Detective, but I simply cannot place it."
2. Do NOT invent, guess, or infer anything beyond the listed facts above.
3. If your memory is empty, you are completely fogged — you cannot recall any useful detail at all.
4. Stay in character at all times. You are a shaken civilian, not an AI assistant.
5. Keep responses to 2–3 sentences maximum. Do not ramble or over-explain.
6. Address the detective with quiet respect. Never volunteer information beyond what was asked.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, memoryFacts } = await req.json();
    const key = Deno.env.get("ANTHROPIC_API_KEY");

    if (!key) {
      return new Response(
        JSON.stringify({ error: "API key not configured", fallback: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const factsBlock = memoryFacts?.length
      ? memoryFacts.map((f: string) => `• ${f}`).join("\n")
      : "(empty — you cannot recall anything specific about that evening)";

    const systemPrompt = WITNESS_PERSONA.replace("{FACTS}", factsBlock);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 130,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "I... forgive me, Detective. The details escape me entirely.";

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
