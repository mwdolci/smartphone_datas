import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Gestion des connexions WebSocket
wss.on("connection", ws => {
    console.log("Client connecté");
	
	// Envoit un message de bienvenue
    ws.send(JSON.stringify({ msg: "Bienvenue !" }));

    // Gestion des messages reçus
    ws.on("message", message => {
        const msgStr = message.toString();
        console.log("Message reçu :", msgStr);

        // Diffuse le message à tous les autres clients connectés
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(msgStr);
            }
        });
    });

    // Gestion de la déconnexion
    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});
