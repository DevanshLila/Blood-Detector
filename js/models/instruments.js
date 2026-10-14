/**
 * BloodTrace — Medical Instrument Models
 * Realistic SVG & Canvas renderings of reusable surgical instruments
 * Designed for college-level engineering demonstration
 */

export const INSTRUMENT_DEFINITIONS = {
  forceps: {
    id: 'forceps',
    name: 'Tissue Forceps (Adson/DeBakey)',
    category: 'Grasping Instrument',
    material: 'AISI 316L Surgical Stainless Steel (Passivated)',
    dimensions: '120 mm length × 14 mm max width',
    weight: '28 g',
    criticalAreas: [
      { name: 'Toothed Tip', xRatio: 0.12, yRatio: 0.50, radius: 18, risk: 'High risk: tissue and protein entrapment in teeth' },
      { name: 'Mid Shank Serrations', xRatio: 0.45, yRatio: 0.50, radius: 24, risk: 'Medium risk: ribbed grip can harbor biofilm' },
      { name: 'Spring Hinge Base', xRatio: 0.88, yRatio: 0.50, radius: 20, risk: 'Moderate risk: flexure recess' }
    ],
    defaultSpots: [
      { xRatio: 0.15, yRatio: 0.49, radiusRatio: 0.035, intensity: 0.92 }
    ]
  },
  scissors: {
    id: 'scissors',
    name: 'Metzenbaum Dissecting Scissors',
    category: 'Cutting Instrument',
    material: 'AISI 420 Martensitic Stainless Steel (Electropolished)',
    dimensions: '145 mm length × 48 mm span at finger rings',
    weight: '36 g',
    criticalAreas: [
      { name: 'Box Lock / Pivot Screw', xRatio: 0.38, yRatio: 0.50, radius: 22, risk: 'Critical: Blood seeps under screw and hinge pin' },
      { name: 'Blade Cutting Edge', xRatio: 0.18, yRatio: 0.46, radius: 20, risk: 'High risk: micro-serrations trap dried hemoglobin' },
      { name: 'Finger Rings', xRatio: 0.85, yRatio: 0.50, radius: 26, risk: 'Low risk: open geometry easy to clean' }
    ],
    defaultSpots: [
      { xRatio: 0.38, yRatio: 0.49, radiusRatio: 0.04, intensity: 0.95 }
    ]
  },
  hemostat: {
    id: 'hemostat',
    name: 'Crile Curved Hemostatic Clamp',
    category: 'Clamping Instrument',
    material: 'AISI 316L Surgical Stainless Steel (Matte Finish)',
    dimensions: '140 mm length × 52 mm ring span',
    weight: '42 g',
    criticalAreas: [
      { name: 'Transverse Serrated Jaws', xRatio: 0.14, yRatio: 0.44, radius: 22, risk: 'Extremely high: deep transverse teeth retain coagulum' },
      { name: 'Box Lock Joint', xRatio: 0.36, yRatio: 0.50, radius: 24, risk: 'Critical: tight tolerance joint traps blood' },
      { name: 'Ratchet Clasp', xRatio: 0.72, yRatio: 0.52, radius: 18, risk: 'High risk: interlocking steps resist ultrasonic wash' }
    ],
    defaultSpots: [
      { xRatio: 0.16, yRatio: 0.43, radiusRatio: 0.038, intensity: 0.88 }
    ]
  },
  coupon: {
    id: 'coupon',
    name: 'Calibrated Test Coupon (ASTM F3127)',
    category: 'Reference Test Specimen',
    material: 'AISI 316L Electropolished Steel Coupon with 1mm Metric Grid',
    dimensions: '75 mm length × 25 mm width × 1.5 mm thickness',
    weight: '22 g',
    criticalAreas: [
      { name: 'Center Test Zone A', xRatio: 0.35, yRatio: 0.50, radius: 25, risk: 'Calibrated protein challenge location' },
      { name: 'Center Test Zone B', xRatio: 0.65, yRatio: 0.50, radius: 25, risk: 'Secondary validation zone' }
    ],
    defaultSpots: [
      { xRatio: 0.50, yRatio: 0.50, radiusRatio: 0.045, intensity: 0.90 }
    ]
  }
};

/**
 * Draws the selected instrument onto an HTML5 Canvas context
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} instrumentId 
 * @param {number} width 
 * @param {number} height 
 * @param {Object} styleOptions 
 */
