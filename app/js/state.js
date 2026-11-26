// Pengelola state terpusat di memori dan kalkulasi keuangan Dompet Keluarga.
// Tanpa cookie, localStorage, atau permintaan jaringan eksternal agar deterministik di semua peramban.

import {
  BUDGET_CATEGORIES,
  FAMILY_PROFILE,
  SEED_RECURRING_BILLS,
  SEED_SAVINGS_GOALS,
  SEED_TRANSACTIONS,
} from './data.js';

const subscribers = new Set();
let seqCounter = 200;

function createFreshStore() {
  const limits = {};
  for (const cat of BUDGET_CATEGORIES) {
    limits[cat.id] = cat.limit;
  }
  return {
    income: FAMILY_PROFILE.incomeMonthly,
    limits,
    transactions: SEED_TRANSACTIONS.map((tx) => ({ ...tx })),
    goals: SEED_SAVINGS_GOALS.map((g) => ({ ...g })),
    bills: SEED_RECURRING_BILLS.map((b) => ({ ...b })),
    filters: {
      category: 'ALL',
      method: 'ALL',
      search: '',
      order: 'newest',
    },
    editingTxId: null,
    simIncome: FAMILY_PROFILE.incomeMonthly,
  };
}

const store = createFreshStore();

export function readStore() {
  return store;
}

