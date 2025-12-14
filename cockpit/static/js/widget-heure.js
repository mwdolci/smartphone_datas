class DialDrawer {
    constructor(ctx, radius, color = "#555555ff") {
        this.ctx = ctx;
        this.radius = radius;
        this.color = color;
    }

    clear(canvas) {
        this.ctx.clearRect(-this.radius, -this.radius, canvas.width, canvas.height);
    }

    drawDial() {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius - 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = "#1d1d1d50";
        this.ctx.fill();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawHand(angle, length, width, color, innerGap = 0) {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(Math.cos(angle) * innerGap, Math.sin(angle) * innerGap);
        this.ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        this.ctx.stroke();
    }

    drawText(text, font, color, x, y) {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';   // horizontal
        this.ctx.textBaseline = 'middle'; // vertical
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }



    // 🔹 graduations + numéros
    drawGraduations(type = "clock") {
        const divisions = 60; // 60 graduations
        for (let i = 0; i < divisions; i++) {   // < au lieu de <=
            const angle = (2 * Math.PI / divisions) * i - Math.PI / 2;

            // Traits
            const inner = this.radius - 10;
            let outer = this.radius - 20;
            let lineWidth = 1.5;

            if (i % 5 === 0) {
                outer = this.radius - 30;
                lineWidth = 3;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            this.ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();

            // Numérotation toutes les 5 minutes
            if (i % 5 === 0) {
                let label;
                if (type === "clock") {
                    let hourIndex = (i / 5) || 12; // 0 devient 12
                    label = hourIndex;
                } else if (type === "chrono") {
                    label = i;
                }

                const textRadius = this.radius - 45;
                let x = Math.cos(angle) * textRadius;
                let y = Math.sin(angle) * textRadius;
               // Définir une tolérance
                const EPSILON = 1e-10; // seuil en dessous duquel on considère que c'est zéro

                if (Math.abs(x) < EPSILON) {
                    x = 0;

                }

                if (Math.abs(y) < EPSILON) {
                    y = 0;
                }

                this.drawText(label.toString(), "14px Arial", this.color, x, y);
            }
        }
    }

}

class Clock {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("Canvas introuvable :", canvasId);
            return;
        }
        this.ctx = this.canvas.getContext("2d");
        this.radius = this.canvas.height / 2;
        this.ctx.translate(this.radius, this.radius);
        this.drawer = new DialDrawer(this.ctx, this.radius);

        setInterval(() => this.draw(), 1000);
    }

    draw() {
        this.drawer.clear(this.canvas);
        this.drawer.drawDial();

        this.drawer.drawGraduations("clock"); // 24 heures, avec traits spéciaux toutes les 10

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Aiguilles
        const angleSec = (Math.PI / 30) * seconds - Math.PI / 2;
        this.drawer.drawHand(angleSec, this.radius * 0.8, 2, "red", 100);

        const angleMin = (Math.PI / 30) * minutes + (Math.PI / 1800) * seconds - Math.PI / 2;
        this.drawer.drawHand(angleMin, this.radius * 0.75, 6, "blue", 80);

        const angleHour = (Math.PI / 6) * (hours % 12) + (Math.PI / 360) * minutes - Math.PI / 2;
        this.drawer.drawHand(angleHour, this.radius * 0.7, 8, "green", 80);

        this.drawer.drawText(`${hours}:${minutes}:${seconds}`, "40px Arial", this.drawer.color, 0, 0);
    }
}

class Chrono {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("Canvas introuvable :", canvasId);
            return;
        }
        this.ctx = this.canvas.getContext("2d");
        this.radius = this.canvas.height / 2;
        this.ctx.translate(this.radius, this.radius);
        this.drawer = new DialDrawer(this.ctx, this.radius);

        this.startTime = null;
        this.elapsed = 0;
        this.running = false;

        setInterval(() => this.draw(), 1000);
    }

    start() {
        if (!this.running) {
        this.startTime = Date.now() - this.elapsed;
        this.running = true;
        }
    }

    stop() {
        if (this.running) {
        this.elapsed = Date.now() - this.startTime;
        this.running = false;
        }
    }

    reset() {
        this.elapsed = 0;
        this.startTime = null;
        this.running = false;
    }

    draw() {
        if (this.running) {
        this.elapsed = Date.now() - this.startTime;
        }
        const totalSeconds = Math.floor(this.elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        // Aiguilles
        const angleSec = (Math.PI / 30) * seconds - Math.PI / 2;
        const angleMin = (Math.PI / 30) * minutes + (Math.PI / 1800) * seconds - Math.PI / 2;

        this.drawer.clear(this.canvas);
        this.drawer.drawDial();

        this.drawer.drawGraduations("chrono"); // 60 minutes, toutes identiques

        // Aiguilles
        this.drawer.drawHand(angleSec, this.radius * 0.8, 2, "red", 100);
        this.drawer.drawHand(angleMin, this.radius * 0.75, 6, "blue", 80);
        this.drawer.drawText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, "40px Arial", this.drawer.color, 0, 0);
    }
    }

    document.addEventListener("DOMContentLoaded", () => {
    const clock = new Clock("clock");
    const chrono = new Chrono("chrono");

    function showClock() {
        document.getElementById("clock").style.display = "block";
        document.getElementById("chrono").style.display = "none";
        document.getElementById("chronoControls").style.display = "none";
    }

    function showChrono() {
        document.getElementById("clock").style.display = "none";
        document.getElementById("chrono").style.display = "block";
        document.getElementById("chronoControls").style.display = "block";
    }

    // Ajout des event listeners
    document.getElementById("btnClock").addEventListener("click", showClock);
    document.getElementById("btnChrono").addEventListener("click", showChrono);

    document.getElementById("btnStart").addEventListener("click", () => chrono.start());
    document.getElementById("btnStop").addEventListener("click", () => chrono.stop());
    document.getElementById("btnReset").addEventListener("click", () => chrono.reset());

    // Par défaut, on démarre sur l’horloge
    showClock();
});