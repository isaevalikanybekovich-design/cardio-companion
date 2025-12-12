# Руководство по развертыванию

## Развертывание на Lovable Cloud

### Автоматическое развертывание

Lovable Cloud автоматически развертывает ваше приложение при каждом изменении кода:

1. **Frontend**: Требует ручного обновления через кнопку "Update"
2. **Backend**: Развертывается автоматически (Edge Functions, миграции БД)

### Шаги для публикации

#### 1. Откройте диалог публикации

**Desktop**: Кнопка "Publish" в верхнем правом углу  
**Mobile**: Кнопка в правом нижнем углу (режим Preview)

#### 2. Нажмите "Update"

Это развернет последние изменения frontend на продакшн.

#### 3. Получите URL

Ваше приложение будет доступно по адресу:
```
https://[your-project].lovable.app
```

---

## Подключение собственного домена

### Требования

- Платная подписка Lovable (Pro/Business/Enterprise)
- Доступ к DNS-настройкам домена

### Шаги настройки

1. **Откройте настройки проекта**:
   ```
   Project → Settings → Domains
   ```

2. **Нажмите "Connect Domain"**

3. **Введите ваш домен**:
   - Основной: `yourdomain.com`
   - Поддомен: `app.yourdomain.com`

4. **Настройте DNS записи**:

   Для основного домена:
   ```
   A     @     76.76.21.21
   ```

   Для поддомена:
   ```
   CNAME  app   cname.lovable.app
   ```

5. **Дождитесь проверки** (обычно 5-15 минут)

