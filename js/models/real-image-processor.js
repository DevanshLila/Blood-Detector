/**
 * BloodTrace Vision — Real Image Processing & Multi-Spectral Simulation Engine
 * Processes actual surgical instrument photographs (Clean, Contaminated, Scalpel).
 * Performs colorimetric segmentation, simulated 365nm UV fluorescence,
 * simulated 850nm NIR reflectance, pixel-aligned contour overlays, and confidence scoring.
 * 
 * DISCLAIMER: Simulated image-analysis data only. Results are not clinically validated
 * and cannot establish blood identity, instrument cleanliness, or sterility.
 */

export const REAL_IMAGE_SAMPLES = {
  'clean_surface': {
    id: 'clean_surface',
    name: 'Clean Surface (Forceps, Scissors, Scalpel)',
    path: 'assets/images/clean_surface.jpg',
    category: 'Clean Reference Surface',
    description: 'Clean, passivated surgical stainless steel instruments on sterile inspection tray.',
    expectedStatus: 'No candidate region detected'
  },
  'contaminated_surface': {
    id: 'contaminated_surface',
    name: 'Blood-Contaminated Surface (Surgical Clamp)',
    path: 'assets/images/contaminated_surface.jpg',
    category: 'Biological Challenge Specimen',
    description: 'Used stainless steel hemostatic clamp with dried blood residue on jaws and shank.',
    expectedStatus: 'Possible residue detected'
  },
  'scalpel_blade': {
    id: 'scalpel_blade',
    name: 'Scalpel Blade Contamination (Research Specimen)',
    path: 'assets/images/scalpel_blade.jpg',
    category: 'Controlled In-Vitro Challenge',
    description: 'Surgical scalpel blade with localized blood/protein residue deposits.',
    expectedStatus: 'Possible residue detected'
  },
  'contaminated_gauze': {
    id: 'contaminated_gauze',
    name: 'Contaminated Instruments on Gauze',
    path: 'assets/images/contaminated_gauze.jpg',
    category: 'Multi-Tool Specimen',
    description: 'Micro-forceps, hemostat, and scalpel with blood on sterile cotton gauze.',
    expectedStatus: 'Possible residue detected'
  },
  'surgical_set_blood': {
    id: 'surgical_set_blood',
    name: 'Surgical Tools Set with Blood Marks',
    path: 'assets/images/surgical_set_blood.jpg',
    category: 'OR Procedure Specimen',
    description: 'Surgical blade, forceps, and tweezers with dried blood traces.',
    expectedStatus: 'Possible residue detected'
  },
  'compare_both': {
    id: 'compare_both',
    name: 'Compare Both (Clean Reference vs. Contaminated)',
    path: 'assets/images/clean_surface.jpg',
    secondaryPath: 'assets/images/contaminated_surface.jpg',
    category: 'Comparative Diagnostic Verification',
    description: 'Direct dual-sample side-by-side screening comparison between clean passivated steel and blood-contaminated clamp.',
    expectedStatus: 'Differential analysis active'
  }
};

export class RealImageProcessor {
  constructor() {
    this.imageCache = new Map();
  }

