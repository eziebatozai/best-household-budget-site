// Dashboard view (#/): monthly KPIs, category breakdown donut chart, 50/30/20 snapshot,
// recent expenses, and upcoming bill reminders.

import { HOUSEHOLD_INFO } from './data.js';
import {
  escapeHtml,
  formatDateId,
  formatRupiah,
  formatShortRupiah,
  getCategoryMeta,
  getCategorySummary,
  getRule503020,
  getState,
  getTotals,
  payBillAndRecord,
} from './state.js';
import { drawDonutChart } from './charts.js';

export function renderDashboard(container, showToast) {
  const state = getState();
  const totals = getTotals();
  const summary = getCategorySummary();
  const rule = getRule503020();

  const spendingRows = summary.filter((r) => r.id !== 'Tabungan');
  const recentExpenses = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const upcomingBills = [...state.bills]
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.dueDay - b.dueDay)
    .slice(0, 4);

  const overBudgetCount = spendingRows.filter((r) => r.spent > r.budget).length;

  container.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Ringkasan Keuangan ${escapeHtml(HOUSEHOLD_INFO.period)}</h1>
        <p>${escapeHtml(HOUSEHOLD_INFO.name)} &middot; ${totals.expenseCount} transaksi tercatat &middot; ${
          overBudgetCount > 0
            ? `${overBudgetCount} pos melewati batas anggaran`
            : 'Semua pos belanja masih dalam batas anggaran'
        }</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-primary" href="#/pengeluaran">+ Catat Pengeluaran</a>
        <a class="btn btn-ghost" href="#/anggaran">Atur Anggaran</a>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Ringkasan utama">
      <article class="kpi-card">
        <div class="kpi-label">Pendapatan Bulanan</div>
        <div class="kpi-value num">${formatRupiah(totals.income)}</div>
        <div class="kpi-sub">Gaji &amp; usaha keluarga</div>
      </article>
      <article class="kpi-card kpi-spend">
        <div class="kpi-label">Total Pengeluaran</div>
        <div class="kpi-value num">${formatRupiah(totals.totalSpending)}</div>
        <div class="kpi-sub">${totals.spendingPct.toFixed(1).replace('.', ',')}% dari pendapatan (6 pos)</div>
      </article>
      <article class="kpi-card kpi-save">
        <div class="kpi-label">Tabungan Bulan Ini</div>
        <div class="kpi-value num">${formatRupiah(totals.totalSavingsTransfer)}</div>
        <div class="kpi-sub">${totals.savingsPct.toFixed(1).replace('.', ',')}% dari pendapatan &middot; target 20%</div>
      </article>
      <article class="kpi-card kpi-cash">
        <div class="kpi-label">Sisa Kas Tersedia</div>
        <div class="kpi-value num">${formatRupiah(totals.remainingCash)}</div>
        <div class="kpi-sub">Pendapatan &minus; pengeluaran &minus; tabungan</div>
      </article>
    </section>

    <section class="grid-2">
      <article class="panel">
        <div class="panel-head">
          <h2>Distribusi Pengeluaran &amp; Tabungan</h2>
          <a class="panel-link" href="#/anggaran">Lihat detail anggaran &rarr;</a>
        </div>
        <div class="donut-layout">
          <div class="chart-box">
            <canvas id="dashboard-donut" aria-label="Grafik donat distribusi anggaran per kategori"></canvas>
          </div>
          <ul class="legend-list">
            ${summary
              .map((row) => {
                const share = totals.totalOutflow > 0 ? (row.spent / totals.totalOutflow) * 100 : 0;
                return `<li class="legend-item">
                  <span class="legend-dot" style="background:${row.color}"></span>
                  <span class="legend-name">${escapeHtml(row.label)}</span>
                  <span class="legend-amount num">${formatRupiah(row.spent)}</span>
                  <span class="legend-pct num">${share.toFixed(0)}%</span>
                </li>`;
              })
              .join('')}
          </ul>
        </div>
        <div class="rule-mini-grid">
          <div class="rule-mini-item">
            <small>Kebutuhan (Ideal 50%)</small>
            <strong class="num">${rule.needs.actualPct.toFixed(1).replace('.', ',')}% &middot; ${formatShortRupiah(rule.needs.actual)}</strong>
          </div>
          <div class="rule-mini-item">
            <small>Keinginan &amp; Les (Ideal 30%)</small>
            <strong class="num">${rule.wants.actualPct.toFixed(1).replace('.', ',')}% &middot; ${formatShortRupiah(rule.wants.actual)}</strong>
          </div>
          <div class="rule-mini-item">
            <small>Tabungan (Ideal 20%)</small>
            <strong class="num">${rule.savings.actualPct.toFixed(1).replace('.', ',')}% &middot; ${formatShortRupiah(rule.savings.actual)}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>Kesehatan Anggaran per Kategori</h2>
          <a class="panel-link" href="#/anggaran">Ubah batas &rarr;</a>
        </div>
        <ul class="compact-list">
          ${summary
            .map((row) => {
              const barPct = Math.min(100, Math.round(row.pct));
              const fillColor = row.status === 'danger' ? '#DC2626' : row.color;
              const badgeCls =
                row.status === 'danger' ? 'badge-danger' : row.status === 'warn' ? 'badge-warn' : 'badge-ok';
              const remText =
                row.remaining < 0
                  ? `Lebih ${formatRupiah(Math.abs(row.remaining))}`
                  : `Sisa ${formatRupiah(row.remaining)}`;
              return `<li style="display:block;padding:8px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px;">
                  <span style="font-weight:700;font-size:0.86rem;display:flex;align-items:center;gap:6px;">
                    <span class="cat-dot" style="background:${row.color}"></span>
                    ${escapeHtml(row.label)}
                  </span>
                  <span style="display:flex;align-items:center;gap:7px;">
                    <span class="num" style="font-size:0.8rem;color:var(--muted);">${formatRupiah(row.spent)} / ${formatRupiah(row.budget)}</span>
                    <span class="badge ${badgeCls}">${row.statusLabel}</span>
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${barPct}%;background:${fillColor}"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.74rem;color:var(--muted);margin-top:3px;">
                  <span>${Math.round(row.pct)}% terpakai</span>
                  <span class="num">${remText}</span>
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </article>
    </section>

    <section class="grid-2-equal">
      <article class="panel">
        <div class="panel-head">
          <h2>Pengeluaran Terbaru</h2>
          <a class="panel-link" href="#/pengeluaran">Kelola semua (${totals.expenseCount}) &rarr;</a>
        </div>
        <ul class="compact-list">
          ${recentExpenses
            .map((exp) => {
              const meta = getCategoryMeta(exp.category);
              return `<li>
                <div class="item-main">
                  <div class="item-title">${escapeHtml(exp.title)}</div>
                  <div class="item-meta">${formatDateId(exp.date)} &middot; <span style="color:${meta.color};font-weight:700;">${escapeHtml(meta.label)}</span> &middot; ${escapeHtml(exp.method)}</div>
                </div>
                <div class="item-right">
                  <div class="item-amount num">${formatRupiah(exp.amount)}</div>
                </div>
              </li>`;
            })
            .join('')}
        </ul>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>Pengingat Tagihan &amp; Target Tabungan</h2>
          <a class="panel-link" href="#/panduan">Semua tagihan &rarr;</a>
        </div>
        <ul class="compact-list">
          ${upcomingBills
            .map(
              (bill) => `<li>
                <div class="item-main">
                  <div class="item-title">${escapeHtml(bill.title)}</div>
                  <div class="item-meta">Jatuh tempo ${escapeHtml(bill.dueLabel)} &middot; ${escapeHtml(bill.category)}</div>
                </div>
                <div class="item-right" style="display:flex;align-items:center;gap:8px;">
                  <span class="item-amount num">${formatRupiah(bill.amount)}</span>
                  ${
                    bill.paid
                      ? '<span class="badge badge-ok">Lunas</span>'
                      : `<button type="button" class="btn btn-sm btn-primary" data-pay-bill="${escapeHtml(bill.id)}">Bayar</button>`
                  }
                </div>
              </li>`,
            )
            .join('')}
        </ul>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:0.82rem;color:var(--muted);">
            Total tabungan terkumpul: <strong class="num" style="color:var(--primary-dark);">${formatRupiah(totals.totalGoalSaved)}</strong> dari ${formatRupiah(totals.totalGoalTarget)}
          </span>
          <a class="panel-link" href="#/tabungan">Lihat target &rarr;</a>
        </div>
      </article>
    </section>
  `;

  const donutCanvas = container.querySelector('#dashboard-donut');
  drawDonutChart(
    donutCanvas,
    summary.map((r) => ({ label: r.label, value: r.spent, color: r.color })),
    'Total Terpakai',
    formatShortRupiah(totals.totalOutflow),
  );

  container.querySelectorAll('[data-pay-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bill = payBillAndRecord(btn.dataset.payBill);
      if (bill) showToast(`Tagihan "${bill.title}" ditandai lunas & dicatat ke pengeluaran.`);
    });
  });
}
