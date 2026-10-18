/**
 * BloodTrace — Master Application Controller
 * College-level Engineering Demonstration Platform
 */

import { INSTRUMENT_DEFINITIONS } from './models/instruments.js';
import { SAMPLE_CONDITIONS, SensorSimulator } from './models/sensor-sim.js';
import { ComputerVisionPipeline } from './models/cv-pipeline.js';
import { DeviceView } from './components/device-view.js';
import { DashboardView } from './components/dashboard-view.js';
import { TelemetryCharts } from './components/charts.js';
import { DemoManager } from './components/demo-mode.js';
import { ReportManager } from './components/report-modal.js';
import { REAL_IMAGE_SAMPLES } from './models/real-image-processor.js';
import { QRModalManager } from './components/qr-modal.js';

class BloodTraceApp {
  constructor() {
    this.state = {
      activeView: 'device', // 'device', 'dashboard', 'results', 'about'
      selectedInstrument: 'forceps',
      sampleCondition: 'blood_dried',
      illuminationMode: 'off',
      chamberLidOpen: false,
      arduinoConnected: true,
      currentADC: 195,
      detectionThreshold: 35,
      spots: [],
      isScanning: false,
      scanProgress: 0,
      soundEnabled: true,
      scanHistory: [],
      lastScanResult: null
    };

    // Sub-systems
    this.sensorSim = new SensorSimulator(84920);
    this.cvPipeline = new ComputerVisionPipeline();
    this.reportManager = new ReportManager(this.state);
    this.demoManager = new DemoManager(this);

    // Audio synthesizer
    this.audioCtx = null;

    // Initialize spots from default preset
    this.loadDefaultSpotsForCondition();

    // Setup UI & Components
    this.initDOM();
    this.initSubComponents();
    this.bindGlobalEvents();
    this.startLiveTelemetryLoop();

    // Initial greeting in serial console
    if (this.deviceView) {
      this.deviceView.logSerial('[SYS] BloodTrace Controller online. Firmware v1.4 ready.');
    }

    // Handle URL parameters for direct view/mode deep-linking
    this.handleURLParameters();
  }

  handleURLParameters() {
    try {
      let search = window.location.search;
      if ((!search || search.length <= 1) && window.location.hash) {
        let hash = window.location.hash.slice(1);
        search = hash.includes('=') ? '?' + hash : '?view=' + hash;
      }
      const params = new URLSearchParams(search);
      const view = params.get('view');
      const mode = params.get('mode');
      const inst = params.get('instrument');
      const sample = params.get('sample');
      const cond = params.get('condition');
      const scan = params.get('scan');
      const report = params.get('report');

      if (sample && this.dashboardView) {
        const dashSelect = document.getElementById('dashboardSampleSelect');
        if (dashSelect) dashSelect.value = sample;
        this.dashboardView.setSample(sample);
      }

      if (inst) this.selectInstrument(inst);
      if (cond) this.selectCondition(cond);
      if (mode) this.setIlluminationMode(mode);

      if (scan === '1') {
        const scanRes = this.cvPipeline.processScan({
          spots: this.state.spots,
          conditionId: this.state.sampleCondition,
          threshold: this.state.detectionThreshold,
          uvReading: this.sensorSim.calculateReading('uv', this.state.sampleCondition, this.state.spots, 100),
          irReading: this.sensorSim.calculateReading('ir', this.state.sampleCondition, this.state.spots, 100)
        });
        this.state.lastScanResult = scanRes;
        this.state.scanHistory.unshift(scanRes);
        if (this.dashboardView) this.dashboardView.updateAllPanels();
        this.updateResultsSummaryCard(scanRes);
      }

      if (view) this.switchView(view);

      if (report === '1') {
        setTimeout(() => this.openReportModal(), 150);
      }
    } catch (e) {
      console.warn('URL parameter parsing failed:', e);
    }
  }