  /**
   * Asynchronously loads an image and caches it
   * @param {string} url 
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(url) {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = (err) => reject(new Error(`Failed to load image at ${url}: ${err}`));
      img.src = url;
    });
  }

  /**
   * Full analysis pipeline for an input image
   * @param {HTMLImageElement} img 
   * @param {Object} options 
   */
  analyzeImage(img, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 35;
    const minRegionSize = options.minRegionSize !== undefined ? options.minRegionSize : 25;
    const uvIntensity = options.uvIntensity !== undefined ? options.uvIntensity : 1.0;
    const irIntensity = options.irIntensity !== undefined ? options.irIntensity : 1.0;
    const overlayOpacity = options.overlayOpacity !== undefined ? options.overlayOpacity : 0.75;
    const uvMode = options.uvMode || 'uv_style'; // 'uv_style', 'intensity_map', 'candidate_regions'

    // Compute display dimensions preserving native aspect ratio (max dimension 900px for speed)
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const maxDim = 900;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    // Canvas 1: Visible Image
    const visibleCanvas = document.createElement('canvas');
    visibleCanvas.width = w;
    visibleCanvas.height = h;
    const vCtx = visibleCanvas.getContext('2d');
    vCtx.drawImage(img, 0, 0, w, h);
    const srcImgData = vCtx.getImageData(0, 0, w, h);
    const data = srcImgData.data;

    // Buffers for pixel scores
    const mask = new Uint8Array(w * h);
    const scoreMap = new Float32Array(w * h);
    let instrumentSurfacePixels = 0;
    let candidatePixels = 0;

    // Colorimetric & optical density analysis
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Determine if pixel is part of the metallic instrument surface
      // Passivated stainless steel is relatively neutral and has moderate-to-high reflectance
      const colorDiff = Math.abs(r - g) + Math.abs(g - b);
      const isMetalSurface = (lum > 25 && lum < 245);
      if (isMetalSurface) {
        instrumentSurfacePixels++;
      }

      // Excess red chromaticity (Heme optical signature)
      const excessRed = Math.max(0, r - (g + b) / 2.0);
      
      // Optical darkness / coagulum density
      const darkness = Math.max(0, 160 - lum);

      // Optical Blood Score (0 to 100)
      let score = 0;
      if (excessRed > 12) {
        score = (excessRed * 1.4) + (darkness * 0.25);
      } else if (excessRed > 6 && darkness > 50) {
        score = (excessRed * 1.0) + (darkness * 0.35);
      }

      scoreMap[p] = Math.min(100, score);

      // Apply dynamic sensitivity threshold
      // Nominal threshold: 35. Lower threshold -> detects fainter traces.
      if (score >= threshold && excessRed > 15) {
        mask[p] = 1;
        candidatePixels++;
      } else {
        mask[p] = 0;
      }
    }

    // Connected Component Extraction
    const candidateRegions = this.extractConnectedRegions(mask, scoreMap, data, w, h, minRegionSize);

    // Compute surface area percentage
    const surfaceBase = instrumentSurfacePixels > 0 ? instrumentSurfacePixels : (w * h);
    const candidateAreaPct = Number(((candidatePixels / surfaceBase) * 100).toFixed(2));

    // Determine Result Status
    let status = 'No candidate region detected';
    let statusClass = 'status-clean';
    if (candidateRegions.length > 0) {
      status = 'Possible residue detected';
      statusClass = 'status-positive';
    }

    // Generate Canvases
    const uvCanvas = this.generateUvCanvas(vCtx, data, scoreMap, mask, w, h, uvIntensity, uvMode);
    const irCanvas = this.generateIrCanvas(vCtx, data, scoreMap, mask, w, h, irIntensity);
    const mapCanvas = this.generateContaminationMapCanvas(vCtx, data, mask, scoreMap, candidateRegions, w, h, overlayOpacity);

