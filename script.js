/* ==========================================================================
   ТАЙНАЯ КОМНАТА — скрипт
   Видео добавляются ссылками <a href> в index.html (блок #library).

   Содержание:
     1. Общие переменные и помощники
     2. Запуск
     3. Категории
     4. Список и карточки
     5. Плеер
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

  // Путь вида C:\... или C:/...
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
  // Читаем все ссылки из блока #library
  videos = [...document.querySelectorAll("#library a")].map(a => ({
    title:       a.textContent.trim() || "Без названия",
    category:    a.dataset.category || "Без категории",
    description: a.dataset.description || "",
    file:        toUrl(a.getAttribute("href")),
    cover:       toUrl(a.dataset.cover)
  }));

  buildCategories();
  render();

  // Поиск и сортировка
  $("search").addEventListener("input", render);
  $("sort").addEventListener("change", render);

  // Закрытие плеера: крестиком
  $("p-close").addEventListener("click", () => $("player").close());

  // Закрытие плеера: щелчком по тёмному фону
  $("player").addEventListener("click", e => {
    if (e.target === $("player")) $("player").close();
  });

  // При закрытии — останавливаем видео
  $("player").addEventListener("close", () => {

    $("p-video").pause();
    $("p-video").removeAttribute("src");
    $("p-video").load();

    $("p-frame").src = "";

});


/* ---------- 3. Категории ---------- */

function buildCategories() {
  const cats = [...new Set(videos.map(v => v.category))];
  const bar = $("categories");

  bar.innerHTML = "";

  // Если категория всего одна — панель не нужна
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
  if (s === "az")  list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  if (s === "rev") list.reverse();

  // Счётчик и сообщение «пусто»
  $("count").textContent = `Записей: ${list.length}`;
  $("empty").hidden = list.length > 0;
  $("empty").textContent = videos.length
    ? "Ничего не найдено."
    : "Пока пусто. Добавьте ссылки в index.html.";

  // Карточки
  $("grid").innerHTML = "";
  list.forEach(v => $("grid").appendChild(card(v)));
}


function card(v) {
  const el = document.createElement("article");
  el.className = "card";
  el.tabIndex = 0;

  // Обложка (если есть) поверх тёплого градиента
  const bg = (v.cover ? `url('${v.cover}'),` : "")
           + "linear-gradient(135deg,#c2410c,#2a1408 70%)";

  el.innerHTML = `
    <div class="thumb" style="background-image:${bg}"></div>
    <div class="card-body">
      <h3>${esc(v.title)}</h3>
      <p class="meta">${esc(v.category)}</p>
      ${v.description ? `<p>${esc(v.description)}</p>` : ""}
    </div>`;

  el.onclick = () => openPlayer(v);
  el.onkeydown = e => {
    if (e.key === "Enter") openPlayer(v);
  };

  return el;
}


/* ---------- 5. Плеер ---------- */

function openPlayer(v) {

    $("p-title").textContent = v.title;
    $("p-meta").textContent = v.category;
    $("p-desc").textContent = v.description;

    const video = $("p-video");
    const frame = $("p-frame");

    if (!v.file) {
        console.error("Ссылка отсутствует:", v.title);
        return;
    }

    // Останавливаем предыдущие видео
    video.pause();
    video.removeAttribute("src");
    video.load();

    frame.src = "";
    frame.hidden = true;
    video.hidden = false;

    // Проверяем, является ли ссылка Bunny Stream
    if (
        v.file.includes("mediadelivery.net/embed/")
    ) {

        // Запускаем Bunny Stream
        video.hidden = true;
        frame.hidden = false;

        frame.src = v.file;

    } else {

        // Запускаем обычный MP4
        video.hidden = false;
        frame.hidden = true;

        video.src = v.file;

        video.play().catch(() => {});
    }

    $("player").showModal();
}
       

// Поехали
document.addEventListener("DOMContentLoaded", init);
