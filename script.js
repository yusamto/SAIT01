```javascript
/* ==========================================================================
   ТАЙНАЯ КОМНАТА — script.js
   Поддержка Bunny Stream через iframe.

   Содержание:
     1. Общие переменные и помощники
     2. Запуск
     3. Категории
     4. Список и карточки
     5. Плеер Bunny Stream
   ========================================================================== */


/* ---------- 1. Общие переменные и помощники ---------- */

const $ = id => document.getElementById(id);

let videos = [];
let category = "Все";


// Защита текста от HTML-вставок
const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));


// Превращает путь в адрес, понятный браузеру
function toUrl(p) {
    if (!p) return "";

    p = p.trim();

    // Обычная ссылка из интернета
    if (/^https?:\/\//i.test(p)) return p;

    // Путь Windows
    if (/^[A-Za-z]:[\\/]/.test(p)) {
        p = "file:///" + p;
    }
    // Сетевой путь
    else if (p.startsWith("\\\\")) {
        p = "file:" + p;
    }

    p = p.replace(/\\/g, "/");

    return encodeURI(p).replace(/#/g, "%23");
}


/* ---------- 2. Запуск ---------- */

function init() {

    // Читаем ссылки из блока #library
    videos = [...document.querySelectorAll("#library a")].map(a => ({
        title: a.textContent.trim() || "Без названия",
        category: a.dataset.category || "Без категории",
        description: a.dataset.description || "",
        file: toUrl(a.getAttribute("href")),
        cover: toUrl(a.dataset.cover)
    }));

    buildCategories();
    render();

    // Поиск
    $("search").addEventListener("input", render);

    // Сортировка
    $("sort").addEventListener("change", render);

    // Закрытие плеера крестиком
    $("p-close").addEventListener("click", () => {
        $("player").close();
    });

    // Закрытие по клику на тёмный фон
    $("player").addEventListener("click", e => {
        if (e.target === $("player")) {
            $("player").close();
        }
    });

    // Останавливаем Bunny Stream при закрытии
    $("player").addEventListener("close", () => {
        const frame = $("p-video");

        if (frame && frame.tagName === "IFRAME") {
            frame.src = "about:blank";
        }
    });
}


/* ---------- 3. Категории ---------- */

function buildCategories() {

    const cats = [...new Set(videos.map(v => v.category))];
    const bar = $("categories");

    bar.innerHTML = "";

    // Если категория одна — панель не нужна
    bar.hidden = cats.length < 2;

    if (bar.hidden) return;

    ["Все", ...cats].forEach(c => {

        const b = document.createElement("button");

        b.className = "chip" + (c === category ? " active" : "");
        b.textContent = c;

        b.onclick = () => {
            category = c;
            buildCategories();
            render();
        };

        bar.appendChild(b);
    });
}


/* ---------- 4. Список и карточки ---------- */

function render() {

    const q = $("search").value.trim().toLowerCase();

    // Фильтр по категории и поиску
    const list = videos.filter(v =>
        (category === "Все" || v.category === category) &&
        (v.title + " " + v.description).toLowerCase().includes(q)
    );

    // Сортировка
    const s = $("sort").value;

    if (s === "az") {
        list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    }

    if (s === "rev") {
        list.reverse();
    }

    // Счётчик
    $("count").textContent = `Записей: ${list.length}`;

    // Сообщение, если ничего нет
    $("empty").hidden = list.length > 0;

    $("empty").textContent = videos.length
        ? "Ничего не найдено."
        : "Пока пусто. Добавьте ссылки в index.html.";

    // Карточки
    $("grid").innerHTML = "";

    list.forEach(v => {
        $("grid").appendChild(card(v));
    });
}


// Создание карточки видео
function card(v) {

    const el = document.createElement("article");

    el.className = "card";
    el.tabIndex = 0;

    // Обложка
    const bg = (v.cover ? `url('${v.cover}'),` : "")
        + "linear-gradient(135deg,#c2410c,#2a1408 70%)";

    el.innerHTML = `
        <div class="thumb" style="background-image:${bg}"></div>

        <div class="card-body">

            <h3>${esc(v.title)}</h3>

            <p class="meta">${esc(v.category)}</p>

            ${v.description
                ? `<p>${esc(v.description)}</p>`
                : ""}

        </div>
    `;

    // Открытие видео
    el.onclick = () => openPlayer(v);

    // Открытие клавишей Enter
    el.onkeydown = e => {
        if (e.key === "Enter") {
            openPlayer(v);
        }
    };

    return el;
}


/* ---------- 5. Плеер Bunny Stream ---------- */

function openPlayer(v) {

    $("p-title").textContent = v.title;
    $("p-meta").textContent = v.category;
    $("p-desc").textContent = v.description;

    const oldPlayer = $("p-video");

    // Проверяем наличие ссылки
    if (!v.file) {
        console.error("Не указана ссылка на видео:", v.title);
        return;
    }

    // Создаём iframe Bunny Stream
    const iframe = document.createElement("iframe");

    iframe.id = "p-video";

    iframe.src = v.file;

    iframe.style.width = "100%";
    iframe.style.aspectRatio = "16 / 9";
    iframe.style.border = "0";
    iframe.style.display = "block";

    iframe.allow =
        "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen";

    iframe.allowFullscreen = true;

    iframe.loading = "eager";

    // Заменяем старый video на iframe
    oldPlayer.replaceWith(iframe);

    // Открываем модальное окно
    $("player").showModal();
}


// Поехали
init();
```