# ==========================================
# DOCUMENT 0 (stream index 1266)
# ==========================================

## 1. What the three sources tell us

### Source 1 — FDA: How reusable medical devices are reprocessed

The FDA explains that reprocessing is intended to remove blood, tissue, and other biological debris and to inactivate infectious microbes. It describes three broad stages: initial cleaning at the point of use, thorough cleaning in the reprocessing area, and then disinfection or sterilization as appropriate. <Cite refs={["turn663131view0"]}/>

**What this means for BloodTrace**

- Your project addresses a real problem: residual biological material can remain on reusable instruments.
- The most relevant use case is a **screening aid after cleaning and before the next reprocessing step**, not a replacement for cleaning.
- Your interface should report *possible residual contamination*, rather than declaring an instrument safe or sterile.

### Source 2 — CDC: Disinfection of healthcare equipment

The CDC guidance emphasizes that proper cleaning is essential before disinfection or sterilization. It also discusses the complexity of processing medical devices and the difficulty of reliably assessing reprocessing outcomes. <Cite refs={["turn663131view1"]}/>

**What this means for BloodTrace**

- A visually clean surface does not prove that microorganisms are absent.
- Blood residue and microbial contamination are different things. Detecting one does not automatically establish the presence or absence of the other.
- A useful device should prioritize identifying possible residual soil while clearly communicating uncertainty.
- Testing should include difficult cases, such as faint stains and areas that are hard to image.

### Source 3 — Research paper

The third link is a research article hosted by PubMed Central, but the page did not return its article text during retrieval. I don't want to guess its findings or attribute unsupported conclusions to it. The paper can be analyzed in detail once its title, abstract, or full text is accessible.

## 2. How to apply the findings to your project

I would translate the guidance into these engineering requirements:

| Research-informed requirement | How to implement it in BloodTrace |
|---|---|
| Residual biological material matters | Focus on detecting visible candidate residue after cleaning |
| Cleaning and sterilization are distinct | Never equate a clean-looking image with sterility |
| Instruments have different geometries | Test forceps, scissors, joints, grooves, and hard-to-image areas |
| Detection can be uncertain | Show “Ambiguous — Manual Inspection Required” when evidence conflicts |
| A screening tool needs validation | Compare results against known sample labels and an independent reference method |

The FDA and CDC sources support the **problem statement and safety requirements**, not the accuracy of your particular UV/NIR design. <Cite refs={["turn663131view0","turn663131view1"]}/>

## 3. What data should you collect?

For a meaningful college-level experiment, record results across several independently prepared samples, not just one clean and one contaminated image.

- Clean surfaces.
- Surfaces with known, safely prepared blood-like surrogate residue.
- Different stain sizes and drying conditions.
- Detergent residue and water marks as negative controls.
- Multiple images per sample under consistent lighting and camera settings.

Measure:

- **Sensitivity:** fraction of contaminated samples correctly flagged.
- **Specificity:** fraction of clean/control samples correctly left unflagged.
- **False-positive rate:** fraction of clean/control samples incorrectly flagged.
- **False-negative rate:** fraction of contaminated samples missed.
- **Repeatability:** whether repeated scans of the same sample give similar results.

Keep the test set separate from the images used to tune your thresholds. Otherwise, your performance numbers may be overly optimistic.

## 4. One important limitation

Your current clean and contaminated photographs can help test the software pipeline, but ordinary photographs cannot establish what your physical 365 nm UV LED or 850 nm NIR sensor will detect. For that, you would need images or measurements captured under those wavelengths.

Also, a blood-residue detector cannot establish sterility: the absence of a detected stain is not evidence that infectious microorganisms are absent.

**Next step:** I can analyze the third paper more precisely if you upload its PDF or paste its title and abstract. I can then extract its methods, findings, limitations, and specific implications for BloodTrace without guessing what the article says.

# ==========================================
# DOCUMENT 1 (stream index 1470)
# ==========================================

## 1. What the three sources tell us

### Source 1 — FDA: How reusable medical devices are reprocessed

The FDA explains that reprocessing is intended to remove blood, tissue, and other biological debris and to inactivate infectious microbes. It describes three broad stages: initial cleaning at the point of use, thorough cleaning in the reprocessing area, and then disinfection or sterilization as appropriate. <Cite refs={["turn663131view0"]}/>

**What this means for BloodTrace**

- Your project addresses a real problem: residual biological material can remain on reusable instruments.
- The most relevant use case is a **screening aid after cleaning and before the next reprocessing step**, not a replacement for cleaning.
- Your interface should report *possible residual contamination*, rather than declaring an instrument safe or sterile.

### Source 2 — CDC: Disinfection of healthcare equipment

The CDC guidance emphasizes that proper cleaning is essential before disinfection or sterilization. It also discusses the complexity of processing medical devices and the difficulty of reliably assessing reprocessing outcomes. <Cite refs={["turn663131view1"]}/>

**What this means for BloodTrace**

- A visually clean surface does not prove that microorganisms are absent.
- Blood residue and microbial contamination are different things. Detecting one does not automatically establish the presence or absence of the other.
- A useful device should prioritize identifying possible residual soil while clearly communicating uncertainty.
- Testing should include difficult cases, such as faint stains and areas that are hard to image.

### Source 3 — Research paper

The third link is a research article hosted by PubMed Central, but the page did not return its article text during retrieval. I don't want to guess its findings or attribute unsupported conclusions to it. The paper can be analyzed in detail once its title, abstract, or full text is accessible.



# ==========================================
# DOCUMENT 2 (stream index 2101)
# ==========================================

## Prompt to give Antigravity

Attach your latest project and use this prompt to improve the existing implementation.

<WritingBlock id="64729" variant="document">Review and upgrade my existing BloodTrace Vision application based on the uploaded simulation showcase video. Preserve the current dark navy-blue design, working device simulation, and useful features. Improve the existing project rather than rebuilding it from scratch.

### 1. Fix image-analysis credibility
- Locate and use my existing clean-surface and blood-contaminated-surface images.
- Use the same image-processing pipeline for both samples.
- Ensure all four panels use consistent image alignment and scale.
- Derive candidate regions and scores from actual image-processing results.
- Remove fixed, hardcoded detection outcomes.
- Do not force a successful result when the evidence does not support one.

