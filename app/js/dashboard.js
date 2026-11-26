// Halaman Ringkasan (#/): kartu metrik bulanan, grafik donat distribusi 7 kategori,
// indikator 50/30/20, kesehatan anggaran, transaksi terbaru, dan pengingat tagihan.

import { FAMILY_PROFILE } from './data.js';
import {
  computeCategoryBreakdown,
  computeOverviewMetrics,
  computeRule503020,
  esc,
  findCategory,
  readStore,
  rp,
  rpCompact,
  settleBillWithExpense,
  shortDateId,
} from './state.js';
import { renderCategoryDonut } from './charts.js';

function chipClassForTone(tone) {
  if (tone === 'alert') return 'chip-alert';
  if (tone === 'caution') return 'chip-caution';
  return 'chip-good';
}

export function mountDashboard(root, notify) {
  const store = readStore();
  const metrics = computeOverviewMetrics();
  const breakdown = computeCategoryBreakdown();
  const rule = computeRule503020();

  const spendingCats = breakdown.filter((row) => row.id !== 'Tabungan');
  const exceededCount = spendingCats.filter((row) => row.used > row.limit).length;

  const latestTx = [...store.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  const priorityBills = [...store.bills]
    .sort((a, b) => Number(a.settled) - Number(b.settled) || a.day - b.day)
    .slice(0, 4);

  root.innerHTML = `
    <section class="hero-bar">
      <div>
        <h1 class="hero-title">Ringkasan Keuangan ${esc(FAMILY_PROFILE.monthLabel)}</h1>
        <p class="hero-sub">${esc(FAMILY_PROFILE.familyName)} (${esc(FAMILY_PROFILE.city)}) &bull; ${metrics.txCount} transaksi tercatat &bull; ${
          exceededCount > 0
            ? `${exceededCount} pos melewati batas anggaran`
            : 'Seluruh pos belanja masih dalam batas aman'
        }</p>
      </div>
      <div class="hero-cta">
        <a class="action-btn btn-brand" href="#/pengeluaran">+ Catat Pengeluaran</a>
        <a class="action-btn btn-outline" href="#/anggaran">Atur Anggaran</a>
      </div>
    </section>

    <section class="metrics-strip" aria-label="Indikator keuangan bulanan">
      <article class="metric-tile">
        <div class="metric-head">
          <span class="metric-label">Pendapatan Bulanan</span>
          <span class="chip chip-soft">2 sumber</span>
        </div>
        <div class="metric-value tabular">${rp(metrics.income)}</div>
        <div class="metric-foot">Gaji tetap &amp; usaha katering rumahan</div>
      </article>

      <article class="metric-tile tone-terra">
        <div class="metric-head">
          <span class="metric-label">Total Pengeluaran</span>
          <span class="chip chip-caution tabular">${metrics.spendRate.toFixed(1).replace('.', ',')}%</span>
        </div>
        <div class="metric-value tabular">${rp(metrics.spending)}</div>
        <div class="metric-foot">Akumulasi 6 kategori belanja bulanan</div>
      </article>

      <article class="metric-tile tone-good">
        <div class="metric-head">
          <span class="metric-label">Tabungan Bulan Ini</span>
          <span class="chip chip-good tabular">${metrics.saveRate.toFixed(1).replace('.', ',')}%</span>
        </div>
        <div class="metric-value tabular">${rp(metrics.savings)}</div>
        <div class="metric-foot">Melampaui acuan minimal 20% bulanan</div>
      </article>

      <article class="metric-tile tone-cobalt">
        <div class="metric-head">
          <span class="metric-label">Sisa Kas Tersedia</span>
          <span class="chip chip-soft">${metrics.pendingBillsCount} tagihan</span>
        </div>
        <div class="metric-value tabular">${rp(metrics.freeCash)}</div>
        <div class="metric-foot">Pendapatan dikurangi belanja &amp; tabungan</div>
      </article>
    </section>

    <section class="split-main">
      <article class="surface-card">
        <div class="card-header">
          <h2>Distribusi Pengeluaran &amp; Tabungan</h2>
          <a class="card-link" href="#/anggaran">Buka perencana &rarr;</a>
        </div>
        <div class="donut-wrap">
          <div class="chart-stage">
            <canvas id="chart-overview-donut" aria-label="Grafik donat distribusi anggaran 7 kategori"></canvas>
          </div>
          <ul class="donut-legend">
            ${breakdown
              .map((row) => {
                const sharePct = metrics.outflow > 0 ? (row.used / metrics.outflow) * 100 : 0;
                return `<li>
                  <span class="swatch" style="background:${row.tint}"></span>
                  <span class="legend-cat">${esc(row.name)}</span>
                  <span class="legend-val tabular">${rp(row.used)}</span>
                  <span class="legend-share tabular">${sharePct.toFixed(0)}%</span>
                </li>`;
              })
              .join('')}
          </ul>
        </div>
        <div class="pulse-grid">
          <div class="pulse-box">
            <small>Kebutuhan (Ideal 50%)</small>
            <strong class="tabular">${rule.needs.actualPct.toFixed(1).replace('.', ',')}% &bull; ${rpCompact(rule.needs.actual)}</strong>
          </div>
          <div class="pulse-box">
            <small>Keinginan &amp; Les (Ideal 30%)</small>
            <strong class="tabular">${rule.wants.actualPct.toFixed(1).replace('.', ',')}% &bull; ${rpCompact(rule.wants.actual)}</strong>
          </div>
          <div class="pulse-box">
            <small>Tabungan (Ideal 20%)</small>
            <strong class="tabular">${rule.savings.actualPct.toFixed(1).replace('.', ',')}% &bull; ${rpCompact(rule.savings.actual)}</strong>
          </div>
        </div>
      </article>

      <article class="surface-card">
        <div class="card-header">
          <h2>Kesehatan 7 Kategori Anggaran</h2>
          <a class="card-link" href="#/anggaran">Sesuaikan batas &rarr;</a>
        </div>
        <ul class="feed-list">
          ${breakdown
            .map((row) => {
              const fillWidth = Math.min(100, Math.round(row.ratio));
              const fillTint = row.tone === 'alert' ? '#D13B2E' : row.tint;
              const diffLabel =
                row.balance < 0
                  ? `Lebih ${rp(Math.abs(row.balance))}`
                  : `Sisa ${rp(row.balance)}`;
              return `<li class="health-item">
                <div class="health-top">
                  <span class="health-name">
                    <span class="dot" style="background:${row.tint}"></span>
                    ${esc(row.name)}
                  </span>
                  <span class="health-right">
                    <span class="health-nums tabular">${rp(row.used)} / ${rp(row.limit)}</span>
                    <span class="chip ${chipClassForTone(row.tone)}">${row.badgeText}</span>
                  </span>
                </div>
                <div class="meter">
                  <div class="meter-fill" style="width:${fillWidth}%;background:${fillTint}"></div>
                </div>
                <div class="health-sub">
                  <span>${Math.round(row.ratio)}% terpakai</span>
                  <span class="tabular">${diffLabel}</span>
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </article>
    </section>

    <section class="split-even">
      <article class="surface-card">
        <div class="card-header">
          <h2>Transaksi Terbaru</h2>
          <a class="card-link" href="#/pengeluaran">Lihat semua (${metrics.txCount}) &rarr;</a>
        </div>
        <ul class="feed-list">
          ${latestTx
            .map((tx) => {
              const cat = findCategory(tx.category);
              return `<li class="feed-item">
                <div class="feed-body">
                  <div class="feed-title">${esc(tx.desc)}</div>
                  <div class="feed-meta">${shortDateId(tx.date)} &bull; <strong style="color:${cat.tint}">${esc(cat.name)}</strong> &bull; ${esc(tx.method)}</div>
                </div>
                <div class="feed-aside">
                  <span class="feed-amount tabular">${rp(tx.amount)}</span>
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </article>

      <article class="surface-card">
        <div class="card-header">
          <h2>Pengingat Tagihan &amp; Progres Tabungan</h2>
          <a class="card-link" href="#/panduan">Kelola tagihan &rarr;</a>
        </div>
        <ul class="feed-list">
          ${priorityBills
            .map(
              (bill) => `<li class="feed-item">
                <div class="feed-body">
                  <div class="feed-title">${esc(bill.name)}</div>
                  <div class="feed-meta">Jatuh tempo ${esc(bill.dateText)} &bull; ${esc(bill.category)}</div>
                </div>
                <div class="feed-aside">
                  <span class="feed-amount tabular">${rp(bill.amount)}</span>
                  ${
                    bill.settled
                      ? '<span class="chip chip-good">Lunas</span>'
                      : `<button type="button" class="action-btn btn-brand btn-compact" data-quick-pay="${esc(bill.id)}">Bayar</button>`
                  }
                </div>
              </li>`,
            )
            .join('')}
        </ul>
        <div class="summary-foot">
          <span>
            Saldo 4 target tabungan: <strong class="tabular" style="color:var(--brand-deep)">${rp(metrics.goalsSaved)}</strong> dari ${rp(metrics.goalsTarget)}
          </span>
          <a class="card-link" href="#/tabungan">Pantau target &rarr;</a>
        </div>
      </article>
    </section>
  `;

  renderCategoryDonut(
    root.querySelector('#chart-overview-donut'),
    breakdown.map((row) => ({ label: row.name, value: row.used, color: row.tint })),
    'Total Aliran',
    rpCompact(metrics.outflow),
  );

  root.querySelectorAll('[data-quick-pay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const paid = settleBillWithExpense(btn.dataset.quickPay);
      if (paid) notify(`Tagihan "${paid.name}" dilunasi dan dicatat ke pengeluaran.`);
    });
  });
}
