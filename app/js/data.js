// Dataset contoh rumah tangga Indonesia untuk Dompet Keluarga (November 2026).
// Pendapatan bulanan Rp 8.500.000 dengan 7 kategori utama yang seluruh totalnya dihitung otomatis.

export const FAMILY_PROFILE = {
  familyName: 'Keluarga Wijaya',
  monthLabel: 'November 2026',
  city: 'Bandung',
  incomeMonthly: 8500000,
  incomeBreakdown: [
    { source: 'Gaji Bulanan Tetap', amount: 6900000 },
    { source: 'Usaha Katering Rumahan', amount: 1600000 },
  ],
};

export const BUDGET_CATEGORIES = [
  { id: 'Makanan', name: 'Makanan', tint: '#D97706', group: 'needs', limit: 2000000, hint: 'Sembako, pasar sayur, lauk, susu' },
  { id: 'Rumah', name: 'Rumah', tint: '#114B45', group: 'needs', limit: 1550000, hint: 'Sewa rumah, iuran RT, perawatan' },
  { id: 'Transportasi', name: 'Transportasi', tint: '#2358C8', group: 'needs', limit: 650000, hint: 'BBM motor, KRL, servis berkala' },
  { id: 'Utilitas', name: 'Utilitas', tint: '#0E8A7D', group: 'needs', limit: 600000, hint: 'Token PLN, PDAM, internet, LPG' },
  { id: 'Pendidikan', name: 'Pendidikan', tint: '#6D3CE0', group: 'wants', limit: 1100000, hint: 'SPP sekolah, bimbingan belajar, buku' },
  { id: 'Hiburan', name: 'Hiburan', tint: '#D13B2E', group: 'wants', limit: 850000, hint: 'Makan luar, wisata keluarga, streaming' },
  { id: 'Tabungan', name: 'Tabungan', tint: '#16794A', group: 'savings', limit: 1750000, hint: 'Dana darurat, pendidikan, hari raya' },
];

export const PAYMENT_METHODS = [
  'QRIS',
  'Tunai',
  'Transfer Mandiri',
  'Transfer BCA',
  'Mobile Banking',
  'E-Wallet',
  'Autodebet',
];

export const SEED_TRANSACTIONS = [
  { id: 'tx-01', date: '2026-11-01', category: 'Rumah', desc: 'Sewa rumah bulanan November', method: 'Transfer Mandiri', amount: 1400000 },
  { id: 'tx-02', date: '2026-11-02', category: 'Makanan', desc: 'Belanja sembako bulanan & beras 15 kg', method: 'QRIS', amount: 645000 },
  { id: 'tx-03', date: '2026-11-02', category: 'Tabungan', desc: 'Autodebet Dana Darurat Keluarga', method: 'Autodebet', amount: 950000 },
  { id: 'tx-04', date: '2026-11-03', category: 'Utilitas', desc: 'Pembelian token listrik PLN rumah', method: 'Mobile Banking', amount: 275000 },
  { id: 'tx-05', date: '2026-11-04', category: 'Transportasi', desc: 'BBM motor & servis berkala bengkel', method: 'Tunai', amount: 220000 },
  { id: 'tx-06', date: '2026-11-05', category: 'Pendidikan', desc: 'SPP sekolah dasar & kegiatan ekskul', method: 'Transfer BCA', amount: 620000 },
  { id: 'tx-07', date: '2026-11-06', category: 'Utilitas', desc: 'Tagihan internet fiber & air PDAM', method: 'Mobile Banking', amount: 256000 },
  { id: 'tx-08', date: '2026-11-07', category: 'Hiburan', desc: 'Makan malam soto & sate keluarga', method: 'QRIS', amount: 265000 },
  { id: 'tx-09', date: '2026-11-08', category: 'Makanan', desc: 'Belanja sayur, telur & daging ayam pasar', method: 'Tunai', amount: 390000 },
  { id: 'tx-10', date: '2026-11-10', category: 'Tabungan', desc: 'Setoran rutin Dana Pendidikan Anak', method: 'Autodebet', amount: 500000 },
  { id: 'tx-11', date: '2026-11-11', category: 'Pendidikan', desc: 'Bimbingan belajar matematika & baca', method: 'Transfer BCA', amount: 295000 },
  { id: 'tx-12', date: '2026-11-12', category: 'Transportasi', desc: 'Isi saldo kartu KRL & angkutan harian', method: 'E-Wallet', amount: 175000 },
  { id: 'tx-13', date: '2026-11-13', category: 'Rumah', desc: 'Iuran lingkungan RT/RW & ganti keran', method: 'Tunai', amount: 115000 },
  { id: 'tx-14', date: '2026-11-14', category: 'Hiburan', desc: 'Wisata kebun raya & kudapan akhir pekan', method: 'QRIS', amount: 295000 },
  { id: 'tx-15', date: '2026-11-15', category: 'Makanan', desc: 'Susu pertumbuhan & buah segar keluarga', method: 'QRIS', amount: 375000 },
  { id: 'tx-16', date: '2026-11-17', category: 'Tabungan', desc: 'Setoran Dana Mudik & Hari Raya', method: 'Transfer Mandiri', amount: 300000 },
  { id: 'tx-17', date: '2026-11-18', category: 'Utilitas', desc: 'Tukar tabung gas LPG 3 kg (2 unit)', method: 'Tunai', amount: 44000 },
  { id: 'tx-18', date: '2026-11-19', category: 'Pendidikan', desc: 'Paket buku latihan & alat tulis anak', method: 'QRIS', amount: 115000 },
  { id: 'tx-19', date: '2026-11-20', category: 'Transportasi', desc: 'BBM motor & parkir bulanan stasiun', method: 'QRIS', amount: 145000 },
  { id: 'tx-20', date: '2026-11-21', category: 'Hiburan', desc: 'Paket streaming musik & kopi akhir pekan', method: 'E-Wallet', amount: 130000 },
  { id: 'tx-21', date: '2026-11-22', category: 'Makanan', desc: 'Belanja lauk mingguan & bumbu dapur', method: 'Tunai', amount: 350000 },
  { id: 'tx-22', date: '2026-11-25', category: 'Hiburan', desc: 'Tiket bioskop keluarga & makan bakso', method: 'QRIS', amount: 230000 },
];