### 2. Improve the four-panel visualization
Display:
1. Visible Image.
2. Simulated UV Image at 365 nm.
3. Simulated IR/NIR Image at 850 nm.
4. Contamination Map.

Make the images larger and easier to compare. Keep overlays aligned to the original instrument. Make candidate regions follow detected contours instead of appearing as scattered pixels or arbitrary shapes.

Use red for possible blood-like residue, yellow for ambiguous regions, and grey for ordinary or unclassified surface. **Remove all scratch detection, scratch labels, scratch counters, and scratch controls.**

### 3. Make the analysis explainable
For every candidate region, display:
- Region ID.
- Candidate classification.
- Simulation confidence score.
- Estimated area, when reliable surface segmentation is available.
- Simulated UV response.
- Simulated NIR response.
- Short explanation of the features that triggered detection.

Calculate these values from the image-processing pipeline. Changing the selected image or detection threshold must update the results.

Clearly distinguish simulation confidence from clinical diagnostic accuracy.

### 4. Improve UV and NIR simulation
Generate deterministic, sample-dependent visualizations. Do not simply apply a purple filter to the visible image and call it UV imaging, or use a grayscale image and call it a thermal image.

If real UV/NIR measurements are not available, label these panels as simulated. Keep the locations of simulated candidate regions consistent across all panels.

### 5. Improve the interface
- Increase the size of the four main image panels.
- Keep important labels readable at 1920 × 1080 and smaller laptop resolutions.
- Reduce unnecessary text and crowded cards.
- Keep the result status, confidence score, and legend easy to find.
- Retain the existing useful controls and report export.
- Ensure every control works and provides visible feedback.

### 6. Improve validation and reporting
Create a clean-versus-contaminated comparison view using my actual uploaded images. Show the original inputs, analysis maps, detected region counts, estimated areas, and confidence scores.

Test for false positives on the clean image and missed detections on the contaminated image. Report the actual observed outcomes instead of fabricating results.

Make exported reports include the original image, candidate map, selected settings, computed results, timestamp, and limitations.

Use these result labels:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — Manual Inspection Required.
- Analysis unavailable.

Never claim blood confirmation, sterility, or safety for reuse.

### 7. Test before finishing
Run the application locally and test both uploaded images, all controls, threshold changes, image alignment, confidence calculations, comparison mode, and report export. Fix errors and regressions. Provide clear startup instructions and a summary of what was actually improved.

Keep this disclaimer visible: “BloodTrace Vision is an experimental image-analysis simulation. Simulated UV/NIR views are not real sensor measurements. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”</WritingBlock>

**My recommendation:** Prioritize the image-processing pipeline and clean-versus-contaminated comparison before adding more sensors or dashboard features. Those two improvements will make your project much stronger when you demonstrate it to engineering faculty.

# ==========================================
# DOCUMENT 3 (stream index 2214)
# ==========================================

Review and upgrade my existing BloodTrace Vision application based on the uploaded simulation showcase video. Preserve the current dark navy-blue design, working device simulation, and useful features. Improve the existing project rather than rebuilding it from scratch.

### 1. Fix image-analysis credibility
- Locate and use my existing clean-surface and blood-contaminated-surface images.
- Use the same image-processing pipeline for both samples.
- Ensure all four panels use consistent image alignment and scale.
- Derive candidate regions and scores from actual image-processing results.
- Remove fixed, hardcoded detection outcomes.
- Do not force a successful result when the evidence does not support one.

### 2. Improve the four-panel visualization
Display:
1. Visible Image.
2. Simulated UV Image at 365 nm.
3. Simulated IR/NIR Image at 850 nm.
4. Contamination Map.

Make the images larger and easier to compare. Keep overlays aligned to the original instrument. Make candidate regions follow detected contours instead of appearing as scattered pixels or arbitrary shapes.

Use red for possible blood-like residue, yellow for ambiguous regions, and grey for ordinary or unclassified surface. **Remove all scratch detection, scratch labels, scratch counters, and scratch controls.**

### 3. Make the analysis explainable
For every candidate region, display:
- Region ID.
- Candidate classification.
- Simulation confidence score.
- Estimated area, when reliable surface segmentation is available.
- Simulated UV response.
- Simulated NIR response.
- Short explanation of the features that triggered detection.

Calculate these values from the image-processing pipeline. Changing the selected image or detection threshold must update the results.

Clearly distinguish simulation confidence from clinical diagnostic accuracy.

### 4. Improve UV and NIR simulation
Generate deterministic, sample-dependent visualizations. Do not simply apply a purple filter to the visible image and call it UV imaging, or use a grayscale image and call it a thermal image.

If real UV/NIR measurements are not available, label these panels as simulated. Keep the locations of simulated candidate regions consistent across all panels.

### 5. Improve the interface
- Increase the size of the four main image panels.
- Keep important labels readable at 1920 × 1080 and smaller laptop resolutions.
- Reduce unnecessary text and crowded cards.
- Keep the result status, confidence score, and legend easy to find.
- Retain the existing useful controls and report export.
- Ensure every control works and provides visible feedback.

### 6. Improve validation and reporting
Create a clean-versus-contaminated comparison view using my actual uploaded images. Show the original inputs, analysis maps, detected region counts, estimated areas, and confidence scores.

Test for false positives on the clean image and missed detections on the contaminated image. Report the actual observed outcomes instead of fabricating results.

Make exported reports include the original image, candidate map, selected settings, computed results, timestamp, and limitations.

Use these result labels:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — Manual Inspection Required.
- Analysis unavailable.

Never claim blood confirmation, sterility, or safety for reuse.

### 7. Test before finishing
Run the application locally and test both uploaded images, all controls, threshold changes, image alignment, confidence calculations, comparison mode, and report export. Fix errors and regressions. Provide clear startup instructions and a summary of what was actually improved.

Keep this disclaimer visible: “BloodTrace Vision is an experimental image-analysis simulation. Simulated UV/NIR views are not real sensor measurements. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”

# ==========================================
# DOCUMENT 4 (stream index 2222)
# ==========================================

I reviewed your BloodTrace Vision showcase video. You already have a strong foundation: a professional dark dashboard, four synchronized image panels, device simulation, adjustable detection settings, comparison views, and report export.

**The biggest improvement now is to make the image analysis more believable and the results easier to trust—not simply to add more features.** Since this is a college engineering project, the demonstration should show exactly what the system observes, how it identifies candidate regions, and how it handles uncertainty.

