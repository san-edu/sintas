# SINTAS untuk Orang Awam — Versi Populer dari Dokumentasi Teknis

> Absensi Sekolah Berbasis QR Code (Siswa / Guru / Admin)
>
> Dokumen ini adalah **teman bicara** dari `docs/DOKUMENTASI_PROJECT_SINTAS.md`
> yang lengkap dan teknis. Di sini, seluruh sisi teknis tetap **dijelaskan
> dengan jujur dan utuh** — nama teknologinya disebut, alur kerjanya
> dijabarkan — tetapi dikemas dengan bahasa sehari-hari dan analogi agar
> mudah dipahami siapa pun yang tidak berkecimpung di dunia *IT*.
>
> Untuk pembaca teknis yang ingin versi super-lengkap, silakan buka dokumen
> aslinya. Kedua dokumen berkisah tentang proyek yang sama.

---

## 1. SINTAS dalam Satu Paragraf

**SINTAS** adalah aplikasi absensi digital untuk sebuah sekolah. Tugasnya
menggantikan daftar hadir kertas dengan cara segini sederhananya:

1. **Guru** membuat "sesi absensi" untuk pertemuan tertentu (misal: Matematika
   kelas 8, Senin 07.00–08.40).
2. Sistem langsung membuat **kode QR** khusus untuk sesi itu.
3. **Siswa** memindai kode itu dengan ponselnya — sekali, dalam hitungan detik.
4. Sistem mencatat otomatis: **Hadir**, **Terlambat** (beserta menitnya), atau
   (pada akhir sesi) **Tidak Hadir**.
5. Guru dan Admin bisa melihat rekap dan **mengunduh laporannya** sebagai
   berkas Excel.

Tiga kelompok yang memakainya: **Siswa** (memindai & mengecek riwayatnya),
**Guru** (membuka sesi, melihat kelas, mengunduh rekap), dan **Admin**
(menata data siswa/guru/kelas, mengelola pengumuman, melihat laporan seluruh
sekolah).

> **Kenapa dibuat?** Absensi manual itu lambat (mengecam nama satu-satu),
> rawan salah hitung, rentan kehilangan kertas, dan rekap akhir bulan sangat
> melelahkan. SINTAS menghilangkan ketiganya.

---

## 2. Kamus Kilat: Istilah Teknis → Bahasa Manusia

Istilah berikut akan sering muncul di dokumen ini. Hafalkan padanan sederhananya
dan yang teknis tidak akan lagi terlihat menakutkan.

| Istilah Teknis | Artinya dalam Bahasa Sehari-hari |
| --- | --- |
| **Backend** | "Dapur" aplikasi. Tempat semua aturan diproses, data disimpan, dan keputusan penting diambil. Tidak terlihat langsung oleh pengguna. |
| **Frontend** | "Ruang makan / etalase" aplikasi. Yang dilihat dan disentuh pengguna: halaman login, tombol, formulir, layar hasil. |
| **API** | "Pelayan" yang menghubungkan ruang makan dan dapur. Mengantar pesanan dari layar pengguna ke dapur, lalu membawa kembali hasilnya. |
| **Server** | "Bangunan" tempat aplikasi bekerja, hidup 24 jam. Seperti toko yang buka terus supaya pengguna bisa mengakses kapan pun. |
| **Database** | "Gudang arsip" yang sangat tertib. Semua data siswa, guru, kelas, jadwal, dan kehadiran disimpan di sini, rapi berlabel. |
| **SPA (Single-Page Application)** | Aplikasi yang "berpindah halaman" tanpa harus memuat ulang seluruh halaman setiap saat — terasa ringan dan cepat seperti aplikasi HP. |
| **Monolith** | Satu "bangunan" utuh menyimpan semuanya (dapur, gudang, resep) dalam satu atap, ketimbang dipecah jadi banyak bangunan kecil. |
| **JWT + Cookie HttpOnly** | "Tanda pengenal" sementara yang diberikan saat login, disimpan di tempat tersembunyi yang tidak bisa dibaca oleh halaman lain — untuk mencegah peniruan identitas. |
| **Enkripsi (password di-hash)** | Kata sandi diubah jadi "gambaran kunci", bukan kunci aslinya. Bahkan jika file terbongkar, kata sandi asli tidak terbaca. |
| **Rate limiting** | "Pintu antrean". Membatasi jumlah percobaan (contoh: login 10 kali per 15 menit) untuk menghentikan percobaan menebak password beruntun. |
| **CSRF token** | "Stempel pengaman" ekstra yang memastikan sebuah permintaan benar-benar datang dari pengguna sah, bukan dari halaman nakal orang lain. |
| **Timezone / UTC** | Patokan jam dunia yang disepakati. Semua waktu direkam dengan satu patokan, lalu ditampilkan dalam jam lokal sekolah — agar tidak ada yang bisa "mengutak-atik jam". |
| **QR payload (43 karakter)** | "Tiket acak" berisi kode tak-tertebak, tanpa data pribadi siswa. Sistem hanya cocokkan kode, seperti pencocokan tiket di pintu masuk. |
| **Idempoten** | Kemampuan "tidak menggandakan". Aksi yang diulang tetap memberikan hasil yang sama — memindai dua kali tetap dicatat sekali. |
| **Migrasi database** | "Renovasi bertahap" pada gudang arsip: menambah lemari/kolom tanpa menghentikan operasional sekolah. |
| **Seed data** | "Bahan contoh awal" yang otomatis mengisi akun demo saat pengembangan, supaya aplikasi bisa langsung dicoba. |
| **Test otomatis** | "Pasukan pemeriksa" yang menjalankan ratusan uji coba setiap kali kode berubah, memastikan tidak ada yang rusak diam-diam. |
| **Deploy** | "Merilis / membuka toko": menempatkan aplikasi ke dunia nyata agar bisa dipakai pengguna sungguhan. |