export const SEED_SAVINGS_GOALS = [
  {
    id: 'sv-1',
    title: 'Dana Darurat Keluarga',
    detail: 'Cadangan 6 bulan biaya hidup pokok untuk rasa aman keluarga',
    current: 19200000,
    target: 30000000,
    monthlyPlan: 950000,
    tint: '#114B45',
  },
  {
    id: 'sv-2',
    title: 'Dana Pendidikan Anak',
    detail: 'Tabungan uang pangkal SMP & perlengkapan belajar 2028',
    current: 9600000,
    target: 16000000,
    monthlyPlan: 500000,
    tint: '#6D3CE0',
  },
  {
    id: 'sv-3',
    title: 'Dana Mudik & Hari Raya',
    detail: 'Tiket kereta keluarga, bingkisan orang tua & kebutuhan Lebaran',
    current: 3800000,
    target: 5500000,
    monthlyPlan: 300000,
    tint: '#C85A28',
  },
  {
    id: 'sv-4',
    title: 'Renovasi Dapur & Cat Ulang',
    detail: 'Perbaikan ventilasi dapur dan pengecatan ruang tengah',
    current: 2600000,
    target: 6500000,
    monthlyPlan: 250000,
    tint: '#2358C8',
  },
];

export const SEED_RECURRING_BILLS = [
  { id: 'bl-1', name: 'Sewa Rumah Bulanan', day: 1, dateText: '1 Nov 2026', category: 'Rumah', amount: 1400000, settled: true },
  { id: 'bl-2', name: 'Token Listrik PLN', day: 3, dateText: '3 Nov 2026', category: 'Utilitas', amount: 275000, settled: true },
  { id: 'bl-3', name: 'Internet Fiber & Air PDAM', day: 6, dateText: '6 Nov 2026', category: 'Utilitas', amount: 256000, settled: true },
  { id: 'bl-4', name: 'SPP Sekolah Dasar', day: 10, dateText: '10 Nov 2026', category: 'Pendidikan', amount: 620000, settled: true },
  { id: 'bl-5', name: 'Iuran BPJS Kesehatan (3 jiwa)', day: 28, dateText: '28 Nov 2026', category: 'Utilitas', amount: 300000, settled: false },
  { id: 'bl-6', name: 'Cicilan Mesin Cuci (5/12)', day: 30, dateText: '30 Nov 2026', category: 'Rumah', amount: 425000, settled: false },
];

export const RULE_GUIDE_ITEMS = [
  {
    group: 'needs',
    heading: '50% Kebutuhan Pokok',
    idealPct: 50,
    included: 'Makanan, Rumah, Transportasi, Utilitas',
    advice: 'Amankan pos tempat tinggal, bahan pangan, listrik, dan mobilitas harian terlebih dahulu. Membuat daftar belanja mingguan efektif menahan kebocoran pos Makanan.',
  },
  {
    group: 'wants',
    heading: '30% Pengembangan & Keinginan',
    idealPct: 30,
    included: 'Pendidikan Anak (SPP/Les/Buku), Hiburan',
    advice: 'Beri ruang sehat untuk pendidikan anak serta waktu berkualitas bersama keluarga. Bila pos Hiburan sudah menyentuh 100%, alihkan agenda akhir pekan ke aktivitas gratis.',
  },
  {
    group: 'savings',
    heading: '20% Tabungan & Dana Darurat',
    idealPct: 20,
    included: 'Tabungan Rutin & Target Jangka Panjang',
    advice: 'Jadwalkan autodebet tabungan di tanggal 1–3 setiap bulan begitu gaji diterima, bukan menunggu sisa uang di akhir bulan.',
  },
];
