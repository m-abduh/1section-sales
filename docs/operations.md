# Operations & Deployment — 1section

> Panduan menjalankan, mengonfigurasi, dan men-deploy 1section: prasyarat, env, skrip, setup database, subdomain/DNS, storage upload, dan catatan produksi.

---

## 1. Prasyarat

- **Node.js >= 20** (lihat `engines` di root `package.json`).
- **PostgreSQL** (lokal atau terkelola).
- **Akun Paddle** (sandbox untuk dev, production untuk rilis) + akses dashboard.
- npm.

---

## 2. Instalasi

```bash
npm install            # dari root
```

Struktur: single app Next.js di root repo. Seluruh backend (Prisma, service, route handlers) berada di dalam `src/`.

---

## 3. Environment
```bash
cp .env.example .env
```

Hanya **4 var wajib**: `DATABASE_URL`, `JWT_SECRET`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`. Sisanya punya default di `src/lib/server/config/env.ts`.

### `.env`
| Var | Keterangan |
| --- | --- |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | koneksi PostgreSQL |
| `JWT_SECRET` | string acak panjang (>=16) |
| `JWT_EXPIRES_IN` | default `7d` |
| `PADDLE_ENV` | `sandbox` / `production` |
| `PADDLE_API_KEY` | API key server |
| `PADDLE_WEBHOOK_SECRET` | signing secret webhook |
| `PADDLE_TAX_CATEGORY` | default `standard` |
| `DOWNLOAD_TOKEN_TTL_HOURS` | default `72` |
| `DOWNLOAD_MAX_HITS` | default `5` |
| `DOWNLOAD_SIGNED_URL_TTL_MINUTES` | masa berlaku signed URL Cloudinary, default `10` |
| `ORDER_ACCESS_TTL_HOURS` | masa berlaku tautan akses pesanan (checkout), default `720` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | kredensial Cloudinary (PDF privat) |
| `CLOUDINARY_FOLDER` | folder aset, default `1section/bundles` |
| `RATE_LIMIT_DISABLED` | `true` hanya untuk test otomatis |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | akun seed |
| `NEXT_PUBLIC_API_URL` | kosong untuk same-origin (default); isi URL absolut bila perlu |
| `NEXT_PUBLIC_ROOT_DOMAIN` | root domain (dev `localhost:3000`, prod `1section.com`) |
| `NEXT_PUBLIC_SITE_NAME` | nama brand |
| `NEXT_PUBLIC_SITE_TAGLINE` | tagline brand |
| `NEXT_PUBLIC_USE_SUBDOMAINS` | `true` (default) / `false` = mode path `/niche/<slug>` |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox`/`production` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | token publik Paddle.js |
| `NEXT_PUBLIC_SOCIAL_HANDLE_PREFIX` | default `1section.` |

> ⚠️ **Secrets:** file `.env` di-ignore git. Dokumentasi ini sengaja tidak memuat nilai kunci.

---

## 4. Database

```bash
npm run prisma:generate     # generate Prisma Client
npm run prisma:migrate      # dev: buat/apply migration
npm run db:seed             # seed admin + niche + produk contoh + upload PDF dari pdf/ ke Cloudinary
```

Produksi:
```bash
npm run prisma:deploy       # apply migration yang sudah ada
```

Migration yang ada (urut): `init` → `add_paddle_product_id` → `product_files_bundle` → `hardening_entities` → `learning_platform_models` → `drop_niche_featured` → `access_link_email_optional`. Lihat `docs/data-model.md` §4.

---

## 5. Menjalankan

```bash
npm run dev            # next dev (port 3000)
```

Build & start:
```bash
npm run build          # next build
npm run start -w client
npm run typecheck      # tsc --noEmit
```

### Akses Dev
- Storefront: `http://localhost:3000`
- Niche: `http://finance.localhost:3000` (produksi: `https://finance.1section.com`)
- Admin: `http://admin.localhost:3000/admin` (fallback path: `http://localhost:3000/admin`)

`*.localhost` otomatis diizinkan (Next `allowedDevOrigins`, resolver subdomain proxy). Alternatif: `lvh.me`.

---

## 6. Skrip Root (ringkasan)

| Script | Fungsi |
| --- | --- |
| `npm run dev` | next dev |
| `npm run build` | next build |
| `npm run typecheck` | tsc --noEmit |
| `npm run lint` | ESLint (root) |
| `npm test` | Vitest (unit test, mis. `webhook.logic.test.ts`) |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:deploy` | Prisma |
| `npm run db:seed` | seed |


---

## 7. Subdomain & DNS (Produksi)

Agar `finance.1section.com`, `admin.1section.com`, dsb. bekerja:
1. Arahkan domain apex ke layanan web (Next).
2. Tambahkan **wildcard DNS** `*.<domain>` → layanan web (untuk semua subdomain niche).
3. Konfigurasi TLS wildcard di host/reverse proxy.
4. Set `NEXT_PUBLIC_ROOT_DOMAIN=1section.com` dan `NEXT_PUBLIC_USE_SUBDOMAINS=true`.

API bersifat **same-origin** (`/api` di host yang sama) — biarkan `NEXT_PUBLIC_API_URL` kosong. Isi `NEXT_PUBLIC_API_URL` hanya bila API dipisah ke host lain (mis. `api.1section.com`).

---

## 8. Storage Upload (PDF)

- PDF kini disimpan di **Cloudinary** sebagai aset **privat** (`type: authenticated`, `resource_type: image`), bukan lagi di filesystem publik.
- Endpoint `POST /api/admin/uploads` memverifikasi **magic bytes** `%PDF-`, ukuran (≤50 MB), lalu mengunggah ke Cloudinary dan menyimpan metadata (`storageKey`/public_id, `resourceType`, `format`, `bytes`, `checksum`) pada `ProductFile`.
- File **tidak** punya URL publik tetap. Saat pembeli mengunduh, server membuat **signed URL** berumur pendek (`DOWNLOAD_SIGNED_URL_TTL_MINUTES`) lalu mengalihkan (`302`). Kuota unduh dinaikkan secara **atomik**.
- Legacy/eksternal: `ProductFile` masih mendukung `provider = EXTERNAL/LOCAL` dengan `fileUrl` (`http(s)://` → redirect, `/uploads/...` → stream lokal). `/uploads` **tidak lagi** disajikan sebagai static publik.

