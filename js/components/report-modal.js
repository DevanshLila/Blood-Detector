/**
 * BloodTrace — Results Card, CSV Data Exporter & Printable Engineering Report
 * Formatted to medical engineering prototype standards
 * Mandatory disclaimer: "SIMULATED DATA — NOT A CLINICAL TEST RESULT"
 */

import { INSTRUMENT_DEFINITIONS } from '../models/instruments.js';
import { SAMPLE_CONDITIONS, SensorSimulator } from '../models/sensor-sim.js';
import { ComputerVisionPipeline } from '../models/cv-pipeline.js';

export class ReportManager {
  constructor(appState) {
    this.state = appState;
  }

  /**
   * Generates and downloads a CSV export file
   * @param {Object} scanResult 
   */
  exportCSV(scanResult) {
    if (!scanResult) {
      if (this.state && this.state.selectedInstrument) {
        const cv = new ComputerVisionPipeline();
        const sim = new SensorSimulator(12345);
        scanResult = cv.processScan({
          spots: this.state.spots || [],
          conditionId: this.state.sampleCondition || 'clean',
          threshold: this.state.detectionThreshold || 35,
          uvReading: sim.calculateReading('uv', this.state.sampleCondition || 'clean', this.state.spots || [], 100),
          irReading: sim.calculateReading('ir', this.state.sampleCondition || 'clean', this.state.spots || [], 100)
        });
      } else {
        return;
      }
    }

    const inst = INSTRUMENT_DEFINITIONS[scanResult.instrumentId] || {};
    const cond = SAMPLE_CONDITIONS[scanResult.conditionId] || {};

    const csvRows = [
      ['# ========================================================='],
      ['# BLOODTRACE DUAL-WAVELENGTH MEDICAL SCREENING SIMULATOR'],
      ['# NOTICE: SIMULATED DATA — NOT A CLINICAL TEST RESULT'],
      ['# ========================================================='],
      ['Field', 'Value'],
      ['Scan_ID', scanResult.scanId],
      ['Timestamp_UTC', scanResult.timestamp],
      ['Instrument_Name', inst.name || scanResult.instrumentId],
      ['Instrument_Material', inst.material || 'Stainless Steel'],
      ['Sample_Condition', cond.name || scanResult.conditionId],
      ['Condition_Category', cond.category || 'N/A'],
      ['Detection_Threshold_AU', scanResult.threshold],
      ['Screening_Result', scanResult.screeningResult],
      ['Candidate_Regions_Count', scanResult.candidateRegionsCount],
      ['Total_Candidate_Area_PX', scanResult.totalCandidateAreaPx],
      ['Candidate_Surface_Ratio_PCT', scanResult.candidateSurfaceRatioPct],
      ['UV_365nm_Intensity_AU', scanResult.telemetry.uvIntensity],
      ['IR_850nm_Intensity_AU', scanResult.telemetry.irIntensity],
      ['Photodiode_ADC_Count_10bit', scanResult.telemetry.photodiodeADC],
      ['Photodiode_Voltage_Volts', scanResult.telemetry.photodiodeVoltage],
      ['Processing_Duration_MS', scanResult.totalProcessingDurationMs],
      ['Advisory_Note', `"${(scanResult.advisoryNote || '').replace(/"/g, '""')}"`],
      ['Simulation_Status', 'VALID_SIMULATION_RUN'],
      ['Disclaimer', '"SIMULATED DATA — NOT A CLINICAL TEST RESULT. Screening simulator only; does not provide verified diagnostic confirmation of blood."']
    ];

    if (scanResult.detectedRegions && scanResult.detectedRegions.length > 0) {
      csvRows.push([]);
      csvRows.push(['# --- DETECTED CANDIDATE REGIONS DETAIL ---']);
      csvRows.push(['Region_ID', 'Center_X_Ratio', 'Center_Y_Ratio', 'Radius_PX', 'Area_PX', 'Contrast_Level', 'Signature_Type', 'Classification_Label']);
      scanResult.detectedRegions.forEach(r => {
        csvRows.push([r.id, r.xRatio, r.yRatio, r.radiusPx, r.areaPx, r.contrastLevel, r.signatureType, r.label]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bloodtrace_scan_${scanResult.scanId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Opens the formal printable laboratory engineering report modal
   * @param {Object} scanResult 
   */
  openReportModal(scanResult) {
    if (!scanResult) {
      if (this.state && this.state.selectedInstrument) {
        const cv = new ComputerVisionPipeline();
        const sim = new SensorSimulator(12345);
        scanResult = cv.processScan({
          spots: this.state.spots || [],
          conditionId: this.state.sampleCondition || 'clean',
          threshold: this.state.detectionThreshold || 35,
          uvReading: sim.calculateReading('uv', this.state.sampleCondition || 'clean', this.state.spots || [], 100),
          irReading: sim.calculateReading('ir', this.state.sampleCondition || 'clean', this.state.spots || [], 100)
        });
      } else {
        return;
      }
    }

    const inst = INSTRUMENT_DEFINITIONS[scanResult.instrumentId] || {};
    const cond = SAMPLE_CONDITIONS[scanResult.conditionId] || {};

    // Get snapshot data URLs from canvases if available
    const canvasCandidate = document.getElementById('canvasCandidate');
    const canvasUv = document.getElementById('canvasUv');
    const canvasIr = document.getElementById('canvasIr');
    const canvasRef = document.getElementById('canvasRef');

    const candidateImgUrl = canvasCandidate ? canvasCandidate.toDataURL() : '';
    const uvImgUrl = canvasUv ? canvasUv.toDataURL() : '';
    const irImgUrl = canvasIr ? canvasIr.toDataURL() : '';
    const refImgUrl = canvasRef ? canvasRef.toDataURL() : '';

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'reportModalBackdrop';

    modalBackdrop.innerHTML = `
      <div class="report-modal-content">
        <div class="report-modal-header no-print">
          <div class="flex items-center gap-2">
            <span class="report-icon">📄</span>
            <h3 class="modal-title">BloodTrace — Screening Inspection Report</h3>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnPrintReport" class="btn btn-sm btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print / Save PDF
            </button>
            <button id="btnExportReportCSV" class="btn btn-sm btn-outline">Export CSV</button>
            <button id="btnCloseReport" class="btn btn-sm btn-ghost">✕ Close</button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div class="printable-document">
          <!-- Document Header -->
          <div class="doc-header">
            <div class="doc-header-brand">
              <div class="doc-logo font-mono font-bold text-lg">BLOODTRACE LABS</div>
              <div class="doc-subtitle">Optical Instrument Contamination Screening Prototype</div>
              <div class="doc-dept">Department of Biomedical & Optical Engineering</div>
            </div>
            <div class="doc-header-meta">
              <div><strong>REPORT ID:</strong> ${scanResult.scanId}</div>
              <div><strong>DATE:</strong> ${new Date(scanResult.timestamp).toLocaleString()}</div>
              <div><strong>SYSTEM:</strong> BloodTrace-UNO-R4 / FW 1.4</div>
              <div class="doc-status-badge">SIMULATION EXPERIMENT</div>
            </div>
          </div>

          <!-- Mandatory Prominent Disclaimer Banner -->
          <div class="doc-disclaimer-banner">
            <strong>⚠ SCIENTIFIC NOTICE & REGULATORY DISCLAIMER:</strong>
            <span>SIMULATED DATA — NOT A CLINICAL TEST RESULT. This system is a college-level engineering simulation of an optical screening prototype. Any detected regions represent "Suspected Residue" or "Possible Contamination" based solely on optical absorption and autofluorescence differentials. It does not provide validated biological confirmation of human blood or pathogen load. Chemical protein verification is required.</span>
          </div>

          <!-- Section 1: Specimen Metadata & Calibration -->
          <div class="doc-section">
            <h4 class="doc-section-title">1. Specimen & Test Parameters</h4>
            <table class="doc-table">
              <tr>
                <th>Medical Instrument</th>
                <td>${inst.name || scanResult.instrumentId}</td>
                <th>Material Specification</th>
                <td>${inst.material || 'AISI 316L Stainless Steel'}</td>
              </tr>
              <tr>
                <th>Sample Condition</th>
                <td>${cond.name || scanResult.conditionId}</td>
                <th>Condition Category</th>
                <td>${cond.category || 'Biological / Chemical'}</td>
              </tr>
              <tr>
                <th>Detection Threshold</th>
                <td>${scanResult.threshold} a.u. (Adaptive Contrast)</td>
                <th>Instrument Dimensions</th>
                <td>${inst.dimensions || 'Standard SPD Tray'}</td>
              </tr>
            </table>
          </div>

          <!-- Section 2: Quad-Wavelength Image Gallery -->
          <div class="doc-section">
            <h4 class="doc-section-title">2. Multi-Spectral Optical Imaging</h4>
            <div class="doc-quad-gallery">
              <div class="doc-image-box">
                <img src="${refImgUrl}" alt="Reference Image" />
                <div class="doc-img-caption">Panel A: Clean Reference Baseline</div>
              </div>
              <div class="doc-image-box">
                <img src="${uvImgUrl}" alt="UV Image" />
                <div class="doc-img-caption">Panel B: 365 nm UV-A Autofluorescence</div>
              </div>
              <div class="doc-image-box">
                <img src="${irImgUrl}" alt="IR Image" />
                <div class="doc-img-caption">Panel C: 850 nm NIR Absorption</div>
              </div>
              <div class="doc-image-box">
                <img src="${candidateImgUrl}" alt="Candidate Residue Map" />
                <div class="doc-img-caption">Panel D: Processed Candidate Residue Map</div>
              </div>
            </div>
          </div>

          <!-- Section 3: Telemetry & Photodiode Sensor Data -->
          <div class="doc-section">
            <h4 class="doc-section-title">3. Sensor Telemetry & Optical Metrics</h4>
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Sensor Channel</th>
                  <th>Emitter Wavelength</th>
                  <th>Hardware Pin</th>
                  <th>Measured Signal (a.u.)</th>
                  <th>Photodiode Output</th>
                  <th>Diagnostic Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UV Channel</td>
                  <td>365 nm (UV-A LED)</td>
                  <td>D9 (MOSFET Gate)</td>
                  <td>${scanResult.telemetry.uvIntensity} a.u.</td>
                  <td>Amplified TIA</td>
                  <td>${scanResult.telemetry.uvIntensity > 100 ? 'High Fluorescence (Detergent Warning)' : 'Nominal Range'}</td>
                </tr>
                <tr>
                  <td>NIR Channel</td>
                  <td>850 nm (IR LED)</td>
                  <td>D10 (MOSFET Gate)</td>
                  <td>${scanResult.telemetry.irIntensity} a.u.</td>
                  <td>Peak BPW34 Sensitivity</td>
                  <td>${scanResult.telemetry.irIntensity < 600 ? 'Significant NIR Absorption (Heme Candidate)' : 'Specular Baseline'}</td>
                </tr>
                <tr>
                  <td>Photodiode ADC</td>
                  <td>Broadband (430-1100 nm)</td>
                  <td>A0 (10-bit ADC)</td>
                  <td>${scanResult.telemetry.photodiodeADC} / 1023</td>
                  <td>${scanResult.telemetry.photodiodeVoltage} Volts</td>
                  <td>Baseline: 195 ADC (~0.95V)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 4: Screening Conclusion & Recommendation -->
          <div class="doc-section">
            <h4 class="doc-section-title">4. Screening Result & Recommendation</h4>
            <div class="doc-result-banner banner-${scanResult.resultSeverity}">
              <div class="result-headline">
                <span class="result-label">PRE-STERILIZATION SCREENING OUTCOME:</span>
                <span class="result-value">${scanResult.screeningResult}</span>
              </div>
              <p class="result-advisory">${scanResult.advisoryNote}</p>
            </div>

            <div class="doc-metrics-row">
              <div class="doc-metric-card">
                <div class="metric-num">${scanResult.candidateRegionsCount}</div>
                <div class="metric-label">Suspected Candidate Regions</div>
              </div>
              <div class="doc-metric-card">
                <div class="metric-num">${scanResult.totalCandidateAreaPx} px²</div>
                <div class="metric-label">Approximate Candidate Area</div>
              </div>
              <div class="doc-metric-card">
                <div class="metric-num">${scanResult.candidateSurfaceRatioPct}%</div>
                <div class="metric-label">% of Instrument Surface</div>
              </div>
              <div class="doc-metric-card">
                <div class="metric-num">${scanResult.totalProcessingDurationMs} ms</div>
                <div class="metric-label">CV Pipeline Runtime</div>
              </div>
            </div>
          </div>

          <!-- Sign-off Block -->
          <div class="doc-signoff-block">
            <div class="signoff-col">
              <div class="signoff-line"></div>
              <div class="signoff-role">Lead Student Engineer / Operator</div>
            </div>
            <div class="signoff-col">
              <div class="signoff-line"></div>
              <div class="signoff-role">Laboratory Supervisor / Professor Reviewer</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Bind modal actions
    document.getElementById('btnCloseReport').addEventListener('click', () => {
      modalBackdrop.remove();
    });

    document.getElementById('btnPrintReport').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnExportReportCSV').addEventListener('click', () => {
      this.exportCSV(scanResult);
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    });
  }
}
