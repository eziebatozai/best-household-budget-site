// Expense Tracker view (#/pengeluaran): add, edit, delete, search, filter, and sort expenses
// with real-time totals and a daily spending Canvas chart.

import { CATEGORIES } from './data.js';
import {
  addExpense,
  deleteExpense,
  escapeHtml,
  formatDateId,
  formatRupiah,
  getCategoryMeta,
  getState,
  getTotals,
  setEditingExpense,
  setExpenseFilter,
  updateExpense,
} from './state.js';
import { drawDailyTrendChart } from './charts.js';

export function renderExpenses(container, showToast) {
  const state = getState();
  const totals = getTotals();
  const { category, query, sort } = state.expenseFilter;
  const editing = state.editingExpenseId
    ? state.expenses.find((e) => e.id === state.editingExpenseId) ?? null
    : null;

  const q = query.trim().toLowerCase();
  const filtered = state.expenses
    .filter((exp) => {
      if (category !== 'ALL' && exp.category !== category) return false;
      if (q && !exp.title.toLowerCase().includes(q) && !exp.method.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'amount-desc') return b.amount - a.amount;
      if (sort === 'amount-asc') return a.amount - b.amount;
      if (sort === 'date-asc') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });

  const filteredSum = filtered.reduce((acc, item) => acc + item.amount, 0);

  container.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Pencatat Pengeluaran</h1>
        <p>Tambah, ubah, atau hapus transaksi rumah tangga. Semua total dan grafik otomatis diperbarui.</p>
      </div>
      <div class="head-actions">
        <span class="badge badge-neutral num">${filtered.length} transaksi &middot; ${formatRupiah(filteredSum)}</span>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Ringkasan transaksi">
      <article class="kpi-card kpi-spend">
        <div class="kpi-label">Pengeluaran Belanja</div>
        <div class="kpi-value num">${formatRupiah(totals.totalSpending)}</div>
        <div class="kpi-sub">6 pos konsumsi bulanan</div>
      </article>
      <article class="kpi-card kpi-save">
        <div class="kpi-label">Setoran Tabungan</div>
        <div class="kpi-value num">${formatRupiah(totals.totalSavingsTransfer)}</div>
        <div class="kpi-sub">Tercatat di pos Tabungan</div>
      </article>
      <article class="kpi-card kpi-cash">
        <div class="kpi-label">Sisa Kas Bulan Ini</div>
        <div class="kpi-value num">${formatRupiah(totals.remainingCash)}</div>
        <div class="kpi-sub">Dari pendapatan ${formatRupiah(totals.income)}</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">Rata-rata Harian</div>
        <div class="kpi-value num">${formatRupiah(Math.round(totals.totalSpending / 26))}</div>
        <div class="kpi-sub">Berdasarkan 26 hari berjalan</div>
      </article>
    </section>

    <section class="grid-sidebar">
      <article class="panel">
        <div class="panel-head">
          <h2>Daftar Transaksi</h2>
          <span class="num" style="font-size:0.84rem;font-weight:700;color:var(--primary-dark);">Subtotal tampil: ${formatRupiah(filteredSum)}</span>
        </div>

        <div class="filter-bar">
          <input id="filter-query" type="search" value="${escapeHtml(query)}" placeholder="Cari keterangan atau metode..." aria-label="Cari pengeluaran">
          <select id="filter-cat" aria-label="Filter kategori">
            <option value="ALL" ${category === 'ALL' ? 'selected' : ''}>Semua Kategori</option>
            ${CATEGORIES.map(
              (c) =>
                `<option value="${escapeHtml(c.id)}" ${category === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`,
            ).join('')}
          </select>
          <select id="filter-sort" aria-label="Urutkan transaksi">
            <option value="date-desc" ${sort === 'date-desc' ? 'selected' : ''}>Terbaru</option>
            <option value="date-asc" ${sort === 'date-asc' ? 'selected' : ''}>Terlama</option>
            <option value="amount-desc" ${sort === 'amount-desc' ? 'selected' : ''}>Terbesar</option>
            <option value="amount-asc" ${sort === 'amount-asc' ? 'selected' : ''}>Terkecil</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th class="col-num">Nominal</th>
                <th class="col-actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length === 0
                  ? `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">Tidak ada transaksi yang cocok dengan filter saat ini.</td></tr>`
                  : filtered
                      .map((exp) => {
                        const meta = getCategoryMeta(exp.category);
                        const isEditingRow = editing && editing.id === exp.id;
                        return `<tr ${isEditingRow ? 'style="background:var(--primary-soft);"' : ''}>
                          <td class="num" style="white-space:nowrap;color:var(--muted);">${formatDateId(exp.date)}</td>
                          <td>
                            <div style="font-weight:700;">${escapeHtml(exp.title)}</div>
                            <div style="font-size:0.75rem;color:var(--muted);">${escapeHtml(exp.method)}</div>
                          </td>
                          <td>
                            <span class="cat-pill">
                              <span class="cat-dot" style="background:${meta.color}"></span>
                              ${escapeHtml(meta.label)}
                            </span>
                          </td>
                          <td class="col-num num">${formatRupiah(exp.amount)}</td>
                          <td class="col-actions">
                            <button type="button" class="btn btn-ghost btn-sm" data-edit-exp="${escapeHtml(exp.id)}">Ubah</button>
                            <button type="button" class="btn btn-danger-ghost btn-sm" data-del-exp="${escapeHtml(exp.id)}">Hapus</button>
                          </td>
                        </tr>`;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </article>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <article class="panel">
          <div class="panel-head">
            <h2>${editing ? 'Ubah Transaksi' : 'Tambah Pengeluaran Baru'}</h2>
            ${editing ? '<span class="badge badge-warn">Mode Ubah</span>' : '<span class="badge badge-ok">Siap catat</span>'}
          </div>
          <form id="expense-form" class="form-grid">
            <div class="field full">
              <label for="exp-title">Keterangan Pengeluaran</label>
              <input id="exp-title" name="title" type="text" required value="${escapeHtml(editing?.title ?? '')}" placeholder="Contoh: Belanja sayur &amp; ikan di pasar">
            </div>
            <div class="field">
              <label for="exp-cat">Kategori</label>
              <select id="exp-cat" name="category">
                ${CATEGORIES.map(
                  (c) =>
                    `<option value="${escapeHtml(c.id)}" ${(editing?.category ?? 'Makanan') === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="field">
              <label for="exp-amount">Nominal (Rp)</label>
              <input id="exp-amount" name="amount" type="number" min="500" step="500" required value="${editing ? editing.amount : ''}" placeholder="150000">
            </div>
            <div class="field">
              <label for="exp-date">Tanggal</label>
              <input id="exp-date" name="date" type="date" required value="${escapeHtml(editing?.date ?? '2026-11-26')}">
            </div>
            <div class="field">
              <label for="exp-method">Metode Pembayaran</label>
              <select id="exp-method" name="method">
                ${['QRIS', 'Tunai', 'Transfer BCA', 'Transfer BRI', 'Mobile Banking', 'E-Wallet', 'Autodebet']
                  .map(
                    (m) =>
                      `<option value="${m}" ${(editing?.method ?? 'QRIS') === m ? 'selected' : ''}>${m}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div class="form-actions full">
              <button type="submit" class="btn btn-primary">${editing ? 'Simpan Perubahan' : 'Tambah Transaksi'}</button>
              ${editing ? '<button type="button" id="cancel-edit" class="btn btn-ghost">Batal</button>' : ''}
            </div>
          </form>
        </article>

        <article class="panel">
          <div class="panel-head">
            <h2>Pola Belanja per 5 Hari</h2>
            <span class="badge badge-neutral">Tanpa tabungan</span>
          </div>
          <div class="chart-box">
            <canvas id="daily-trend-chart" aria-label="Grafik pola pengeluaran per 5 hari di bulan November"></canvas>
          </div>
        </article>
      </div>
    </section>
  `;

  drawDailyTrendChart(container.querySelector('#daily-trend-chart'), state.expenses);

  container.querySelector('#filter-query')?.addEventListener('input', (e) => {
    const pos = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
    setExpenseFilter({ query: e.currentTarget.value });
    const nextInput = container.querySelector('#filter-query');
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(pos, pos);
    }
  });
  container.querySelector('#filter-cat')?.addEventListener('change', (e) => {
    setExpenseFilter({ category: e.currentTarget.value });
  });
  container.querySelector('#filter-sort')?.addEventListener('change', (e) => {
    setExpenseFilter({ sort: e.currentTarget.value });
  });

  container.querySelector('#expense-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get('title')),
      category: String(fd.get('category')),
      amount: Number(fd.get('amount')),
      date: String(fd.get('date')),
      method: String(fd.get('method')),
    };
    if (editing) {
      updateExpense(editing.id, payload);
      showToast(`Transaksi "${payload.title}" diperbarui.`);
    } else {
      addExpense(payload);
      showToast(`Transaksi "${payload.title}" (${formatRupiah(payload.amount)}) ditambahkan.`);
    }
  });

  container.querySelector('#cancel-edit')?.addEventListener('click', () => {
    setEditingExpense(null);
  });

  container.querySelectorAll('[data-edit-exp]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setEditingExpense(btn.dataset.editExp);
    });
  });

  container.querySelectorAll('[data-del-exp]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delExp;
      const item = state.expenses.find((e) => e.id === id);
      if (deleteExpense(id) && item) {
        showToast(`Transaksi "${item.title}" dihapus.`);
      }
    });
  });
}
