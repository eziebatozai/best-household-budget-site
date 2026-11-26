// Halaman Pencatat Pengeluaran (#/pengeluaran): tambah, ubah, hapus, cari, saring kategori/metode,
// urutkan transaksi, ekspor CSV lokal, dan lihat grafik pola belanja per 5 hari.

import { BUDGET_CATEGORIES, PAYMENT_METHODS } from './data.js';
import {
  buildTransactionsCsv,
  computeOverviewMetrics,
  createTransaction,
  editTransaction,
  esc,
  findCategory,
  patchFilters,
  readStore,
  removeTransaction,
  rp,
  selectEditingTransaction,
  shortDateId,
} from './state.js';
import { renderPeriodSpendingBars } from './charts.js';

export function mountExpenses(root, notify) {
  const store = readStore();
  const metrics = computeOverviewMetrics();
  const { category, method, search, order } = store.filters;
  const activeEdit = store.editingTxId
    ? store.transactions.find((item) => item.id === store.editingTxId) ?? null
    : null;

  const needle = search.trim().toLowerCase();
  const visible = store.transactions
    .filter((tx) => {
      if (category !== 'ALL' && tx.category !== category) return false;
      if (method !== 'ALL' && tx.method !== method) return false;
      if (needle && !tx.desc.toLowerCase().includes(needle) && !tx.method.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (order === 'highest') return b.amount - a.amount;
      if (order === 'lowest') return a.amount - b.amount;
      if (order === 'oldest') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });

  const visibleTotal = visible.reduce((sum, item) => sum + item.amount, 0);

  root.innerHTML = `
    <section class="hero-bar">
      <div>
        <h1 class="hero-title">Pencatat Pengeluaran</h1>
        <p class="hero-sub">Kelola seluruh transaksi harian keluarga. Perubahan langsung menyinkronkan anggaran &amp; grafik.</p>
      </div>
      <div class="hero-cta">
        <button type="button" id="export-csv-btn" class="action-btn btn-outline">Unduh CSV (${visible.length})</button>
      </div>
    </section>

    <section class="metrics-strip" aria-label="Ringkasan pengeluaran">
      <article class="metric-tile tone-terra">
        <div class="metric-label">Belanja 6 Kategori</div>
        <div class="metric-value tabular">${rp(metrics.spending)}</div>
        <div class="metric-foot">${metrics.spendRate.toFixed(1).replace('.', ',')}% dari pendapatan</div>
      </article>
      <article class="metric-tile tone-good">
        <div class="metric-label">Setoran Tabungan</div>
        <div class="metric-value tabular">${rp(metrics.savings)}</div>
        <div class="metric-foot">Tercatat pada pos Tabungan</div>
      </article>
      <article class="metric-tile tone-cobalt">
        <div class="metric-label">Sisa Kas Bulan Ini</div>
        <div class="metric-value tabular">${rp(metrics.freeCash)}</div>
        <div class="metric-foot">Dari ${rp(metrics.income)}</div>
      </article>
      <article class="metric-tile">
        <div class="metric-label">Rata-rata Harian</div>
        <div class="metric-value tabular">${rp(Math.round(metrics.spending / 26))}</div>
        <div class="metric-foot">Per hari (26 hari berjalan)</div>
      </article>
    </section>

    <section class="split-wide">
      <article class="surface-card">
        <div class="card-header">
          <h2>Buku Transaksi November 2026</h2>
          <span class="chip chip-soft tabular">${visible.length} item &bull; ${rp(visibleTotal)}</span>
        </div>

        <div class="toolbar">
          <input id="tx-search" type="search" value="${esc(search)}" placeholder="Cari keterangan atau metode bayar..." aria-label="Cari transaksi">
          <select id="tx-method-filter" aria-label="Filter metode pembayaran">
            <option value="ALL" ${method === 'ALL' ? 'selected' : ''}>Semua Metode</option>
            ${PAYMENT_METHODS.map((m) => `<option value="${esc(m)}" ${method === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
          </select>
          <select id="tx-sort" aria-label="Urutkan daftar transaksi">
            <option value="newest" ${order === 'newest' ? 'selected' : ''}>Terbaru</option>
            <option value="oldest" ${order === 'oldest' ? 'selected' : ''}>Terlama</option>
            <option value="highest" ${order === 'highest' ? 'selected' : ''}>Nominal Terbesar</option>
            <option value="lowest" ${order === 'lowest' ? 'selected' : ''}>Nominal Terkecil</option>
          </select>
        </div>

        <div class="filter-pills" role="group" aria-label="Saring berdasarkan kategori">
          <button type="button" class="filter-pill ${category === 'ALL' ? 'is-selected' : ''}" data-cat-pill="ALL">Semua</button>
          ${BUDGET_CATEGORIES.map(
            (c) =>
              `<button type="button" class="filter-pill ${category === c.id ? 'is-selected' : ''}" data-cat-pill="${esc(c.id)}">${esc(c.name)}</button>`,
          ).join('')}
        </div>

        <div class="ledger-scroll">
          <table class="ledger">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th class="cell-money">Nominal</th>
                <th class="cell-actions">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${
                visible.length === 0
                  ? '<tr><td colspan="5" style="text-align:center;color:var(--text-soft);padding:20px;">Belum ada transaksi yang sesuai filter.</td></tr>'
                  : visible
                      .map((tx) => {
                        const cat = findCategory(tx.category);
                        const editingRow = activeEdit && activeEdit.id === tx.id;
                        return `<tr class="${editingRow ? 'is-editing' : ''}">
                          <td class="tabular" style="white-space:nowrap;color:var(--text-soft)">${shortDateId(tx.date)}</td>
                          <td>
                            <div style="font-weight:700">${esc(tx.desc)}</div>
                            <div style="font-size:0.75rem;color:var(--text-soft)">${esc(tx.method)}</div>
                          </td>
                          <td>
                            <span class="cat-tag">
                              <span class="dot" style="background:${cat.tint}"></span>
                              ${esc(cat.name)}
                            </span>
                          </td>
                          <td class="cell-money tabular">${rp(tx.amount)}</td>
                          <td class="cell-actions">
                            <button type="button" class="action-btn btn-outline btn-compact" data-edit-tx="${esc(tx.id)}">Ubah</button>
                            <button type="button" class="action-btn btn-danger btn-compact" data-delete-tx="${esc(tx.id)}">Hapus</button>
                          </td>
                        </tr>`;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="mobile-ledger" aria-label="Daftar transaksi versi ponsel">
          ${
            visible.length === 0
              ? '<p style="text-align:center;color:var(--text-soft);margin:14px 0;">Tidak ada transaksi yang sesuai filter.</p>'
              : visible
                  .map((tx) => {
                    const cat = findCategory(tx.category);
                    const editingRow = activeEdit && activeEdit.id === tx.id;
                    return `<article class="tx-card ${editingRow ? 'is-editing' : ''}">
                      <div class="tx-card-top">
                        <div class="tx-card-title">${esc(tx.desc)}</div>
                        <div class="tx-card-money tabular">${rp(tx.amount)}</div>
                      </div>
                      <div class="tx-card-foot">
                        <div class="tx-card-meta">
                          <span class="cat-tag">
                            <span class="dot" style="background:${cat.tint}"></span>
                            ${esc(cat.name)}
                          </span>
                          <span>${shortDateId(tx.date)} &bull; ${esc(tx.method)}</span>
                        </div>
                        <div class="tx-card-btns">
                          <button type="button" class="action-btn btn-outline btn-compact" data-edit-tx="${esc(tx.id)}">Ubah</button>
                          <button type="button" class="action-btn btn-danger btn-compact" data-delete-tx="${esc(tx.id)}">Hapus</button>
                        </div>
                      </div>
                    </article>`;
                  })
                  .join('')
          }
        </div>
      </article>

      <div class="stack-col">
        <article class="surface-card">
          <div class="card-header">
            <h2>${activeEdit ? 'Ubah Transaksi Terpilih' : 'Catat Pengeluaran Baru'}</h2>
            ${activeEdit ? '<span class="chip chip-caution">Mode Ubah</span>' : '<span class="chip chip-good">Siap catat</span>'}
          </div>
          <form id="tx-editor-form" class="input-grid">
            <div class="control-group span-all">
              <label for="f-desc">Keterangan Transaksi</label>
              <input id="f-desc" name="desc" type="text" required value="${esc(activeEdit?.desc ?? '')}" placeholder="Contoh: Belanja ikan &amp; sayuran segar">
            </div>
            <div class="control-group">
              <label for="f-cat">Kategori</label>
              <select id="f-cat" name="category">
                ${BUDGET_CATEGORIES.map(
                  (c) => `<option value="${esc(c.id)}" ${(activeEdit?.category ?? 'Makanan') === c.id ? 'selected' : ''}>${esc(c.name)}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="control-group">
              <label for="f-amount">Nominal (Rp)</label>
              <input id="f-amount" name="amount" type="number" min="500" step="500" required value="${activeEdit ? activeEdit.amount : ''}" placeholder="125000">
            </div>
            <div class="control-group">
              <label for="f-date">Tanggal</label>
              <input id="f-date" name="date" type="date" required value="${esc(activeEdit?.date ?? '2026-11-26')}">
            </div>
            <div class="control-group">
              <label for="f-method">Metode Bayar</label>
              <select id="f-method" name="method">
                ${PAYMENT_METHODS.map(
                  (m) => `<option value="${esc(m)}" ${(activeEdit?.method ?? 'QRIS') === m ? 'selected' : ''}>${esc(m)}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="btn-row span-all">
              <button type="submit" class="action-btn btn-brand">${activeEdit ? 'Simpan Perubahan' : 'Tambahkan Transaksi'}</button>
              ${activeEdit ? '<button type="button" id="cancel-tx-edit" class="action-btn btn-outline">Batal</button>' : ''}
            </div>
          </form>
        </article>

        <article class="surface-card">
          <div class="card-header">
            <h2>Pola Belanja per 5 Hari</h2>
            <span class="chip chip-soft">Di luar tabungan</span>
          </div>
          <div class="chart-stage">
            <canvas id="chart-period-bars" aria-label="Grafik pengeluaran per rentang 5 hari"></canvas>
          </div>
        </article>
      </div>
    </section>
  `;

  renderPeriodSpendingBars(root.querySelector('#chart-period-bars'), store.transactions);

  root.querySelector('#tx-search')?.addEventListener('input', (event) => {
    const caret = event.currentTarget.selectionStart ?? event.currentTarget.value.length;
    patchFilters({ search: event.currentTarget.value });
    const refreshed = root.querySelector('#tx-search');
    if (refreshed) {
      refreshed.focus();
      refreshed.setSelectionRange(caret, caret);
    }
  });

  root.querySelector('#tx-method-filter')?.addEventListener('change', (event) => {
    patchFilters({ method: event.currentTarget.value });
  });

  root.querySelector('#tx-sort')?.addEventListener('change', (event) => {
    patchFilters({ order: event.currentTarget.value });
  });

  root.querySelectorAll('[data-cat-pill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      patchFilters({ category: btn.dataset.catPill });
    });
  });

  root.querySelector('#export-csv-btn')?.addEventListener('click', () => {
    const csv = buildTransactionsCsv(visible);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dompet-keluarga-nov-2026.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    notify(`Berhasil menyiapkan ekspor CSV (${visible.length} transaksi).`);
  });

  root.querySelector('#tx-editor-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const fields = {
      desc: String(fd.get('desc')),
      category: String(fd.get('category')),
      amount: Number(fd.get('amount')),
      date: String(fd.get('date')),
      method: String(fd.get('method')),
    };
    if (activeEdit) {
      editTransaction(activeEdit.id, fields);
      notify(`Transaksi "${fields.desc}" berhasil diperbarui.`);
    } else {
      createTransaction(fields);
      notify(`Transaksi "${fields.desc}" (${rp(fields.amount)}) ditambahkan.`);
    }
  });

  root.querySelector('#cancel-tx-edit')?.addEventListener('click', () => {
    selectEditingTransaction(null);
  });

  root.querySelectorAll('[data-edit-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectEditingTransaction(btn.dataset.editTx);
    });
  });

  root.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const removed = removeTransaction(btn.dataset.deleteTx);
      if (removed) notify(`Transaksi "${removed.desc}" dihapus.`);
    });
  });
}
