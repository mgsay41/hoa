import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import {
  TransactionType,
  PaymentMethod,
} from "../app/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { auth } from "../lib/auth";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// ─── Categories ──────────────────────────────────────────────────────────────

const incomeCategories = [
  { nameAr: "تبرع شهري", icon: "🤲", color: "#00C2A8" },
  { nameAr: "تبرع إضافي", icon: "💝", color: "#8B5CF6" },
];

const expenseCategories = [
  { nameAr: "مواد غذائية", icon: "🛒", color: "#F04E4E" },
  { nameAr: "توزيع طعام", icon: "🍱", color: "#F59E0B" },
  { nameAr: "مصاريف إدارية", icon: "📋", color: "#6366F1" },
  { nameAr: "نقل وتوصيل", icon: "🚚", color: "#3B82F6" },
  { nameAr: "أخرى", icon: "📦", color: "#6B7280" },
];

// ─── Recurring Items ──────────────────────────────────────────────────────────

const recurringItems = [
  {
    id: "rec-monthly-donations",
    nameAr: "تبرعات شهرية من المتبرعين",
    type: TransactionType.INCOME,
    amount: "8000.00",
    categoryId: "inc-تبرع شهري",
    dayOfMonth: 1,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "تبرعات شهرية ثابتة من 8 متبرعين",
  },
  {
    id: "rec-food-purchase",
    nameAr: "شراء مواد غذائية شهرية",
    type: TransactionType.EXPENSE,
    amount: "5000.00",
    categoryId: "exp-مواد غذائية",
    dayOfMonth: 5,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "شراء المواد الغذائية الأساسية",
  },
  {
    id: "rec-food-distribution",
    nameAr: "توزيع وجبات شهرية",
    type: TransactionType.EXPENSE,
    amount: "2500.00",
    categoryId: "exp-توزيع طعام",
    dayOfMonth: 10,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "توزيع وجبات على الأسر المحتاجة",
  },
];

// ─── Transactions ─────────────────────────────────────────────────────────────
// 6 months: November 2025 → April 2026

