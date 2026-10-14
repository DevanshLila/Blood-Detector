/**
 * BloodTrace — Device Simulation Component
 * Matte-black optical screening enclosure, UV/IR light paths, sample tray,
 * Arduino UNO R4 Minima virtual board, wiring diagram, and virtual serial monitor
 */

import { drawInstrument } from '../models/instruments.js';
import { drawSimulatedContamination } from '../models/sensor-sim.js';

export class DeviceView {
  constructor(containerId, appState) {
    this.container = document.getElementById(containerId);
    this.state = appState;
    this.serialLogs = [];
    this.serialAutoscroll = true;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="device-view-grid">
        <!-- Left: Physical Optical Screening Enclosure -->
        <div class="panel enclosure-panel">
          <div class="panel-header">
            <div class="flex items-center gap-2">
              <span class="status-indicator ${this.state.illuminationMode !== 'off' ? 'active' : ''}"></span>
              <h2 class="panel-title">BloodTrace Optical Screening Enclosure</h2>
            </div>
            <div class="panel-badge">Dual-Wavelength Prototype (365nm / 850nm)</div>
          </div>

          <div class="enclosure-viewport-wrapper">
            <!-- Canvas for Physical Chamber & Optical Rays -->
            <canvas id="deviceChamberCanvas" width="800" height="480" class="chamber-canvas"></canvas>

            <!-- Chamber Overlay HUD -->
            <div class="chamber-hud-overlay">
              <div class="hud-item">
                <span class="hud-label">EMITTER 1 (UV):</span>
                <span id="hudUvState" class="hud-val ${this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? 'text-violet' : 'text-muted'}">
                  ${this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? '365nm [ACTIVE]' : 'STANDBY'}
                </span>
              </div>
              <div class="hud-item">
                <span class="hud-label">EMITTER 2 (NIR):</span>
                <span id="hudIrState" class="hud-val ${this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? 'text-pink' : 'text-muted'}">
                  ${this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? '850nm [ACTIVE]' : 'STANDBY'}
                </span>
              </div>
              <div class="hud-item">
                <span class="hud-label">BPW34 SENSOR:</span>
                <span id="hudSensorADC" class="hud-val text-cyan">A0: ${this.state.currentADC || 195} ADC</span>
              </div>
            </div>

            <!-- Note on IR invisibility -->
            <div class="optical-physics-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Note: 850 nm NIR beam is imperceptible to the human eye; magenta beam halo depicts camera sensor sensitivity.</span>
            </div>
          </div>

          <!-- Enclosure Hardware Controls -->
          <div class="enclosure-controls-bar">
            <div class="control-group">
              <label class="control-label">Illumination Mode</label>
              <div class="btn-group">
                <button id="btnModeOff" class="btn btn-sm ${this.state.illuminationMode === 'off' ? 'btn-active' : ''}">OFF</button>
                <button id="btnModeUv" class="btn btn-sm ${this.state.illuminationMode === 'uv' ? 'btn-active-uv' : ''}">365nm UV</button>
                <button id="btnModeIr" class="btn btn-sm ${this.state.illuminationMode === 'ir' ? 'btn-active-ir' : ''}">850nm NIR</button>
                <button id="btnModeCombined" class="btn btn-sm ${this.state.illuminationMode === 'combined' ? 'btn-active-combined' : ''}">UV + NIR</button>
              </div>
            </div>

            <div class="control-group">
              <label class="control-label">Optical Head Shutter</label>
              <button id="btnToggleChamberLid" class="btn btn-sm btn-outline">
                ${this.state.chamberLidOpen ? 'Close Lid (Light-Tight)' : 'Open Lid (Service)'}
              </button>
            </div>

            <div class="control-group">
              <label class="control-label">Trigger Scan</label>
              <button id="btnTriggerScan" class="btn btn-primary btn-sm flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Optical Scan
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Arduino UNO R4 Minima & Schematic & Serial Monitor -->
        <div class="device-electronics-column">
          <!-- Arduino UNO R4 Minima Virtual Board -->
          <div class="panel arduino-panel">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <div class="arduino-teal-icon"></div>
                <h3 class="panel-title">Arduino UNO R4 Minima</h3>
              </div>
              <div class="flex items-center gap-2">
                <span id="arduinoConnBadge" class="badge ${this.state.arduinoConnected ? 'badge-success' : 'badge-danger'}">
                  ${this.state.arduinoConnected ? 'USB Connected' : 'DISCONNECTED'}
                </span>
                <button id="btnToggleArduinoConn" class="btn btn-xs btn-outline">
                  ${this.state.arduinoConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            <!-- Virtual Arduino Canvas / Interactive Visual Board -->
            <div class="arduino-board-container">
              <canvas id="arduinoBoardCanvas" width="480" height="260" class="arduino-canvas"></canvas>
            </div>

            <!-- Pin State Readouts -->
            <div class="pin-status-grid">
              <div class="pin-badge ${this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? 'pin-high' : 'pin-low'}">
                <span class="pin-name">D9 (UV Gate)</span>
                <span class="pin-val">${this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? 'HIGH (1)' : 'LOW (0)'}</span>
              </div>
              <div class="pin-badge ${this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? 'pin-high' : 'pin-low'}">
                <span class="pin-name">D10 (IR Gate)</span>
                <span class="pin-val">${this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? 'HIGH (1)' : 'LOW (0)'}</span>
              </div>
              <div class="pin-badge pin-analog">
                <span class="pin-name">A0 (BPW34 Amp)</span>
                <span id="pinA0Val" class="pin-val">${this.state.currentADC || 195} ADC</span>
              </div>
              <div class="pin-badge ${this.state.isScanning ? 'pin-active-btn' : 'pin-pullup'}">
                <span class="pin-name">D2 (Trigger Btn)</span>
                <span class="pin-val">${this.state.isScanning ? 'LOW (GND)' : 'PULLUP'}</span>
              </div>
            </div>
          </div>

          <!-- Simplified Circuit Schematic -->
          <div class="panel schematic-panel">
            <div class="panel-header">
              <h3 class="panel-title">Hardware Interface Schematic</h3>
              <button id="btnToggleSchematic" class="btn btn-xs btn-ghost text-cyan">View Details</button>
            </div>
            <div class="schematic-container">
              <svg viewBox="0 0 460 140" class="schematic-svg">
                <!-- Power Rails -->
                <line x1="20" y1="20" x2="440" y2="20" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3"/>
                <text x="25" y="15" fill="#f87171" font-size="9" font-family="monospace">+5V VCC RAIL</text>
                <line x1="20" y1="125" x2="440" y2="125" stroke="#64748b" stroke-width="1.5"/>
                <text x="25" y="136" fill="#94a3b8" font-size="9" font-family="monospace">GND COMMON</text>

                <!-- D9 Circuit (UV MOSFET) -->
                <rect x="70" y="35" width="80" height="70" rx="4" fill="#1e2235" stroke="#6366f1" stroke-width="1"/>
                <text x="76" y="50" fill="#a5b4fc" font-size="9" font-family="monospace">D9 (PWM)</text>
                <text x="76" y="65" fill="#e2e8f0" font-size="8">1kΩ Gate Res.</text>
                <text x="76" y="80" fill="#cbd5e1" font-size="8">IRLZ44N MOSFET</text>
                <text x="76" y="95" fill="#c084fc" font-size="8">365nm UV LED</text>

                <!-- D10 Circuit (IR MOSFET) -->
                <rect x="180" y="35" width="80" height="70" rx="4" fill="#1e2235" stroke="#ec4899" stroke-width="1"/>
                <text x="186" y="50" fill="#f472b6" font-size="9" font-family="monospace">D10 (PWM)</text>
                <text x="186" y="65" fill="#e2e8f0" font-size="8">1kΩ Gate Res.</text>
                <text x="186" y="80" fill="#cbd5e1" font-size="8">IRLZ44N MOSFET</text>
                <text x="186" y="95" fill="#f43f5e" font-size="8">850nm IR LED</text>

                <!-- A0 Circuit (Photodiode + Op-Amp) -->
                <rect x="290" y="35" width="85" height="70" rx="4" fill="#1e2235" stroke="#06b6d4" stroke-width="1"/>
                <text x="296" y="50" fill="#67e8f9" font-size="9" font-family="monospace">A0 (Analog)</text>
                <text x="296" y="65" fill="#e2e8f0" font-size="8">BPW34 PIN Diode</text>
                <text x="296" y="80" fill="#cbd5e1" font-size="8">MCP6002 TIA Amp</text>
                <text x="296" y="95" fill="#38bdf8" font-size="8">Rf = 1.2 MΩ</text>

                <!-- D2 Push Button -->
                <rect x="390" y="45" width="45" height="50" rx="4" fill="#1e2235" stroke="#eab308" stroke-width="1"/>
                <text x="394" y="62" fill="#fde047" font-size="8" font-family="monospace">D2 BTN</text>
                <text x="394" y="77" fill="#cbd5e1" font-size="7">PULLUP</text>
              </svg>
            </div>
          </div>

            <!-- Virtual Serial Monitor -->
          <div class="panel serial-panel">
            <div class="panel-header">
              <div class="flex items-center gap-2">
                <span class="status-dot"></span>
                <h3 class="panel-title">Virtual Serial Monitor</h3>
                <span class="text-xs text-muted font-mono">(115200 baud)</span>
              </div>
              <div class="flex items-center gap-2">
                <button id="btnClearSerial" class="btn btn-xs btn-ghost text-muted">Clear</button>
                <label class="serial-autoscroll-label">
                  <input type="checkbox" id="chkAutoScroll" checked /> Auto-scroll
                </label>
              </div>
            </div>

            <!-- Prominent Disconnection Warning -->
            <div id="serialDisconnectWarning" class="serial-disconnect-banner" style="display: ${this.state.arduinoConnected ? 'none' : 'block'};">
              ⚠ USB SERIAL DISCONNECTED — HARDWARE TELEMETRY HALTED
            </div>
            
            <div id="serialConsoleOutput" class="serial-console-body">
              <div class="serial-line info">[SYS] BloodTrace Controller v1.4 Initialized.</div>
              <div class="serial-line info">[SYS] Arduino UNO R4 Minima (RA4M1 @ 48MHz) Online.</div>
              <div class="serial-line info">[SYS] Transimpedance Photodiode Amp connected to A0.</div>
              <div class="serial-line info">[SYS] Virtual Software Model — No Physical Hardware Required.</div>
            </div>

            <div class="serial-input-bar">
              <span class="serial-prompt">&gt;</span>
              <input type="text" id="serialCmdInput" placeholder="Send serial command (e.g. SCAN, MODE=1, CALIB)..." />
              <button id="btnSendSerial" class="btn btn-xs btn-primary">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateChamberCanvas();
    this.updateArduinoCanvas();
  }

  bindEvents() {
    // Mode buttons
    const btnOff = document.getElementById('btnModeOff');
    const btnUv = document.getElementById('btnModeUv');
    const btnIr = document.getElementById('btnModeIr');
    const btnCombined = document.getElementById('btnModeCombined');

    if (btnOff) btnOff.addEventListener('click', () => this.setIlluminationMode('off'));
    if (btnUv) btnUv.addEventListener('click', () => this.setIlluminationMode('uv'));
    if (btnIr) btnIr.addEventListener('click', () => this.setIlluminationMode('ir'));
    if (btnCombined) btnCombined.addEventListener('click', () => this.setIlluminationMode('combined'));

    // Trigger Scan button
    const btnTrigger = document.getElementById('btnTriggerScan');
    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => {
        if (this.onScanRequested) this.onScanRequested();
      });
    }

