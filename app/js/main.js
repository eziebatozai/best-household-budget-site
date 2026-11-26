// Main application router and shell controller for Dompet Keluarga.
// Dashboard loads on first paint; secondary views load lazily via static-specifier import().

import { renderDashboard } from './dashboard.js';
import { subscribe } from './state.js';

const appEl = document.getElementById('app');
const toastEl = document.getElementById('toast');
const navLinks = Array.from(document.querySelectorAll('.main-nav a[data-route]'));

let toastTimer = null;
let renderSeq = 0;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2600);
}

function resolveRoute(hash) {
  const clean = (hash || '#/').replace(/^#\/?/, '').split('?')[0].toLowerCase();
  if (clean === 'anggaran') return 'anggaran';
  if (clean === 'pengeluaran') return 'pengeluaran';
  if (clean === 'tabungan') return 'tabungan';
  if (clean === 'panduan' || clean === 'tagihan') return 'panduan';
  return 'dashboard';
}

const TITLES = {
  dashboard: 'Dompet Keluarga — Ringkasan Anggaran Rumah Tangga',
  anggaran: 'Perencana Anggaran | Dompet Keluarga',
  pengeluaran: 'Pencatat Pengeluaran | Dompet Keluarga',
  tabungan: 'Target Tabungan | Dompet Keluarga',
  panduan: 'Panduan 50/30/20 & Tagihan | Dompet Keluarga',
};

async function renderCurrentRoute(resetScroll = false) {
  const seq = ++renderSeq;
  window.__shotReady = false;

  const route = resolveRoute(location.hash);
  document.title = TITLES[route] ?? TITLES.dashboard;

  for (const link of navLinks) {
    const isActive = link.dataset.route === route;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  if (route === 'anggaran') {
    const mod = await import('./budget.js');
    if (seq !== renderSeq) return;
    mod.renderBudgetPlanner(appEl, showToast);
  } else if (route === 'pengeluaran') {
    const mod = await import('./expenses.js');
    if (seq !== renderSeq) return;
    mod.renderExpenses(appEl, showToast);
  } else if (route === 'tabungan') {
    const mod = await import('./goals.js');
    if (seq !== renderSeq) return;
    mod.renderGoals(appEl, showToast);
  } else if (route === 'panduan') {
    const mod = await import('./guide.js');
    if (seq !== renderSeq) return;
    mod.renderGuideAndBills(appEl, showToast);
  } else {
    renderDashboard(appEl, showToast);
  }

  if (resetScroll) window.scrollTo(0, 0);
  window.__shotReady = true;
}

subscribe(() => {
  renderCurrentRoute(false);
});

window.addEventListener('hashchange', () => {
  renderCurrentRoute(true);
});

let resizeTimer = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderCurrentRoute(false), 120);
});

renderCurrentRoute(true);
