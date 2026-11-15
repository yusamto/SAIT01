```javascript
/* ==========================================================================
   ТАЙНАЯ КОМНАТА — script.js
   Поддержка Bunny Stream через iframe.

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

    if (/^https?:\/\//i.test(p)) return p;

    if (/^[A-Za-z]:[\\/]/.test(p)) {
        p = "file:///" + p;
    }
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

    // Закрытие крестиком
    $("p-close").addEventListener("click", () => {
        $("player").close();
    });

    // Закрытие по клику на фон
    $("player").addEventListener("click", e => {
        if (e.target === $("player")) {
            $("player").close();
        }
    });

    // Остановка видео при закрытии
    $("player").addEventListener("close", stopPlayer);
}


// Остановка и очистка iframe
function stopPlayer
