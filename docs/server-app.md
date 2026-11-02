# Server Application — 1section

> Backend berjalan sebagai **Next.js Route Handlers** di root repo (`src/app/api/*`). Tidak ada service Express terpisah dan tidak ada workspace. Stack: Next.js 16 + TypeScript + Prisma + Paddle SDK.

---

## 1. Entry Point & Bootstrap

### Next.js App Router
- Entry: `src/app/layout.tsx` (root layout) + `src/proxy.ts` (middleware/subdomain routing).
- API: `src/app/api/**/route.ts` (route handlers, Node runtime).
- Bootstrap DB: Prisma Client di `src/lib/server/lib/prisma.ts` (singleton).
- Graceful shutdown: ditangani platform (Vercel/Node).

### Middleware (`src/proxy.ts`)
- Subdomain routing: niche subdomain `/` → rewrite ke `/niche/<slug>`; root `/niche/<slug>` & `/resources/<slug>` → 308 ke subdomain.
- Admin subdomain (`admin.*`): path bersih di-rewrite ke `/admin/*` (mis. `/products` → `/admin/products`); `/admin/*` lama di-redirect 308 ke path bersih.

### Lapisan kode
Route handler (`route.ts`) → service (`*.service.ts`) → Prisma. Validasi via zod di route handler. Auth/rate-limit helper di `src/lib/server/next-helpers.ts`.

---
## 2. Konfigurasi Env (`src/lib/server/config/env.ts`)

Validasi zod, gagal cepat saat boot. Export `env`, `isProduction`, `cloudinaryConfig`, `hasCloudinary`.

| Var | Aturan | Default |
| --- | --- | --- |
| `NODE_ENV` | enum dev/test/prod | `development` |
| `DATABASE_URL` | wajib | — |
| `JWT_SECRET` | min 16 | — |
| `JWT_EXPIRES_IN` | string | `7d` |
| `PADDLE_ENV` | sandbox/production | `sandbox` |
| `PADDLE_API_KEY` | wajib | — |
| `PADDLE_WEBHOOK_SECRET` | wajib | — |
| `PADDLE_TAX_CATEGORY` | string | `standard` |
| `DOWNLOAD_TOKEN_TTL_HOURS` | int > 0 | `72` |
| `DOWNLOAD_MAX_HITS` | int > 0 | `5` |
| `DOWNLOAD_SIGNED_URL_TTL_MINUTES` | int > 0 | `10` |
| `ORDER_ACCESS_TTL_HOURS` | int > 0 | `720` |
| `CLOUDINARY_CLOUD_NAME` | string (opsional) | — |
| `CLOUDINARY_API_KEY` | string (opsional) | — |
| `CLOUDINARY_API_SECRET` | string (opsional) | — |
| `CLOUDINARY_FOLDER` | string | `1section/bundles` |
| `RATE_LIMIT_DISABLED` | bool (opsional) | `false` |

