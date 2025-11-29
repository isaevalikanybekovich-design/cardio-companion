# API Документация

## Edge Functions API

### `analyze-ecg`

Анализ электрокардиограммы с использованием AI.

#### Endpoint

```
POST /functions/v1/analyze-ecg
```

#### Аутентификация

```typescript
Authorization: Bearer <SUPABASE_ANON_KEY>
```

#### Request Body

```typescript
{
  ecgScanId: string;    // UUID записи в таблице ecg_scans
  fileUrl: string;      // Публичный URL изображения ЭКГ
  fileType: string;     // MIME-тип (image/png, image/jpeg, application/pdf)
}
```

#### Response (Success - 200)

```typescript
{
  heart_rate: string;       // Например: "75 уд/мин"
  rhythm: string;           // Например: "Синусовый ритм"
  main_findings: string;    // Основные находки
  diagnosis: string;        // Предварительный диагноз
  urgency: string;          // "low" | "medium" | "high" | "critical"
}
```

#### Response (Error - 400)

```typescript
{
  error: string;    // Описание ошибки
}
```

#### Response (Error - 500)

```typescript
{
  error: string;    // Внутренняя ошибка сервера
}
```

#### Пример использования

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('analyze-ecg', {
  body: {
    ecgScanId: "123e4567-e89b-12d3-a456-426614174000",
    fileUrl: "https://vltyhblusaopapystkqe.supabase.co/storage/v1/object/public/ecg-files/...",
    fileType: "image/png"
  }
});

if (error) {
  console.error('Ошибка анализа:', error);
} else {
  console.log('Результат:', data);
}
```

---

### `generate-report`

Генерация медицинского отчета на основе данных пациента и анализа ЭКГ.

#### Endpoint

```
POST /functions/v1/generate-report
```

#### Аутентификация

```typescript
Authorization: Bearer <SUPABASE_ANON_KEY>
```

#### Request Body

```typescript
{
  ecgScanId: string;
  patientId: string;
  userId: string;
  ecgAnalysis: {
    heart_rate: string;
    rhythm: string;
    main_findings: string;
    diagnosis: string;
    urgency: string;
  };
  patientData: {
    age: number;
    gender: string;
    height_cm: number;
    weight_kg: number;
    current_complaints: string[];
    complaints_details: string;
    medical_history: string;
    risk_factors: string[];
  };
}
```

#### Response (Success - 200)

```typescript
{
  reportText: string;          // Полный текст медицинского отчета
  riskLevel: string;           // "low" | "medium" | "high" | "critical"
  recommendations: string;      // Рекомендации врача
  reportId: string;            // UUID созданного отчета
}
```

#### Response (Error - 400/500)

```typescript
{
  error: string;
}
```

#### Пример использования

```typescript
const { data, error } = await supabase.functions.invoke('generate-report', {
  body: {
    ecgScanId: scanId,
    patientId: patientId,
    userId: user.id,
    ecgAnalysis: analysisResult,
    patientData: {
      age: 45,
      gender: "мужской",
      height_cm: 180,
      weight_kg: 85,
      current_complaints: ["Боль в груди", "Одышка"],
      complaints_details: "Боль появляется при физической нагрузке",
      medical_history: "Гипертония 2 года",
      risk_factors: ["Курение", "Высокий холестерин"]
    }
  }
});
```

---

### `voice-assistant`

Голосовой ассистент-кардиолог для консультаций.

#### Endpoint

```
POST /functions/v1/voice-assistant
```

#### Аутентификация

```typescript
Authorization: Bearer <SUPABASE_ANON_KEY>
```

#### Request Body

```typescript
{
  question: string;     // Вопрос пользователя
  userId: string;       // UUID пользователя
}
```

#### Response (Success - 200)

```typescript
{
  answer: string;       // Ответ AI-ассистента на русском языке
}
```

#### Response (Error - 400/500)

```typescript
{
  error: string;
}
```

#### Пример использования

```typescript
const { data, error } = await supabase.functions.invoke('voice-assistant', {
  body: {
    question: "Что делать при учащенном сердцебиении?",
    userId: user.id
  }
});

if (!error) {
  console.log('Ответ:', data.answer);
  // Озвучить ответ через Speech Synthesis API
}
```

---

## Database API (Supabase Client)

### Таблица: `patients`

#### Создание пациента

```typescript
const { data, error } = await supabase
  .from('patients')
  .insert([{
    user_id: user.id,
    age: 45,
    gender: "мужской",
    height_cm: 180,
    weight_kg: 85,
    current_complaints: ["Боль в груди", "Одышка"],
    complaints_details: "Детальное описание",
    medical_history: "История болезней",
    risk_factors: ["Курение", "Диабет"]
  }])
  .select()
  .single();
