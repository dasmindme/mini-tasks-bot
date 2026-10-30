# Soft Checklist — Telegram Mini App

Нежный ежедневный чек-лист внутри Telegram. Frontend на React + Vite живёт на GitHub Pages, данные — в Supabase PostgreSQL, вся работа с данными идёт через Supabase Edge Functions с проверкой Telegram `initData`.

## Архитектура

```
Telegram Mini App (GitHub Pages)
  │  window.Telegram.WebApp.initData
  ▼
Supabase Edge Functions  ── проверяют HMAC-подпись initData через TELEGRAM_BOT_TOKEN
  │                         и используют SUPABASE_SERVICE_ROLE_KEY
  ▼
PostgreSQL (RLS включён, прямых политик для anon нет)
```

- Frontend получает только публичные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
- Anon key используется лишь для вызова Edge Functions (JWT-проверка Supabase).
- `TELEGRAM_BOT_TOKEN` и `SUPABASE_SERVICE_ROLE_KEY` хранятся только в секретах Supabase.
- Каждая Edge Function сама определяет пользователя по проверенному `initData` и фильтрует данные по его `user_id`.
- RLS включён на всех таблицах. Политик для `anon`/`authenticated` нет, поэтому прямой доступ к таблицам закрыт.
- Выполнение задач хранится отдельно на каждую дату. Ежедневная задача автоматически «сбрасывается» на следующий день.

## Структура

```
.
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .github/workflows/deploy.yml
├── src/
│   ├── api/                 # вызовы Edge Functions
│   ├── components/
│   ├── pages/
│   ├── telegram/
│   ├── utils/
│   └── styles/
└── supabase/
    ├── migrations/001_initial_schema.sql
    └── functions/
        ├── _shared/         # проверка initData, Supabase-клиент, CORS
        ├── auth-telegram/
        ├── get-today/
        ├── create-task/
        ├── update-task/
        ├── delete-task/
        ├── complete-task/
        ├── uncomplete-task/
        └── categories/
```

## 1. База данных Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. Откройте **SQL Editor** и выполните содержимое файла
   [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
3. Проверьте, что таблицы `users`, `categories`, `tasks`, `task_completions` созданы и RLS включён.

Через Supabase CLI это можно сделать так:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 2. Секреты и деплой Edge Functions

Установите Supabase CLI, затем задайте секреты:

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN=123456:ABC... \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в hosted-проекте обычно уже доступны функциям автоматически, но явное указание не помешает.

Задеплойте все функции:

```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

Не отключайте JWT-проверку Supabase для функций: frontend отправляет anon key, а подлинность пользователя дополнительно подтверждается проверкой Telegram `initData` внутри каждой функции.

### Как проверяется initData

Алгоритм из документации Telegram:

1. Из строки `initData` убирается параметр `hash`.
2. Остальные параметры сортируются по ключу и склеиваются через `\n`.
3. `secret_key = HMAC_SHA256("WebAppData", bot_token)`.
4. `calculated_hash = HMAC_SHA256(secret_key, data_check_string)`.
5. Результат сравнивается с `hash`, а `auth_date` проверяется на свежесть (24 часа).

## 3. Telegram-бот через BotFather

1. Откройте [@BotFather](https://t.me/BotFather).
2. Отправьте `/newbot`, придумайте имя и username.
3. Сохраните токен — это `TELEGRAM_BOT_TOKEN` для Supabase Secrets. Никогда не публикуйте его.
4. При необходимости настройте описание и аватар через `/setdescription`, `/setuserpic`.

## 4. Локальный запуск frontend

```bash
npm install
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
```

Заполните `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Anon key находится в Supabase: **Project Settings → API**.

Запуск:

```bash
npm run dev
```

Vite откроет приложение на `http://localhost:5173/soft-checklist/`. Вне Telegram приложение покажет «Откройте приложение через Telegram», потому что без настоящего `initData` авторизация невозможна — это ожидаемо.

Для проверки внутри Telegram удобно временно открыть локальный HTTPS-туннель (например, ngrok) и указать его как Menu Button URL. Не добавляйте небезопасный обход проверки `initData` в production.

## 5. Деплой frontend на GitHub Pages

### Вариант A: GitHub Actions (рекомендуется)

1. Создайте репозиторий `soft-checklist` и запушьте код в ветку `main`.
2. В **Settings → Secrets and variables → Actions** добавьте:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. В **Settings → Pages** выберите **Source: GitHub Actions**.
4. Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) соберёт и опубликует приложение.
5. Адрес будет вида `https://USERNAME.github.io/soft-checklist/`.

