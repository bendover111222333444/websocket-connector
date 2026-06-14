export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const pool = url.searchParams.get("pool") === "public" ? "public" : "cf";

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

    const urls = WSS_URLS[pool];
    const upstreamUrl = urls[Math.floor(Math.random() * urls.length)];

    const [client, clientWs] = Object.values(new WebSocketPair());
    const upstream = await fetch(upstreamUrl, {
      headers: { Upgrade: "websocket" },
    });
    const upstreamWs = upstream.webSocket;

    clientWs.accept();
    upstreamWs.accept();

    clientWs.addEventListener("message", (e) => upstreamWs.send(e.data));
    upstreamWs.addEventListener("message", (e) => clientWs.send(e.data));
    clientWs.addEventListener("close", () => upstreamWs.close());
    upstreamWs.addEventListener("close", () => clientWs.close());

    return new Response(null, { status: 101, webSocket: client });
  }
};