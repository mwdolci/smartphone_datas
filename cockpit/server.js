import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", ws => {
    console.log("Client connecté");

    // Envoyer un message de bienvenue
    ws.send(JSON.stringify({ msg: "Bienvenue !" }));

    ws.on("message", message => {
        console.log("Message reçu :", message);

        // Broadcast aux autres clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});
