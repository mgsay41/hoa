# Plan: Transform HOA → اطعام Charity App

## Context

On the `Feeding` branch (created from `main`), we transform the HOA financial dashboard into a new app called **اطعام** — a charity food-tracking system. The app tracks monthly income collected from donors and monthly expenses (recurring and one-time). The key new feature is that **admins can edit and delete transactions**, unlike the immutable HOA app. The structure, style, colors, and framework are identical.

---

## Files to Modify / Create

### Phase 1 — Rebranding (text changes only)

| File                                    | Change                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| `frontend/app/layout.tsx`               | Update `metadata` title/description to "اطعام"                     |
| `frontend/components/navbar.tsx`        | Change logo text "برج الوليد" → "اطعام"                            |
| `frontend/components/sidebar.tsx`       | Change logo text → "اطعام"; add "المعاملات" nav link (see Phase 4) |
| `frontend/app/admin/layout.tsx`         | Change mobile header "برج الوليد" → "اطعام"                        |
| `frontend/app/admin/login/page.tsx`     | Change heading + subtitle to اطعام branding                        |
| `frontend/app/admin/dashboard/page.tsx` | Update welcome text + add shortcut for transactions list           |

### Phase 2 — New Seed Categories

**File:** `frontend/prisma/seed.ts`

Replace category arrays (keep all boilerplate identical, only data changes):

**Income categories:**

- `تبرع شهري` · icon `🤲` · color `#00C2A8`
- `تبرع إضافي` · icon `💝` · color `#8B5CF6`

**Expense categories:**

- `مواد غذائية` · icon `🛒` · color `#F04E4E`
- `توزيع طعام` · icon `🍱` · color `#F59E0B`
- `مصاريف إدارية` · icon `📋` · color `#6366F1`
- `نقل وتوصيل` · icon `🚚` · color `#3B82F6`
- `أخرى` · icon `📦` · color `#6B7280`

Also update sample `recurringItems` and `transactions` arrays to use new category IDs (`inc-تبرع شهري`, `exp-مواد غذائية`, etc.) with charity-relevant data.

### Phase 3 — Transaction Edit/Delete API

**File to create:** `frontend/app/api/transactions/[id]/route.ts`

- **GET** — `prisma.transaction.findUnique({ where:{id}, include:{category:true} })` → 404 if missing
- **PUT** (admin only) — auth check → parse body with `updateTransactionSchema` → `prisma.transaction.update()`
- **DELETE** (admin only) — auth check → `prisma.transaction.delete()` → `{success:true}`

Use `await params` for Next.js 16 async params (pattern already in `api/recurring/[id]/toggle/route.ts`).

**File to modify:** `frontend/lib/validations/transaction.ts`

Add `updateTransactionSchema` — same fields as `createTransactionSchema` but all `.optional()`.

**File to modify:** `frontend/middleware.ts`

Extend `isAdminApi` check to include `PUT` and `DELETE` on `/api/transactions`.

### Phase 4 — Admin Transactions List

**File to create:** `frontend/app/admin/transactions/page.tsx` (Server Component)

Fetch categories from Prisma, render `<AdminTransactionsList categories={categories} />`.

**File to create:** `frontend/components/admin-transactions-list.tsx` (Client Component)

Copy structure from `components/transactions-list.tsx`. Add per-row:

- **Edit button** → `<Link href="/admin/transactions/{id}/edit">` (small teal button)
- **Delete button** → `window.confirm(...)` → `DELETE /api/transactions/{id}` → optimistic removal from state + toast

Track `deletingId` state to show spinner on the row being deleted.

Place edit/delete buttons in the **expanded row details** section (the collapsible area) to keep the row clean on mobile.

**File to modify:** `frontend/components/sidebar.tsx`

Add to `adminLinks` array (between "الرئيسية" and "إضافة"):

```ts
{
  href: "/admin/transactions",
  label: "المعاملات",
  hideOnMobile: true,   // 5 tabs is too crowded on mobile
  icon: (active) => <svg ... />,   // list/rows icon
}
```

Add `hideOnMobile?: boolean` field to the link type and filter it in the mobile tab bar renderer (`adminLinks.filter(l => !l.hideOnMobile)`).

In the desktop sidebar label logic (line 104), add: `link.label === "المعاملات" ? "سجل المعاملات"`.

### Phase 5 — Transaction Edit Form & Page

**File to modify:** `frontend/components/transaction-form.tsx`

Add optional props:

```ts
interface TransactionFormProps {
  categories: Category[];
  mode?: "create" | "edit";
  initialData?: {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: string;
    date: string;
    descriptionAr: string;
    categoryId: string;
    paymentMethod: string;
    notes: string | null;
    attachmentUrl: string | null;
    attachmentType: string | null;
  };
}
```

Initialize all `useState` values from `initialData` when `mode === "edit"`.

In `handleSubmit`:

- If `mode === "edit"`: `PUT /api/transactions/{initialData.id}`, toast "تم تحديث المعاملة بنجاح", `router.push("/admin/transactions")`
- If `mode === "create"`: existing behavior unchanged

Change heading, submit button text, and add a cancel `<Link>` back to `/admin/transactions` in edit mode.

For attachments in edit mode: if `initialData.attachmentUrl` exists, show it with a "حذف المرفق" button. Only upload a new file if `file` state is non-null.

