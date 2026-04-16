# PRD — نظام إدارة مالية اتحاد ملاك برج الوليد

**Product Requirements Document**
Version: 1.0
Last Updated: April 2026

---

## 1. Product Overview

### 1.1 Summary

A full-stack Arabic HOA (Homeowners Association) financial management web application for **اتحاد ملاك برج الوليد**. The system tracks income and expenses, automates recurring transactions, and provides public-facing financial dashboards and analytics — all in Arabic with RTL layout.

### 1.2 Goals

- Provide full financial transparency to all building owners via a public dashboard
- Reduce admin burden through automated recurring transaction generation
- Maintain an immutable, auditable financial record (no edits or deletes)
- Deliver a modern, minimal, trustworthy UI that residents can confidently reference

### 1.3 Non-Goals

- Multi-building / multi-HOA support (single building only)
- Resident-facing accounts or per-unit portals
- Online payment processing
- Full accounting/double-entry bookkeeping

---

## 2. Users & Roles

| Role               | Description                                                             | Auth Required     |
| ------------------ | ----------------------------------------------------------------------- | ----------------- |
| **Admin**          | One designated user who can add transactions and manage recurring items | Yes (Better Auth) |
| **Public Visitor** | Any building owner or resident who has the link                         | No                |

### 2.1 Admin Capabilities

- Log in securely via email + password
- Add new income or expense transactions
- Upload receipts (images or PDFs) via Cloudinary
- Create, view, and toggle recurring transaction templates
- Cannot edit or delete any existing record (immutability enforced at DB + API level)

### 2.2 Public Visitor Capabilities

- View the financial dashboard (summary, charts, balance)
- Browse the full transaction history with filters
- View recurring items list
- Export/view monthly and yearly reports

---

## 3. Tech Stack

| Layer           | Technology               | Notes                             |
| --------------- | ------------------------ | --------------------------------- |
| Package Manager | pnpm                     | Required — do not use npm or yarn |
| Framework       | Next.js 14+ (App Router) | SSR + API routes                  |
| Language        | TypeScript               | Strict mode                       |
| Database        | Neon DB (PostgreSQL)     | Serverless Postgres               |
| ORM             | Prisma                   | Schema-first, type-safe           |
| Auth            | Better Auth              | Email/password, single admin      |
| File Storage    | Cloudinary               | Images + PDFs for receipts        |
| Styling         | Tailwind CSS             | RTL support, custom design tokens |
| Charts          | Recharts or Chart.js     | Arabic labels                     |
| PDF Export      | React PDF / jsPDF        | Monthly & yearly report export    |
| Deployment      | Vercel                   | Edge-compatible                   |

---

## 4. Design System

### 4.1 Design Philosophy

**Modern Minimal** — Clean, structured, and trustworthy. The UI should feel like a premium financial dashboard: generous whitespace, clear typographic hierarchy, and data that speaks for itself. No visual noise. Every element earns its place.

### 4.2 Color Palette

| Token                    | Value     | Usage                                          |
| ------------------------ | --------- | ---------------------------------------------- |
| `--color-primary`        | `#00C2A8` | CTA buttons, active states, highlights, links  |
| `--color-primary-dark`   | `#009E88` | Hover states for primary                       |
| `--color-primary-light`  | `#E6FAF8` | Backgrounds for income badges, soft highlights |
| `--color-income`         | `#00C2A8` | Income rows, income chart bars                 |
| `--color-expense`        | `#F04E4E` | Expense rows, expense chart bars               |
| `--color-bg`             | `#F8FAFB` | Page background                                |
| `--color-surface`        | `#FFFFFF` | Cards, panels                                  |
| `--color-border`         | `#E8EDEF` | Dividers, input borders                        |
| `--color-text-primary`   | `#111827` | Headings, key data                             |
| `--color-text-secondary` | `#6B7280` | Labels, metadata                               |
| `--color-text-muted`     | `#9CA3AF` | Placeholders, hints                            |