    // Lid toggle
    const btnLid = document.getElementById('btnToggleChamberLid');
    if (btnLid) {
      btnLid.addEventListener('click', () => {
        this.state.chamberLidOpen = !this.state.chamberLidOpen;
        btnLid.textContent = this.state.chamberLidOpen ? 'Close Lid (Light-Tight)' : 'Open Lid (Service)';
        this.logSerial(`[CHAMBER] Lid interlock state changed: ${this.state.chamberLidOpen ? 'OPEN (Ambient Light Alert)' : 'SEALED (Light-Tight)'}`);
        this.updateChamberCanvas();
      });
    }

    // Arduino Connection toggle
    const btnConn = document.getElementById('btnToggleArduinoConn');
    if (btnConn) {
      btnConn.addEventListener('click', () => {
        this.state.arduinoConnected = !this.state.arduinoConnected;
        const badge = document.getElementById('arduinoConnBadge');
        const warnBanner = document.getElementById('serialDisconnectWarning');
        if (badge) {
          badge.className = `badge ${this.state.arduinoConnected ? 'badge-success' : 'badge-danger'}`;
          badge.textContent = this.state.arduinoConnected ? 'USB Connected' : 'DISCONNECTED';
        }
        btnConn.textContent = this.state.arduinoConnected ? 'Disconnect' : 'Connect';
        if (this.state.arduinoConnected) {
          if (warnBanner) warnBanner.style.display = 'none';
          this.logSerial('[SYS] USB Virtual COM Port Connected (COM4 @ 115200bps). Ready.');
        } else {
          if (warnBanner) warnBanner.style.display = 'block';
          this.logSerial('[ERR] USB Serial Connection Lost! Hardware communication halted.');
        }
        this.updateArduinoCanvas();
      });
    }

