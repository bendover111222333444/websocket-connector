import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const WSS_URLS = {
    cf: [
        "wss://scramjet-server-wisp.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
        "wss://scramjet-server-wisp-1.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
        "wss://scramjet-server-wisp-2.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
        "wss://scramjet-server-wisp-3.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
        "wss://scramjet-server-wisp-4.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
        "wss://scramjet-server-wisp-5.sigmasigmaonthewallwhoisthe2.workers.dev/wisp/",
    ],
    public: [
        "wss://anura.pro/wisp/",
        "wss://mizumath.com/wisp/",
    ],
};

const workingUrls = { cf: [], public: [] };

async function testWispUrl(url) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => { ws.terminate(); resolve(false); }, 3000);
        ws.on("open", () => { clearTimeout(timeout); ws.close(); resolve(true); });
        ws.on("error", () => { clearTimeout(timeout); resolve(false); });
    });
}

async function refreshPools() {
    for (const pool of ["cf", "public"]) {
        const results = await Promise.all(WSS_URLS[pool].map(async url => ({ url, works: await testWispUrl(url) })));
        const dead = results.filter(r => !r.works).map(r => r.url);
        workingUrls[pool] = results.filter(r => r.works).map(r => r.url);
        if (dead.length > 0) console.log(`[wisp] dead ${pool}:`, dead);
        console.log(`[wisp] ${pool}: ${workingUrls[pool].length}/${WSS_URLS[pool].length} online`);
    }
}

function getRandomWss(pool) {
    const urls = workingUrls[pool]?.length > 0 ? workingUrls[pool] : WSS_URLS[pool];
    return urls[Math.floor(Math.random() * urls.length)];
}

const server = createServer((req, res) => {
    res.writeHead(200);
    res.end("Server is running");
});

server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (client, req) => {
    const params = new URLSearchParams(req.url.includes("?") ? req.url.split("?")[1] : "");
    const pool = params.get("pool") === "public" ? "public" : "cf";
    const wssUrl = getRandomWss(pool);
    const upstream = new WebSocket(wssUrl);
    upstream.binaryType = "arraybuffer";

    upstream.on("open", () => {
        client.on("message", (data) => {
            if (upstream.readyState === WebSocket.OPEN) upstream.send(data);
        });
        client.on("close", () => upstream.close());
        client.on("error", () => upstream.close());
    });

    upstream.on("message", (data) => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
    upstream.on("close", () => client.close());
    upstream.on("error", () => client.close());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    await refreshPools();
    // re-test every 5 minutes
    setInterval(refreshPools, 5 * 60 * 1000);
});