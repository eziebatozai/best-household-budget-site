// Modul grafik HTML5 Canvas mandiri tanpa pustaka luar untuk Dompet Keluarga.
// Mendukung skala devicePixelRatio agar tajam pada layar desktop maupun ponsel modern.

import { rpCompact } from './state.js';

function prepareContext(canvas, width, height) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function drawRoundedBar(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function renderCategoryDonut(canvas, slices, subtitle, totalText) {
  if (!canvas) return;
  const dim = Math.min(canvas.parentElement?.clientWidth || 216, 216);
  const ctx = prepareContext(canvas, dim, dim);
  const mid = dim / 2;
  const ringRadius = dim * 0.42;
  const strokeWidth = dim * 0.165;

  const grandTotal = slices.reduce((sum, item) => sum + Math.max(0, item.value), 0);

  if (grandTotal <= 0) {
    ctx.beginPath();
    ctx.arc(mid, mid, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E3DDD0';
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  } else {
    let cursor = -Math.PI / 2;
    const activeCount = slices.filter((item) => item.value > 0).length;
    const spacer = activeCount > 1 ? 0.025 : 0;

    for (const item of slices) {
      if (item.value <= 0) continue;
      const angle = (item.value / grandTotal) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(mid, mid, ringRadius, cursor + spacer / 2, cursor + Math.max(angle - spacer / 2, 0.012));
      ctx.strokeStyle = item.color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();
      cursor += angle;
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#56635E';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, mid, mid - 10);

  ctx.fillStyle = '#182320';
  ctx.font = '800 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(totalText, mid, mid + 10);
}

export function renderPlannerComparison(canvas, breakdown) {
  if (!canvas) return;
  const width = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || 500));
  const rowStep = 36;
  const topPad = 28;
  const bottomPad = 12;
  const leftPad = 94;
  const rightPad = 74;
  const height = topPad + breakdown.length * rowStep + bottomPad;
  const ctx = prepareContext(canvas, width, height);

  const trackWidth = Math.max(100, width - leftPad - rightPad);
  const ceiling = Math.max(500000, ...breakdown.map((row) => Math.max(row.limit, row.used)));

  // Legenda ringkas di bagian atas grafik
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const keys = [
    { label: 'Batas', color: '#E3DDD0', x: leftPad },
    { label: 'Realisasi', color: '#114B45', x: leftPad + 66 },
    { label: 'Melebihi', color: '#D13B2E', x: leftPad + 148 },
  ];
  for (const key of keys) {
    ctx.fillStyle = key.color;
    drawRoundedBar(ctx, key.x, 6, 12, 10, 3);
    ctx.fill();
    ctx.fillStyle = '#56635E';
    ctx.fillText(key.label, key.x + 17, 11);
  }

  // Garis bantu vertikal halus
  for (let step = 0; step <= 4; step++) {
    const gx = leftPad + (trackWidth * step) / 4;
    ctx.strokeStyle = '#EFECE4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, topPad - 3);
    ctx.lineTo(gx, height - bottomPad);
    ctx.stroke();
  }

  breakdown.forEach((row, index) => {
    const y = topPad + index * rowStep;
    const limitPx = (row.limit / ceiling) * trackWidth;
    const usedPx = (row.used / ceiling) * trackWidth;
    const exceeded = row.id !== 'Tabungan' && row.used > row.limit;

    ctx.fillStyle = '#182320';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.name, leftPad - 10, y + 14);

    // Latar batas anggaran
    ctx.fillStyle = '#E5DFD2';
    drawRoundedBar(ctx, leftPad, y + 5, Math.max(limitPx, 4), 18, 5);
    ctx.fill();

    // Batang realisasi
    ctx.fillStyle = exceeded ? '#D13B2E' : row.tint;
    drawRoundedBar(ctx, leftPad, y + 8, Math.max(usedPx, 3), 12, 4);
    ctx.fill();

    // Penanda garis batas anggaran
    ctx.strokeStyle = '#182320';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(leftPad + limitPx, y + 3);
    ctx.lineTo(leftPad + limitPx, y + 25);
    ctx.stroke();

    ctx.fillStyle = exceeded ? '#B91C1C' : '#182320';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(rpCompact(row.used), leftPad + Math.max(limitPx, usedPx) + 8, y + 14);
  });
}

export function renderPeriodSpendingBars(canvas, transactions) {
  if (!canvas) return;
  const width = Math.max(260, Math.floor(canvas.parentElement?.clientWidth || 460));
  const height = 172;
  const ctx = prepareContext(canvas, width, height);

  const topPad = 22;
  const bottomPad = 28;
  const sidePad = 10;
  const innerW = width - sidePad * 2;
  const innerH = height - topPad - bottomPad;

  const periods = [
    { label: '1–5 Nov', sum: 0 },
    { label: '6–10 Nov', sum: 0 },
    { label: '11–15 Nov', sum: 0 },
    { label: '16–20 Nov', sum: 0 },
    { label: '21–26 Nov', sum: 0 },
  ];

  for (const tx of transactions) {
    if (tx.category === 'Tabungan') continue;
    const dayNum = Number(String(tx.date || '').split('-')[2]) || 26;
    const bucketIdx = Math.min(4, Math.max(0, Math.floor((dayNum - 1) / 5)));
    periods[bucketIdx].sum += tx.amount;
  }

  const peak = Math.max(300000, ...periods.map((p) => p.sum));
  const colW = innerW / periods.length;
  const barW = Math.min(46, colW * 0.56);

  // Garis dasar
  ctx.strokeStyle = '#E3DDD0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sidePad, topPad + innerH);
  ctx.lineTo(width - sidePad, topPad + innerH);
  ctx.stroke();

  periods.forEach((p, idx) => {
    const barH = (p.sum / peak) * (innerH - 10);
    const x = sidePad + idx * colW + (colW - barW) / 2;
    const y = topPad + innerH - barH;

    ctx.fillStyle = idx === 4 ? '#C85A28' : '#114B45';
    drawRoundedBar(ctx, x, y, barW, Math.max(barH, 3), 6);
    ctx.fill();

    ctx.fillStyle = '#182320';
    ctx.font = '700 10.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(rpCompact(p.sum), x + barW / 2, y - 4);

    ctx.fillStyle = '#56635E';
    ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(p.label, x + barW / 2, topPad + innerH + 7);
  });
}

export function renderGoalsComparison(canvas, goals) {
  if (!canvas) return;
  const width = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || 520));
  const stepH = 38;
  const topPad = 10;
  const bottomPad = 10;
  const leftPad = 152;
  const rightPad = 52;
  const height = topPad + Math.max(1, goals.length) * stepH + bottomPad;
  const ctx = prepareContext(canvas, width, height);

  const trackW = Math.max(80, width - leftPad - rightPad);

  goals.forEach((goal, idx) => {
    const y = topPad + idx * stepH;
    const pct = goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0;

    ctx.fillStyle = '#182320';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const clipped = goal.title.length > 21 ? `${goal.title.slice(0, 20)}…` : goal.title;
    ctx.fillText(clipped, leftPad - 12, y + 16);

    ctx.fillStyle = '#EAE4D8';
    drawRoundedBar(ctx, leftPad, y + 8, trackW, 16, 8);
    ctx.fill();

    ctx.fillStyle = goal.tint || '#114B45';
    drawRoundedBar(ctx, leftPad, y + 8, Math.max(trackW * pct, 8), 16, 8);
    ctx.fill();

    ctx.fillStyle = '#182320';
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(pct * 100)}%`, leftPad + trackW + 10, y + 16);
  });
}

export function renderRule503020Chart(canvas, groups) {
  if (!canvas) return;
  const width = Math.max(260, Math.floor(canvas.parentElement?.clientWidth || 540));
  const height = 114;
  const ctx = prepareContext(canvas, width, height);

  const leftPad = 94;
  const rightPad = 16;
  const fullW = width - leftPad - rightPad;
  const palette = { needs: '#114B45', wants: '#C85A28', savings: '#16794A' };

  const tracks = [
    {
      label: 'Acuan 50/30/20',
      segments: [
        { id: 'needs', pct: 50 },
        { id: 'wants', pct: 30 },
        { id: 'savings', pct: 20 },
      ],
    },
    {
      label: 'Realisasi Nov',
      segments: [
        { id: 'needs', pct: groups.needs.actualPct },
        { id: 'wants', pct: groups.wants.actualPct },
        { id: 'savings', pct: groups.savings.actualPct },
      ],
    },
  ];

  tracks.forEach((track, idx) => {
    const y = 14 + idx * 46;
    ctx.fillStyle = '#182320';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(track.label, leftPad - 10, y + 14);

    // Sisa kas yang belum terpakai terlihat sebagai latar hangat
    ctx.fillStyle = '#EAE4D8';
    drawRoundedBar(ctx, leftPad, y + 2, fullW, 24, 6);
    ctx.fill();

    const totalPct = track.segments.reduce((s, seg) => s + seg.pct, 0);
    const norm = totalPct > 100 ? 100 / totalPct : 1;
    let cursor = leftPad;

    for (const seg of track.segments) {
      const segW = ((seg.pct * norm) / 100) * fullW;
      if (segW <= 0.5) continue;
      ctx.fillStyle = palette[seg.id];
      ctx.fillRect(cursor, y + 2, segW, 24);
      if (segW > 34) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(seg.pct)}%`, cursor + segW / 2, y + 14);
      }
      cursor += segW;
    }
  });
}
