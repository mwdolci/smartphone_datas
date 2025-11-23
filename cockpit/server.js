import WebSocket from "ws";

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", ws => {
    console.log("Client connecté");

    ws.on("message", message => {
        console.log("Message reçu :", message);

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