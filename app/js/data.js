// Sample Indonesian household budget dataset for Dompet Keluarga (November 2026).
// Monthly income: Rp 8.500.000; 7 household categories; all totals computed dynamically from these records.

export const HOUSEHOLD_INFO = {
  name: 'Keluarga Pratama',
  period: 'November 2026',
  city: 'Bekasi',
  monthlyIncome: 8500000,
  incomeSources: [
    { label: 'Gaji Pokok Bulanan', amount: 6800000 },
    { label: 'Usaha Kuliner & Tunjangan', amount: 1700000 },
  ],
};

export const CATEGORIES = [
  { id: 'Makanan', label: 'Makanan', color: '#D97706', bucket: 'needs', budget: 1900000, note: 'Sembako, pasar, susu anak' },
  { id: 'Rumah', label: 'Rumah', color: '#0F5C4D', bucket: 'needs', budget: 1500000, note: 'Kontrakan, iuran RT, perawatan' },
  { id: 'Transportasi', label: 'Transportasi', color: '#2563EB', bucket: 'needs', budget: 650000, note: 'BBM motor, KRL, servis ringan' },
  { id: 'Utilitas', label: 'Utilitas', color: '#0D9488', bucket: 'needs', budget: 600000, note: 'Listrik PLN, PDAM, WiFi, gas' },
  { id: 'Pendidikan', label: 'Pendidikan', color: '#7C3AED', bucket: 'wants', budget: 1150000, note: 'SPP sekolah, les, buku' },
  { id: 'Hiburan', label: 'Hiburan', color: '#DC2626', bucket: 'wants', budget: 900000, note: 'Makan luar, rekreasi, streaming' },
  { id: 'Tabungan', label: 'Tabungan', color: '#16A34A', bucket: 'savings', budget: 1800000, note: 'Dana darurat, pendidikan, mudik' },
];

export const INITIAL_EXPENSES = [
  { id: 'exp-01', date: '2026-11-01', category: 'Rumah', title: 'Kontrakan rumah bulanan', method: 'Transfer BCA', amount: 1350000 },
  { id: 'exp-02', date: '2026-11-02', category: 'Makanan', title: 'Belanja beras, minyak & sembako', method: 'QRIS', amount: 620000 },
  { id: 'exp-03', date: '2026-11-02', category: 'Tabungan', title: 'Setoran rutin Dana Darurat', method: 'Autodebet', amount: 1000000 },
  { id: 'exp-04', date: '2026-11-03', category: 'Utilitas', title: 'Token listrik PLN prabayar', method: 'Mobile Banking', amount: 280000 },
  { id: 'exp-05', date: '2026-11-04', category: 'Pendidikan', title: 'SPP sekolah & komite November', method: 'Transfer BRI', amount: 650000 },
  { id: 'exp-06', date: '2026-11-05', category: 'Transportasi', title: 'BBM Pertalite & ganti oli motor', method: 'Tunai', amount: 235000 },
  { id: 'exp-07', date: '2026-11-06', category: 'Utilitas', title: 'Tagihan WiFi rumah & air PDAM', method: 'Mobile Banking', amount: 265000 },
  { id: 'exp-08', date: '2026-11-08', category: 'Hiburan', title: 'Makan malam keluarga akhir pekan', method: 'QRIS', amount: 285000 },
  { id: 'exp-09', date: '2026-11-09', category: 'Makanan', title: 'Belanja pasar sayur, ikan & ayam', method: 'Tunai', amount: 340000 },
  { id: 'exp-10', date: '2026-11-10', category: 'Tabungan', title: 'Setoran Dana Pendidikan Anak', method: 'Autodebet', amount: 500000 },
  { id: 'exp-11', date: '2026-11-11', category: 'Pendidikan', title: 'Les matematika & bahasa Inggris', method: 'Transfer BCA', amount: 350000 },
  { id: 'exp-12', date: '2026-11-12', category: 'Transportasi', title: 'Top-up kartu KRL & TransJakarta', method: 'E-Wallet', amount: 180000 },
  { id: 'exp-13', date: '2026-11-14', category: 'Rumah', title: 'Iuran kebersihan RT & lampu LED', method: 'Tunai', amount: 150000 },
  { id: 'exp-14', date: '2026-11-15', category: 'Hiburan', title: 'Tiket wisata edukasi & jajan anak', method: 'QRIS', amount: 310000 },
  { id: 'exp-15', date: '2026-11-16', category: 'Makanan', title: 'Belanja dapur & buah di pasar', method: 'Tunai', amount: 385000 },
  { id: 'exp-16', date: '2026-11-18', category: 'Tabungan', title: 'Setoran Tabungan Mudik Lebaran', method: 'Transfer BCA', amount: 300000 },
  { id: 'exp-17', date: '2026-11-19', category: 'Utilitas', title: 'Isi ulang gas LPG 3 kg (2 tabung)', method: 'Tunai', amount: 45000 },
  { id: 'exp-18', date: '2026-11-20', category: 'Pendidikan', title: 'Buku latihan & alat tulis sekolah', method: 'QRIS', amount: 110000 },
  { id: 'exp-19', date: '2026-11-21', category: 'Transportasi', title: 'BBM motor & parkir bulanan', method: 'E-Wallet', amount: 145000 },
  { id: 'exp-20', date: '2026-11-22', category: 'Hiburan', title: 'Langganan streaming & kopi santai', method: 'E-Wallet', amount: 145000 },
  { id: 'exp-21', date: '2026-11-23', category: 'Makanan', title: 'Belanja bahan masak & susu anak', method: 'QRIS', amount: 315000 },
  { id: 'exp-22', date: '2026-11-25', category: 'Hiburan', title: 'Nonton bioskop & makan bakso', method: 'QRIS', amount: 220000 },
];

