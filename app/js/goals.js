// Savings Goals view (#/tabungan): goal cards with progress bars, deposit actions,
// estimated time to completion, new goal creation, and overview Canvas chart.

import {
  addGoal,
  addGoalDeposit,
  deleteGoal,
  escapeHtml,
  formatRupiah,
  getState,
  getTotals,
} from './state.js';
import { drawGoalProgressChart } from './charts.js';

export function renderGoals(container, showToast) {
  const state = getState();
  const totals = getTotals();
  const overallPct = totals.totalGoalTarget > 0 ? (totals.totalGoalSaved / totals.totalGoalTarget) * 100 : 0;
  const remainingAll = Math.max(0, totals.totalGoalTarget - totals.totalGoalSaved);
  const totalMonthlyPlan = state.goals.reduce((sum, g) => sum + g.monthly, 0);

  container.innerHTML = `
    <section class="page-head">
      <div>
        <h1>Target Tabungan Keluarga</h1>
        <p>Pantau progres dana darurat, pendidikan anak, mudik, dan rencana rumah tangga lainnya.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="#/anggaran">Cek Pos Tabungan</a>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Ringkasan target tabungan">
      <article class="kpi-card kpi-save">
        <div class="kpi-label">Total Terkumpul</div>
        <div class="kpi-value num">${formatRupiah(totals.totalGoalSaved)}</div>
        <div class="kpi-sub">${overallPct.toFixed(1).replace('.', ',')}% dari seluruh target</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-label">Total Target</div>
        <div class="kpi-value num">${formatRupiah(totals.totalGoalTarget)}</div>
        <div class="kpi-sub">${state.goals.length} target aktif</div>
      </article>
      <article class="kpi-card kpi-spend">
        <div class="kpi-label">Kekurangan Target</div>
        <div class="kpi-value num">${formatRupiah(remainingAll)}</div>
        <div class="kpi-sub">Total sisa yang perlu dikumpulkan</div>
      </article>
      <article class="kpi-card kpi-cash">
        <div class="kpi-label">Rencana Setoran / Bln</div>
        <div class="kpi-value num">${formatRupiah(totalMonthlyPlan)}</div>
        <div class="kpi-sub">Setoran bulan ini: ${formatRupiah(totals.totalSavingsTransfer)}</div>
      </article>
    </section>

    <section class="goals-grid">
      ${state.goals
        .map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
          const remaining = Math.max(0, goal.target - goal.saved);
          const monthsLeft = remaining === 0 ? 0 : Math.ceil(remaining / Math.max(1, goal.monthly));
          const statusBadge =
            remaining === 0
              ? '<span class="badge badge-ok">Tercapai</span>'
              : `<span class="badge badge-neutral">~${monthsLeft} bln lagi</span>`;

          return `<article class="goal-card">
            <div class="goal-top">
              <div>
                <h3>${escapeHtml(goal.name)}</h3>
                <p>${escapeHtml(goal.note)}</p>
              </div>
              ${statusBadge}
            </div>
            <div class="goal-numbers">
              <span class="goal-saved num">${formatRupiah(goal.saved)}</span>
              <span class="goal-target num">dari ${formatRupiah(goal.target)} (${pct.toFixed(1).replace('.', ',')}%)</span>
            </div>
            <div class="progress-track thick">
              <div class="progress-fill" style="width:${Math.round(pct)}%;background:${goal.color}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--muted);flex-wrap:wrap;gap:6px;">
              <span>Setoran rutin: <strong class="num" style="color:var(--ink);">${formatRupiah(goal.monthly)}/bln</strong></span>
              <span class="num">${remaining === 0 ? 'Target terpenuhi' : `Kurang ${formatRupiah(remaining)}`}</span>
            </div>
            <form class="goal-deposit-row" data-deposit-form="${escapeHtml(goal.id)}">
              <input type="number" name="amount" min="1000" step="1000" value="100000" aria-label="Nominal setoran untuk ${escapeHtml(goal.name)}">
              <button type="submit" class="btn btn-primary btn-sm">+ Tambah Setoran</button>
              <button type="button" class="btn btn-danger-ghost btn-sm" data-del-goal="${escapeHtml(goal.id)}" style="margin-left:auto;">Hapus</button>
            </form>
          </article>`;
        })
        .join('')}
    </section>

    <section class="grid-2">
      <article class="panel">
        <div class="panel-head">
          <h2>Perbandingan Progres Target</h2>
          <span class="badge badge-ok num">${overallPct.toFixed(0)}% rata-rata</span>
        </div>
        <div class="chart-box">
          <canvas id="goals-bar-chart" aria-label="Grafik persentase progres semua target tabungan"></canvas>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>Buat Target Tabungan Baru</h2>
        </div>
        <form id="new-goal-form" class="form-grid">
          <div class="field full">
            <label for="goal-name">Nama Target</label>
            <input id="goal-name" name="name" type="text" required placeholder="Contoh: Ganti Kulkas Hemat Listrik">
          </div>
          <div class="field full">
            <label for="goal-note">Catatan Singkat</label>
            <input id="goal-note" name="note" type="text" placeholder="Contoh: Target beli sebelum pertengahan tahun">
          </div>
          <div class="field">
            <label for="goal-target">Target Dana (Rp)</label>
            <input id="goal-target" name="target" type="number" min="10000" step="1000" required placeholder="4500000">
          </div>
          <div class="field">
            <label for="goal-saved">Saldo Awal (Rp)</label>
            <input id="goal-saved" name="saved" type="number" min="0" step="1000" value="500000">
          </div>
          <div class="field full">
            <label for="goal-monthly">Rencana Setoran per Bulan (Rp)</label>
            <input id="goal-monthly" name="monthly" type="number" min="10000" step="1000" required value="300000">
          </div>
          <div class="form-actions full">
            <button type="submit" class="btn btn-accent">Tambahkan Target</button>
          </div>
        </form>
      </article>
    </section>
  `;

  drawGoalProgressChart(container.querySelector('#goals-bar-chart'), state.goals);

  container.querySelectorAll('[data-deposit-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const goalId = form.dataset.depositForm;
      const amount = Number(new FormData(form).get('amount'));
      const updated = addGoalDeposit(goalId, amount, true);
      if (updated) {
        showToast(`Setoran ${formatRupiah(amount)} ditambahkan ke "${updated.name}".`);
      }
    });
  });

  container.querySelectorAll('[data-del-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delGoal;
      const g = state.goals.find((item) => item.id === id);
      if (deleteGoal(id) && g) {
        showToast(`Target "${g.name}" dihapus.`);
      }
    });
  });

  container.querySelector('#new-goal-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const created = addGoal({
      name: String(fd.get('name')),
      note: String(fd.get('note')),
      target: Number(fd.get('target')),
      saved: Number(fd.get('saved')),
      monthly: Number(fd.get('monthly')),
    });
    showToast(`Target baru "${created.name}" berhasil dibuat.`);
  });
}
