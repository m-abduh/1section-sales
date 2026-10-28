# Client Application — 1section

> Dokumentasi detail app: framework, struktur folder, routing, halaman, komponen, hooks, lib, state management, dan rendering strategy.

---

## 1. Stack & Konfigurasi

| Item | Nilai |
| --- | --- |
| Framework | Next.js **16** (App Router, Turbopack) |
| React | 19 |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS **v4** via `@tailwindcss/postcss` |
| Data client | TanStack React Query **v5** |
| HTTP | Axios 1.20 |
| Form | react-hook-form + `@hookform/resolvers` + zod |
| Payment UI | Paddle.js v2 (`cdn.paddle.com/paddle/v2/paddle.js`) |
| Path alias | `@/*` → `./src/*` |

### `next.config.ts`
- `reactStrictMode: true`.
- `allowedDevOrigins`: `1section.com`, `*.1section.com`, `*.localhost`, `lvh.me`, `*.lvh.me`.
- `images.remotePatterns`: `**.1section.com`, `**.paddle.com`, `**.paddleusercontent.com`, `res.cloudinary.com`.

### Environment (`NEXT_PUBLIC_*`)
| Var | Default | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | *(kosong)* | Base URL API; kosong = same-origin (`/api`) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `1section.com` | Root domain; dev pakai `localhost:3000` (`finance.localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | `1section` | Nama brand |
| `NEXT_PUBLIC_USE_SUBDOMAINS` | `true` | `false` = pakai path `/niche/<slug>` (fallback) |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` | Environment Paddle.js |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | — | Token publik Paddle.js |

---

## 2. Struktur Folder `src`

```
src/
├── app/
│   ├── layout.tsx              # root layout: metadata (brand 1section), themeScript, Providers
│   ├── page.tsx                # homepage discovery (RSC, ISR 60s): masalah, paths, resources
│   ├── globals.css             # tokens & helper (lihat design-system.md)
│   ├── providers.tsx           # Theme → QueryClient → Auth
│   ├── niche/[slug]/page.tsx   # halaman area/niche + daftar bundle (RSC, ISR 30s)
│   ├── resources/[slug]/page.tsx # detail resource/produk (RSC, ISR 30s)
│   ├── about/page.tsx          # editorial (statis)
│   ├── faq/page.tsx            # FAQ (statis)
│   ├── privacy|terms|refund|support/page.tsx # halaman legal (statis)
│   ├── checkout/success/page.tsx
│   └── admin/
│       ├── layout.tsx          # AuthGuard
│       ├── page.tsx            # dashboard
│       ├── login/page.tsx
│       ├── niches/page.tsx
│       ├── products/page.tsx
│       └── orders/page.tsx
├── components/
│   ├── ui/                     # button, input, badge, spinner
│   ├── site/                   # site-header, site-footer, niche-section, bundle-card, buy-button, legal-layout
│   ├── admin/                  # admin-shell, auth-guard, modal, niche-form, product-form, stat-card
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── hooks/
│   ├── use-auth.tsx            # AuthContext (login/logout/me)
│   ├── use-admin-niches.ts
│   ├── use-admin-products.ts
│   ├── use-admin-orders.ts
│   └── use-checkout.ts
├── lib/
│   ├── api.ts                  # axios instance + interceptor + getApiErrorMessage
│   ├── auth.ts                 # token localStorage
│   ├── format.ts               # formatCurrency/formatDate/formatRelative
│   ├── paddle.ts               # loader Paddle.js
│   ├── server-api.ts           # fetch RSC (getNiches/getNiche/getProduct/getProducts)
│   ├── site.ts                 # SITE_NAME (1section), SITE_TAGLINE, ROOT_DOMAIN, nicheUrl, useSubdomains, isLocalRoot, apiUrl
│   └── types.ts                # semua tipe domain
└── proxy.ts                    # middleware routing subdomain
```

---

## 3. Rendering & Data Strategy

| Halaman | Tipe | Data |
| --- | --- | --- |
| `/` | RSC | `getNiches()` (`revalidate=60`) — penjelasan 1section + perkenalan niche |
| `/niche/[slug]` | RSC + `generateMetadata` | `getNiche(slug)` + `getNiches()` (`revalidate=30`), 404 via `notFound()` |
| `/resources/[slug]` | RSC + `generateMetadata` | `getProduct(slug)` + `getNiches()` (`revalidate=30`) |
| `/about`, `/faq`, `/privacy`, `/terms`, `/refund`, `/support` | RSC statis | `getNiches()` untuk header/footer (`revalidate=3600`) |
| `/checkout/success` | Client | React Query poll `/orders/:orderNumber/status` (interval 3s selama PENDING) |
| `/admin/*` | Client | React Query ke `/admin/*` |
| Admin login | Client | `useAuth().login` |

- **ISR server fetch** (`lib/server-api.ts`): `apiGet<T>` memakai `fetch(..., { next: { revalidate } })`, mengembalikan `null` saat error (halaman menangani empty state).
- **React Query defaults** (`providers.tsx`): `staleTime 30s`, `retry 1`, `refetchOnWindowFocus false`.

---

## 4. Routing & Layout

- **Root layout** menyuntikkan `themeScript` (anti-flash dark) di `<head>` dan membungkus `Providers`.
- **Metadata:** title template `%s | 1section`, `metadataBase https://1section.com`.
- **Subdomain routing** via `proxy.ts` (lihat `docs/architecture.md` §5).
- **Admin layout** dibungkus `AuthGuard`, yang merender `AdminShell` (sidebar + header) bila login.

---

## 5. Halaman (detail)

### 5.1 Landing Utama (`app/page.tsx`)
- Ambil semua niche aktif (tanpa filter).
- Hero (2 kolom): badge "PRACTICAL LEARNING · ONE-TIME PURCHASE", H1 "You know the problem. Here's the plan.", sub "Focused, practical bundles for the problems you need to solve — one-time purchase, no fluff.", 1 CTA (`#niches`); kolom kanan peta area (grid 2×2: dot warna + nama + tagline tiap area, klik ke subdomain). Background monokrom (grid + spotlight).
- Section `#niches`: satu `NicheSection` per niche (bergantian kiri/kanan) — landing page root berfokus **menjelaskan tiap niche** (tagline, deskripsi, audience, daftar masalah) + sebaris CTA "Explore N bundles" + chip sosial (ikon + `@1section.<slug>`) ke subdomain niche.
- Empty state bila belum ada niche.

### 5.2 Halaman Area / Niche — landing subdomain (`app/niche/[slug]/page.tsx`)
- `generateMetadata` dari niche.
- Hero dua kolom (aksen warna `accentColor`): eyebrow "1section · <Nama>", ikon huruf, tagline besar, deskripsi, kartu **audience** ("Who this is for"), CTA "Browse the bundles" + chip sosial (`SocialLinks`), dan panel "In this area" (pratinjau bundle: nama, level, harga) yang link ke `/resources/[slug]`.
- Section **bundles** (`#bundles`): daftar `BundleCard[]` ditumpuk **vertikal full-width** (satu kartu per baris, bukan grid 2 kolom), dengan isi kartu terbagi **3 bagian horizontal** di desktop: visual/cover mengisi tinggi penuh kartu (kiri), informasi utama + learnings (tengah), dan panel harga + CTA (kanan). Di layar kecil ketiganya menumpuk vertikal.
- Section "What these bundles help with": daftar **masalah** (`problems`).
- Section trust (3 kolom): One-time payment, Secured by Paddle, Instant access.
- `notFound()` bila niche tidak ada.

### 5.2a Halaman Resource (`app/resources/[slug]/page.tsx`)
- `generateMetadata` dari produk.
- Breadcrumb (Home / niche / nama), badge level, judul, summary.
- Blok "What you walk away with" (outcome), "What you will learn" (learnings), Overview, "What is included" (features), audience/not-for, limitations.
- Sidebar sticky: harga (+ compare-at), `BuyButton`, tautan sample, daftar file, license.
- `notFound()` bila produk tidak ada.

### 5.2c Halaman Editorial & Legal
- `/about` (prinsip & editorial), `/faq` (accordion), `/privacy`, `/terms`, `/refund`, `/support` (statis, memakai `LegalLayout`).

### 5.3 Checkout Success (`app/checkout/success/page.tsx`)
- Client component, dibungkus `<Suspense>`.
- Sumber referensi pesanan: query `?order=` **atau** `?_ptxn=`/`?txn=` (Paddle transaction ID) → `localStorage` (`section_last_order`) → input manual (`txn_...` atau `ORD-...`).
- **Bukti akses:** `?access=<token>` (dari `successUrl` checkout) disimpan ke state; token ini membuat halaman langsung terotorisasi setelah bayar — **tanpa form verify**.
- Poll `GET /orders/:orderNumber/status` (dengan `access`/`email`); saat `authorized && PAID` tampilkan link unduh (label + sisa kuota) ke `${apiUrl()}${download.url}`.
- State: loading spinner, error box, "Waiting for payment confirmation", kartu status akses.
- `StatusBadge` mendukung `PARTIALLY_REFUNDED`.

### 5.4 Admin Login (`app/admin/login/page.tsx`)
- Form zod (email, password), `useAuth().login`, redirect ke `/admin`, tampilkan error server.

### 5.5 Admin Dashboard (`app/admin/page.tsx`)
- `useAdminStats()` → 4 `StatCard` (Revenue, Paid orders, Total orders, Catalog niches/products) + tabel 5 order terbaru.
- Tombol "New product" & "Manage niches".

### 5.6 Admin Niches (`app/admin/niches/page.tsx`)
- Tabel niche; modal create/edit (`NicheForm`); delete dengan `window.confirm` (cascade warning).

### 5.7 Admin Products (`app/admin/products/page.tsx`)
- Tabel produk (status Paddle: linked/not linked + `synced ...`).
- Aksi: **Sync to Paddle** (bila belum linked) / **Archive** (bila linked), Edit, Delete.
- Modal lebar (`wide`) berisi `ProductForm`.
- Pesan sukses/error inline.

### 5.8 Admin Orders (`app/admin/orders/page.tsx`)
- Filter status, pencarian orderNumber/email (submit form), pagination (Prev/Next).
- Modal detail: status, total, email, paidAt, daftar item.

---

## 6. Komponen

### `components/ui/*` — primitives
Lihat `docs/design-system.md` §5 (Button, Input/Textarea/Field, Spinner, StatusBadge/Badge).

### `components/site/*`
Lihat `docs/design-system.md` §6 (SiteHeader, SiteFooter, NicheSection, BundleCard, BuyButton, LegalLayout).

### `components/admin/*`
Lihat `docs/design-system.md` §7 (AdminShell, AuthGuard, Modal, NicheForm, ProductForm, StatCard).

### `components/theme-*`
Lihat `docs/design-system.md` §3 (ThemeProvider + themeScript + ThemeToggle).

---

## 7. Hooks (React Query + Context)

| Hook | Endpoint / Fungsi | Catatan |
| --- | --- | --- |
| `useAuth()` | context | `{ user, isLoading, login, logout }`; `/auth/me` saat ada token; interceptor 401 memaksa logout |
| `useAdminNiches()` | `GET /admin/niches` | query key `["admin","niches"]` |
| `useCreateNiche/useUpdateNiche/useDeleteNiche` | POST/PATCH/DELETE | invalidate `["admin","niches"]` |
| `useAdminProducts()` | `GET /admin/products` | key `["admin","products"]` |
| `useCreateProduct/useUpdateProduct/useDeleteProduct` | CRUD | invalidate products |
| `useUploadPdf()` | `POST /admin/uploads` | multipart `FormData` (field `file`) → metadata storage Cloudinary + `assetFileId` |
| `useSyncProductPaddle()` | `POST /admin/products/:id/paddle-sync` | invalidate products |
| `useArchiveProductPaddle()` | `POST .../paddle-archive` | invalidate products |
| `useAdminOrders(filters)` | `GET /admin/orders` | `placeholderData` = data sebelumnya (pagination mulus) |
| `useAdminStats()` | `GET /admin/stats` | key `["admin","stats"]` |
| `useCheckout()` | `POST /checkout` | simpan orderNumber, buka Paddle overlay/fallback |

---

## 8. Lib

### `lib/api.ts`
- Instance Axios `baseURL = ${API_URL}/api`, `Content-Type: application/json`.
- Request interceptor menempel `Authorization: Bearer <token>`.
- Response interceptor: pada `401` di `/admin/*` (bukan `/admin/login`) → `clearToken()` + redirect `/admin/login`.
- `getApiErrorMessage(error)` → pesan dari `error.response.data.error.message`.

### `lib/auth.ts`
- Token disimpan di localStorage key **`section_admin_token`** (`getToken/setToken/clearToken`), aman terhadap SSR (`typeof window`).

### `lib/paddle.ts`
- Loader singleton untuk Paddle.js; set `Environment.set("sandbox")` bila `PADDLE_ENV=sandbox`; `Initialize({ token })`. Reject bila token hilang / script gagal.

### `lib/site.ts`
- `SITE_NAME`, `ROOT_DOMAIN`, `useSubdomains()`, `isLocalRoot()`, `nicheUrl(slug)`, `apiUrl()`.

### `lib/server-api.ts`
- `getNiches()`, `getNiche(slug)`, `getProduct(slug)` dengan revalidate & fallback `null`.

### `lib/format.ts`
- `formatCurrency(amount, currency)` → membagi 100, `Intl.NumberFormat("en-US")`, tanpa desimal bila bulat.
- `formatDate` (medium + time), `formatRelative` (just now/Nm/Nh/Nd).

### `lib/types.ts`
- Tipe domain: `Niche`, `Product`, `ProductFile`, `NicheWithProducts`, `OrderStatus`, `DownloadLink`, `PublicOrder`, `PublicOrderItem`, `AdminOrder`, `Pagination`, `AdminUser`, `ApiEnvelope<T>`.

---

## 9. State Management

- **Server state:** React Query (satu `QueryClient`, default di `providers.tsx`).
- **Auth state:** React Context (`AuthProvider`) + token di localStorage.
- **Theme state:** React Context (`ThemeProvider`) + localStorage `section-theme`.
- **Local UI state:** `useState` di masing-masing page (modal open, editing, filter, dll).

---

## 10. Catatan Kualitas

- Kartu bundle (`BundleCard`) memakai cover `next/image` di kolom visual bila produk punya `coverImage`; di desktop gambar mengisi tinggi penuh kartu dengan `object-cover` (tidak ada ruang kosong di bawah, tanpa distorsi), sedangkan di mobile memakai rasio asli gambar. Jika tidak ada cover, kolom visual menampilkan gradient aksen + nomor guide.
- Halaman admin tidak memiliki proteksi server-side; hanya `AuthGuard` di client (data tetap dijaga API via JWT).
- Seluruh copy storefront kini **English native** (brand `1section`); hint admin juga sudah di-Inggriskan.
