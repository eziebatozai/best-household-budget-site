// Pure in-memory state store and financial calculations for Dompet Keluarga.
// Does not rely on cookies, localStorage, or service workers so it works identically everywhere.

import {
  CATEGORIES,
  HOUSEHOLD_INFO,
  INITIAL_BILLS,
  INITIAL_EXPENSES,
  INITIAL_GOALS,
} from './data.js';

const listeners = new Set();
let nextId = 100;

function cloneInitialState() {
  const budgets = {};
  for (const cat of CATEGORIES) {
    budgets[cat.id] = cat.budget;
  }
  return {
    income: HOUSEHOLD_INFO.monthlyIncome,
    budgets,
    expenses: INITIAL_EXPENSES.map((item) => ({ ...item })),
    goals: INITIAL_GOALS.map((item) => ({ ...item })),
    bills: INITIAL_BILLS.map((item) => ({ ...item })),
    expenseFilter: { category: 'ALL', query: '', sort: 'date-desc' },
    editingExpenseId: null,
  };
}

const state = cloneInitialState();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(state);
}

export function getCategoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function getCategorySummary() {
  const spentMap = {};
  for (const cat of CATEGORIES) spentMap[cat.id] = 0;
  for (const exp of state.expenses) {
    if (spentMap[exp.category] !== undefined) {
      spentMap[exp.category] += exp.amount;
    }
  }
  return CATEGORIES.map((cat) => {
    const budget = state.budgets[cat.id] ?? 0;
    const spent = spentMap[cat.id] ?? 0;
    const remaining = budget - spent;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    let status = 'ok';
    let statusLabel = 'Aman';
    if (cat.id === 'Tabungan') {
      status = spent >= budget ? 'ok' : 'warn';
      statusLabel = spent >= budget ? 'Target Tercapai' : 'Belum Penuh';
    } else if (spent > budget) {
      status = 'danger';
      statusLabel = 'Melebihi';
    } else if (pct >= 85) {
      status = 'warn';
      statusLabel = pct >= 100 ? 'Pas Anggaran' : 'Hampir Penuh';
    }
    return {
      ...cat,
      budget,
      spent,
      remaining,
      pct,
      status,
      statusLabel,
    };
  });
}

export function getTotals() {
  const summary = getCategorySummary();
  let totalSpending = 0;
  let totalSavingsTransfer = 0;
  let totalBudgeted = 0;

  for (const row of summary) {
    totalBudgeted += row.budget;
    if (row.id === 'Tabungan') {
      totalSavingsTransfer += row.spent;
    } else {
      totalSpending += row.spent;
    }
  }

  const totalOutflow = totalSpending + totalSavingsTransfer;
  const remainingCash = state.income - totalOutflow;
  const unallocatedBudget = state.income - totalBudgeted;
  const spendingPct = state.income > 0 ? (totalSpending / state.income) * 100 : 0;
  const savingsPct = state.income > 0 ? (totalSavingsTransfer / state.income) * 100 : 0;

  const totalGoalSaved = state.goals.reduce((acc, g) => acc + g.saved, 0);
  const totalGoalTarget = state.goals.reduce((acc, g) => acc + g.target, 0);
  const unpaidBills = state.bills.filter((b) => !b.paid);
  const unpaidBillsTotal = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  return {
    income: state.income,
    totalSpending,
    totalSavingsTransfer,
    totalOutflow,
    remainingCash,
    totalBudgeted,
    unallocatedBudget,
    spendingPct,
    savingsPct,
    totalGoalSaved,
    totalGoalTarget,
    unpaidBillsCount: unpaidBills.length,
    unpaidBillsTotal,
    expenseCount: state.expenses.length,
  };
}

export function getRule503020() {
  const summary = getCategorySummary();
  const income = state.income || 1;
  const buckets = {
    needs: { label: 'Kebutuhan', targetPct: 50, targetAmount: Math.round(income * 0.5), budgeted: 0, actual: 0 },
    wants: { label: 'Keinginan & Les', targetPct: 30, targetAmount: Math.round(income * 0.3), budgeted: 0, actual: 0 },
    savings: { label: 'Tabungan', targetPct: 20, targetAmount: Math.round(income * 0.2), budgeted: 0, actual: 0 },
  };
  for (const row of summary) {
    const b = buckets[row.bucket];
    if (b) {
      b.budgeted += row.budget;
      b.actual += row.spent;
    }
  }
  for (const key of Object.keys(buckets)) {
    const b = buckets[key];
    b.actualPct = (b.actual / income) * 100;
    b.budgetPct = (b.budgeted / income) * 100;
  }
  return buckets;
}

export function setIncome(amount) {
  const clean = Math.max(0, Math.round(Number(amount) || 0));
  state.income = clean;
  notify();
}

export function setBudget(categoryId, amount) {
  if (state.budgets[categoryId] === undefined) return;
  state.budgets[categoryId] = Math.max(0, Math.round(Number(amount) || 0));
  notify();
}