## What I would improve first

image_group{"query":["professional medical imaging software dashboard four synchronized image panels dark interface"],"aspect_ratio":"4:3","layout":"carousel","num_per_query":1}

**1\. Make the four image panels tell one consistent story**

Keep Visible, UV, IR/NIR, and Contamination Map. Use your actual clean and contaminated images as the inputs. Ensure candidate regions appear at corresponding positions in all panels, with overlays registered to the original instrument.

Priority: Very high

---

image_group{"query":["computer vision image segmentation medical instrument red semi transparent contour overlay"],"aspect_ratio":"4:3","layout":"carousel","num_per_query":1}

**2\. Improve the contamination overlay**

In the video, the analysis map is visually busy. Replace scattered-looking red/orange pixels with clean, connected contours around the actual candidate regions where possible. Use red for possible blood-like residue, yellow for ambiguous areas, and grey for unclassified or ordinary surface.

Remove all scratch-detection features, as requested.

---

image_group{"query":["UV fluorescence imaging laboratory sample dark violet bright fluorescence spots"],"aspect_ratio":"4:3","layout":"carousel","num_per_query":1}

**3\. Make UV and IR/NIR views technically honest**

The UV and NIR panels should not just look different from the visible image. Make them deterministic simulations derived from the selected sample, and label them as simulated views. Use consistent candidate locations across the panels.

An 850 nm NIR view is not a thermal image, and neither view alone confirms blood.

---

image_group{"query":["scientific software confidence score analysis results panel uncertainty visualization"],"aspect_ratio":"4:3","layout":"carousel","num_per_query":1}

**4\. Add an explainable confidence score**

Show a score for each candidate region, its estimated area, UV-style response, NIR-style response, and a brief explanation of why it was flagged. Scores should change with the image and threshold—not remain fixed.

Call it **simulation confidence**, not the probability that a region is blood.

---

image_group{"query":["clean professional scientific dashboard side by side before after image comparison large readable panels"],"aspect_ratio":"4:3","layout":"carousel","num_per_query":1}

**5\. Improve readability**

Your showcase has many controls and information cards competing for space. Make the four main images larger, simplify secondary panels, increase important text sizes, and keep the result status and confidence score immediately visible.

## The most important test: clean vs. contaminated

Build a dedicated comparison screen using the two images you already uploaded.

| Check | What you want to see |
|--------|--------|
| Clean surface | Whether the algorithm incorrectly flags candidate regions |
| Contaminated surface | Whether it identifies the actual visible stain |
| Threshold adjustment | Candidate regions and scores change logically |
| UV/NIR switching | Views change while remaining spatially consistent |
| Uncertain evidence | An ambiguous result rather than a forced positive |
| Report export | Images, settings, scores, limitations, and timestamp are included |

Do not force the clean image to show zero contamination or the contaminated image to show a successful detection. Let the algorithm determine the result and disclose its limitations.

## Prompt to give Antigravity

Attach your latest project and use this prompt to improve the existing implementation.

:::writing{variant="document" id="64729"}
Review and upgrade my existing BloodTrace Vision application based on the uploaded simulation showcase video. Preserve the current dark navy-blue design, working device simulation, and useful features. Improve the existing project rather than rebuilding it from scratch.

### 1. Fix image-analysis credibility
- Locate and use my existing clean-surface and blood-contaminated-surface images.
- Use the same image-processing pipeline for both samples.
- Ensure all four panels use consistent image alignment and scale.
- Derive candidate regions and scores from actual image-processing results.
- Remove fixed, hardcoded detection outcomes.
- Do not force a successful result when the evidence does not support one.

### 2. Improve the four-panel visualization
Display:
1. Visible Image.
2. Simulated UV Image at 365 nm.
3. Simulated IR/NIR Image at 850 nm.
4. Contamination Map.

Make the images larger and easier to compare. Keep overlays aligned to the original instrument. Make candidate regions follow detected contours instead of appearing as scattered pixels or arbitrary shapes.

Use red for possible blood-like residue, yellow for ambiguous regions, and grey for ordinary or unclassified surface. **Remove all scratch detection, scratch labels, scratch counters, and scratch controls.**

### 3. Make the analysis explainable
For every candidate region, display:
- Region ID.
- Candidate classification.
- Simulation confidence score.
- Estimated area, when reliable surface segmentation is available.
- Simulated UV response.
- Simulated NIR response.
- Short explanation of the features that triggered detection.

Calculate these values from the image-processing pipeline. Changing the selected image or detection threshold must update the results.

Clearly distinguish simulation confidence from clinical diagnostic accuracy.

### 4. Improve UV and NIR simulation
Generate deterministic, sample-dependent visualizations. Do not simply apply a purple filter to the visible image and call it UV imaging, or use a grayscale image and call it a thermal image.

If real UV/NIR measurements are not available, label these panels as simulated. Keep the locations of simulated candidate regions consistent across all panels.

### 5. Improve the interface
- Increase the size of the four main image panels.
- Keep important labels readable at 1920 × 1080 and smaller laptop resolutions.
- Reduce unnecessary text and crowded cards.
- Keep the result status, confidence score, and legend easy to find.
- Retain the existing useful controls and report export.
- Ensure every control works and provides visible feedback.

### 6. Improve validation and reporting
Create a clean-versus-contaminated comparison view using my actual uploaded images. Show the original inputs, analysis maps, detected region counts, estimated areas, and confidence scores.

Test for false positives on the clean image and missed detections on the contaminated image. Report the actual observed outcomes instead of fabricating results.

Make exported reports include the original image, candidate map, selected settings, computed results, timestamp, and limitations.

Use these result labels:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — Manual Inspection Required.
- Analysis unavailable.

Never claim blood confirmation, sterility, or safety for reuse.

### 7. Test before finishing
Run the application locally and test both uploaded images, all controls, threshold changes, image alignment, confidence calculations, comparison mode, and report export. Fix errors and regressions. Provide clear startup instructions and a summary of what was actually improved.

Keep this disclaimer visible: “BloodTrace Vision is an experimental image-analysis simulation. Simulated UV/NIR views are not real sensor measurements. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”
:::

**My recommendation\:** Prioritize the image-processing pipeline and clean-versus-contaminated comparison before adding more sensors or dashboard features. Those two improvements will make your project much stronger when you demonstrate it to engineering faculty.

