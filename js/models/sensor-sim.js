/**
 * BloodTrace — Optical Physics & Sensor Simulation Model
 * College-level engineering model for dual-wavelength contamination screening
 * 
 * Channels:
 * - 365 nm UV-A LED (autofluorescence / protein excitation)
 * - 850 nm NIR LED (hemoglobin absorption / specular steel reflection)
 * - BPW34 PIN Photodiode (transimpedance amp -> Arduino 10-bit ADC A0)
 */

export const SAMPLE_CONDITIONS = {
  clean: {
    id: 'clean',
    name: 'Clean Reference Sample',
    category: 'Baseline',
    description: 'Electropolished AISI 316L surgical steel, ultrasonic cleaned, free of organic deposits.',
    expectedResult: 'No significant optical difference detected',
    baseUvEmission: 18,     // Low autofluorescence (a.u.)
    baseIrReflectance: 760, // High specular reflection off stainless steel
    expectedRisk: 'Low'
  },
  blood_dried: {
    id: 'blood_dried',
    name: 'Simulated Dried Blood Residue',
    category: 'Biological Contamination',
    description: 'Dried whole blood deposit containing coagulated hemoglobin/porphyrins.',
    expectedResult: 'Possible residue detected',
    baseUvEmission: 48,     // Weak organic rim fluorescence, high UV Soret quenching
    baseIrReflectance: 460, // Marked NIR absorption dip (heme optical density)
    expectedRisk: 'Critical'
  },
  blood_small: {
    id: 'blood_small',
    name: 'Simulated Small Blood Spot (0.5 mm)',
    category: 'Biological Contamination',
    description: 'Focal micro-droplet residue near hinge, jaw, or serrations.',
    expectedResult: 'Possible residue detected',
    baseUvEmission: 32,
    baseIrReflectance: 610,
    expectedRisk: 'High'
  },
  blood_multi: {
    id: 'blood_multi',
    name: 'Simulated Multiple Contamination Spots',
    category: 'Biological Contamination',
    description: 'Multi-focal residual organic micro-crusts dispersed across functional joints.',
    expectedResult: 'Possible residue detected',
    baseUvEmission: 65,
    baseIrReflectance: 410,
    expectedRisk: 'Critical'
  },
  detergent: {
    id: 'detergent',
    name: 'Simulated Detergent Residue',
    category: 'Chemical Cleaning Confounder',
    description: 'Dried enzymatic/alkaline washer-disinfector surfactant film. Common hospital false-positive.',
    expectedResult: 'Ambiguous result — manual inspection required',
    baseUvEmission: 240,    // Very high blue-cyan fluorescence from optical brighteners/surfactants
    baseIrReflectance: 745, // Minimal NIR absorption (transparent at 850nm)
    expectedRisk: 'Ambiguous / Confounder'
  },
  water_mark: {
    id: 'water_mark',
    name: 'Simulated Water / Saline Marks',
    category: 'Mineral Residue',
    description: 'Calcium/saline evaporated ring from tap rinse or autoclave steam droplet.',
    expectedResult: 'No significant optical difference detected',
    baseUvEmission: 26,
    baseIrReflectance: 730,
    expectedRisk: 'Low / Artifact'
  }
};

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 */
export class DeterministicRNG {
  constructor(seed = 12345678) {
    this.seed = seed;
    this.state = seed;
  }

