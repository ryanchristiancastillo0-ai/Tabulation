// utils/exportToPNG.js
// Handles html2canvas's lack of support for modern CSS color functions
// like oklab, oklch, color-mix() which Tailwind v3/v4 and modern browsers use.

/**
 * Creates a tiny fixed modal to display messages on screen instead of the console.
 */
function showModal(message) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #222;
    color: #fff;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 999999;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: opacity 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  modal.textContent = message;

  // Remove the modal if the user clicks on it
  modal.addEventListener('click', () => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  });

  document.body.appendChild(modal);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (modal.parentNode) {
      modal.style.opacity = '0';
      setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 300); // Wait for fade transition
    }
  }, 5000);
}

/**
 * Clones an element and replaces all computed styles that contain
 * unsupported color functions (oklab, oklch, color-mix, etc.) with
 * their resolved hex/rgb equivalents so html2canvas can render them.
 */
function sanitizeElementForCapture(el) {
  const clone = el.cloneNode(true);

  // Position clone off-screen but fully rendered
  clone.style.position = 'fixed';
  clone.style.top      = '-99999px';
  clone.style.left     = '-99999px';
  clone.style.zIndex   = '-1';
  clone.style.width    = el.offsetWidth + 'px';
  document.body.appendChild(clone);

  const sourceEls = [el, ...el.querySelectorAll('*')];
  const cloneEls  = [clone, ...clone.querySelectorAll('*')];

  const UNSUPPORTED = /oklab|oklch|color-mix|color\(/;

  const PROPS = [
    'color', 'backgroundColor', 'borderColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'textDecorationColor', 'caretColor', 'fill', 'stroke',
    'boxShadow', 'backgroundImage',
  ];

  sourceEls.forEach((srcEl, i) => {
    const cloneEl    = cloneEls[i];
    if (!cloneEl) return;
    const computed   = window.getComputedStyle(srcEl);

    PROPS.forEach(prop => {
      const val = computed.getPropertyValue(
        // Convert camelCase → kebab-case for getPropertyValue
        prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
      );
      if (val && UNSUPPORTED.test(val)) {
        // Use the browser-computed color by painting to a 1x1 canvas
        const resolved = resolveColor(srcEl, prop);
        if (resolved) {
          try {
            cloneEl.style[prop] = resolved;
          } catch {
            // Some props (boxShadow) are complex — skip if can't set directly
          }
        }
      }
    });
  });

  return clone;
}

/**
 * Resolves a CSS color property on an element to a safe rgb() string
 * by temporarily applying a known background and sampling the canvas pixel.
 * Falls back to 'transparent' if resolution fails.
 */
function resolveColor(el, prop) {
  try {
    const computed = window.getComputedStyle(el);
    const val      = computed[prop];
    if (!val || val === 'none' || val === 'transparent') return null;

    // Create a tiny canvas and draw a 1x1 div with the color applied
    const div    = document.createElement('div');
    div.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 1px; height: 1px;
      background: ${prop === 'color' ? 'transparent' : ''};
      ${prop}: ${val};
    `;
    document.body.appendChild(div);

    // Use the computed background-color as a resolved value
    const resolved = window.getComputedStyle(div).getPropertyValue(
      prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    );
    document.body.removeChild(div);

    // If still unsupported, fall back to white/black
    if (!resolved || /oklab|oklch|color-mix/.test(resolved)) {
      return prop === 'color' ? '#191c1e' : '#ffffff';
    }
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Loads html2canvas from CDN if not already present.
 * Tries the patched build first, falls back to 1.4.1.
 */
async function loadHtml2Canvas() {
  if (window.html2canvas) return;

  // Try loading — use a Promise wrapper so we can await it
  await new Promise((resolve, reject) => {
    const s   = document.createElement('script');
    // 1.4.1 is the latest stable; patch oklab via element sanitization instead
    s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Main export function.
 * Captures the element with id=tableId as a PNG and triggers download.
 *
 * @param {string} tableId   - The DOM id of the element to capture
 * @param {string} filename  - Downloaded file name (e.g. "standings.png")
 */
export default async function exportToPNG(tableId, filename) {
  try {
    await loadHtml2Canvas();

    const el = document.getElementById(tableId);
    if (!el) {
      showModal(`[exportToPNG] Element #${tableId} not found.`);
      return;
    }

    // Sanitize: replace oklab/oklch colors with resolved rgb values
    const clone = sanitizeElementForCapture(el);

    try {
      const canvas = await window.html2canvas(clone, {
        scale:           2,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        // Tell html2canvas to use the clone's exact dimensions
        width:           el.offsetWidth,
        height:          el.offsetHeight,
        windowWidth:     document.documentElement.scrollWidth,
        windowHeight:    document.documentElement.scrollHeight,
      });

      const url = canvas.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
    } finally {
      // Always clean up the clone
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    }

  } catch (err) {
    showModal(`[exportToPNG] Failed to export PNG: ${err.message}`);
    // Surface a friendly alert so the user knows something went wrong
    alert(`PNG export failed: ${err.message}\n\nTry using CSV export instead.`);
  }
}