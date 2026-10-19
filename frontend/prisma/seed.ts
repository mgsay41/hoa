import "dotenv/config";
import { PrismaClient, type Prisma } from "../app/generated/prisma/client";
import { PaymentMethod, TransactionType } from "../app/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { arabicMonths } from "../lib/utils";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

// Sample data covers 12 months: November 2025 → October 2026 (up to the 19th).
// Every row has a fixed id and is inserted with skipDuplicates, so re-running is safe.
const SEED_MONTHS: { year: number; month: number }[] = Array.from({ length: 12 }, (_, i) => {
  const m = 10 + i; // 0-based month index starting at Nov 2025
  return { year: 2025 + Math.floor(m / 12), month: (m % 12) + 1 };
});
const TODAY = new Date(Date.UTC(2026, 9, 19));

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));
const period = (year: number, month: number) => `${arabicMonths[month - 1]} ${year}`;
const key = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

// Deterministic pseudo-random numbers so every seed run produces the same data
let rngState = 20251101;
function rand() {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
}
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];

// ─── Categories ──────────────────────────────────────────────────────────────

const incomeCategories = [
  { nameAr: "اشتراكات شهرية", icon: "🏠", color: "#00C2A8" },
  { nameAr: "إيجار المرافق", icon: "🔌", color: "#0EA5E9" },
  { nameAr: "غرامات تأخير", icon: "⚠️", color: "#F59E0B" },
  { nameAr: "تبرعات", icon: "🤝", color: "#8B5CF6" },
  { nameAr: "إيرادات أخرى", icon: "💰", color: "#6B7280" },
];

const expenseCategories: { nameAr: string; icon: string; color: string; monthlyBudget?: string }[] = [
  { nameAr: "صيانة عامة", icon: "🔧", color: "#F04E4E", monthlyBudget: "1500" },
  { nameAr: "نظافة", icon: "🧹", color: "#10B981", monthlyBudget: "2600" },
  { nameAr: "كهرباء", icon: "💡", color: "#F59E0B", monthlyBudget: "3000" },
  { nameAr: "مياه", icon: "💧", color: "#3B82F6", monthlyBudget: "1000" },
  { nameAr: "أمن وحراسة", icon: "🛡️", color: "#6366F1", monthlyBudget: "3800" },
  { nameAr: "مصعد", icon: "🛗", color: "#8B5CF6", monthlyBudget: "1600" },
  { nameAr: "إدارة وأعمال ورقية", icon: "📋", color: "#EC4899", monthlyBudget: "400" },
  { nameAr: "صندوق الطوارئ", icon: "🚨", color: "#EF4444" },
  { nameAr: "مصروفات أخرى", icon: "📦", color: "#6B7280", monthlyBudget: "500" },
];

const inc = (name: string) => `inc-${name}`;
const exp = (name: string) => `exp-${name}`;

// ─── Units: 7 floors × A/B/C ─────────────────────────────────────────────────

const ownerNames = [
  "أحمد عبد الرحمن", "منى السيد", "خالد إبراهيم", "سارة فؤاد", "محمد عادل", "هالة حسين", "عمرو شاكر",
  "نادية كمال", "ياسر عبد الله", "رانيا مصطفى", "طارق سليمان", "إيمان رشدي", "حسام الدين علي", "دينا صبري",
  "شريف نبيل", "مها عبد العزيز", "وليد فتحي", "ريم أنور", "إسلام توفيق", "نهى جلال", "كريم مجدي",
];
const FEE_BY_SIDE: Record<string, number> = { A: 700, B: 650, C: 600 };

const units = Array.from({ length: 21 }, (_, i) => {
  const floor = Math.floor(i / 3) + 1;
  const side = ["A", "B", "C"][i % 3];
  const code = `${floor}${side}`;
  return {
    id: `unit-${code}`,
    code,
    floor,
    ownerName: ownerNames[i],
    monthlyFee: FEE_BY_SIDE[side],
    // 1C changed hands and started paying in January 2026
    duesStartDate: code === "1C" ? utc(2026, 1, 1) : utc(2025, 11, 1),
  };
});

/**
 * How each unit pays. Returns, for a given due month, the payment date and amount —
 * or null if that month is (still) unpaid.
 */