# ==========================================
# DOCUMENT 5 (stream index 2379)
# ==========================================

Prompt to give Antigravity

# ==========================================
# DOCUMENT 6 (stream index 2386)
# ==========================================

I reviewed your BloodTrace Vision showcase video. You already have a strong foundation: a professional dark dashboard, four synchronized image panels, device simulation, adjustable detection settings, comparison views, and report export.

**The biggest improvement now is to make the image analysis more believable and the results easier to trust—not simply to add more features.** Since this is a college engineering project, the demonstration should show exactly what the system observes, how it identifies candidate regions, and how it handles uncertainty.

## What I would improve first

<box gap={4}>
  <row align=start gap={3}>
    <AsyncImage query="professional medical imaging software dashboard four synchronized image panels dark interface" aspectRatio="4:3" maxWidth="124px" />
    <box flex="1" gap={1}>
      **1. Make the four image panels tell one consistent story**

      Keep Visible, UV, IR/NIR, and Contamination Map. Use your actual clean and contaminated images as the inputs. Ensure candidate regions appear at corresponding positions in all panels, with overlays registered to the original instrument.

      <text color="secondary" size="sm">Priority: Very high</text>
    </box>
  </row>
  <divider color="subtle" />
  <row align=start gap={3}>
    <AsyncImage query="computer vision image segmentation medical instrument red semi transparent contour overlay" aspectRatio="4:3" maxWidth="124px" />
    <box flex="1" gap={1}>
      **2. Improve the contamination overlay**

      In the video, the analysis map is visually busy. Replace scattered-looking red/orange pixels with clean, connected contours around the actual candidate regions where possible. Use red for possible blood-like residue, yellow for ambiguous areas, and grey for unclassified or ordinary surface.

      Remove all scratch-detection features, as requested.
    </box>
  </row>
  <divider color="subtle" />
  <row align=start gap={3}>
    <AsyncImage query="UV fluorescence imaging laboratory sample dark violet bright fluorescence spots" aspectRatio="4:3" maxWidth="124px" />
    <box flex="1" gap={1}>
      **3. Make UV and IR/NIR views technically honest**

      The UV and NIR panels should not just look different from the visible image. Make them deterministic simulations derived from the selected sample, and label them as simulated views. Use consistent candidate locations across the panels.

      An 850 nm NIR view is not a thermal image, and neither view alone confirms blood.
    </box>
  </row>
  <divider color="subtle" />
  <row align=start gap={3}>
    <AsyncImage query="scientific software confidence score analysis results panel uncertainty visualization" aspectRatio="4:3" maxWidth="124px" />
    <box flex="1" gap={1}>
      **4. Add an explainable confidence score**

      Show a score for each candidate region, its estimated area, UV-style response, NIR-style response, and a brief explanation of why it was flagged. Scores should change with the image and threshold—not remain fixed.

      Call it **simulation confidence**, not the probability that a region is blood.
    </box>
  </row>
  <divider color="subtle" />
  <row align=start gap={3}>
    <AsyncImage query="clean professional scientific dashboard side by side before after image comparison large readable panels" aspectRatio="4:3" maxWidth="124px" />
    <box flex="1" gap={1}>
      **5. Improve readability**

      Your showcase has many controls and information cards competing for space. Make the four main images larger, simplify secondary panels, increase important text sizes, and keep the result status and confidence score immediately visible.
    </box>
  </row>
</box>

## The most important test: clean vs. contaminated

Build a dedicated comparison screen using the two images you already uploaded.

| Check | What you want to see |
|---|---|
| Clean surface | Whether the algorithm incorrectly flags candidate regions |
| Contaminated surface | Whether it identifies the actual visible stain |
| Threshold adjustment | Candidate regions and scores change logically |
| UV/NIR switching | Views change while remaining spatially consistent |
| Uncertain evidence | An ambiguous result rather than a forced positive |
| Report export | Images, settings, scores, limitations, and timestamp are included |

Do not force the clean image to show zero contamination or the contaminated image to show a successful detection. Let the algorithm determine the result and disclose its limitations.

## Prompt to give Antigravity

Attach your latest project and use this prompt to improve the existing implementation.

<WritingBlock id="64729" variant="document">Review and upgrade my existing BloodTrace Vision application based on the uploaded simulation showcase video. Preserve the current dark navy-blue design, working device simulation, and useful features. Improve the existing project rather than rebuilding it from scratch.

### 1. Fix image-analysis credibility
- Locate and use my existing clean-surface and blood-contaminated-surface images.
- Use the same image-processing pipeline for both samples.
- Ensure all four panels use consistent image alignment and scale.
- Derive candidate regions and scores from actual image-processing results.
- Remove fixed, hardcoded detection outcomes.
- Do not force a successful result when the evidence does not support one.

### 2. Improve the four-panel visualization
Display:
1. Visible Image.
2. Simulated UV Image at 365 nm.
3. Simulated IR/NIR Image at 850 nm.
4. Contamination Map.

Make the images larger and easier to compare. Keep overlays aligned to the original instrument. Make candidate regions follow detected contours instead of appearing as scattered pixels or arbitrary shapes.

Use red for possible blood-like residue, yellow for ambiguous regions, and grey for ordinary or unclassified surface. **Remove all scratch detection, scratch labels, scratch counters, and scratch controls.**

### 3. Make the analysis explainable
For every candidate region, display:
- Region ID.
- Candidate classification.
- Simulation confidence score.
- Estimated area, when reliable surface segmentation is available.
- Simulated UV response.
- Simulated NIR response.
- Short explanation of the features that triggered detection.

Calculate these values from the image-processing pipeline. Changing the selected image or detection threshold must update the results.

Clearly distinguish simulation confidence from clinical diagnostic accuracy.

### 4. Improve UV and NIR simulation
Generate deterministic, sample-dependent visualizations. Do not simply apply a purple filter to the visible image and call it UV imaging, or use a grayscale image and call it a thermal image.

If real UV/NIR measurements are not available, label these panels as simulated. Keep the locations of simulated candidate regions consistent across all panels.

### 5. Improve the interface
- Increase the size of the four main image panels.
- Keep important labels readable at 1920 × 1080 and smaller laptop resolutions.
- Reduce unnecessary text and crowded cards.
- Keep the result status, confidence score, and legend easy to find.
- Retain the existing useful controls and report export.
- Ensure every control works and provides visible feedback.

