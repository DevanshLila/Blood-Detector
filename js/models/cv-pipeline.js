/**
 * BloodTrace — Computer Vision & Diagnostic Classification Pipeline
 * Simulates Python/OpenCV image processing workflow:
 * Reference Frame -> Multi-Spectral Acquisition -> Background Subtraction ->
 * Normalized Difference Index -> Morphological Filtering -> Contour Extraction
 */

import { SAMPLE_CONDITIONS } from './sensor-sim.js';

export class ComputerVisionPipeline {
  constructor() {
    this.defaultThreshold = 35; // 0-100 sensitivity scale
    this.minRegionAreaPx = 25;  // Noise filtering threshold (removes isolated camera shot noise)
  }

  /**
   * Executes the image processing analysis on the captured sensor and image data
   * @param {Object} scanData - { referenceData, uvData, irData, spots, conditionId, threshold }
   * @returns {Object} analysisResult
   */
  processScan(scanData) {
    const {
      spots = [],
      conditionId = 'clean',
      threshold = this.defaultThreshold,
      uvReading = {},
      irReading = {},
      instrumentId = 'forceps',
      canvasWidth = 800,
      canvasHeight = 400
    } = scanData;

    const stages = [];
    const startTime = performance.now();

    // Stage 1: Frame Ingestion & Spatial Registration
    stages.push({
      stage: 'INGESTION',
      name: 'Frame Ingestion & Spatial Registration',
      durationMs: 14,
      status: 'Aligned',
      details: 'Dual-wavelength 1920x1080 USB camera frames registered with sub-pixel affine transformation.'
    });

    // Stage 2: Background Correction & Dark-Current Subtraction
    stages.push({
      stage: 'CORRECTION',
      name: 'Background & Dark-Current Subtraction',
      durationMs: 22,
      status: 'Corrected',
      details: 'Offset subtraction applied using ambient photodiode dark-frame baseline.'
    });

    // Stage 3: Normalized Spectral Contrast Ratio (NDI)
    // NDI = (I_ref - I_ir) / (I_ref + I_ir) + w_uv * (I_uv - I_ref)
    stages.push({
      stage: 'SPECTRAL_DIFF',
      name: 'Normalized Dual-Wavelength Difference Index (NDI)',
      durationMs: 38,
      status: 'Computed',
      details: 'Evaluated NIR absorption contrast (850nm) and UV autofluorescence contrast (365nm).'
    });

    // Stage 4: Dynamic Thresholding & Morphological Noise Filtering
    stages.push({
      stage: 'THRESHOLDING',
      name: 'Adaptive Thresholding & Morphological Filter',
      durationMs: 28,
      status: `Threshold=${threshold}`,
      details: `Applied kernel 3x3 morphological opening to suppress random photon shot noise.`
    });

    // Physical baseline optical reference constants for passivated surgical steel
    const baselineRefUV = 19;  // Baseline autofluorescence (a.u.)
    const baselineRefIR = 760; // Baseline specular NIR reflectance (a.u.)

    // Sensor channel inputs (with fallback to condition optical physics if readings not supplied)
    const condDef = SAMPLE_CONDITIONS[conditionId] || SAMPLE_CONDITIONS.clean;
    const defaultUV = condDef ? condDef.baseUvEmission : baselineRefUV;
    const defaultIR = condDef ? condDef.baseIrReflectance : baselineRefIR;

    const measuredUV = typeof uvReading.uvIntensity === 'number' ? uvReading.uvIntensity : defaultUV;
    const measuredIR = typeof irReading.irIntensity === 'number' ? irReading.irIntensity : defaultIR;

    // Optical differentials from clean metallic baseline
    const deltaUV = Math.max(0, measuredUV - baselineRefUV); // Positive on organic fluorescence / detergent
    const deltaIR = Math.max(0, baselineRefIR - measuredIR); // Positive on NIR absorption / heme coagulum
    const ndi = (deltaIR - deltaUV * 0.15) / Math.max(1, (baselineRefIR + measuredIR)); // Normalized Difference Index

    // Compute Candidate Contours & ROIs based on optical signals
    const detectedRegions = [];
    let totalCandidateAreaPx = 0;
    const estInstrumentSurfacePx = Math.round(canvasWidth * canvasHeight * 0.28); // Approx visible steel area

    // Evaluate each physical spot or surface perturbation against threshold
    spots.forEach((spot, idx) => {
      const radiusPx = (spot.radiusRatio || 0.04) * Math.min(canvasWidth, canvasHeight);
      const spotAreaPx = Math.round(Math.PI * Math.pow(radiusPx, 2));

      // Calculate optical signature strength purely from sensor channel signals and spot geometry
      let opticalContrast = 0;
      let signatureType = 'unknown';

      if (deltaIR >= 75) {
        // High NIR absorption signal (characteristic of hemoglobin / biological coagulum)
        opticalContrast = (Math.min(95, 20 + deltaIR * 0.22)) * (spot.intensity || 1.0);
        signatureType = 'high_nir_absorption';
      } else if (deltaUV >= 75 && deltaIR < 45) {
        // High UV fluorescence with low NIR absorption (optical brightener / surfactant)
        opticalContrast = (Math.min(85, 15 + deltaUV * 0.20)) * (spot.intensity || 1.0);
        signatureType = 'high_uv_fluorescence';
      } else if (deltaIR >= 25 && deltaIR < 75) {
        // Moderate specular absorption / mechanical scatter (dense mineral residue or drying rings)
        opticalContrast = (20 + deltaIR * 0.45) * (spot.intensity || 1.0);
        signatureType = 'specular_glare';
      } else {
        // Minimal optical variation (thin mineral water marks or minor surface noise)
        opticalContrast = (14 + (deltaUV + deltaIR) * 0.35) * (spot.intensity || 1.0);
        signatureType = 'diffractive_scatter';
      }

      // Check against current threshold (threshold filtering)
      if (opticalContrast >= threshold && spotAreaPx >= this.minRegionAreaPx) {
        totalCandidateAreaPx += spotAreaPx;
        detectedRegions.push({
          id: `ROI-${idx + 1}`,
          xRatio: spot.xRatio,
          yRatio: spot.yRatio,
          xPx: Math.round(spot.xRatio * canvasWidth),
          yPx: Math.round(spot.yRatio * canvasHeight),
          radiusPx: Math.round(radiusPx),
          areaPx: spotAreaPx,
          contrastLevel: opticalContrast.toFixed(1),
          signatureType,
          label: 'Suspected Residue'
        });
      }
    });

    // Stage 5: Contour Vectorization
    stages.push({
      stage: 'CONTOURS',
      name: 'Contour Vectorization & Area Integration',
      durationMs: 18,
      status: `${detectedRegions.length} Regions`,
      details: `Generated ${detectedRegions.length} candidate boundary polygons.`
    });

    // Candidate Area Percentage
    const candidateSurfaceRatioPct = estInstrumentSurfacePx > 0 
      ? Number(((totalCandidateAreaPx / estInstrumentSurfacePx) * 100).toFixed(2))
      : 0;

    // Diagnostic Classification Logic
    // STRICT RULE: Label detected areas as "Suspected Residue" or "Possible Contamination", NEVER confirmed blood!
    // Decoupled from ground-truth conditionId: outcome depends strictly on simulated image and sensor signals.
    let screeningResult = 'No significant optical difference detected';
    let resultSeverity = 'safe'; // 'safe', 'warning', 'critical'
    let advisoryNote = '';

    if (detectedRegions.length === 0 || totalCandidateAreaPx === 0) {
      screeningResult = 'No significant optical difference detected';
      resultSeverity = 'safe';
      advisoryNote = 'Optical response across 365 nm and 850 nm channels remains within baseline tolerance. No anomalous absorption or fluorescence detected.';
    } else if (deltaIR >= 80) {
      // Substantial NIR absorption detected: consistent with hemoglobin optical density
      screeningResult = 'Possible residue detected';
      resultSeverity = 'critical';
      advisoryNote = 'Substantial 850 nm NIR absorption detected consistent with optical density of residual organic coagulum. Candidate residue localized. Non-destructive screening positive; chemical protein assay required prior to autoclave.';
    } else if (deltaUV >= 80 && deltaIR < 50) {
      // High 365nm fluorescence without proportional 850nm NIR absorption: surfactant / brightener confounder
      screeningResult = 'Ambiguous result — manual inspection required';
      resultSeverity = 'warning';
      advisoryNote = 'Elevated 365 nm autofluorescence observed with minimal 850 nm NIR absorption. Spectral signature is consistent with cleaning surfactant/detergent brightener residue rather than biological coagulum. Manual inspection and rinse recommended.';
    } else {
      // Moderate optical anomalies: specular scatter, surface score marks, or mineral ring drying deposits
      screeningResult = 'Ambiguous result — manual inspection required';
      resultSeverity = 'warning';
      advisoryNote = 'Mild optical perturbation detected above threshold. Localized specular glare or mineral ring suspected. Visual reinspection advised.';
    }

    const totalProcessingDurationMs = Math.round(performance.now() - startTime + 120);

    return {
      success: true,
      scanId: `BT-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      instrumentId,
      conditionId,
      groundTruthCondition: conditionId, // Preserved strictly as ground-truth metadata
      threshold,
      screeningResult,
      resultSeverity,
      advisoryNote,
      detectedRegions,
      candidateRegionsCount: detectedRegions.length,
      totalCandidateAreaPx,
      instrumentSurfaceAreaPx: estInstrumentSurfacePx,
      candidateSurfaceRatioPct,
      stages,
      totalProcessingDurationMs,
      telemetry: {
        uvIntensity: uvReading.uvIntensity || 0,
        irIntensity: irReading.irIntensity || 0,
        photodiodeADC: irReading.photodiodeADC || uvReading.photodiodeADC || 195,
        photodiodeVoltage: irReading.photodiodeVoltage || '0.950',
        deltaUV: deltaUV.toFixed(1),
        deltaIR: deltaIR.toFixed(1),
        ndi: ndi.toFixed(3)
      },
      disclaimer: 'SIMULATED DATA — NOT A CLINICAL TEST RESULT. Screening simulator only; does not provide verified diagnostic confirmation of blood.'
    };
  }
}