> **Tips untuk yang ingin melek-teknis:** kalau Anda bisa mengartikan kelima
> istilah penting ini — backend, frontend, API, database, server — Anda sudah
> memahami kerangka hampir semua aplikasi web modern. SINTAS menjalankan
> kelima konsep itu.

---

## 3. Otak dan Tangan: Cara SINTAS "Berpikir"

### 3.1 Tiga Lapisan Utama

Bayangkan SINTAS sebagai sebuah toko besar bergaya **restoran**:

- **Frontend (ruang makan & etalase)** — halaman-halaman indah yang dilihat
  siswa, guru, dan admin: login, tombol "Buat Sesi", layar pemindai QR, tabel
  rekap. Dibuat dengan teknologi web standar (React + Vite + Tailwind) —
  sama seperti bahasa dan alat yang dipakai banyak aplikasi modern.
- **Backend (dapur & ruang kontrol)** — di sinilah aturan-aturan penting
  dijalankan: "dari jam berapa siswa boleh pindai?", "apakah ini terlambat
  berapa menit?", "siapa yang berhak melihat laporan ini?". Backend dibangun
  dengan Node.js + Express, salah satu fondasi aplikasi web paling populer di
  dunia.
- **Database (gudang arsip)** — seluruh data kehadiran disimpan di sini
  memakai MySQL, ditata lewat alat bernama Prisma (semacam "sopir gudang"
  yang memastikan barang masuk-keluar dengan skema yang benar).

### 3.2 Bagaimana Mereka Bicara: Si Pelayan (API)

Ketika seorang guru menekan tombol "Buat Sesi Absensi":

1. **Frontend** (ruang makan) memanggil **pelayan** — dalam dunia teknis
   dipanggil **API** — menggunakan semacam "formulir permintaan" standar.
2. Pelayan membawa formulir ke **dapur (backend)**.
3. Dapur memeriksa aturan: "Guru ini memang mengajar kelas itu?" → "Jamnya
   wajar?" → "Belum ada sesi ganda?" → lalu menyimpan ke gudang.
4. Pelayan kembali ke ruang makan membawa jawaban: "Sesi berhasil, ini kode
   QR-nya."

Komunikasi ini **diatur dengan aturan yang jelas** — setiap jenis permintaan
memiliki format tanggapan yang sama. Kalau ada masalah, tanggapannya juga
seragam, misalnya "kata sandi salah", "sesi tidak ditemukan", atau "data
terlalu banyak dipindai". Pengguna selalu tahu apa yang terjadi.

