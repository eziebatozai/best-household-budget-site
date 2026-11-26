// Halaman Panduan 50/30/20 & Pengingat Tagihan (#/panduan dan #/tagihan):
// perbandingan aktual vs rumus 50/30/20, simulator pendapatan interaktif, dan pengelola tagihan bulanan.

import { BUDGET_CATEGORIES, RULE_GUIDE_ITEMS } from './data.js';
import {
  computeOverviewMetrics,
  computeRule503020,
  createBill,
  esc,
  flipBillStatus,
  readStore,
  removeBill,
  rp,
  setSimulatedIncome,
  settleBillWithExpense,
  updateMonthlyIncome,
} from './state.js';
import { renderRule503020Chart } from './charts.js';

export function mountGuideAndBills(root, notify) {
  const store = readStore();
  const metrics = computeOverviewMetrics();
  const rule = computeRule503020();
  const settledBills = store.bills.filter((b) => b.settled);
  const openBills = store.bills.filter((b) => !b.settled);

  const simIncome = store.simIncome;
  const simNeeds = Math.round(simIncome * 0.5);
  const simWants = Math.round(simIncome * 0.3);
  const simSave = simIncome - simNeeds - simWants;

  root.innerHTML = `
    <section class="hero-bar">
      <div>
        <h1 class="hero-title">Panduan 50/30/20 &amp; Pengingat Tagihan</h1>
        <p class="hero-sub">Ukur kesehatan porsi belanja rumah tangga pada pendapatan ${rp(metrics.income)} serta pantau jadwal tagihan rutin.</p>
      </div>
      <div class="hero-cta">
        <a class="action-btn btn-outline" href="#/anggaran">Buka Perencana Anggaran</a>
      </div>
    </section>

    <section class="surface-card" style="margin-bottom:16px;">
      <div class="card-header">
        <h2>Posisi Keluarga vs Acuan 50/30/20</h2>
        <span class="chip chip-soft tabular">Pendapatan acuan ${rp(metrics.income)}</span>
      </div>

      <div class="chart-stage">
        <canvas id="chart-rule-split" aria-label="Grafik perbandingan acuan 50/30/20 dengan realisasi keluarga"></canvas>
      </div>

      <div class="rule-grid">
        ${RULE_GUIDE_ITEMS.map((item) => {
          const stats = rule[item.group];
          const delta = stats.actual - stats.idealRp;
          const healthy = item.group === 'savings' ? stats.actual >= stats.idealRp : stats.actual <= stats.idealRp;
          const chipCls = healthy ? 'chip-good' : 'chip-caution';
          const statusLabel =
            item.group === 'savings'
              ? healthy
                ? 'Target Tercapai'
                : 'Perlu Ditambah'
              : healthy
                ? 'Terkendali'
                : `Lebih ${rp(Math.abs(delta))}`;

          return `<article class="rule-box">
            <div class="rule-box-head">
              <h3>${esc(item.heading)}</h3>
              <span class="chip ${chipCls}">${statusLabel}</span>
            </div>
            <div class="rule-big-pct tabular">${stats.actualPct.toFixed(1).replace('.', ',')}%</div>
            <div class="tabular" style="font-size:0.82rem;color:var(--text);">
              Aktual: <strong>${rp(stats.actual)}</strong> &bull; Ideal: ${rp(stats.idealRp)}
            </div>
            <p><strong>Kategori:</strong> ${esc(item.included)}</p>
            <p>${esc(item.advice)}</p>
          </article>`;
        }).join('')}
      </div>

      <div class="sim-panel">
        <div class="sim-top">
          <div>
            <strong style="color:var(--brand-deep);font-size:0.9rem;">Simulator Cepat 50/30/20</strong>
            <span style="font-size:0.8rem;color:var(--text-soft);margin-left:8px;">Geser untuk menguji pendapatan bulanan lain: <strong id="sim-income-readout" class="tabular" style="color:var(--text)">${rp(simIncome)}</strong></span>
          </div>
          <button type="button" id="use-sim-income" class="action-btn btn-brand btn-compact">Gunakan sebagai Pendapatan</button>
        </div>
        <input id="sim-income-slider" class="sim-range" type="range" min="3000000" max="20000000" step="250000" value="${Math.min(20000000, Math.max(3000000, simIncome))}" aria-label="Geser simulasi pendapatan bulanan">
        <div class="sim-splits">
          <div class="sim-pill">50% Kebutuhan Pokok<strong id="sim-needs" class="tabular">${rp(simNeeds)}</strong></div>
          <div class="sim-pill">30% Keinginan &amp; Les<strong id="sim-wants" class="tabular">${rp(simWants)}</strong></div>
          <div class="sim-pill">20% Tabungan Rutin<strong id="sim-save" class="tabular">${rp(simSave)}</strong></div>
        </div>
      </div>
    </section>

    <section class="split-wide" id="bills-panel">
      <article class="surface-card">
        <div class="card-header">
          <h2>Daftar Tagihan Rutin Bulanan</h2>
          <span class="chip ${openBills.length > 0 ? 'chip-caution' : 'chip-good'} tabular">
            ${openBills.length} belum lunas (${rp(metrics.pendingBillsAmount)}) &bull; ${settledBills.length} lunas
          </span>
        </div>

        <div>
          ${store.bills
            .map(
              (bill) => `<div class="bill-card ${bill.settled ? 'is-settled' : ''}">
                <div class="feed-body">
                  <div class="feed-title">${esc(bill.name)}</div>
                  <div class="feed-meta">Jatuh tempo ${esc(bill.dateText)} &bull; ${esc(bill.category)}</div>
                </div>
                <div class="bill-controls">
                  <span class="feed-amount tabular">${rp(bill.amount)}</span>
                  ${
                    bill.settled
                      ? `<button type="button" class="action-btn btn-outline btn-compact" data-flip-bill="${esc(bill.id)}">Lunas ✓</button>`
                      : `<button type="button" class="action-btn btn-brand btn-compact" data-settle-bill="${esc(bill.id)}">Bayar &amp; Catat</button>
                         <button type="button" class="action-btn btn-outline btn-compact" data-flip-bill="${esc(bill.id)}">Tandai Lunas</button>`
                  }
                  <button type="button" class="action-btn btn-danger btn-compact" data-remove-bill="${esc(bill.id)}" aria-label="Hapus tagihan ${esc(bill.name)}">&times;</button>
                </div>
              </div>`,
            )
            .join('')}
        </div>
      </article>

      <article class="surface-card">
        <div class="card-header">
          <h2>Tambah Pengingat Tagihan</h2>
        </div>
        <form id="create-bill-form" class="input-grid">
          <div class="control-group span-all">
            <label for="b-name">Nama Tagihan</label>
            <input id="b-name" name="name" type="text" required placeholder="Contoh: Iuran Sampah &amp; Keamanan RT">
          </div>
          <div class="control-group">
            <label for="b-day">Tanggal Jatuh Tempo</label>
            <input id="b-day" name="day" type="number" min="1" max="31" required value="29">
          </div>
          <div class="control-group">
            <label for="b-cat">Kategori</label>
            <select id="b-cat" name="category">
              ${BUDGET_CATEGORIES.filter((c) => c.id !== 'Tabungan')
                .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="control-group span-all">
            <label for="b-amount">Nominal (Rp)</label>
            <input id="b-amount" name="amount" type="number" min="1000" step="1000" required placeholder="150000">
          </div>
          <div class="btn-row span-all">
            <button type="submit" class="action-btn btn-terra">Tambahkan Pengingat</button>
          </div>
        </form>
      </article>
    </section>
  `;

  renderRule503020Chart(root.querySelector('#chart-rule-split'), rule);

  const slider = root.querySelector('#sim-income-slider');
  slider?.addEventListener('input', (event) => {
    const val = Number(event.currentTarget.value);
    const needs = Math.round(val * 0.5);
    const wants = Math.round(val * 0.3);
    const save = val - needs - wants;
    root.querySelector('#sim-income-readout').textContent = rp(val);
    root.querySelector('#sim-needs').textContent = rp(needs);
    root.querySelector('#sim-wants').textContent = rp(wants);
    root.querySelector('#sim-save').textContent = rp(save);
  });
  slider?.addEventListener('change', (event) => {
    setSimulatedIncome(Number(event.currentTarget.value));
  });

  root.querySelector('#use-sim-income')?.addEventListener('click', () => {
    const chosen = Number(slider?.value || simIncome);
    updateMonthlyIncome(chosen);
    notify(`Pendapatan bulanan diperbarui ke ${rp(chosen)}.`);
  });

  root.querySelectorAll('[data-flip-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = flipBillStatus(btn.dataset.flipBill);
      if (updated) notify(`Status "${updated.name}" diubah menjadi ${updated.settled ? 'Lunas' : 'Belum Lunas'}.`);
    });
  });

  root.querySelectorAll('[data-settle-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const paid = settleBillWithExpense(btn.dataset.settleBill);
      if (paid) notify(`"${paid.name}" dilunasi dan dicatat ke Pencatat Pengeluaran.`);
    });
  });

  root.querySelectorAll('[data-remove-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const deleted = removeBill(btn.dataset.removeBill);
      if (deleted) notify(`Pengingat "${deleted.name}" dihapus.`);
    });
  });

  root.querySelector('#create-bill-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const created = createBill({
      name: String(fd.get('name')),
      day: Number(fd.get('day')),
      category: String(fd.get('category')),
      amount: Number(fd.get('amount')),
    });
    notify(`Pengingat tagihan "${created.name}" berhasil disimpan.`);
  });
}