export function addExpense({ date, category, title, method, amount }) {
  const cleanAmount = Math.max(1, Math.round(Number(amount) || 0));
  const item = {
    id: `exp-${++nextId}`,
    date: date || '2026-11-26',
    category: state.budgets[category] !== undefined ? category : 'Makanan',
    title: String(title || 'Pengeluaran').trim(),
    method: String(method || 'Tunai').trim(),
    amount: cleanAmount,
  };
  state.expenses.unshift(item);
  notify();
  return item;
}

export function updateExpense(id, patch) {
  const target = state.expenses.find((e) => e.id === id);
  if (!target) return null;
  if (patch.date) target.date = patch.date;
  if (patch.category && state.budgets[patch.category] !== undefined) target.category = patch.category;
  if (patch.title !== undefined) target.title = String(patch.title).trim() || target.title;
  if (patch.method !== undefined) target.method = String(patch.method).trim() || target.method;
  if (patch.amount !== undefined) target.amount = Math.max(1, Math.round(Number(patch.amount) || target.amount));
  state.editingExpenseId = null;
  notify();
  return target;
}

export function deleteExpense(id) {
  const idx = state.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  state.expenses.splice(idx, 1);
  if (state.editingExpenseId === id) state.editingExpenseId = null;
  notify();
  return true;
}

export function setEditingExpense(id) {
  state.editingExpenseId = id;
  notify();
}

export function setExpenseFilter(patch) {
  Object.assign(state.expenseFilter, patch);
  notify();
}

export function addGoalDeposit(goalId, amount, recordAsTransfer = false) {
  const goal = state.goals.find((g) => g.id === goalId);
  const clean = Math.max(0, Math.round(Number(amount) || 0));
  if (!goal || clean <= 0) return null;
  goal.saved += clean;
  if (recordAsTransfer) {
    state.expenses.unshift({
      id: `exp-${++nextId}`,
      date: '2026-11-26',
      category: 'Tabungan',
      title: `Setoran ${goal.name}`,
      method: 'Transfer Bank',
      amount: clean,
    });
  }
  notify();
  return goal;
}

export function addGoal({ name, note, target, saved, monthly }) {
  const palette = ['#0F5C4D', '#7C3AED', '#C96A2B', '#2563EB', '#0D9488', '#D97706'];
  const goal = {
    id: `goal-${++nextId}`,
    name: String(name || 'Target Baru').trim(),
    note: String(note || 'Target tabungan keluarga').trim(),
    target: Math.max(100000, Math.round(Number(target) || 1000000)),
    saved: Math.max(0, Math.round(Number(saved) || 0)),
    monthly: Math.max(50000, Math.round(Number(monthly) || 200000)),
    color: palette[state.goals.length % palette.length],
  };
  state.goals.push(goal);
  notify();
  return goal;
}

export function deleteGoal(goalId) {
  const idx = state.goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return false;
  state.goals.splice(idx, 1);
  notify();
  return true;
}

export function toggleBillPaid(billId) {
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) return null;
  bill.paid = !bill.paid;
  notify();
  return bill;
}

export function payBillAndRecord(billId) {
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) return null;
  if (!bill.paid) {
    bill.paid = true;
    state.expenses.unshift({
      id: `exp-${++nextId}`,
      date: '2026-11-26',
      category: bill.category,
      title: `Bayar tagihan: ${bill.title}`,
      method: 'Mobile Banking',
      amount: bill.amount,
    });
    notify();
  }
  return bill;
}

export function addBill({ title, dueDay, category, amount }) {
  const day = Math.min(31, Math.max(1, Math.round(Number(dueDay) || 28)));
  const bill = {
    id: `bill-${++nextId}`,
    title: String(title || 'Tagihan Bulanan').trim(),
    dueDay: day,
    dueLabel: `${day} Nov 2026`,
    category: state.budgets[category] !== undefined ? category : 'Utilitas',
    amount: Math.max(1000, Math.round(Number(amount) || 0)),
    paid: false,
  };
  state.bills.push(bill);
  state.bills.sort((a, b) => a.dueDay - b.dueDay);
  notify();
  return bill;
}

export function deleteBill(billId) {
  const idx = state.bills.findIndex((b) => b.id === billId);
  if (idx === -1) return false;
  state.bills.splice(idx, 1);
  notify();
  return true;
}

export function formatRupiah(value) {
  const num = Math.round(Number(value) || 0);
  const abs = Math.abs(num);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return num < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatShortRupiah(value) {
  const num = Math.round(Number(value) || 0);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1000000) {
    const jt = (abs / 1000000).toFixed(abs % 1000000 === 0 ? 0 : 1).replace('.', ',');
    return `${sign}Rp ${jt} jt`;
  }
  if (abs >= 1000) {
    return `${sign}Rp ${Math.round(abs / 1000)} rb`;
  }
  return `${sign}Rp ${abs}`;
}

export function formatDateId(isoDate) {
  const parts = String(isoDate || '').split('-');
  if (parts.length !== 3) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const m = Number(parts[1]) - 1;
  return `${Number(parts[2])} ${months[m] ?? parts[1]}`;
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}
