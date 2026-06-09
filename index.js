import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const WISP_URLS = {
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

function getRandomWisp(pool) {
    const urls = WISP_URLS[pool] ?? WISP_URLS.cf;
    return urls[Math.floor(Math.random() * urls.length)];
}

const server = createServer((req, res) => {
    res.writeHead(200);
    res.end("Proxy server running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (client, req) => {
    const params = new URLSearchParams(req.url.includes("?") ? req.url.split("?")[1] : "");
    const pool = params.get("pool") === "public" ? "public" : "cf";
    const wispUrl = getRandomWisp(pool);
    const upstream = new WebSocket(wispUrl);
    upstream.binaryType = "arraybuffer";

    upstream.on("open", () => {
        client.on("message", (data) => {
            if (upstream.readyState === WebSocket.OPEN) {
                upstream.send(data);
            }
        });
        client.on("close", () => upstream.close());
        client.on("error", () => upstream.close());
    });

    upstream.on("message", (data) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
    upstream.on("close", () => client.close());
    upstream.on("error", () => client.close());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);

});