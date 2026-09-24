# Panduan Development & Akses via LAN

Panduan ini menjelaskan cara menjalankan SINTAS di mesin lokal dan mengaksesnya dari alamat LAN (mis. `http://172.29.224.1:5173/` atau `https://172.29.224.1:5173/` untuk kamera), termasuk konfigurasi CORS, cookie, dan troubleshooting.

## 1. Arsitektur dev

Dua server terpisah yang harus jalan bersamaan:

| Proses | Perintah | Default |
| --- | --- | --- |
| Backend (Express) | `npm run dev` di `backend/` | `http://localhost:3000` (`/api/v1`) |
| Frontend (Vite) | `npm run dev` di `frontend/` | `https://localhost:5173` (HTTPS + self-signed cert) |

Frontend memanggil API memakai `VITE_API_BASE_URL`. Di mode development, `frontend/.env.development` mengatur `VITE_API_BASE_URL=/api/v1` sehingga request API lewat **Vite proxy** ke `http://localhost:3000`. Ini membuat frontend dan API **same-origin** (aman untuk cookie `SameSite=Lax` dan CORS), serta memungkinkan HTTPS untuk akses kamera (`navigator.mediaDevices` butuh secure context). Auth memakai **cookie HttpOnly** (`auth_token`) + cookie `csrf_token`, bukan token di localStorage.

## 2. Perubahan yang sudah disiapkan untuk LAN

1. **Backend** `backend/.env`:
   ```
   CORS_ORIGIN=http://localhost:5173,http://192.168.1.8:5173,https://localhost:5173,https://192.168.1.8:5173
   ```
   `CORS_ORIGIN` menerima **daftar dipisah koma**. Daftar ini dipakai dua middleware di `backend/src/app.js`:
   - `cors()` — mengizinkan origin + `credentials: true`.
   - `csrfProtection()` — menolak request non-GET dari origin yang tidak ada di daftar (`403 CSRF_ORIGIN_REJECTED`).

2. **Frontend** `frontend/vite.config.js`:
   ```js
   server: {
     host: true,
     proxy: {
       '/api': { target: 'http://localhost:3000', changeOrigin: true }
     }
   }
   plugins: [react(), tailwindcss(), basicSsl()]
   ```
   - `host: true` → bind ke semua interface (akses via IP LAN).
   - `basicSsl()` → sertifikat self-signed otomatis (HTTPS).
   - `proxy: /api` → request `/api/v1/...` diteruskan ke backend `http://localhost:3000/api/v1/...` (same-origin).

3. **Frontend** `frontend/.env.development`:
   ```
   VITE_API_BASE_URL=/api/v1
   ```
   Hanya dimuat di mode development (`vite dev`), **bukan** saat test (`vitest`) atau build. Memastikan axios memakai path relatif `/api/v1` yang lewat proxy Vite.

> Setelah mengubah `.env`, `.env.development`, atau `vite.config.js`, **restart** proses yang bersangkutan. Perubahan `.env` tidak dibaca ulang otomatis.

## 3. Cara mengakses via HTTPS (diperlukan untuk kamera)

1. Pastikan kedua server jalan (`backend` dan `frontend`).
2. Pastikan `CORS_ORIGIN` di `backend/.env` sudah memuat origin HTTPS frontend persis (skema + host + port, tanpa trailing slash).
3. Buka `https://<IP-LAN>:5173/` (mis. `https://192.168.1.8:5173/`) di browser.
4. Browser akan menampilkan peringatan sertifikat self-signed → klik **Advanced → Proceed** (atau "Lanjutkan"). Hanya sekali per browser.
5. Prompt izin kamera akan muncul → **Izinkan**.
6. Jika diakses dari perangkat lain (HP), lihat bagian 5.

> `localhost` via HTTPS juga berfungsi: `https://localhost:5173/` (tidak perlu proxy untuk akses localhost, tapi proxy tetap aktif).

## 4. Menambah origin/IP lain

1. Cari IP mesin (Windows): `ipconfig` → lihat `IPv4 Address` adapter yang dipakai (mis. Wi-Fi).
2. Tambahkan origin **HTTP dan HTTPS** ke daftar (jangan hapus yang lama):
   ```
   CORS_ORIGIN=http://localhost:5173,http://192.168.1.8:5173,https://localhost:5173,https://192.168.1.8:5173,https://192.168.1.10:5173
   ```
3. Restart backend.

Jika memakai port Vite selain 5173 (Vite otomatis pindah bila port terpakai), origin di `CORS_ORIGIN` harus mengikuti port yang benar-benar dipakai (HTTP & HTTPS).

## 5. Mengakses dari perangkat lain (HP/LAN) — HTTPS + Proxy

Dengan proxy Vite, **frontend dan API same-origin** (mis. `https://192.168.1.8:5173`). Ini menghilangkan masalah `SameSite=Lax` dan CORS.

