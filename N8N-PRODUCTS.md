# Загрузка товаров из PostgreSQL через n8n

Магазин на сайте может подгружать товары:
- **из n8n webhook** (запрос к n8n при открытии страницы);
- **из файла в Git** — n8n выгружает данные в репозиторий в один файл `products.json` (без лишних папок), сайт подхватывает его автоматически.

---

## Схема «n8n пушит в Git — сайт читает products.json»

Так не нужно выставлять n8n в интернет: данные лежат в репо рядом с сайтом.

### 1. В n8n: выгрузка в один файл в Git (без лишних папок)

1. **Trigger** — по расписанию (Cron) или вручную (Manual).
2. **Postgres** — запрос к БД, выборка товаров (все нужные поля, в т.ч. `image_path`, `rrp_rub_m2`, `metadata` и т.д.).
3. **Code** (или **Set**) — собрать один массив и подготовить тело файла:
   - Вход: массив элементов из Postgres.
   - Выход: один объект с полем `body` — строка JSON (массив товаров). Формат как в разделе «Формат ответа» ниже (массив объектов, без обёрток).
   - Пример в Code (JavaScript):
   ```js
   const items = $input.all().map(i => i.json);
   return [{ json: { body: JSON.stringify(items) } }];
   ```
4. **GitHub** (нода «GitHub» в n8n):
   - Operation: **Create or update a file** (или **Create or update file**).
   - Repository: твой репозиторий с сайтом (например `makeden-art/parquet-website`).
   - File Path: **`products.json`** — один файл в корне, без лишних папок.
   - Content: `{{ $json.body }}` (то, что собрали в Code).
   - Commit message: например `Update products.json`.
   - Credentials: Personal Access Token (GitHub) с правом `repo`.

Либо через **HTTP Request** к GitHub API:
- Method: **PUT**
- URL: `https://api.github.com/repos/ВЛАДЕЛЕЦ/РЕПО/contents/products.json`
- Headers: `Authorization: token ТВОЙ_GITHUB_TOKEN`, `Content-Type: application/json`
- Body (JSON):
```json
{
  "message": "Update products.json",
  "content": "BASE64_ОТ_JSON_МАССИВА_ТОВАРОВ"
}
```
В Code перед этим посчитай `content` как base64 от строки JSON (массив товаров).

Итог: в репозитории в **корне** лежит один файл **`products.json`** (без вложенных папок типа `data/` или `api/`).

### Картинки: n8n их пушит?

**По умолчанию — нет.** Описанный выше workflow пушит только **`products.json`** (текст: названия, цены, пути к картинкам). Сами файлы картинок (JPG/PNG) в Git из этого workflow не попадают.

Чтобы картинки были на сайте, возможны варианты:

1. **Ручная выкладка**  
   Периодически копируешь файлы из `/data/files/images/...` в папку репо `img/products/...` (сохраняя структуру, например `img/products/COSWICK/1171-4805-30.jpg`) и делаешь `git add` + `git commit` + `git push`. Сайт уже ожидает картинки по путям вида `img/products/COSWICK/...`.

2. **n8n тоже пушит картинки в Git**  
   После шага с Postgres добавь ветку, которая для каждого товара с непустым `image_path`:
   - читает файл с диска (нода **Read/Write File from Disk** — если n8n имеет доступ к `/data/files/images/`) **или** качает по URL (если в БД есть `image_url`, нода **HTTP Request** GET);
   - в **Code** переводит бинарные данные в base64;
   - нода **GitHub** — «Create or update a file», путь в репо: `img/products/COSWICK/1171-4805-30.jpg` (повторить структуру после `img/products/` из `image_path`).  
   Так n8n будет пушить и JSON, и картинки; репо станет единственным источником и данных, и файлов.

3. **Картинки с внешнего URL**  
   Если в БД есть публичный URL картинки (`image_url` с coswick и т.п.), в `products.json` можно оставить именно его — тогда n8n пушит только JSON, а сайт подгружает картинки по этому URL (ничего пушить в Git не нужно).

