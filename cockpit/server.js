import WebSocket from "ws";

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", ws => {
    console.log("Client connecté");

    // Envoyer un message de bienvenue
    ws.send(JSON.stringify({ msg: "Bienvenue !" }));

    ws.on("message", message => {
        // Convertir le Buffer en string si nécessaire
        const msgStr = message.toString(); 
        console.log("Message reçu :", msgStr);

        // Renvoyer à tous les autres clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(msgStr); // on renvoie bien une string JSON
            }
        });
    });

    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});