export function onStoreChange(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

function emitChange() {
  for (const fn of subscribers) fn(store);
}

export function findCategory(id) {
  return BUDGET_CATEGORIES.find((c) => c.id === id) ?? BUDGET_CATEGORIES[0];
}

export function computeCategoryBreakdown() {
  const totalsByCat = Object.create(null);
  for (const cat of BUDGET_CATEGORIES) totalsByCat[cat.id] = 0;

  for (const tx of store.transactions) {
    if (Object.hasOwn(totalsByCat, tx.category)) {
      totalsByCat[tx.category] += tx.amount;
    }
  }

  return BUDGET_CATEGORIES.map((cat) => {
    const limit = store.limits[cat.id] ?? 0;
    const used = totalsByCat[cat.id] ?? 0;
    const balance = limit - used;
    const ratio = limit > 0 ? (used / limit) * 100 : 0;

    let tone = 'good';
    let badgeText = 'Aman';

    if (cat.id === 'Tabungan') {
      if (used >= limit && limit > 0) {
        tone = 'good';
        badgeText = 'Tercapai';
      } else {
        tone = 'caution';
        badgeText = 'Dalam Progres';
      }
    } else if (used > limit) {
      tone = 'alert';
      badgeText = 'Melebihi';
    } else if (ratio >= 85) {
      tone = 'caution';
      badgeText = ratio >= 100 ? 'Tepat Batas' : 'Hampir Penuh';
    }

    return {
      ...cat,
      limit,
      used,
      balance,
      ratio,
      tone,
      badgeText,
    };
  });
}

export function computeOverviewMetrics() {
  const rows = computeCategoryBreakdown();
  let spending = 0;
  let savings = 0;
  let plannedTotal = 0;

  for (const row of rows) {
    plannedTotal += row.limit;
    if (row.id === 'Tabungan') {
      savings += row.used;
    } else {
      spending += row.used;
    }
  }

  const outflow = spending + savings;
  const freeCash = store.income - outflow;
  const unallocated = store.income - plannedTotal;
  const spendRate = store.income > 0 ? (spending / store.income) * 100 : 0;
  const saveRate = store.income > 0 ? (savings / store.income) * 100 : 0;

  const goalsSaved = store.goals.reduce((sum, g) => sum + g.current, 0);
  const goalsTarget = store.goals.reduce((sum, g) => sum + g.target, 0);
  const pendingBills = store.bills.filter((b) => !b.settled);
  const pendingBillsAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  return {
    income: store.income,
    spending,
    savings,
    outflow,
    freeCash,
    plannedTotal,
    unallocated,
    spendRate,
    saveRate,
    goalsSaved,
    goalsTarget,
    pendingBillsCount: pendingBills.length,
    pendingBillsAmount,
    txCount: store.transactions.length,
  };
}

export function computeRule503020() {
  const rows = computeCategoryBreakdown();
  const base = Math.max(1, store.income);
  const groups = {
    needs: { label: 'Kebutuhan Pokok', idealPct: 50, idealRp: Math.round(store.income * 0.5), planned: 0, actual: 0 },
    wants: { label: 'Pengembangan & Keinginan', idealPct: 30, idealRp: Math.round(store.income * 0.3), planned: 0, actual: 0 },
    savings: { label: 'Tabungan & Dana Darurat', idealPct: 20, idealRp: Math.round(store.income * 0.2), planned: 0, actual: 0 },
  };

  for (const row of rows) {
    const g = groups[row.group];
    if (g) {
      g.planned += row.limit;
      g.actual += row.used;
    }
  }

  for (const key of Object.keys(groups)) {
    groups[key].actualPct = (groups[key].actual / base) * 100;
    groups[key].plannedPct = (groups[key].planned / base) * 100;
  }

  return groups;
}

export function updateMonthlyIncome(value) {
  const sanitized = Math.max(0, Math.round(Number(value) || 0));
  store.income = sanitized;
  store.simIncome = sanitized;
  emitChange();
}

export function updateCategoryLimit(categoryId, value) {
  if (!Object.hasOwn(store.limits, categoryId)) return;
  store.limits[categoryId] = Math.max(0, Math.round(Number(value) || 0));
  emitChange();
}

export function applyIdeal503020Plan() {
  const inc = store.income;
  const needsTotal = Math.round(inc * 0.5);
  const wantsTotal = Math.round(inc * 0.3);
  const savingsTotal = inc - needsTotal - wantsTotal;

  // Proporsi pembagian wajar rumah tangga Indonesia di dalam tiap kelompok
  const makanan = Math.round((needsTotal * 0.42) / 50000) * 50000;
  const rumah = Math.round((needsTotal * 0.32) / 50000) * 50000;
  const transport = Math.round((needsTotal * 0.14) / 50000) * 50000;
  const utilitas = Math.max(0, needsTotal - makanan - rumah - transport);

  const pendidikan = Math.round((wantsTotal * 0.58) / 50000) * 50000;
  const hiburan = Math.max(0, wantsTotal - pendidikan);

  store.limits.Makanan = makanan;
  store.limits.Rumah = rumah;
  store.limits.Transportasi = transport;
  store.limits.Utilitas = utilitas;
  store.limits.Pendidikan = pendidikan;
  store.limits.Hiburan = hiburan;
  store.limits.Tabungan = Math.max(0, savingsTotal);
  emitChange();
}

export function createTransaction({ date, category, desc, method, amount }) {
  const cleanAmount = Math.max(500, Math.round(Number(amount) || 0));
  const record = {
    id: `tx-${++seqCounter}`,
    date: date || '2026-11-26',
    category: Object.hasOwn(store.limits, category) ? category : 'Makanan',
    desc: String(desc || 'Transaksi rumah tangga').trim(),
    method: String(method || 'QRIS').trim(),
    amount: cleanAmount,
  };
  store.transactions.unshift(record);
  emitChange();
  return record;
}

export function editTransaction(id, fields) {
  const target = store.transactions.find((t) => t.id === id);
  if (!target) return null;
  if (fields.date) target.date = fields.date;
  if (fields.category && Object.hasOwn(store.limits, fields.category)) target.category = fields.category;
  if (fields.desc !== undefined) target.desc = String(fields.desc).trim() || target.desc;
  if (fields.method !== undefined) target.method = String(fields.method).trim() || target.method;
  if (fields.amount !== undefined) target.amount = Math.max(500, Math.round(Number(fields.amount) || target.amount));
  store.editingTxId = null;
  emitChange();
  return target;
}

export function removeTransaction(id) {
  const idx = store.transactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const [removed] = store.transactions.splice(idx, 1);
  if (store.editingTxId === id) store.editingTxId = null;
  emitChange();
  return removed;
}

export function selectEditingTransaction(id) {
  store.editingTxId = id;
  emitChange();
}

export function patchFilters(patch) {
  Object.assign(store.filters, patch);
  emitChange();
}

export function setSimulatedIncome(value) {
  store.simIncome = Math.max(2000000, Math.round(Number(value) || FAMILY_PROFILE.incomeMonthly));
  emitChange();
}

export function depositToGoal(goalId, amount, alsoLogExpense = true) {
  const goal = store.goals.find((g) => g.id === goalId);
  const clean = Math.max(0, Math.round(Number(amount) || 0));
  if (!goal || clean <= 0) return null;
  goal.current += clean;
  if (alsoLogExpense) {
    store.transactions.unshift({
      id: `tx-${++seqCounter}`,
      date: '2026-11-26',
      category: 'Tabungan',
      desc: `Setoran ${goal.title}`,
      method: 'Transfer Mandiri',
      amount: clean,
    });
  }
  emitChange();
  return goal;
}

export function createGoal({ title, detail, target, current, monthlyPlan }) {
  const swatches = ['#114B45', '#6D3CE0', '#C85A28', '#2358C8', '#0E8A7D', '#D97706'];
  const entry = {
    id: `sv-${++seqCounter}`,
    title: String(title || 'Target Baru').trim(),
    detail: String(detail || 'Rencana tabungan rumah tangga').trim(),
    target: Math.max(100000, Math.round(Number(target) || 1000000)),
    current: Math.max(0, Math.round(Number(current) || 0)),
    monthlyPlan: Math.max(50000, Math.round(Number(monthlyPlan) || 250000)),
    tint: swatches[store.goals.length % swatches.length],
  };
  store.goals.push(entry);
  emitChange();
  return entry;
}

export function removeGoal(goalId) {
  const idx = store.goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return null;
  const [removed] = store.goals.splice(idx, 1);
  emitChange();
  return removed;
}

export function flipBillStatus(billId) {
  const bill = store.bills.find((b) => b.id === billId);
  if (!bill) return null;
  bill.settled = !bill.settled;
  emitChange();
  return bill;
}

export function settleBillWithExpense(billId) {
  const bill = store.bills.find((b) => b.id === billId);
  if (!bill || bill.settled) return null;
  bill.settled = true;
  store.transactions.unshift({
    id: `tx-${++seqCounter}`,
    date: '2026-11-26',
    category: bill.category,
    desc: `Bayar tagihan: ${bill.name}`,
    method: 'Mobile Banking',
    amount: bill.amount,
  });
  emitChange();
  return bill;
}

export function createBill({ name, day, category, amount }) {
  const due = Math.min(31, Math.max(1, Math.round(Number(day) || 28)));
  const bill = {
    id: `bl-${++seqCounter}`,
    name: String(name || 'Tagihan Rutin').trim(),
    day: due,
    dateText: `${due} Nov 2026`,
    category: Object.hasOwn(store.limits, category) ? category : 'Utilitas',
    amount: Math.max(1000, Math.round(Number(amount) || 0)),
    settled: false,
  };
  store.bills.push(bill);
  store.bills.sort((a, b) => a.day - b.day);
  emitChange();
  return bill;
}

export function removeBill(billId) {
  const idx = store.bills.findIndex((b) => b.id === billId);
  if (idx === -1) return null;
  const [removed] = store.bills.splice(idx, 1);
  emitChange();
  return removed;
}

export function buildTransactionsCsv(list) {
  const header = ['Tanggal', 'Keterangan', 'Kategori', 'Metode', 'Nominal (Rp)'];
  const rows = list.map((t) => [
    t.date,
    `"${String(t.desc).replace(/"/g, '""')}"`,
    t.category,
    t.method,
    String(t.amount),
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function rp(amount) {
  const n = Math.round(Number(amount) || 0);
  const formatted = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function rpCompact(amount) {
  const n = Math.round(Number(amount) || 0);
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-' : '';
  if (abs >= 1000000) {
    const val = (abs / 1000000).toFixed(abs % 1000000 === 0 ? 0 : 1).replace('.', ',');
    return `${prefix}Rp ${val} jt`;
  }
  if (abs >= 1000) {
    return `${prefix}Rp ${Math.round(abs / 1000)} rb`;
  }
  return `${prefix}Rp ${abs}`;
}

export function shortDateId(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const m = Number(parts[1]) - 1;
  return `${Number(parts[2])} ${months[m] ?? parts[1]}`;
}

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}