Итого: **по умолчанию n8n пушит только данные (products.json), не картинки.** Картинки либо добавляешь в репо вручную/отдельным workflow, либо используешь внешние URL в JSON.

### Можно ли через n8n добавить в Git только папку?

В Git и в GitHub API **нет отдельной операции «создать папку»** — репозиторий хранит только файлы. Папка получается сама, когда у файла путь с слэшами (например `img/products/photo.jpg`).

Через n8n ты по сути **добавляешь папку, загружая в неё файлы**: для каждого файла вызываешь GitHub «Create or update file» с путём вида **`img/products/COSWICK/имя.jpg`**. В репо появится структура `img/products/` (и при необходимости `img/products/COSWICK/`), потому что в ней лежат файлы. Пустую папку без файлов добавить нельзя.

### Как настроить ноду: загрузка картинок в Git только в одну папку

Картинки можно (и нужно) грузить **бинарными**: нода **Read Binary File** читает файл как бинарные данные, в **Code** ты переводишь их в base64 и отправляешь в GitHub API — API принимает только base64 в поле `content`. То есть схема «бинарный файл → base64 → Git» и есть загрузка картинок бинарниками.

Цель: брать картинки из **одной папки** (например `/data/files/images/`) и заливать их в репо **только в одну папку** `img/products/` (без лишних папок в репо, кроме этой).

**Вариант A: список путей из БД (Postgres)**

1. **Trigger** — Manual или Schedule.
2. **Postgres** — запрос, который вернёт список путей к картинкам только из нужной папки:
   ```sql
   SELECT DISTINCT image_path
   FROM products
   WHERE image_path IS NOT NULL
     AND image_path LIKE '/data/files/images/%'
   ORDER BY image_path
   ```
   Получишь по одному элементу на строку с полем `image_path`.
3. **Loop Over Items** (или **Split In Batches**) — чтобы обрабатывать по одному файлу (иначе GitHub нода получит много элементов и нужно по одному).
4. Для **каждого** элемента:
   - **Read Binary File** (или **Read/Write File from Disk**): путь к файлу = `{{ $json.image_path }}`.  
     Важно: n8n должен иметь доступ к этой папке (тот же сервер или смонтированный диск). Если доступа нет — используй вариант B (по URL).
   - **Code** (JavaScript): взять бинарные данные, перевести в base64 и подготовить путь в репо:
     - из `/data/files/images/COSWICK/1171-4805-30.jpg` сделать путь в репо: **`img/products/COSWICK/1171-4805-30.jpg`** (одна папка в репо — `img/products/`, внутри можно подпапки по имени бренда).
     - Или совсем без подпапок: **`img/products/1171-4805-30.jpg`** (тогда имена должны быть уникальны).
     Пример для сохранения подпапок под `img/products/`:
     ```js
     const path = $input.first().json.image_path || '';
     const afterPrefix = path.replace(/^\/data\/files\/images\/?/i, '');
     const repoPath = 'img/products/' + (afterPrefix || 'image.jpg');
     const item = $input.first();
     const bin = item.binary && (item.binary.data || item.binary.file); // в n8n обычно .data или .file
     const base64 = bin && bin.data ? bin.data : (bin && bin.toBase64 ? bin.toBase64() : '');
     return [{ json: { repoPath, base64 } }];
     ```
     (В n8n структура `binary` может отличаться — посмотри вывод ноды «Read Binary File» и подставь нужное свойство для base64.)
   - **GitHub** — Operation: **Create or update a file**:
     - File Path: `{{ $json.repoPath }}`
     - Content: в n8n для бинарного файла часто нужно передать content как base64. Если нода GitHub принимает только текст: в другой ноде (HTTP Request к GitHub API) отправь body с `"content": "{{ $json.base64 }}"` (см. ниже).

Если нода **GitHub** в n8n не умеет заливать бинарный контент по base64, используй **HTTP Request**:

- Method: **PUT**
- URL: `https://api.github.com/repos/ВЛАДЕЛЕЦ/РЕПО/contents/{{ $json.repoPath }}`
- Headers: `Authorization: token ТВОЙ_GITHUB_TOKEN`, `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "message": "Upload image",
    "content": "{{ $json.base64 }}"
  }
  ```