### 3.3 Dapur yang Rapi: Lapisan Kerja di Dalam Backend

Di dalam "dapur", pekerjaan dibagi menjadi beberapa pos (dalam istilah teknis:
*layer*): **route → middleware → controller → service → repository →
database** — bisa dianalogikan sebagai:

1. **Route** (penjaga pintu) — menunjuk permintaan ke dapur bagian yang benar.
2. **Middleware** (satpam) — memeriksa "siapa kamu?" dan "punya izin?",
   plus "apakah permintaan ini tidak mencurigakan?".
3. **Controller** (pelayan dapur) — menerima permintaan, lalu menyerahkan ke
   ahlinya.
4. **Service** (koki utama) — memutuskan aturan bisnis: status absensi,
   waktu, izin akses. Inilah "otak" yang paling penting.
5. **Repository** (pramu gudang) — satu-satunya petugas yang boleh menulis/
   membaca ke gudang data.
6. **Database** (gudang) — penyimpanan akhir.

Pemisahan ini penting: kalau ada bug di tampilan, dapur tidak ikut rusak;
kalau aturan absensi diubah, cukup koki utama yang direvisi. Ini adalah standar
yang dikenal baik dalam dunia pengembangan perangkat lunak (*clean
architecture*).

> **Kenapa penting bagi sekolah?** Karena dengan pemisahan yang rapi,
> aplikasi lebih mudah dirawat, lebih aman diaudit, dan setiap perubahan bisa
> diuji tanpa mengganggu bagian lain.

---

## 4. Fitur yang Benar-Benar Berfungsi (Apa Saja yang Bisa Dilakukan)

Setiap fitur di bawah **benar-benar diimplementasikan** — bukan sekadar
gambar di kertas. Dibuat berdasarkan kebutuhan nyata sekolah (tercantum dalam
dokumen PRD).

### 4.1 Login & Keamanan Sesi (untuk semua peran)

**Dalam bahasa awam:** Siswa, guru, dan admin masuk dengan username dan kata
sandi. Begitu masuk, sistem tahu siapa Anda dan memberi menu sesuai peran —
siswa tidak bisa masuk ke menu admin, dan seterusnya. Bila lupa kata sandi,
bisa dipulihkan melalui email + tanggal lahir + kata sandi baru.

**Yang menarik di sisi teknis:**
- Kata sandi dienkripsi dengan algoritma kelas atas (**Argon2id**) — bukan
  disimpan polos.
- Identitas login disimpan sebagai **JWT** di dalam **cookie HttpOnly** —
  tanda pengenal yang tersembunyi dari halaman lain.
- Ada **rate limiting**: maksimal 10 kali percobaan login dalam 15 menit,
  dan 5 kali pemulihan kata sandi — untuk mempersulit peretas.
- Ada **proteksi CSRF dua lapis**: sistem menolak permintaan dari sumber
  tidak dikenal dan meminta "stempel" khusus untuk permintaan penting.
- Data diri seperti username/NIM tidak bisa diubah (identitas resmi),
  sedangkan nama/email/WhatsApp/tanggal lahir bisa diperbarui.

### 4.2 Pengumuman / Banner Sekolah

**Dalam bahasa awam:** Admin bisa menampilkan pengumuman bergambar di beranda
semua pengguna, misalnya "Open House Sabtu Ini". Banner tampil sebagai
geseran (carousel), dan bila admin hanya menulis teks tanpa gambar, aplikasi
menampilkan kartu teks yang rapi.

**Yang menarik di sisi teknis:** Admin bisa membuat, mengedit, menghapus,
mengaktifkan/menonaktifkan, dan mencari banner; filter periode tampil juga
didukung.

### 4.3 Data Akademik & Penempatan (Kelas, Mapel, Plotting)

**Dalam bahasa awam:** Admin menata "papan organisasi" sekolah: jenjang,
kelas, mata pelajaran. Lalu menempatkan **siswa ke kelas** dan **guru ke
mata pelajaran + kelas**.

**Yang menarik di sisi teknis:**
- Aturan penting: **satu siswa hanya boleh punya satu kelas aktif**. Kalau
  ada upaya menempatkan dua kali, sistem menolak dengan kode khusus
  (`409 ACTIVE_CLASS_MEMBERSHIP_EXISTS`).