(Seed memakai `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — dibaca langsung di `seed.ts`.)

---

## 3. Lapisan Helper (`src/lib/server/next-helpers.ts`)

### Auth — `getAdmin` / `requireAdminSync`
- `getAdmin(req)`: ambil `Authorization: Bearer <token>`; `verifyAuthToken` lalu **re-validasi ke DB** (`isActive` + `tokenVersion` cocok) → `AdminCtx | null`.
- `requireAdminSync(admin, roles?)`: `null` → `401 UNAUTHORIZED`; `roles` tidak cocok → `403 FORBIDDEN`. Role admin default `"admin"` (lowercase).

### Validasi — `parseJson` / `parseQuery` / `parseParams`
- `parseJson(req, schema)`: `req.json()` (fallback `{}`) lalu `schema.parse` (throw `ZodError`).
- `parseQuery(req, schema)`: kumpulkan `searchParams` → objek string → `schema.parse`.
- `parseParams(params, schema)`: parse `params` route dinamis (mis. `{ id }`) dengan schema.

### Respons — `ok` / `fail`
- `ok(data, status=200)` → `{ success:true, data }`.
- `fail(err)`: `ApiError` → status + `{ code, message }`; `ZodError` → `400 VALIDATION_ERROR` + `issues`; lainnya → `500 INTERNAL_ERROR` (detail di-log via `console.error`).

### Rate limit — `rateLimit` / `clientIp`
- `rateLimit(key, limit, windowMs)`: limiter in-memory per-instance (Map bucket); `false` bila kuota lewat.
- `clientIp(req)`: ambil IP dari `x-forwarded-for` / `x-real-ip`.

---

## 4. Library (`src/lib/`)

| File | Isi |
| --- | --- |
| `prisma.ts` | Singleton `PrismaClient` (disimpan di `globalThis` saat non-prod); log `warn,error` dev / `error` prod. |
| `jwt.ts` | `signAuthToken({ sub, email, role, tokenVersion })`, `verifyAuthToken` (throw `401` bila invalid/expired). |
| `paddle.ts` | Instance `Paddle(env.PADDLE_API_KEY, { environment })` + `paddleWebhookSecret`. |
| `cloudinary.ts` | Klien Cloudinary (lazy), `isCloudinaryConfigured`, `uploadPrivatePdf(buffer, name)`, `signedDownloadUrl(publicId, opts)`. |
| `audit.ts` | `recordAudit({ actorId, action, entity, entityId, metadata? })` → tulis `AuditLog` (best-effort). |

---

## 5. Util (`src/utils/`)

| File | Fungsi |
| --- | --- |
| `api-error.ts` | Kelas `ApiError` (statusCode, code, details) + factory `badRequest/unauthorized/forbidden/notFound/conflict`. |
| `ids.ts` | `generateOrderNumber()` → `ORD-YYYYMMDD-NNNNNN`; `generateSecureToken(bytes=24)` → hex acak. |
| `slug.ts` | `slugify()` (lowercase, NFKD, buang diakritik, non-alnum → `-`, rapikan `-`). |

---

## 6. Routing Utama (`src/app/api/**/route.ts`)

```
src/app/api/
├── health/route.ts
├── auth/{login,logout,me}/route.ts
├── niches/route.ts, niches/[slug]/route.ts
├── products/route.ts, products/[slug]/route.ts
├── checkout/route.ts
├── orders/[orderNumber]/status/route.ts
├── downloads/[token]/route.ts
├── webhooks/paddle/route.ts
└── admin/
    ├── niches/{route.ts,[id]/route.ts} 🔒
    ├── products/{route.ts,[id]/route.ts,[id]/paddle*/route.ts} 🔒
    ├── orders/{route.ts,[id]/route.ts,reconcile/route.ts} 🔒
    ├── uploads/route.ts 🔒
    ├── assets/route.ts 🔒
    └── stats/route.ts 🔒
```

Semua endpoint admin dilindungi `getAdmin` + `requireAdminSync(admin, ["admin"])`. Rate limit diterapkan pada login, checkout, status order, dan download.

---

## 7. Modul (pola route handler → service → schema)

### 7.1 `auth`
- **routes:** `POST /login` (validate body, rate-limited), `GET /me` (admin), `POST /logout` (admin).
- **service:** `login` (cari user by email lowercase, cek `isActive`, `bcrypt.compare`, sign JWT dengan `tokenVersion`), `getProfile`, `hashPassword`, `logout` (naikkan `tokenVersion` → cabut semua token).
- **helper:** `getAdmin` memverifikasi JWT lalu **re-validasi ke DB** (user aktif + `tokenVersion` cocok); `requireAdminSync` untuk otorisasi peran (default role `"admin"`).
- **schema:** `loginSchema` (email, password min 8 + huruf + angka).

### 7.2 `niches`
- **routes public:** `GET /`, `GET /:slug`. **admin:** list/create/patch/delete (semua `getAdmin`).
- **service:** `listPublicNiches` (active, hitung produk aktif), `listAdminNiches`, `getNicheBySlug(slug, onlyActive=true)` + produk+files, `createNiche` (slug auto via `slugify`, cek unik), `updateNiche` (partial, termasuk `audience`/`problems`), `deleteNiche`.
- **schema:** create/update (regex slug, hex accent, dsb.), param slug/id.

### 7.3 `products`
- **routes public:** `GET /?niche=`, `GET /:slug`. **admin:** list/create/patch/delete + `paddle-sync`, `paddle` (get), `paddle-archive`.
- **service:** `listPublicProducts(nicheSlug?)`, `listAdminProducts` (+`_count.orderItems`), `getPublicProductBySlug`, CRUD. `createProduct`/`updateProduct` menyusun `features`, `learnings`, & `files`; update `files` = replace-all. Field naratif baru (`audience`, `notFor`, `outcome`, `limitations`, `license`, `sampleUrl`, `level`) ikut divalidasi zod.
- **response publik** memakai `publicProductSelect` → **tidak** mengekspos `paddleProductId`/`paddlePriceId`/`storageKey`/`fileUrl` (file hanya `{ id, name, sortOrder, format }`).
- **route handler:** setelah create/update → `syncProductToPaddle` (best-effort, warning bila gagal), refresh & kirim produk; aksi tulis mencatat `AuditLog`.
- **schema:** validasi lengkap (lihat `api-spec.md` §5).

### 7.4 `paddle` (catalog)
`paddle-catalog.service.ts`:
- `syncProductToPaddle(id)`: upsert product + price ke Paddle; simpan `paddleProductId`, `paddlePriceId`, `paddleSyncedAt`; bila update gagal → create baru & archive price lama.
- `getPaddleState(id)`: ambil product & price remote + status linked.
- `archiveProductInPaddle(id)`: archive price & product + set `active=false`.
- Detail di `docs/paddle-integration.md`.

### 7.5 `checkout`
- **routes:** `POST /` (validate body, rate-limited).
- **service:** `createCheckout` — buat Order PENDING + OrderItem (`lineTotal`, `productTitle`) + `Payment` PENDING, panggil `paddle.transactions.create`, simpan `paddleTransactionId`, buat `AccessLink` (`accessToken`), kembalikan `checkoutUrl`; gagal → order `FAILED` + `PADDLE_ERROR`.
- **schema:** `{ productId, email? }`.

### 7.6 `orders`
- **routes public:** `GET /:orderNumber/status` (param bisa `ORD-...` atau Paddle `txn_...`; bukti akses `access=` atau `email=`, rate-limited). **admin:** `GET /`, `GET /:id`, `POST /reconcile`.
- **service:** `getOrderStatus` (access-aware: tanpa bukti valid → `authorized:false`, `downloads:[]`; dengan bukti & `PAID` → self-heal `fulfillOrder`; tiap item menyertakan `hasFiles`), `createOrderAccessLink` (buat `AccessLink` TTL `ORDER_ACCESS_TTL_HOURS`; dipakai checkout), `listAdminOrders` (filter status/search, paginate), `getAdminOrder`, `reconcilePaidOrders`.
- **schema:** param orderNumber/id, query access/email, filter list (page/pageSize/status/search).

### 7.7 `downloads`
- **routes:** `GET /:token` (rate-limited).
- **service:** `fulfillOrder(orderId)` (idempotent: buat `Entitlement` per `(orderItem, file)` + `DownloadToken`), `resolveDownload(token)` (cek token/entitlement ACTIVE/expired/kuota, increment **atomik**), resolver sumber file (Cloudinary signed URL / eksternal redirect / lokal stream).
- **route handler:** `NextResponse.redirect` 302 (Cloudinary/eksternal) atau `Response` body stream (lokal) dengan header `Content-Disposition`.

### 7.8 `webhooks`
- **routes:** `POST /paddle` (raw body + `Paddle-Signature`) → `paddle.webhooks.unmarshal`.
- **service:** `beginEvent` (idempotensi: `eventId` unique + status `RECEIVED`; `PROCESSED`→skip, `FAILED`→retry), `processEvent` (transaksi DB; `transaction.completed` → validasi payload + order `PAID` + `Payment COMPLETED` + `fulfillOrder`; failed/canceled; `adjustment.*` refund/chargeback), `markProcessed`/`markFailed`, `reconcilePaidOrders`. Logika murni divalidasi unit test di `webhook.logic.ts`/`webhook.logic.test.ts`.
- Lihat `docs/paddle-integration.md` §webhook.

### 7.9 `uploads`
- **routes:** `POST /` (admin) → `req.formData()`, cek `File` tipe `application/pdf`, batas 50 MB, **validasi magic bytes `%PDF-`**.
- **service:** `uploadPrivatePdf` ke Cloudinary (`type=authenticated`) → metadata `{ provider, storageKey, resourceType, format, bytes, checksum }`; **upsert `AssetFile`** (by `storageKey`) dan respons menyertakan `assetFileId`; `503 STORAGE_NOT_CONFIGURED` bila Cloudinary belum diatur; aksi dicatat di `AuditLog`.

### 7.9a `assets`
- **routes:** `GET /` (list + `_count.productFiles`), `POST /` (upsert manual by `storageKey`).
- **service:** `listAssetFiles`, `upsertAssetFile` (update metadata + naikkan `version`).

### 7.10 `stats`
- **routes:** `GET /` (admin) → `getDashboardStats` (counts + SUM revenue + 5 order terbaru).

---

## 8. Tipe

Admin auth via `getAdmin(request)` / `requireAdminSync(admin)` di `src/lib/server/next-helpers.ts` (JWT dari `Authorization` header).

---

## 9. Alur Eksekusi Penting

### 9.1 Membuat Produk (admin)
```
POST /api/admin/products
 → parseJson(createProductSchema)
 → product route handler
    → product.service.createProduct  (assertNiche, slug, files)
    → syncProductToPaddle (best-effort)
    → getProductById → 201
```

### 9.2 Checkout
```
POST /api/checkout
 → parseJson(createCheckoutSchema)
 → checkout.service.createCheckout
    → find product (tolak non-aktif / tanpa priceId)
    → create Order(PENDING)+OrderItem
     → paddle.transactions.create(customData)
     → update Order.paddleTransactionId
     → createOrderAccessLink (accessToken)
  → 201 { orderNumber, transactionId, checkoutUrl, accessToken }
```

### 9.3 Webhook → fulfillment
```
POST /api/webhooks/paddle
 → verify signature
 → beginEvent (idempotensi, status RECEIVED)
 → processEvent('transaction.completed')
    → validasi payload vs order
     → order PAID + Payment COMPLETED + fulfillOrder (Entitlement + DownloadToken per item)
  → markProcessed → 200
   (gagal: markFailed + 500 → Paddle retry)
```

---

## 10. Menjalankan & Skrip

| Script | Perintah |
| --- | --- |
| dev | `next dev` |
| build | `next build` |
| start | `next start` |
| typecheck | `tsc --noEmit` |
| lint | `eslint .` (root) |
| prisma | `prisma generate/migrate dev/migrate deploy/studio` |
| seed | `tsx prisma/seed.ts` |
| reconcile | `POST /api/admin/orders/reconcile` (admin) |

Semua skrip dijalankan dari root (tidak ada workspace/delegasi ke `client`).

---

## 11. Catatan Teknis

- PDF disimpan di **Cloudinary** (privat) dan diakses via signed URL berumur pendek — lihat `docs/operations.md` §8.
- Webhook membaca raw body via `await req.text()` (bukan `req.json()`) agar verifikasi `Paddle-Signature` valid.
- Test (Vitest) ada di `src/**/*.test.ts` (mis. `webhook.logic.test.ts`), dijalankan lewat `npm test`.
- `tsconfig`: Next.js (`module: esnext`, `moduleResolution: bundler`, `noEmit: true`, `strict`), alias `@/*` → `./src/*`.
