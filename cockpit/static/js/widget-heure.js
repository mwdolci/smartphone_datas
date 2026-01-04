/**
 * DialDrawer
 * ----------
 * Classe responsable du dessin du cadran d’horloge sur un canvas 2D.
 * Elle ne gère aucune logique temporelle : uniquement le rendu graphique.
 *
 * Responsabilités :
 *   - effacer le canvas
 *   - dessiner le cercle extérieur
 *   - dessiner les graduations (petites et grandes)
 *   - dessiner les aiguilles
 *   - dessiner le texte (heures, labels)
 *
 * Architecture :
 *   → Clock fournit les angles
 *   → DialDrawer ne fait que dessiner
 */
class DialDrawer {
    constructor(ctx, radius) {
        this.ctx = ctx;
        this.radius = radius;
    }

    /**
     * Efface le canvas en utilisant un repère centré (translate déjà appliqué).
     */
    clear(canvas) {
        this.ctx.clearRect(-this.radius, -this.radius, canvas.width, canvas.height);
    }

    /**
     * Dessine le cercle principal du cadran.
     */
    drawDial() {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    /**
     * Dessine une aiguille.
     * @param angle  Angle en radians (0 = droite, -π/2 = haut)
     * @param length Longueur totale de l’aiguille
     * @param width  Épaisseur du trait
     * @param innerGap Distance depuis le centre avant que l’aiguille commence
     */
    drawHand(angle, length, width, innerGap = 40) {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;

        // Aiguille commence à innerGap au lieu du centre
        this.ctx.moveTo(Math.cos(angle) * innerGap, Math.sin(angle) * innerGap);

        // Pointe de l’aiguille
        this.ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);

        this.ctx.stroke();
    }

    /**
     * Dessine un texte centré sur (x, y).
     */
    drawText(text, x, y) {
        this.ctx.font = "20px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, x, y);
    }

    /**
     * Dessine les 60 graduations du cadran :
     *   - petites graduations toutes les minutes
     *   - grandes graduations toutes les 5 minutes
     *   - numérotation 12, 1, 2, ..., 11
     */
    drawGraduations() {
        const divisions = 60;

        for (let i = 0; i < divisions; i++) {
            const angle = (Math.PI * 2 / divisions) * i - Math.PI / 2;

            const outer = this.radius - 5;
            let inner = this.radius - 15;
            let width = 1;

            // Traits plus longs toutes les 5 divisions
            if (i % 5 === 0) {
                inner = this.radius - 25;
                width = 2;
            }

            // Trait de graduation
            this.ctx.beginPath();
            this.ctx.lineWidth = width;
            this.ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            this.ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
            this.ctx.stroke();

            // Numérotation toutes les 5 divisions
            if (i % 5 === 0) {
                // 0 → 12, 5 → 1, 10 → 2, etc.
                const label = i === 0 ? 12 : i / 5;

                const textRadius = this.radius - 40;
                const x = Math.cos(angle) * textRadius;
                const y = Math.sin(angle) * textRadius;

                this.drawText(label.toString(), x, y);
            }
        }
    }
}

/**
 * Clock
 * -----
 * Classe principale qui gère :
 *   - le canvas
 *   - la position des aiguilles (heures, minutes, secondes)
 *   - la mise à jour via WebSocket (setTime)
 *   - le rafraîchissement automatique toutes les secondes
 *
 * Elle délègue tout le dessin à DialDrawer.
 */
class Clock {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");

        // Rayon = moitié de la hauteur
        this.radius = this.canvas.height / 2;

        // On place le repère au centre du canvas
        this.ctx.translate(this.radius, this.radius);

        // Drawer
        this.drawer = new DialDrawer(this.ctx, this.radius);

        // Valeurs temporelles
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;

        // Redessine chaque seconde
        setInterval(() => this.draw(), 1000);
    }

    /**
     * Mise à jour depuis WebSocket ou autre source externe.
     */
    setTime(h, m, s) {
        this.hours = h;
        this.minutes = m;
        this.seconds = s;
    }

    /**
     * Dessine l’horloge complète :
     *   - fond
     *   - graduations
     *   - aiguilles
     *   - texte HH:MM:SS
     */
    draw() {
        this.drawer.clear(this.canvas);
        this.drawer.drawDial();
        this.drawer.drawGraduations();

        const h = this.hours % 12;
        const m = this.minutes;
        const s = this.seconds;

        // Angles en radians
        const aS = (Math.PI / 30) * s - Math.PI / 2;
        const aM = (Math.PI / 30) * m - Math.PI / 2;
        const aH = (Math.PI / 6) * h + (Math.PI / 360) * m - Math.PI / 2;

        // Aiguilles
        this.drawer.drawHand(aS, this.radius * 0.9, 1, 40);
        this.drawer.drawHand(aM, this.radius * 0.7, 3, 40);
        this.drawer.drawHand(aH, this.radius * 0.5, 5, 40);

        // Texte central HH:MM:SS
        this.drawer.drawText(
            `${String(this.hours).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
            0, 0
        );
    }
}

// Variable globale
let clock;

document.addEventListener("DOMContentLoaded", () => {
    clock = new Clock("clock");
});