**Catatan produksi:** pastikan kredensial Cloudinary diisi; tanpa itu endpoint upload mengembalikan `503 STORAGE_NOT_CONFIGURED`. Untuk migrasi file lokal lama, unggah ulang lewat admin (atau script migrasi) agar `provider` terisi.

---

## 9. Deployment (pola umum)

1. **Database:** sediakan PostgreSQL terkelola; untuk hosting serverless gunakan koneksi **pooled** (pgbouncer/Prisma Accelerate); jalankan `prisma migrate deploy`.
2. **App:** deploy satu layanan Next.js (root repo) ke hosting Next.js/Node (mis. Vercel, VPS). Set seluruh env produksi (`DATABASE_URL`, `JWT_SECRET`, Paddle, Cloudinary). Tidak perlu disk persisten untuk PDF (berada di Cloudinary).
3. **Build-time:** `NEXT_PUBLIC_*` di-*inline* saat build → set sebelum `next build`.
4. **Webhook:** daftarkan URL publik `https://<host>/api/webhooks/paddle` di Paddle, subscribe event, simpan secret.
5. **Seed admin** sekali (atau buat admin manual) dan ganti password default.
6. Verifikasi end-to-end di sandbox sebelum production.

### 9.1 Vercel

Next.js 16 didukung Vercel native dengan **zero-config** — tidak perlu file konfigurasi tambahan. Repo sudah menyiapkan `postinstall: prisma generate`.

- **Prisma:** `prisma/schema.prisma` memakai `binaryTargets = ["native", "rhel-openssl-3.0.x"]` agar engine cocok dengan runtime function Vercel (Amazon Linux, OpenSSL 3).
- **Env vars:** set di *Project → Settings → Environment Variables* (*Production*, *Preview*, *Development*). Wajib: `DATABASE_URL`, `JWT_SECRET`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `CLOUDINARY_*`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_ROOT_DOMAIN=1section.com`, `NEXT_PUBLIC_PADDLE_ENV`. `NEXT_PUBLIC_*` di-*inline* saat build → ubah butuh redeploy.
- **Migrasi:** `prisma migrate deploy` dari lokal terhadap `DATABASE_URL` produksi (sekali per rilis).
- **Seed admin:** `npm run db:seed` dari lokal ke DB produksi, lalu ganti password default.
- **Webhook:** daftarkan `https://1section.com/api/webhooks/paddle` di Paddle.
- **Rate limit in-memory** (`next-helpers.ts`) tidak persisten antar-invocation — fungsional tapi tidak akurat; pindah ke store eksternal (mis. Upstash Redis) bila butuh ketat.

#### Subdomain per niche di Vercel (wildcard)

Vercel mendukung **wildcard domain** tanpa perlu minta support:

1. Tambah `1section.com` dan `*.1section.com` di *Settings → Domains* (prefix `*`).
2. Sertifikat wildcard perlu akses DNS challenge: arahkan **nameserver domain ke Vercel**, atau (bila DNS tetap di provider lain) delegasikan `_acme-challenge` ke `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.
3. `NEXT_PUBLIC_ROOT_DOMAIN=1section.com`. `src/proxy.ts` me-rewrite `career.1section.com/` → `/niche/career`.
4. Niche baru otomatis tercakup `*.1section.com` — tanpa perubahan DNS.

Catatan: plan **Hobby** dibatasi untuk non-komersial dan 50 domain/project; untuk jualan gunakan Pro.

---

## 10. Healthcheck & Monitoring

- API: `GET /api/health` → `{ status: "ok", time }`.
- Log: stdout platform/hosting (tanpa `morgan`) — gunakan log Next.js/hosting untuk melihat error & request.
- Perhatikan tabel `webhook_events`: `status = FAILED` (retry) atau `attempts` naik → ada masalah fulfillment. `status = RECEIVED` lama → proses menggantung.
- Jalankan **reconciliation** berkala: `POST /api/admin/orders/reconcile` (admin) untuk menerbitkan entitlement yang bolong pada order `PAID`.
- Pantau `orders` status `PENDING` yang menggantung (indikasi webhook bermasalah).
- `AuditLog` mencatat aksi admin penting.

---

## 11. Checklist Rilis

- [ ] `JWT_SECRET` kuat & unik produksi.
- [ ] API key/token/webhook secret Paddle **production** (bukan sandbox) — **rotate** bila pernah terpapar.
- [ ] Kredensial Cloudinary diisi (`CLOUDINARY_*`).
- [ ] `NEXT_PUBLIC_USE_SUBDOMAINS=true` + TLS. Di Vercel: tambah `*.domain` (wildcard) + nameserver/delegasi `_acme-challenge`.
- [ ] `NEXT_PUBLIC_ROOT_DOMAIN` benar (tanpa protokol, mis. `1section.com`).
- [ ] Migration ter-apply (`prisma migrate deploy`).
- [ ] Password admin default diganti (kebijakan min 8 char + huruf + angka).
- [ ] Webhook terdaftar & terverifikasi.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` lulus.
- [ ] Uji checkout sandbox → production dengan transaksi kecil.
