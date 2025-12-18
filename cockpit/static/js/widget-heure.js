class DialDrawer {
    constructor(ctx, radius) {
        this.ctx = ctx;
        this.radius = radius;
    }

    clear(canvas) {
        this.ctx.clearRect(-this.radius, -this.radius, canvas.width, canvas.height);
    }

    drawDial() {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawHand(angle, length, width, innerGap = 40) {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;

        // ✅ Aiguille commence à innerGap au lieu de 0
        this.ctx.moveTo(Math.cos(angle) * innerGap, Math.sin(angle) * innerGap);

        // ✅ Pointe de l’aiguille
        this.ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);

        this.ctx.stroke();
    }


    drawText(text, x, y) {
        this.ctx.font = "20px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, x, y);
    }

    drawGraduations() {
        const divisions = 60;

        for (let i = 0; i < divisions; i++) {
            const angle = (Math.PI * 2 / divisions) * i - Math.PI / 2;

            const outer = this.radius - 5;
            let inner = this.radius - 15;
            let width = 1;

            // ✅ Traits plus longs toutes les 5 divisions
            if (i % 5 === 0) {
                inner = this.radius - 25;
                width = 2;
            }

            // ✅ Trait
            this.ctx.beginPath();
            this.ctx.lineWidth = width;
            this.ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
            this.ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
            this.ctx.stroke();

            // ✅ Numérotation toutes les 5 divisions
            if (i % 5 === 0) {
                let label;


                // 0 → 12, 5 → 1, 10 → 2, etc.
                label = i === 0 ? 12 : i / 5;


                const textRadius = this.radius - 40;
                const x = Math.cos(angle) * textRadius;
                const y = Math.sin(angle) * textRadius;

                this.drawText(label.toString(), x, y);
            }
        }
    }
}

class Clock {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.radius = this.canvas.height / 2;
        this.ctx.translate(this.radius, this.radius);
        this.drawer = new DialDrawer(this.ctx, this.radius);

        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;

        setInterval(() => this.draw(), 1000);
    }

    // ✅ Mise à jour depuis WebSocket
    setTime(h, m, s) {
        this.hours = h;
        this.minutes = m;
        this.seconds = s;
    }

    draw() {
        this.drawer.clear(this.canvas);
        this.drawer.drawDial();
        this.drawer.drawGraduations();

        const h = this.hours % 12;
        const m = this.minutes;
        const s = this.seconds;

        const aS = (Math.PI / 30) * s - Math.PI / 2;
        const aM = (Math.PI / 30) * m - Math.PI / 2;
        const aH = (Math.PI / 6) * h + (Math.PI / 360) * m - Math.PI / 2;

        this.drawer.drawHand(aS, this.radius * 0.9, 1, 40);
        this.drawer.drawHand(aM, this.radius * 0.7, 3, 40);
        this.drawer.drawHand(aH, this.radius * 0.5, 5, 40);

        this.drawer.drawText(
            `${String(this.hours).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
            0, 0
        );
    }
}


let clock;   // ✅ variable globale

document.addEventListener("DOMContentLoaded", () => {
    clock = new Clock("clock");
});