**File to create:** `frontend/app/admin/transactions/[id]/edit/page.tsx` (Server Component)

```ts
const { id } = await params;
const [transaction, categories] = await Promise.all([
  prisma.transaction.findUnique({ where:{id}, include:{category:true} }),
  prisma.category.findMany(...),
]);
if (!transaction) notFound();
// Serialize Decimal → .toString(), Date → .toISOString().split("T")[0]
return <TransactionForm categories={categories} mode="edit" initialData={initialData} />;
```

### Phase 6 — Admin Category Management

**File to create:** `frontend/app/api/categories/route.ts`

- **GET** — `prisma.category.findMany({ orderBy: [{ type:'asc' }, { nameAr:'asc' }] })` (public, used by forms)
- **POST** (admin only) — validate with `categorySchema` → `prisma.category.create()`

**File to create:** `frontend/app/api/categories/[id]/route.ts`

- **PUT** (admin only) — validate with `categorySchema.partial()` → `prisma.category.update()`
- **DELETE** (admin only) — check `_count.transactions + _count.recurring` first; if > 0, return 409 "الفئة مستخدمة في معاملات موجودة". Otherwise `prisma.category.delete()`

**File to create (or append to):** `frontend/lib/validations/category.ts`

```ts
export const categorySchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
```

**File to create:** `frontend/components/category-form.tsx` (Client Component)

Simple form with fields: Arabic name (text), type (INCOME/EXPENSE toggle), icon (emoji text input), color (color picker + hex input). Supports `mode="create"|"edit"` with `initialData`. On save calls POST or PUT. On success redirects to `/admin/categories`.

**File to create:** `frontend/app/admin/categories/page.tsx` (Server Component)

Fetch all categories from Prisma, grouped by type (income first, then expense). Render two sections with a card/row per category showing icon, nameAr, color swatch. Each row has:

- **Edit** button → `/admin/categories/{id}/edit`
- **Delete** button (client-side) → `DELETE /api/categories/{id}` with confirm dialog; show error toast if category is in use

**File to create:** `frontend/app/admin/categories/new/page.tsx`
Renders `<CategoryForm mode="create" />`.

**File to create:** `frontend/app/admin/categories/[id]/edit/page.tsx` (Server Component)
Fetch category by ID → `notFound()` if missing → render `<CategoryForm mode="edit" initialData={...} />`.

**File to modify:** `frontend/components/sidebar.tsx`
Add "الفئات" link to `adminLinks` (with `hideOnMobile: true`), pointing to `/admin/categories`. Desktop label: "إدارة الفئات".

**File to modify:** `frontend/app/admin/dashboard/page.tsx`
Add a shortcut card: href `/admin/categories`, label "الفئات", desc "إضافة وتعديل فئات الإيرادات والمصروفات".

**File to modify:** `frontend/middleware.ts`
Add POST/PUT/DELETE on `/api/categories` to the `isAdminApi` check.

---

## No Schema Migration Needed

The Prisma schema is unchanged — the 405 responses on transactions were application-layer guards, not DB constraints.

## Environment Variables

For the new deployment, update: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Run `pnpm db:migrate && pnpm db:seed` against the new DB.

---

## Ordered Task List

1. Rebrand `layout.tsx`, `navbar.tsx`, `sidebar.tsx`, `admin/layout.tsx`, `login/page.tsx`, `admin/dashboard/page.tsx`
2. Update `prisma/seed.ts` categories + sample data
3. Add `updateTransactionSchema` to `lib/validations/transaction.ts`
4. Create `app/api/transactions/[id]/route.ts` (GET + PUT + DELETE)
5. Update `middleware.ts` to rate-limit PUT/DELETE on transactions + category mutations
6. Extend `transaction-form.tsx` for edit mode
7. Create `app/admin/transactions/page.tsx`
8. Create `components/admin-transactions-list.tsx`
9. Create `app/admin/transactions/[id]/edit/page.tsx`
10. Update `sidebar.tsx` — add "المعاملات" + "الفئات" links with `hideOnMobile` support
11. Create `lib/validations/category.ts` with `categorySchema`
12. Create `app/api/categories/route.ts` (GET + POST)
13. Create `app/api/categories/[id]/route.ts` (PUT + DELETE with in-use guard)
14. Create `components/category-form.tsx`
15. Create `app/admin/categories/page.tsx`
16. Create `app/admin/categories/new/page.tsx`
17. Create `app/admin/categories/[id]/edit/page.tsx`
18. Update `admin/dashboard/page.tsx` — add shortcuts for transactions list + categories

## Verification

1. Run `pnpm dev` — check public pages (dashboard, transactions, reports) are unaffected
2. Login as admin → confirm "اطعام" branding throughout
3. Admin → "سجل المعاملات" → list loads with Edit/Delete buttons
4. Click Edit → form pre-fills → save → transaction updated
5. Click Delete → confirm dialog → row disappears, toast shown
6. Admin → "الفئات" → list shows all categories grouped by type
7. Add new category → appears in list and in transaction form dropdowns
8. Edit category → changes reflected in list
9. Try deleting a used category → error toast shown
10. Mobile sidebar → 4 tabs only (no overflow)
11. `pnpm db:seed` on fresh DB → new charity categories seeded correctly