```

#### Получение пациентов пользователя

```typescript
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

---

### Таблица: `ecg_scans`

#### Создание записи сканирования

```typescript
const { data, error } = await supabase
  .from('ecg_scans')
  .insert([{
    user_id: user.id,
    patient_id: patientId,
    file_name: file.name,
    file_type: file.type,
    file_url: publicUrl,
    analysis_status: 'pending'
  }])
  .select()
  .single();
```

#### Обновление результатов анализа

```typescript
const { error } = await supabase
  .from('ecg_scans')
  .update({
    analysis_status: 'completed',
    final_analysis: analysisResult
  })
  .eq('id', scanId);
```

#### Получение сканирований с результатами

```typescript
const { data, error } = await supabase
  .from('ecg_scans')
  .select('*, patients(*)')
  .eq('user_id', user.id)
  .eq('analysis_status', 'completed')
  .order('created_at', { ascending: false });
```

---

### Таблица: `medical_reports`

#### Создание отчета

```typescript
const { data, error } = await supabase
  .from('medical_reports')
  .insert([{
    user_id: userId,
    patient_id: patientId,
    ecg_scan_id: scanId,
    report_text: reportText,
    risk_level: riskLevel,
    recommendations: recommendations
  }])
  .select()
  .single();
```

#### Получение отчетов пациента

```typescript
const { data, error } = await supabase
  .from('medical_reports')
  .select('*, ecg_scans(*), patients(*)')
  .eq('patient_id', patientId)
  .order('created_at', { ascending: false });
```

---

### Таблица: `voice_consultations`

#### Сохранение консультации

```typescript
const { error } = await supabase
  .from('voice_consultations')
  .insert([{
    user_id: userId,
    question: userQuestion,
    answer: aiAnswer
  }]);
```

#### Получение истории консультаций

```typescript
const { data, error } = await supabase
  .from('voice_consultations')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## Storage API

### Bucket: `ecg-files`

#### Загрузка файла

```typescript
const timestamp = Date.now();
const fileExt = file.name.split('.').pop();
const filePath = `${user.id}/${timestamp}.${fileExt}`;

const { data, error } = await supabase.storage
  .from('ecg-files')
  .upload(filePath, file);

if (!error) {
  const { data: { publicUrl } } = supabase.storage
    .from('ecg-files')
    .getPublicUrl(filePath);
}
```

#### Получение публичного URL

```typescript
const { data } = supabase.storage
  .from('ecg-files')
  .getPublicUrl('path/to/file.png');

console.log(data.publicUrl);
```

#### Удаление файла

```typescript
const { error } = await supabase.storage
  .from('ecg-files')
  .remove(['path/to/file.png']);
```

---

## Аутентификация API

### Регистрация

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      full_name: 'Иван Иванов'
    }
  }
});
```

### Вход

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Выход

```typescript
const { error } = await supabase.auth.signOut();
```

### Получение текущей сессии

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### Подписка на изменения аутентификации

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('Пользователь вошел:', session.user);
    }
    if (event === 'SIGNED_OUT') {
      console.log('Пользователь вышел');
    }
  }
);
```

---

## Обработка ошибок

### Типичные коды ошибок

| Код | Описание | Решение |
|-----|----------|---------|
| `400` | Неверный запрос | Проверьте формат данных |
| `401` | Не авторизован | Обновите токен сессии |
| `403` | Доступ запрещен | Проверьте RLS политики |
| `404` | Не найдено | Проверьте существование ресурса |
| `429` | Превышен лимит запросов | Добавьте задержки |
| `500` | Внутренняя ошибка | Проверьте логи Edge Functions |

### Пример обработки

```typescript
try {
  const { data, error } = await supabase
    .from('patients')
    .select('*');

  if (error) throw error;

  return data;
} catch (error) {
  if (error.code === 'PGRST116') {
    console.error('RLS политика запретила доступ');
  } else {
    console.error('Неожиданная ошибка:', error.message);
  }
}
```

---

## Rate Limits

### Lovable AI Gateway

- **По умолчанию**: 60 запросов/минуту на воркспейс
- **Платный план**: до 300 запросов/минуту
- **Увеличение**: support@lovable.dev

### Supabase API

- **Анонимные запросы**: 100 запросов/секунду
- **Authenticated запросы**: 200 запросов/секунду

---

## Версионирование

Текущая версия API: **v1**

При изменениях API будет создана новая версия с обратной совместимостью.
