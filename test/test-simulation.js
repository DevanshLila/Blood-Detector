/**
 * BloodTrace — Automated Test Suite
 * Validates optical models, deterministic sensor physics,
 * CV classification pipeline, threshold filtering, and CSV export.
 */

import { INSTRUMENT_DEFINITIONS } from '../js/models/instruments.js';
import { SAMPLE_CONDITIONS, SensorSimulator, DeterministicRNG } from '../js/models/sensor-sim.js';
import { ComputerVisionPipeline } from '../js/models/cv-pipeline.js';
import { DEMO_STEPS } from '../js/components/demo-mode.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

console.log('=== RUNNING BLOODTRACE TEST SUITE ===\n');

// ---------------------------------------------------------
// Test Group 1: Instrument Data Models
// ---------------------------------------------------------
console.log('[Test Group 1] Instrument Models');
assert(Boolean(INSTRUMENT_DEFINITIONS.forceps), 'Tissue Forceps defined');
assert(Boolean(INSTRUMENT_DEFINITIONS.scissors), 'Surgical Scissors defined');
assert(Boolean(INSTRUMENT_DEFINITIONS.hemostat), 'Hemostatic Clamp defined');
assert(Boolean(INSTRUMENT_DEFINITIONS.coupon), 'Calibration Coupon defined');

['forceps', 'scissors', 'hemostat', 'coupon'].forEach(key => {
  const inst = INSTRUMENT_DEFINITIONS[key];
  assert(inst.criticalAreas && inst.criticalAreas.length > 0, `${inst.name} has critical inspection areas`);
  assert(inst.defaultSpots && inst.defaultSpots.length > 0, `${inst.name} has default contamination spot`);
});

// ---------------------------------------------------------
// Test Group 2: Deterministic RNG
// ---------------------------------------------------------
console.log('\n[Test Group 2] Deterministic RNG');
const rng1 = new DeterministicRNG(98765);
const rng2 = new DeterministicRNG(98765);

const val1 = [rng1.next(), rng1.next(), rng1.next()];
const val2 = [rng2.next(), rng2.next(), rng2.next()];
assert(JSON.stringify(val1) === JSON.stringify(val2), 'Identical seeds produce identical sequences');

const g1 = rng1.nextGaussian(0, 1);
assert(!isNaN(g1) && typeof g1 === 'number', 'Box-Muller gaussian generator returns valid number');

// ---------------------------------------------------------
// Test Group 3: Sensor Simulation Physics
// ---------------------------------------------------------
console.log('\n[Test Group 3] Optical Sensor Models');
const sim = new SensorSimulator(12345);

// Mode 'off' (dark current baseline)
const darkReading = sim.calculateReading('off', 'clean', [], 100);
assert(darkReading.photodiodeADC >= 180 && darkReading.photodiodeADC <= 210, `Dark baseline ADC is ~195 (got ${darkReading.photodiodeADC})`);
assert(darkReading.uvIntensity === 0, 'UV intensity is 0 when OFF');
assert(darkReading.irIntensity === 0, 'IR intensity is 0 when OFF');

// Mode 'uv' on clean steel vs detergent
const cleanUv = sim.calculateReading('uv', 'clean', [], 100);
const detergentSpots = [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.05, intensity: 0.9 }];
const detergentUv = sim.calculateReading('uv', 'detergent', detergentSpots, 100);
assert(cleanUv.uvIntensity < 30, `Clean steel has minimal UV autofluorescence (${cleanUv.uvIntensity} a.u.)`);
assert(detergentUv.uvIntensity > 150, `Detergent residue shows high UV fluorescence emission (${detergentUv.uvIntensity} a.u.)`);

// Mode 'ir' on clean steel vs dried blood
const cleanIr = sim.calculateReading('ir', 'clean', [], 100);
const bloodSpots = [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.95 }];
const bloodIr = sim.calculateReading('ir', 'blood_dried', bloodSpots, 100);
assert(cleanIr.irIntensity > 700, `Clean steel has high specular NIR reflection (${cleanIr.irIntensity} a.u.)`);
assert(bloodIr.irIntensity < 600, `Dried blood exhibits marked NIR absorption drop (${bloodIr.irIntensity} a.u.)`);
assert(bloodIr.irIntensity < cleanIr.irIntensity, 'Blood NIR reflectance is strictly lower than clean steel');

// Photodiode ADC Clamping
const combinedBlood = sim.calculateReading('combined', 'blood_multi', bloodSpots, 100);
assert(combinedBlood.photodiodeADC >= 0 && combinedBlood.photodiodeADC <= 1023, 'Photodiode ADC clamps to 10-bit range (0-1023)');

// ---------------------------------------------------------
// Test Group 4: Computer Vision Pipeline & Classification
// ---------------------------------------------------------
console.log('\n[Test Group 4] CV Classification Engine');
const cv = new ComputerVisionPipeline();

// Test A: Clean sample
const cleanScanResult = cv.processScan({
  spots: [],
  conditionId: 'clean',
  threshold: 35,
  uvReading: cleanUv,
  irReading: cleanIr
});
assert(cleanScanResult.screeningResult === 'No significant optical difference detected', 'Clean sample classifies as No Significant Optical Difference');
assert(cleanScanResult.candidateRegionsCount === 0, 'Clean sample has 0 candidate regions');

// Test B: Dried blood residue
const bloodScanResult = cv.processScan({
  spots: bloodSpots,
  conditionId: 'blood_dried',
  threshold: 35,
  uvReading: sim.calculateReading('uv', 'blood_dried', bloodSpots, 100),
  irReading: bloodIr
});
assert(bloodScanResult.screeningResult === 'Possible residue detected', 'Blood residue triggers "Possible residue detected"');
assert(bloodScanResult.candidateRegionsCount >= 1, `Candidate regions extracted (${bloodScanResult.candidateRegionsCount})`);
assert(bloodScanResult.candidateSurfaceRatioPct > 0, `Candidate surface area calculated (${bloodScanResult.candidateSurfaceRatioPct}%)`);