function duesPayment(code: string, fee: number, year: number, month: number) {
  const k = key(year, month);
  const onTime = () => ({ date: utc(year, month, 2 + Math.floor(rand() * 8)), amount: fee });
  const paidLater = (y: number, m: number, day: number) => ({ date: utc(y, m, day), amount: fee });

  if (code === "1C" && k < "2026-01") return null;
  // 2B always pays one month late, together with the next month
  if (code === "2B") {
    if (k === "2026-10") return null;
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    return paidLater(next.y, next.m, 6);
  }
  // 4C skipped Feb–Mar 2026 and settled both in April
  if (code === "4C" && (k === "2026-02" || k === "2026-03")) return paidLater(2026, 4, 12);
  // 3A paid only half of August
  if (code === "3A" && k === "2026-08") return { date: utc(2026, 8, 9), amount: fee / 2 };
  // 6A hasn't paid September or October
  if (code === "6A" && (k === "2026-09" || k === "2026-10")) return null;
  // 7B stopped paying from July 2026
  if (code === "7B" && k >= "2026-07") return null;
  // Current month: a few units haven't paid yet
  if (k === "2026-10" && ["1B", "3C", "5A", "5C"].includes(code)) return null;
  return onTime();
}

// ─── Recurring items ─────────────────────────────────────────────────────────

const recurringItems = [
  { id: "rec-cleaning", nameAr: "خدمة نظافة شهرية", type: TransactionType.EXPENSE, amount: 2200, categoryId: exp("نظافة"), dayOfMonth: 1, start: utc(2025, 11, 1), notes: "شركة النظافة الذهبية" },
  { id: "rec-security", nameAr: "حراسة أمنية شهرية", type: TransactionType.EXPENSE, amount: 3800, categoryId: exp("أمن وحراسة"), dayOfMonth: 1, start: utc(2025, 11, 1), notes: "شركة الأمن الموحدة — حارسان" },
  { id: "rec-electricity", nameAr: "فاتورة كهرباء المناطق المشتركة", type: TransactionType.EXPENSE, amount: 2800, categoryId: exp("كهرباء"), dayOfMonth: 10, start: utc(2025, 11, 1), notes: "الردهة والسلالم والمضخات" },
  { id: "rec-water", nameAr: "فاتورة مياه مشتركة", type: TransactionType.EXPENSE, amount: 900, categoryId: exp("مياه"), dayOfMonth: 10, start: utc(2025, 11, 1), notes: "مياه المناطق العامة وخزانات السطح" },
  { id: "rec-elevator", nameAr: "صيانة مصعد شهرية", type: TransactionType.EXPENSE, amount: 1500, categoryId: exp("مصعد"), dayOfMonth: 15, start: utc(2025, 11, 1), notes: "عقد صيانة سنوي" },
  { id: "rec-tower", nameAr: "إيجار سطح لبرج اتصالات", type: TransactionType.INCOME, amount: 1500, categoryId: inc("إيجار المرافق"), dayOfMonth: 5, start: utc(2026, 1, 1), notes: "عقد لمدة ٣ سنوات" },
];

// Paused item — shows the "inactive" state and that resuming doesn't back-fill
const pausedItem = { id: "rec-generator", nameAr: "إيجار مولد احتياطي", type: TransactionType.INCOME, amount: 1200, categoryId: inc("إيجار المرافق"), dayOfMonth: 8, start: utc(2026, 2, 1), lastMonth: 5, notes: "متوقف منذ يونيو بعد انتهاء العقد" };

// Bills that vary month to month (summer A/C load on pumps & lobby)
const electricityByMonth: Record<string, number> = {
  "2025-11": 2750, "2025-12": 3150, "2026-01": 3020, "2026-02": 2880, "2026-03": 2740, "2026-04": 2610,
  "2026-05": 2950, "2026-06": 3380, "2026-07": 3620, "2026-08": 3540, "2026-09": 3110, "2026-10": 2860,
};
const waterByMonth: Record<string, number> = {
  "2025-11": 900, "2025-12": 860, "2026-01": 840, "2026-02": 870, "2026-03": 910, "2026-04": 930,
  "2026-05": 980, "2026-06": 1060, "2026-07": 1120, "2026-08": 1090, "2026-09": 990, "2026-10": 940,
};

// ─── One-off transactions ────────────────────────────────────────────────────

type OneOff = {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  descriptionAr: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  fund?: "OPERATING" | "RESERVE";
  notes?: string;
};

const I = TransactionType.INCOME;
const E = TransactionType.EXPENSE;
const { CASH, BANK_TRANSFER, CHECK, OTHER } = PaymentMethod;

