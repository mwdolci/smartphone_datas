import { WebSocketServer } from "ws";
import http from "http";

const port = process.env.PORT || 8080;

// Render ne supporte pas les WebSocket "brutes" : il faut créer un serveur HTTP
const server = http.createServer();

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("Client connecté");

    ws.on("message", (message) => {
        console.log("Données reçues :", message.toString());
    });

    ws.on("close", () => console.log("Client déconnecté"));
});

server.listen(port, () => {
    console.log("WebSocket server running on port " + port);
});