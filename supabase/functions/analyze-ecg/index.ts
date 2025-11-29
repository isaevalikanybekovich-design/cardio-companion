import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ВАЖНО: Замените PM_CARDIO_API_KEY на ваш реальный API ключ
const PM_CARDIO_API_KEY = "YOUR_PM_CARDIO_API_KEY_HERE";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    let ecgScanId: string;
    let fileUrl: string;
    let fileType: string;

    try {
      ({ ecgScanId, fileUrl, fileType } = JSON.parse(requestBody));
    } catch (parseError) {
      console.error("Failed to parse JSON body in analyze-ecg:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting ECG analysis for scan:", ecgScanId);

    let ecgAnalysis: any = null;
    let analysisSource = "none";
    let lastErrorDetail: string | null = null;

    // Step 1: Try PMCardio API first
    try {
      console.log("Attempting PMCardio API analysis...");
      
      const fileResponse = await fetch(fileUrl);
      const fileBlob = await fileResponse.blob();
      
      const formData = new FormData();
      formData.append('file', fileBlob);

      const pmCardioResponse = await fetch('https://api.pmcardio.com/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PM_CARDIO_API_KEY}`,
        },
        body: formData,
      });

      if (pmCardioResponse.ok) {
        const pmResult = await pmCardioResponse.json();
        console.log("PMCardio analysis successful:", pmResult);
        ecgAnalysis = {
          heart_rate: pmResult.heart_rate || "Не определено",
          rhythm: pmResult.rhythm || "Не определено",
          main_findings: pmResult.findings || [],
          diagnosis: pmResult.diagnosis || "Требуется дополнительная оценка",
          urgency: pmResult.urgency || "норма",
        };
        analysisSource = "pmcardio";
      }
    } catch (pmError) {
      console.error("PMCardio API failed:", pmError);
      lastErrorDetail = pmError instanceof Error ? pmError.message : String(pmError);
    }

    // Step 2: Fallback to Lovable AI if PMCardio failed
    if (!ecgAnalysis) {
      console.log("Using Lovable AI fallback for ECG analysis...");
      
      if (!LOVABLE_API_KEY) {
        lastErrorDetail = "LOVABLE_API_KEY not configured";
        console.error(lastErrorDetail);
      } else {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Ты — опытный кардиолог. Проанализируй эту ЭКГ (изображение или PDF). Верни строго JSON в таком формате:
{
  "heart_rate": "...",
  "rhythm": "синусовый / фибрилляция предсердий / ...",
  "main_findings": ["ST-подъём в V2-V4", "блокада ЛНПГ", ...],
  "diagnosis": "краткий диагноз",
  "urgency": "норма / требует внимания / срочная помощь"
}`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: fileUrl
                    }
                  }
                ]
              }],
              temperature: 0.4,
              max_tokens: 2048,
            }),
          });

          if (aiResponse.ok) {
            let aiResult: any | null = null;
            try {
              aiResult = await aiResponse.json();
            } catch (parseError) {
              console.error("Failed to parse Gemini AI JSON:", parseError);
              lastErrorDetail = "Ошибка обработки ответа ИИ. Попробуйте ещё раз позже.";
            }

            if (aiResult) {
              const text = aiResult.choices?.[0]?.message?.content || "";
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  ecgAnalysis = JSON.parse(jsonMatch[0]);
                  analysisSource = "lovable_ai";
                  console.log("Lovable AI analysis successful:", ecgAnalysis);
                } catch (jsonError) {
                  console.error("Failed to parse JSON from AI text:", jsonError, text);
                  lastErrorDetail = "AI вернул некорректный формат данных. Попробуйте снова.";
                }
              } else {
                console.error("Lovable AI returned no valid JSON:", text);
                lastErrorDetail = "AI returned invalid JSON format";
              }
            }
          } else {
            const errorText = await aiResponse.text();
            console.error("Lovable AI error:", aiResponse.status, errorText);
            lastErrorDetail = `Lovable AI error ${aiResponse.status}: ${errorText}`;
          }
        } catch (aiError) {
          console.error("Lovable AI fallback failed:", aiError);
          lastErrorDetail = aiError instanceof Error ? aiError.message : String(aiError);
        }
      }
    }

    // Step 3: If both failed, return error
    if (!ecgAnalysis) {
      throw new Error(lastErrorDetail || "Не удалось проанализировать ЭКГ. Попробуйте позже.");
    }

    // Update database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(`${supabaseUrl}/rest/v1/ecg_scans?id=eq.${ecgScanId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_status: 'completed',
        [analysisSource === 'pmcardio' ? 'pm_cardio_result' : 'gemini_result']: ecgAnalysis,
        final_analysis: ecgAnalysis,
      }),
    });

    return new Response(
      JSON.stringify(ecgAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-ecg:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