const transactions = [
  {
    id: "tr-nov-001",
    type: TransactionType.INCOME,
    amount: "8200.00",
    date: new Date("2025-11-01"),
    descriptionAr: "تبرعات شهرية — نوفمبر 2025",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
    notes: "تحصيل تبرعات 8 متبرعين",
  },
  {
    id: "tr-nov-002",
    type: TransactionType.EXPENSE,
    amount: "4800.00",
    date: new Date("2025-11-05"),
    descriptionAr: "شراء مواد غذائية — نوفمبر 2025",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
  },
  {
    id: "tr-nov-003",
    type: TransactionType.EXPENSE,
    amount: "2300.00",
    date: new Date("2025-11-10"),
    descriptionAr: "توزيع وجبات — نوفمبر 2025",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
  },
  {
    id: "tr-nov-004",
    type: TransactionType.INCOME,
    amount: "3000.00",
    date: new Date("2025-11-15"),
    descriptionAr: "تبرع إضافي من أحد المحسنين",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "تبرع خاص لشراء مواد غذائية",
  },
  {
    id: "tr-nov-005",
    type: TransactionType.EXPENSE,
    amount: "800.00",
    date: new Date("2025-11-20"),
    descriptionAr: "مصاريف إدارية — نوفمبر",
    categoryId: "exp-مصاريف إدارية",
    paymentMethod: PaymentMethod.CASH,
  },

  {
    id: "tr-dec-001",
    type: TransactionType.INCOME,
    amount: "8000.00",
    date: new Date("2025-12-01"),
    descriptionAr: "تبرعات شهرية — ديسمبر 2025",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
  },
  {
    id: "tr-dec-002",
    type: TransactionType.EXPENSE,
    amount: "5200.00",
    date: new Date("2025-12-05"),
    descriptionAr: "شراء مواد غذائية — ديسمبر 2025",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
    notes: "زيادة الكمية بسبب شهر رمضان",
  },
  {
    id: "tr-dec-003",
    type: TransactionType.EXPENSE,
    amount: "2800.00",
    date: new Date("2025-12-10"),
    descriptionAr: "توزيع وجبات — ديسمبر 2025",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
  },
  {
    id: "tr-dec-004",
    type: TransactionType.INCOME,
    amount: "5000.00",
    date: new Date("2025-12-20"),
    descriptionAr: "تبرع إضافي — حملة رمضان",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "حملة تبرعات رمضان",
  },
  {
    id: "tr-dec-005",
    type: TransactionType.EXPENSE,
    amount: "600.00",
    date: new Date("2025-12-25"),
    descriptionAr: "تكاليف نقل وتوصيل",
    categoryId: "exp-نقل وتوصيل",
    paymentMethod: PaymentMethod.CASH,
  },

  {
    id: "tr-jan-001",
    type: TransactionType.INCOME,
    amount: "8500.00",
    date: new Date("2026-01-01"),
    descriptionAr: "تبرعات شهرية — يناير 2026",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
    notes: "تحصيل كامل + متبرع جديد",
  },
  {
    id: "tr-jan-002",
    type: TransactionType.EXPENSE,
    amount: "4900.00",
    date: new Date("2026-01-05"),
    descriptionAr: "شراء مواد غذائية — يناير 2026",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
  },
  {
    id: "tr-jan-003",
    type: TransactionType.EXPENSE,
    amount: "2400.00",
    date: new Date("2026-01-10"),
    descriptionAr: "توزيع وجبات — يناير 2026",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
  },
  {
    id: "tr-jan-004",
    type: TransactionType.EXPENSE,
    amount: "700.00",
    date: new Date("2026-01-15"),
    descriptionAr: "مصاريف إدارية — يناير",
    categoryId: "exp-مصاريف إدارية",
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: "tr-jan-005",
    type: TransactionType.INCOME,
    amount: "2000.00",
    date: new Date("2026-01-20"),
    descriptionAr: "تبرع إضافي — شركة أمل",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "تبرع شهري من شركة أمل للتجارة",
  },

  {
    id: "tr-feb-001",
    type: TransactionType.INCOME,
    amount: "8000.00",
    date: new Date("2026-02-01"),
    descriptionAr: "تبرعات شهرية — فبراير 2026",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
  },
  {
    id: "tr-feb-002",
    type: TransactionType.EXPENSE,
    amount: "5100.00",
    date: new Date("2026-02-05"),
    descriptionAr: "شراء مواد غذائية — فبراير 2026",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
  },
  {
    id: "tr-feb-003",
    type: TransactionType.EXPENSE,
    amount: "2600.00",
    date: new Date("2026-02-10"),
    descriptionAr: "توزيع وجبات — فبراير 2026",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
  },
  {
    id: "tr-feb-004",
    type: TransactionType.EXPENSE,
    amount: "900.00",
    date: new Date("2026-02-15"),
    descriptionAr: "نقل وتوصيل مواد غذائية",
    categoryId: "exp-نقل وتوصيل",
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: "tr-feb-005",
    type: TransactionType.INCOME,
    amount: "1500.00",
    date: new Date("2026-02-25"),
    descriptionAr: "تبرع إضافي — حملة شتوية",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
  },

  {
    id: "tr-mar-001",
    type: TransactionType.INCOME,
    amount: "9000.00",
    date: new Date("2026-03-01"),
    descriptionAr: "تبرعات شهرية — مارس 2026",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
    notes: "تحصيل كامل + متبرع إضافي",
  },
  {
    id: "tr-mar-002",
    type: TransactionType.EXPENSE,
    amount: "5500.00",
    date: new Date("2026-03-05"),
    descriptionAr: "شراء مواد غذائية — مارس 2026",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
  },
  {
    id: "tr-mar-003",
    type: TransactionType.EXPENSE,
    amount: "3000.00",
    date: new Date("2026-03-10"),
    descriptionAr: "توزيع وجبات — مارس 2026",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
    notes: "توزيع على 50 أسرة",
  },
  {
    id: "tr-mar-004",
    type: TransactionType.INCOME,
    amount: "7500.00",
    date: new Date("2026-03-15"),
    descriptionAr: "تبرع إضافي — وقف الخير",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "تبرع كبير من وقف الخير",
  },
  {
    id: "tr-mar-005",
    type: TransactionType.EXPENSE,
    amount: "400.00",
    date: new Date("2026-03-20"),
    descriptionAr: "مصاريف إدارية — مارس",
    categoryId: "exp-مصاريف إدارية",
    paymentMethod: PaymentMethod.CASH,
  },

  {
    id: "tr-apr-001",
    type: TransactionType.INCOME,
    amount: "8000.00",
    date: new Date("2026-04-01"),
    descriptionAr: "تبرعات شهرية — أبريل 2026",
    categoryId: "inc-تبرع شهري",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-monthly-donations",
  },
  {
    id: "tr-apr-002",
    type: TransactionType.EXPENSE,
    amount: "4800.00",
    date: new Date("2026-04-05"),
    descriptionAr: "شراء مواد غذائية — أبريل 2026",
    categoryId: "exp-مواد غذائية",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-purchase",
  },
  {
    id: "tr-apr-003",
    type: TransactionType.EXPENSE,
    amount: "2500.00",
    date: new Date("2026-04-10"),
    descriptionAr: "توزيع وجبات — أبريل 2026",
    categoryId: "exp-توزيع طعام",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-food-distribution",
  },
  {
    id: "tr-apr-004",
    type: TransactionType.EXPENSE,
    amount: "1200.00",
    date: new Date("2026-04-12"),
    descriptionAr: "نقل وتوصيل — أبريل 2026",
    categoryId: "exp-نقل وتوصيل",
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: "tr-apr-005",
    type: TransactionType.INCOME,
    amount: "3500.00",
    date: new Date("2026-04-15"),
    descriptionAr: "تبرع إضافي — حملة إفطار صائم",
    categoryId: "inc-تبرع إضافي",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "حملة تبرعات إفطار صائم",
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Categories
  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `inc-${cat.nameAr}` },
      update: {},
      create: {
        id: `inc-${cat.nameAr}`,
        nameAr: cat.nameAr,
        type: TransactionType.INCOME,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    });
  }
  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `exp-${cat.nameAr}` },
      update: {},
      create: {
        id: `exp-${cat.nameAr}`,
        nameAr: cat.nameAr,
        type: TransactionType.EXPENSE,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    });
  }
  console.log("✅ Categories seeded");

  // 2. Admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn("⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin user");
  } else {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      console.log("ℹ️  Admin user already exists, skipping");
    } else {
      await auth.api.signUpEmail({
        body: { name: "المشرف", email: adminEmail, password: adminPassword },
      });
      console.log("✅ Admin user created");
    }
  }

  // 3. Recurring items
  for (const item of recurringItems) {
    await prisma.recurringItem.upsert({
      where: { id: item.id },
      update: {
        lastGeneratedMonth: item.lastGeneratedMonth,
        lastGeneratedYear: item.lastGeneratedYear,
      },
      create: {
        id: item.id,
        nameAr: item.nameAr,
        type: item.type,
        amount: item.amount,
        categoryId: item.categoryId,
        dayOfMonth: item.dayOfMonth,
        startDate: item.startDate,
        isActive: item.isActive,
        lastGeneratedMonth: item.lastGeneratedMonth,
        lastGeneratedYear: item.lastGeneratedYear,
        notes: item.notes,
      },
    });
  }
  console.log("✅ Recurring items seeded");

  // 4. Transactions
  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: {
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        descriptionAr: tx.descriptionAr,
        categoryId: tx.categoryId,
        paymentMethod: tx.paymentMethod,
        recurringItemId: tx.recurringItemId ?? null,
        notes: tx.notes ?? null,
      },
    });
  }
  console.log(`✅ ${transactions.length} transactions seeded`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