Langkah:
1. IP mesin server: `ipconfig` (mis. `192.168.1.8`).
2. Pastikan `CORS_ORIGIN` di backend memuat `https://192.168.1.8:5173`.
3. Di HP, buka `https://192.168.1.8:5173/` → terima sertifikat self-signed.
4. Login & scan absensi: cookie `auth_token` & `csrf_token` ikut terkirim (same-origin, `SameSite=Lax` OK).

Tidak perlu set `VITE_API_BASE_URL` di `.env` — sudah di-handle `frontend/.env.development` dan proxy Vite.

> **Catatan firewall**: Windows Firewall mungkin memblokir port 5173 & 3000 dari jaringan lain. Izinkan `node.exe` (Private network) atau buka port 3000, 5173 inbound.

## 6. Verifikasi cepat

Checklist:

1. `curl -k -i https://192.168.1.8:5173/api/v1/banners` mengembalikan JSON (proxy Vite → backend terjangkau dari LAN).
2. Buka `https://192.168.1.8:5173/`, lakukan login. Tidak ada error CORS di console browser.
3. Di DevTools → Network, response login berisi `Set-Cookie: auth_token=...; HttpOnly; SameSite=Lax` (tanpa `Secure` di dev, OK).
4. Lakukan aksi non-GET (login, scan, simpan). Jika muncul `403 CSRF_ORIGIN_REJECTED`, origin HTTPS belum terdaftar di `CORS_ORIGIN`.
5. Buka halaman scan siswa → prompt izin kamera muncul → izinkan → kamera nyala.

Cek CORS/CSRF dari terminal (simulasi preflight ke Vite):

```bash
curl -k -i -X OPTIONS https://192.168.1.8:5173/api/v1/auth/login \
  -H "Origin: https://192.168.1.8:5173" \
  -H "Access-Control-Request-Method: POST"
```

Response harus memuat `Access-Control-Allow-Origin: https://192.168.1.8:5173` dan `Access-Control-Allow-Credentials: true` (dari proxy + backend).

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Halaman tidak terbuka di IP LAN | Vite hanya bind `localhost` | Pastikan `server.host: true` dan restart `npm run dev` |
| Browser "Tidak aman" / sertifikat error | Self-signed cert `basicSsl` | Klik **Advanced → Proceed** (Chrome/Edge/Firefox). HP: "Continue anyway". |
| Prompt kamera **tidak muncul**, pesan "Kamera tidak tersedia" | Akses via HTTP (bukan HTTPS) | Harus pakai `https://...` (Vite + `basicSsl()`). `navigator.mediaDevices` butuh secure context. |
| `CORS ... blocked` di console | Origin tidak ada di `CORS_ORIGIN` | Tambahkan origin HTTPS persis, restart backend |
| `403 CSRF_ORIGIN_REJECTED` | Origin tidak ada di daftar yang sama | Sama seperti di atas (`csrfProtection` memakai daftar yang sama) |
| Login "berhasil" tapi langsung logout/401 | Cookie tidak terkirim (host frontend ≠ host API) | Gunakan HTTPS + proxy (frontend & API same-origin). Jangan campur HTTP/HTTPS. |
| HP tidak bisa membuka `https://IP:5173` | Windows Firewall memblokir | Izinkan `node.exe` (Private network) atau port 3000 & 5173 inbound. |
| Perubahan `.env`/`.env.development` tidak berefek | Proses belum di-restart | Restart backend/frontend. |
| `npm run test` gagal / API 404 di test | `VITE_API_BASE_URL` relatif `/api/v1` terekspose ke vitest | `.env.development` **hanya** untuk mode dev. Test pakai default `http://localhost:3000/api/v1`. Jangan commit `.env.development` jika ingin beda. |

Catatan IP: `192.168.x.x` / `172.29.x.x` / `10.x.x.x` adalah alamat LAN. `172.29.x.x` sering merupakan alamat virtual adapter (WSL/Hyper-V). Jika IP berubah-ubah, set ulang `CORS_ORIGIN` atau pakai IP LAN fisik dari `ipconfig`.

## 8. Catatan keamanan

- Jangan longgarkan `CORS_ORIGIN` di produksi. Validasi di `backend/src/config/env.js` menolak `CORS_ORIGIN` berisi `localhost` saat `NODE_ENV=production`, dan menolak `JWT_SECRET` default.
- Jangan set `CORS_ORIGIN=*`. Implementasi saat ini memakai pencocokan daftar (`allowedOrigins.includes(origin)`) dan `credentials: true`; wildcard tidak didukung dan berbahaya untuk cookie-based auth.
- Alamat LAN di panduan ini hanya untuk dev. Hapus entri IP dari `CORS_ORIGIN` sebelum deploy.