    // Interactive Click on Chamber Canvas Sample Platform
    const chamberCanvas = document.getElementById('deviceChamberCanvas');
    if (chamberCanvas) {
      chamberCanvas.addEventListener('click', (e) => {
        const rect = chamberCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const w = chamberCanvas.width;
        const h = chamberCanvas.height;

        // Platform geometry inside chamber canvas
        const trayY = h * 0.60;
        const trayH = h * 0.32;
        const trayW = w * 0.82;
        const trayX = (w - trayW) / 2;

        const scaleX = w / rect.width;
        const scaleY = h / rect.height;
        const canvasX = clickX * scaleX;
        const canvasY = clickY * scaleY;

        if (canvasX >= trayX && canvasX <= trayX + trayW && canvasY >= trayY && canvasY <= trayY + trayH) {
          const xRatio = Math.max(0.05, Math.min(0.95, (canvasX - trayX) / trayW));
          const yRatio = Math.max(0.10, Math.min(0.90, (canvasY - trayY) / trayH));
          if (this.onSpotPlaced) {
            this.onSpotPlaced(xRatio, yRatio);
          }
        }
      });
    }

    // Serial Send
    const btnSend = document.getElementById('btnSendSerial');
    const cmdInput = document.getElementById('serialCmdInput');
    const sendCommand = () => {
      if (!cmdInput || !cmdInput.value.trim()) return;
      const cmd = cmdInput.value.trim().toUpperCase();
      this.handleUserSerialCommand(cmd);
      cmdInput.value = '';
    };