### 6. Improve validation and reporting
Create a clean-versus-contaminated comparison view using my actual uploaded images. Show the original inputs, analysis maps, detected region counts, estimated areas, and confidence scores.

Test for false positives on the clean image and missed detections on the contaminated image. Report the actual observed outcomes instead of fabricating results.

Make exported reports include the original image, candidate map, selected settings, computed results, timestamp, and limitations.

Use these result labels:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — Manual Inspection Required.
- Analysis unavailable.

Never claim blood confirmation, sterility, or safety for reuse.

### 7. Test before finishing
Run the application locally and test both uploaded images, all controls, threshold changes, image alignment, confidence calculations, comparison mode, and report export. Fix errors and regressions. Provide clear startup instructions and a summary of what was actually improved.

Keep this disclaimer visible: “BloodTrace Vision is an experimental image-analysis simulation. Simulated UV/NIR views are not real sensor measurements. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”</WritingBlock>

**My recommendation:** Prioritize the image-processing pipeline and clean-versus-contaminated comparison before adding more sensors or dashboard features. Those two improvements will make your project much stronger when you demonstrate it to engineering faculty.

# ==========================================
# DOCUMENT 7 (stream index 2670)
# ==========================================

# BloodTrace Vision — Improve Contamination Detection Simulation

Improve my existing BloodTrace Vision project using the attached dashboard screenshot as the UI reference. Inspect the current codebase and use the **clean-surface and blood-contaminated-surface images I have already added to the project** as the primary test images.

Do not rebuild the project from scratch or remove existing working features unnecessarily.

## 1. Dashboard layout

Create four synchronized image panels:

1. **Visible Image** — Original uploaded image.
2. **UV Image (365 nm)** — Simulated UV-style fluorescence visualization.
3. **IR/NIR Image (850 nm)** — Simulated near-infrared grayscale visualization.
4. **Contamination Map** — Color-coded candidate residue regions over the analyzed surface.

Maintain the existing professional dark navy-blue medical-technology design. Keep the images aligned, with the same instrument orientation, dimensions, and zoom wherever possible.

## 2. Use my existing images

Locate and load the clean and blood-contaminated images already present in the project assets.

Add a sample selector with:
- Clean Surface
- Blood-Contaminated Surface
- Compare Both

Use the actual uploaded files. Do not replace them with random internet images or generated samples.

When the selection changes, update every relevant panel, overlay, region statistic, confidence score, and result status. Preserve the original images.

## 3. Improve UV visualization

Create a simulated 365 nm UV-style image with a dark violet background and varying fluorescence intensity.

- Show simulated residue responses at locations consistent with the source image.
- Use irregular, naturally shaped candidate regions rather than generic rectangles.
- Provide UV image, UV intensity map, and UV candidate-region views.
- Keep the UV response dependent on the selected sample and simulated image features.

Do not assume all blood fluoresces strongly or that UV fluorescence uniquely identifies blood.

## 4. Improve IR/NIR visualization

Create a simulated 850 nm near-infrared-style grayscale image.

- Show plausible variations in surface reflectance and texture.
- Make candidate residue regions visually distinguishable where the simulation supports it.
- Keep the same candidate locations aligned across all image panels.
- Do not simply apply a grayscale filter and claim that actual NIR measurements were performed.

Clearly distinguish near-infrared imaging from thermal imaging. Do not claim actual temperature measurements without real thermal-camera data.

## 5. Highlight possible blood-like residue

The Contamination Map is the most important panel.

- **Red:** possible blood-like residue.
- **Yellow:** ambiguous region requiring manual inspection.
- **Grey:** normal or unclassified surface.

Use semi-transparent fills and clear contours so the original instrument remains visible beneath the highlights.

For every detected region, show:
- Region ID.
- Candidate classification.
- Estimated area in pixels.
- Percentage of analyzed surface, if surface segmentation is available.
- Simulated UV response.
- Simulated IR/NIR response.
- Confidence score.

All overlays must follow the computed candidate-region boundaries and remain aligned with the original image.

**Do not include scratch detection, scratch classification, scratch sensitivity controls, scratch counts, or scratch-specific colors anywhere in the application.**

## 6. Confidence score

Display a prominent result card beneath the image panels.

Example:

**Candidate Region #01**
- Classification: Possible residue
- Simulation confidence: 82%
- UV-style response: High
- IR/NIR response: Moderate
- Estimated area: Calculated from the detected region

These numbers are illustrative examples only. Compute displayed values from image-processing features rather than hardcoding a fixed result.

The confidence score represents the algorithm's confidence in its candidate classification. It must not be presented as the probability that a region is genuinely blood or as clinically validated accuracy.

If the evidence is inconsistent, show:

**“Ambiguous — Manual Inspection Required.”**

## 7. Clean-versus-contaminated comparison

Create a comparison view using my two existing images.

Show:
- Original clean image.
- Original contaminated image.
- Clean-image candidate map.
- Contaminated-image candidate map.
- Difference visualization, when meaningful.
- Candidate-region counts.
- Estimated candidate area.
- Confidence scores.
- A brief explanation of the differences identified.

Apply the same processing pipeline to both images. Do not force the clean image to show zero detections or the contaminated image to show a positive detection. Results must follow the computed image analysis.

If the algorithm cannot reliably distinguish the images, report that limitation instead of fabricating a successful detection.

## 8. Functional controls

Provide working controls for:
- Detection sensitivity or threshold.
- Minimum candidate-region size.
- UV visualization intensity.
- IR/NIR visualization intensity.
- Overlay opacity.
- Sample selection.
- Reset settings.

Changes must update the relevant overlays, image panels, statistics, and scores immediately.

## 9. Result labels

Use only these result statuses:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — Manual Inspection Required.
- Analysis unavailable.

Never claim “Blood confirmed,” “Sterile,” or “Safe for use.”

## 10. Technical implementation

Use the existing project's framework and dependencies. If the project uses React and TypeScript, continue with them.

Implement a modular pipeline:
1. Load the selected image.
2. Normalize brightness and contrast.
3. Segment the instrument or analyzed surface where feasible.
4. Extract candidate residue regions.
5. Calculate region features and confidence scores.
6. Generate color-coded overlays.
7. Update the dashboard and comparison view.

Use Canvas, OpenCV.js, or the project's existing image-processing tools as appropriate.

