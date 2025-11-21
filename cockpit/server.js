const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });
console.log("Serveur WebSocket en ligne sur ws://localhost:8080");

wss.on("connection", ws => {
    console.log("Client connecté");

    ws.on("message", message => {
        wss.clients.forEach(client => {
            if (client.readyState === 1 && client !== ws) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});
