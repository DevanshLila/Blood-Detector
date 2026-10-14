/**
 * BloodTrace — Built-in Demonstration Scenario Engine
 * Guided 9-Step Engineering Walkthrough for Academic/Professor Presentation
 */

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Step 1: Baseline Calibration with Clean Forceps',
    description: 'We load a clean, passivated AISI 316L stainless-steel tissue forceps into the optical chamber. Before testing contaminated items, we establish the clean baseline.',
    action: (app) => {
      app.selectInstrument('forceps');
      app.selectCondition('clean');
      app.switchView('device');
      app.setIlluminationMode('off');
    }
  },
  {
    step: 2,
    title: 'Step 2: Baseline Scan Execution',
    description: 'Running the dual-wavelength screening scan. Notice the photodiode records standard baseline specular reflection under 850nm (~760 a.u.) and minimal autofluorescence under 365nm (~18 a.u.). The screening result reports "No significant optical difference detected".',
    action: async (app) => {
      await app.startScan();
      app.switchView('dashboard');
    }
  },
  {
    step: 3,
    title: 'Step 3: Introducing Simulated Dried Blood Residue',
    description: 'We now apply a simulated dried blood droplet onto the forceps grasping shank. In clinical settings, blood coagulates into a dark matrix containing hemoglobin and porphyrin derivatives.',
    action: (app) => {
      app.selectCondition('blood_dried');
      app.switchView('dashboard');
    }
  },
  {
    step: 4,
    title: 'Step 4: Scanning Contaminated Instrument',
    description: 'Executing the optical scan. Observe the rapid drop in reflected 850nm NIR intensity: heme absorbs near-infrared light strongly compared to bare stainless steel. Photodiode ADC count drops from ~760 to ~530.',
    action: async (app) => {
      await app.startScan();
      app.switchView('dashboard');
    }
  },
  {
    step: 5,
    title: 'Step 5: Comparing UV vs. NIR Optical Contrasts',
    description: 'Inspect Panel B (365nm UV) and Panel C (850nm NIR). Under NIR, the blood spot creates a stark dark absorption silhouette. Under UV, blood creates strong Soret absorption with faint edge fluorescence.',
    action: (app) => {
      app.switchView('dashboard');
      if (app.dashboardView) app.dashboardView.setLayout('grid');
    }
  },
  {
    step: 6,
    title: 'Step 6: Candidate Residue Map Overlay (Panel D)',
    description: 'The computer vision pipeline computes the Normalized Dual-Wavelength Difference Index (NDI), applies morphological filtering to remove photon noise, and draws red outline contours with a "Suspected Residue" label.',
    action: (app) => {
      app.switchView('dashboard');
      if (app.dashboardView) {
        app.dashboardView.showOverlay = true;
        app.dashboardView.showBoundingBoxes = true;
        app.dashboardView.updateCandidatePanel();
      }
    }
  },
  {
    step: 7,
    title: 'Step 7: Confounder Test — Residual Washer Detergent',
    description: 'Now we test a common CSSD false positive: enzymatic cleaning detergent residue. Detergent contains optical brighteners and surfactants that fluoresce intensely under UV light.',
    action: (app) => {
      app.selectCondition('detergent');
      app.switchView('dashboard');
    }
  },
  {
    step: 8,
    title: 'Step 8: Optical Ambiguity Demonstrated',
    description: 'Notice that detergent fluoresces brightly under 365nm UV (~240 a.u.), but shows near-zero absorption in the 850nm NIR channel. The system flags this as: "Ambiguous result — manual inspection required" rather than confirmed blood!',
    action: async (app) => {
      await app.startScan();
      app.switchView('dashboard');
    }
  },
  {
    step: 9,
    title: 'Step 9: Engineering & Regulatory Conclusion',
    description: 'Conclusion: Optical screening provides rapid, non-destructive localization of suspected residue, but optical confounders (e.g. detergents, mineral marks) necessitate chemical validation (protein swabs) before clinical confirmation.',
    action: (app) => {
      app.openReportModal();
    }
  }
];

export class DemoManager {
  constructor(appInstance) {
    this.app = appInstance;
    this.currentStepIndex = 0;
    this.isActive = false;
    this.demoBannerEl = null;
  }

  start() {
    this.isActive = true;
    this.currentStepIndex = 0;
    this.renderBanner();
    this.executeStep(0);
  }

  stop() {
    this.isActive = false;
    if (this.demoBannerEl) {
      this.demoBannerEl.remove();
      this.demoBannerEl = null;
    }
  }

  renderBanner() {
    if (this.demoBannerEl) this.demoBannerEl.remove();

    this.demoBannerEl = document.createElement('div');
    this.demoBannerEl.className = 'demo-banner';
    document.body.appendChild(this.demoBannerEl);
    this.updateBannerContent();
  }

  updateBannerContent() {
    if (!this.demoBannerEl) return;
    const step = DEMO_STEPS[this.currentStepIndex];

    this.demoBannerEl.innerHTML = `
      <div class="demo-banner-content">
        <div class="demo-badge">
          <span class="demo-pulse"></span>
          DEMO MODE: STEP ${step.step} OF ${DEMO_STEPS.length}
        </div>
        <div class="demo-text-block">
          <h4 class="demo-step-title">${step.title}</h4>
          <p class="demo-step-desc">${step.description}</p>
        </div>
        <div class="demo-actions">
          <button id="btnDemoPrev" class="btn btn-xs btn-outline" ${this.currentStepIndex === 0 ? 'disabled' : ''}>← Previous</button>
          <button id="btnDemoNext" class="btn btn-xs btn-primary">${this.currentStepIndex === DEMO_STEPS.length - 1 ? 'Finish Demo' : 'Next Step →'}</button>
          <button id="btnDemoExit" class="btn btn-xs btn-ghost text-muted">Exit Demo</button>
        </div>
      </div>
    `;

    document.getElementById('btnDemoPrev').addEventListener('click', () => this.prevStep());
    document.getElementById('btnDemoNext').addEventListener('click', () => this.nextStep());
    document.getElementById('btnDemoExit').addEventListener('click', () => this.stop());
  }

  async executeStep(index) {
    if (index < 0 || index >= DEMO_STEPS.length) return;
    this.currentStepIndex = index;
    this.updateBannerContent();
    const step = DEMO_STEPS[index];
    if (step.action) {
      await step.action(this.app);
    }
  }

  nextStep() {
    if (this.currentStepIndex < DEMO_STEPS.length - 1) {
      this.executeStep(this.currentStepIndex + 1);
    } else {
      this.stop();
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.executeStep(this.currentStepIndex - 1);
    }
  }
}
