/* ======================================
   📊 MINI CHARTS — ACM Activités
   Graphiques en barres CSS (pas de dépendance)
   ====================================== */

const COLORS = ['#FF6B35','#4361EE','#06D6A0','#FFD93D','#9B5DE5','#FF2E63','#00B4D8','#EF233C','#FF9F1C','#7209B7'];

/**
 * Crée un graphique en barres horizontal dans un canvas
 * @param {string} canvasId
 * @param {Object} counts - { label: count, ... }
 */
function drawBarChart(canvasId, counts) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return;

  const pad = { top: 20, bottom: 20, left: 120, right: 40 };
  const barHeight = 30;
  const gap = 10;
  const h = entries.length * (barHeight + gap) + pad.top + pad.bottom;
  canvas.height = h;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = 600 * dpr;
  canvas.style.width = '100%';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const w = 600;
  const chartW = w - pad.left - pad.right;
  const maxVal = Math.max(...entries.map(([, v]) => v));

  ctx.clearRect(0, 0, w, h);

  entries.forEach(([label, val], i) => {
    const y = pad.top + i * (barHeight + gap);
    const barW = (val / maxVal) * chartW;
    const color = COLORS[i % COLORS.length];

    // Texte du label
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.fillStyle = '#1A1A2E';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pad.left - 10, y + barHeight / 2);

    // Barre avec bordure
    ctx.fillStyle = color;
    ctx.fillRect(pad.left, y, barW, barHeight);
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad.left, y, barW, barHeight);

    // Valeur
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.fillStyle = '#1A1A2E';
    ctx.textAlign = 'left';
    ctx.fillText(val, pad.left + barW + 8, y + barHeight / 2);
  });
}

/**
 * Crée un graphique donut dans un canvas
 * @param {string} canvasId
 * @param {Object} counts - { label: count, ... }
 */
function drawDonutChart(canvasId, counts, legendId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const size = Math.max(240, Math.min(canvas.clientWidth, 320));
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.31;
  const innerR = size * 0.17;
  let startAngle = -Math.PI / 2;

  entries.forEach(([label, val], i) => {
    const slice = (val / total) * Math.PI * 2;
    const color = COLORS[i % COLORS.length];
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // no white fill inside the donut slices, keep the hole transparent
    // ctx.beginPath();
    // ctx.arc(cx, cy, innerR, startAngle, endAngle, false);
    // ctx.lineTo(cx, cy);
    // ctx.closePath();
    // ctx.fillStyle = 'rgba(255,255,255,0.96)';
    // ctx.fill();

    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, innerR + 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1A1A2E';
  ctx.textAlign = 'center';
  ctx.font = '800 22px Nunito, sans-serif';
  ctx.fillText(total, cx, cy - 6);
  ctx.font = '700 13px Nunito, sans-serif';
  ctx.fillText('activités', cx, cy + 16);

  if (legendId) {
    const legendEl = document.getElementById(legendId);
    if (legendEl) {
      legendEl.innerHTML = entries.map(([label, val], i) => {
        const pct = Math.round((val / total) * 100);
        const color = COLORS[i % COLORS.length];
        return `
          <div class="legend-item">
            <span class="legend-dot" style="background:${color};"></span>
            <span class="legend-label">${label}</span>
            <span class="legend-value">${pct}%</span>
          </div>
        `;
      }).join('');
    }
  }
}