- Guru tidak bisa "mengambil" penugasan yang bukan miliknya — sistem
  memeriksa relasinya sebelum menampilkan.

### 4.4 Sesi Absensi & Kode QR

**Dalam bahasa awam:** Guru memilih kelas + mata pelajaran yang memang
diampunya, menentukan tanggal dan jam mulai/selesai — dan sistem langsung
membuatkan kode QR untuk sesi itu.

**Yang menarik di sisi teknis:**
- Kode QR berisi **token acak 43 karakter** hasil bilangan acak berkekuatan
  kriptografis — **tidak membawa data pribadi siswa** dan mustahil ditebak.
- Kalau guru membuat sesi di waktu yang sama untuk hari dan kelas yang sama
  dua kali, sistem menolak duplikat (`409 DUPLICATE_ATTENDANCE_SESSION`).
- Jam yang diinput wajib sesuai dengan zona waktu sekolah (Asia/Jakarta).

### 4.5 Pemindaian & Status Kehadiran — Jantung Aplikasi

**Dalam bahasa awam:** Siswa memindai QR di ponselnya. Sistem melihat **jam
server sendiri** (bukan jam ponsel siswa) lalu menetapkan status.

**Aturan 15 menit — yang paling penting untuk dihafal:**
- Jendela pemindaian dibuka **15 menit sebelum** jam mulai.
- Memindai **hingga 15 menit setelah** jam mulai → **HADIR** (terlambat 0 menit).
- Memindai **setelah itu sampai sesi berakhir** → **TERLAMBAT**, lengkap dengan
  jumlah menitnya.
- Tidak memindai sampai sesi berakhir → **TIDAK HADIR**.

**Yang menarik di sisi teknis (dan jadi nilai jual):**
1. **Waktu dari mesin, bukan manusia** — keputusan selalu berdasarkan jam
   server, jadi siswa tidak bisa berbohong dengan mengubah jam ponselnya.
2. **Anti-duplikat**: kalau siswa memindai ulang (atau dua permintaan datang
   bersamaan), sistem cukup mencatat **satu** kehadiran dan menjawab dengan
   ramah "sudah tercatat". Di dunia teknis ini disebut **idempoten** — dijamin
   oleh aturan ketat di database (gabungan sesi + siswa hanya boleh ada
   sekali).
3. **TIDAK HADIR tidak disimpan menunggu kertas** — status ini **dihitung
   saat laporan dibaca**. Jadi data selalu segar dan tidak berlebihan.
4. Jalur pemindaian dibuat **ringan dan khusus** — tidak memuat pekerjaan
   lain (banner, laporan) sehingga 100+ siswa yang memindai bersamaan di pagi
   hari tetap mulus.
5. Lalu lintas dibatasi agar tidak disalahgunakan (default 120 pemindaian/
   menit per koneksi), dan siswa yang bukan anggota kelas ditolak dengan
   jelas.

### 4.6 Riwayat, Rekap, dan Laporan Excel

**Dalam bahasa awam:** Siswa melihat riwayat pribadinya (lengkap dengan
tanggal, status, menit keterlambatan). Guru melihat peta kehadiran kelasnya.
Admin melihat laporan seluruh sekolah — dan semuanya bisa **diunduh sebagai
file Excel**.

**Yang menarik di sisi teknis:**
- Laporan memakai nama file sebutan: `laporan-kehadiran-…xlsx`, dengan kolom
  jelas: tanggal sesi, kelas, mapel, nama siswa, NIM, status, menit
  terlambat, waktu scan.
- Laporan kosong → sistem menjawab dengan sopan "tidak ada data untuk
  diekspor" (kode `404 NO_DATA_TO_EXPORT`), bukan file kosong menyesatkan.
- Ekspor dibatasi maksimal 2 proses bersamaan agar server tidak kewalahan
  (`429 EXPORT_BUSY`).
- Riwayat mendukung pencarian rentang tanggal, filter status, dan halaman
  (pagination) — data tetap ringan meski sudah banyak.

### 4.7 Upaya "Pemeliharaan Kesehatan" Aplikasi

