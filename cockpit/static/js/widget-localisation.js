class MapRenderer {
    constructor(mapElementId) {

        // --- 1) Création de la carte ---
        this.map = L.map(mapElementId, {}).setView([46.946536, 7.444987], 13);

        // --- 2) Fond de carte ---
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(this.map);

        // --- 3) Marqueur ---
        this.marker = L.marker([46.946536, 7.444987]).addTo(this.map);

        // --- 4) Tracé (polyline) ---
        this.path = L.polyline([], {
            color: 'red',
            weight: 4
        }).addTo(this.map);

        // Dernière position connue
        this.lastLatLng = null;
    }

    // --- Mise à jour de la position ---
    updatePosition(lat, lon) {
        const latlng = [lat, lon];

        // Déplace le marqueur
        this.marker.setLatLng(latlng);

        // Ajoute au tracé
        this.path.addLatLng(latlng);

        // Sauvegarde
        this.lastLatLng = latlng;

        this.center();
    }

    // --- Effacer le tracé ---
    resetPath() {
        this.path.setLatLngs([]);
    }

    // --- Centrer la carte sur la position ---
    center() {
        if (this.lastLatLng) {
            this.map.setView(this.lastLatLng);
        }
    }
}

// ✅ Expose la classe globalement
window.MapRenderer = MapRenderer;

document.addEventListener("DOMContentLoaded", () => {

    // Création de l’objet carte
    const mapRenderer = new MapRenderer("map_geo");

    // Expose pour WebSocket
    window.updateMapPosition = (lat, lon) => {
        mapRenderer.updatePosition(lat, lon);
    };

    // Bouton reset tracé
    const btnReset = document.getElementById("btnResetTrace");
    btnReset.addEventListener("click", () => {
        mapRenderer.resetPath();
    });

    window.resetMapPath = () => {
        mapRenderer.resetPath();
    };
});