    return {
      width: w,
      height: h,
      visibleCanvas,
      uvCanvas,
      irCanvas,
      mapCanvas,
      candidateRegions,
      candidateRegionsCount: candidateRegions.length,
      totalCandidatePixels: candidatePixels,
      instrumentSurfacePixels: surfaceBase,
      candidateSurfaceRatioPct: candidateAreaPct,
      status,
      statusClass,
      threshold,
      minRegionSize,
      disclaimer: 'BloodTrace Vision is an experimental image-analysis simulation. UV and IR/NIR views may be simulated. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.'
    };
  }

  /**
   * Groups connected candidate pixels into distinct regions with bounding boxes and features
   */
  extractConnectedRegions(mask, scoreMap, data, w, h, minSize) {
    const visited = new Uint8Array(w * h);
    const regions = [];
    let regionIdCounter = 1;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = y * w + x;
        if (mask[idx] === 1 && visited[idx] === 0) {
          // BFS Flood Fill
          const queue = [idx];
          visited[idx] = 1;
          const pixelIndices = [];
          let minX = x, maxX = x, minY = y, maxY = y;
          let sumExcessRed = 0;
          let sumScore = 0;

          let qHead = 0;
          while (qHead < queue.length) {
            const curr = queue[qHead++];
            pixelIndices.push(curr);
            const cx = curr % w;
            const cy = Math.floor(curr / w);

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const p4 = curr * 4;
            const r = data[p4];
            const g = data[p4 + 1];
            const b = data[p4 + 2];
            sumExcessRed += Math.max(0, r - (g + b) / 2.0);
            sumScore += scoreMap[curr];

            // 4-neighborhood
            const neighbors = [
              cy > 0 ? curr - w : -1,
              cy < h - 1 ? curr + w : -1,
              cx > 0 ? curr - 1 : -1,
              cx < w - 1 ? curr + 1 : -1
            ];

            for (const n of neighbors) {
              if (n >= 0 && mask[n] === 1 && visited[n] === 0) {
                visited[n] = 1;
                queue.push(n);
              }
            }
          }

          if (pixelIndices.length >= minSize) {
            const areaPx = pixelIndices.length;
            const regionWidth = maxX - minX + 1;
            const regionHeight = maxY - minY + 1;
            const avgExcessRed = sumExcessRed / areaPx;
            const avgScore = sumScore / areaPx;
            const aspectRatio = Number((Math.max(regionWidth, regionHeight) / Math.max(1, Math.min(regionWidth, regionHeight))).toFixed(2));
            const centroidX = Math.round((minX + maxX) / 2);
            const centroidY = Math.round((minY + maxY) / 2);

            // Calculate confidence score (bounded 45% - 94% based on optical density and chromaticity)
            const confidence = Math.min(94, Math.max(50, Math.round(avgScore * 0.7 + avgExcessRed * 0.4)));

            // UV and NIR simulated scores
            const uvScore = Math.min(100, Math.round(avgExcessRed * 0.6 + 25));
            const irAbsorptionScore = Math.min(100, Math.round(avgScore * 0.8 + 15));

            regions.push({
              id: `ROI-${String(regionIdCounter++).padStart(2, '0')}`,
              minX, maxX, minY, maxY,
              width: regionWidth,
              height: regionHeight,
              centroidX, centroidY,
              areaPx,
              aspectRatio,
              confidence,
              uvScore,
              irAbsorptionScore,
              avgExcessRed: Math.round(avgExcessRed),
              classification: 'Possible residue',
              shape: aspectRatio > 3.0 ? 'Linear stain trail' : 'Irregular organic patch',
              explanation: `Flagged due to pronounced optical absorption (NIR Score: ${irAbsorptionScore}/100) and elevated red chromaticity (+${Math.round(avgExcessRed)} a.u.) consistent with dried biological coagulum.`
            });
          }
        }
      }
    }

    return regions;
  }

  /**
   * Synthesizes 365 nm UV-A fluorescence canvas matching the dashboard reference screenshot
   */
  generateUvCanvas(vCtx, srcData, scoreMap, mask, w, h, uvIntensity, uvMode) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    for (let i = 0, p = 0; i < srcData.length; i += 4, p++) {
      const r = srcData[i];
      const g = srcData[i + 1];
      const b = srcData[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
      const score = scoreMap[p];
      const isCand = mask[p] === 1;

      if (uvMode === 'intensity_map') {
        // High-contrast false-color intensity
        const intensity = Math.min(1.0, (score / 70.0) * uvIntensity);
        d[i] = Math.round(180 * intensity);
        d[i + 1] = Math.round(80 * intensity);
        d[i + 2] = Math.round(255 * intensity);
        d[i + 3] = 255;
      } else if (uvMode === 'candidate_regions') {
        // Pure candidate mask on black
        if (isCand) {
          d[i] = 192; d[i + 1] = 132; d[i + 2] = 252; d[i + 3] = 255;
        } else {
          d[i] = 10; d[i + 1] = 6; d[i + 2] = 22; d[i + 3] = 255;
        }
      } else {
        // Standard Simulated UV-Style (Deep indigo background, metallic sheen, luminous fluorescence)
        if (isCand) {
          // Luminous organic emission (White-violet glowing contrast matching poster Panel 2)
          const glow = Math.min(1.0, (score / 60.0) * uvIntensity);
          d[i] = Math.min(255, Math.round(200 * glow + 40));
          d[i + 1] = Math.min(255, Math.round(170 * glow + 20));
          d[i + 2] = Math.min(255, Math.round(255 * glow + 50));
          d[i + 3] = 255;
        } else {
          // Dark metallic body with subtle violet autofluorescence scatter
          const bgViolet = lum * 45;
          d[i] = Math.round(bgViolet * 0.45);
          d[i + 1] = Math.round(bgViolet * 0.25);
          d[i + 2] = Math.round(bgViolet * 0.85 + 15);
          d[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Synthesizes 850 nm NIR reflectance grayscale canvas matching poster Panel 3
   */
  generateIrCanvas(vCtx, srcData, scoreMap, mask, w, h, irIntensity) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    for (let i = 0, p = 0; i < srcData.length; i += 4, p++) {
      const r = srcData[i];
      const g = srcData[i + 1];
      const b = srcData[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isCand = mask[p] === 1;

      let nirVal = lum;
      if (isCand) {
        // Strong 850nm Heme NIR absorption drop (turns dark/black silhouette)
        nirVal = Math.max(15, lum * 0.25 / irIntensity);
      } else {
        // High specular stainless steel reflection
        nirVal = Math.min(245, (lum * 1.15) * irIntensity);
      }

      d[i] = Math.round(nirVal);
      d[i + 1] = Math.round(nirVal);
      d[i + 2] = Math.round(nirVal);
      d[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Synthesizes Contamination Map matching poster Panel 4 (Heatmap, contours, High-Low color bar)
   */
  generateContaminationMapCanvas(vCtx, srcData, mask, scoreMap, regions, w, h, opacity) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Pitch black background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);

    // Subtle ghost silhouette of the instrument in neutral grey
    const ghostData = ctx.getImageData(0, 0, w, h);
    const gd = ghostData.data;
    for (let i = 0, p = 0; i < srcData.length; i += 4, p++) {
      const r = srcData[i];
      const g = srcData[i + 1];
      const b = srcData[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 30) {
        // Soft metallic contour in dark grey
        gd[i] = Math.round(lum * 0.15);
        gd[i + 1] = Math.round(lum * 0.18);
        gd[i + 2] = Math.round(lum * 0.22);
        gd[i + 3] = 255;
      }
    }
    ctx.putImageData(ghostData, 0, 0);

    // Draw Red Contamination Heatmap on top
    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = w;
    heatCanvas.height = h;
    const heatCtx = heatCanvas.getContext('2d');
    const heatData = heatCtx.createImageData(w, h);
    const hd = heatData.data;

    for (let i = 0, p = 0; i < srcData.length; i += 4, p++) {
      if (mask[p] === 1) {
        const scoreNorm = Math.min(1.0, scoreMap[p] / 80.0);
        // Gradient: Low (Dark Red) -> Mid (Bright Red) -> High (Yellow/White hot)
        if (scoreNorm > 0.8) {
          hd[i] = 255;
          hd[i + 1] = Math.round(200 * (scoreNorm - 0.8) * 5);
          hd[i + 2] = 40;
          hd[i + 3] = Math.round(255 * opacity);
        } else {
          hd[i] = Math.round(220 + 35 * scoreNorm);
          hd[i + 1] = Math.round(20 * scoreNorm);
          hd[i + 2] = 20;
          hd[i + 3] = Math.round(240 * opacity);
        }
      }
    }
    heatCtx.putImageData(heatData, 0, 0);
    ctx.drawImage(heatCanvas, 0, 0);

    // Render ROI Bounding Boxes and labels
    regions.forEach(reg => {
      // Red/Cyan ROI bounding box
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(reg.minX - 3, reg.minY - 3, reg.width + 6, reg.height + 6);

      // ROI Label Pill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.font = 'bold 10px monospace';
      const labelText = `${reg.id}: ${reg.confidence}%`;
      const textW = ctx.measureText(labelText).width;
      ctx.fillRect(reg.minX - 3, Math.max(0, reg.minY - 16), textW + 8, 14);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, reg.minX + 1, Math.max(10, reg.minY - 5));
    });

    return canvas;
  }

  /**
   * Dual-Sample Comparison (Clean Reference vs Contaminated Specimen)
   */
  compareImages(cleanImg, contamImg, options = {}) {
    const cleanAnalysis = this.analyzeImage(cleanImg, options);
    const contamAnalysis = this.analyzeImage(contamImg, options);

    // Create difference canvas
    const w = Math.min(cleanAnalysis.width, contamAnalysis.width);
    const h = Math.min(cleanAnalysis.height, contamAnalysis.height);
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w;
    diffCanvas.height = h;
    const dCtx = diffCanvas.getContext('2d');

    const dImgData = dCtx.createImageData(w, h);
    const dd = dImgData.data;
    const cCtx = contamAnalysis.visibleCanvas.getContext('2d');
    const cData = cCtx.getImageData(0, 0, w, h).data;
    const rCtx = cleanAnalysis.visibleCanvas.getContext('2d');
    const rData = rCtx.getImageData(0, 0, w, h).data;

    let sumAbsDiff = 0;
    for (let i = 0; i < dd.length; i += 4) {
      const cr = cData[i], cg = cData[i + 1], cb = cData[i + 2];
      const rr = rData[i], rg = rData[i + 1], rb = rData[i + 2];
      const cExcessRed = Math.max(0, cr - (cg + cb) / 2);
      const rExcessRed = Math.max(0, rr - (rg + rb) / 2);
      const deltaRed = Math.max(0, cExcessRed - rExcessRed);

      const cLum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
      const rLum = 0.299 * rr + 0.587 * rg + 0.114 * rb;
      const deltaLum = Math.abs(cLum - rLum);

      const diffVal = Math.min(255, Math.round(deltaRed * 3.5 + deltaLum * 0.4));
      sumAbsDiff += diffVal;

      if (deltaRed > 12) {
        // High differential blood residue
        dd[i] = 239;     // Red
        dd[i + 1] = 68;
        dd[i + 2] = 68;
        dd[i + 3] = 240;
      } else {
        // Low difference (metallic substrate matching)
        dd[i] = Math.round(diffVal * 0.3);
        dd[i + 1] = Math.round(diffVal * 0.4);
        dd[i + 2] = Math.round(diffVal * 0.6);
        dd[i + 3] = diffVal > 15 ? 180 : 40;
      }
    }
    dCtx.putImageData(dImgData, 0, 0);

    return {
      clean: cleanAnalysis,
      contaminated: contamAnalysis,
      diffCanvas,
      deltaAreaPct: Number((contamAnalysis.candidateSurfaceRatioPct - cleanAnalysis.candidateSurfaceRatioPct).toFixed(2)),
      deltaCandidateCount: contamAnalysis.candidateRegionsCount - cleanAnalysis.candidateRegionsCount,
      summary: {
        cleanStatus: cleanAnalysis.status,
        contamStatus: contamAnalysis.status,
        screeningVerdict: contamAnalysis.candidateRegionsCount > 0 ? 'FAIL — Possible residue detected' : 'PASS — Clean baseline confirmed'
      }
    };
  }

  /**
   * Helper to draw a canvas onto a target canvas preserving aspect ratio
   */
  drawScaledToCanvas(sourceCanvas, targetCanvas, clear = true) {
    if (!sourceCanvas || !targetCanvas) return;
    const tCtx = targetCanvas.getContext('2d');
    const tw = targetCanvas.width;
    const th = targetCanvas.height;
    if (clear) tCtx.clearRect(0, 0, tw, th);

    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    const scale = Math.min(tw / sw, th / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (tw - dw) / 2;
    const dy = (th - dh) / 2;

    tCtx.drawImage(sourceCanvas, dx, dy, dw, dh);
  }
}
