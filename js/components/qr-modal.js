/**
 * BloodTrace™ — Online Simulation & Mobile QR Code Modal
 * Enables judges, professors, and reviewers to scan the QR code and
 * interact with the live simulation directly on their mobile device or laptop.
 */

export class QRModalManager {
  static openQRModal() {
    // Check if already open
    if (document.getElementById('bloodtraceQRModalBackdrop')) {
      return;
    }

    const liveUrl = "https://devanshlila.github.io/Blood-Detector/";
    const qrImgSrc = "assets/images/simulation_qr_code.png";

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'bloodtraceQRModalBackdrop';
    backdrop.style.zIndex = '9999';

    backdrop.innerHTML = `
      <div class="report-modal-content" style="max-width: 520px; padding: 24px; text-align: center; border: 1px solid #06b6d4; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);">
        <div class="report-modal-header" style="border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
          <div class="flex items-center gap-2">
            <span style="font-size: 20px;">🌐</span>
            <h3 class="modal-title" style="color: #22d3ee; font-size: 16px; margin: 0;">Online Simulation & Mobile Access</h3>
          </div>
          <button id="btnCloseQRModalX" class="btn btn-sm btn-ghost" style="color: #94a3b8; font-size: 16px; padding: 4px 8px;">✕</button>
        </div>

        <div style="margin: 12px 0;">
          <p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 14px;">
            Scan this QR code with any smartphone or tablet camera to open the fully interactive <strong>BloodTrace™ Vision</strong> simulator live. No external hardware or installation required.
          </p>

          <div style="display: flex; justify-content: center; margin: 16px 0;">
            <img src="${qrImgSrc}" alt="BloodTrace Online QR Code" style="max-width: 300px; width: 100%; border-radius: 12px; border: 2px solid #06b6d4; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.25);" />
          </div>

          <div style="background: #0b1329; border: 1px solid #1e3a5f; border-radius: 8px; padding: 12px; margin-top: 14px; text-align: left;">
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace; margin-bottom: 4px;">Live Simulation URL (GitHub Pages):</div>
            <a href="${liveUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; font-family: monospace; color: #06b6d4; word-break: break-all; text-decoration: underline;">
              ${liveUrl}
            </a>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Hosted on branch: <span style="color: #22d3ee; font-family: monospace;">sim1</span> • Zero-hardware client-side simulation</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1e293b; padding-top: 14px; margin-top: 16px;">
          <button id="btnCopyLiveUrl" class="btn btn-xs btn-outline" style="border-color: #06b6d4; color: #22d3ee;">
            📋 Copy URL
          </button>
          <div style="display: flex; gap: 8px;">
            <a href="${liveUrl}" target="_blank" class="btn btn-xs btn-primary" style="background: #06b6d4; color: #070f1e; text-decoration: none; padding: 4px 12px; font-weight: bold; border-radius: 4px; display: inline-flex; align-items: center;">
              Launch Online ↗
            </a>
            <button id="btnCloseQRModalDone" class="btn btn-xs btn-ghost" style="color: #cbd5e1;">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Event listeners
    const close = () => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    };

    document.getElementById('btnCloseQRModalX')?.addEventListener('click', close);
    document.getElementById('btnCloseQRModalDone')?.addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    const copyBtn = document.getElementById('btnCopyLiveUrl');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(liveUrl).then(() => {
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy URL';
          }, 2000);
        }).catch(() => {
          prompt('Copy this URL:', liveUrl);
        });
      });
    }
  }
}
