/**
 * BloodTrace — Laptop Analysis Dashboard Component
 * 4-Panel Synchronized Optical Inspection Workstation:
 * Panel A: Clean Reference Image
 * Panel B: 365 nm UV Autofluorescence Image
 * Panel C: 850 nm NIR Absorption Image
 * Panel D: Candidate Residue Detection Map (Red contours & overlays, cyan edges)
 */

import { drawInstrument, INSTRUMENT_DEFINITIONS } from '../models/instruments.js';
import { drawSimulatedContamination } from '../models/sensor-sim.js';

export class DashboardView {
  constructor(containerId, appState) {
    this.container = document.getElementById(containerId);
    this.state = appState;
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.currentLayout = 'grid'; // 'grid' (2x2), 'focus' (single tabbed), 'split' (reference vs candidate)
    this.focusedPanel = 'map';   // 'ref', 'uv', 'ir', 'map'
    this.showOverlay = true;
    this.showBoundingBoxes = true;
    this.showFalseColor = false;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dashboard-root">
        <!-- Top Control Bar for Analysis Workspace -->
        <div class="dashboard-toolbar">
          <div class="toolbar-section">
            <span class="toolbar-title">Analysis Mode:</span>
            <div class="btn-group">
              <button id="btnLayoutGrid" class="btn btn-xs ${this.currentLayout === 'grid' ? 'btn-active' : ''}">2×2 Quad View</button>
              <button id="btnLayoutSplit" class="btn btn-xs ${this.currentLayout === 'split' ? 'btn-active' : ''}">Split Reference</button>
              <button id="btnLayoutFocus" class="btn btn-xs ${this.currentLayout === 'focus' ? 'btn-active' : ''}">Focused View</button>
            </div>
          </div>

          <!-- Dynamic Detection Threshold Slider -->
          <div class="toolbar-section threshold-controller">
            <div class="flex items-center justify-between gap-3">
              <label for="thresholdSlider" class="control-label text-xs">
                Detection Threshold: <strong id="thresholdValText" class="text-cyan font-mono">${this.state.detectionThreshold}</strong> <span class="text-muted text-2xs">(a.u.)</span>
              </label>
              <button id="btnResetThreshold" class="btn btn-2xs btn-ghost text-muted">Default (35)</button>
            </div>
            <input type="range" id="thresholdSlider" min="10" max="85" value="${this.state.detectionThreshold}" class="range-slider" />
          </div>

          <!-- Zoom & Display Controls -->
          <div class="toolbar-section">
            <span class="control-label text-xs">Optics Zoom:</span>
            <div class="btn-group">
              <button id="btnZoomOut" class="btn btn-xs btn-outline">−</button>
              <span id="zoomLevelText" class="zoom-display font-mono">${Math.round(this.zoomLevel * 100)}%</span>
              <button id="btnZoomIn" class="btn btn-xs btn-outline">+</button>
              <button id="btnResetZoom" class="btn btn-xs btn-ghost">1:1</button>
            </div>
          </div>

          <!-- Overlay & Filter Toggles -->
          <div class="toolbar-section toggles-section">
            <label class="toggle-pill">
              <input type="checkbox" id="chkShowOverlay" ${this.showOverlay ? 'checked' : ''} />
              <span>Residue Mask</span>
            </label>
            <label class="toggle-pill">
              <input type="checkbox" id="chkShowBoundingBoxes" ${this.showBoundingBoxes ? 'checked' : ''} />
              <span>ROI Boxes</span>
            </label>
            <label class="toggle-pill">
              <input type="checkbox" id="chkFalseColor" ${this.showFalseColor ? 'checked' : ''} />
              <span>False-Color Heatmap</span>
            </label>
          </div>

          <div class="toolbar-section action-buttons">
            <button id="btnResetScan" class="btn btn-xs btn-outline text-muted">Reset Scan</button>
          </div>
        </div>

        <!-- Main 4-Panel Canvas Workspace -->
        <div id="panelsContainer" class="panels-quad-grid layout-${this.currentLayout}">
          <!-- Panel A: Reference Image -->
          <div class="optic-panel ${this.focusedPanel === 'ref' ? 'panel-focused' : ''}" data-panel="ref">
            <div class="optic-panel-header">
              <div class="flex items-center gap-2">
                <span class="panel-tag tag-ref">PANEL A</span>
                <span class="panel-name">Reference Image (Baseline Clean)</span>
              </div>
              <div class="panel-wavelength">White Light Baseline</div>
            </div>
            <div class="canvas-viewport">
              <canvas id="canvasRef" width="700" height="380" class="panel-canvas"></canvas>
              <div class="panel-stamp">REF_STD</div>
            </div>
            <div class="panel-footer">
              <span>Status: Standard Pre-Scan Calibration</span>
              <span class="font-mono text-2xs text-muted">AISI 316L / 420 Steel</span>
            </div>
          </div>

          <!-- Panel B: UV Image -->
          <div class="optic-panel ${this.focusedPanel === 'uv' ? 'panel-focused' : ''}" data-panel="uv">
            <div class="optic-panel-header">
              <div class="flex items-center gap-2">
                <span class="panel-tag tag-uv">PANEL B</span>
                <span class="panel-name">UV Fluorescence Image</span>
              </div>
              <div class="panel-wavelength text-violet">λ = 365 nm (UV-A)</div>
            </div>
            <div class="canvas-viewport">
              <canvas id="canvasUv" width="700" height="380" class="panel-canvas"></canvas>
              <div class="panel-stamp stamp-uv">UV_365</div>
            </div>
            <div class="panel-footer">
              <span>Fluor. Emission: <strong id="footUvVal" class="text-violet font-mono">${this.state.lastScanResult ? this.state.lastScanResult.telemetry.uvIntensity : '--'}</strong> a.u.</span>
              <span class="font-mono text-2xs text-muted">D9 PWM Gate</span>
            </div>
          </div>

          <!-- Panel C: IR/NIR Image -->
          <div class="optic-panel ${this.focusedPanel === 'ir' ? 'panel-focused' : ''}" data-panel="ir">
            <div class="optic-panel-header">
              <div class="flex items-center gap-2">
                <span class="panel-tag tag-ir">PANEL C</span>
                <span class="panel-name">Near-Infrared Reflectance Image</span>
              </div>
              <div class="panel-wavelength text-pink">λ = 850 nm (NIR)</div>
            </div>
            <div class="canvas-viewport">
              <canvas id="canvasIr" width="700" height="380" class="panel-canvas"></canvas>
              <div class="panel-stamp stamp-ir">NIR_850</div>
            </div>
            <div class="panel-footer">
              <span>NIR Reflectance: <strong id="footIrVal" class="text-pink font-mono">${this.state.lastScanResult ? this.state.lastScanResult.telemetry.irIntensity : '--'}</strong> a.u.</span>
              <span class="font-mono text-2xs text-muted">D10 PWM Gate</span>
            </div>
          </div>

          <!-- Panel D: Candidate Residue Map -->
          <div class="optic-panel panel-hero ${this.focusedPanel === 'map' ? 'panel-focused' : ''}" data-panel="map">
            <div class="optic-panel-header">
              <div class="flex items-center gap-2">
                <span class="panel-tag tag-map">PANEL D</span>
                <span class="panel-name font-bold">Candidate Residue Map</span>
              </div>
              <div class="panel-wavelength text-danger">CV Multi-Spectral Contour</div>
            </div>
            <div class="canvas-viewport interactive-viewport" id="candidateViewport">
              <canvas id="canvasCandidate" width="700" height="380" class="panel-canvas"></canvas>
              <div class="panel-stamp stamp-map">CANDIDATE_RESIDUE_MAP</div>
              <!-- Interactive Click Hint -->
              <div class="click-hint">Click instrument surface to relocate or add contamination spot</div>
            </div>
            <div class="panel-footer">
              <span>Candidate Regions: <strong id="footCandidateCount" class="text-danger font-mono">${this.state.lastScanResult ? this.state.lastScanResult.candidateRegionsCount : 0}</strong></span>
              <span>Suspected Area: <strong id="footCandidateArea" class="text-danger font-mono">${this.state.lastScanResult ? this.state.lastScanResult.candidateSurfaceRatioPct : '0.00'}%</strong></span>
            </div>
          </div>
        </div>

        <!-- Sample Contamination Micro-Tuner Card -->
        <div class="sample-tuner-card">
          <div class="tuner-header">
            <div class="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
              <span class="font-bold text-xs uppercase tracking-wider text-cyan">Interactive Contamination Spot Tuner</span>
            </div>
            <div class="flex items-center gap-2">
              <button id="btnAddSpot" class="btn btn-2xs btn-outline text-cyan">+ Add Spot</button>
              <button id="btnClearSpots" class="btn btn-2xs btn-ghost text-muted">Clear Spots</button>
              <button id="btnResetSpots" class="btn btn-2xs btn-ghost text-muted">Reset Preset</button>
            </div>
          </div>

          <div class="tuner-controls-row">
            <div class="tuner-item">
              <label class="control-label text-2xs">Location X (%)</label>
              <input type="range" id="spotPosX" min="5" max="95" value="45" class="range-slider range-sm" />
            </div>
            <div class="tuner-item">
              <label class="control-label text-2xs">Location Y (%)</label>
              <input type="range" id="spotPosY" min="15" max="85" value="50" class="range-slider range-sm" />
            </div>
            <div class="tuner-item">
              <label class="control-label text-2xs">Residue Spot Size</label>
              <input type="range" id="spotRadius" min="15" max="90" value="38" class="range-slider range-sm" />
            </div>
            <div class="tuner-item">
              <label class="control-label text-2xs">Residue Optical Density</label>
              <input type="range" id="spotIntensity" min="30" max="100" value="90" class="range-slider range-sm" />
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateAllPanels();
  }