export const INITIAL_GOALS = [
  {
    id: 'goal-1',
    name: 'Dana Darurat Keluarga',
    note: 'Target 6 bulan pengeluaran pokok rumah tangga',
    saved: 18500000,
    target: 30000000,
    monthly: 1000000,
    color: '#0F5C4D',
  },
  {
    id: 'goal-2',
    name: 'Dana Pendidikan Anak',
    note: 'Persiapan masuk SMP & perlengkapan tahun 2028',
    saved: 9200000,
    target: 15000000,
    monthly: 500000,
    color: '#7C3AED',
  },
  {
    id: 'goal-3',
    name: 'Tabungan Mudik & Lebaran',
    note: 'Tiket kereta, hantaran orang tua & kebutuhan hari raya',
    saved: 3600000,
    target: 5000000,
    monthly: 300000,
    color: '#C96A2B',
  },
  {
    id: 'goal-4',
    name: 'Perbaikan Atap & Cat Rumah',
    note: 'Renovasi ringan sebelum puncak musim hujan',
    saved: 2400000,
    target: 6000000,
    monthly: 250000,
    color: '#2563EB',
  },
];

export const INITIAL_BILLS = [
  { id: 'bill-1', title: 'Kontrakan Rumah', dueDay: 1, dueLabel: '1 Nov 2026', category: 'Rumah', amount: 1350000, paid: true },
  { id: 'bill-2', title: 'Token Listrik PLN', dueDay: 5, dueLabel: '5 Nov 2026', category: 'Utilitas', amount: 280000, paid: true },
  { id: 'bill-3', title: 'WiFi Rumah & Air PDAM', dueDay: 10, dueLabel: '10 Nov 2026', category: 'Utilitas', amount: 265000, paid: true },
  { id: 'bill-4', title: 'SPP Sekolah Anak', dueDay: 10, dueLabel: '10 Nov 2026', category: 'Pendidikan', amount: 650000, paid: true },
  { id: 'bill-5', title: 'Iuran BPJS Kesehatan (3 org)', dueDay: 28, dueLabel: '28 Nov 2026', category: 'Utilitas', amount: 300000, paid: false },
  { id: 'bill-6', title: 'Cicilan Laptop Kerja (4/12)', dueDay: 30, dueLabel: '30 Nov 2026', category: 'Rumah', amount: 450000, paid: false },
];

export const RULE_503020_GUIDE = [
  {
    bucket: 'needs',
    title: '50% Kebutuhan Pokok',
    targetPct: 50,
    categories: 'Makanan, Rumah, Transportasi, Utilitas',
    tip: 'Prioritaskan kontrakan, sembako, listrik, dan transport kerja. Belanja pasar mingguan membantu menjaga pos Makanan di bawah Rp 1,9 juta.',
  },
  {
    bucket: 'wants',
    title: '30% Pengembangan & Keinginan',
    targetPct: 30,
    categories: 'Pendidikan (Les & Buku), Hiburan',
    tip: 'Sisihkan ruang untuk pendidikan anak dan rekreasi keluarga yang terukur. Saat Hiburan melewati batas, tunda jajan akhir pekan berikutnya.',
  },
  {
    bucket: 'savings',
    title: '20% Tabungan & Dana Darurat',
    targetPct: 20,
    categories: 'Tabungan Rutin & Target Jangka Panjang',
    tip: 'Pisahkan setoran tabungan di awal bulan lewat autodebet begitu gaji masuk agar target 20% selalu tercapai sebelum uang terpakai.',
  },
];