// Test C: Detergent Residue (Confounder Test)
const detergentScanResult = cv.processScan({
  spots: detergentSpots,
  conditionId: 'detergent',
  threshold: 35,
  uvReading: detergentUv,
  irReading: sim.calculateReading('ir', 'detergent', detergentSpots, 100)
});
assert(detergentScanResult.screeningResult === 'Ambiguous result — manual inspection required', 'Detergent correctly triggers Ambiguous Result (preventing false blood claim)');

// Test D: Dynamic Threshold Sensitivity
const lowThreshResult = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.5 }],
  conditionId: 'water_mark',
  threshold: 15
});
const highThreshResult = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.5 }],
  conditionId: 'water_mark',
  threshold: 75
});
assert(lowThreshResult.candidateRegionsCount >= highThreshResult.candidateRegionsCount, 'Lower threshold detects more or equal candidate regions than higher threshold');

// Test E: Scientific Disclaimer Enforcement
const disclaimerCheck = bloodScanResult.disclaimer.includes('SIMULATED DATA') && !bloodScanResult.screeningResult.toLowerCase().includes('confirmed blood');
assert(disclaimerCheck, 'Never claims "confirmed blood" and always includes simulation disclaimer');

// Test F: Optical Signal Decoupling (Requirement 8 Verification)
// Outcome depends strictly on simulated optical signals, NOT on conditionId ground truth label
const decoupledBloodSignal = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.9 }],
  conditionId: 'unlabeled_sample_A',
  threshold: 35,
  uvReading: { uvIntensity: 30 },
  irReading: { irIntensity: 420 } // NIR drop of 340 a.u.
});
assert(decoupledBloodSignal.screeningResult === 'Possible residue detected', 'Classification depends strictly on optical sensor signals, not conditionId label');

const decoupledDetergentSignal = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.9 }],
  conditionId: 'unlabeled_sample_B',
  threshold: 35,
  uvReading: { uvIntensity: 220 }, // High fluorescence
  irReading: { irIntensity: 750 } // Specular NIR reflection
});
assert(decoupledDetergentSignal.screeningResult === 'Ambiguous result — manual inspection required', 'Fluorescence without NIR drop triggers Ambiguous outcome strictly from optical signals');

// ---------------------------------------------------------
// Test Group 5: Demonstration Scenario Sequence
// ---------------------------------------------------------
console.log('\n[Test Group 5] Demo Scenario Integrity');
assert(Array.isArray(DEMO_STEPS) && DEMO_STEPS.length === 9, 'Demonstration scenario has exactly 9 steps');
DEMO_STEPS.forEach((step, i) => {
  assert(step.step === i + 1, `Step ${i + 1} indexed properly`);
  assert(typeof step.action === 'function', `Step ${i + 1} has executable action function`);
  assert(step.title && step.description, `Step ${i + 1} has descriptive title and rationale`);
});

// ---------------------------------------------------------
// Test Group 6: Boundary Values & Error Recovery
// ---------------------------------------------------------
console.log('\n[Test Group 6] Boundary Values & Edge Cases');

// Edge Case A: Empty spots array
const emptyScanResult = cv.processScan({
  spots: [],
  conditionId: 'blood_dried',
  threshold: 35
});
assert(emptyScanResult.candidateRegionsCount === 0, 'Empty spots array results in 0 candidate regions safely');
assert(emptyScanResult.screeningResult === 'No significant optical difference detected', 'No residue detected when spots array is empty');

// Edge Case B: Boundary thresholds 0 and 100
const threshold0 = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.8 }],
  conditionId: 'blood_dried',
  threshold: 0
});
const threshold100 = cv.processScan({
  spots: [{ xRatio: 0.5, yRatio: 0.5, radiusRatio: 0.04, intensity: 0.8 }],
  conditionId: 'blood_dried',
  threshold: 100
});
assert(threshold0.candidateRegionsCount >= 1, 'Threshold 0 captures candidate region');
assert(threshold100.candidateRegionsCount === 0, 'Threshold 100 filters out all candidate regions');

// Edge Case C: Unknown condition ID fallback
const fallbackReading = sim.calculateReading('uv', 'unknown_condition_xyz', [], 100);
assert(fallbackReading && fallbackReading.uvIntensity !== undefined, 'Graceful fallback on unknown condition ID');

// Edge Case D: Repeated scan consistency (controlled seed)
const seedSimA = new SensorSimulator(5555);
const seedSimB = new SensorSimulator(5555);
const readA = seedSimA.calculateReading('combined', 'blood_dried', bloodSpots, 1000);
const readB = seedSimB.calculateReading('combined', 'blood_dried', bloodSpots, 1000);
assert(readA.photodiodeADC === readB.photodiodeADC, `Repeated scan with same seed produces identical ADC (${readA.photodiodeADC} == ${readB.photodiodeADC})`);
assert(readA.uvIntensity === readB.uvIntensity, `Repeated scan produces identical UV intensity (${readA.uvIntensity} == ${readB.uvIntensity})`);
assert(readA.irIntensity === readB.irIntensity, `Repeated scan produces identical IR intensity (${readA.irIntensity} == ${readB.irIntensity})`);

// ---------------------------------------------------------
// Summary
// ---------------------------------------------------------
console.log(`\n========================================`);
console.log(`TEST RESULTS: ${passedTests} passed, ${failedTests} failed.`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

