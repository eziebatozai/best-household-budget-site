// Budget Planner view (#/anggaran): set monthly income & category budgets,
// see remaining budget per category, compare Budget vs Actual on a Canvas chart,
// and log quick expenses right alongside the planner.

import { CATEGORIES } from './data.js';
import {
  addExpense,
  escapeHtml,
  formatRupiah,
  getCategorySummary,
  getTotals,
  setBudget,
  setIncome,
} from './state.js';
import { drawBudgetBarChart } from './charts.js';

export function renderBudgetPlanner(container, showToast) {
  const totals = getTotals();
  const summary = getCategorySummary();

  const allocBadge =
    totals.unallocatedBudget === 0
      ? '<span class="badge badge-ok">100% Teralokasi</span>'
      : totals.unallocatedBudget > 0
        ? `<span class="badge badge-warn">Belum dialokasi: ${formatRupiah(totals.unallocatedBudget)}</span>`
        : `<span class="badge badge-danger">Melebihi pendapatan: ${formatRupiah(Math.abs(totals.unallocatedBudget))}</span>`;

  container.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Perencana Anggaran Bulanan</h1>
        <p>Atur batas anggaran tiap kategori dan pantau sisa dana secara langsung.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="#/pengeluaran">Buka Daftar Pengeluaran</a>
        <a class="btn btn-primary" href="#/panduan">Cek Aturan 50/30/20</a>
      </div>
    </section>

    <section class="income-bar">
      <div>
        <strong style="font-size:0.94rem;color:var(--primary-dark);">Pendapatan Bulanan Keluarga</strong>
        <div style="font-size:0.82rem;color:var(--muted);margin-top:2px;">
          Total dianggarkan: <strong class="num" style="color:var(--ink);">${formatRupiah(totals.totalBudgeted)}</strong>
          &middot; ${allocBadge}
        </div>
      </div>
      <form id="income-form" class="income-inline">
        <label for="income-input" style="font-size:0.82rem;font-weight:700;color:var(--primary-dark);">Rp</label>
        <input id="income-input" type="number" min="0" step="1000" value="${totals.income}" aria-label="Pendapatan bulanan dalam rupiah">
        <button type="submit" class="btn btn-primary btn-sm">Perbarui Pendapatan</button>
      </form>
    </section>

    <section class="grid-sidebar">
      <article class="panel">
        <div class="panel-head">
          <h2>Batas &amp; Sisa Anggaran per Kategori</h2>
          <span class="badge badge-neutral num">7 kategori aktif</span>
        </div>
        <div class="budget-list">
          ${summary
            .map((row) => {
              const pctClamped = Math.min(100, Math.round(row.pct));
              const fillColor = row.status === 'danger' ? '#DC2626' : row.color;
              const badgeCls =
                row.status === 'danger' ? 'badge-danger' : row.status === 'warn' ? 'badge-warn' : 'badge-ok';
              const remHtml =
                row.remaining < 0
                  ? `<strong style="color:var(--danger);">Lebih ${formatRupiah(Math.abs(row.remaining))}</strong>`
                  : `<strong style="color:var(--primary-dark);">Sisa ${formatRupiah(row.remaining)}</strong>`;

              return `<div class="budget-row" data-cat-row="${escapeHtml(row.id)}">
                <div class="budget-row-top">
                  <div class="budget-row-title">
                    <span class="cat-dot" style="background:${row.color}"></span>
                    <span>${escapeHtml(row.label)}</span>
                    <span class="badge ${badgeCls}">${row.statusLabel}</span>
                  </div>
                  <div class="budget-controls">
                    <button type="button" class="btn btn-ghost btn-sm" data-step="-50000" data-cat="${escapeHtml(row.id)}" aria-label="Kurangi anggaran ${escapeHtml(row.label)} Rp 50.000">-50rb</button>
                    <input class="budget-input" type="number" min="0" step="1000" value="${row.budget}" data-budget-input="${escapeHtml(row.id)}" aria-label="Anggaran ${escapeHtml(row.label)}">
                    <button type="button" class="btn btn-ghost btn-sm" data-step="50000" data-cat="${escapeHtml(row.id)}" aria-label="Tambah anggaran ${escapeHtml(row.label)} Rp 50.000">+50rb</button>
                  </div>
                </div>
                <div class="progress-track thick">
                  <div class="progress-fill" style="width:${pctClamped}%;background:${fillColor}"></div>
                </div>
                <div class="budget-row-meta">
                  <span>Terpakai <strong class="num" style="color:var(--ink);">${formatRupiah(row.spent)}</strong> (${Math.round(row.pct)}%) &middot; ${escapeHtml(row.note)}</span>
                  <span class="num">${remHtml}</span>
                </div>
              </div>`;
            })
            .join('')}
        </div>
      </article>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <article class="panel">
          <div class="panel-head">
            <h2>Grafik Anggaran vs Realisasi</h2>
            <span class="badge badge-neutral">Nov 2026</span>
          </div>
          <div class="chart-box">
            <canvas id="budget-bar-chart" aria-label="Grafik perbandingan anggaran dan realisasi per kategori"></canvas>
          </div>
          <p style="margin:10px 0 0;font-size:0.78rem;color:var(--muted);">
            Garis hitam menandai batas anggaran tiap kategori. Batang merah menandakan kategori melewati batas.
          </p>
        </article>

        <article class="panel">
          <div class="panel-head">
            <h2>Catat Cepat Pengeluaran</h2>
            <a class="panel-link" href="#/pengeluaran">Editor lengkap &rarr;</a>
          </div>
          <form id="quick-expense-form" class="form-grid">
            <div class="field full">
              <label for="quick-title">Keterangan</label>
              <input id="quick-title" name="title" type="text" required placeholder="Contoh: Belanja sayur &amp; tahu tempe">
            </div>
            <div class="field">
              <label for="quick-cat">Kategori</label>
              <select id="quick-cat" name="category">
                ${CATEGORIES.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="quick-amount">Nominal (Rp)</label>
              <input id="quick-amount" name="amount" type="number" min="1000" step="1000" required placeholder="75000">
            </div>
            <div class="form-actions full">
              <button type="submit" class="btn btn-accent">Simpan &amp; Perbarui Grafik</button>
            </div>
          </form>
        </article>
      </div>
    </section>
  `;

  drawBudgetBarChart(container.querySelector('#budget-bar-chart'), summary);

  container.querySelector('#income-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = Number(container.querySelector('#income-input').value);
    if (val >= 0) {
      setIncome(val);
      showToast(`Pendapatan bulanan diperbarui menjadi ${formatRupiah(val)}.`);
    }
  });

  container.querySelectorAll('[data-budget-input]').forEach((input) => {
    input.addEventListener('change', () => {
      const cat = input.dataset.budgetInput;
      const val = Number(input.value);
      setBudget(cat, val);
      showToast(`Anggaran ${cat} diubah ke ${formatRupiah(val)}.`);
    });
  });

  container.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const delta = Number(btn.dataset.step);
      const current = summary.find((r) => r.id === cat)?.budget ?? 0;
      const next = Math.max(0, current + delta);
      setBudget(cat, next);
      showToast(`Anggaran ${cat}: ${formatRupiah(next)}.`);
    });
  });

  container.querySelector('#quick-expense-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const created = addExpense({
      date: '2026-11-26',
      category: String(fd.get('category')),
      title: String(fd.get('title')),
      method: 'QRIS',
      amount: Number(fd.get('amount')),
    });
    showToast(`Pengeluaran "${created.title}" (${formatRupiah(created.amount)}) ditambahkan.`);
  });
}