  initDOM() {
    // Populate Instrument Selector options
    const instSelect = document.getElementById('instrumentSelect');
    if (instSelect) {
      instSelect.innerHTML = `
        <optgroup label="── Actual Test Photographs ──">
          <option value="real_clean_surface">Clean Reference Surface (Tools)</option>
          <option value="real_contaminated_surface">Blood-Contaminated Surface (Clamp)</option>
          <option value="real_scalpel_blade">Contaminated Scalpel Blade (Poster Reference)</option>
          <option value="real_surgical_set_blood">Surgical Tools Set with Blood Marks</option>
          <option value="real_contaminated_gauze">Contaminated Instruments on Gauze</option>
          <option value="real_compare_both">Compare Both (Clean vs Contaminated)</option>
        </optgroup>
        <optgroup label="── Virtual CAD Instruments ──">
          ${Object.values(INSTRUMENT_DEFINITIONS).map(inst => `
            <option value="${inst.id}" ${inst.id === this.state.selectedInstrument ? 'selected' : ''}>
              ${inst.name}
            </option>
          `).join('')}
        </optgroup>
      `;
    }

    // Populate Sample Condition Selector options
    const condSelect = document.getElementById('conditionSelect');
    if (condSelect) {
      condSelect.innerHTML = Object.values(SAMPLE_CONDITIONS).map(cond => `
        <option value="${cond.id}" ${cond.id === this.state.sampleCondition ? 'selected' : ''}>
          ${cond.name}
        </option>
      `).join('');
    }

    this.updateInstrumentMetadata();
    this.updateConditionMetadata();
  }

  initSubComponents() {
    this.deviceView = new DeviceView('deviceViewContainer', this.state);
    this.dashboardView = new DashboardView('dashboardViewContainer', this.state);
    this.charts = new TelemetryCharts('oscilloscopeCanvas', this.state);

    // Wire component callbacks
    this.deviceView.onScanRequested = () => this.startScan();
    this.deviceView.onModeChanged = (mode) => {
      this.state.illuminationMode = mode;
      this.updateSidebarIlluminationUI(mode);
      this.updateSensorReading();
      if (this.dashboardView) this.dashboardView.updateAllPanels();
    };
    this.deviceView.onSpotPlaced = (xRatio, yRatio) => {
      if (this.dashboardView) {
        this.dashboardView.handleCanvasPointPlaced(xRatio, yRatio);
      }
      this.updateSensorReading();
      this.deviceView.updateChamberCanvas();
    };

    this.dashboardView.onScanRequested = () => this.startScan();
    this.dashboardView.onResetScanRequested = () => this.resetScan();
    this.dashboardView.onThresholdChanged = (newThreshold) => {
      this.state.detectionThreshold = newThreshold;
      const sbThresh = document.getElementById('sidebarThresholdSlider');
      const sbVal = document.getElementById('sidebarThresholdVal');
      if (sbThresh) sbThresh.value = newThreshold;
      if (sbVal) sbVal.textContent = newThreshold;
      if (this.state.lastScanResult) {
        // Re-process current scan dynamically
        this.reprocessWithCurrentThreshold();
      }
    };
    this.dashboardView.onSpotsModified = () => {
      this.updateSensorReading();
      if (this.deviceView) this.deviceView.updateChamberCanvas();
    };
    this.dashboardView.onResetSpotsRequested = () => {
      this.loadDefaultSpotsForCondition();
      this.dashboardView.updateAllPanels();
      if (this.deviceView) this.deviceView.updateChamberCanvas();
    };
  }