### 4.3 Typography

- **Font:** `IBM Plex Sans Arabic` (Google Fonts) — modern, clean, excellent Arabic rendering
- **Display/Headings:** Semi-bold 600–700
- **Body:** Regular 400
- **Numerals:** Use Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) for amounts displayed in Arabic context, or Western numerals for chart axes — decide consistently
- **Direction:** `dir="rtl"` on `<html>`, all layouts RTL by default

### 4.4 Component Style

- **Cards:** white background, `border-radius: 16px`, subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- **Buttons (Primary):** `bg-[#00C2A8]`, white text, `rounded-xl`, hover darken
- **Buttons (Ghost):** border `#00C2A8`, text `#00C2A8`, transparent background
- **Inputs:** border `#E8EDEF`, focus ring `#00C2A8`, rounded-lg, RTL text alignment
- **Badges:** pill-shaped, income = `bg-[#E6FAF8] text-[#00C2A8]`, expense = `bg-red-50 text-red-500`
- **Tables:** no outer border, row dividers only, alternating row hover `#F8FAFB`

### 4.5 Layout

- Max content width: `1280px`, centered
- Sidebar navigation for admin panel (collapsible on mobile)
- Top navigation bar for public pages
- Mobile-first responsive design
- RTL-aware spacing (padding-right becomes padding-left in RTL, etc. — handled via Tailwind RTL plugin or `[dir=rtl]` classes)

---

## 5. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth managed table
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHECK
  OTHER
}

enum AttachmentType {
  IMAGE
  PDF
}

model Category {
  id           String          @id @default(cuid())
  nameAr       String          // Arabic name
  type         TransactionType
  icon         String?         // emoji or icon name
  color        String?         // hex color for charts
  isDefault    Boolean         @default(false)
  createdAt    DateTime        @default(now())

  transactions Transaction[]
  recurring    RecurringItem[]
}

model Transaction {
  id              String          @id @default(cuid())
  type            TransactionType
  amount          Decimal         @db.Decimal(12, 2)
  date            DateTime
  descriptionAr   String          // Arabic description
  categoryId      String
  paymentMethod   PaymentMethod   @default(CASH)
  attachmentUrl   String?         // Cloudinary URL
  attachmentType  AttachmentType?
  notes           String?
  recurringItemId String?         // null if manually added
  createdAt       DateTime        @default(now())

  category        Category        @relation(fields: [categoryId], references: [id])
  recurringItem   RecurringItem?  @relation(fields: [recurringItemId], references: [id])

  @@index([date])
  @@index([type])
  @@index([categoryId])
}

