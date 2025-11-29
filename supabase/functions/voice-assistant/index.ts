import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log("Received request body:", requestBody);
    
    if (!requestBody || requestBody.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let question: string;
    let userId: string;

    try {
      ({ question, userId } = JSON.parse(requestBody));
    } catch (parseError) {
      console.error("Failed to parse JSON body in voice-assistant:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Voice assistant question:", question);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: `Ты — добрый русскоязычный кардиолог-помощник. Отвечай кратко, понятно и заботливо на вопросы о сердце, ЭКГ и здоровье.

ВАЖНО:
- Твой ответ должен быть коротким (2-4 предложения)
- Используй простой, понятный язык
- Будь дружелюбным и успокаивающим
- Если вопрос серьёзный, рекомендуй обратиться к врачу
- Не ставь диагнозы, только общая информация`
        }, {
          role: 'user',
          content: question
        }],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const aiResult = await aiResponse.json();
    const answer = aiResult.choices?.[0]?.message?.content || "Извините, не могу ответить на этот вопрос";

    console.log("Voice assistant response:", answer);

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in voice-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
