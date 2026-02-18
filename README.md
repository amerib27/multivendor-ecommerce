<div align="center">

# 🛍️ MultiVendor — Full-Stack Multi-Vendor E-Commerce Platform

A production-ready, full-stack multi-vendor marketplace built with **React 19**, **Node.js**, **PostgreSQL**, and **Stripe** — similar to Etsy or Daraz, where multiple independent vendors sell products to customers on a single unified platform.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Free Service Setup](#-free-service-setup)
- [User Roles](#-user-roles)
- [Payment Flow](#-payment-flow)
- [Security](#-security)
- [Folder Structure](#-folder-structure)

---

## 🌟 Overview

MultiVendor is a fully functional e-commerce platform where:

- **Customers** browse products from multiple vendors, add to cart, pay with Stripe, and track orders
- **Vendors** apply to open a store, list products with images, manage inventory, fulfill orders, and view analytics
- **Admins** review vendor applications, manage users/products/categories, and monitor platform-wide analytics

Everything runs on **100% free services** — no credit card required for development.

---

## ✨ Features

### Customer Features
- Browse products with category filters, price range, sort options, and full-text search
- Product detail page with image gallery, reviews, rating, related products
- Add to cart (persisted in localStorage), update quantities, remove items
- Wishlist — save products for later
- Checkout with saved delivery address + Stripe payment
- Order tracking with real-time status timeline (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
- Order history with detailed item breakdown
- Profile management (avatar, name, password)
- Saved address book (multiple addresses with default selection)

### Vendor Features
- Apply to become a vendor (pending admin approval)
- Dashboard with KPI cards: revenue, orders, products, avg rating
- Product management: create/edit/delete products, multi-image upload (Cloudinary), toggle active/inactive
- Order management: view incoming orders, update fulfillment status per item
- Store profile: edit store name, description, logo, and banner image
- Revenue analytics: 30-day revenue line chart + top products bar chart (Recharts)

### Admin Features
- Platform statistics: total users, vendors, products, orders, revenue
- Vendor management: approve / reject / suspend vendor applications
- User management: search users, activate/deactivate accounts
- Product management: toggle active/featured for all products
- Order overview: all orders with status filtering + status sync
- Category management: hierarchical category tree (add/edit/delete with parent selection)

### Platform Features
- JWT authentication with **refresh token rotation** (no Redis needed)
- Role-based access control (CUSTOMER / VENDOR / ADMIN)
- Stripe webhook integration (payment status updated server-side only)
- Cloudinary image uploads with automatic optimization
- Brevo transactional emails (order confirmed, vendor approved/rejected)
- Rate limiting, CORS, Helmet security headers
- Skeleton loaders and smooth transitions throughout
- Fully responsive design (mobile-first)

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | UI framework |
| **TypeScript** | 5.x (strict) | Type safety |
| **Vite** | 6.x | Build tool & dev server |
| **TailwindCSS** | v4 | Utility-first styling (`@theme` variables, no config file) |
| **Zustand** | 5.x | Global state management (auth, cart, UI) |
| **TanStack Query** | v5 | Server state, caching, background refetching |
| **React Router** | v6 | Client-side routing with nested layouts |
| **Axios** | 1.x | HTTP client with auto token refresh interceptor |
| **Framer Motion** | 11.x | Animations (`whileHover`, page transitions) |
| **Recharts** | 2.x | Analytics charts (line, bar) |
| **Stripe.js** | latest | Stripe `PaymentElement` for PCI-compliant checkout |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 22 LTS | JavaScript runtime |
| **Express** | 4.x | HTTP framework |
| **TypeScript** | 5.x (strict) | Type safety |
| **Prisma** | 6.x | ORM with type-safe queries and migrations |
| **Zod** | 3.x | Runtime request validation schemas |
| **bcrypt** | 5.x | Password hashing |
| **jsonwebtoken** | 9.x | JWT access & refresh token generation |
| **multer** | 1.x | Multipart file uploads |
| **Helmet** | 8.x | Security HTTP headers |
| **express-rate-limit** | 7.x | API rate limiting |
| **compression** | 1.x | Gzip response compression |
| **cors** | 2.x | Cross-origin resource sharing |

### External Services (all free, no credit card)
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Neon** | PostgreSQL 17 database (serverless) | 3 GB storage, 10 branches |
| **Cloudinary** | Image storage & CDN with auto-optimization | 25 GB storage + transformations |
| **Stripe** | Payment processing (sandbox mode) | Unlimited test transactions |
| **Brevo** | Transactional email (SMTP) | 300 emails/day |

### Design System
```
Primary:    #0088DD  (buttons, links, accents)
Background: #FFFFFF  (main) / #E6F4FF (hover states)
Text:       #333333  (body) / #EEEEEE (borders, dividers)
Accent:     #FF4D4D  (discounts, alerts, badges)
```

---

## 🏗 Project Architecture

This is an **npm workspaces monorepo** with three packages:

```
multivendor/
├── backend/          ← Express REST API (port 5000)
├── frontend/         ← React Vite SPA (port 5173)
├── shared/           ← Shared TypeScript types
├── package.json      ← Workspace root
└── README.md
```

### Backend Module Architecture

The backend follows a **modular, feature-based** structure. Each feature is a self-contained module with its own router, controller, service, and schema:

```
backend/src/
├── app.ts                    ← Express app setup (middleware + route mounts)
├── server.ts                 ← HTTP server entry point
├── config/
│   ├── index.ts              ← Typed environment config
│   ├── database.ts           ← Singleton PrismaClient
│   └── cloudinary.ts         ← Cloudinary SDK configuration
├── middleware/
│   ├── auth.middleware.ts     ← JWT authenticate + requireRole() guard
│   ├── error.middleware.ts    ← Global Zod/Prisma/generic error handler
│   ├── validate.middleware.ts ← Zod schema validation wrapper
│   ├── upload.middleware.ts   ← Multer + CloudinaryStorage configuration
│   └── rateLimiter.middleware.ts ← Per-route rate limiting
├── modules/
│   ├── auth/                 ← Register, login, refresh, logout, /me
│   ├── users/                ← Profile, avatar, addresses, password change
│   ├── vendors/              ← Apply, dashboard (profile/stats/analytics/logo/banner), public store
│   ├── products/             ← CRUD, search/filter, images, featured
│   ├── categories/           ← Hierarchical category tree CRUD
│   ├── cart/                 ← Server-side cart (sync with localStorage cart)
│   ├── orders/               ← Create order, list, detail, vendor fulfillment
│   ├── payments/             ← Stripe PaymentIntent + webhook handler
│   ├── reviews/              ← Product reviews CRUD
│   ├── wishlist/             ← Add/remove/list wishlist items
│   ├── notifications/        ← In-app notifications, mark read
│   └── admin/                ← Stats, vendor/user/product/order management
└── utils/
    ├── apiResponse.utils.ts  ← sendSuccess / sendError helpers
    ├── jwt.utils.ts          ← Sign/verify access & refresh tokens
    ├── email.utils.ts        ← Brevo SMTP email senders
    └── pagination.utils.ts   ← buildPaginationMeta helper
```

### Frontend Page Architecture

```
frontend/src/
├── App.tsx                   ← Full route tree with nested layouts
├── store/
│   ├── auth.store.ts         ← Zustand: user, tokens, isAuthenticated
│   ├── cart.store.ts         ← Zustand + localStorage persist: CartItem[]
│   └── ui.store.ts           ← Zustand: toasts, loading states
├── services/
│   ├── api.ts                ← Axios instance + silent 401→refresh interceptor
│   ├── auth.service.ts       ← login, register, logout
│   └── products.service.ts   ← list, getFeatured, getBySlug, uploadImages
├── components/
│   ├── ui/                   ← Skeleton, Toast, Badge, Modal
│   ├── layout/               ← PublicLayout, UserLayout, VendorLayout, AdminLayout
│   └── shared/               ← ProductCard, ProtectedRoute, Navbar, Footer
└── pages/
    ├── public/               ← Home, ProductList, ProductDetail, VendorStore, Search
    ├── auth/                 ← Login, Register
    ├── user/                 ← Dashboard, Orders, OrderDetail, Cart, Checkout,
    │                            Wishlist, Profile, Addresses
    ├── vendor/               ← Dashboard, Products, ProductForm, Orders,
    │                            Analytics, Profile, Apply
    └── admin/                ← Dashboard, Vendors, Users, Products,
                                 Orders, Categories
```

---

## 🗄 Database Schema

16 Prisma models across 3 roles:

```
User ──────────────── Vendor (1:1)
  │                     │
  ├── Cart (1:1)         ├── Product[]
  ├── Order[]            └── OrderItem[]
  ├── Review[]
  ├── Address[]        Product ─── ProductImage[]
  ├── Wishlist (1:1)           ├── ProductCategory[] ←→ Category (M2M)
  └── Notification[]           ├── CartItem[]
                               ├── OrderItem[]
Order ──────────────── OrderItem[]    ├── Review[]
  │                              └── WishlistItem[]
  ├── Payment (1:1)
  └── Address (snapshot)   Category ─── children[] (self-referential)
```

**Key design decisions:**
- `OrderItem` snapshots `productName` + `productImage` at purchase time — historical orders stay accurate after product edits
- `vendorPayout` is computed and stored immutably on `OrderItem` at commission rate
- `Payment.status` is **only** updated via Stripe webhooks (never from the frontend), preventing fraud
- Refresh tokens are stored in `User.refreshToken` and rotated on every `/auth/refresh` call

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT pair |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/logout` | Auth | Invalidate refresh token |
| GET | `/auth/me` | Auth | Get current user |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | Public | List with filter/sort/search/pagination |
| GET | `/products/featured` | Public | Featured products |
| GET | `/products/:slug` | Public | Product detail + related |
| GET | `/products/vendor/mine` | Vendor | My products |
| POST | `/products` | Vendor | Create product |
| PUT | `/products/:id` | Vendor | Update product |
| DELETE | `/products/:id` | Vendor | Delete product |
| POST | `/products/:id/images` | Vendor | Upload product images |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Customer | Create order from cart |
| GET | `/orders` | Customer | My orders |
| GET | `/orders/:id` | Customer | Order detail |
| GET | `/orders/vendor/incoming` | Vendor | Orders containing my products |
| PATCH | `/orders/vendor/items/:itemId/status` | Vendor | Update item fulfillment status |

### Vendors
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vendors/top` | Public | Top 4 active vendors |
| GET | `/vendors/:slug` | Public | Vendor public profile |
| GET | `/vendors/:slug/products` | Public | Vendor's products |
| POST | `/vendors/apply` | Auth | Apply to become vendor |
| GET | `/vendors/dashboard/stats` | Vendor | KPI statistics |
| GET | `/vendors/dashboard/analytics` | Vendor | Revenue & top products |
| PUT | `/vendors/dashboard/profile` | Vendor | Update store info |
| POST | `/vendors/dashboard/logo` | Vendor | Upload store logo |
| POST | `/vendors/dashboard/banner` | Vendor | Upload store banner |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Platform statistics |
| GET | `/admin/users` | Admin | List users (searchable) |
| PATCH | `/admin/users/:id/toggle` | Admin | Activate/deactivate user |
| GET | `/admin/vendors` | Admin | List vendors (filterable) |
| PATCH | `/admin/vendors/:id/approve` | Admin | Approve vendor |
| PATCH | `/admin/vendors/:id/reject` | Admin | Reject vendor |
| PATCH | `/admin/vendors/:id/suspend` | Admin | Suspend vendor |
| GET | `/admin/products` | Admin | All products |
| PATCH | `/admin/products/:id/toggle` | Admin | Toggle product active |
| PATCH | `/admin/products/:id/featured` | Admin | Toggle product featured |
| GET | `/admin/orders` | Admin | All orders |
| POST | `/admin/orders/resync-statuses` | Admin | Sync order statuses from items |

### Other Modules
| Module | Base Path | Description |
|--------|-----------|-------------|
| Reviews | `/reviews` | CRUD product reviews |
| Wishlist | `/wishlist` | Add/remove/list saved products |
| Notifications | `/notifications` | In-app notifications, mark read |
| Categories | `/categories` | Hierarchical category CRUD |
| Users | `/users` | Profile, addresses, password, avatar |
| Payments | `/payments` | Stripe PaymentIntent + webhook |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22 LTS
- npm 10+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/amerib27/multivendor-ecommerce.git
cd multivendor-ecommerce
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (root, backend, frontend) in one command.

### 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Fill in the values — see [Environment Variables](#-environment-variables) and [Free Service Setup](#-free-service-setup) below.

### 4. Set Up the Database

```bash
# Push schema to Neon (creates all 16 tables)
npm run db:push

# Seed admin user + root categories
npm run db:seed
```

**Default admin credentials after seeding:**
```
Email:    admin@multivendor.com
Password: Admin123!
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts both backend (port **5000**) and frontend (port **5173**) concurrently.

| URL | Service |
|-----|---------|
| `http://localhost:5173` | React frontend |
| `http://localhost:5000/api` | Express API |

### 6. Set Up Stripe Webhooks (for local payment testing)

```bash
# Install Stripe CLI, then:
stripe login
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

Copy the webhook signing secret into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

Use test card `4242 4242 4242 4242` (any future expiry, any CVC) to complete a payment.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# ─── Database (Neon) ──────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# ─── JWT (generate with: openssl rand -base64 32) ────────────────────────────
JWT_SECRET=your_random_32_char_secret_here
JWT_REFRESH_SECRET=your_other_random_32_char_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── Server ───────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ─── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ─── Brevo (Email) ────────────────────────────────────────────────────────────
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_login@email.com
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

---

## 🆓 Free Service Setup

All external services are **100% free** with no credit card required:

### 1. Neon (PostgreSQL)
1. Go to [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create project `multivendor-ecommerce`
3. Go to **Connection Details** → copy the **Pooled** connection string into `DATABASE_URL`
4. Copy the **Direct** connection string into `DIRECT_URL`

### 2. Cloudinary (Image Storage)
1. Go to [cloudinary.com](https://cloudinary.com) → Sign up
2. Go to Dashboard → copy **Cloud Name**, **API Key**, and **API Secret**
3. Paste into `backend/.env`

### 3. Stripe (Payments)
1. Go to [stripe.com](https://stripe.com) → Sign up
2. Stay in **Test mode** (toggle in top-left)
3. Go to **Developers → API Keys** → copy the `sk_test_...` secret key
4. Run `stripe listen` locally to get the webhook secret
5. Use test card `4242 4242 4242 4242` for payments

### 4. Brevo (Email)
1. Go to [brevo.com](https://brevo.com) → Sign up
2. Go to **SMTP & API → SMTP tab** → copy host/port/login
3. Go to **API Keys** tab → create and copy API key

---

## 👥 User Roles

| Role | How to Get | Capabilities |
|------|-----------|--------------|
| **CUSTOMER** | Register normally | Browse, cart, checkout, orders, wishlist, reviews |
| **VENDOR** | Apply via `/vendor/apply` (requires admin approval) | All customer features + store management, product CRUD, order fulfillment, analytics |
| **ADMIN** | Set manually in database or via seed | All vendor features + platform management, vendor approvals, user management |

### Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                            ↘ CANCELLED (any time before delivery)
```

- `PENDING` — Order created, awaiting payment
- `CONFIRMED` — Payment received (Stripe webhook fires)
- `PROCESSING` → `SHIPPED` → `DELIVERED` — Vendor fulfillment stages
- Each vendor's item status updates independently; the order's overall status reflects the slowest item

---

## 💳 Payment Flow

```
1. Customer selects address + clicks "Continue to Payment"
        ↓
2. Backend creates Order (stock validated, cart cleared atomically)
        ↓
3. Backend creates Stripe PaymentIntent → returns clientSecret
        ↓
4. Frontend renders Stripe PaymentElement with clientSecret
        ↓
5. Customer enters card → Stripe confirms payment
        ↓
6. Stripe fires webhook → POST /api/payments/webhook
        ↓
7. Backend verifies webhook signature → updates Order.status = CONFIRMED
   + sets all OrderItem.status = CONFIRMED (vendors can now fulfill)
        ↓
8. Vendor updates items: CONFIRMED → PROCESSING → SHIPPED → DELIVERED
        ↓
9. Customer receives email notifications at key steps
```

**Security:** Payment status is **only** updated via webhook, never from the frontend. This prevents clients from forging payment confirmations.

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **JWT Rotation** | New access + refresh token issued on every `/auth/refresh`; old refresh token invalidated in DB |
| **Password Hashing** | bcrypt with salt rounds = 12 |
| **Input Validation** | Zod schemas on all POST/PUT/PATCH endpoints |
| **SQL Injection** | Prisma parameterized queries exclusively |
| **Rate Limiting** | Auth routes: 10 req/15 min · Global: 200 req/15 min |
| **CORS** | Locked to `FRONTEND_URL` env variable |
| **Security Headers** | Helmet middleware (X-Frame-Options, HSTS, CSP, etc.) |
| **Webhook Verification** | Stripe `constructEvent()` validates signature before processing |
| **Role Guards** | `requireRole()` middleware on all protected routes |
| **Ownership Checks** | Orders/products verified against authenticated user before mutations |
| **Secrets** | `.env` files gitignored; only `.env.example` committed |

---

## 📁 Folder Structure

```
multivendor-ecommerce/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← 16-model DB schema
│   │   └── seed.ts                ← Admin user + root categories
│   ├── src/
│   │   ├── app.ts                 ← Express app (middleware + routes)
│   │   ├── server.ts              ← HTTP server
│   │   ├── config/                ← env, database, cloudinary
│   │   ├── middleware/            ← auth, error, validate, upload, rateLimit
│   │   ├── modules/               ← auth, users, vendors, products, categories,
│   │   │                             cart, orders, payments, reviews, wishlist,
│   │   │                             notifications, admin
│   │   └── utils/                 ← apiResponse, jwt, email, pagination
│   ├── .env.example               ← All required env vars documented
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx                ← Route tree with nested layouts
│   │   ├── store/                 ← auth, cart, ui (Zustand)
│   │   ├── services/              ← api.ts (Axios), auth, products
│   │   ├── components/
│   │   │   ├── ui/                ← Skeleton, Toast, Badge
│   │   │   ├── layout/            ← PublicLayout, UserLayout, VendorLayout, AdminLayout
│   │   │   └── shared/            ← ProductCard, ProtectedRoute, Navbar, Footer
│   │   ├── pages/
│   │   │   ├── public/            ← Home, ProductList, ProductDetail, VendorStore, Search
│   │   │   ├── auth/              ← Login, Register
│   │   │   ├── user/              ← Dashboard, Orders, Cart, Checkout, Wishlist, Profile, Addresses
│   │   │   ├── vendor/            ← Dashboard, Products, ProductForm, Orders, Analytics, Profile, Apply
│   │   │   └── admin/             ← Dashboard, Vendors, Users, Products, Orders, Categories
│   │   ├── utils/                 ← format.ts (currency, date, discount)
│   │   └── styles/
│   │       └── index.css          ← TailwindCSS v4 @theme variables
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── shared/
│   └── src/types/                 ← Shared TypeScript interfaces
│
├── .gitignore
├── package.json                   ← npm workspaces root + concurrently scripts
└── README.md
```

---

## 📜 Available Scripts

From the **root** directory:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend in parallel |
| `npm run dev:backend` | Start backend only (ts-node-dev with hot reload) |
| `npm run dev:frontend` | Start frontend only (Vite dev server) |
| `npm run build` | Build both packages for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed admin user + categories |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit using conventional commits: `git commit -m "feat(auth): add OAuth support"`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ using React, Node.js, PostgreSQL, and Stripe
</div>