model RecurringItem {
  id           String          @id @default(cuid())
  nameAr       String          // Arabic name
  type         TransactionType
  amount       Decimal         @db.Decimal(12, 2)
  categoryId   String
  dayOfMonth   Int             // 1–28 (day the entry is generated)
  startDate    DateTime
  endDate      DateTime?       // null = indefinite
  isActive     Boolean         @default(true)
  lastGeneratedMonth Int?      // e.g. 4 (April)
  lastGeneratedYear  Int?      // e.g. 2026
  notes        String?
  createdAt    DateTime        @default(now())

  category     Category        @relation(fields: [categoryId], references: [id])
  transactions Transaction[]
}
```

---

## 6. API Routes

All routes under `/api/`. Admin-write routes are protected by Better Auth middleware.

| Method | Route                        | Access          | Description                                                        |
| ------ | ---------------------------- | --------------- | ------------------------------------------------------------------ |
| GET    | `/api/transactions`          | Public          | List transactions with filters (month, year, type, category, page) |
| POST   | `/api/transactions`          | Admin           | Add new transaction (with optional Cloudinary upload)              |
| GET    | `/api/transactions/summary`  | Public          | Current month & all-time totals                                    |
| GET    | `/api/recurring`             | Public          | List all recurring items                                           |
| POST   | `/api/recurring`             | Admin           | Create new recurring template                                      |
| PATCH  | `/api/recurring/[id]/toggle` | Admin           | Toggle isActive only                                               |
| POST   | `/api/recurring/generate`    | Internal (cron) | Auto-generate this month's transactions                            |
| GET    | `/api/analytics/monthly`     | Public          | Monthly breakdown for a given year                                 |
| GET    | `/api/analytics/yearly`      | Public          | Year-over-year summary                                             |
| GET    | `/api/analytics/categories`  | Public          | Spending by category for a period                                  |
| POST   | `/api/upload`                | Admin           | Upload file to Cloudinary, return URL                              |

---

## 7. Pages Structure

```
app/
├── (public)/
│   ├── page.tsx                    → / — Public dashboard (summary + charts)
│   ├── transactions/
│   │   └── page.tsx               → /transactions — Public transaction list
│   ├── recurring/
│   │   └── page.tsx               → /recurring — Public recurring items view
│   └── reports/
│       └── page.tsx               → /reports — Monthly/yearly report viewer + export
│
├── admin/
│   ├── login/
│   │   └── page.tsx               → /admin/login — Admin login
│   ├── dashboard/
│   │   └── page.tsx               → /admin/dashboard — Admin overview
│   ├── transactions/
│   │   └── new/
│   │       └── page.tsx           → /admin/transactions/new — Add transaction form
│   └── recurring/
│       ├── page.tsx               → /admin/recurring — Manage recurring items
│       └── new/
│           └── page.tsx           → /admin/recurring/new — Add recurring item form
│
└── api/
    ├── transactions/
    ├── recurring/
    ├── analytics/
    └── upload/
