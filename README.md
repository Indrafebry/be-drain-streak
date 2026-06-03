# DrainStreak Backend MVP

DrainStreak adalah aplikasi *Finance Tracker* dengan fitur gamifikasi bergaya Duolingo. Proyek ini dibangun menggunakan **Node.js (Express.js)** dan **Supabase (PostgreSQL)**.

## Fitur Utama
1. **Pencatatan Transaksi:** Mencatat pengeluaran/pemasukan dan memantau limit *budget*.
2. **Gamifikasi:** Mendapatkan XP, naik *level*, menjaga *Daily Streak*, dan menyelesaikan misi harian.
3. **DrainStore:** Menggunakan *DrainCoins* untuk membeli *Streak Freeze*.
4. **Simulator Midnight-Check:** Rute khusus (`/api/v1/simulation/midnight-check`) yang mensimulasikan *cron job* tengah malam untuk mengecek dan mereset *streak* (atau mengaplikasikan *freeze*).

## Instalasi & Testing Lokal

1. **Clone & Install Dependencies**
   Pastikan Anda telah menginstal Node.js (misal versi LTS atau v22.22.0). Buka terminal dan jalankan:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment (.env)**
   Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:
   - `PORT`: Bebas, misal `3000`.
   - `DATABASE_URL`: Isi dengan *Connection String* (Pooling) dari dashboard Supabase Anda. Anda bisa menemukannya di **Project Settings -> Database -> Connection string -> URI**. Pastikan untuk mengganti password dengan password *database* Anda.
   - `JWT_SECRET`: Buat string acak dan rahasia untuk tanda tangan JWT.

3. **Migrasi Skema Database**
   Salin isi file `schema.sql` dan jalankan di SQL Editor Supabase Anda. Ini akan membuat seluruh tabel yang dibutuhkan.

4. **Jalankan Server**
   ```bash
   npm run dev
   ```
   API akan berjalan di `http://localhost:3000`.

## Panduan Deployment ke Render.com

1. Buat akun di [Render.com](https://render.com) dan hubungkan dengan akun GitHub Anda.
2. Buat **New Web Service**, pilih repositori GitHub proyek ini.
3. **Pengaturan Build & Start:**
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js` (atau `npm start`)
4. **Environment Variables:**
   Di bagian menu Environment di dashboard Render, tambahkan variabel-variabel yang ada di `.env` lokal Anda:
   - `DATABASE_URL` (dari Supabase)
   - `JWT_SECRET`
5. **Mencegah Render Spin-Down (Sleep):**
   Render versi gratis sering kali melakukan *spin-down* (tidur) jika tidak ada *traffic* selama 15 menit. Untuk menghindarinya (terutama agar *midnight-check cron* di platform lain tetap dapat menjangkau server ini), gunakan layanan gratis seperti [cron-job.org](https://cron-job.org) dan atur untuk me-ping atau memanggil `GET https://<nama-app-anda>.onrender.com/` setiap 10-14 menit sekali.
6. Klik **Deploy**. Selesai!