  bindGlobalEvents() {
    // Top Navigation Tabs
    const navButtons = document.querySelectorAll('[data-nav-view]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.navView;
        this.switchView(view);
      });
    });

    // Run Demo button
    const btnRunDemo = document.getElementById('btnRunDemo');
    if (btnRunDemo) {
      btnRunDemo.addEventListener('click', () => {
        this.demoManager.start();
      });
    }

    // Online QR modal button
    const btnOnlineQR = document.getElementById('btnOnlineQR');
    if (btnOnlineQR) {
      btnOnlineQR.addEventListener('click', () => {
        QRModalManager.openQRModal();
      });
    }

    // Instrument change
    const instSelect = document.getElementById('instrumentSelect');
    if (instSelect) {
      instSelect.addEventListener('change', (e) => {
        this.selectInstrument(e.target.value);
      });
    }

    // Condition change
    const condSelect = document.getElementById('conditionSelect');
    if (condSelect) {
      condSelect.addEventListener('change', (e) => {
        this.selectCondition(e.target.value);
      });
    }

    // Sidebar Illumination Buttons (Requirement 13)
    const sbBtnOff = document.getElementById('sbBtnModeOff');
    const sbBtnUv = document.getElementById('sbBtnModeUv');
    const sbBtnIr = document.getElementById('sbBtnModeIr');
    const sbBtnCombined = document.getElementById('sbBtnModeCombined');

    if (sbBtnOff) sbBtnOff.addEventListener('click', () => this.setIlluminationMode('off'));
    if (sbBtnUv) sbBtnUv.addEventListener('click', () => this.setIlluminationMode('uv'));
    if (sbBtnIr) sbBtnIr.addEventListener('click', () => this.setIlluminationMode('ir'));
    if (sbBtnCombined) sbBtnCombined.addEventListener('click', () => this.setIlluminationMode('combined'));

    // Sidebar Threshold Slider (Requirement 13)
    const sbThreshSlider = document.getElementById('sidebarThresholdSlider');
    const sbThreshVal = document.getElementById('sidebarThresholdVal');
    if (sbThreshSlider) {
      sbThreshSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.detectionThreshold = val;
        if (sbThreshVal) sbThreshVal.textContent = val;
        const mainThresh = document.getElementById('thresholdSlider');
        const mainText = document.getElementById('thresholdValText');
        if (mainThresh) mainThresh.value = val;
        if (mainText) mainText.textContent = val;
        if (this.state.lastScanResult) {
          this.reprocessWithCurrentThreshold();
        } else if (this.dashboardView) {
          this.dashboardView.updateCandidatePanel();
        }
      });
    }

    // Sidebar Start Scan button
    const btnSidebarScan = document.getElementById('btnSidebarScan');
    if (btnSidebarScan) {
      btnSidebarScan.addEventListener('click', () => {
        this.startScan();
      });
    }

    // Quick Action: Export CSV
    const btnQuickCSV = document.getElementById('btnQuickCSV');
    if (btnQuickCSV) {
      btnQuickCSV.addEventListener('click', () => {
        this.reportManager.exportCSV(this.state.lastScanResult);
      });
    }

    // Quick Action: Generate Formal Report
    const btnQuickReport = document.getElementById('btnQuickReport');
    if (btnQuickReport) {
      btnQuickReport.addEventListener('click', () => {
        this.openReportModal();
      });
    }

    // Audio Mute Toggle
    const btnToggleSound = document.getElementById('btnToggleSound');
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        btnToggleSound.textContent = this.state.soundEnabled ? '🔊 Audio ON' : '🔇 Audio Muted';
      });
    }
  }

  switchView(viewName) {
    this.state.activeView = viewName;
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    // Update nav active pill
    const navButtons = document.querySelectorAll('[data-nav-view]');
    navButtons.forEach(btn => {
      if (btn.dataset.navView === viewName) {
        btn.classList.add('nav-active');
      } else {
        btn.classList.remove('nav-active');
      }
    });

    // Re-render relevant view canvases
    if (viewName === 'device' && this.deviceView) {
      this.deviceView.updateChamberCanvas();
      this.deviceView.updateArduinoCanvas();
    } else if (viewName === 'dashboard' && this.dashboardView) {
      this.dashboardView.updateAllPanels();
    } else if (viewName === 'results') {
      this.renderResultsHistoryView();
    }
  }

  selectInstrument(instId) {
    this.state.selectedInstrument = instId;
    const instSelect = document.getElementById('instrumentSelect');
    if (instSelect) instSelect.value = instId;

    if (instId.startsWith('real_')) {
      const realKey = instId.replace('real_', '');
      if (this.dashboardView) {
        const dashSelect = document.getElementById('dashboardSampleSelect');
        if (dashSelect) dashSelect.value = realKey;
        this.dashboardView.setSample(realKey);
      }
      this.updateInstrumentMetadata();
      if (this.deviceView) {
        this.deviceView.logSerial(`[SPECIMEN] Loaded photographic sample: ${realKey.toUpperCase()}`);
      }
    } else {
      if (this.dashboardView) {
        const dashSelect = document.getElementById('dashboardSampleSelect');
        if (dashSelect) dashSelect.value = 'cad_' + instId;
        this.dashboardView.setSample('cad_' + instId);
      }
      this.updateInstrumentMetadata();
      this.loadDefaultSpotsForCondition();
      if (this.deviceView) {
        this.deviceView.updateChamberCanvas();
        this.deviceView.logSerial(`[INSTRUMENT] Loaded specimen: ${instId.toUpperCase()}`);
      }
    }
  }

  selectCondition(condId) {
    this.state.sampleCondition = condId;
    const condSelect = document.getElementById('conditionSelect');
    if (condSelect) condSelect.value = condId;

    this.updateConditionMetadata();
    this.loadDefaultSpotsForCondition();

    if (this.deviceView) {
      this.deviceView.updateChamberCanvas();
      this.deviceView.logSerial(`[SAMPLE] Target condition set: ${condId.toUpperCase()}`);
    }
    if (this.dashboardView) this.dashboardView.updateAllPanels();
  }

  loadDefaultSpotsForCondition() {
    const cond = this.state.sampleCondition;
    if (cond === 'clean') {
      this.state.spots = [];
      return;
    }

    const instDef = INSTRUMENT_DEFINITIONS[this.state.selectedInstrument] || {};
    const baseSpot = (instDef.defaultSpots && instDef.defaultSpots[0]) || { xRatio: 0.40, yRatio: 0.50, radiusRatio: 0.038, intensity: 0.90 };

    if (cond === 'blood_dried') {
      this.state.spots = [
        { ...baseSpot, radiusRatio: 0.045, intensity: 0.95 }
      ];
    } else if (cond === 'blood_small') {
      this.state.spots = [
        { ...baseSpot, radiusRatio: 0.022, intensity: 0.85 }
      ];
    } else if (cond === 'blood_multi') {
      this.state.spots = [
        { xRatio: baseSpot.xRatio - 0.08, yRatio: baseSpot.yRatio - 0.04, radiusRatio: 0.028, intensity: 0.92 },
        { xRatio: baseSpot.xRatio, yRatio: baseSpot.yRatio, radiusRatio: 0.034, intensity: 0.88 },
        { xRatio: baseSpot.xRatio + 0.12, yRatio: baseSpot.yRatio + 0.03, radiusRatio: 0.026, intensity: 0.82 }
      ];
    } else if (cond === 'detergent') {
      this.state.spots = [
        { ...baseSpot, radiusRatio: 0.055, intensity: 0.90 }
      ];
    } else if (cond === 'water_mark') {
      this.state.spots = [
        { ...baseSpot, radiusRatio: 0.048, intensity: 0.65 }
      ];
    }
  }

  updateInstrumentMetadata() {
    const metaEl = document.getElementById('instrumentMetaDisplay');
    if (!metaEl) return;
    if (this.state.selectedInstrument.startsWith('real_')) {
      const realKey = this.state.selectedInstrument.replace('real_', '');
      const sample = REAL_IMAGE_SAMPLES[realKey];
      if (sample) {
        metaEl.innerHTML = `
          <div class="meta-row"><span class="meta-lbl">Specimen:</span> <span class="meta-val">${sample.name}</span></div>
          <div class="meta-row"><span class="meta-lbl">Category:</span> <span class="meta-val text-cyan">${sample.category}</span></div>
          <div class="meta-row"><span class="meta-lbl">File:</span> <span class="meta-val font-mono">${sample.path}</span></div>
        `;
        return;
      }
    }
    const inst = INSTRUMENT_DEFINITIONS[this.state.selectedInstrument];
    if (inst) {
      metaEl.innerHTML = `
        <div class="meta-row"><span class="meta-lbl">Type:</span> <span class="meta-val">${inst.category}</span></div>
        <div class="meta-row"><span class="meta-lbl">Alloy:</span> <span class="meta-val">${inst.material}</span></div>
        <div class="meta-row"><span class="meta-lbl">Dimensions:</span> <span class="meta-val">${inst.dimensions}</span></div>
      `;
    }
  }

  updateConditionMetadata() {
    const cond = SAMPLE_CONDITIONS[this.state.sampleCondition];
    const metaEl = document.getElementById('conditionMetaDisplay');
    if (metaEl && cond) {
      metaEl.innerHTML = `
        <div class="meta-desc">${cond.description}</div>
        <div class="meta-risk-pill risk-${cond.expectedRisk.toLowerCase().replace(/[^a-z]/g, '')}">Expected Screening Category: ${cond.category}</div>
      `;
    }
  }

  /**
   * Optical Scanning Workflow Engine
   * Believable, realistic multi-step sequence with hardware switching and progress updates
   */
  async startScan() {
    if (this.state.isScanning) return;
    if (!this.state.arduinoConnected) {
      if (this.deviceView) {
        this.deviceView.logSerial('[ERROR] Cannot initiate scan: Virtual Arduino is disconnected. Reconnect USB first.');
      }
      return;
    }

    this.state.isScanning = true;
    this.updateScanButtonState(true);
    this.playAudioTone('start');

    if (this.deviceView) {
      this.deviceView.logSerial('========================================');
      this.deviceView.logSerial('[SCAN] TRIGGER RECEIVED (D2 PULLUP -> GND)');
      this.deviceView.logSerial(`[SCAN] Specimen: ${this.state.selectedInstrument.toUpperCase()} | Condition: ${this.state.sampleCondition}`);
    }

    // Step 1: Baseline Ambient Calibration
    this.updateScanProgress(15, 'Calibrating Ambient Dark Baseline (All LEDs OFF)...');
    this.setIlluminationMode('off');
    await this.delay(650);
    const ambientReading = this.sensorSim.calculateReading('off', this.state.sampleCondition, this.state.spots, Date.now());
    this.updateSensorADC(ambientReading.photodiodeADC);
    if (this.deviceView) {
      this.deviceView.logSerial(`[CALIB] Dark current ADC_A0=${ambientReading.photodiodeADC} (${ambientReading.photodiodeVoltage}V)`);
    }

    // Step 2: UV Strobe Illumination (365 nm)
    this.updateScanProgress(38, 'Activating 365 nm UV-A LED (D9 HIGH) — Capturing Fluorescence Frame...');
    this.playAudioTone('relay');
    this.setIlluminationMode('uv');
    await this.delay(850);
    const uvReading = this.sensorSim.calculateReading('uv', this.state.sampleCondition, this.state.spots, Date.now());
    this.updateSensorADC(uvReading.photodiodeADC);
    if (this.deviceView) {
      this.deviceView.logSerial(`[UV_STROBE] PIN_D9=HIGH, UV_FLUOR=${uvReading.uvIntensity} a.u., ADC_A0=${uvReading.photodiodeADC}`);
    }

    // Step 3: NIR Strobe Illumination (850 nm)
    this.updateScanProgress(62, 'Activating 850 nm NIR LED Array (D10 HIGH) — Capturing Reflectance Frame...');
    this.playAudioTone('relay');
    this.setIlluminationMode('ir');
    await this.delay(850);
    const irReading = this.sensorSim.calculateReading('ir', this.state.sampleCondition, this.state.spots, Date.now());
    this.updateSensorADC(irReading.photodiodeADC);
    if (this.deviceView) {
      this.deviceView.logSerial(`[NIR_STROBE] PIN_D10=HIGH, NIR_REFL=${irReading.irIntensity} a.u., ADC_A0=${irReading.photodiodeADC}`);
    }

    // Step 4: Combined Multi-Spectral Alignment
    this.updateScanProgress(80, 'Multi-Spectral Frame Alignment & Computer Vision Processing...');
    this.setIlluminationMode('combined');
    await this.delay(600);

    // Step 5: Execute Computer Vision Pipeline
    const scanData = {
      spots: this.state.spots,
      conditionId: this.state.sampleCondition,
      instrumentId: this.state.selectedInstrument,
      threshold: this.state.detectionThreshold,
      uvReading,
      irReading,
      canvasWidth: 700,
      canvasHeight: 380
    };

    const analysisResult = this.cvPipeline.processScan(scanData);
    this.state.lastScanResult = analysisResult;
    this.state.scanHistory.unshift(analysisResult);

    // Finish sequence
    this.updateScanProgress(100, 'Screening Scan Complete. Compiling Diagnostic Report...');
    await this.delay(450);

    // Return to standby mode
    this.setIlluminationMode('off');
    this.state.isScanning = false;
    this.updateScanButtonState(false);
    this.playAudioTone(analysisResult.resultSeverity === 'critical' ? 'alert' : 'complete');

    if (this.deviceView) {
      this.deviceView.logSerial(`[CV_ENGINE] Output: ${analysisResult.screeningResult}`);
      this.deviceView.logSerial(`[CV_ENGINE] Suspected Regions: ${analysisResult.candidateRegionsCount}, Area: ${analysisResult.candidateSurfaceRatioPct}%`);
      this.deviceView.logSerial('========================================');
    }

    // Update UI elements
    this.updateResultsSummaryCard(analysisResult);
    if (this.dashboardView) this.dashboardView.updateAllPanels();
    if (this.charts) {
      this.charts.renderSpectralBars('spectralBarCanvas', analysisResult.telemetry.uvIntensity, analysisResult.telemetry.irIntensity);
    }

    // Switch automatically to Laptop Analysis Dashboard view so user immediately inspects results!
    this.switchView('dashboard');
  }

  reprocessWithCurrentThreshold() {
    if (!this.state.lastScanResult) return;
    const uvReading = { uvIntensity: this.state.lastScanResult.telemetry.uvIntensity };
    const irReading = {
      irIntensity: this.state.lastScanResult.telemetry.irIntensity,
      photodiodeADC: this.state.lastScanResult.telemetry.photodiodeADC,
      photodiodeVoltage: this.state.lastScanResult.telemetry.photodiodeVoltage
    };

    const reprocessed = this.cvPipeline.processScan({
      spots: this.state.spots,
      conditionId: this.state.sampleCondition,
      instrumentId: this.state.selectedInstrument,
      threshold: this.state.detectionThreshold,
      uvReading,
      irReading,
      canvasWidth: 700,
      canvasHeight: 380
    });

    this.state.lastScanResult = reprocessed;
    this.updateResultsSummaryCard(reprocessed);
    if (this.dashboardView) {
      this.dashboardView.updateCandidatePanel();
      this.dashboardView.updateFooterReadouts();
    }
  }

  resetScan() {
    this.state.lastScanResult = null;
    this.setIlluminationMode('off');
    this.updateResultsSummaryCard(null);
    if (this.dashboardView) this.dashboardView.updateAllPanels();
    if (this.deviceView) {
      this.deviceView.logSerial('[SYS] Scan state cleared. Ready for new specimen.');
    }
  }

  setIlluminationMode(mode) {
    this.state.illuminationMode = mode;
    if (this.deviceView) this.deviceView.setIlluminationMode(mode);
    this.updateSidebarIlluminationUI(mode);
    this.updateSensorReading();
  }

  updateSidebarIlluminationUI(mode) {
    const sbBtnOff = document.getElementById('sbBtnModeOff');
    const sbBtnUv = document.getElementById('sbBtnModeUv');
    const sbBtnIr = document.getElementById('sbBtnModeIr');
    const sbBtnCombined = document.getElementById('sbBtnModeCombined');
    const sbTag = document.getElementById('sidebarModeTag');

    [sbBtnOff, sbBtnUv, sbBtnIr, sbBtnCombined].forEach(b => { if (b) b.classList.remove('btn-active'); });
    if (mode === 'off' && sbBtnOff) sbBtnOff.classList.add('btn-active');
    else if (mode === 'uv' && sbBtnUv) sbBtnUv.classList.add('btn-active');
    else if (mode === 'ir' && sbBtnIr) sbBtnIr.classList.add('btn-active');
    else if (mode === 'combined' && sbBtnCombined) sbBtnCombined.classList.add('btn-active');

    if (sbTag) {
      sbTag.textContent = mode.toUpperCase();
      sbTag.className = `text-xs font-mono ${mode === 'uv' ? 'text-violet' : (mode === 'ir' ? 'text-pink' : (mode === 'combined' ? 'text-cyan' : 'text-muted'))}`;
    }
  }

  updateSensorReading() {
    const reading = this.sensorSim.calculateReading(
      this.state.illuminationMode,
      this.state.sampleCondition,
      this.state.spots,
      Date.now()
    );
    this.updateSensorADC(reading.photodiodeADC);
    if (this.charts) this.charts.addReading(reading);
  }

  updateSensorADC(adcVal) {
    this.state.currentADC = adcVal;
    if (this.deviceView) this.deviceView.updateSensorReadout(adcVal);
    const sidebarADC = document.getElementById('sidebarAdcVal');
    if (sidebarADC) sidebarADC.textContent = `${adcVal} ADC`;
  }

  startLiveTelemetryLoop() {
    let tickCount = 0;
    setInterval(() => {
      if (!this.state.isScanning && this.state.arduinoConnected) {
        // Subtle Gaussian jitter around current illumination state
        const reading = this.sensorSim.calculateReading(
          this.state.illuminationMode,
          this.state.sampleCondition,
          this.state.spots,
          Date.now()
        );
        this.updateSensorADC(reading.photodiodeADC);
        tickCount++;
        // Stream standard Arduino telemetry format every ~1.2s: MODE=x,SENSOR=yyy
        if (tickCount % 6 === 0 && this.deviceView) {
          this.deviceView.streamSerialTelemetry(this.state.illuminationMode, reading.photodiodeADC);
        }
      }
    }, 200);
  }

  updateScanProgress(pct, statusText) {
    this.state.scanProgress = pct;
    const bar = document.getElementById('scanProgressBar');
    const txt = document.getElementById('scanStatusText');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = statusText;
  }

  updateScanButtonState(isScanning) {
    const btn = document.getElementById('btnSidebarScan');
    const barContainer = document.getElementById('scanProgressContainer');
    if (btn) {
      btn.disabled = isScanning;
      btn.innerHTML = isScanning
        ? `<span class="spinner"></span> Optical Scanning in Progress...`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Optical Scan`;
    }
    if (barContainer) {
      barContainer.style.display = isScanning ? 'block' : 'none';
    }
  }

  updateResultsSummaryCard(res) {
    const card = document.getElementById('resultsSummaryCard');
    if (!card) return;

    if (!res) {
      card.innerHTML = `
        <div class="empty-results-state">
          <div class="empty-icon">🔬</div>
          <div class="empty-title">Ready for Optical Acquisition</div>
          <div class="empty-desc">Click "Start Optical Scan" or trigger Arduino D2 button to begin screening.</div>
        </div>
      `;
      return;
    }

    const inst = INSTRUMENT_DEFINITIONS[res.instrumentId] || {};
    const cond = SAMPLE_CONDITIONS[res.conditionId] || {};

    card.innerHTML = `
      <div class="result-card-inner">
        <div class="result-header">
          <div>
            <span class="result-scan-id font-mono">${res.scanId}</span>
            <h3 class="result-title">${inst.name}</h3>
          </div>
          <div class="badge badge-${res.resultSeverity}">
            ${res.screeningResult}
          </div>
        </div>

        <div class="result-metrics-grid">
          <div class="metric-box">
            <span class="m-label">UV 365nm</span>
            <span class="m-val text-violet font-mono">${res.telemetry.uvIntensity} <span class="m-unit">a.u.</span></span>
          </div>
          <div class="metric-box">
            <span class="m-label">NIR 850nm</span>
            <span class="m-val text-pink font-mono">${res.telemetry.irIntensity} <span class="m-unit">a.u.</span></span>
          </div>
          <div class="metric-box">
            <span class="m-label">Photodiode A0</span>
            <span class="m-val text-cyan font-mono">${res.telemetry.photodiodeADC} <span class="m-unit">ADC</span></span>
          </div>
          <div class="metric-box">
            <span class="m-label">Suspected ROIs</span>
            <span class="m-val text-danger font-mono">${res.candidateRegionsCount} <span class="m-unit">spots</span></span>
          </div>
          <div class="metric-box">
            <span class="m-label">Candidate Area</span>
            <span class="m-val text-danger font-mono">${res.candidateSurfaceRatioPct}%</span>
          </div>
          <div class="metric-box">
            <span class="m-label">Scan Runtime</span>
            <span class="m-val text-muted font-mono">${res.totalProcessingDurationMs} <span class="m-unit">ms</span></span>
          </div>
        </div>

        <div class="result-advisory-box advisory-${res.resultSeverity}">
          <div class="advisory-title">Screening Assessment:</div>
          <div class="advisory-body">${res.advisoryNote}</div>
        </div>

        <!-- Mandatory Disclaimer -->
        <div class="result-disclaimer">
          <strong>SIMULATED DATA — NOT A CLINICAL TEST RESULT:</strong> Labels indicate "Suspected Residue" or "Possible Contamination" only. Does not confirm presence of human blood without chemical assay.
        </div>

        <div class="result-actions-row">
          <button id="btnCardExportCSV" class="btn btn-sm btn-outline">Export CSV</button>
          <button id="btnCardPrintReport" class="btn btn-sm btn-primary">Generate Formal Report</button>
        </div>
      </div>
    `;

    document.getElementById('btnCardExportCSV').addEventListener('click', () => {
      this.reportManager.exportCSV(res);
    });
    document.getElementById('btnCardPrintReport').addEventListener('click', () => {
      this.openReportModal();
    });
  }

  renderResultsHistoryView() {
    const listEl = document.getElementById('historyListContainer');
    if (!listEl) return;

    if (this.state.scanHistory.length === 0) {
      listEl.innerHTML = `<div class="p-8 text-center text-muted">No scan records stored yet. Execute an optical scan to generate history.</div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="history-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Timestamp</th>
              <th>Instrument</th>
              <th>Condition</th>
              <th>UV Fluor.</th>
              <th>NIR Refl.</th>
              <th>Photodiode A0</th>
              <th>Suspected ROIs</th>
              <th>Screening Outcome</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.scanHistory.map((item, idx) => `
              <tr>
                <td class="font-mono text-cyan">${item.scanId}</td>
                <td class="text-xs text-muted">${new Date(item.timestamp).toLocaleTimeString()}</td>
                <td>${item.instrumentId}</td>
                <td><span class="badge badge-outline">${item.conditionId}</span></td>
                <td class="font-mono text-violet">${item.telemetry.uvIntensity}</td>
                <td class="font-mono text-pink">${item.telemetry.irIntensity}</td>
                <td class="font-mono text-cyan">${item.telemetry.photodiodeADC}</td>
                <td class="font-mono text-danger">${item.candidateRegionsCount}</td>
                <td><span class="badge badge-${item.resultSeverity}">${item.screeningResult}</span></td>
                <td>
                  <button class="btn btn-2xs btn-outline btn-load-hist" data-idx="${idx}">Inspect</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const loadButtons = listEl.querySelectorAll('.btn-load-hist');
    loadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const item = this.state.scanHistory[idx];
        if (item) {
          this.state.lastScanResult = item;
          this.selectInstrument(item.instrumentId);
          this.selectCondition(item.conditionId || item.groundTruthCondition);
          this.state.detectionThreshold = item.threshold;

          // Sync main and sidebar threshold sliders
          const tSlider = document.getElementById('thresholdSlider');
          const tText = document.getElementById('thresholdValText');
          if (tSlider) tSlider.value = item.threshold;
          if (tText) tText.textContent = item.threshold;

          const sbSlider = document.getElementById('sidebarThresholdSlider');
          const sbText = document.getElementById('sidebarThresholdVal');
          if (sbSlider) sbSlider.value = item.threshold;
          if (sbText) sbText.textContent = item.threshold;

          this.updateResultsSummaryCard(item);
          if (this.dashboardView) {
            this.dashboardView.updateAllPanels();
          }
          this.switchView('dashboard');
        }
      });
    });
  }

  openReportModal() {
    this.reportManager.openReportModal(this.state.lastScanResult);
  }

  playAudioTone(type) {
    if (!this.state.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'relay') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'complete') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(450, now + 0.12);
        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instantiate on DOM load (handling cases where document is already parsed)
function initApp() {
  if (!window.bloodTrace) {
    window.bloodTrace = new BloodTraceApp();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