```

---

## 8. Features Specification

### 8.1 Public Dashboard (`/`)

- **Balance Card:** Current running balance (all-time income − expense), large and prominent
- **Month Summary Row:** Three cards: total income this month, total expenses this month, net this month
- **Income vs. Expense Chart:** Monthly bar chart for the current year (12 months)
- **Category Breakdown:** Donut/pie chart for expense categories (current month or selected period)
- **Recent Transactions:** Last 10 transactions with type badge, amount, category, and date
- **Quick Filters:** Toggle between current month / last 3 months / this year

### 8.2 Transaction List (`/transactions`)

- Paginated table (20 rows/page)
- Filters: month picker, year picker, type (income/expense/all), category dropdown
- Each row: date, description, category badge, payment method, amount (colored), attachment icon if present
- Click row → expand to see notes + attachment preview

### 8.3 Recurring Items (`/recurring`)

- Card grid of all recurring templates
- Each card shows: name, type badge, amount, day of month, start date, status (active/inactive)
- Clearly labeled as "بنود تلقائية متكررة"

### 8.4 Reports (`/reports`)

- Select month or full year
- Rendered report view: summary table + charts
- Export to PDF button (generates downloadable report with building name header)

### 8.5 Admin — Add Transaction (`/admin/transactions/new`)

- Form fields:
  - النوع: Income / Expense (toggle/radio)
  - المبلغ: number input with currency label (ج.م or chosen currency)
  - التاريخ: date picker (defaults to today)
  - الفئة: dropdown (filtered by income/expense type)
  - الوصف: text input (Arabic)
  - طريقة الدفع: Cash / Transfer / Check / Other
  - المرفقات: file upload (image or PDF) → uploads to Cloudinary on submit
  - ملاحظات: optional textarea
- Submit → creates transaction, clears form, shows success toast
- No cancel / edit after submit

### 8.6 Admin — Add Recurring Item (`/admin/recurring/new`)

- Form fields:
  - الاسم: Arabic name of the recurring item
  - النوع: Income / Expense
  - المبلغ: amount
  - الفئة: category
  - يوم الشهر: day number (1–28)
  - تاريخ البداية: start date
  - تاريخ النهاية: optional end date
  - ملاحظات: optional
- On creation → system will auto-generate a transaction for the current month if applicable

### 8.7 Recurring Auto-Generation

- A cron job (Vercel Cron or similar) runs on the 1st of each month
- It queries all active `RecurringItem` records where `lastGeneratedMonth` ≠ current month
- For each, it creates a `Transaction` record with `recurringItemId` set
- Updates `lastGeneratedMonth` and `lastGeneratedYear` on the template
- Idempotent: safe to run multiple times in the same month

### 8.8 File Uploads (Cloudinary)

- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max size: 10MB
- Upload to a dedicated Cloudinary folder: `burj-alwaleed/receipts/`
- Return secure URL, store in `Transaction.attachmentUrl`
- Public visitors can view/download attachments from the transaction detail

---

## 9. Seeded Data

### Default Categories

**Income (إيرادات)**
| Arabic Name | Icon |
|------------|------|
| اشتراكات شهرية | 🏠 |
| إيجار المرافق | 🔌 |
| غرامات تأخير | ⚠️ |
| تبرعات | 🤝 |
| إيرادات أخرى | 💰 |

**Expenses (مصروفات)**
| Arabic Name | Icon |
|------------|------|
| صيانة عامة | 🔧 |
| نظافة | 🧹 |
| كهرباء | 💡 |
| مياه | 💧 |
| أمن وحراسة | 🛡️ |
| مصعد | 🛗 |
| إدارة وأعمال ورقية | 📋 |
| صندوق الطوارئ | 🚨 |
| مصروفات أخرى | 📦 |

---

## 10. Environment Variables

```env
# Database
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# App
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL=       # used for initial seed
ADMIN_PASSWORD=    # used for initial seed
```

---

## 11. Development Phases

---

### ✅ Phase 1 — Project Foundation

**Goal:** Skeleton project with database, auth, and design system ready

#### Tasks

- [x] Ensure pnpm is installed globally (`npm install -g pnpm`) — all package operations must use pnpm
- [x] Initialize Next.js 14 project with TypeScript and App Router via `pnpm create next-app`
- [ ] Configure Tailwind CSS with RTL support and custom design tokens (`#00C2A8` palette)
- [ ] Add `IBM Plex Sans Arabic` font via `next/font` or Google Fonts
- [ ] Set up Neon DB and connect via `DATABASE_URL`
- [ ] Write Prisma schema (all models as defined in Section 5)
- [ ] Run initial migration and seed default categories + admin user
- [ ] Configure Better Auth (email/password, single admin)
- [ ] Configure Cloudinary SDK and create `/api/upload` route
- [ ] Set up Vercel project and environment variables
- [ ] Create shared layout components: Navbar (public), Sidebar (admin), RTL wrapper

**Deliverable:** Running app with DB connected, auth working, design tokens applied

---

### ✅ Phase 2 — Core Transaction Management

**Goal:** Admin can add transactions; public can view them

#### Tasks

- [ ] Build `/admin/transactions/new` form with all fields
- [ ] Implement file upload flow to Cloudinary from the form
- [ ] Create `POST /api/transactions` route (admin-protected)
- [ ] Create `GET /api/transactions` route with filters (month, year, type, category, pagination)
- [ ] Build `/transactions` public page — paginated, filterable table
- [ ] Add transaction row expand/collapse for notes + attachment preview
- [ ] Toast notifications for success/error states
- [ ] Input validation (Zod schemas) on both client and server

**Deliverable:** Full add-and-view transaction flow working end-to-end

---

### ✅ Phase 3 — Recurring Transactions

**Goal:** Admin can define templates; system auto-generates monthly entries

#### Tasks

- [ ] Build `/admin/recurring/new` form
- [ ] Create `POST /api/recurring` route
- [ ] Create `PATCH /api/recurring/[id]/toggle` route (isActive only)
- [ ] Build `/admin/recurring` management page
- [ ] Build `/recurring` public view page
- [ ] Implement `POST /api/recurring/generate` logic (idempotent monthly generation)
- [ ] Configure Vercel Cron Job to call `/api/recurring/generate` on the 1st of each month
- [ ] On new recurring item creation → trigger immediate generation for current month if applicable

