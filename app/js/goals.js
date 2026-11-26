// Halaman Target Tabungan (#/tabungan): kartu progres target jangka pendek & panjang,
// tombol setoran cepat, estimasi bulan tercapai, grafik perbandingan, dan formulir target baru.

import {
  computeOverviewMetrics,
  createGoal,
  depositToGoal,
  esc,
  readStore,
  removeGoal,
  rp,
} from './state.js';
import { renderGoalsComparison } from './charts.js';

function estimateCompletionLabel(monthsNeeded) {
  if (monthsNeeded <= 0) return 'Target tercapai';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const baseMonth = 10; // November (0-indexed)
  const baseYear = 2026;
  const totalMonths = baseMonth + monthsNeeded;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = monthNames[totalMonths % 12];
  return `Est. ${targetMonth} ${targetYear} (~${monthsNeeded} bln)`;
}

export function mountGoals(root, notify) {
  const store = readStore();
  const metrics = computeOverviewMetrics();
  const overallRatio = metrics.goalsTarget > 0 ? (metrics.goalsSaved / metrics.goalsTarget) * 100 : 0;
  const totalShortfall = Math.max(0, metrics.goalsTarget - metrics.goalsSaved);
  const monthlyCommitment = store.goals.reduce((acc, g) => acc + g.monthlyPlan, 0);

  root.innerHTML = `
    <section class="hero-bar">
      <div>
        <h1 class="hero-title">Target Tabungan Keluarga</h1>
        <p class="hero-sub">Kumpulkan dana darurat, pendidikan anak, mudik, dan perbaikan rumah secara terukur.</p>
      </div>
      <div class="hero-cta">
        <a class="action-btn btn-outline" href="#/anggaran">Cek Pos Tabungan</a>
      </div>
    </section>

    <section class="metrics-strip" aria-label="Ringkasan target tabungan">
      <article class="metric-tile tone-good">
        <div class="metric-label">Total Terkumpul</div>
        <div class="metric-value tabular">${rp(metrics.goalsSaved)}</div>
        <div class="metric-foot">${overallRatio.toFixed(1).replace('.', ',')}% dari total target</div>
      </article>
      <article class="metric-tile">
        <div class="metric-label">Total Target Dana</div>
        <div class="metric-value tabular">${rp(metrics.goalsTarget)}</div>
        <div class="metric-foot">${store.goals.length} target tabungan aktif</div>
      </article>
      <article class="metric-tile tone-terra">
        <div class="metric-label">Sisa Kekurangan</div>
        <div class="metric-value tabular">${rp(totalShortfall)}</div>
        <div class="metric-foot">Dana yang perlu dihimpun</div>
      </article>
      <article class="metric-tile tone-cobalt">
        <div class="metric-label">Rencana Setoran / Bln</div>
        <div class="metric-value tabular">${rp(monthlyCommitment)}</div>
        <div class="metric-foot">Realisasi Nov: ${rp(metrics.savings)}</div>
      </article>
    </section>

    <section class="goal-deck">
      ${store.goals
        .map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
          const remaining = Math.max(0, goal.target - goal.current);
          const months = remaining === 0 ? 0 : Math.ceil(remaining / Math.max(1, goal.monthlyPlan));
          const etaChip =
            remaining === 0
              ? '<span class="chip chip-good">Tercapai</span>'
              : `<span class="chip chip-soft">${estimateCompletionLabel(months)}</span>`;

          return `<article class="goal-tile">
            <div class="goal-head">
              <div>
                <h3>${esc(goal.title)}</h3>
                <p>${esc(goal.detail)}</p>
              </div>
              ${etaChip}
            </div>
            <div class="goal-figures">
              <span class="goal-current tabular">${rp(goal.current)}</span>
              <span class="goal-of tabular">dari ${rp(goal.target)} (${pct.toFixed(1).replace('.', ',')}%)</span>
            </div>
            <div class="meter tall">
              <div class="meter-fill" style="width:${Math.round(pct)}%;background:${goal.tint}"></div>
            </div>
            <div class="goal-meta-row">
              <span>Rencana rutin: <strong class="tabular" style="color:var(--text)">${rp(goal.monthlyPlan)}/bln</strong></span>
              <span class="tabular">${remaining === 0 ? 'Selesai 100%' : `Kurang ${rp(remaining)}`}</span>
            </div>
            <form class="deposit-bar" data-goal-deposit="${esc(goal.id)}">
              <input type="number" name="amount" min="10000" step="10000" value="100000" aria-label="Nominal setoran untuk ${esc(goal.title)}">
              <button type="submit" class="action-btn btn-brand btn-compact">+ Setor</button>
              <button type="button" class="action-btn btn-outline btn-compact" data-quick-deposit="250000" data-goal-id="${esc(goal.id)}">+250rb</button>
              <button type="button" class="action-btn btn-danger btn-compact" data-remove-goal="${esc(goal.id)}" style="margin-left:auto">Hapus</button>
            </form>
          </article>`;
        })
        .join('')}
    </section>

    <section class="split-main">
      <article class="surface-card">
        <div class="card-header">
          <h2>Perbandingan Progres Semua Target</h2>
          <span class="chip chip-good tabular">${overallRatio.toFixed(0)}% rata-rata</span>
        </div>
        <div class="chart-stage">
          <canvas id="chart-goals-bars" aria-label="Grafik batang persentase progres target tabungan"></canvas>
        </div>
      </article>

      <article class="surface-card">
        <div class="card-header">
          <h2>Tambah Target Tabungan Baru</h2>
        </div>
        <form id="create-goal-form" class="input-grid">
          <div class="control-group span-all">
            <label for="ng-title">Nama Target</label>
            <input id="ng-title" name="title" type="text" required placeholder="Contoh: Ganti Kulkas Inverter Hemat Listrik">
          </div>
          <div class="control-group span-all">
            <label for="ng-detail">Catatan Singkat</label>
            <input id="ng-detail" name="detail" type="text" placeholder="Contoh: Target tercapai sebelum pertengahan 2027">
          </div>
          <div class="control-group">
            <label for="ng-target">Target Dana (Rp)</label>
            <input id="ng-target" name="target" type="number" min="100000" step="50000" required placeholder="4800000">
          </div>
          <div class="control-group">
            <label for="ng-current">Saldo Awal (Rp)</label>
            <input id="ng-current" name="current" type="number" min="0" step="50000" value="500000">
          </div>
          <div class="control-group span-all">
            <label for="ng-monthly">Rencana Setoran Bulanan (Rp)</label>
            <input id="ng-monthly" name="monthlyPlan" type="number" min="50000" step="50000" required value="300000">
          </div>
          <div class="btn-row span-all">
            <button type="submit" class="action-btn btn-terra">Simpan Target Baru</button>
          </div>
        </form>
      </article>
    </section>
  `;

  renderGoalsComparison(root.querySelector('#chart-goals-bars'), store.goals);

  root.querySelectorAll('[data-goal-deposit]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const id = form.dataset.goalDeposit;
      const amount = Number(new FormData(form).get('amount'));
      const updated = depositToGoal(id, amount, true);
      if (updated) notify(`Setoran ${rp(amount)} ditambahkan ke "${updated.title}".`);
    });
  });

  root.querySelectorAll('[data-quick-deposit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const amount = Number(btn.dataset.quickDeposit);
      const updated = depositToGoal(btn.dataset.goalId, amount, true);
      if (updated) notify(`Setoran cepat ${rp(amount)} masuk ke "${updated.title}".`);
    });
  });

  root.querySelectorAll('[data-remove-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const removed = removeGoal(btn.dataset.removeGoal);
      if (removed) notify(`Target tabungan "${removed.title}" dihapus.`);
    });
  });

  root.querySelector('#create-goal-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const created = createGoal({
      title: String(fd.get('title')),
      detail: String(fd.get('detail')),
      target: Number(fd.get('target')),
      current: Number(fd.get('current')),
      monthlyPlan: Number(fd.get('monthlyPlan')),
    });
    notify(`Target baru "${created.title}" berhasil ditambahkan.`);
  });
}
