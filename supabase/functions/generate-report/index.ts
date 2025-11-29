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

    let ecgScanId: string;
    let patientId: string;
    let userId: string;
    let ecgAnalysis: any;
    let patientData: any;

    try {
      ({ ecgScanId, patientId, userId, ecgAnalysis, patientData } = JSON.parse(requestBody));
    } catch (parseError) {
      console.error("Failed to parse JSON body in generate-report:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Generating medical report...");

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const reportResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'system',
          content: 'Ты — русскоязычный врач-кардиолог с большим опытом. Составляй подробные, но понятные медицинские заключения.'
        }, {
          role: 'user',
          content: `На основе симптомов пациента, анамнеза и результатов анализа ЭКГ дай подробный, но понятный вывод.

Данные пациента:
- Возраст: ${patientData.age} лет
- Пол: ${patientData.gender === 'male' ? 'мужской' : 'женский'}
- Жалобы: ${patientData.complaints?.join(', ') || 'нет'}
- Подробности жалоб: ${patientData.complaintsDetails || 'не указано'}
- Медицинская история: ${patientData.medicalHistory || 'не указано'}
- Факторы риска: ${patientData.riskFactors?.join(', ') || 'нет'}

Результаты ЭКГ:
- ЧСС: ${ecgAnalysis.heart_rate}
- Ритм: ${ecgAnalysis.rhythm}
- Находки: ${ecgAnalysis.main_findings?.join(', ')}
- Диагноз: ${ecgAnalysis.diagnosis}
- Срочность: ${ecgAnalysis.urgency}

Напиши заключение на русском языке:
1. Краткое резюме состояния пациента
2. Интерпретация результатов ЭКГ
3. Оценка риска (норма / требует внимания / срочная помощь)
4. Рекомендации по дальнейшим действиям

Ответ должен быть заботливым, профессиональным и понятным для пациента.`
        }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      console.error('Lovable AI error:', reportResponse.status, errorText);
      throw new Error('Failed to generate report');
    }

    let reportText = "Не удалось сгенерировать отчёт";
    try {
      const reportResult = await reportResponse.json();
      reportText = reportResult.choices?.[0]?.message?.content || reportText;
    } catch (parseError) {
      console.error("Failed to parse report JSON:", parseError);
      throw new Error("Ошибка обработки отчёта ИИ. Попробуйте ещё раз позже.");
    }

    // Extract risk level and recommendations
    let riskLevel = ecgAnalysis.urgency || 'требует внимания';
    let recommendations = "Рекомендуется консультация с кардиологом для более детального обследования.";

    // Try to extract structured info from report
    if (reportText.includes('норма')) {
      riskLevel = 'норма';
    } else if (reportText.includes('срочная помощь') || reportText.includes('срочно')) {
      riskLevel = 'срочная помощь';
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const reportData = {
      user_id: userId,
      patient_id: patientId,
      ecg_scan_id: ecgScanId,
      report_text: reportText,
      risk_level: riskLevel,
      recommendations: recommendations,
    };

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/medical_reports`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(reportData),
    });

    const savedReport = await dbResponse.json();

    console.log("Report generated successfully");

    return new Response(
      JSON.stringify({
        reportText,
        riskLevel,
        recommendations,
        reportId: savedReport[0]?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-report:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