6. **SSL сертификат выдается автоматически** (Let's Encrypt)

---

## Переменные окружения

### Автоматические переменные

Lovable Cloud автоматически предоставляет:

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### Секреты Edge Functions

Автоматически доступны в Edge Functions:

```typescript
LOVABLE_API_KEY              // Ключ для AI Gateway
SUPABASE_URL                 // URL проекта
SUPABASE_ANON_KEY            // Публичный ключ
SUPABASE_SERVICE_ROLE_KEY    // Служебный ключ
SUPABASE_DB_URL              // URL базы данных
```

### Добавление собственных секретов

1. Перейдите в Lovable UI
2. Settings → Integrations → Lovable Cloud → Secrets
3. Добавьте новый секрет
4. Используйте в Edge Functions:

```typescript
const MY_SECRET = Deno.env.get('MY_SECRET');
```

---

## Мониторинг и логи

### Просмотр логов Edge Functions

1. Откройте Lovable Cloud UI
2. Перейдите: Cloud → Functions
3. Выберите функцию
4. Вкладка "Logs"

### Фильтрация логов

```typescript
// В Edge Function добавьте логирование
console.log('Info:', data);
console.error('Error:', error);
console.warn('Warning:', warning);
```

Логи отображаются в реальном времени с фильтрами:
- Info
- Error
- Warning

### Мониторинг базы данных

1. Cloud → Database → Tables
2. Просмотр количества записей
3. Экспорт данных

---

## Резервное копирование

### База данных

**Автоматические бэкапы**: Lovable Cloud создает ежедневные бэкапы

**Ручной экспорт**:
1. Cloud → Database → Tables
2. Выберите таблицу
3. Кнопка "Export" → CSV/JSON

### Файлы (Storage)

**Нет автоматических бэкапов Storage**

Рекомендации:
- Регулярно экспортируйте критичные файлы
- Используйте внешнее хранилище для архивирования

---

## Масштабирование

### Настройка размера инстанса

1. Settings → Cloud → Advanced settings
2. Выберите размер инстанса:
   - **Micro**: Разработка и тестирование
   - **Small**: До 1000 пользователей/день
   - **Medium**: До 10,000 пользователей/день
   - **Large**: До 100,000 пользователей/день

⚠️ **Внимание**: Изменение размера занимает до 10 минут

### Оптимизация производительности

#### База данных

1. **Создайте индексы на часто запрашиваемых столбцах**:
```sql
CREATE INDEX idx_ecg_scans_user_id ON ecg_scans(user_id);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
```

2. **Используйте `.select()` с конкретными полями**:
```typescript
// ❌ Плохо
const { data } = await supabase.from('patients').select('*');

// ✅ Хорошо
const { data } = await supabase.from('patients')
  .select('id, age, gender');
```

#### Edge Functions

1. **Кэшируйте результаты AI**:
```typescript
// Проверьте кэш перед вызовом AI
const cached = await checkCache(ecgScanId);
if (cached) return cached;
```

2. **Используйте батчинг для множественных запросов**

3. **Добавьте таймауты**:
```typescript
const timeout = setTimeout(() => {
  throw new Error('Timeout');
}, 30000);
```

---

## CI/CD с GitHub

### Подключение репозитория

1. Нажмите кнопку GitHub в Lovable UI (верхний правый угол)
2. Авторизуйте доступ
3. Выберите репозиторий или создайте новый

### Автоматическое развертывание

После подключения GitHub:
- **Push в main** → автоматическое развертывание backend
- Frontend требует ручного "Update" в UI

### Локальная разработка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Установить зависимости
npm install

# Запустить локально
npm run dev

# Отправить изменения
git add .
git commit -m "feat: add new feature"
git push origin main
```

---

## Откат изменений

### Frontend

1. Project → Settings → Version History
2. Выберите предыдущую версию
3. "Restore this version"
4. Нажмите "Update" для публикации

### Backend (Edge Functions)

⚠️ **Невозможно откатить Edge Functions через UI**

Решение:
1. Восстановите предыдущую версию кода из Git
2. Функции автоматически пересоздадутся

### База данных

⚠️ **Миграции необратимы**

Рекомендации:
- Тестируйте миграции локально
- Создавайте бэкапы перед важными изменениями
- Используйте транзакции в миграциях

---

## Безопасность при развертывании

### Чеклист перед продакшном

- [ ] Все RLS политики настроены
- [ ] Auto-confirm email **отключен** (для продакшна)
- [ ] Секреты не хранятся в коде
- [ ] HTTPS включен (автоматически)
- [ ] Rate limiting настроен для AI Gateway
- [ ] Проведен security scan

### Включение email-подтверждения

Для продакшна отключите auto-confirm:

1. Cloud → Auth → Settings
2. "Auto-confirm email signups" → OFF
3. Настройте SMTP (опционально)

---

## Мониторинг использования

### Проверка квоты AI

1. Settings → Workspace → Usage
2. Просмотр:
   - Использованные кредиты
   - Лимиты запросов
   - Оставшаяся квота

### Уведомления о превышении

Настройте email-уведомления:
1. Settings → Notifications
2. Включите "Usage alerts"
3. Установите порог (например, 80%)

---

## Troubleshooting развертывания

### "Update failed"

**Причина**: Ошибка сборки frontend

**Решение**:
1. Проверьте консоль браузера на ошибки
2. Запустите `npm run build` локально
3. Исправьте ошибки TypeScript/ESLint

---

### "Edge function not responding"

**Причина**: Таймаут или ошибка в функции

**Решение**:
1. Проверьте логи: Cloud → Functions → [function] → Logs
2. Добавьте обработку ошибок
3. Увеличьте таймаут (макс 60 сек)

---

### "Database migration failed"

**Причина**: Синтаксическая ошибка в SQL

**Решение**:
1. Проверьте логи миграции
2. Исправьте SQL в новой миграции
3. **Не удаляйте** неудачные миграции

---

## Production Checklist

Перед запуском в продакшн:

### Обязательно

- [ ] Отключить auto-confirm email
- [ ] Настроить RLS на всех таблицах
- [ ] Создать резервную копию БД
- [ ] Протестировать все функции
- [ ] Настроить мониторинг
- [ ] Добавить rate limiting

### Рекомендуется

- [ ] Подключить собственный домен
- [ ] Настроить SMTP для email
- [ ] Увеличить размер инстанса
- [ ] Создать staging-окружение
- [ ] Настроить логирование ошибок
- [ ] Провести security audit

---

## Контакты поддержки

- **Документация**: https://docs.lovable.dev/
- **Discord**: https://discord.gg/lovable
- **Email**: support@lovable.dev
- **Enterprise**: https://enterprise.lovable.dev/