const oneOffs: OneOff[] = [
  { id: "tr-opening", type: I, amount: 25000, date: utc(2025, 11, 1), descriptionAr: "رصيد افتتاحي محوّل من الإدارة السابقة", categoryId: inc("إيرادات أخرى"), paymentMethod: BANK_TRANSFER, notes: "حسب محضر التسليم" },
  { id: "tr-nov-parking", type: I, amount: 800, date: utc(2025, 11, 18), descriptionAr: "إيجار موقف سيارة إضافي — وحدة 5B", categoryId: inc("إيجار المرافق"), paymentMethod: CASH },
  { id: "tr-dec-print", type: E, amount: 350, date: utc(2025, 12, 20), descriptionAr: "طباعة إشعارات وأوراق إدارية", categoryId: exp("إدارة وأعمال ورقية"), paymentMethod: CASH, notes: "إشعارات نهاية العام للملاك" },
  { id: "tr-dec-fine", type: I, amount: 300, date: utc(2025, 12, 28), descriptionAr: "غرامة تأخير — وحدة 2B", categoryId: inc("غرامات تأخير"), paymentMethod: CASH },
  { id: "tr-jan-pump", type: E, amount: 850, date: utc(2026, 1, 20), descriptionAr: "صيانة مضخة المياه الرئيسية", categoryId: exp("صيانة عامة"), paymentMethod: CASH, notes: "استبدال جوان وتنظيف" },
  { id: "tr-feb-led", type: E, amount: 450, date: utc(2026, 2, 8), descriptionAr: "استبدال لمبات LED في الردهة والأدوار", categoryId: exp("صيانة عامة"), paymentMethod: CASH, notes: "24 لمبة موفرة للطاقة" },
  { id: "tr-mar-roof", type: E, amount: 3200, date: utc(2026, 3, 12), descriptionAr: "إصلاح تسريب السطح — طوارئ", categoryId: exp("صندوق الطوارئ"), paymentMethod: CASH, fund: "RESERVE", notes: "تسرب مياه أمطار إلى سقف الدور السابع" },
  { id: "tr-mar-paint", type: E, amount: 2500, date: utc(2026, 3, 20), descriptionAr: "دهان الردهة الرئيسية", categoryId: exp("صيانة عامة"), paymentMethod: BANK_TRANSFER },
  { id: "tr-mar-donation", type: I, amount: 5000, date: utc(2026, 3, 28), descriptionAr: "تبرع من أحد الملاك لتطوير المدخل", categoryId: inc("تبرعات"), paymentMethod: BANK_TRANSFER },
  { id: "tr-apr-supplies", type: E, amount: 620, date: utc(2026, 4, 14), descriptionAr: "أدوات نظافة ومواد تعقيم", categoryId: exp("نظافة"), paymentMethod: CASH },
  { id: "tr-apr-fine", type: I, amount: 200, date: utc(2026, 4, 12), descriptionAr: "غرامة تأخير — وحدة 4C", categoryId: inc("غرامات تأخير"), paymentMethod: CASH, notes: "تأخر سداد فبراير ومارس" },
  { id: "tr-may-fire", type: E, amount: 1350, date: utc(2026, 5, 7), descriptionAr: "إعادة تعبئة طفايات الحريق", categoryId: exp("صيانة عامة"), paymentMethod: CHECK, notes: "12 طفاية — شيك رقم 10234" },
  { id: "tr-may-intercom", type: E, amount: 700, date: utc(2026, 5, 22), descriptionAr: "إصلاح الإنتركم الرئيسي", categoryId: exp("صيانة عامة"), paymentMethod: CASH },
  { id: "tr-jun-tanks", type: E, amount: 1800, date: utc(2026, 6, 9), descriptionAr: "تنظيف وتعقيم خزانات المياه", categoryId: exp("مياه"), paymentMethod: BANK_TRANSFER, notes: "تنظيف نصف سنوي" },
  { id: "tr-jun-garden", type: E, amount: 400, date: utc(2026, 6, 18), descriptionAr: "نباتات وأحواض للمدخل", categoryId: exp("مصروفات أخرى"), paymentMethod: CASH },
  { id: "tr-jul-elevator", type: E, amount: 4200, date: utc(2026, 7, 3), descriptionAr: "استبدال كارت تحكم المصعد", categoryId: exp("صندوق الطوارئ"), paymentMethod: CHECK, fund: "RESERVE", notes: "عطل مفاجئ — توقف المصعد يومين" },
  { id: "tr-jul-cctv", type: E, amount: 950, date: utc(2026, 7, 21), descriptionAr: "صيانة كاميرات المراقبة", categoryId: exp("أمن وحراسة"), paymentMethod: CASH },
  { id: "tr-aug-assembly", type: E, amount: 600, date: utc(2026, 8, 15), descriptionAr: "مصروفات الجمعية العمومية السنوية", categoryId: exp("إدارة وأعمال ورقية"), paymentMethod: CASH },
  { id: "tr-aug-pest", type: E, amount: 750, date: utc(2026, 8, 24), descriptionAr: "مكافحة حشرات للمبنى بالكامل", categoryId: exp("نظافة"), paymentMethod: OTHER, notes: "دُفع عبر إنستاباي" },
  { id: "tr-sep-stairs", type: E, amount: 3000, date: utc(2026, 9, 14), descriptionAr: "دهان السلالم من الدور 4 إلى 7", categoryId: exp("صيانة عامة"), paymentMethod: CHECK },
  { id: "tr-sep-donation", type: I, amount: 2000, date: utc(2026, 9, 26), descriptionAr: "تبرع لصندوق الطوارئ", categoryId: inc("تبرعات"), paymentMethod: BANK_TRANSFER, fund: "RESERVE" },
  { id: "tr-oct-motor", type: E, amount: 1600, date: utc(2026, 10, 6), descriptionAr: "إعادة لف موتور مضخة الحريق", categoryId: exp("صيانة عامة"), paymentMethod: CASH },
  { id: "tr-oct-supplies", type: E, amount: 680, date: utc(2026, 10, 13), descriptionAr: "أدوات نظافة ومواد تعقيم", categoryId: exp("نظافة"), paymentMethod: CASH },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Categories
  await prisma.category.createMany({
    data: [
      ...incomeCategories.map((c) => ({ id: inc(c.nameAr), ...c, type: I, isDefault: true })),
      ...expenseCategories.map((c) => ({ id: exp(c.nameAr), ...c, type: E, isDefault: true })),
    ],
    skipDuplicates: true,
  });
  console.log("✅ Categories");

  // 2. Units
  await prisma.unit.createMany({
    data: units.map((u) => ({
      id: u.id,
      code: u.code,
      floor: u.floor,
      ownerName: u.ownerName,
      monthlyFee: u.monthlyFee.toFixed(2),
      duesStartDate: u.duesStartDate,
    })),
    skipDuplicates: true,
  });
  console.log(`✅ ${units.length} units`);

  // 3. Recurring items
  await prisma.recurringItem.createMany({
    data: [
      ...recurringItems.map((r) => ({
        id: r.id,
        nameAr: r.nameAr,
        type: r.type,
        amount: r.amount.toFixed(2),
        categoryId: r.categoryId,
        dayOfMonth: r.dayOfMonth,
        startDate: r.start,
        isActive: true,
        lastGeneratedMonth: 10,
        lastGeneratedYear: 2026,
        notes: r.notes,
      })),
      {
        id: pausedItem.id,
        nameAr: pausedItem.nameAr,
        type: pausedItem.type,
        amount: pausedItem.amount.toFixed(2),
        categoryId: pausedItem.categoryId,
        dayOfMonth: pausedItem.dayOfMonth,
        startDate: pausedItem.start,
        isActive: false,
        lastGeneratedMonth: pausedItem.lastMonth,
        lastGeneratedYear: 2026,
        notes: pausedItem.notes,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Recurring items");

  // 4. Transactions
  const rows: Prisma.TransactionCreateManyInput[] = [];

  // 4a. Generated recurring transactions (one per item per month, like lib/recurring.ts creates them)
  for (const { year, month } of SEED_MONTHS) {
    const k = key(year, month);
    for (const r of recurringItems) {
      const date = utc(year, month, r.dayOfMonth);
      if (date < r.start || date > TODAY) continue;
      const amount =
        r.id === "rec-electricity" ? electricityByMonth[k] : r.id === "rec-water" ? waterByMonth[k] : r.amount;
      rows.push({
        id: `tr-${r.id}-${k}`,
        type: r.type,
        amount: amount.toFixed(2),
        date,
        descriptionAr: `${r.nameAr} — ${period(year, month)}`,
        categoryId: r.categoryId,
        paymentMethod: r.type === I || r.id === "rec-electricity" || r.id === "rec-water" ? BANK_TRANSFER : CASH,
        recurringItemId: r.id,
        periodMonth: month,
        periodYear: year,
      });
    }
    // Paused generator rent: Feb–May 2026 only
    if (k >= "2026-02" && k <= "2026-05") {
      rows.push({
        id: `tr-${pausedItem.id}-${k}`,
        type: I,
        amount: pausedItem.amount.toFixed(2),
        date: utc(year, month, pausedItem.dayOfMonth),
        descriptionAr: `${pausedItem.nameAr} — ${period(year, month)}`,
        categoryId: pausedItem.categoryId,
        paymentMethod: CASH,
        recurringItemId: pausedItem.id,
        periodMonth: month,
        periodYear: year,
      });
    }
  }

  // 4b. Unit dues
  for (const { year, month } of SEED_MONTHS) {
    for (const u of units) {
      const payment = duesPayment(u.code, u.monthlyFee, year, month);
      if (!payment || payment.date > TODAY) continue;
      rows.push({
        id: `tr-dues-${u.code}-${key(year, month)}`,
        type: I,
        amount: payment.amount.toFixed(2),
        date: payment.date,
        descriptionAr: `اشتراك شهري — وحدة ${u.code} — ${period(year, month)}`,
        categoryId: inc("اشتراكات شهرية"),
        paymentMethod: pick([CASH, CASH, BANK_TRANSFER, BANK_TRANSFER, BANK_TRANSFER, CHECK]),
        unitId: u.id,
        periodMonth: month,
        periodYear: year,
        notes: payment.amount < u.monthlyFee ? "سداد جزئي — المتبقي مستحق" : undefined,
      });
    }
  }

  // 4c. One-offs
  for (const t of oneOffs) {
    rows.push({ ...t, amount: t.amount.toFixed(2), fund: t.fund ?? "OPERATING" });
  }

  await prisma.transaction.createMany({ data: rows, skipDuplicates: true });
  console.log(`✅ ${rows.length} transactions`);

  // 5. Reserve fund: opening balance + 1,000 every month
  await prisma.fundTransfer.createMany({
    data: [
      { id: "ft-opening", direction: "TO_RESERVE", amount: "5000.00", date: utc(2025, 11, 2), notes: "رصيد افتتاحي لصندوق الطوارئ" },
      ...SEED_MONTHS.filter(({ year, month }) => utc(year, month, 25) <= TODAY).map(({ year, month }) => ({
        id: `ft-monthly-${key(year, month)}`,
        direction: "TO_RESERVE" as const,
        amount: "1000.00",
        date: utc(year, month, 25),
        notes: `تجنيب شهري — ${period(year, month)}`,
      })),
    ],
    skipDuplicates: true,
  });
  console.log("✅ Reserve fund transfers");

  // 6. A few audit entries so the public change log isn't empty
  await prisma.auditLog.createMany({
    data: [
      {
        id: "audit-1",
        action: "UPDATE",
        entity: "TRANSACTION",
        entityId: "tr-rec-electricity-2026-03",
        summary: "تعديل معاملة: فاتورة كهرباء المناطق المشتركة — مارس 2026",
        changes: { amount: { from: "2470.00", to: "2740.00" } },
        createdAt: new Date("2026-03-11T09:15:00Z"),
      },
      {
        id: "audit-2",
        action: "DELETE",
        entity: "TRANSACTION",
        entityId: "tr-dup-apr",
        summary: "حذف مصروف: أدوات نظافة ومواد تعقيم (620٫00 ج.م) — مُسجَّل مرتين بالخطأ",
        createdAt: new Date("2026-04-15T17:40:00Z"),
      },
      {
        id: "audit-3",
        action: "UPDATE",
        entity: "CATEGORY",
        entityId: exp("نظافة"),
        summary: "تعديل فئة: نظافة",
        changes: { monthlyBudget: { from: "2400.00", to: "2600.00" } },
        createdAt: new Date("2026-06-01T10:00:00Z"),
      },
      {
        id: "audit-4",
        action: "UPDATE",
        entity: "RECURRING",
        entityId: pausedItem.id,
        summary: `تعطيل بند متكرر: ${pausedItem.nameAr}`,
        changes: { isActive: { from: true, to: false } },
        createdAt: new Date("2026-06-02T08:30:00Z"),
      },
      {
        id: "audit-5",
        action: "CREATE",
        entity: "TRANSACTION",
        entityId: "tr-jul-elevator",
        summary: "إضافة مصروف: استبدال كارت تحكم المصعد (4٬200٫00 ج.م) — من صندوق الطوارئ",
        createdAt: new Date("2026-07-03T13:05:00Z"),
      },
      {
        id: "audit-6",
        action: "CREATE",
        entity: "TRANSACTION",
        entityId: "dues-2026-10",
        summary: "تسجيل اشتراكات أكتوبر 2026 لعدد 14 وحدة",
        createdAt: new Date("2026-10-09T18:20:00Z"),
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Audit log samples");

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
