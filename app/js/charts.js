// Custom HTML5 Canvas chart drawing module for Dompet Keluarga (zero external libraries).
// Handles devicePixelRatio scaling so charts stay sharp on desktop and high-DPI phone screens.

import { formatShortRupiah } from './state.js';

function setupCanvas(canvas, cssWidth, cssHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return ctx;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawDonutChart(canvas, slices, centerTop, centerBottom) {
  if (!canvas) return;
  const size = Math.min(canvas.parentElement?.clientWidth || 220, 224);
  const ctx = setupCanvas(canvas, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.43;
  const thickness = size * 0.16;

  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  if (total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E5DFD3';
    ctx.lineWidth = thickness;
    ctx.stroke();
  } else {
    let start = -Math.PI / 2;
    const gap = slices.filter((s) => s.value > 0).length > 1 ? 0.024 : 0;
    for (const slice of slices) {
      if (slice.value <= 0) continue;
      const sweep = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start + gap / 2, start + Math.max(sweep - gap / 2, 0.01));
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt';
      ctx.stroke();
      start += sweep;
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#586560';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(centerTop, cx, cy - 11);

  ctx.fillStyle = '#1B2522';
  ctx.font = '800 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(centerBottom, cx, cy + 9);
}

export function drawBudgetBarChart(canvas, rows) {
  if (!canvas) return;
  const width = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || 520));
  const rowHeight = 36;
  const padTop = 26;
  const padBottom = 14;
  const padLeft = 92;
  const padRight = 72;
  const height = padTop + rows.length * rowHeight + padBottom;
  const ctx = setupCanvas(canvas, width, height);

  const chartW = Math.max(110, width - padLeft - padRight);
  const maxVal = Math.max(500000, ...rows.map((r) => Math.max(r.budget, r.spent)));

  // Legend header
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#E2DDD2';
  roundRectPath(ctx, padLeft, 6, 12, 10, 3);
  ctx.fill();
  ctx.fillStyle = '#586560';
  ctx.fillText('Anggaran', padLeft + 17, 11);

  ctx.fillStyle = '#0F5C4D';
  roundRectPath(ctx, padLeft + 88, 6, 12, 10, 3);
  ctx.fill();
  ctx.fillStyle = '#586560';
  ctx.fillText('Realisasi', padLeft + 105, 11);

  ctx.fillStyle = '#DC2626';
  roundRectPath(ctx, padLeft + 172, 6, 12, 10, 3);
  ctx.fill();
  ctx.fillStyle = '#586560';
  ctx.fillText('Melebihi', padLeft + 189, 11);

  // Subtle vertical gridlines
  for (let i = 0; i <= 4; i++) {
    const gx = padLeft + (chartW * i) / 4;
    ctx.strokeStyle = '#EFECE4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, padTop - 4);
    ctx.lineTo(gx, height - padBottom);
    ctx.stroke();
  }

  rows.forEach((row, index) => {
    const y = padTop + index * rowHeight;
    const budgetW = (row.budget / maxVal) * chartW;
    const spentW = (row.spent / maxVal) * chartW;
    const isOver = row.id !== 'Tabungan' && row.spent > row.budget;

    // Category label
    ctx.fillStyle = '#1B2522';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.label, padLeft - 10, y + 14);

    // Budget background track
    ctx.fillStyle = '#E5DFD3';
    roundRectPath(ctx, padLeft, y + 5, Math.max(budgetW, 4), 18, 5);
    ctx.fill();

    // Actual bar
    ctx.fillStyle = isOver ? '#DC2626' : row.color;
    roundRectPath(ctx, padLeft, y + 8, Math.max(spentW, 3), 12, 4);
    ctx.fill();

    // Budget cap tick mark
    ctx.strokeStyle = '#1B2522';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(padLeft + budgetW, y + 4);
    ctx.lineTo(padLeft + budgetW, y + 24);
    ctx.stroke();

    // Right value label
    ctx.fillStyle = isOver ? '#B91C1C' : '#1B2522';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(formatShortRupiah(row.spent), padLeft + Math.max(budgetW, spentW) + 8, y + 14);
  });
}

