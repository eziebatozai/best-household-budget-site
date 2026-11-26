// Pengontrol rute utama Dompet Keluarga.
// Halaman Ringkasan dimuat langsung pada muatan awal; halaman lain dimuat dinamis lewat import().

import { mountDashboard } from './dashboard.js';
import { onStoreChange } from './state.js';

const stageEl = document.getElementById('app-root');
const toastEl = document.getElementById('status-toast');
const navItems = Array.from(document.querySelectorAll('.primary-nav a[data-nav]'));

let toastHandle = null;
let drawGeneration = 0;

function notifyUser(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  if (toastHandle) clearTimeout(toastHandle);
  toastHandle = setTimeout(() => {
    toastEl.hidden = true;
  }, 2600);
}

function parseRoute(rawHash) {
  const segment = (rawHash || '#/').replace(/^#\/?/, '').split('?')[0].toLowerCase();
  if (segment === 'anggaran') return 'anggaran';
  if (segment === 'pengeluaran') return 'pengeluaran';
  if (segment === 'tabungan') return 'tabungan';
  if (segment === 'panduan' || segment === 'tagihan') return 'panduan';
  return 'dashboard';
}

const ROUTE_TITLES = {
  dashboard: 'Dompet Keluarga — Ringkasan Anggaran Rumah Tangga',
  anggaran: 'Perencana Anggaran | Dompet Keluarga',
  pengeluaran: 'Pencatat Pengeluaran | Dompet Keluarga',
  tabungan: 'Target Tabungan | Dompet Keluarga',
  panduan: 'Panduan 50/30/20 & Tagihan | Dompet Keluarga',
};

async function renderView(scrollTop = false) {
  const gen = ++drawGeneration;
  window.__viewReady = false;

  const current = parseRoute(location.hash);
  document.title = ROUTE_TITLES[current] ?? ROUTE_TITLES.dashboard;

  for (const anchor of navItems) {
    const active = anchor.dataset.nav === current;
    anchor.classList.toggle('is-current', active);
    if (active) {
      anchor.setAttribute('aria-current', 'page');
    } else {
      anchor.removeAttribute('aria-current');
    }
  }

  if (current === 'anggaran') {
    const mod = await import('./budget.js');
    if (gen !== drawGeneration) return;
    mod.mountBudgetPlanner(stageEl, notifyUser);
  } else if (current === 'pengeluaran') {
    const mod = await import('./expenses.js');
    if (gen !== drawGeneration) return;
    mod.mountExpenses(stageEl, notifyUser);
  } else if (current === 'tabungan') {
    const mod = await import('./goals.js');
    if (gen !== drawGeneration) return;
    mod.mountGoals(stageEl, notifyUser);
  } else if (current === 'panduan') {
    const mod = await import('./guide.js');
    if (gen !== drawGeneration) return;
    mod.mountGuideAndBills(stageEl, notifyUser);
  } else {
    mountDashboard(stageEl, notifyUser);
  }

  if (scrollTop) window.scrollTo(0, 0);
  window.__viewReady = true;
}

onStoreChange(() => {
  renderView(false);
});

window.addEventListener('hashchange', () => {
  renderView(true);
});

let resizeHandle = null;
window.addEventListener('resize', () => {
  if (resizeHandle) clearTimeout(resizeHandle);
  resizeHandle = setTimeout(() => renderView(false), 120);
});

renderView(true);
