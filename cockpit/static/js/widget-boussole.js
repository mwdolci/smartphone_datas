class CompassRenderer {
    constructor() {
        this.needle = document.getElementById('needle');
        this.headingEl = document.getElementById('heading');
        this.sourceEl = document.getElementById('source');
        this.tiltEl = document.getElementById('tilt');
        this.statusEl = document.getElementById('status');

        this.declinaisonDeg = 0;
        this.headingOffset = 0;
    }

    clampDeg(d) {
        return (d % 360 + 360) % 360;
    }

    renderHeading(smoothAlphaValue, smoothBetaValue, smoothGammaValue, source = '') {

        // ✅ Appel correct de la méthode interne
        const heading = this.computeHeadingFromEuler(
            smoothAlphaValue,
            smoothBetaValue,
            smoothGammaValue
        );

        const tiltText = `β=${smoothBetaValue.toFixed(0)}°, γ=${smoothGammaValue.toFixed(0)}°`;

        const hdg = this.clampDeg(heading + this.declinaisonDeg + this.headingOffset);

        this.needle.style.transform = `translate(-50%,-90%) rotate(${hdg}deg)`;
        this.headingEl.textContent = hdg.toFixed(0);
        this.tiltEl.textContent = tiltText || '—';
        this.sourceEl.textContent = source;
    }

    setStatus(text, cls = '') {
        this.statusEl.textContent = text;
        this.statusEl.className = cls;
    }

    computeHeadingFromEuler(alpha, beta, gamma) {
        const toRad = d => d * Math.PI / 180;

        const _alpha = toRad(alpha);
        const _beta  = toRad(beta);
        const _gamma = toRad(gamma);

        const cA = Math.cos(_alpha), sA = Math.sin(_alpha);
        const cB = Math.cos(_beta),  sB = Math.sin(_beta);
        const cG = Math.cos(_gamma), sG = Math.sin(_gamma);

        const m11 = cA * cG - sA * sB * sG;
        const m12 = -cB * sA;

        return Math.atan2(m12, m11) * 180 / Math.PI;
    }
}

// ✅ Expose la classe pour les autres widgets
window.CompassRenderer = CompassRenderer;