If accurate instrument segmentation is not possible, allow manual selection of the analysis region instead of reporting misleading area percentages.

## 11. Final testing

Test the complete application using my actual uploaded images.

Verify that:
- Both images load correctly.
- Switching samples updates every relevant panel.
- UV and IR/NIR visualizations change according to the selected sample.
- Candidate overlays align with the original image.
- Threshold changes update detections and scores.
- The comparison view uses both uploaded images.
- Results are not hardcoded.
- Every button works.
- No scratch-related feature remains.
- The application runs locally without errors.

Display this disclaimer:

“BloodTrace Vision is an experimental image-analysis simulation. UV and IR/NIR views may be simulated. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”

After implementation, run the project, fix errors, and provide instructions for launching it locally.

# ==========================================
# DOCUMENT 8 (stream index 2790)
# ==========================================

# BloodTrace Vision — Upgrade Existing Simulation Using My Actual Test Images

Improve my existing **BloodTrace Vision** project. Do not rebuild the project from scratch or remove existing working features. First inspect the current codebase, image assets, and file structure, then integrate the improvements below into the existing application.

I have already added images of:
1. A clean surgical instrument or clean metal surface.
2. A blood-contaminated surgical instrument or metal surface.

**You must locate and use these existing images in the project. Do not replace them with random internet images, generated images, or newly invented sample data.** Use them as the primary reference images for the clean-versus-contaminated comparison.

Use my attached BloodTrace Vision dashboard screenshot as the UI reference.

## 1. Main dashboard

Maintain the professional dark navy-blue interface and display four synchronized panels:

1. **Visible Image** — The actual uploaded input image.
2. **UV Image — Simulated 365 nm** — A simulated UV visualization derived from the input image and its selected test condition.
3. **IR/NIR Image — Simulated 850 nm** — A grayscale near-infrared-style visualization.
4. **Contamination & Surface Analysis Map** — A pixel-aligned overlay showing candidate residue and scratches.

Keep the same instrument position and orientation across all panels. Do not independently resize, rotate, or shift individual images in a way that causes incorrect overlays.

Clearly label simulated UV and IR/NIR views as simulated if actual measurements are unavailable.

## 2. Use my existing clean and contaminated images

Create a working sample selector with at least these options:

- Clean Surface — load my actual clean image.
- Blood-Contaminated Surface — load my actual contaminated image.
- Compare Both — show a side-by-side comparison using both uploaded images.

Automatically find the existing images in the project's assets, public folder, or other relevant image directories. Inspect the actual filenames and file formats rather than assuming their names.

Use these images as the default demonstration samples. Preserve the originals and do not overwrite them.

When the user changes samples, update all four panels, region overlays, measurements, confidence scores, charts, and final status.

If the images have different dimensions, align and scale them consistently for display. If the instruments are photographed at different angles, do not pretend their pixels correspond exactly; explain the alignment limitation or provide a registration option.

## 3. Improve scratch detection

The analysis map must distinguish scratches from possible residue.

Use different visual colors:
- **Red:** possible blood-like residue candidate.
- **Cyan/blue:** suspected scratch or surface defect.
- **Yellow:** ambiguous mark or possible non-blood residue.
- **Grey:** ordinary surface or unclassified region.

Detect thin elongated lines and irregular surface marks where the available image supports it. Use image-processing methods such as grayscale conversion, contrast enhancement, adaptive thresholding, edge detection, morphological operations, and contour extraction, or suitable equivalent methods.

Avoid treating every dark line, reflection, or bright spot as contamination.

Show separate statistics for:
- Candidate residue regions.
- Suspected scratches.
- Ambiguous regions.
- Estimated candidate-region area.

Make each overlay follow the actual detected shape instead of displaying generic rectangles.

## 4. UV visualization

Create a simulated 365 nm UV-style visualization with a dark violet background and varying fluorescence intensity.

Use the original image and image-processing results to place simulated responses in consistent locations. The uploaded visible-light photographs are not UV measurements, so do not claim the application has measured real fluorescence.

Provide controls to switch between:
- UV-style visualization.
- UV intensity map.
- UV candidate regions.

Do not assume all blood fluoresces strongly or that fluorescence alone identifies blood.

## 5. IR/NIR visualization

Create a simulated 850 nm near-infrared-style grayscale image. Show plausible variations in surface reflectance and texture, including possible residue and scratches where appropriate.

The image must not merely be a grayscale copy with arbitrary marks added. Use deterministic, condition-dependent simulated transformations and keep candidate locations consistent across panels.

Clearly distinguish near-infrared imaging from thermal imaging. Do not claim actual temperature measurements unless a real thermal sensor image is provided.

## 6. Contamination map and confidence score

Create a high-quality overlay on the original image.

For each candidate region, show:
- Region ID.
- Candidate class.
- Estimated pixel area and percentage of the analyzed surface, if the surface mask is available.
- UV-style response score.
- IR/NIR-style response score.
- Shape or texture features.
- Scratch likelihood.
- Confidence score.
- Explanation of why the region was flagged.

Example presentation:

**Candidate Region #01**
- Classification: Possible residue
- Confidence: 82%
- UV-style response: High
- IR/NIR-style response: Moderate
- Shape: Irregular patch
- Scratch likelihood: Low
- Estimated area: Calculated from the detected region

These values are examples of the interface only. Calculate scores from the actual algorithm and simulated features rather than hardcoding these numbers.

**Important:** The confidence score must describe confidence in the algorithm's candidate classification, not the probability that a region is genuinely blood. State that the score is not clinically validated.

## 7. Clean-versus-contaminated comparison

Add a dedicated comparison view using my two uploaded images.

Show:
- Clean input.
- Contaminated input.
- Clean-image candidate map.
- Contaminated-image candidate map.
- Difference visualization, where meaningful.
- Candidate-region count and estimated area for each image.
- Confidence scores for detected candidates.
- A short explanation of the differences detected.

Use the same processing pipeline for both images so the comparison is fair.

Do not force the clean sample to produce zero detections or the contaminated sample to produce a positive result. Let the image-processing output determine the displayed result. If the algorithm fails to distinguish them, display that limitation honestly.

## 8. Threshold and processing controls

Add functional controls for:
- Detection sensitivity or threshold.
- Minimum candidate-region size.
- Scratch-detection sensitivity.
- UV-style visualization intensity.
- IR/NIR visualization intensity.
- Overlay opacity.
- Reset settings.

