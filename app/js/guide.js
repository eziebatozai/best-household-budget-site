// 50/30/20 Rule Guide & Bill Reminders view (#/panduan and #/tagihan).
// Compares ideal 50/30/20 split against actual household numbers and manages monthly bills.

import { CATEGORIES, RULE_503020_GUIDE } from './data.js';
import {
  addBill,
  deleteBill,
  escapeHtml,
  formatRupiah,
  getRule503020,
  getState,
  getTotals,
  payBillAndRecord,
  toggleBillPaid,
} from './state.js';
import { drawRuleSplitChart } from './charts.js';

export function renderGuideAndBills(container, showToast) {
  const state = getState();
  const totals = getTotals();
  const rule = getRule503020();
  const paidBills = state.bills.filter((b) => b.paid);
  const unpaidBills = state.bills.filter((b) => !b.paid);

  container.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Panduan Aturan 50/30/20 &amp; Pengingat Tagihan</h1>
        <p>Bandingkan porsi pengeluaran aktual terhadap rumus 50/30/20 pada pendapatan ${formatRupiah(totals.income)} dan kelola jadwal tagihan bulanan.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="#/anggaran">Sesuaikan Anggaran</a>
      </div>
    </section>

    <section class="panel" style="margin-bottom:16px;">
      <div class="panel-head">
        <h2>Posisi Keluarga vs Aturan 50/30/20</h2>
        <span class="badge badge-neutral num">Basis pendapatan ${formatRupiah(totals.income)}</span>
      </div>

      <div class="chart-box" style="margin-bottom:14px;">
        <canvas id="rule-split-chart" aria-label="Grafik perbandingan porsi ideal 50/30/20 dan realisasi keluarga"></canvas>
      </div>

      <div class="rule-cards">
        ${RULE_503020_GUIDE.map((item) => {
          const b = rule[item.bucket];
          const diff = b.actual - b.targetAmount;
          const isGood = item.bucket === 'savings' ? b.actual >= b.targetAmount : b.actual <= b.targetAmount;
          const badgeCls = isGood ? 'badge-ok' : 'badge-warn';
          const statusText =
            item.bucket === 'savings'
              ? isGood
                ? 'Sesuai Target'
                : 'Perlu Tambah'
              : isGood
                ? 'Terkendali'
                : `Lebih ${formatRupiah(Math.abs(diff))}`;

          return `<article class="rule-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="badge ${badgeCls}">${statusText}</span>
            </div>
            <div class="rule-ratio num">${b.actualPct.toFixed(1).replace('.', ',')}%</div>
            <div style="font-size:0.82rem;color:var(--ink);" class="num">
              Aktual: <strong>${formatRupiah(b.actual)}</strong> &middot; Ideal: ${formatRupiah(b.targetAmount)}
            </div>
            <p><strong>Pos:</strong> ${escapeHtml(item.categories)}</p>
            <p>${escapeHtml(item.tip)}</p>
          </article>`;
        }).join('')}
      </div>
    </section>

    <section class="grid-sidebar" id="tagihan-section">
      <article class="panel">
        <div class="panel-head">
          <h2>Daftar Pengingat Tagihan Bulanan</h2>
          <span class="badge ${unpaidBills.length > 0 ? 'badge-warn' : 'badge-ok'} num">
            ${unpaidBills.length} belum lunas (${formatRupiah(totals.unpaidBillsTotal)}) &middot; ${paidBills.length} lunas
          </span>
        </div>

        <div>
          ${state.bills
            .map(
              (bill) => `<div class="bill-row ${bill.paid ? 'is-paid' : ''}">
                <div class="item-main">
                  <div class="item-title">${escapeHtml(bill.title)}</div>
                  <div class="item-meta">Jatuh tempo ${escapeHtml(bill.dueLabel)} &middot; ${escapeHtml(bill.category)}</div>
                </div>
                <div class="bill-actions">
                  <span class="item-amount num">${formatRupiah(bill.amount)}</span>
                  ${
                    bill.paid
                      ? `<button type="button" class="btn btn-ghost btn-sm" data-toggle-bill="${escapeHtml(bill.id)}">Lunas ✓</button>`
                      : `<button type="button" class="btn btn-primary btn-sm" data-pay-record="${escapeHtml(bill.id)}">Bayar &amp; Catat</button>
                         <button type="button" class="btn btn-ghost btn-sm" data-toggle-bill="${escapeHtml(bill.id)}">Tandai Lunas</button>`
                  }
                  <button type="button" class="btn btn-danger-ghost btn-sm" data-del-bill="${escapeHtml(bill.id)}" aria-label="Hapus tagihan ${escapeHtml(bill.title)}">&times;</button>
                </div>
              </div>`,
            )
            .join('')}
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>Tambah Pengingat Tagihan</h2>
        </div>
        <form id="new-bill-form" class="form-grid">
          <div class="field full">
            <label for="bill-title">Nama Tagihan</label>
            <input id="bill-title" name="title" type="text" required placeholder="Contoh: Iuran Sampah &amp; Keamanan">
          </div>
          <div class="field">
            <label for="bill-day">Tanggal Jatuh Tempo (1-31)</label>
            <input id="bill-day" name="dueDay" type="number" min="1" max="31" required value="29">
          </div>
          <div class="field">
            <label for="bill-cat">Kategori</label>
            <select id="bill-cat" name="category">
              ${CATEGORIES.filter((c) => c.id !== 'Tabungan')
                .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field full">
            <label for="bill-amount">Nominal (Rp)</label>
            <input id="bill-amount" name="amount" type="number" min="1000" step="1000" required placeholder="125000">
          </div>
          <div class="form-actions full">
            <button type="submit" class="btn btn-accent">Simpan Pengingat</button>
          </div>
        </form>
      </article>
    </section>
  `;

  drawRuleSplitChart(container.querySelector('#rule-split-chart'), rule);

  container.querySelectorAll('[data-toggle-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = toggleBillPaid(btn.dataset.toggleBill);
      if (updated) {
        showToast(`Tagihan "${updated.title}" ditandai ${updated.paid ? 'Lunas' : 'Belum Lunas'}.`);
      }
    });
  });

  container.querySelectorAll('[data-pay-record]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = payBillAndRecord(btn.dataset.payRecord);
      if (updated) {
        showToast(`"${updated.title}" dibayar & masuk ke Pencatat Pengeluaran.`);
      }
    });
  });

  container.querySelectorAll('[data-del-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delBill;
      const b = state.bills.find((item) => item.id === id);
      if (deleteBill(id) && b) {
        showToast(`Pengingat "${b.title}" dihapus.`);
      }
    });
  });

  container.querySelector('#new-bill-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const created = addBill({
      title: String(fd.get('title')),
      dueDay: Number(fd.get('dueDay')),
      category: String(fd.get('category')),
      amount: Number(fd.get('amount')),
    });
    showToast(`Pengingat tagihan "${created.title}" ditambahkan.`);
  });
}