Итог: в репо будет **только одна папка с картинками** — `img/products/` (и при необходимости подпапки внутри неё, например `img/products/COSWICK/`). Других папок с картинками этот workflow не создаёт.

**Вариант B: картинки по URL (если n8n не видит диск)**

Если папки с файлами нет в доступе у n8n, но в БД есть `image_url`:

1. **Postgres** — `SELECT DISTINCT image_url, image_path FROM products WHERE image_url IS NOT NULL ...`
2. **HTTP Request** — GET по `{{ $json.image_url }}`, ответ — бинарный (Binary).
3. **Code** — из бинарного сделать base64, из `image_path` собрать `repoPath` как выше (`img/products/...`).
4. **GitHub** (или HTTP Request к API) — загрузить файл по `repoPath` с content в base64.

Так ты тоже заливаешь картинки **только в одну папку** репо — `img/products/`.

**Ограничения**

- GitHub API: большие файлы (например > 1 МБ) через API неудобны; лучше картинки сжимать или хранить небольшие превью.
- Лимиты запросов: при большом числе картинок делай небольшую задержку между вызовами (например 0.5–1 с) или обрабатывай батчами.

### После Read/Write Files from Disk выдает все картинки — что делать дальше

Нода **Read/Write Files from Disk** отдаёт по одному элементу на каждый файл (в каждом элементе — путь/имя и бинарные данные). Дальше нужно **по одному** перевести картинку в base64 и залить в Git в папку `img/products/`.

**Шаг 1. Loop Over Items**  
Подключи после Read/Write Files from Disk ноду **Loop Over Items** (или **Split In Batches** с batch size 1). Так следующие ноды будут получать по одному файлу за раз — иначе GitHub зальёт только первый.

**Шаг 2. Code**  
В **Code** (JavaScript) из текущего элемента возьми:
- путь/имя файла — в выводе Read/Write Files from Disk обычно есть `fileName`, `filePath` или похожее (посмотри вывод ноды);
- бинарные данные — обычно `item.binary.data` (или другой ключ в `item.binary`).

Собери путь в репо `img/products/...` и base64. Пример (подставь свои имена полей):

```js
const item = $input.first();
const json = item.json || {};
// имя файла или относительный путь (подставь поле из своей ноды)
const fileName = json.fileName || json.fileNameWithPath || json.filePath || 'image.jpg';
const pathInRepo = 'img/products/' + fileName.replace(/^.*[/\\]/, ''); // только имя файла, без папок на диске
// base64 из бинарника
const bin = item.binary && (item.binary.data || item.binary.file || item.binary[Object.keys(item.binary || {})[0]]);
const base64 = bin && (bin.data !== undefined ? bin.data : (typeof bin.toBase64 === 'function' ? bin.toBase64() : '')) || '';
return [{ json: { repoPath: pathInRepo, base64 } }];
```

Если на диске была подпапка (например `COSWICK/1171.jpg`) и ты хочешь её сохранить в репо как `img/products/COSWICK/1171.jpg`, используй в пути не только имя файла, а кусок после папки-источника, например:

```js
const filePath = json.filePath || json.fileNameWithPath || fileName;
const afterPrefix = filePath.replace(/^.*[/\\]data[/\\]files[/\\]images[/\\]?/i, '').replace(/\\/g, '/');
const pathInRepo = 'img/products/' + (afterPrefix || fileName.replace(/^.*[/\\]/, ''));
```

**Шаг 3. GitHub или HTTP Request**  
- Либо нода **GitHub** — Operation: **Create or update a file**, File Path: `{{ $json.repoPath }}`, Content: base64 (если нода умеет принимать base64).  
- Либо **HTTP Request**: Method **PUT**, URL `https://api.github.com/repos/ВЛАДЕЛЕЦ/РЕПО/contents/{{ $json.repoPath }}`, Headers `Authorization: token ТВОЙ_ТОКЕН`, Body: `{ "message": "Upload image", "content": "{{ $json.base64 }}" }`.

