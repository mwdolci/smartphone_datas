// --- WebRTC côté cockpit ---
ws.addEventListener("message", event => {
    let msg;
    try {
        msg = JSON.parse(event.data);
    } catch {
        return; // ignore les messages non-JSON
    }

    // --- OFFER ---
    if (msg.type === "offer") {
        peerConnection = new RTCPeerConnection();

        peerConnection.onicecandidate = e => {
            if (e.candidate) {
                ws.send(JSON.stringify({ type: "ice", candidate: e.candidate }));
            }
        };

        peerConnection.ontrack = e => {
            document.getElementById("remoteVideo").srcObject = e.streams[0];
        };

        peerConnection
            .setRemoteDescription(msg.offer)
            .then(() => peerConnection.createAnswer())
            .then(answer => {
                peerConnection.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: "answer", answer }));
            });
    }

    // --- ICE ---
    if (msg.type === "ice") {
        if (!peerConnection) {
            console.warn("⚠ ICE reçu mais peerConnection pas encore créé !");
            return;
        }
        peerConnection.addIceCandidate(msg.candidate);
    }
});
