### Ключевое про то, как админка ходит на бэкенд

- Админка делает все запросы на относительный путь `/admin-api/...` : запрос `/admin-api/users` через Next.js проксируется на ваш `{BACKEND}/admin/users`.
- Все админские эндпоинты монтируются под префиксом `/admin`. То есть реальный путь = `http://<backend>/admin/users` и т.д.
- Авторизация — JWT, роль `admin`. Токен админка получает при логине.
- Админка ожидает, что бэкенд отдаёт куки (`Set-Cookie: access_token, refresh_token, httpOnly`) ИЛИ возвращает токены в теле ответа (тогда Next.js сам сохранит их в httpOnly-куки через BFF). На выбор разработчика, но куки предпочтительнее (безопаснее от XSS).
**Выбираем токены в теле ответа**
- Формат ошибок: Используется кастомный `APIException`. Ответ выглядит так:
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "msg": "текст ошибки"
  }
}
```

---

## 2. Общие соглашения (важно, иначе сломается фронт)

### 2.1. Формат списков с пагинацией

Списочные эндпоинты (например, `/admin/users`, `/admin/appointments` и т.п.) возвращают:

```json
{
  "items": [ ... ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

- `items` — массив объектов текущей страницы.
- `total` — общее количество записей (для пагинации и счётчиков).
- `page` — текущая страница, `limit` — сколько запрошено.

Параметры на входе: `page` (с 1), `limit` (по умолчанию 20).

### 2.2. Формат дат

- Даты-моменты (`created_at` и т.п.) — ISO 8601, например `2026-08-22T10:30:00Z`.

### 2.3. Номера телефонов

- Хранятся и принимаются в едином нормализованном формате `+7XXXXXXXXXX` (без пробелов/скобок/дефисов). Так шлют и приложение, и админка.

### 2.4. Роли

- Только пользователи с ролью `admin` или `manager` имеют доступ к `/admin/*`.
- Роль должна быть в payload JWT (поле `role`) — админка проверяет её на своей стороне.

---

## 3. Модели данных (что создать в БД)

`id` — числовой (int), постоянный тип во всей модели.

### 3.1. Сотрудник / Админ — admin_staff

Кто входит в админку. Отдельная сущность от клиентов (клиенты — это `users`).

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| name | string | да | ФИО, напр. «Иванова Анна» |
| email | string | да, unique | Логин для входа |
| password_hash | string | да | Хэш пароля (bcrypt) |
| role | enum admin \| manager | да | Роль |
| avatar_url | string | нет | |
| created_at | datetime | да | |

Зачем: логин в админку, вывод имени на дашборде, журнал сессий.

### 3.2. Журнал сессий — admin_session_log

Обязательное требование заказчика: кто и когда входил/выходил, чтобы знать, кто отвечал за записи, пуши и клиентов.

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | uuid | да | |
| user_email | string | да | Email сотрудника |
| user_name | string | нет | Имя на момент входа |
| action | enum login \| logout | да | |
| ip | string | нет | IP клиента |
| user_agent | string | нет | User-Agent |
| created_at | datetime | да | |

Запись создаётся автоматически при каждом входе/выходе.

### 3.3. Пациент (клиент) — users

Общая модель клиента (есть и в мобильном приложении).

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| phone | string | да, unique | +7XXXXXXXXXX |
| first_name | string | нет | |
| last_name | string | нет | |
| patronymic | string | нет | Отчество |
| birth_date | date | нет | |
| email | string | нет | |
| avatar_url | string | нет | |
| is_active | bool | да, default True | |
| loyalty_balance | int | да, default 0 | Текущий баланс баллов |
| created_at | datetime | да | Дата регистрации |

Зачем нужен `loyalty_balance` прямо на пользователе: админка показывает баллы в таблице и карточке пациента, фильтрует «с баллами (>0)». Держите его синхронно с операциями из раздела 3.9.

### 3.4. Услуга — services

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| name | string | да | «Лечение кариеса» |
| description | string | нет | |
| price | Numeric(10, 2) | да | В рублях до 2 цифр после запятой |
| duration | int | да | Минуты (15/30/45/60/90/120) |
| image_url | string | нет | Для баннера |
| is_active | bool | да | Показывать ли в приложении |
| created_at | datetime | да | |

### 3.5. Запись на приём — appointments

Центральная модель. Одна запись = один визит клиента.

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| user_id | int (FK→users) | нет | Может быть NULL (клиент мог не залогиниться) |
| service_id | int (FK→services) | да | |
| appointment_datetime | datetime | нет | Заполняется админом/менеджером при подтверждении записи (сразу же datetime для уведомлений) |
| status | enum | да | см. ниже |
| comment | string | нет | Комментарий клиента |
| created_at | datetime | да | Когда создана заявка |

Статусы записи (важно!):

```python
class AppointmentStatus(str, Enum):
    created   = "created"    # клиент оставил заявку (из приложения)
    pending   = "pending"    # заявка ждёт подтверждения админом
    confirmed = "confirmed"  # админ подтвердил
    cancelled = "cancelled"  # отменена
    completed = "completed"  # визит состоялся
```

Зачем два статуса `created` и `pending`: мобильное приложение создаёт заявку — ей присваивается `created` (или `pending`, на ваше усмотрение, главное — админка должна видеть и то и другое как «новые заявки»). Админ подтверждает → `confirmed`, отклоняет → `cancelled`.

> ⚠️ Админка в разделе «Заявки» запрашивает сразу и `pending`, и `created`. Убедитесь, что `GET /admin/appointments` умеет фильтровать по `status` и возвращать оба.

Связанные данные: админка ожидает в объекте записи вложенные `service`, `patient` (см. 4.4).

### 3.6. Устройство (Push-токен) — push_tokens

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| device_id | string | да, unique | ID устройства |
| user_id | int (FK→users) | да | Владелец устройства |
| token | string | да | FCM (Expo push) токен |
| platform | enum ios \| android | да | |
| is_active | bool | да | |
| created_at | datetime | да | |
| last_used_at | datetime | нет | Для чистки мёртвых токенов |

Уже есть эндпоинты мобильного приложения: `POST /push/register` (`{device_id, token, platform}`), `POST /push/unregister` (`{device_id}`). Если их ещё нет — добавьте.

Вместо хранения множества токенов на пользователя, хранятся устройства по `device_id`, и к ним привязывается токен. Это позволяет обновлять токен для конкретного устройства, не плодя дубликаты. `POST /push/register` принимает обязательные `token`, `platform`, `device_id`.

### 3.7. Рассылка — push_campaign

История рассылок + асинхронная отправка.

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| title | string | да | Заголовок |
| body | string | да | Текст |
| deep_link | string | нет | app://appointments |
| image_url | string | нет | |
| target | enum all \| users | да | Кому |
| patient_ids | int[] (массив) | нет | Список ID получателей (если target = users) |
| recipients_count | int | да | Сколько получателей выбрано |
| accept_count | int | да, default 0 | Сколько отправлено в API Expo |
| sent_count | int | да, default 0 | Сколько реально доставлено |
| status | enum pending \| in_progress \| sent \| partial \| failed | да | |
| task_id | string/uuid | нет | id фоновой задачи |
| created_by | int (FK→admin_staff) | нет | Кто отправил |
| created_at | datetime | да | |
| started_at | datetime | нет | Когда началась отправка |
| finished_at | datetime | нет | Когда закончилась |

Почему статусы такие: `pending` — в очереди, `in_progress` — шлём, `sent` — всё доставлено, `partial` — часть упала, `failed` — ошибка.

Разница между `accept_count` и `sent_count`:
- `accept_count` — количество, принятое API Expo (заполняется сразу)
- `sent_count` — количество, реально доставленное на устройства (обновляется асинхронно через ~15 сек)

### 3.8. Уведомление в приложении — messages

Хранит уведомления, которые пользователь видит в разделе «Уведомления» мобильного приложения. Создаётся автоматически при любой отправке push-уведомления (массовой или персональной).

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| user_id | int (FK→users) | да | Получатель |
| category | string | да | Категория, напр. `promo`, `system`, `info` |
| title | string | да | Заголовок уведомления |
| body | string | да | Текст уведомления |
| deep_link | string | нет | Ссылка внутри приложения, напр. `app://appointments` |
| banner_id | int (FK→banners) | нет | Связь с таблицей баннеров |
| campaign_id | int (FK→push_campaign) | нет | Ссылка на кампанию (если из массовой рассылки) |
| is_read | bool | да, default false | Прочитано ли |
| created_at | datetime | да | |

Как создаются записи:
- **Массовая рассылка** (`POST /admin/push/send-all`): фоновая задача, рассылая push, параллельно создаёт запись `messages` для каждого получателя (`user_id` берётся из `push_tokens`). Поле `campaign_id` заполняется.
- **Персональная рассылка** (`POST /admin/push/send`): для каждого `user_id` из `patient_ids` создаётся запись `messages`. Поле `campaign_id` = null (или можно тоже создать campaign с target=phones).
- **Системные уведомления** (напр. «Ваша запись подтверждена»): бэкенд сам создаёт `messages` при смене статуса записи на `confirmed`/`cancelled`/`completed`, и отправляет push.

### 3.9. Лояльность: операция — loyalty_transactions

| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| id | int | да | |
| user_id | int (FK→users) | да | Кому |
| amount | int | да | + начисление, − списание |
| reason | string | да | Причина |
| source | enum manual \| auto | да, default manual | Пока что всегда ручная операция |
| created_at | datetime | да | |

Зачем: «История операций» в админке (поиск по телефону), карточка пациента, баланс в приложении.
Каждая операция делается с изменением `loyalty_balance` у пользователя.

Лояльность работает **только вручную**: оплаты в приложении нет, поэтому менеджер сам начисляет и списывает баллы за каждое посещение. Проценты начисления и списания хранятся в `clinic_settings` (`accrual_percent`, `write_off_percent`) — фронт (админка) показывает их менеджеру как подсказку при ручном начислении, но бэкенд **не** применяет их автоматически.

### 3.10. Настройки клиники — clinic_settings (одна строка)

| Поле | Тип | Описание |
|---|---|---|
| name | string | «Стоматология „Улыбка"» |
| phone | string | |
| email | string | |
| address | string | |
| work_hours | string | |
| about | string | |
| accrual_percent | int | Процент от стоимости услуги, начисляемый баллами (напр. 10 = 10%) |
| write_off_percent | int | Процент от стоимости, который можно покрыть баллами (напр. 20 = до 20% скидка) |

Админ может менять проценты через `PATCH /admin/settings`. Эти значения используются как справочные — менеджер видит подсказку «начислить X баллов (10% от 5000₽)» и подтверждает вручную.

---

## 4. Эндпоинты админ-панели

> Все пути — с префиксом `/admin`. Авторизация: JWT, роль `admin`. Если токен невалиден/нет роли — 401.

### 4.1. Авторизация (/admin/auth)
- Зачем: страница входа (Email + Пароль).
- Тело:
{ "email": "admin@clinic.ru", "password": "secret" }
- Ответ: либо куки access_token/refresh_token (httpOnly), либо тело:
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "user": { "id":1, "name":"Анна", "email":"admin@clinic.ru", "role":"admin" } }
- Ошибки: 401 {"detail": "Неверный email или пароль"}. Рекомендуется rate-limit (5 попыток/мин).
- Обязательно: записать строку в admin_session_log (action=login).

#### POST /admin/auth/refresh — обновление токена
- Зачем: админка автоматически обновляет сессию по кукам (axios-интерцептор).
- Ответ: новые access_token/refresh_token (куки или тело).

#### POST /admin/auth/logout — выход
- Зачем: кнопка «Выйти».
- Ответ: 200. Записать строку в admin_session_log (action=logout). Почистить куки.

#### GET /admin/auth/me — текущий сотрудник
- Зачем: имя на дашборде, аватар, роль.
- Ответ: { "id":1, "name":"Анна", "email":"admin@clinic.ru", "role":"admin", "avatar_url":null }

#### GET /admin/auth/sessions — история входов/выходов
- Зачем: «Настройки → История входов и выходов» (журнал безопасности).
- Ответ: массив admin_session_log (новые сверху):
[ { "id":"...", "user_email":"admin@clinic.ru", "user_name":"Анна", "action":"login", "ip":"1.2.3.4", "user_agent":"Mozilla/...", "created_at":"2026-08-22T10:00:00Z" } ]

### 4.2. Пациенты (/admin/users)

#### GET /admin/users — список пациентов (таблица «Пациенты»)
- **Зачем**: основная таблица. Поиск по телефону/ФИО, фильтры по дате регистрации и наличию баллов, пагинация.
- **Query**: `page` (1), `limit` (20), `search` (по телефону/имени, LIKE), `has_points=true` (только `loyalty_balance > 0`), `date_from`/`date_to` (YYYY-MM-DD, фильтр по `created_at`).
- **Ответ**:
```json
{
  "items": [
    {
      "id": 1,
      "phone": "+79991234567",
      "first_name": "Иван",
      "last_name": "Иванов",
      "patronymic": null,
      "birth_date": null,
      "email": "i@mail.ru",
      "loyalty_balance": 150,
      "created_at": "2026-08-22T10:00:00Z",
      "avatar_url": null
    }
  ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/users/{id}, POST /admin/users, PATCH /admin/users/{id}
CRUD операции для пользователей.

### 4.3. Услуги (/admin/services)
Полный CRUD: `GET` (список), `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`.

### 4.4. Записи (/admin/appointments)

#### GET /admin/appointments — список записей
- **Зачем**: раздел «Записи» (список + календарь), раздел «Заявки», карточка пациента.
- **Query**: `page`, `limit`, `date_from`, `date_to` (по `appointment_datetime`), `status` (created|pending|confirmed|cancelled|completed, можно несколько), `user_id`.
- **Ответ** (Элемент с вложенными объектами `service` и `patient`):
```json
{
  "items": [
      {
        "id": 1,
        "user_id": 1,
        "patient": {
          "id": 1,
          "phone": "+79991234567",
          "first_name": "Иван",
          "last_name": "Иванов",
          "patronymic": null,
          "birth_date": null,
          "email": "i@mail.ru",
          "loyalty_balance": 150
        },
        "service_id": 3,
        "service": {
          "id": 3,
          "name": "Лечение кариеса",
          "price": 5000,
          "duration": 60
        },
        "appointment_datetime": "2026-08-25T15:00:00Z",
        "status": "pending",
        "comment": "Болит зуб, лучше во второй половине дня",
        "created_at": "2026-08-22T09:15:00Z"
    }
  ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```
> `patient` может быть null (клиент не зарегистрирован, но оставил заявку по телефону). Фронт это обрабатывает.

#### GET /admin/appointments/{id} — детали записи
- **Ответ**: объект как выше.

#### POST /admin/appointments — создать запись админом
- **Тело**: `{ "user_id":1, "service_id":3, "appointment_datetime":"2026-08-25T15:00:00Z", "comment":"..." }`

#### PATCH /admin/appointments/{id} — изменить статус
- **Тело**: `{ "status": "confirmed" }` (или cancelled, completed). **Ответ**: обновлённый объект.

### 4.5. Push-уведомления (/admin/push)

#### POST /admin/push/send-all — массовая рассылка всем
- **Зачем**: «Push-рассылка → Все пациенты».
- **Тело**:
  `{ "title":"Акция", "body":"Скидка 20%!", "deep_link":"app://appointments", "image_url":"https://..." }`
- **Ответ**: `{ "task_id": "uuid-задачи" }`
- **Логика**: собрать все активные FCM-токены → создать push_campaign (status=in_progress) → запустить фоновую отправку → для каждого получателя создать запись в `messages` (campaign_id заполнен) → вернуть task_id.

#### POST /admin/push/send — точечная/выборочная
- **Зачем**: индивидуальные пуши конкретным клиентам.
- **Тело** (по user_id):
  `{ "title":"Запись подтверждена", "body":"Ждем вас...", "deep_link":"app://appointments", "patient_ids":[1, 2, 3] }`
- **Ответ**: `{ "task_id": "uuid-задачи" }`
- **Логика**: по user_id найти users (если нет — пропустить), собрать их токены → фоновая отправка → для каждого получателя создать запись в `messages` (campaign_id = null) → вернуть task_id.

В админке будет наверное поле ввода телефона, которое будет искать пользователей по телефону, в ответе будут user_id (их и надо посылать)

#### GET /admin/push/history — история рассылок
- **Зачем**: таблица «История рассылок».
- **Ответ**: массив (или {items}) push_campaign, новые сверху:
```json
{
  "items": [
      {
        "id":1,
        "title":"Акция",
        "body":"...",
        "deep_link":"...",
        "target":"all",
        "patient_ids": null,
        "recipients_count":500,
        "sent_count":498,
        "status":"sent",
        "task_id":"uuid", "created_at":"2026-08-22T15:30:00Z"
      }
  ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/push/task-status/{task_id} — статус отправки
- **Зачем**: прогресс-бар «Отправлено N из M».
- **Ответ**:
  `{ "task_id":"uuid", "status":"in_progress", "total":500, "accept":500, "sent":230, "failed":0, "progress":100 }`
- **Поля**:
  - `accept` — сколько отправлено в API Expo (сразу после отправки)
  - `sent` — сколько реально доставлено (обновляется асинхронно каждые ~15 сек)
  - `progress` — 0..100, рассчитывается от `accept` / `total`
- Когда `status` === `completed`/`failed` — админка останавливает опрос.

### 4.6. Лояльность (/admin/loyalty)

Лояльность работает только вручную. Проценты начисления/списания хранятся в `clinic_settings` и служат подсказкой для менеджера.

#### GET /admin/loyalty/history — история операций
- **Query**: `phone` (+7...), `user_id`, `page`, `limit`.
- **Ответ**: массив loyalty_transactions, новые сверху:
```json
{
  "items": [
      {
        "id":1,
        "user_id":1,
        "phone":"+79991234567",
        "user_name":"Иванов Иван",
        "amount":100,
        "reason":"10% от услуги «Лечение кариеса» (5000₽)",
        "source":"manual",
        "created_at":"..."
      }
  ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

#### POST /admin/loyalty/transactions — ручное начисление/списание
- **Зачем**: менеджер начисляет/списывает баллы конкретному пациенту (кнопка «Баллы» в карточке).
- **Тело**: `{ "user_id": 1, "amount": 100, "reason": "10% от услуги" }` (`amount > 0` — начисление, `< 0` — списание).
- **Логика**: создать `loyalty_transactions` (source=`"manual"`) и обновить `users.loyalty_balance`. Если при списании баланс станет отрицательным — вернуть ошибку.
- **Ответ**: созданная операция.

> **Как это работает на практике:**
> 1. Менеджер завершает запись (статус → `completed`).
> 2. В карточке пациента нажимает «Начислить баллы». Админка подставляет подсказку: `accrual_percent`% от стоимости услуги (из `clinic_settings`).
> 3. Менеджер подтверждает или корректирует сумму → `POST /admin/loyalty/transactions`.
> 4. Списание — аналогично: менеджер указывает отрицательную сумму с причиной.

### 4.7. Загрузка файлов
#### POST /admin/upload
- **Зачем**: картинки услуг/акций (multipart).
- **Тело**: multipart/form-data, поле file.
- **Ответ**: `{ "url": "https://..." }`

### 4.8. Настройки клиники (/admin/settings)

#### GET /admin/settings — получить настройки
- **Зачем**: страница «Настройки» в админке.
- **Ответ**:
```json
{
  "name": "Стоматология «Улыбка»",
  "phone": "+74951234567",
  "email": "info@clinic.ru",
  "address": "ул. Примерная, 1",
  "work_hours": "Пн-Пт 9:00-20:00, Сб 10:00-16:00",
  "about": "Современная стоматология...",
  "accrual_percent": 10,
  "write_off_percent": 20
}
```

#### PATCH /admin/settings — обновить настройки
- **Зачем**: админ меняет название, контакты, проценты лояльности.
- **Тело** (частичное обновление): `{ "accrual_percent": 15, "phone": "+74959876543" }`
- **Ответ**: обновлённый объект настроек.

### 4.9. Сотрудники (/admin/staff)
**Доступ только для пользователей с ролью `admin`**. Менеджеры (`manager`) сюда доступа не имеют.

#### GET /admin/staff — список сотрудников
- **Зачем**: управление доступом в админку.
- **Ответ**: массив `admin_staff` (без паролей).

#### POST /admin/staff — создать сотрудника
- **Тело**: `{ "name": "Иван", "email": "ivan@clinic.ru", "password": "...", "role": "manager" }`
- **Логика**: бэкенд хэширует `password` и сохраняет в `password_hash`. Возвращает созданного юзера.

#### PATCH /admin/staff/{id} — изменить сотрудника
- **Тело**: `{ "name": "Иван", "role": "admin", "password": "new_password" }` (все поля опциональны).
- **Логика**: если передан `password`, бэкенд хэширует его и обновляет `password_hash`.

#### DELETE /admin/staff/{id} — удалить сотрудника
- **Зачем**: закрыть доступ уволенному сотруднику. (Либо добавить поле `is_active` в модель `admin_staff` и делать soft delete).

---

## 5. Что уже шлёт мобильное приложение (для контекста)

- `POST /appointments` — создание заявки клиентом: `{ "service_id": 3, "phone": "+79991234567", "comment": "..." }`. Номер телефона проходит нормализацию.
- `GET /appointments/my`, `DELETE /appointments/{id}` — записи и отмена клиентом.
- `POST /push/register` — регистрация FCM-токенов. Ожидает передачи `device_id`, `token` и `platform`.
- `GET /loyalty/balance`, `GET /loyalty/history` — баланс и история клиента.

### Уведомления (Client API)

Эндпоинты, которые запрашивает само мобильное приложение. Авторизация по токену пациента.

#### GET /messages — список уведомлений пользователя
- **Зачем**: раздел «Уведомления» в приложении.
- **Query**: `page`, `limit`.
- **Ответ**: массив уведомлений, новые сверху, плюс счетчик непрочитанных.
```json
{
  "items": [
    {
      "id": 123,
      "category": "promo",
      "title": "Скидка 20% на имплантацию",
      "body": "Только до конца месяца",
      "is_read": false,
      "created_at": "2026-08-19T10:00:00Z",
      "banner": {
        "image_url": "https://cdn.example.com/promo.jpg",
        "bg_color": "#0A7DFF",
        "button_text": "Записаться"
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "unread_count": 5
}
```

#### PATCH /messages/{id}/read — отметить одно как прочитанное
- **Ответ**: `{ "success": true }`

#### PATCH /messages/read-all — прочитать все
- **Ответ**: `{ "success": true }`

#### GET /messages/unread-count — количество непрочитанных
- **Зачем**: бейдж (красная точка) на иконке колокольчика на главном экране.
- **Ответ**: `{ "count": 5 }`

---

## 6. Чек-лист
- [ ] Модели: `users`, `services`, `appointments`, `admin_staff`, `admin_session_log`, `push_tokens`, `push_campaign`, `messages`, `loyalty_transactions`, `clinic_settings`.
- [ ] Формат ошибок `APIException`: `{ status: "error", error: { code, msg } }`.
- [ ] Формат списков `{ items, total, page, limit }` (через параметры `page`, `limit`).
- [ ] `/admin/users` — CRUD + поиск + фильтры.
- [ ] `/admin/appointments` — список (вложенные `service`, `patient`, фильтры `status`/`date`/`user_id`), детали, создание, смену статуса. Единое поле `appointment_datetime` (ISO 8601).
- [ ] `/admin/push/*` — асинхронная отправка (`send-all`, `send`, `history`, `task-status`). При отправке push создавать `messages` для каждого получателя.
- [ ] `/admin/loyalty/*` — история, ручные операции (без автоначисления, проценты в `clinic_settings`).
- [ ] `/admin/settings` — GET + PATCH (включая `accrual_percent`, `write_off_percent`).
- [ ] `/admin/upload`, `/admin/auth/*`.
- [ ] Мобильное API: `GET /messages`, `PATCH /messages/{id}/read`, `PATCH /messages/read-all`, `GET /messages/unread-count`.
