# BloodTrace — Dual-Wavelength Medical Instrument Contamination Detection Simulator

[![Project Type](https://img.shields.io/badge/Project-College%20Engineering%20Prototype-0284c7)](#)
[![Hardware](https://img.shields.io/badge/MCU-Arduino%20UNO%20R4%20Minima-00878F)](#)
[![Optics](https://img.shields.io/badge/Wavelengths-365nm%20UV%20%7C%20850nm%20NIR-8b5cf6)](#)
[![Simulation Notice](https://img.shields.io/badge/Notice-SIMULATED%20DATA-amber)](#)

> **IMPORTANT SCIENTIFIC NOTICE & REGULATORY DISCLAIMER:**
> **SIMULATED DATA — NOT A CLINICAL TEST RESULT.**
> BloodTrace is a college-level biomedical and optical engineering simulation of an optical screening prototype designed to visualize suspected residue on reusable surgical instruments before autoclaving.
> All detected regions are strictly categorized as **"Suspected Residue"** or **"Possible Contamination"**, never as confirmed blood. Optical screening provides rapid pre-screening localization but does not replace validated chemical protein assays (e.g. BCA or ninhydrin swabs) or biological spore indicators.

---

## 1. Project Overview & Physical Principles

In hospital Sterile Processing Departments (SPD) and Central Sterile Services Departments (CSSD), reusable surgical instruments (forceps, dissecting scissors, hemostatic clamps) must be meticulously cleaned to remove organic bioburden (dried blood, tissue proteins, coagulum) before packaging and terminal sterilization.

**BloodTrace** combines dual-wavelength optical excitation with computer vision to inspect instruments non-destructively:

1. **365 nm UV-A LED (Pin D9):**
   - Organic cellular proteins and free porphyrins exhibit weak autofluorescence.
   - Crucially, residual cleaning detergents containing optical brighteners and surfactants fluoresce intensely in the cyan-blue band (~430–470 nm).
   - This makes UV-A alone prone to false positives from detergent films.
2. **850 nm Near-Infrared (NIR) LED (Pin D10):**
   - Clean electropolished stainless steel (AISI 316L / 420) exhibits ~60–70% specular reflectance in the near-infrared.
   - Dried hemoglobin and methemoglobin exhibit high diffuse optical density and strong absorption at 850 nm.
   - Dried blood spots appear as stark dark silhouettes against reflective steel, while detergent residues remain virtually transparent.
3. **BPW34 PIN Photodiode (Pin A0):**
   - High-speed silicon PIN photodiode paired with a transimpedance amplifier (MCP6002).
   - Converts optical radiation into voltage fed into Arduino UNO R4 Minima 10-bit ADC (A0).
4. **Laptop Analysis Dashboard:**
   - Simulates a Python/OpenCV computer vision pipeline: background subtraction, Normalized Difference Index (NDI), bilateral noise filtering, and contour extraction.

---

## 2. Hardware Architecture & Schematic

- **Microcontroller:** Arduino UNO R4 Minima (Renesas RA4M1 32-bit ARM Cortex-M4 @ 48 MHz)
- **Pin D9:** Controls UV LED MOSFET gate (IRLZ44N) through a 1 kΩ current-limiting resistor.
- **Pin D10:** Controls dual 850 nm IR LED MOSFET gate (IRLZ44N) through a 1 kΩ resistor.
- **Pin A0:** Reads BPW34 photodiode transimpedance amplifier analog output (0–1023 ADC counts).
- **Pin D2:** Tactile push-button with internal `INPUT_PULLUP` to ground to trigger scans.
- **USB-C:** High-speed virtual COM port streaming serial telemetry at 115200 baud.

---

## 3. Application Structure

The application features a responsive, dark navy scientific workstation interface:
- **Device Simulation View:**
  - Matte-black light-tight optical chamber with access door.
  - Front-facing camera and UV/NIR optical ray projections.
  - Interactive Arduino UNO R4 Minima visual board with live LED matrix and pin status indicators.
  - Interactive circuit interface schematic.
  - Virtual 115200 baud serial monitor with command prompt (`SCAN`, `MODE=1`, `CALIB`, `STATUS`).
- **Laptop Analysis Dashboard View:**
  - 4-Panel Synchronized Optical Inspection Workstation:
    - **Panel A:** Clean Reference Image (Baseline)
    - **Panel B:** 365 nm UV Autofluorescence Frame
    - **Panel C:** 850 nm NIR Absorption Frame
    - **Panel D:** Candidate Residue Map (Red outline contours, transparent red overlay, cyan structural edges, ROI boxes)
  - Interactive zoom and pan (up to 300%) synchronized across all panels.
  - Dynamic detection threshold slider (dynamically recalculates contours and candidate area in real-time).
  - Interactive contamination spot tuner: click directly on the instrument canvas to place spots or use position/size/density sliders!
- **Results & Records View:**
  - Historical table of all screening runs with telemetry data.
  - One-click inspection of previous scan profiles.
- **Engineering Specs View:**
  - Optical physics equations, hardware BOM (~$64 total), CV pipeline graph, and clinical scope.
- **Built-in Demonstration Scenario ("Run Demo"):**
  - 9-step guided interactive walkthrough for academic and professor presentation.
- **Export Capabilities:**
  - Downloadable CSV data file.
  - Formal printable engineering report modal with image snapshots and sign-off blocks.

---

## 4. How to Run

### Quick Launch
Double-click `start.bat` or run:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in any modern web browser.

---

## 5. Verification & Testing

To run the automated test suite:
```bash
node test/test-simulation.js
```
The test suite verifies:
- Instrument data models and anatomical critical areas
- Deterministic pseudo-random number generator and Gaussian distributions
- Optical physics models (UV fluorescence, NIR absorption dip, photodiode ADC response)
- Computer vision classification logic and tri-state diagnostic results
- Dynamic threshold filtering
- 9-step demonstration scenario integrity
- Boundary values and error recovery (empty inputs, 0/100 thresholds, repeated scan consistency)
