# FM24 Squad Ability Tracker (SAT-24)

Proyek ini adalah proyek iseng yang saya buat untuk memudahkan bermain Football Manager 2024 (FM24).

Tujuan utamanya adalah membantu memantau fluktuasi Current Ability (CA) pemain secara berkala. Di FM24, kita sering lupa nilai CA pemain di awal musim, terlambat menyadari penurunan kemampuan pemain senior sebelum harga pasarnya jatuh, atau terlewat mempromosikan pemain muda yang perkembangannya sedang melesat.

Aplikasi ini membaca file HTML hasil ekspor bawaan FM24, menghitung selisih CA secara otomatis, memberikan saran transfer, dan menampilkan grafik riwayat perkembangan pemain.

---

## Fitur Utama

1. **Import Otomatis dan Manual:** Membaca file ekspor skuad berformat HTML dari FM24 lewat folder watcher otomatis maupun form upload di browser.
2. **Kalkulasi Delta CA Otomatis:** Menghitung selisih antara snapshot awal musim (baseline) dan snapshot terkini (target).
3. **Smart Transfer Advice:**
   - **SELL:** Untuk pemain berusia 29 tahun ke atas yang mengalami penurunan CA minimal 2 poin.
   - **MONITOR/LOAN:** Untuk pemain berusia 22-26 tahun yang perkembangannya stagnan (Delta CA = 0) atau menurun.
   - **PROMOTE:** Untuk pemain muda berusia 21 tahun ke bawah dengan kenaikan CA cepat (+4 atau lebih).
   - **MAINTAIN:** Perkembangan normal untuk rotasi skuad utama.
4. **Grafik Perkembangan Pemain:** Menampilkan kurva perjalanan CA dari waktu ke waktu serta batas Potential Ability (PA) menggunakan grafik garis interaktif.
5. **Local-First:** Database SQLite tersimpan di komputer lokal, ringan dan tidak membebani performa PC saat game berjalan.

---

## Kebutuhan Sistem

Sebelum menjalankan aplikasi, pastikan perangkat sudah terpasang:
- Go versi 1.22 atau lebih baru
- Node.js versi 18 atau lebih baru dan npm

---

## Cara Instalasi dan Menjalankan

Proyek ini terbagi menjadi dua bagian: backend (Go) dan frontend (Next.js).

### 1. Menjalankan Backend (Go)

Buka terminal di folder proyek:

```bash
cd server
go mod tidy
go run ./cmd/server
```

Backend akan aktif di `http://localhost:8080`.
Folder `server/exports/` akan otomatis dibuat dan siap memantau file ekspor baru.

### 2. Menjalankan Frontend (Next.js)

Buka terminal baru di folder proyek:

```bash
cd web
npm install
npm run dev
```

Frontend dashboard akan aktif dan dapat diakses melalui browser di `http://localhost:3000`.

---

## Cara Penggunaan

### 1. Menyiapkan Tampilan (View) di FM24

Agar data terbaca lengkap, pastikan kolom pada tampilan menu Squad FM24 Anda memuat atribut berikut:
- UID (Unique ID)
- Name (Nama Pemain)
- Position (Posisi)
- Age (Usia)
- CA (Current Ability)
- PA (Potential Ability)
- Wage (Gaji Mingguan)
- Value (Estimasi Nilai Transfer)
- Status / Info (Kondisi kebugaran/status pinjaman)

### 2. Mengekspor Data dari FM24

1. Masuk ke menu **Squad** di FM24.
2. Tekan kombinasi tombol **Ctrl + P** pada keyboard.
3. Pada dialog cetak yang muncul, pilih opsi **Web Page (.html)**.
4. Beri nama file (misal: `squad_awal_musim.html`) dan simpan.

### 3. Memasukkan Data ke Tracker

Anda bisa memilih salah satu dari dua cara berikut:

- **Cara Otomatis (Folder Watcher):**
  Pindahkan atau simpan file `.html` langsung ke folder `server/exports/`. Backend akan otomatis mendeteksi dan memasukkan snapshot ke database dalam hitungan detik.

- **Cara Manual (Lewat Dashboard):**
  Buka `http://localhost:3000`, klik tombol **Upload Snapshot** di pojok kanan atas, pilih file `.html` Anda, lalu klik **Impor Snapshot**.

### 4. Membaca Data dan Mengambil Keputusan

1. Di bar navigasi atas, pilih:
   - **Baseline:** Snapshot acuan (misal: saat awal musim baru dimulai).
   - **Target:** Snapshot terkini yang ingin dievaluasi (misal: paruh musim atau akhir musim).
2. Lihat **Stat Cards** di bagian atas untuk ringkasan cepat rata-rata tim, pemain dengan lonjakan CA tertinggi, dan jumlah kandidat jual.
3. Gunakan **Squad Overview Matrix** untuk melihat detail per pemain, memfilter berdasarkan kategori rekomendasi (Sell, Promote, Monitor/Loan), atau mencari nama pemain tertentu.
4. Klik tombol **Chart** di baris pemain mana pun untuk membuka grafik garis perkembangan kemampuannya dari musim ke musim.

---

## Struktur Folder

- `server/`: Backend Go (router Chi, database SQLite mode WAL, HTML parser goquery, file watcher fsnotify).
  - `cmd/server/`: Titik masuk utama aplikasi backend.
  - `internal/db/`: Pengelolaan database dan skema tabel.
  - `internal/engine/`: Logika rekomendasi transfer.
  - `internal/parser/`: Parser tabel HTML FM24.
  - `internal/watcher/`: Listener folder exports.
  - `exports/`: Folder tempat menaruh file `.html` untuk impor otomatis.
- `web/`: Frontend Next.js 15 (Tailwind CSS, TanStack Table, Recharts, Lucide Icons).
  - `app/`: Halaman dashboard dan layout.
  - `components/`: Komponen tabel, kartu statistik, dan modal grafik.
  - `lib/`: Klien API dan penyedia state query.
- `testdata/`: Contoh file HTML ekspor FM24 untuk keperluan uji coba.