  bindEvents() {
    // Layout switcher
    const btnGrid = document.getElementById('btnLayoutGrid');
    const btnSplit = document.getElementById('btnLayoutSplit');
    const btnFocus = document.getElementById('btnLayoutFocus');

    if (btnGrid) btnGrid.addEventListener('click', () => this.setLayout('grid'));
    if (btnSplit) btnSplit.addEventListener('click', () => this.setLayout('split'));
    if (btnFocus) btnFocus.addEventListener('click', () => this.setLayout('focus'));

    // Threshold Slider
    const thresholdSlider = document.getElementById('thresholdSlider');
    const thresholdValText = document.getElementById('thresholdValText');
    const btnResetThreshold = document.getElementById('btnResetThreshold');

    if (thresholdSlider) {
      thresholdSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.detectionThreshold = val;
        if (thresholdValText) thresholdValText.textContent = val;
        // Dynamically reprocess CV contours on threshold change
        if (this.onThresholdChanged) this.onThresholdChanged(val);
        this.updateCandidatePanel();
        this.updateFooterReadouts();
      });
    }

    if (btnResetThreshold) {
      btnResetThreshold.addEventListener('click', () => {
        if (thresholdSlider) thresholdSlider.value = 35;
        this.state.detectionThreshold = 35;
        if (thresholdValText) thresholdValText.textContent = 35;
        if (this.onThresholdChanged) this.onThresholdChanged(35);
        this.updateCandidatePanel();
        this.updateFooterReadouts();
      });
    }

    // Zoom Controls
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnResetZoom = document.getElementById('btnResetZoom');
    const zoomText = document.getElementById('zoomLevelText');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        this.zoomLevel = Math.min(3.0, Number((this.zoomLevel + 0.25).toFixed(2)));
        if (zoomText) zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        this.updateAllPanels();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        this.zoomLevel = Math.max(0.75, Number((this.zoomLevel - 0.25).toFixed(2)));
        if (zoomText) zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        this.updateAllPanels();
      });
    }
    if (btnResetZoom) {
      btnResetZoom.addEventListener('click', () => {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        if (zoomText) zoomText.textContent = '100%';
        this.updateAllPanels();
      });
    }

    // Pan Dragging support for all viewports
    const viewports = this.container.querySelectorAll('.canvas-viewport');
    viewports.forEach(vp => {
      vp.addEventListener('mousedown', (e) => {
        if (this.zoomLevel <= 1.0 || e.button !== 0) return;
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        vp.style.cursor = 'grabbing';
      });
      vp.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const dx = (e.clientX - this.dragStart.x) / this.zoomLevel;
        const dy = (e.clientY - this.dragStart.y) / this.zoomLevel;
        this.panX += dx;
        this.panY += dy;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.updateAllPanels();
      });
      const stopDrag = () => {
        if (this.isDragging) {
          this.isDragging = false;
          vp.style.cursor = this.zoomLevel > 1.0 ? 'grab' : 'crosshair';
        }
      };
      vp.addEventListener('mouseup', stopDrag);
      vp.addEventListener('mouseleave', stopDrag);
    });

    // Toggle Checkboxes
    const chkOverlay = document.getElementById('chkShowOverlay');
    if (chkOverlay) {
      chkOverlay.addEventListener('change', (e) => {
        this.showOverlay = e.target.checked;
        this.updateCandidatePanel();
      });
    }

    const chkBoxes = document.getElementById('chkShowBoundingBoxes');
    if (chkBoxes) {
      chkBoxes.addEventListener('change', (e) => {
        this.showBoundingBoxes = e.target.checked;
        this.updateCandidatePanel();
      });
    }

    const chkFalseColor = document.getElementById('chkFalseColor');
    if (chkFalseColor) {
      chkFalseColor.addEventListener('change', (e) => {
        this.showFalseColor = e.target.checked;
        this.updateAllPanels();
      });
    }

    // Reset Scan button
    const btnResetScan = document.getElementById('btnResetScan');
    if (btnResetScan) {
      btnResetScan.addEventListener('click', () => {
        if (this.onResetScanRequested) this.onResetScanRequested();
      });
    }

    // Interactive Click on Candidate Canvas to Place or Move Residue
    const candidateCanvas = document.getElementById('canvasCandidate');
    if (candidateCanvas) {
      candidateCanvas.addEventListener('click', (e) => {
        const rect = candidateCanvas.getBoundingClientRect();
        const clickScreenX = (e.clientX - rect.left) * (candidateCanvas.width / rect.width);
        const clickScreenY = (e.clientY - rect.top) * (candidateCanvas.height / rect.height);
        
        const w = candidateCanvas.width;
        const h = candidateCanvas.height;
        // Invert zoom & pan transform:
        const origX = (clickScreenX - w / 2) / this.zoomLevel + w / 2 - this.panX;
        const origY = (clickScreenY - h / 2) / this.zoomLevel + h / 2 - this.panY;

        const xRatio = Math.max(0.05, Math.min(0.95, origX / w));
        const yRatio = Math.max(0.10, Math.min(0.90, origY / h));

        this.handleCanvasPointPlaced(xRatio, yRatio);
      });
    }

    // Spot Tuner Sliders
    const posX = document.getElementById('spotPosX');
    const posY = document.getElementById('spotPosY');
    const spotR = document.getElementById('spotRadius');
    const spotInt = document.getElementById('spotIntensity');

    const updateActiveSpotFromSliders = () => {
      if (!this.state.spots || this.state.spots.length === 0) {
        this.state.spots = [{ xRatio: 0.45, yRatio: 0.50, radiusRatio: 0.038, intensity: 0.90 }];
      }
      const active = this.state.spots[0];
      if (posX) active.xRatio = parseInt(posX.value, 10) / 100.0;
      if (posY) active.yRatio = parseInt(posY.value, 10) / 100.0;
      if (spotR) active.radiusRatio = (parseInt(spotR.value, 10) / 1000.0);
      if (spotInt) active.intensity = parseInt(spotInt.value, 10) / 100.0;

      this.updateAllPanels();
      if (this.onSpotsModified) this.onSpotsModified();
    };

    if (posX) posX.addEventListener('input', updateActiveSpotFromSliders);
    if (posY) posY.addEventListener('input', updateActiveSpotFromSliders);
    if (spotR) spotR.addEventListener('input', updateActiveSpotFromSliders);
    if (spotInt) spotInt.addEventListener('input', updateActiveSpotFromSliders);

    // Tuner buttons
    const btnAddSpot = document.getElementById('btnAddSpot');
    const btnClearSpots = document.getElementById('btnClearSpots');
    const btnResetSpots = document.getElementById('btnResetSpots');

    if (btnAddSpot) {
      btnAddSpot.addEventListener('click', () => {
        const newX = 0.25 + Math.random() * 0.5;
        const newY = 0.35 + Math.random() * 0.3;
        this.state.spots.push({
          xRatio: Number(newX.toFixed(2)),
          yRatio: Number(newY.toFixed(2)),
          radiusRatio: 0.035,
          intensity: 0.88
        });
        this.updateAllPanels();
        if (this.onSpotsModified) this.onSpotsModified();
      });
    }

    if (btnClearSpots) {
      btnClearSpots.addEventListener('click', () => {
        this.state.spots = [];
        this.updateAllPanels();
        if (this.onSpotsModified) this.onSpotsModified();
      });
    }

    if (btnResetSpots) {
      btnResetSpots.addEventListener('click', () => {
        if (this.onResetSpotsRequested) this.onResetSpotsRequested();
      });
    }

    // Panel focus selection
    const opticPanels = this.container.querySelectorAll('.optic-panel');
    opticPanels.forEach(panel => {
      panel.addEventListener('click', (e) => {
        // avoid triggering when clicking on buttons/inputs inside
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        this.focusedPanel = panel.dataset.panel;
        opticPanels.forEach(p => p.classList.remove('panel-focused'));
        panel.classList.add('panel-focused');
      });
    });
  }

  setLayout(layout) {
    this.currentLayout = layout;
    const container = document.getElementById('panelsContainer');
    if (container) {
      container.className = `panels-quad-grid layout-${layout}`;
    }
    const btnGrid = document.getElementById('btnLayoutGrid');
    const btnSplit = document.getElementById('btnLayoutSplit');
    const btnFocus = document.getElementById('btnLayoutFocus');

    if (btnGrid) btnGrid.className = `btn btn-xs ${layout === 'grid' ? 'btn-active' : ''}`;
    if (btnSplit) btnSplit.className = `btn btn-xs ${layout === 'split' ? 'btn-active' : ''}`;
    if (btnFocus) btnFocus.className = `btn btn-xs ${layout === 'focus' ? 'btn-active' : ''}`;
  }

  handleCanvasPointPlaced(xRatio, yRatio) {
    if (!this.state.spots) this.state.spots = [];

    // If currently on clean reference, switch to active spot challenge
    if (this.state.sampleCondition === 'clean') {
      this.state.sampleCondition = 'blood_small';
      const condSelect = document.getElementById('conditionSelect');
      if (condSelect) condSelect.value = 'blood_small';
    }

    if (this.state.spots.length === 0) {
      this.state.spots.push({
        xRatio,
        yRatio,
        radiusRatio: 0.04,
        intensity: 0.95
      });
    } else {
      // Reposition first spot to the clicked position
      this.state.spots[0].xRatio = Number(xRatio.toFixed(3));
      this.state.spots[0].yRatio = Number(yRatio.toFixed(3));
    }

    // Sync sliders
    const posX = document.getElementById('spotPosX');
    const posY = document.getElementById('spotPosY');
    if (posX) posX.value = Math.round(xRatio * 100);
    if (posY) posY.value = Math.round(yRatio * 100);

    this.updateAllPanels();
    if (this.onSpotsModified) this.onSpotsModified();
  }

  updateAllPanels() {
    this.updateReferencePanel();
    this.updateUvPanel();
    this.updateIrPanel();
    this.updateCandidatePanel();
    this.updateFooterReadouts();
  }

  applyTransform(ctx, w, h) {
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    ctx.translate(-w / 2 + this.panX, -h / 2 + this.panY);
  }

  updateReferencePanel() {
    const canvas = document.getElementById('canvasRef');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this.applyTransform(ctx, w, h);

    // Reference image is always clean baseline!
    drawInstrument(ctx, this.state.selectedInstrument, w, h, { lighting: 'reference' });
    ctx.restore();
  }

  updateUvPanel() {
    const canvas = document.getElementById('canvasUv');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this.applyTransform(ctx, w, h);

    drawInstrument(ctx, this.state.selectedInstrument, w, h, { lighting: 'uv' });
    drawSimulatedContamination(ctx, this.state.spots, this.state.sampleCondition, 'uv', w, h);

    if (this.showFalseColor) {
      this.applyFalseColorOverlay(ctx, w, h, 'uv');
    }

    ctx.restore();
  }

  updateIrPanel() {
    const canvas = document.getElementById('canvasIr');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this.applyTransform(ctx, w, h);

    drawInstrument(ctx, this.state.selectedInstrument, w, h, { lighting: 'ir' });
    drawSimulatedContamination(ctx, this.state.spots, this.state.sampleCondition, 'ir', w, h);

    if (this.showFalseColor) {
      this.applyFalseColorOverlay(ctx, w, h, 'ir');
    }

    ctx.restore();
  }

  updateCandidatePanel() {
    const canvas = document.getElementById('canvasCandidate');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    this.applyTransform(ctx, w, h);

    // Neutral grey steel instrument surface with cyan structural edges
    drawInstrument(ctx, this.state.selectedInstrument, w, h, {
      lighting: 'candidate_map',
      highlightColor: '#06b6d4'
    });

    // Draw candidate contamination map (red outlines, red translucent mask, bounding boxes)
    if (this.showOverlay) {
      drawSimulatedContamination(ctx, this.state.spots, this.state.sampleCondition, 'candidate_map', w, h, {
        detectionThreshold: this.state.detectionThreshold,
        showBoundingBoxes: this.showBoundingBoxes
      });
    }

    ctx.restore();
    this.updateFooterReadouts();
  }

  applyFalseColorOverlay(ctx, w, h, channel) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = channel === 'uv' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(236, 72, 153, 0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  updateFooterReadouts() {
    const footUv = document.getElementById('footUvVal');
    const footIr = document.getElementById('footIrVal');
    const footCount = document.getElementById('footCandidateCount');
    const footArea = document.getElementById('footCandidateArea');

    if (this.state.lastScanResult) {
      if (footUv) footUv.textContent = this.state.lastScanResult.telemetry.uvIntensity;
      if (footIr) footIr.textContent = this.state.lastScanResult.telemetry.irIntensity;
      if (footCount) footCount.textContent = this.state.lastScanResult.candidateRegionsCount;
      if (footArea) footArea.textContent = `${this.state.lastScanResult.candidateSurfaceRatioPct}%`;
    }
  }
}
