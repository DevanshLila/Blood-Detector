/**
 * BloodTrace — Real-time Scientific Telemetry Charts
 * High-performance HTML5 Canvas Oscilloscope & Spectral Metric Gauges
 * Labels all outputs clearly as "SIMULATION DATA (a.u.)"
 */

export class TelemetryCharts {
  constructor(canvasOscilloscopeId, appState) {
    this.oscCanvas = document.getElementById(canvasOscilloscopeId);
    this.state = appState;
    this.maxPoints = 120;
    this.history = [];
    this.animationId = null;
    this.initHistory();
  }

  initHistory() {
    const base = this.state.currentADC || 195;
    for (let i = 0; i < this.maxPoints; i++) {
      this.history.push({
        adc: base + (Math.random() * 4 - 2),
        uv: 0,
        ir: 0,
        mode: 'off'
      });
    }
  }

  addReading(reading) {
    this.history.push({
      adc: reading.photodiodeADC || 195,
      uv: reading.uvIntensity || 0,
      ir: reading.irIntensity || 0,
      mode: reading.mode || 'off'
    });

    if (this.history.length > this.maxPoints) {
      this.history.shift();
    }
    this.renderOscilloscope();
  }

  renderOscilloscope() {
    if (!this.oscCanvas) return;
    const ctx = this.oscCanvas.getContext('2d');
    const w = this.oscCanvas.width;
    const h = this.oscCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Scientific grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline reference line (~195 ADC)
    const baseNormY = h - (195 / 1024) * (h - 32) - 16;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.40)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, baseNormY);
    ctx.lineTo(w, baseNormY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.fillText('DARK BASELINE (195 ADC)', 6, baseNormY - 3);

    const step = w / (this.maxPoints - 1);

    // Channel 1: 850nm NIR Reflectance Trace (Pink, scaled 0-900 a.u.)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    this.history.forEach((pt, idx) => {
      const x = idx * step;
      const y = h - (Math.min(900, pt.ir || 0) / 950) * (h - 32) - 16;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Channel 2: 365nm UV Fluorescence Trace (Violet, scaled 0-350 a.u.)
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    this.history.forEach((pt, idx) => {
      const x = idx * step;
      const y = h - (Math.min(350, pt.uv || 0) / 400) * (h - 32) - 16;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Channel 3: BPW34 Photodiode ADC Trace (Cyan, scaled 0-1023 ADC)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    this.history.forEach((pt, idx) => {
      const x = idx * step;
      const y = h - (pt.adc / 1024) * (h - 32) - 16;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Channel Legend & Live Values Header
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      const curX = w - 2;
      const curY = h - (last.adc / 1024) * (h - 32) - 16;

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(curX - 2, curY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Channel Legend Pills
      ctx.font = '8px monospace';
      // Cyan Photodiode
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(8, 6, 6, 6);
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(`PD:${last.adc}ADC`, 17, 12);

      // Violet UV
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(80, 6, 6, 6);
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`UV:${last.uv}au`, 89, 12);

      // Pink NIR
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(145, 6, 6, 6);
      ctx.fillStyle = '#fda4af';
      ctx.fillText(`NIR:${last.ir}au`, 154, 12);
    }

    // Grid labels
    ctx.fillStyle = '#475569';
    ctx.font = '8px monospace';
    ctx.fillText('0 ADC', 6, h - 3);
    ctx.fillText('1023 ADC', w - 50, 12);
    ctx.fillText('SIMULATION DATA (a.u.)', w / 2 - 45, h - 3);
  }

  /**
   * Updates the static summary charts (UV vs IR bar comparison)
   */
  renderSpectralBars(canvasBarId, uvVal, irVal) {
    const canvas = document.getElementById(canvasBarId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    const barWidth = 45;
    const maxVal = 900;

    // UV Bar (Violet)
    const uvHeight = Math.min(h - 40, (uvVal / maxVal) * (h - 40));
    const uvX = w * 0.28 - barWidth / 2;
    const uvY = h - uvHeight - 20;

    const uvGrad = ctx.createLinearGradient(0, uvY, 0, h - 20);
    uvGrad.addColorStop(0, '#a855f7');
    uvGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = uvGrad;
    ctx.fillRect(uvX, uvY, barWidth, uvHeight);

    // IR Bar (Pink/Rose)
    const irHeight = Math.min(h - 40, (irVal / maxVal) * (h - 40));
    const irX = w * 0.72 - barWidth / 2;
    const irY = h - irHeight - 20;

    const irGrad = ctx.createLinearGradient(0, irY, 0, h - 20);
    irGrad.addColorStop(0, '#f43f5e');
    irGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = irGrad;
    ctx.fillRect(irX, irY, barWidth, irHeight);

    // Labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('365nm UV', w * 0.28, h - 6);
    ctx.fillText('850nm NIR', w * 0.72, h - 6);

    ctx.fillStyle = '#c084fc';
    ctx.fillText(`${uvVal} a.u.`, w * 0.28, uvY - 6);
    ctx.fillStyle = '#fb7185';
    ctx.fillText(`${irVal} a.u.`, w * 0.72, irY - 6);
  }
}