После этого каждое изображение из выхода Read/Write Files from Disk окажется в репо в папке `img/products/`.

### 2. На сайте: откуда читаются данные

- Если задан **PRODUCTS_API_URL** (в `config.js` или data-атрибуте) — товары запрашиваются с этого URL (n8n webhook или другой API).
- Если **PRODUCTS_API_URL не задан** — сайт запрашивает **`products.json`** с того же домена (относительный путь `products.json`). Файл должен лежать в корне сайта (рядом с `index.html`) или путь задать через `data-products-json-url` / `window.__PRODUCTS_JSON_URL` (например `data/products.json`).

Никаких лишних папок на сайте не нужно: один файл `products.json` в корне репо — n8n его обновляет, сайт его подхватывает.

---

## Безопасность (как сделать безопаснее)

### На стороне n8n

1. **Секретный заголовок**  
   В n8n в ноде Webhook включи проверку заголовка, например `X-API-Key`. Значение задай длинным случайным ключом. На сайте тот же ключ передаётся в запросе (через `config.js` или data-атрибут). Так доступ к webhook есть только у того, кто знает ключ.

2. **Проверка заголовка в n8n**  
   После ноды Webhook добавь ноду **IF**: условие `{{ $json.headers["x-api-key"] }}` равно твоему секретному ключу. Если нет — ответь 401 и не дергай БД.

3. **Длинный случайный путь**  
   Не используй путь вида `/webhook/products`. Сделай, например, `/webhook/a1b2c3d4e5f6...` (случайная строка 20+ символов), чтобы URL нельзя было угадать.

4. **Только чтение из БД**  
   В PostgreSQL заведи отдельного пользователя только с правами `SELECT` по таблице товаров. В n8n подключай БД под этим пользователем, не под админом.

5. **Только нужные поля**  
   В запросе выбирай только то, что нужно для каталога: id, name, category, price, unit, specs, image_url, badge. Не отдавай внутренние поля (поставщики, закупочные цены и т.п.).

6. **HTTPS**  
   n8n должен работать по HTTPS, чтобы трафик и заголовки (в т.ч. ключ) не светились в открытую.

7. **Rate limiting**  
   Если n8n или прокси перед ним умеют ограничивать частоту запросов — включи лимит на этот webhook (например, не больше 60 запросов в минуту с одного IP).

### На стороне сайта

1. **Не храни URL и ключ в коде в репозитории**  
   - Либо подключай `config.js` (скопируй `config.example.js` в `config.js`, подставь URL и ключ, добавь `config.js` в `.gitignore`).  
   - Либо задавай URL и ключ при деплое (переменные окружения и подстановка в HTML/скрипт).  
   В обоих случаях в самом репозитории секретов не будет.

2. **Опционально: data-атрибуты**  
   Можно задать URL и ключ в HTML:  
   `<script src="script.js" data-products-api-url="https://..." data-products-api-key="секрет"></script>`  
   Удобно подставлять их при сборке/деплое из переменных окружения, не храня в репо.

3. **Идеальный вариант: свой прокси (Vercel/Netlify Function)**  
   Сайт вызывает не n8n напрямую, а твой endpoint (например `/api/products`). Серверная функция по запросу подставляет секретный ключ, дергает n8n webhook и отдаёт JSON на фронт. URL n8n и ключ хранятся только в переменных окружения на сервере, в браузере они не попадают.

---

## 1. Настройка n8n

1. В n8n создай новый workflow.
2. Добавь ноду **Webhook** (Trigger):
   - HTTP Method: **GET**
   - Path: например `products` (получится URL вида `https://твой-n8n.com/webhook/products`).
3. Добавь ноду **Postgres** (или **Postgres node**):
   - Подключи свою БД (host, database, user, password).
   - Operation: **Execute Query**.
   - Query: например  
     `SELECT id, name, category, price, unit, specs, image_url, badge FROM products ORDER BY id`
   - Названия полей в БД могут быть любыми — в коде сайта они маппятся (см. ниже).