    if (btnSend) btnSend.addEventListener('click', sendCommand);
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCommand();
      });
    }

    // Clear serial
    const btnClear = document.getElementById('btnClearSerial');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const consoleEl = document.getElementById('serialConsoleOutput');
        if (consoleEl) consoleEl.innerHTML = '';
      });
    }

    // Autoscroll checkbox
    const chkAuto = document.getElementById('chkAutoScroll');
    if (chkAuto) {
      chkAuto.addEventListener('change', (e) => {
        this.serialAutoscroll = e.target.checked;
      });
    }
  }

  streamSerialTelemetry(mode, adcVal) {
    if (!this.state.arduinoConnected) return;
    const modeCode = mode === 'off' ? 0 : (mode === 'uv' ? 1 : (mode === 'ir' ? 2 : 3));
    this.logSerial(`MODE=${modeCode},SENSOR=${adcVal}`);
  }

  setIlluminationMode(mode) {
    if (!this.state.arduinoConnected) {
      this.logSerial('[WARN] Cannot change illumination mode: Arduino disconnected. Click Connect.');
      return;
    }
    this.state.illuminationMode = mode;
    this.updateModeUI();
    this.updateChamberCanvas();
    this.updateArduinoCanvas();

    // Log to virtual serial in required standard Arduino telemetry format
    const modeCode = mode === 'off' ? 0 : (mode === 'uv' ? 1 : (mode === 'ir' ? 2 : 3));
    this.logSerial(`MODE=${modeCode},SENSOR=${this.state.currentADC || 195}`);
    if (this.onModeChanged) this.onModeChanged(mode);
  }

  updateModeUI() {
    const btnOff = document.getElementById('btnModeOff');
    const btnUv = document.getElementById('btnModeUv');
    const btnIr = document.getElementById('btnModeIr');
    const btnCombined = document.getElementById('btnModeCombined');

    if (btnOff) btnOff.className = `btn btn-sm ${this.state.illuminationMode === 'off' ? 'btn-active' : ''}`;
    if (btnUv) btnUv.className = `btn btn-sm ${this.state.illuminationMode === 'uv' ? 'btn-active-uv' : ''}`;
    if (btnIr) btnIr.className = `btn btn-sm ${this.state.illuminationMode === 'ir' ? 'btn-active-ir' : ''}`;
    if (btnCombined) btnCombined.className = `btn btn-sm ${this.state.illuminationMode === 'combined' ? 'btn-active-combined' : ''}`;

    const hudUv = document.getElementById('hudUvState');
    const hudIr = document.getElementById('hudIrState');
    if (hudUv) {
      hudUv.className = `hud-val ${this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? 'text-violet' : 'text-muted'}`;
      hudUv.textContent = this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined' ? '365nm [ACTIVE]' : 'STANDBY';
    }
    if (hudIr) {
      hudIr.className = `hud-val ${this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? 'text-pink' : 'text-muted'}`;
      hudIr.textContent = this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined' ? '850nm [ACTIVE]' : 'STANDBY';
    }
  }

  updateSensorReadout(adcVal) {
    this.state.currentADC = adcVal;
    const hudSensor = document.getElementById('hudSensorADC');
    if (hudSensor) hudSensor.textContent = `A0: ${adcVal} ADC`;
    const pinA0 = document.getElementById('pinA0Val');
    if (pinA0) pinA0.textContent = `${adcVal} ADC`;
  }

  logSerial(message) {
    if (!this.state.arduinoConnected && !message.includes('[ERR]') && !message.includes('[SYS]')) return;

    const consoleEl = document.getElementById('serialConsoleOutput');
    if (!consoleEl) return;

    const timeStr = new Date().toTimeString().split(' ')[0] + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
    const line = document.createElement('div');
    line.className = 'serial-line';
    if (message.startsWith('[ERR]')) line.classList.add('error');
    else if (message.startsWith('[WARN]')) line.classList.add('warn');
    else if (message.startsWith('CMD:')) line.classList.add('cmd');
    else if (message.startsWith('[SYS]')) line.classList.add('info');

    line.innerHTML = `<span class="serial-timestamp">${timeStr}</span> ${escapeHtml(message)}`;
    consoleEl.appendChild(line);

    if (this.serialAutoscroll) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  handleUserSerialCommand(cmd) {
    this.logSerial(`> ${cmd}`);
    if (cmd === 'HELP') {
      this.logSerial('Commands: SCAN (trigger scan), MODE=0 (off), MODE=1 (uv), MODE=2 (ir), MODE=3 (combined), CALIB (zero A0), STATUS');
    } else if (cmd === 'SCAN' || cmd === 'START') {
      if (this.onScanRequested) this.onScanRequested();
    } else if (cmd.startsWith('MODE=')) {
      const m = cmd.split('=')[1];
      if (m === '0') this.setIlluminationMode('off');
      else if (m === '1') this.setIlluminationMode('uv');
      else if (m === '2') this.setIlluminationMode('ir');
      else if (m === '3') this.setIlluminationMode('combined');
    } else if (cmd === 'CALIB') {
      this.logSerial('[CALIB] Zero offset recorded on A0. Baseline=195 ADC.');
    } else if (cmd === 'STATUS') {
      this.logSerial(`[STATUS] FW=1.4, D9=${this.state.illuminationMode==='uv'||this.state.illuminationMode==='combined'?1:0}, D10=${this.state.illuminationMode==='ir'||this.state.illuminationMode==='combined'?1:0}, A0=${this.state.currentADC||195}`);
    } else {
      this.logSerial(`[ERR] Unknown command '${cmd}'. Type HELP for list.`);
    }
  }

  /**
   * Renders the Matte-Black Optical Chamber & Light Rays
   */
  updateChamberCanvas() {
    const canvas = document.getElementById('deviceChamberCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Dark matte-black enclosure interior
    const chamberGrad = ctx.createLinearGradient(0, 0, 0, h);
    chamberGrad.addColorStop(0, '#0e1118');
    chamberGrad.addColorStop(0.5, '#131824');
    chamberGrad.addColorStop(1, '#090b10');
    ctx.fillStyle = chamberGrad;
    ctx.fillRect(0, 0, w, h);

    // Enclosure chassis frame
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // 2. Optical Head Assembly at the top
    const headX = w * 0.50;
    const headY = 40;

    // Top mounting rail
    ctx.fillStyle = '#1e222d';
    ctx.fillRect(w * 0.15, 10, w * 0.70, 20);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.15, 10, w * 0.70, 20);

    // Camera Lens Assembly (Center)
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX, headY + 15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Camera glass lens reflection
    const lensGrad = ctx.createRadialGradient(headX - 6, headY + 9, 2, headX, headY + 15, 18);
    lensGrad.addColorStop(0, '#22d3ee');
    lensGrad.addColorStop(0.4, '#0891b2');
    lensGrad.addColorStop(0.9, '#082f49');
    lensGrad.addColorStop(1, '#020617');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(headX, headY + 15, 16, 0, Math.PI * 2);
    ctx.fill();

    // Camera active indicator LED
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(headX + 16, headY + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // UV LED Emitter (Left of camera at 365 nm)
    const uvLedX = headX - 80;
    const uvLedY = headY + 10;
    const isUvOn = this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined';
    drawEmitterLED(ctx, uvLedX, uvLedY, '365nm UV', isUvOn ? '#8b5cf6' : '#312e81', isUvOn);

    // IR LED Emitter Array (Right of camera at 850 nm)
    const irLedX1 = headX + 70;
    const irLedX2 = headX + 100;
    const irLedY = headY + 10;
    const isIrOn = this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined';
    drawEmitterLED(ctx, irLedX1, irLedY, '850nm IR1', isIrOn ? '#f43f5e' : '#881337', isIrOn);
    drawEmitterLED(ctx, irLedX2, irLedY, '850nm IR2', isIrOn ? '#f43f5e' : '#881337', isIrOn);

    // BPW34 Photodiode Sensor Module (Aperture angled towards sample)
    const pdX = headX - 140;
    const pdY = headY + 12;
    drawPhotodiodeSensor(ctx, pdX, pdY);

    // 3. Optical Light Rays Projection
    const targetY = h * 0.72;
    if (isUvOn) {
      // Violet cone of UV light striking sample
      ctx.save();
      const uvBeamGrad = ctx.createLinearGradient(uvLedX, uvLedY, headX, targetY);
      uvBeamGrad.addColorStop(0, 'rgba(139, 92, 246, 0.65)');
      uvBeamGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.35)');
      uvBeamGrad.addColorStop(1, 'rgba(99, 102, 241, 0.12)');

      ctx.fillStyle = uvBeamGrad;
      ctx.beginPath();
      ctx.moveTo(uvLedX, uvLedY + 10);
      ctx.lineTo(w * 0.18, targetY);
      ctx.lineTo(w * 0.82, targetY);
      ctx.closePath();
      ctx.fill();

      // UV Fluorescence bounce ray to photodiode & camera
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.45, targetY - 10);
      ctx.lineTo(pdX, pdY + 10);
      ctx.stroke();
      ctx.restore();
    }

    if (isIrOn) {
      // Faint subtle NIR cone (camera sensor sensitivity representation)
      ctx.save();
      const irBeamGrad = ctx.createLinearGradient(irLedX1, irLedY, headX, targetY);
      irBeamGrad.addColorStop(0, 'rgba(244, 63, 94, 0.40)');
      irBeamGrad.addColorStop(0.6, 'rgba(225, 29, 72, 0.20)');
      irBeamGrad.addColorStop(1, 'rgba(159, 18, 57, 0.08)');

      ctx.fillStyle = irBeamGrad;
      ctx.beginPath();
      ctx.moveTo(irLedX1, irLedY + 10);
      ctx.lineTo(w * 0.16, targetY);
      ctx.lineTo(w * 0.84, targetY);
      ctx.closePath();
      ctx.fill();

      // Specular bounce to photodiode
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(w * 0.52, targetY - 10);
      ctx.lineTo(pdX, pdY + 10);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Sample Platform with Slide-in Tray
    const trayY = h * 0.60;
    const trayH = h * 0.32;
    const trayW = w * 0.82;
    const trayX = (w - trayW) / 2;

    // Platform fixture bed
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(trayX - 10, trayY - 8, trayW + 20, trayH + 16);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trayX - 10, trayY - 8, trayW + 20, trayH + 16);

    // Draw the instrument on the stage
    ctx.save();
    // Sub-render instrument using instruments.js
    const instCanvas = document.createElement('canvas');
    instCanvas.width = trayW;
    instCanvas.height = trayH;
    const instCtx = instCanvas.getContext('2d');
    const instKey = this.state.selectedInstrument && this.state.selectedInstrument.startsWith('real_') 
      ? 'forceps' 
      : (this.state.selectedInstrument || 'forceps');
    drawInstrument(instCtx, instKey, trayW, trayH, {
      lighting: this.state.illuminationMode
    });
    // Draw contamination on instrument
    drawSimulatedContamination(instCtx, this.state.spots, this.state.sampleCondition, this.state.illuminationMode, trayW, trayH);

    ctx.drawImage(instCanvas, trayX, trayY);
    ctx.restore();

    // Chamber door indicator (if lid open)
    if (this.state.chamberLidOpen) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('[CHAMBER DOOR OPEN — AMBIENT STRAY LIGHT PRESENT]', 20, h - 20);
    }
  }

  /**
   * Renders the Arduino UNO R4 Minima Board Canvas
   */
  updateArduinoCanvas() {
    const canvas = document.getElementById('arduinoBoardCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.state.arduinoConnected) {
      // Disconnected state overlay
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARDUINO UNO R4 MINIMA DISCONNECTED', w / 2, h / 2 - 10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Click "Connect" above to restore USB communication.', w / 2, h / 2 + 15);
      return;
    }

    // 1. Arduino Teal PCB Body
    const pcbGrad = ctx.createLinearGradient(0, 0, w, h);
    pcbGrad.addColorStop(0, '#00878F'); // Classic Arduino Uno Teal
    pcbGrad.addColorStop(1, '#005C63');
    ctx.fillStyle = pcbGrad;
    ctx.beginPath();
    roundRect(ctx, 15, 15, w - 30, h - 30, 8);
    ctx.fill();

    // Mounting holes
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    [ [28, 28], [28, h - 28], [w - 28, 40], [w - 28, h - 40] ].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 2. USB-C Connector (Top Left)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(10, 50, 24, 34);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(10, 50, 24, 34);

    // Barrel Jack Power (Bottom Left)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, h - 85, 30, 40);

    // 3. Renesas RA4M1 32-bit MCU (Center)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(180, 95, 65, 65);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(180, 95, 65, 65);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RA4M1', 212, 122);
    ctx.fillText('ARM M4', 212, 134);

    // 4. 12x8 LED Matrix Display on R4 Minima
    ctx.fillStyle = '#090d16';
    ctx.fillRect(270, 75, 96, 68);
    // Draw matrix dots
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 12; col++) {
        const mx = 276 + col * 7.5;
        const my = 82 + row * 7.5;
        const isHeartbeat = (col === 5 || col === 6) && (row === 3 || row === 4);
        ctx.fillStyle = this.state.isScanning ? '#ef4444' : (isHeartbeat ? '#06b6d4' : '#1e293b');
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Header Pin Strips (Top: Digital Pins; Bottom: Analog & Power)
    // Digital Pins Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(120, 20, 260, 14);
    // Analog & Power Header
    ctx.fillRect(120, h - 34, 260, 14);

    // Pin Labels & Active Indicator LEDs
    // D9 (UV MOSFET Gate)
    const isD9Active = this.state.illuminationMode === 'uv' || this.state.illuminationMode === 'combined';
    drawArduinoPin(ctx, 320, 26, 'D9', isD9Active, '#8b5cf6');

    // D10 (IR MOSFET Gate)
    const isD10Active = this.state.illuminationMode === 'ir' || this.state.illuminationMode === 'combined';
    drawArduinoPin(ctx, 338, 26, 'D10', isD10Active, '#ec4899');

    // D2 (Trigger Button)
    drawArduinoPin(ctx, 210, 26, 'D2', this.state.isScanning, '#eab308');

    // A0 (Photodiode)
    drawArduinoPin(ctx, 320, h - 26, 'A0', true, '#06b6d4');

    // PWR & TX/RX LEDs
    drawLed(ctx, 60, 100, '#22c55e', true, 'ON');
    drawLed(ctx, 60, 118, '#eab308', this.state.isScanning || Math.random() > 0.4, 'TX');
    drawLed(ctx, 60, 136, '#eab308', this.state.isScanning || Math.random() > 0.6, 'RX');

    // Arduino UNO R4 Minima Text silkscreen
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ARDUINO', 75, 42);
    ctx.font = '8px sans-serif';
    ctx.fillText('UNO R4 MINIMA', 75, 54);
  }
}

function drawEmitterLED(ctx, x, y, label, color, isActive) {
  ctx.save();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 8, y - 8, 16, 20);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(x - 8, y - 8, 16, 20);

  // LED bulb
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + 4, 6, 0, Math.PI * 2);
  ctx.fill();

  if (isActive) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 10);
  ctx.restore();
}

function drawPhotodiodeSensor(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#1e2235';
  ctx.fillRect(x - 12, y - 8, 24, 22);
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 12, y - 8, 24, 22);

  // Silicon chip die
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 6, y - 2, 12, 10);
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(x - 6, y - 2, 12, 10);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BPW34', x, y - 10);
  ctx.restore();
}

function drawArduinoPin(ctx, x, y, name, isActive, activeColor) {
  ctx.save();
  ctx.fillStyle = isActive ? activeColor : '#0f172a';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y > 100 ? y + 14 : y - 8);
  ctx.restore();
}

function drawLed(ctx, x, y, color, isOn, label) {
  ctx.save();
  ctx.fillStyle = isOn ? color : '#334155';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  if (isOn) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 7, y + 3);
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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
