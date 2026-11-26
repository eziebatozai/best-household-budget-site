// Halaman Perencana Anggaran (#/anggaran): atur pendapatan bulanan, ubah batas 7 kategori,
// terapkan pembagian otomatis 50/30/20, lihat grafik Batas vs Realisasi, dan catat belanja cepat.

import { BUDGET_CATEGORIES } from './data.js';
import {
  applyIdeal503020Plan,
  computeCategoryBreakdown,
  computeOverviewMetrics,
  createTransaction,
  esc,
  rp,
  updateCategoryLimit,
  updateMonthlyIncome,
} from './state.js';
import { renderPlannerComparison } from './charts.js';

export function mountBudgetPlanner(root, notify) {
  const metrics = computeOverviewMetrics();
  const breakdown = computeCategoryBreakdown();

  const statusPill =
    metrics.unallocated === 0
      ? '<span class="chip chip-good">100% Teralokasi</span>'
      : metrics.unallocated > 0
        ? `<span class="chip chip-caution">Sisa belum dialokasi: ${rp(metrics.unallocated)}</span>`
        : `<span class="chip chip-alert">Melebihi pendapatan: ${rp(Math.abs(metrics.unallocated))}</span>`;

  root.innerHTML = `
    <section class="hero-bar">
      <div>
        <h1 class="hero-title">Perencana Anggaran Bulanan</h1>
        <p class="hero-sub">Tetapkan batas tiap pos kebutuhan rumah tangga dan pantau selisihnya secara real-time.</p>
      </div>
      <div class="hero-cta">
        <button type="button" id="apply-503020-btn" class="action-btn btn-outline">Terapkan Rumus 50/30/20</button>
        <a class="action-btn btn-brand" href="#/pengeluaran">Buka Buku Pengeluaran</a>
      </div>
    </section>

    <section class="income-banner">
      <div>
        <div class="income-banner-title">Pendapatan Bulanan Keluarga</div>
        <div class="income-banner-meta">
          Total dianggarkan: <strong class="tabular" style="color:var(--text)">${rp(metrics.plannedTotal)}</strong> &bull; ${statusPill}
        </div>
      </div>
      <form id="monthly-income-form" class="income-controls">
        <label for="monthly-income-field" style="font-size:0.82rem;font-weight:700;color:var(--brand-deep)">Rp</label>
        <input id="monthly-income-field" type="number" min="0" step="50000" value="${metrics.income}" aria-label="Nominal pendapatan bulanan">
        <button type="submit" class="action-btn btn-brand btn-compact">Simpan Pendapatan</button>
      </form>
    </section>

    <section class="split-wide">
      <article class="surface-card">
        <div class="card-header">
          <h2>Alokasi &amp; Sisa Anggaran per Kategori</h2>
          <span class="chip chip-soft tabular">${breakdown.length} kategori aktif</span>
        </div>
        <div class="planner-rows">
          ${breakdown
            .map((row) => {
              const barPct = Math.min(100, Math.round(row.ratio));
              const fillColor = row.tone === 'alert' ? '#D13B2E' : row.tint;
              const chipCls =
                row.tone === 'alert' ? 'chip-alert' : row.tone === 'caution' ? 'chip-caution' : 'chip-good';
              const balanceText =
                row.balance < 0
                  ? `<strong style="color:var(--alert)">Lebih ${rp(Math.abs(row.balance))}</strong>`
                  : `<strong style="color:var(--brand-deep)">Sisa ${rp(row.balance)}</strong>`;

              return `<div class="planner-row" data-category-card="${esc(row.id)}">
                <div class="planner-row-head">
                  <div class="planner-row-label">
                    <span class="dot" style="background:${row.tint}"></span>
                    <span>${esc(row.name)}</span>
                    <span class="chip ${chipCls}">${row.badgeText}</span>
                  </div>
                  <div class="stepper-group">
                    <button type="button" class="action-btn btn-outline btn-compact" data-nudge="-50000" data-cat-id="${esc(row.id)}" aria-label="Kurangi anggaran ${esc(row.name)} 50 ribu">-50rb</button>
                    <input class="stepper-input tabular" type="number" min="0" step="10000" value="${row.limit}" data-limit-field="${esc(row.id)}" aria-label="Batas anggaran ${esc(row.name)}">
                    <button type="button" class="action-btn btn-outline btn-compact" data-nudge="50000" data-cat-id="${esc(row.id)}" aria-label="Tambah anggaran ${esc(row.name)} 50 ribu">+50rb</button>
                  </div>
                </div>
                <div class="meter tall">
                  <div class="meter-fill" style="width:${barPct}%;background:${fillColor}"></div>
                </div>
                <div class="planner-row-foot">
                  <span>Realisasi <strong class="tabular" style="color:var(--text)">${rp(row.used)}</strong> (${Math.round(row.ratio)}%) &bull; ${esc(row.hint)}</span>
                  <span class="tabular">${balanceText}</span>
                </div>
              </div>`;
            })
            .join('')}
        </div>
      </article>

      <div class="stack-col">
        <article class="surface-card">
          <div class="card-header">
            <h2>Grafik Anggaran vs Realisasi</h2>
            <span class="chip chip-soft">Nov 2026</span>
          </div>
          <div class="chart-stage">
            <canvas id="chart-planner-bars" aria-label="Grafik batang perbandingan batas anggaran dan realisasi"></canvas>
          </div>
          <p class="chart-caption">
            Garis tegak hitam menandai plafon anggaran tiap pos. Batang merah menunjukkan pengeluaran melampaui batas.
          </p>
        </article>

        <article class="surface-card">
          <div class="card-header">
            <h2>Catat Cepat Pengeluaran</h2>
            <a class="card-link" href="#/pengeluaran">Buku lengkap &rarr;</a>
          </div>
          <form id="planner-quick-tx" class="input-grid">
            <div class="control-group span-all">
              <label for="q-desc">Keterangan Belanja</label>
              <input id="q-desc" name="desc" type="text" required placeholder="Contoh: Belanja sayur, tempe &amp; buah pasar">
            </div>
            <div class="control-group">
              <label for="q-category">Kategori</label>
              <select id="q-category" name="category">
                ${BUDGET_CATEGORIES.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="control-group">
              <label for="q-amount">Nominal (Rp)</label>
              <input id="q-amount" name="amount" type="number" min="1000" step="1000" required placeholder="85000">
            </div>
            <div class="btn-row span-all">
              <button type="submit" class="action-btn btn-terra">Simpan &amp; Hitung Ulang</button>
            </div>
          </form>
        </article>
      </div>
    </section>
  `;

  renderPlannerComparison(root.querySelector('#chart-planner-bars'), breakdown);

  root.querySelector('#apply-503020-btn')?.addEventListener('click', () => {
    applyIdeal503020Plan();
    notify('Batas 7 kategori disesuaikan mengikuti rumus ideal 50/30/20.');
  });

  root.querySelector('#monthly-income-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const val = Number(root.querySelector('#monthly-income-field').value);
    if (val >= 0) {
      updateMonthlyIncome(val);
      notify(`Pendapatan bulanan diperbarui ke ${rp(val)}.`);
    }
  });

  root.querySelectorAll('[data-limit-field]').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.dataset.limitField;
      const nextVal = Number(input.value);
      updateCategoryLimit(id, nextVal);
      notify(`Batas anggaran ${id} diubah menjadi ${rp(nextVal)}.`);
    });
  });

  root.querySelectorAll('[data-nudge]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.catId;
      const step = Number(btn.dataset.nudge);
      const curr = breakdown.find((r) => r.id === id)?.limit ?? 0;
      const nextVal = Math.max(0, curr + step);
      updateCategoryLimit(id, nextVal);
      notify(`Anggaran ${id} kini ${rp(nextVal)}.`);
    });
  });

  root.querySelector('#planner-quick-tx')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const added = createTransaction({
      date: '2026-11-26',
      category: String(form.get('category')),
      desc: String(form.get('desc')),
      method: 'QRIS',
      amount: Number(form.get('amount')),
    });
    notify(`Transaksi "${added.desc}" (${rp(added.amount)}) berhasil dicatat.`);
  });
}