**Deliverable:** Recurring items work; monthly entries auto-created

---

### ✅ Phase 4 — Public Dashboard & Analytics

**Goal:** Beautiful, data-rich public dashboard

#### Tasks

- [ ] Create `GET /api/transactions/summary` (current month + all-time balance)
- [ ] Create `GET /api/analytics/monthly` (monthly breakdown per year)
- [ ] Create `GET /api/analytics/yearly` (year-over-year)
- [ ] Create `GET /api/analytics/categories` (category breakdown for period)
- [ ] Build `/` public dashboard:
  - Running balance hero card
  - Current month summary (3 cards)
  - Income vs. Expense bar chart (Recharts, Arabic labels)
  - Category donut chart for expenses
  - Recent transactions list
  - Period quick filter (this month / 3 months / this year)
- [ ] Fully responsive layout (mobile → desktop)
- [ ] Loading skeletons for all data sections

**Deliverable:** Polished public dashboard live and accessible

---

### ✅ Phase 5 — Reports & Export

**Goal:** Generate and export monthly/yearly financial reports as PDF

#### Tasks

- [ ] Build `/reports` page with month/year selector
- [ ] Render report view: summary table, income breakdown, expense breakdown, charts
- [ ] Implement PDF export using `@react-pdf/renderer` or `jsPDF + html2canvas`
- [ ] PDF includes: building name header, period label, summary table, category breakdown
- [ ] Style PDF in Arabic with proper RTL text handling
- [ ] Add "تحميل التقرير" (Download Report) button on reports page and dashboard

**Deliverable:** Users can generate and download professional PDF reports

---

### ✅ Phase 6 — Polish, Security & Production Readiness

**Goal:** Harden the app, fix edge cases, deploy cleanly

#### Tasks

- [ ] Enforce immutability: remove any edit/delete UI and block at API level with 405 responses
- [ ] Add rate limiting on admin API routes (e.g. via Vercel Edge middleware or `upstash/ratelimit`)
- [ ] Add `robots.txt` to allow public pages, disallow `/admin`
- [ ] Meta tags and Open Graph for public pages (Arabic)
- [ ] Error boundaries and 404/500 pages in Arabic
- [ ] Audit Cloudinary uploads: validate file type and size server-side
- [ ] Final mobile QA across all public pages
- [ ] Performance audit: image optimization, bundle size, Lighthouse score
- [ ] Seed production DB with initial categories and admin account
- [ ] Write basic `README.md` with setup and deployment instructions (using pnpm commands throughout)

**Deliverable:** Production-ready application fully deployed on Vercel

---

## 12. Immutability Policy

This is a core product constraint and must be enforced at every layer:

| Layer         | Enforcement                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| **UI**        | No edit/delete buttons anywhere in the interface                                                               |
| **API**       | `PUT`, `PATCH` (except recurring toggle), and `DELETE` routes return `405 Method Not Allowed` for transactions |
| **Database**  | No application-level delete queries on `Transaction` table; consider DB-level triggers if needed               |
| **Recurring** | Only `isActive` field can be toggled — all other fields are read-only after creation                           |

---

## 13. Accessibility & Localization

- All UI text in Arabic
- `lang="ar"` and `dir="rtl"` on `<html>` element
- ARIA labels in Arabic for interactive elements
- Chart tooltips and legends in Arabic
- Date format: Arabic locale (DD/MM/YYYY or localized)
- Currency: Egyptian Pound (ج.م) — configurable via env var if needed
- Keyboard navigation support for all forms

---

## 14. Out of Scope (Future Phases)

- Per-unit owner portal or login
- WhatsApp / SMS notifications for new entries
- Online payment collection
- Multi-currency support
- Audit log viewer (who added what, when — beyond `createdAt`)
- Role-based access (e.g. viewer-only admin, accountant role)
- Multi-language support (Arabic only for now)