### Вариант B: gh-pages

```bash
npm run build
npm run deploy
```

В `vite.config.js` уже указано `base: '/soft-checklist/'`. Если репозиторий называется иначе, измените `base` на `/<имя-репозитория>/`, иначе статические файлы не загрузятся.

## 6. Menu Button в BotFather

1. Откройте [@BotFather](https://t.me/BotFather).
2. `/mybots` → выберите бота.
3. **Bot Settings → Menu Button → Configure Menu Button**.
4. Укажите URL: `https://USERNAME.github.io/soft-checklist/`.
5. Название кнопки: например, `Чек-лист`.

Эквивалент через Bot API:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button":{"type":"web_app","text":"Чек-лист","web_app":{"url":"https://USERNAME.github.io/soft-checklist/"}}}'
```

Важно: GitHub Pages должен работать по HTTPS, а URL Mini App должен быть публично доступен.

## 7. Edge Functions API

Все функции принимают `POST` с JSON и полем `initData`.

| Функция | Тело запроса | Назначение |
| --- | --- | --- |
| `auth-telegram` | `{ initData }` | Проверка initData, создание пользователя и дефолтных категорий |
| `get-today` | `{ initData, date }` | Задачи на дату, прогресс, группировка по категориям |
| `create-task` | `{ initData, title, categoryId, type, date }` | Создание задачи |
| `update-task` | `{ initData, taskId, title, categoryId, type, date }` | Редактирование задачи |
| `delete-task` | `{ initData, taskId }` | Мягкое удаление (`is_active = false`) |
| `complete-task` | `{ initData, taskId, date }` | Отметка выполнения без дублей |
| `uncomplete-task` | `{ initData, taskId, date }` | Снятие отметки |
| `categories` | `{ initData, action, ... }` | `get`, `create`, `update`, `delete` категорий |

Для нового пользователя автоматически создаются категории: `♡ Красота`, `🧺 Быт`, `✦ Саморазвитие`, `◌ Здоровье`.

## 8. Что можно добавить позже

- Напоминания: scheduled Edge Function / pg_cron читает `users.timezone`, `reminder_time`, `reminders_enabled` и отправляет сообщения через Telegram Bot API.
- Повторы по дням недели: расширить `tasks` полем `repeat_days` и обновить `get-today`.
- Статистика и календарь: отдельные read-only функции поверх `task_completions`.
- Более строгий CORS: заменить `*` в `supabase/functions/_shared/http.ts` на домен GitHub Pages.

## 9. Частые проблемы

- **«Откройте приложение через Telegram»** — приложение открыто в обычном браузере, либо Telegram не передал `initData`.
- **401 «Неверная подпись initData»** — в `TELEGRAM_BOT_TOKEN` лежит токен другого бота или он изменён.
- **401 «initData устарела»** — Mini App был открыт слишком давно; закройте и откройте его заново.
- **404 при вызове функции** — функция не задеплоена или неверный `YOUR_PROJECT_REF`.
- **Белый экран на GitHub Pages** — неверный `base` в `vite.config.js` относительно имени репозитория.
- **Пустые задачи после переименования категории** — это нормально: задачи остаются, категория отображается по актуальному названию.