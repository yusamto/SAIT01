const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png"
};

const server = http.createServer(async (req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    } catch {
        res.writeHead(400);
        return res.end("Bad Request");
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        return res.end("Method not allowed");
    }

    // API со списком видео
    if (pathname === "/api/videos") {
        const dir = path.join(ROOT, "videos");
        try {
            const files = await fs.promises.readdir(dir);
            const videos = files
                .filter(file => [".mp4", ".webm", ".ogg", ".mov", ".mkv"].includes(path.extname(file).toLowerCase()))
                .map(file => ({
                    title: path.parse(file).name,
                    path: "/videos/" + encodeURIComponent(file),
                    cover: "/images/" + encodeURIComponent(path.parse(file).name + ".jpg"),
                    category: "Семья",
                    description: "Видео из семейного архива."
                }));
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            return res.end(JSON.stringify(videos));
        } catch {
            res.writeHead(500);
            return res.end("Ошибка чтения видео");
        }
    }

    if (pathname === "/") pathname = "/index.html";
    const filePath = path.resolve(ROOT, "." + pathname);
    const relative = path.relative(ROOT, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    let stat;
    try {
        stat = await fs.promises.stat(filePath);
    } catch {
        res.writeHead(404);
        return res.end("File not found");
    }
    if (!stat.isFile()) {
        res.writeHead(404);
        return res.end("Not found");
    }

    const size = stat.size;
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache"
    };

    if (req.method === "HEAD") {
        res.writeHead(200, { ...headers, "Content-Length": size });
        return res.end();
    }

    const range = req.headers.range;
    if (!range) {
        res.writeHead(200, { ...headers, "Content-Length": size });
        return fs.createReadStream(filePath).pipe(res);
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
        res.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` });
        return res.end();
    }

    let start;
    let end;
    if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix <= 0) {
            res.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` });
            return res.end();
        }
        start = Math.max(0, size - suffix);
        end = size - 1;
    } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : size - 1;
    }

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
        res.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` });
        return res.end();
    }

    end = Math.min(end, size - 1);
    res.writeHead(206, {
        ...headers,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${size}`
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on("error", () => res.destroy());
    stream.pipe(res);
});

server.listen(PORT, () => {
    console.log(`Сайт работает: http://localhost:${PORT}`);
});