Changing a control must immediately update the relevant image overlays, detected regions, statistics, and scores. No decorative or nonfunctional controls.

## 9. Result status

Use these labels:
- No candidate region detected.
- Possible residue detected.
- Ambiguous — manual inspection required.
- Analysis unavailable.

Never display “Blood confirmed,” “Sterile,” or “Safe for use.” A clean-looking image does not prove that an instrument is clean or sterile.

## 10. Technical implementation

Use the existing project's framework and dependencies. If it already uses React and TypeScript, continue with that stack.

Implement a modular image-processing pipeline:
1. Load the selected input image.
2. Preprocess and normalize the image.
3. Segment the instrument or analyzed surface where feasible.
4. Identify candidate regions and scratch-like structures.
5. Calculate region features and scores.
6. Render color-coded overlays.
7. Update the results dashboard.

Use Canvas, OpenCV.js, or the project's existing image-processing tools where appropriate. Keep the code organized, reusable, and easy to demonstrate.

If reliable instrument segmentation is not possible, let the user select the analysis region manually rather than reporting misleading surface-area percentages.

## 11. Final testing requirements

Before finishing, test the application using my actual clean and contaminated images.

Verify that:
- Both images load correctly.
- Switching samples updates every relevant panel.
- Scratch and residue overlays use different colors.
- All overlays remain aligned with the source image.
- Changing thresholds changes the detected regions and results.
- Confidence scores are derived from computed features.
- The comparison view uses both actual images.
- No fixed, hardcoded detection outcome is shown for every image.
- The interface works at common laptop screen sizes.
- No existing working functionality is broken.

Add a small visible disclaimer:

“BloodTrace Vision is an experimental image-analysis simulation. UV and IR/NIR views may be simulated. Results are not clinically validated and cannot establish blood identity, instrument cleanliness, or sterility.”

Finally, run the project locally, fix errors, and provide clear instructions for starting it and testing the two images.

# ==========================================
# DOCUMENT 9 (stream index 2860)
# ==========================================

# BloodTrace Vision —

# ==========================================
# DOCUMENT 10 (stream index 3705)
# ==========================================

# Project: BloodTrace — Dual-Wavelength Medical Instrument Contamination Detection Simulator

## 1. Project Overview

Build a complete, interactive, professional-looking simulation of **BloodTrace**, a compact, low-cost optical screening device designed to identify and visualize possible residual blood contamination on reusable medical instruments before sterilization.

This is a college-level engineering project based on:
- Arduino UNO R4 Minima
- UV LED illumination at 365 nm
- Infrared/NIR LED illumination at approximately 850 nm
- BPW34 photodiode with an amplifier
- USB camera
- Laptop-based Python/OpenCV-style image processing

The simulation should demonstrate how these components work together. It must be visually realistic, technically plausible, interactive, and suitable for presenting to a college professor.

**Important:** This is a simulation, not a validated medical diagnostic device. Label detected areas as "Suspected Residue" or "Possible Contamination," never as confirmed blood. Clearly distinguish simulated sensor readings from real hardware measurements.

## 2. Application Structure

Create a responsive web application with two main views:

1. **Device Simulation**
2. **Laptop Analysis Dashboard**

Use a modern scientific-instrument interface with a dark navy background, clean typography, cyan optical highlights, restrained red contamination indicators, and realistic device components.

The application should look like a real engineering prototype rather than a generic admin dashboard.

## 3. Device Simulation

Render a realistic compact BloodTrace device consisting of:

- A matte-black rectangular optical enclosure.
- A front-facing USB camera.
- One 365 nm UV LED.
- One or more 850 nm IR LEDs.
- A sample platform holding a reusable stainless-steel surgical instrument, such as forceps, scissors, or a surgical clamp.
- An Arduino UNO R4 Minima board.
- An IR photodiode sensor module.
- MOSFET switching circuits for the UV and IR illumination.
- A USB connection from the Arduino to a laptop.

Show the LEDs switching on and off in response to user controls. Use visible violet illumination effects to represent UV mode and subtle illumination effects for IR mode. Do not imply that infrared light is visible to the human eye.

Provide a toggle between:
- UV mode
- IR mode
- Combined UV + IR mode
- All illumination off

Display the current illumination state and a simplified device connection diagram.

## 4. Instrument Sample Simulation

Create a large, clear visualization of a reusable medical instrument.

Allow the user to choose between:
- Surgical scissors
- Forceps
- Hemostat
- Stainless-steel instrument coupon

Include these selectable sample conditions:
- Clean reference sample
- Simulated dried blood residue
- Simulated small blood spot
- Simulated multiple contamination spots
- Simulated detergent residue
- Simulated water marks
- Simulated surface scratches

Allow the user to change contamination location and approximate size using clickable points or sliders.

Render simulated residue as realistic but clearly illustrative surface markings. The contamination location should remain consistent across UV, IR, and combined views, while its simulated optical appearance changes between illumination modes.

Use a controlled random seed or stored sample configuration so repeated scans of the same sample produce consistent results.

## 5. Optical Scanning Workflow

Implement the following workflow:

1. User selects the medical instrument.
2. User selects the sample condition.
3. User places or selects simulated residue on the instrument.
4. User presses **Start Scan**.
5. The device switches through UV, IR, and combined modes.
6. The simulated camera captures an image in each mode.
7. The photodiode produces a simulated intensity reading.
8. The application compares the captured images with a clean reference.
9. An image-processing animation highlights candidate residue regions.
10. The laptop dashboard displays the images, sensor readings, and screening result.

Include a short scanning animation with illumination changes, a progress indicator, and a final results screen.

Do not show the result instantly when Start Scan is clicked; simulate a believable acquisition and processing sequence.

## 6. Simulated Sensor Model

Create a sensor simulation with separate data channels for:

### UV channel
- Simulated fluorescence intensity.
- Background illumination level.
- Noise.
- Response to the selected sample condition.

### IR/NIR channel
- Simulated reflected-light intensity.
- Background level.
- Noise.
- Response to the selected sample condition.

### Photodiode channel
- A numerical intensity reading.
- A live-looking graph.
- A baseline and changing measurement value as illumination changes.

Use deterministic, condition-dependent equations rather than arbitrary random numbers.