export function drawInstrument(ctx, instrumentId, width, height, styleOptions = {}) {
  const {
    lighting = 'ambient', // 'ambient', 'uv', 'ir', 'combined', 'reference'
    showCriticalAreas = false,
    highlightColor = null
  } = styleOptions;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background subtle grid/matte platform
  drawSamplePlatform(ctx, width, height, lighting);

  // Setup metallic shading based on illumination
  const metalColors = getMetalPalette(lighting, highlightColor);

  switch (instrumentId) {
    case 'forceps':
      drawForceps(ctx, width, height, metalColors, lighting);
      break;
    case 'scissors':
      drawScissors(ctx, width, height, metalColors, lighting);
      break;
    case 'hemostat':
      drawHemostat(ctx, width, height, metalColors, lighting);
      break;
    case 'coupon':
    default:
      drawCoupon(ctx, width, height, metalColors, lighting);
      break;
  }

  // Optional critical area indicators
  if (showCriticalAreas) {
    drawCriticalAreaMarkers(ctx, instrumentId, width, height);
  }

  ctx.restore();
}

/**
 * Palette based on illumination mode
 */
function getMetalPalette(lighting, highlightColor = null) {
  if (lighting === 'candidate_map' || highlightColor) {
    // Panel D Candidate Residue Map: Neutral grey instrument surface with cyan structural edges
    return {
      base: '#374151',
      highlight: '#22d3ee',
      shadow: '#1f2937',
      specular: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.25)',
      ambient: '#2b3240'
    };
  } else if (lighting === 'uv') {
    // Under 365nm: Steel absorbs UV and reflects specular violet/deep blue
    return {
      base: '#2a2b3d',
      highlight: '#5c5e8a',
      shadow: '#151622',
      specular: '#8f92cc',
      glow: 'rgba(99, 102, 241, 0.25)',
      ambient: '#1f2030'
    };
  } else if (lighting === 'ir') {
    // Under 850nm: Steel has high specular reflectance in NIR (brighter metallic monochrome)
    return {
      base: '#70757d',
      highlight: '#c8cbd0',
      shadow: '#383b40',
      specular: '#f0f3f8',
      glow: 'rgba(236, 72, 153, 0.12)',
      ambient: '#545860'
    };
  } else if (lighting === 'combined') {
    // Dual wavelength
    return {
      base: '#4a4e61',
      highlight: '#9ea3bd',
      shadow: '#222533',
      specular: '#d3d7ef',
      glow: 'rgba(168, 85, 247, 0.20)',
      ambient: '#323647'
    };
  } else {
    // Clean reference / standard white lighting
    return {
      base: '#4b5563',
      highlight: '#9ca3af',
      shadow: '#1f2937',
      specular: '#e5e7eb',
      glow: 'transparent',
      ambient: '#374151'
    };
  }
}

/**
 * Draws the matte sample tray platform inside the optical enclosure
 */
function drawSamplePlatform(ctx, width, height, lighting) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (lighting === 'uv') {
    bgGrad.addColorStop(0, '#0a0b16');
    bgGrad.addColorStop(0.5, '#0f1124');
    bgGrad.addColorStop(1, '#090a14');
  } else if (lighting === 'ir') {
    bgGrad.addColorStop(0, '#101114');
    bgGrad.addColorStop(0.5, '#17191d');
    bgGrad.addColorStop(1, '#0e0f12');
  } else {
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.5, '#111722');
    bgGrad.addColorStop(1, '#0a0d14');
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle instrument fixture / tray recessed bed
  const padX = width * 0.05;
  const padY = height * 0.12;
  const trayW = width * 0.90;
  const trayH = height * 0.76;

  ctx.strokeStyle = lighting === 'uv' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(padX, padY, trayW, trayH);

  // Alignment millimeter markings along tray border
  ctx.fillStyle = lighting === 'uv' ? 'rgba(165, 180, 252, 0.35)' : 'rgba(148, 163, 184, 0.35)';
  ctx.font = '9px monospace';
  for (let x = padX + 20; x < padX + trayW - 10; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, padY);
    ctx.lineTo(x, padY + 4);
    ctx.moveTo(x, padY + trayH - 4);
    ctx.lineTo(x, padY + trayH);
    ctx.stroke();
  }
}

/**
 * Forceps Drawing Routine
 */
