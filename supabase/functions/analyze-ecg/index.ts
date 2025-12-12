import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log("Received request body length:", requestBody.length);
    
    if (!requestBody || requestBody.trim().length === 0) {
      console.error("Empty request body received");
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
      console.log("Parsed request - ecgScanId:", ecgScanId, "fileUrl:", fileUrl?.substring(0, 100), "fileType:", fileType);
    } catch (parseError) {
      console.error("Failed to parse JSON body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ecgScanId || !fileUrl) {
      console.error("Missing required fields - ecgScanId:", !!ecgScanId, "fileUrl:", !!fileUrl);
      return new Response(
        JSON.stringify({ error: "Missing ecgScanId or fileUrl" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting ECG analysis for scan:", ecgScanId);

    let ecgAnalysis: any = null;
    let analysisSource = "none";
    let lastErrorDetail: string | null = null;

    // Проверяем доступность файла
    try {
      console.log("Checking file accessibility...");
      const testResponse = await fetch(fileUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.error("File not accessible:", testResponse.status, testResponse.statusText);
        lastErrorDetail = `Файл недоступен: ${testResponse.status}`;
      } else {
        console.log("File is accessible, content-type:", testResponse.headers.get('content-type'));
      }
    } catch (fetchError) {
      console.error("Error checking file:", fetchError);
      lastErrorDetail = "Не удалось получить доступ к файлу";
    }

    // Используем Lovable AI для анализа
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API не настроен. Обратитесь к администратору." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting Lovable AI analysis...");
    
    try {
      // Определяем тип контента для API
      const isPdf = fileType === 'application/pdf' || fileUrl.toLowerCase().endsWith('.pdf');
      
      let messageContent: any[];
      
      if (isPdf) {
        // Для PDF используем только текстовый промпт с URL
        messageContent = [{
          type: 'text',
          text: `Ты — опытный кардиолог. Проанализируй ЭКГ по ссылке: ${fileUrl}

ВАЖНО: Определи уровень срочности на основе следующих критериев:
- "срочная помощь" — при признаках инфаркта (ST-элевация/депрессия >2мм, патологические Q-зубцы), опасных аритмий (желудочковая тахикардия, фибрилляция желудочков, AV-блокада III степени), асистолии, критической брадикардии (<40 уд/мин) или тахикардии (>150 уд/мин)
- "требует внимания" — при умеренных отклонениях: фибрилляция/трепетание предсердий, частые экстрасистолы, AV-блокада I-II степени, умеренные изменения ST-T, удлинение QT, ЧСС 40-50 или 100-150 уд/мин
- "норма" — только при отсутствии значимых отклонений, нормальном синусовом ритме, ЧСС 60-100 уд/мин

Верни ТОЛЬКО JSON в таком формате (без markdown):
{
  "heart_rate": "число уд/мин или Не определено",
  "rhythm": "синусовый / фибрилляция предсердий / ...",
  "main_findings": ["конкретные находки..."],
  "diagnosis": "краткий диагноз",
  "urgency": "норма / требует внимания / срочная помощь"
}`
        }];
      } else {
        // Для изображений используем vision API
        messageContent = [
          {
            type: 'text',
            text: `Ты — опытный кардиолог. Проанализируй эту ЭКГ.

ВАЖНО: Определи уровень срочности на основе следующих критериев:
- "срочная помощь" — при признаках инфаркта (ST-элевация/депрессия >2мм, патологические Q-зубцы), опасных аритмий (желудочковая тахикардия, фибрилляция желудочков, AV-блокада III степени), асистолии, критической брадикардии (<40 уд/мин) или тахикардии (>150 уд/мин)
- "требует внимания" — при умеренных отклонениях: фибрилляция/трепетание предсердий, частые экстрасистолы, AV-блокада I-II степени, умеренные изменения ST-T, удлинение QT, ЧСС 40-50 или 100-150 уд/мин
- "норма" — только при отсутствии значимых отклонений, нормальном синусовом ритме, ЧСС 60-100 уд/мин

Верни ТОЛЬКО JSON в таком формате (без markdown):
{
  "heart_rate": "число уд/мин или Не определено",
  "rhythm": "синусовый / фибрилляция предсердий / ...",
  "main_findings": ["конкретные находки..."],
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
        ];
      }

      console.log("Sending request to Lovable AI, isPdf:", isPdf);
      
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
            content: messageContent
          }],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      console.log("AI Response status:", aiResponse.status);

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        const text = aiResult.choices?.[0]?.message?.content || "";
        console.log("AI response text length:", text.length);
        console.log("AI response text preview:", text.substring(0, 500));
        
        // Извлекаем JSON из ответа (может быть обёрнут в markdown)
        let jsonText = text;
        
        // Удаляем markdown блоки если есть
        const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonBlockMatch) {
          jsonText = jsonBlockMatch[1].trim();
        }
        
        // Ищем JSON объект
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            ecgAnalysis = JSON.parse(jsonMatch[0]);
            analysisSource = "lovable_ai";
            console.log("Successfully parsed ECG analysis:", JSON.stringify(ecgAnalysis));
            
            // Валидация обязательных полей
            if (!ecgAnalysis.urgency) {
              ecgAnalysis.urgency = "требует внимания";
            }
            if (!ecgAnalysis.heart_rate) {
              ecgAnalysis.heart_rate = "Не определено";
            }
            if (!ecgAnalysis.rhythm) {
              ecgAnalysis.rhythm = "Не определено";
            }
            if (!ecgAnalysis.main_findings || !Array.isArray(ecgAnalysis.main_findings)) {
              ecgAnalysis.main_findings = ["Анализ выполнен"];
            }
            if (!ecgAnalysis.diagnosis) {
              ecgAnalysis.diagnosis = "Требуется дополнительная оценка специалиста";
            }
            
          } catch (jsonError) {
            console.error("Failed to parse JSON from AI text:", jsonError);
            console.error("Attempted to parse:", jsonMatch[0].substring(0, 500));
            lastErrorDetail = "AI вернул некорректный формат данных";
          }
        } else {
          console.error("No JSON found in AI response");
          console.error("Full response:", text);
          lastErrorDetail = "AI не вернул структурированный ответ";
        }
      } else {
        const errorText = await aiResponse.text();
        console.error("Lovable AI error:", aiResponse.status, errorText);
        lastErrorDetail = `AI ошибка ${aiResponse.status}: ${errorText.substring(0, 200)}`;
      }
    } catch (aiError) {
      console.error("Lovable AI request failed:", aiError);
      lastErrorDetail = aiError instanceof Error ? aiError.message : String(aiError);
    }

    // Если анализ не удался
    if (!ecgAnalysis) {
      console.error("Analysis failed, last error:", lastErrorDetail);
      return new Response(
        JSON.stringify({ 
          error: lastErrorDetail || "Не удалось проанализировать ЭКГ. Попробуйте загрузить изображение в другом формате." 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем базу данных
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log("Updating database for scan:", ecgScanId);
    
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ecg_scans?id=eq.${ecgScanId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        analysis_status: 'completed',
        gemini_result: ecgAnalysis,
        final_analysis: ecgAnalysis,
      }),
    });

    if (!updateResponse.ok) {
      console.error("Database update failed:", updateResponse.status, await updateResponse.text());
    } else {
      console.log("Database updated successfully");
    }

    console.log("Returning successful analysis result");
    return new Response(
      JSON.stringify(ecgAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unhandled error in analyze-ecg:", error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