Di balik layar ada fitur kesehatan untuk tim teknis: pemeriksaan apakah
sistem hidup (`/health/live`) dan apakah koneksi ke database masih sehat
(`/health/ready`), pencatatan log yang menyamarkan data pribadi, batas waktu
setiap permintaan (jangan sampai ada yang menggantung), dan format jawaban
error yang seragam untuk semua jenis masalah.

---

## 5. Bagaimana Aplikasi Dibangun (Alur Development)

Proyek ini tidak ditulis dalam satu malam. Alurnya diatur bertahap dari
dokumen perencanaan, mirip menyusun acara sekolah dari konsep sampai eksekusi.

### 5.1 Fase 0 — Berangkat dari Kebutuhan Nyata

Semua bermula dari **percakapan dengan pemangku kepentingan sekolah**:
apa masalahnya, siapa penggunanya, aturan 15 menit disepakati sejak awal.
Hasilnya ditulis rapi sebagai **PRD** (blueprint produk), **DESIGN_BRIEF**
(arah tampilan), dan dua panduan teknis. Fase ini menjamin kami membangun
hal yang memang dibutuhkan, bukan menebak.

### 5.2 Fase Backend — "Dapur Dibangun Duluan" (B0–B9)

Strateginya: **kerjakan dapur lebih dulu** sebagai sumber kebenaran. Fase B0–B9
secara berurutan membangun: fondasi aplikasi → struktur data (11 tabel) →
aturan inti penghitung status → sistem login & otorisasi → data akademik &
banner → sesi & QR → pemindaian anti-duplikat → riwayat & laporan → ekspor
Excel → **audit keamanan terakhir**.

Pada setiap fase, ada **checkpoint uji**: aturan 15 menit diuji sampai
millisecond-nya, pemindaian ganda diuji dengan skenario "terjadi bersamaan
sekaligus", dan tidak ada yang lolos tanpa bukti uji.

### 5.3 Fase Frontend — "Ruang Makan Dibangun" (F0–F6)

Setelah dapur stabil, barulah tampilan dibangun (React): halaman login →
kerangka utama per peran → dashboard & riwayat siswa → **pemindai QR** →
workspace guru → workspace admin → **audit kualitas menyeluruh** (kerapian
di layar HP/tablet/layar lebar, navigasi keyboard, kontras warna, dan
dipastikan tidak ada data pribadi bocor ke konsol browser).

### 5.4 Penutup — Rebrand & Persiapan Operasional

Identitas diseragamkan menjadi **SINTAS** di seluruh lapisan; development
dilengkapi HTTPS lokal (agar kamera ponsel bisa dipakai saat uji coba di
jaringan sekolah) dan perbaikan akurasi bingkai pemindai.

### 5.5 Dibantu AI dalam Dua Peran

Proyek ini dikembangkan dengan bantuan AI yang **dibagi peran**:

| Peran | Alat | Tugas |
| --- | --- | --- |
| **Pemikir** | Gemini | Menjernihkan kebutuhan, merancang struktur data, riset konsep (misal: aturan waktu UTC), menuangkan keputusan ke dokumen. Tidak menulis kode produksi. |
| **Eksekutor** | OpenCode (BigPickle — Deepseek V4.1 Flash via OpenRouter) | Menulis/memperbaiki kode, menjalankan tes dan lint, merapikan struktur agar selalu mengikuti pola dapur yang rapi. |

Disiplin utamanya: **jangan menebak kebutuhan** — bila ada keputusan
produk baru, dicatat di dokumen keputusan dulu; dan **backend selalu menjadi
satu-satunya pengambil keputusan** (waktu, status, izin).

---

## 6. Kualitas Sebelum Terbang: Ratusan Uji Otomatis

Bagian ini mungkin yang paling "sayang untuk dilewatkan" oleh dewan penguji.

Bayangkan kita punya **pasukan pemeriksa** yang bekerja setiap kali tim
mengubah kode:

- **Di dapur (backend):** 6 paket uji *unit* (menguji satu aturan kecil) +
  7 paket uji *integrasi* (menguji alur lengkap lewat HTTP), total **71
  kasus uji**. Termasuk uji "jam harus adil" (loncatan waktu ditiadakan
  dalam simulasi) dan "dua pemindaian bersamaan = satu catatan".