function drawForceps(ctx, width, height, colors, lighting) {
  const cy = height * 0.50;
  const xStart = width * 0.10;
  const xEnd = width * 0.90;
  const totalLen = xEnd - xStart;

  // Shadow under instrument
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;

  // Upper Tine
  ctx.beginPath();
  ctx.moveTo(xEnd, cy - 12);
  ctx.bezierCurveTo(xEnd - totalLen * 0.25, cy - 16, xStart + totalLen * 0.35, cy - 24, xStart + 22, cy - 4);
  ctx.lineTo(xStart, cy - 1); // fine tip
  ctx.lineTo(xStart + 22, cy - 2);
  ctx.bezierCurveTo(xStart + totalLen * 0.35, cy - 10, xEnd - totalLen * 0.25, cy - 6, xEnd, cy - 3);
  ctx.closePath();

  const tineGrad = ctx.createLinearGradient(0, cy - 25, 0, cy + 25);
  tineGrad.addColorStop(0, colors.highlight);
  tineGrad.addColorStop(0.35, colors.specular);
  tineGrad.addColorStop(0.65, colors.base);
  tineGrad.addColorStop(1, colors.shadow);
  ctx.fillStyle = tineGrad;
  ctx.fill();

  // Lower Tine
  ctx.beginPath();
  ctx.moveTo(xEnd, cy + 12);
  ctx.bezierCurveTo(xEnd - totalLen * 0.25, cy + 16, xStart + totalLen * 0.35, cy + 24, xStart + 22, cy + 4);
  ctx.lineTo(xStart, cy + 1); // fine tip
  ctx.lineTo(xStart + 22, cy + 2);
  ctx.bezierCurveTo(xStart + totalLen * 0.35, cy + 10, xEnd - totalLen * 0.25, cy + 6, xEnd, cy + 3);
  ctx.closePath();
  ctx.fillStyle = tineGrad;
  ctx.fill();

  // Spring Hinge Joint at the rear
  ctx.beginPath();
  ctx.arc(xEnd - 4, cy, 14, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(xEnd - 16, cy + 11);
  ctx.lineTo(xEnd - 16, cy - 11);
  ctx.closePath();
  ctx.fillStyle = colors.base;
  ctx.fill();
  ctx.restore();

  // Serrated Ribbed Thumb Grip Plates
  const gripStartX = xStart + totalLen * 0.42;
  const gripEndX = xStart + totalLen * 0.68;
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 1.5;
  for (let gx = gripStartX; gx < gripEndX; gx += 5) {
    // Upper tine serration
    ctx.beginPath();
    ctx.moveTo(gx, cy - 18);
    ctx.lineTo(gx, cy - 8);
    ctx.stroke();

    // Lower tine serration
    ctx.beginPath();
    ctx.moveTo(gx, cy + 8);
    ctx.lineTo(gx, cy + 18);
    ctx.stroke();
  }

  // Micro-teeth at Tip
  ctx.fillStyle = colors.specular;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(xStart + 4 + i * 4, cy - 3, 2, 2);
    ctx.fillRect(xStart + 4 + i * 4, cy + 1, 2, 2);
  }

  // Beveled Edge Highlights
  ctx.strokeStyle = colors.specular;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(xEnd - 10, cy - 12);
  ctx.bezierCurveTo(xEnd - totalLen * 0.25, cy - 15, xStart + totalLen * 0.35, cy - 22, xStart + 24, cy - 4);
  ctx.stroke();
}

/**
 * Surgical Scissors Drawing Routine
 */
