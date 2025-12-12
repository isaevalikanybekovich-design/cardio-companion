AI ECG Analysis System

AI-платформа для анализа ЭКГ за 60 секунд с использованием Google Gemini 2.5 PRO.

🚀 Возможности
📤 Загрузка ЭКГ (PDF/PNG/JPG/WEBP)
🤖 AI-анализ ЭКГ
🧬 Генерация медицинского отчёта
🗣 Голосовой ассистент-кардиолог
👤 Система пользователей и история анализов
🌐 Полный frontend + backend + database стек

        Архитектура 


React + Tailwind + shadcn/ui
          │
          ▼
Supabase (Auth, DB, Storage, Edge Functions)
          │
          ▼
Google Gemini 2.5 PRO (Vision + Text)


🛠 Технологии
Frontend
  React 18 + TypeScript
  Vite
  Tailwind + shadcn/ui
  TanStack Query
  React Hook Form + Zod

Backend
  Supabase Cloud
  PostgreSQL
  Supabase Storage
  Supabase Auth
  Edge Functions (Deno)

AI
Gemini 2.5 PRO (vision/text)

📁 Структура репозитория
      src/
        components/
        pages/
        lib/
      supabase/
        functions/
          analyze-ecg/
          generate-report/
          voice-assistant/


🔧 Установка

      git clone <repo>
      cd project
      npm install
      npm run dev

Переменные .env:

      SUPABASE_URL=...
      SUPABASE_PUBLISHABLE_KEY=...

▶️ Использование

    1.Войти или использовать демо-аккаунт
    2.Загрузить ЭКГ
    3.Заполнить анкету пациента
    4.Получить анализ + отчёт
    5.Задать вопрос голосовому ассистенту


🔐 Безопасность

    Полный Supabase RLS
    Проверки прав пользователей
    Разделение Storage по user_id
    Валидация Zod
    Минимальный доступ API-ключей



    Последнее обновление: 12.12.2025
    Автор: ALIBEK