  setSeed(seed) {
    this.seed = seed;
    this.state = seed;
  }

  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Gaussian distributed random variable using Box-Muller transform
   */
  nextGaussian(mean = 0, stdDev = 1) {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

/**
 * Sensor Simulation Engine
 */
export class SensorSimulator {
  constructor(initialSeed = 42817) {
    this.rng = new DeterministicRNG(initialSeed);
    this.seed = initialSeed;
    this.ambientBaselineADC = 195; // ~950 mV dark current + ambient room photodiode offset
    this.amplifierGain = 2.4;      // Transimpedance op-amp multiplier
    this.thermalNoiseStd = 2.5;    // Standard deviation of electronic noise in ADC counts
  }

  setSeed(seed) {
    this.seed = seed;
    this.rng.setSeed(seed);
  }

  /**
   * Computes sensor channel values based on illumination mode and active spots
   * @param {string} mode - 'off', 'uv', 'ir', 'combined'
   * @param {string} conditionId 
   * @param {Array} spots 
   * @param {number} timestamp 
   * @returns {Object} sensorReadings
   */
  calculateReading(mode, conditionId, spots = [], timestamp = 0) {
    const condition = SAMPLE_CONDITIONS[conditionId] || SAMPLE_CONDITIONS.clean;

    // Aggregate spot coverage and optical weight
    let totalSpotAreaWeight = 0;
    let maxIntensity = 0;
    spots.forEach(spot => {
      const area = Math.PI * Math.pow(spot.radiusRatio || 0.03, 2);
      totalSpotAreaWeight += area * (spot.intensity || 1.0);
      if ((spot.intensity || 1.0) > maxIntensity) {
        maxIntensity = spot.intensity || 1.0;
      }
    });

    // Gaussian noise components (deterministic per timestamp/seed)
    const noiseUV = this.rng.nextGaussian(0, this.thermalNoiseStd);
    const noiseIR = this.rng.nextGaussian(0, this.thermalNoiseStd * 1.2);
    const noisePD = this.rng.nextGaussian(0, this.thermalNoiseStd * 0.8);

    // Channel baseline levels
    let uvIntensity = 0;
    let irIntensity = 0;
    let photodiodeADC = this.ambientBaselineADC + Math.round(noisePD);

    // 1. UV Channel Response (365 nm excitation)
    if (mode === 'uv' || mode === 'combined') {
      const baseUV = condition.baseUvEmission;
      // If dried blood, central quench but slight organic fringe
      let deltaUV = 0;
      if (conditionId === 'detergent') {
        deltaUV = (condition.baseUvEmission - 20) * (0.8 + totalSpotAreaWeight * 20);
      } else if (conditionId.startsWith('blood')) {
        deltaUV = 15 * totalSpotAreaWeight * 15;
      }

      uvIntensity = Math.max(0, Math.round(baseUV + deltaUV + noiseUV));
      // Photodiode response in UV mode (BPW34 has ~0.2 A/W sensitivity at 400nm)
      const pdUvGain = 0.45;
      photodiodeADC += Math.round(uvIntensity * pdUvGain);
    }

    // 2. IR Channel Response (850 nm NIR reflectance)
    if (mode === 'ir' || mode === 'combined') {
      const baseIR = condition.baseIrReflectance;
      let deltaIR = 0;
      if (conditionId.startsWith('blood')) {
        // High NIR absorption drops reflected light significantly
        const absorptionFactor = conditionId === 'blood_multi' ? 320 : (conditionId === 'blood_small' ? 140 : 260);
        deltaIR = -absorptionFactor * (0.6 + maxIntensity * 0.4);
      } else if (conditionId === 'detergent') {
        deltaIR = -15; // Minimal absorption
      } else if (conditionId === 'water_mark') {
        deltaIR = -25;
      }

      irIntensity = Math.max(0, Math.round(baseIR + deltaIR + noiseIR));
      // Photodiode response in IR mode (BPW34 has peak sensitivity ~0.62 A/W at 850-900nm!)
      const pdIrGain = 0.72;
      photodiodeADC += Math.round(irIntensity * pdIrGain * 0.95);
    }

    // Clamp 10-bit ADC to 0-1023
    photodiodeADC = Math.max(0, Math.min(1023, photodiodeADC));

    return {
      mode,
      timestamp,
      uvIntensity,        // Arbitrary Units (a.u.)
      irIntensity,        // Arbitrary Units (a.u.)
      photodiodeADC,      // 0-1023 10-bit ADC counts
      photodiodeVoltage: (photodiodeADC * (5.0 / 1023.0)).toFixed(3), // Simulated Volts
      ambientBaseline: this.ambientBaselineADC,
      noiseUV: noiseUV.toFixed(2),
      noiseIR: noiseIR.toFixed(2),
      noisePD: noisePD.toFixed(2),
      totalSpotAreaWeight
    };
  }
}

/**
 * Renders simulated contamination markings onto instrument canvas
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} spots 
 * @param {string} conditionId 
 * @param {string} mode - 'reference', 'ambient', 'uv', 'ir', 'combined', 'candidate_map'
 * @param {number} width 
 * @param {number} height 
 * @param {Object} options 
 */
export function drawSimulatedContamination(ctx, spots, conditionId, mode, width, height, options = {}) {
  if (!spots || spots.length === 0) return;
  if (mode === 'reference') return; // Clean reference panel never renders contamination!

  const { detectionThreshold = 35, showBoundingBoxes = false } = options;

  ctx.save();

  spots.forEach((spot, idx) => {
    const x = spot.xRatio * width;
    const y = spot.yRatio * height;
    const r = Math.max(6, (spot.radiusRatio || 0.04) * Math.min(width, height));
    const intensity = spot.intensity || 1.0;

    if (mode === 'candidate_map') {
      // Laptop Dashboard Candidate Residue Map
      drawCandidateResidueMapOverlay(ctx, x, y, r, intensity, conditionId, detectionThreshold, idx, showBoundingBoxes);
    } else if (mode === 'uv') {
      // 365 nm UV-A Fluorescence appearance
      drawUvAppearance(ctx, x, y, r, intensity, conditionId);
    } else if (mode === 'ir') {
      // 850 nm NIR Reflectance / Absorption appearance
      drawIrAppearance(ctx, x, y, r, intensity, conditionId);
    } else if (mode === 'combined') {
      // Combined dual-wavelength appearance
      drawCombinedAppearance(ctx, x, y, r, intensity, conditionId);
    } else {
      // Standard ambient white-light appearance
      drawAmbientAppearance(ctx, x, y, r, intensity, conditionId);
    }
  });

  ctx.restore();
}

/**
 * Standard white/ambient light visual appearance
 */
function drawAmbientAppearance(ctx, x, y, r, intensity, conditionId) {
  if (conditionId.startsWith('blood')) {
    // Dried blood crust: dark brownish-red coagulum with irregular edge
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(69, 10, 10, 0.95)');
    grad.addColorStop(0.65, 'rgba(127, 29, 29, 0.85)');
    grad.addColorStop(1, 'rgba(153, 27, 27, 0.20)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r, 0.25);
    ctx.fill();

    // Dried cracked texture
    ctx.strokeStyle = 'rgba(40, 5, 5, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.3);
    ctx.lineTo(x + r * 0.3, y + r * 0.2);
    ctx.moveTo(x - r * 0.2, y + r * 0.4);
    ctx.lineTo(x + r * 0.2, y - r * 0.3);
    ctx.stroke();
  } else if (conditionId === 'detergent') {
    // Dried surfactant film: faint translucent cloudy white/rainbow film
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3);
    grad.addColorStop(0, 'rgba(240, 249, 255, 0.35)');
    grad.addColorStop(0.7, 'rgba(224, 242, 254, 0.18)');
    grad.addColorStop(1, 'rgba(186, 230, 253, 0.0)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r * 1.3, 0.35);
    ctx.fill();
  } else if (conditionId === 'water_mark') {
    // Mineral deposit ring
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.1, r * 0.85, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * 365 nm UV-A Appearance
 */
function drawUvAppearance(ctx, x, y, r, intensity, conditionId) {
  if (conditionId === 'detergent') {
    // Vibrant blue-cyan fluorescence (intense emission from optical brighteners)
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 18;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.4);
    grad.addColorStop(0, 'rgba(165, 243, 252, 0.95)');
    grad.addColorStop(0.4, 'rgba(34, 211, 238, 0.80)');
    grad.addColorStop(0.75, 'rgba(6, 182, 212, 0.50)');
    grad.addColorStop(1, 'rgba(8, 145, 178, 0.0)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r * 1.4, 0.3);
    ctx.fill();
    ctx.restore();
  } else if (conditionId.startsWith('blood')) {
    // Blood absorbs UV strongly (dark center due to Soret band) with faint organic rim autofluorescence
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(15, 15, 20, 0.95)'); // dark absorbing core
    grad.addColorStop(0.7, 'rgba(30, 20, 30, 0.85)');
    grad.addColorStop(0.9, 'rgba(234, 88, 12, 0.40)'); // faint reddish/orange porphyrin halo
    grad.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r, 0.2);
    ctx.fill();
  } else if (conditionId === 'water_mark') {
    // Very faint under UV
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - r, y - r * 0.8, r * 2, r * 1.6);
  }
}

/**
 * 850 nm NIR Appearance
 */
function drawIrAppearance(ctx, x, y, r, intensity, conditionId) {
  if (conditionId.startsWith('blood')) {
    // Hemoglobin exhibits stark NIR absorption: appears as a prominent dark spot against reflective steel
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(12, 12, 14, 0.98)');
    grad.addColorStop(0.75, 'rgba(24, 24, 28, 0.92)');
    grad.addColorStop(1, 'rgba(50, 50, 56, 0.3)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r, 0.2);
    ctx.fill();

    // High contrast absorption halo
    ctx.strokeStyle = 'rgba(15, 15, 18, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else if (conditionId === 'detergent') {
    // Detergent film is essentially transparent at 850nm NIR!
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(180, 185, 195, 0.12)');
    grad.addColorStop(1, 'rgba(150, 155, 165, 0.0)');
    ctx.fillStyle = grad;
    drawIrregularBlob(ctx, x, y, r, 0.2);
    ctx.fill();
  } else if (conditionId === 'water_mark') {
    // Mild scattering edge
    ctx.strokeStyle = 'rgba(200, 205, 215, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.05, r * 0.8, Math.PI / 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Combined Dual-Wavelength Appearance
 */
function drawCombinedAppearance(ctx, x, y, r, intensity, conditionId) {
  // Draw blended UV + IR representation
  drawUvAppearance(ctx, x, y, r, intensity, conditionId);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  drawIrAppearance(ctx, x, y, r, intensity * 0.85, conditionId);
  ctx.restore();
}

/**
 * Laptop Dashboard Candidate Residue Map (Panel D)
 * Red outlines, transparent red overlay, cyan structural contours, bounding boxes
 */
function drawCandidateResidueMapOverlay(ctx, x, y, r, intensity, conditionId, threshold, idx, showBoundingBoxes) {
  // Check if simulated optical contrast exceeds threshold
  let contrastLevel = 0;
  if (conditionId.startsWith('blood')) {
    contrastLevel = 85 * intensity; // High contrast
  } else if (conditionId === 'detergent') {
    contrastLevel = 60 * intensity; // UV fluorescence contrast
  } else if (conditionId === 'water_mark') {
    contrastLevel = 25 * intensity;
  }

  // If contrast is below threshold, filter it out (demonstrates threshold interactivity!)
  if (contrastLevel < threshold) return;

  ctx.save();

  // Semi-transparent red candidate overlay mask
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.15);
  grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
  grad.addColorStop(0.75, 'rgba(220, 38, 38, 0.30)');
  grad.addColorStop(1, 'rgba(185, 28, 28, 0.05)');
  ctx.fillStyle = grad;
  drawIrregularBlob(ctx, x, y, r * 1.15, 0.22);
  ctx.fill();

  // Distinct red contour outline
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([3, 2]);
  drawIrregularBlob(ctx, x, y, r * 1.15, 0.22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bounding Box and Annotation
  if (showBoundingBoxes || true) {
    const boxPad = r * 1.25;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - boxPad, y - boxPad, boxPad * 2, boxPad * 2);

    // Corner bracket accents
    drawCornerBrackets(ctx, x - boxPad, y - boxPad, boxPad * 2, boxPad * 2, 6);

    // Label tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    const tagText = `ROI-${idx + 1}: Suspected Residue`;
    ctx.font = '10px "JetBrains Mono", monospace';
    const tagWidth = ctx.measureText(tagText).width + 10;
    ctx.fillRect(x - boxPad, y - boxPad - 16, tagWidth, 16);

    ctx.fillStyle = '#fca5a5';
    ctx.fillText(tagText, x - boxPad + 5, y - boxPad - 4);
  }

  ctx.restore();
}

/**
 * Draws irregular organic droplet contour using sine wave modulation
 */
function drawIrregularBlob(ctx, cx, cy, r, distortion = 0.2) {
  const points = 16;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Harmonic wobble for organic boundary
    const wobble = 1.0 + Math.sin(angle * 3) * distortion * 0.6 + Math.cos(angle * 5) * distortion * 0.4;
    const px = cx + Math.cos(angle) * r * wobble;
    const py = cy + Math.sin(angle) * r * wobble;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawCornerBrackets(ctx, x, y, w, h, len) {
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  // Top-right
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  // Bottom-left
  ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
  // Bottom-right
  ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}