- **Di ruang makan (frontend):** **23 berkas uji dengan 88 kasus** —
  memastikan login, pengalihan per peran, pemindaian, formulir, dan
  kegagalan (misal server offline) ditangani dengan baik.

Semua uji dijalankan otomatis lewat alat bernama Vitest, dengan bantuan
Supertest (menguji jalur HTTP), React Testing Library (menguji tampilan),
dan MSW (menyamar sebagai server saat teste). **Hasilnya: perubahan kecil pun
 tidak bisa "diam-diam merusak" fitur lain.**

---

## 7. Menuju Dunia Nyata (Rencana Deployment)

Saat aplikasi siap dipakai oleh sekolah sungguhan, rencananya seperti ini:

```
Pengguna (Siswa/Guru/Admin)
        │
        ▼
   Cloudflare ─────────── Pintu gerbang internet: DNS, pengaman, SSL
        │
   ┌────┴────────────────────────────────┐
   ▼                                     ▼
Frontend (tampilan)                 Backend (dapur + gudang)
Di-host di Vercel                    Di VPS sendiri
app.sintas.id ◄──── API ────► api.sintas.id
                                     │
                                     ▼
                                MySQL 8 (gudang data)
```

- **Tampilan di "Vercel":** layanan khusus hosting aplikasi web — cepat,
  otomatis terbangun saat kode dipush, dan mudah dikembalikan ke versi
  sebelumnya bila ada masalah.
- **Dapur di "VPS" (server pribadi):** tempat kita memegang kendali penuh —
  versi Node.js, ukuran kapasitas, keamanan jaringan, dan sumber daya saat
  jam puluhan siswa memindai bersamaan (06.45–07.00).
- **Cloudflare sebagai pintu gerbang:** mengatur nama domain, mengamankan
  koneksi dengan enkripsi (SSL/TLS), dan menolak trafik mencurigakan sebelum
  sampai ke server.
- Aturan keamanan produksi: kunci rahasia dibuat panjang dan unik (bukan
  nilai bawaan), daftar domain diizinkan hanya milik sekolah, origin server
  dikunci hanya menerima lalu lintas dari Cloudflare, dan database memakai
  akun berizin minimal — persis prinsip "kunci tidak boleh seri".
- Sebelum diluncurkan, ada **ujian beban**: simulasi ratusan pemindaian
  dalam 15 menit untuk memastikan tidak ada antrean mengganggu.

---

## 8. Ringkasan Satu Halaman (Yang Paling Penting Untuk Diingat)

| Pertanyaan | Jawaban Singkat |
| --- | --- |
| Apa ini? | Aplikasi absensi sekolah berbasis kode QR untuk satu sekolah (Siswa/Guru/Admin). |
| Masalah apa yang dipecahkan? | Absensi kertas: lambat, rawan salah, rekap melelahkan. |
| Bagaimana cara kerjanya? | Guru buat sesi → sistem keluarkan QR → siswa pindai → status tercatat otomatis. |
| Aturan waktu? | Boleh pindai 15 menit sebelum mulai; sampai +15 menit = Hadir; lewat = Terlambat; tidak pindai = Tidak Hadir. |
| Kenapa adil? | Waktu diambil dari mesin server, bukan jam ponsel siswa. |
| Bagaimana kalau pindai dua kali? | Tetap satu catatan — sistem anti-duplikat (idempoten). |
| Apa teknologi intinya? | Backend: Node.js + Express + MySQL (melalui Prisma). Frontend: React + Vite + Tailwind. Keamanan: JWT + cookie + enkripsi Argon2id. |
| Seberapa teruji? | 71 kasus uji backend + 88 kasus uji frontend, dijalankan otomatis. |
| Siapa pemilik keputusan? | Backend sepenuhnya — waktu, status, dan izin akses tidak pernah dipercayakan ke tampilan. |

---

*Dokumen ini ditulis ulang dalam bahasa populer dari
`docs/DOKUMENTASI_PROJECT_SINTAS.md`. Seluruh istilah teknis yang disebutkan
(bahasa pemrograman, nama perpustakaan, kode status) adalah nyata dan akurat.
Pembaca teknis yang ingin detail lengkap — termasuk skema tabel, kode error,
dan rute API — silakan membuka dokumen aslinya.*