For example:
- Clean samples should generally remain close to their baseline.
- Simulated blood residue may produce a different optical response.
- Detergent residue and scratches should sometimes create overlapping responses.
- Noise and surface variation should prevent every classification from being perfectly accurate.

These are illustrative simulation assumptions, not experimentally established properties of the sensors.

Display simulated readings in arbitrary units unless a real calibration has been performed. Never invent real-world accuracy percentages or detection limits.

## 7. Laptop Analysis Dashboard

Create a professional dashboard with four image panels:

### Panel A — Reference Image
Display the clean reference image of the instrument.

### Panel B — UV Image
Display the simulated UV-mode image, including illustrative fluorescence-like contrast.

### Panel C — IR/NIR Image
Display the simulated near-infrared image, including reflectance-like contrast.

### Panel D — Candidate Residue Map
Display the instrument image with highlighted candidate contamination regions.

Use red outlines or transparent red overlays for candidate regions. Use neutral grey for the instrument surface and cyan for structural edges.

Allow the user to:
- Zoom into the instrument.
- Switch between image panels.
- Toggle the candidate-region overlay.
- Adjust a simulated detection threshold.
- Compare the current sample with the clean reference.
- Reset the scan.

If the threshold changes, update the displayed candidate regions and reported candidate area.

## 8. Detection and Classification Logic

Implement an understandable image-processing simulation.

Suggested pipeline:

Reference image
→ UV and IR image acquisition
→ Background correction
→ Image alignment
→ Channel comparison
→ Candidate-region extraction
→ Noise filtering
→ Contour generation
→ Candidate residue map

Use image differences and configurable thresholds to generate candidate regions.

The classification system should distinguish between:
- No significant optical difference detected
- Possible residue detected
- Ambiguous result — manual inspection required

Include the selected sample condition in the simulation's internal ground truth, but do not use it to directly force the displayed result. The displayed result must depend on the simulated image and sensor signals.

Allow occasional false positives and missed detections to demonstrate real-world uncertainty.

Never claim that optical differences prove the presence of blood.

## 9. Arduino UNO R4 Minima Panel

Include a virtual Arduino panel showing the simulated wiring:

- D9 → UV LED MOSFET gate through a 1 kΩ resistor.
- D10 → IR LED MOSFET gate through a 1 kΩ resistor.
- A0 ← photodiode amplifier output.
- D2 ← push button connected to ground using INPUT_PULLUP.
- 5V and GND connections.
- USB connection to the laptop.

Show the current state of D9, D10, A0, and D2.

Include a virtual serial monitor displaying simulated messages such as:

MODE=0,SENSOR=512
MODE=1,SENSOR=638
MODE=2,SENSOR=571

These are illustrative values only. Generate readings dynamically from the simulation state rather than hardcoding these exact numbers.

Include a toggle for the virtual Arduino connection:
- Connected
- Disconnected

When disconnected, stop updating the virtual serial monitor and show a connection warning.

Make it clear that the virtual board is a software representation and does not communicate with physical hardware.

## 10. Live Charts and Results

Display:
- UV intensity over time.
- IR/NIR intensity over time.
- Photodiode readings over time.
- Number of candidate regions.
- Approximate candidate area in pixels or percentage of the visible instrument surface.
- Scan duration.

Use simulated data and label all charts as simulation data.

Do not present the percentage of the surface highlighted as a blood concentration or a validated contamination score.

## 11. Results Report

After each scan, create a results card containing:

- Scan ID
- Selected instrument
- Selected sample condition
- UV intensity
- IR/NIR intensity
- Photodiode reading
- Number of candidate regions
- Approximate candidate area
- Screening result
- Scan timestamp
- Simulation status

Provide an option to export the results as a downloadable CSV file.

Also provide a **Generate Report** option that creates a printable summary with the images, readings, and candidate-region map.

Clearly mark exported results:

"SIMULATED DATA — NOT A CLINICAL TEST RESULT."

## 12. Technical Requirements

- Build the application as a working interactive web application.
- Use React and TypeScript if appropriate for the existing project.
- Use HTML Canvas or SVG to render the instrument and contamination map.
- Use OpenCV.js if suitable, or implement equivalent image-difference and contour-like operations.
- Use charts for live-looking sensor data.
- Keep the interface responsive for laptop and desktop screens.
- Use reusable components and clean project structure.
- Include meaningful error handling and loading states.
- Ensure all buttons and controls work.
- Avoid decorative controls that have no functional effect.
- Preserve any existing working project features if modifying an existing codebase.

If real image assets are used, choose appropriate instrument imagery and ensure the detection overlay remains spatially aligned with the underlying image.

Do not require physical Arduino hardware to run the simulation.

## 13. Suggested Interface Layout

### Top navigation
BloodTrace logo | Device Simulation | Analysis Dashboard | Results | About

### Main workspace
Left side:
- Instrument selection
- Sample condition
- Illumination controls
- Scan button
- Detection threshold

Centre:
- Large instrument visualization
- Animated optical head
- Scan progress

Right side:
- Simulated Arduino state
- UV reading
- IR reading
- Photodiode reading
- Connection status

### Analysis workspace
Four image panels, live sensor charts, candidate residue map, and scan report.

## 14. Demonstration Scenario

Include a built-in demonstration:

1. Load a clean stainless-steel forceps sample.
2. Run the scan and display the baseline response.
3. Load the same forceps with one simulated dried-blood spot.
4. Run the scan again.
5. Compare UV and IR responses.
6. Show the candidate-region overlay.
7. Switch to detergent residue.
8. Demonstrate that a similar optical response can cause ambiguity.
9. Explain why controlled validation is necessary before making a blood-specific claim.

This scenario should be available through a **Run Demo** button.

## 15. Final Deliverable

Deliver a complete, runnable simulation with:
- Functional device controls.
- A convincing virtual optical instrument.
- UV and IR illumination modes.
- Simulated photodiode measurements.
- Virtual Arduino wiring and serial output.
- Instrument image visualization.
- Candidate residue detection map.
- Live sensor charts.
- Scan history.
- CSV export.
- Printable report.
- Clear distinction between simulated results and validated measurements.

Build the application first, then test the complete workflow from sample selection to report generation. Fix broken interactions and ensure the simulation remains usable without any external hardware.

The final result should look like a polished engineering demonstration of a potential college research project, not a claim that a clinically accurate blood detector has already been developed.

