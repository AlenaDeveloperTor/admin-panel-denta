# Админ-панель · Стоматология «Улыбка»

Административная панель для мобильного приложения стоматологической клиники.
Реализована по ТЗ (`ТЗ фронтенд админ панель для клиники.docx`) на стеке:

**Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React Query (TanStack) · React Hook Form + Zod · Axios · Recharts · FullCalendar · Zustand · TanStack Table**

---

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # затем отредактируйте ADMIN_API_BASE
npm run dev                  # http://localhost:3000
```

Для продакшена: `npm run build` → `npm start`.

## Конфигурация (`.env.local`)

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `ADMIN_API_BASE` | Базовый URL бэкенда (FastAPI). Админ-эндпоинты монтируются как `{ADMIN_API_BASE}/admin/...` | `http://localhost:8000` |
| `JWT_SECRET` | Секрет для проверки подписи JWT в `proxy.ts`. **Обязателен в production.** Если не задан — токен декодируется без проверки подписи (только для dev) | — |
| `DEFAULT_THEME` | Тема по умолчанию: `light` / `dark` | `light` |

### Как админка ходит в API

- Фронтенд обращается к относительным путям `/admin-api/*` (axios, `withCredentials: true`).
- `next.config.ts` проксирует `/admin-api/:path*` → `{ADMIN_API_BASE}/admin/:path*`.
- Это убирает CORS и позволяет хранить JWT в **httpOnly-куках** на домене админки (требование ТЗ §1.2/§13).

> Пример: `GET /admin-api/users` → `GET {ADMIN_API_BASE}/admin/users`.

## Реализованные разделы (по ТЗ)

| Раздел | Роут | Статус |
|---|---|---|
| Авторизация (email + пароль, httpOnly-куки, авто-refresh) | `/login` | ✅ |
| Защита роутов + проверка роли `admin` | `proxy.ts` (Next 16, ранее middleware) | ✅ |
| Дашборд: KPI-карточки, график Recharts, последние записи | `/dashboard` | ✅ |
| Пациенты: таблица, поиск (debounce 500ms), фильтры, пагинация, CRUD | `/patients` | ✅ |
| Записи: список + календарь FullCalendar, фильтры (дата/врач/статус), смена статуса, создание, экспорт CSV, «Написать пациенту» | `/appointments` | ✅ |
| Услуги: CRUD, загрузка изображения (dropzone), активность | `/services` | ✅ |
| Настройки: данные клиники + журнал входов/выходов (ТЗ §1.2) | `/settings` | ✅ |
| Акции и новости | `/news` | ⏳ «скоро» (по ТЗ пока не делаем) |
| Лояльность | `/loyalty` | ⏳ «скоро» (по ТЗ пока не делаем) |
| Push-рассылка (массовая) | `/push` | ⏳ «скоро» (по ТЗ пока не делаем) |

## Эндпоинты, которые ожидаются от бэкенда

Все запросы — с JWT (роль `admin`), префикс `/admin`:

```
POST   /admin/auth/login          # { email, password } → токены/куки + user
POST   /admin/auth/logout
POST   /admin/auth/refresh        # обновление кук
GET    /admin/auth/me             # текущий администратор
GET    /admin/auth/sessions       # журнал входов/выходов (ТЗ §1.2)
GET    /admin/dashboard/stats     # KPI
GET    /admin/dashboard/chart     # точки графика { points: [{date, count}] }
GET    /admin/users               # ?page=&limit=&search=&has_points=&date_from=
POST   /admin/users               # { first_name, last_name, phone, email }
PATCH  /admin/users/{id}
DELETE /admin/users/{id}
GET    /admin/appointments        # ?date_from=&date_to=&doctor=&status=&page=&limit=
POST   /admin/appointments        # { user_id, service_id, doctor_id, date, time, comment }
PATCH  /admin/appointments/{id}   # { status: confirmed|cancelled|completed|pending }
GET    /admin/appointments/{id}
GET    /admin/doctors             # список врачей для фильтра/формы
GET    /admin/services            # список услуг
POST   /admin/services
PATCH  /admin/services/{id}
DELETE /admin/services/{id}
GET    /admin/settings            # { name, phone, email, address, work_hours, about }
PATCH  /admin/settings
POST   /admin/upload              # multipart → { url }
POST   /admin/push/send-by-phone  # { phone, title, body, deep_link } — из карточки записи
```

> Ответы списков пагинируются. Фронтенд принимает варианты: `{data: [...], total, page, per_page}` или `{items, total}`.

## Структура проекта

```
src/
├── app/                    # роуты App Router
│   ├── login/              # страница входа
│   ├── (panel)/            # защищённые разделы (sidebar + header)
│   │   ├── dashboard/ patients/ appointments/ services/ settings/
│   │   └── news/ loyalty/ push/          # плейсхолдеры «скоро»
│   └── api/session/        # BFF: установка/очистка httpOnly-кук
├── components/
│   ├── layout/             # Shell, Sidebar, Header
│   ├── ui/                 # Button, Input, Modal, DataTable, Pagination и др.
│   ├── dashboard/ patients/ appointments/ services/ settings/
│   └── shared/             # PageHeader, ComingSoon, PushModal
├── hooks/queries/          # обёртки React Query по сущностям
├── lib/api/                # axios-клиент + модули API
├── schemas/                # Zod-схемы форм
├── stores/                 # Zustand: пользователь, UI (тема/sidebar), фильтры
├── types/                  # типы (переиспользуют модели мобильного приложения)
└── proxy.ts                # защита роутов (Next 16 proxy, бывший middleware)
```

## Ключевые архитектурные решения

- **Аутентификация**: JWT в httpOnly-куках. `proxy.ts` проверяет подпись (jose) и роль `admin`.
  Если бэкенд возвращает токены в теле ответа (а не `Set-Cookie`) — фронтенд сам кладёт их
  в httpOnly-куки через BFF-роут `/api/session`.
- **Авто-refresh**: axios-перехватчик 401 → single-flight `POST /admin/auth/refresh` → повтор
  исходного запроса; при неудаче — редирект на `/login?expired=1`.
- **Данные**: React Query (кэш, инвалидация, оптимистичные скелетоны). Фильтры записей хранятся
  в Zustand и переживают переходы между страницами.
- **Формы**: React Hook Form + Zod; загрузка изображений через react-dropzone → `POST /admin/upload`.
- **Адаптивность**: sidebar превращается в выдвижное меню на планшетах/мобильных; таблицы
  скроллятся по горизонтали.
- **Тёмная тема**: переключатель в header, класс `dark` на `<html>`, без «вспышки» при загрузке.

## Что осталось на следующие этапы (по ТЗ)

- Модуль «Акции и новости» (rich-text редактор, даты публикации/окончания).
- Модуль «Лояльность» (правила начисления/списания, история по пациентам).
- Модуль «Push-рассылка» (массовая отправка, прогресс по `task_id`, история).
- Экспорт CSV для записей уже есть; для пациентов — по кнопке (готово к подключению).
- Уведомления внутри админки о новых записях (WebSockets/polling).
