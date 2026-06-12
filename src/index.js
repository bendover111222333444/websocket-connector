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

function getRandomWss(pool) {
    const urls = WSS_URLS[pool] ?? WSS_URLS.cf;
    return urls[Math.floor(Math.random() * urls.length)];
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pool = url.searchParams.get("pool") === "public" ? "public" : "cf";
        const target = getRandomWss(pool);

        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Proxy running", { status: 200 });
        }

        const [client, server] = Object.values(new WebSocketPair());
        server.accept();

        const upstream = new WebSocket(target);

        server.addEventListener("message", (e) => {
            if (upstream.readyState === WebSocket.OPEN) {
                upstream.send(e.data);
            }
        });

        server.addEventListener("close", () => upstream.close());
        server.addEventListener("error", () => upstream.close());

        upstream.addEventListener("message", (e) => {
            server.send(e.data);
        });

        upstream.addEventListener("close", () => server.close());
        upstream.addEventListener("error", () => server.close());

        return new Response(null, { status: 101, webSocket: client });
    }
};