export function drawDailyTrendChart(canvas, expenses) {
  if (!canvas) return;
  const width = Math.max(260, Math.floor(canvas.parentElement?.clientWidth || 480));
  const height = 165;
  const ctx = setupCanvas(canvas, width, height);

  const padTop = 18;
  const padBottom = 26;
  const padLeft = 10;
  const padRight = 10;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Group spending into 5-day buckets for clean readability on desktop and phone
  const buckets = [
    { label: '1-5 Nov', total: 0 },
    { label: '6-10 Nov', total: 0 },
    { label: '11-15 Nov', total: 0 },
    { label: '16-20 Nov', total: 0 },
    { label: '21-26 Nov', total: 0 },
  ];

  for (const exp of expenses) {
    if (exp.category === 'Tabungan') continue;
    const day = Number(String(exp.date || '').split('-')[2]) || 26;
    const idx = Math.min(4, Math.max(0, Math.floor((day - 1) / 5)));
    buckets[idx].total += exp.amount;
  }

  const maxVal = Math.max(300000, ...buckets.map((b) => b.total));
  const slotW = chartW / buckets.length;
  const barW = Math.min(48, slotW * 0.56);

  // Baseline
  ctx.strokeStyle = '#E5DFD3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + chartH);
  ctx.lineTo(width - padRight, padTop + chartH);
  ctx.stroke();

  buckets.forEach((b, i) => {
    const barH = (b.total / maxVal) * (chartH - 12);
    const x = padLeft + i * slotW + (slotW - barW) / 2;
    const y = padTop + chartH - barH;

    ctx.fillStyle = i === 4 ? '#C96A2B' : '#0F5C4D';
    roundRectPath(ctx, x, y, barW, Math.max(barH, 3), 6);
    ctx.fill();

    ctx.fillStyle = '#1B2522';
    ctx.font = '700 10.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatShortRupiah(b.total), x + barW / 2, y - 4);

    ctx.fillStyle = '#586560';
    ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(b.label, x + barW / 2, padTop + chartH + 7);
  });
}

export function drawGoalProgressChart(canvas, goals) {
  if (!canvas) return;
  const width = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || 540));
  const rowH = 38;
  const padTop = 10;
  const padBottom = 8;
  const padLeft = 148;
  const padRight = 56;
  const height = padTop + Math.max(1, goals.length) * rowH + padBottom;
  const ctx = setupCanvas(canvas, width, height);

  const chartW = Math.max(80, width - padLeft - padRight);

  goals.forEach((goal, i) => {
    const y = padTop + i * rowH;
    const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;

    ctx.fillStyle = '#1B2522';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const shortName = goal.name.length > 20 ? `${goal.name.slice(0, 19)}…` : goal.name;
    ctx.fillText(shortName, padLeft - 12, y + 16);

    ctx.fillStyle = '#EAE4D8';
    roundRectPath(ctx, padLeft, y + 8, chartW, 16, 8);
    ctx.fill();

    ctx.fillStyle = goal.color || '#0F5C4D';
    roundRectPath(ctx, padLeft, y + 8, Math.max(chartW * pct, 8), 16, 8);
    ctx.fill();

    ctx.fillStyle = '#1B2522';
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(pct * 100)}%`, padLeft + chartW + 10, y + 16);
  });
}

export function drawRuleSplitChart(canvas, ruleData) {
  if (!canvas) return;
  const width = Math.max(260, Math.floor(canvas.parentElement?.clientWidth || 520));
  const height = 112;
  const ctx = setupCanvas(canvas, width, height);

  const padLeft = 86;
  const padRight = 14;
  const barW = width - padLeft - padRight;
  const colors = { needs: '#0F5C4D', wants: '#C96A2B', savings: '#16A34A' };

  const rows = [
    {
      label: 'Ideal 50/30/20',
      parts: [
        { key: 'needs', pct: 50 },
        { key: 'wants', pct: 30 },
        { key: 'savings', pct: 20 },
      ],
    },
    {
      label: 'Realisasi Kini',
      parts: [
        { key: 'needs', pct: ruleData.needs.actualPct },
        { key: 'wants', pct: ruleData.wants.actualPct },
        { key: 'savings', pct: ruleData.savings.actualPct },
      ],
    },
  ];

  rows.forEach((row, idx) => {
    const y = 14 + idx * 44;
    ctx.fillStyle = '#1B2522';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.label, padLeft - 10, y + 14);

    // Track for remaining unspent cash if actual < 100%
    ctx.fillStyle = '#ECE7DC';
    roundRectPath(ctx, padLeft, y + 2, barW, 24, 6);
    ctx.fill();

    const sumPct = row.parts.reduce((s, p) => s + p.pct, 0);
    const scale = sumPct > 100 ? 100 / sumPct : 1;
    let cursor = padLeft;

    for (const part of row.parts) {
      const segW = (part.pct * scale / 100) * barW;
      if (segW <= 0.5) continue;
      ctx.fillStyle = colors[part.key];
      ctx.fillRect(cursor, y + 2, segW, 24);
      if (segW > 36) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(part.pct)}%`, cursor + segW / 2, y + 14);
      }
      cursor += segW;
    }
  });
}