4. Соедини Webhook → Postgres.
5. Добавь ноду **Respond to Webhook**:
   - В тело ответа отдай результат запроса (массив строк). Обычно это `{{ $json }}` или массив из выхода Postgres.
6. Сохрани workflow и включи его (Active). Скопируй **Production URL** webhook (например `https://n8n.example.com/webhook/products`).

## 2. Настройка сайта (безопасные варианты)

**Вариант A — config.js (рекомендуется, секреты не в репо):**

1. Скопируй `config.example.js` в `config.js`.
2. В `config.js` укажи `window.__PRODUCTS_API_URL` и `window.__PRODUCTS_API_KEY` (тот же ключ, что проверяешь в n8n).
3. В `index.html` перед `script.js` подключи: `<script src="config.js"></script>`.
4. Добавь `config.js` в `.gitignore`, чтобы не коммитить ключ и URL.

**Вариант B — data-атрибуты (удобно при деплое):**

В `index.html`:

```html
<script src="script.js" data-products-api-url="https://твой-n8n.com/webhook/длинный-случайный-путь" data-products-api-key="твой-секретный-ключ"></script>
```

Подставляй URL и ключ из переменных окружения при сборке, не храни их в репозитории.

**Вариант C — без секрета (только для теста):**  
Оставь `PRODUCTS_API_URL` и ключ пустыми в коде — тогда используются статичные товары. Для продакшена лучше вариант A или B и проверка заголовка в n8n.

## 3. Формат ответа от n8n

Webhook должен вернуть **JSON**: массив объектов с полями товара. **Минимум для карточки:** картинка, название, цена. Остальные поля опциональны.

Пример:

```json
[
  {
    "id": 1,
    "name": "Паркетная доска Дуб",
    "category": "natural",
    "price": 2450,
    "unit": "м²",
    "specs": "Толщина: 14мм | Дуб",
    "image_url": "https://example.com/photo.jpg",
    "badge": "Хит"
  }
]
```

Если в БД поля называются иначе — не страшно. В коде маппинг:
- **Название:** `name`, `title`, `nazvanie`;
- **Цена:** `price` (число);
- **Картинка:** приоритет у локального пути из БД: `image_path`, `image_local`. Путь вида `/data/files/images/COSWICK/1171-4805-30.jpg` автоматически превращается в `img/products/COSWICK/1171-4805-30.jpg` — положи файлы в папку `img/products/` на сайте (или настрой префикс в коде). Если картинки нет или файл не найден — показывается заглушка, **товар всё равно отображается** (название, поля, цена). Иначе используются `image`, `image_url`, `photo` и т.д.
- **Категория:** `category`, `category_id` (natural, dark, grey, white);
- **Единица:** `unit` (по умолчанию м²);
- **Описание:** `specs`, `description`, `specifications` (если пусто — блок не показывается);
- **Бейдж:** `badge`, `label` (например «Хит», «Новинка»).

**Формат с вложенным `metadata` (как в БД Coswick):** название берётся из `metadata.decor` или `format_type`, цена из `rrp_rub_m2`, картинка из `image_path` (путь `/data/files/images/...` мапится в `img/products/...`). Описание собирается из `size`, `model`, `metadata.finish`, `metadata.wood_species`. Если нет `id` — используется `sku`. Товар всегда показывается, даже без картинки.

Если ни API, ни `products.json` недоступны — в магазине показывается встроенный статичный список товаров.

---

## Кратко: n8n → Git без лишних папок

| Шаг | Действие |
|-----|----------|
| n8n | Postgres (товары) → Code (массив в JSON-строку) → GitHub «Create or update file» с путём **`products.json`** в корне репо. **Картинки** этим не пушатся — только JSON (см. раздел «Картинки: n8n их пушит?»). |
| Git | В репо: **`products.json`** в корне. Картинки — если нужны на сайте: либо вручную в `img/products/...`, либо отдельным workflow в n8n. |
| Сайт | Не задавай `PRODUCTS_API_URL` — загрузка с **`products.json`**; картинки по путям из JSON (`img/products/...` или внешний URL). |