function drawScissors(ctx, width, height, colors, lighting) {
  const cy = height * 0.50;
  const xStart = width * 0.12;
  const xEnd = width * 0.88;
  const totalLen = xEnd - xStart;
  const pivotX = xStart + totalLen * 0.32;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;

  // Blade 1 (Upper blade extending from lower shank through pivot)
  ctx.beginPath();
  ctx.moveTo(pivotX, cy);
  ctx.bezierCurveTo(pivotX - 30, cy - 15, xStart + 30, cy - 28, xStart, cy - 24); // blade tip
  ctx.bezierCurveTo(xStart + 25, cy - 18, pivotX - 20, cy - 6, pivotX, cy);
  ctx.closePath();

  const bladeGrad = ctx.createLinearGradient(xStart, cy - 30, pivotX, cy);
  bladeGrad.addColorStop(0, colors.specular);
  bladeGrad.addColorStop(0.5, colors.highlight);
  bladeGrad.addColorStop(1, colors.base);
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Blade 2 (Lower cutting blade)
  ctx.beginPath();
  ctx.moveTo(pivotX, cy);
  ctx.bezierCurveTo(pivotX - 30, cy + 12, xStart + 30, cy + 22, xStart + 5, cy + 18);
  ctx.bezierCurveTo(xStart + 25, cy + 14, pivotX - 20, cy + 4, pivotX, cy);
  ctx.closePath();
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Shank & Finger Ring 1 (Upper)
  ctx.beginPath();
  ctx.moveTo(pivotX, cy - 4);
  ctx.bezierCurveTo(pivotX + 50, cy - 12, xEnd - 60, cy - 32, xEnd - 32, cy - 32);
  ctx.arc(xEnd - 18, cy - 32, 18, Math.PI, -Math.PI, false);
  ctx.bezierCurveTo(xEnd - 55, cy - 18, pivotX + 45, cy - 2, pivotX, cy - 2);
  ctx.closePath();
  ctx.fillStyle = colors.base;
  ctx.fill();

  // Shank & Finger Ring 2 (Lower)
  ctx.beginPath();
  ctx.moveTo(pivotX, cy + 4);
  ctx.bezierCurveTo(pivotX + 50, cy + 12, xEnd - 60, cy + 32, xEnd - 32, cy + 32);
  ctx.arc(xEnd - 18, cy + 32, 18, Math.PI, -Math.PI, true);
  ctx.bezierCurveTo(xEnd - 55, cy + 18, pivotX + 45, cy + 2, pivotX, cy + 2);
  ctx.closePath();
  ctx.fillStyle = colors.base;
  ctx.fill();

  ctx.restore();

  // Cutouts for finger rings
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(xEnd - 18, cy - 32, 11, 0, Math.PI * 2);
  ctx.arc(xEnd - 18, cy + 32, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Redraw rings inner borders
  ctx.strokeStyle = colors.specular;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(xEnd - 18, cy - 32, 11, 0, Math.PI * 2);
  ctx.arc(xEnd - 18, cy + 32, 11, 0, Math.PI * 2);
  ctx.stroke();

  // Pivot Screw (Box Lock / Joint)
  ctx.beginPath();
  ctx.arc(pivotX, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = colors.specular;
  ctx.fill();
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Screw slot
  ctx.beginPath();
  ctx.moveTo(pivotX - 4, cy - 2);
  ctx.lineTo(pivotX + 4, cy + 2);
  ctx.stroke();

  // Cutting edge highlight
  ctx.strokeStyle = colors.specular;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xStart, cy - 24);
  ctx.bezierCurveTo(xStart + 35, cy - 20, pivotX - 25, cy - 6, pivotX, cy);
  ctx.stroke();
}

/**
 * Hemostat / Clamping Forceps Routine
 */
function drawHemostat(ctx, width, height, colors, lighting) {
  const cy = height * 0.50;
  const xStart = width * 0.11;
  const xEnd = width * 0.89;
  const totalLen = xEnd - xStart;
  const boxLockX = xStart + totalLen * 0.35;
  const ratchetX = xEnd - totalLen * 0.22;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;

  // Curved Jaws (Left of box lock)
  ctx.beginPath();
  ctx.moveTo(boxLockX, cy - 5);
  ctx.bezierCurveTo(boxLockX - 40, cy - 10, xStart + 25, cy - 32, xStart, cy - 28);
  ctx.lineTo(xStart + 4, cy - 20);
  ctx.bezierCurveTo(xStart + 28, cy - 18, boxLockX - 30, cy - 2, boxLockX, cy - 1);
  ctx.closePath();

  const jawGrad = ctx.createLinearGradient(xStart, cy - 30, boxLockX, cy);
  jawGrad.addColorStop(0, colors.highlight);
  jawGrad.addColorStop(0.5, colors.specular);
  jawGrad.addColorStop(1, colors.base);
  ctx.fillStyle = jawGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(boxLockX, cy + 1);
  ctx.bezierCurveTo(boxLockX - 30, cy + 2, xStart + 28, cy - 10, xStart + 4, cy - 12);
  ctx.lineTo(xStart + 6, cy - 5);
  ctx.bezierCurveTo(xStart + 26, cy - 2, boxLockX - 25, cy + 6, boxLockX, cy + 5);
  ctx.closePath();
  ctx.fillStyle = jawGrad;
  ctx.fill();

  // Shanks & Finger Rings (Right of box lock)
  ctx.beginPath();
  ctx.moveTo(boxLockX, cy - 6);
  ctx.bezierCurveTo(boxLockX + 60, cy - 18, xEnd - 60, cy - 36, xEnd - 28, cy - 36);
  ctx.arc(xEnd - 18, cy - 36, 17, Math.PI, -Math.PI, false);
  ctx.bezierCurveTo(xEnd - 50, cy - 22, boxLockX + 50, cy - 2, boxLockX, cy - 2);
  ctx.closePath();
  ctx.fillStyle = colors.base;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(boxLockX, cy + 2);
  ctx.bezierCurveTo(boxLockX + 50, cy + 22, xEnd - 50, cy + 36, xEnd - 28, cy + 36);
  ctx.arc(xEnd - 18, cy + 36, 17, Math.PI, -Math.PI, true);
  ctx.bezierCurveTo(xEnd - 60, cy + 18, boxLockX + 60, cy + 6, boxLockX, cy + 6);
  ctx.closePath();
  ctx.fillStyle = colors.base;
  ctx.fill();

  ctx.restore();

  // Cutouts for finger rings
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(xEnd - 18, cy - 36, 10, 0, Math.PI * 2);
  ctx.arc(xEnd - 18, cy + 36, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Transverse Serrations on Jaws
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 1.2;
  for (let sx = xStart + 12; sx < boxLockX - 10; sx += 4.5) {
    ctx.beginPath();
    ctx.moveTo(sx, cy - 24 + (sx - xStart) * 0.3);
    ctx.lineTo(sx + 1, cy - 14 + (sx - xStart) * 0.3);
    ctx.stroke();
  }

  // Box Lock Hinged Joint housing
  ctx.beginPath();
  ctx.ellipse(boxLockX, cy, 10, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = colors.highlight;
  ctx.fill();
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ratchet Locking Clasps
  ctx.fillStyle = colors.specular;
  for (let r = 0; r < 3; r++) {
    ctx.fillRect(ratchetX + r * 5, cy - 7, 3, 5);
    ctx.fillRect(ratchetX + r * 5, cy + 2, 3, 5);
  }
}

/**
 * Stainless Steel Test Coupon
 */
function drawCoupon(ctx, width, height, colors, lighting) {
  const cx = width * 0.50;
  const cy = height * 0.50;
  const cWidth = width * 0.72;
  const cHeight = height * 0.40;
  const x = cx - cWidth / 2;
  const y = cy - cHeight / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;

  // Coupon Body with rounded corners
  ctx.beginPath();
  roundRect(ctx, x, y, cWidth, cHeight, 8);
  const couponGrad = ctx.createLinearGradient(x, y, x + cWidth, y + cHeight);
  couponGrad.addColorStop(0, colors.highlight);
  couponGrad.addColorStop(0.3, colors.specular);
  couponGrad.addColorStop(0.7, colors.base);
  couponGrad.addColorStop(1, colors.shadow);
  ctx.fillStyle = couponGrad;
  ctx.fill();
  ctx.restore();

  // Electropolished Beveled Rim
  ctx.strokeStyle = colors.specular;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRect(ctx, x + 2, y + 2, cWidth - 4, cHeight - 4, 6);
  ctx.stroke();

  // Precision 1 mm Metric Laser Calibration Grid
  ctx.strokeStyle = lighting === 'uv' ? 'rgba(165, 180, 252, 0.4)' : 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 0.6;
  const gridStep = 18;
  for (let gx = x + 20; gx < x + cWidth - 20; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, y + 10);
    ctx.lineTo(gx, y + cHeight - 10);
    ctx.stroke();
  }
  for (let gy = y + 15; gy < y + cHeight - 15; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x + 15, gy);
    ctx.lineTo(x + cWidth - 15, gy);
    ctx.stroke();
  }

  // Laser Etched Identification Specs
  ctx.fillStyle = lighting === 'uv' ? '#c7d2fe' : '#e2e8f0';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('REF: ASTM-F3127 / AISI 316L ELECTROPOLISHED', x + 20, y + 22);
  ctx.font = '9px monospace';
  ctx.fillText('BLOODTRACE OPTICAL VALIDATION COUPON — GRID 1.0mm', x + 20, y + cHeight - 16);

  // Calibrated target crosshairs
  drawCrosshair(ctx, x + cWidth * 0.35, cy, 14, colors.specular);
  drawCrosshair(ctx, x + cWidth * 0.65, cy, 14, colors.specular);
}

function drawCrosshair(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.moveTo(cx - size - 4, cy);
  ctx.lineTo(cx + size + 4, cy);
  ctx.moveTo(cx, cy - size - 4);
  ctx.lineTo(cx, cy + size + 4);
  ctx.stroke();
  ctx.restore();
}

function drawCriticalAreaMarkers(ctx, instrumentId, width, height) {
  const def = INSTRUMENT_DEFINITIONS[instrumentId];
  if (!def || !def.criticalAreas) return;

  ctx.save();
  def.criticalAreas.forEach((area) => {
    const x = area.xRatio * width;
    const y = area.yRatio * height;

    // Glowing target ring
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, area.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small center dot
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Text tag
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '9px sans-serif';
    ctx.fillText(area.name, x - 20, y - area.radius - 4);
  });
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
