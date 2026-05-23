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
  { nameAr: "اشتراكات شهرية", icon: "🏠", color: "#00C2A8" },
  { nameAr: "إيجار المرافق", icon: "🔌", color: "#00C2A8" },
  { nameAr: "غرامات تأخير", icon: "⚠️", color: "#F59E0B" },
  { nameAr: "تبرعات", icon: "🤝", color: "#8B5CF6" },
  { nameAr: "إيرادات أخرى", icon: "💰", color: "#6B7280" },
];

const expenseCategories = [
  { nameAr: "صيانة عامة", icon: "🔧", color: "#F04E4E" },
  { nameAr: "نظافة", icon: "🧹", color: "#10B981" },
  { nameAr: "كهرباء", icon: "💡", color: "#F59E0B" },
  { nameAr: "مياه", icon: "💧", color: "#3B82F6" },
  { nameAr: "أمن وحراسة", icon: "🛡️", color: "#6366F1" },
  { nameAr: "مصعد", icon: "🛗", color: "#8B5CF6" },
  { nameAr: "إدارة وأعمال ورقية", icon: "📋", color: "#EC4899" },
  { nameAr: "صندوق الطوارئ", icon: "🚨", color: "#EF4444" },
  { nameAr: "مصروفات أخرى", icon: "📦", color: "#6B7280" },
];

// ─── Recurring Items ──────────────────────────────────────────────────────────

const recurringItems = [
  {
    id: "rec-subscriptions",
    nameAr: "اشتراكات الملاك الشهرية",
    type: TransactionType.INCOME,
    amount: "10500.00",
    categoryId: "inc-اشتراكات شهرية",
    dayOfMonth: 5,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "اشتراكات 21 مالكاً بمعدل 500 ج.م للوحدة",
  },
  {
    id: "rec-cleaning",
    nameAr: "خدمة نظافة شهرية",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    categoryId: "exp-نظافة",
    dayOfMonth: 1,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "شركة النظافة الذهبية",
  },
  {
    id: "rec-security",
    nameAr: "حراسة أمنية شهرية",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    categoryId: "exp-أمن وحراسة",
    dayOfMonth: 1,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "شركة الأمن والحراسة الموحدة — حارسان",
  },
  {
    id: "rec-elevator",
    nameAr: "صيانة مصعد شهرية",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    categoryId: "exp-مصعد",
    dayOfMonth: 15,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "عقد صيانة مع شركة أوتيس",
  },
  {
    id: "rec-electricity",
    nameAr: "فاتورة كهرباء المناطق المشتركة",
    type: TransactionType.EXPENSE,
    amount: "2800.00",
    categoryId: "exp-كهرباء",
    dayOfMonth: 10,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "كهرباء الردهة والأدوار المشتركة والمضخات",
  },
  {
    id: "rec-water",
    nameAr: "فاتورة مياه مشتركة",
    type: TransactionType.EXPENSE,
    amount: "900.00",
    categoryId: "exp-مياه",
    dayOfMonth: 10,
    startDate: new Date("2025-11-01"),
    isActive: true,
    lastGeneratedMonth: 4,
    lastGeneratedYear: 2026,
    notes: "مياه المناطق العامة وخزانات السطح",
  },
];

// ─── Transactions ─────────────────────────────────────────────────────────────
// 6 months: November 2025 → April 2026

const transactions = [
  // ── November 2025 ──────────────────────────────────────────────────────────
  {
    id: "tr-nov-001",
    type: TransactionType.INCOME,
    amount: "10200.00",
    date: new Date("2025-11-05"),
    descriptionAr: "اشتراكات الملاك — نوفمبر 2025",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل 20 وحدة من أصل 21",
  },
  {
    id: "tr-nov-002",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2025-11-01"),
    descriptionAr: "نظافة شهرية — نوفمبر 2025",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-nov-003",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2025-11-01"),
    descriptionAr: "حراسة أمنية — نوفمبر 2025",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-nov-004",
    type: TransactionType.EXPENSE,
    amount: "2750.00",
    date: new Date("2025-11-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — نوفمبر 2025",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
  },
  {
    id: "tr-nov-005",
    type: TransactionType.EXPENSE,
    amount: "900.00",
    date: new Date("2025-11-10"),
    descriptionAr: "فاتورة مياه مشتركة — نوفمبر 2025",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-nov-006",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    date: new Date("2025-11-15"),
    descriptionAr: "صيانة مصعد — نوفمبر 2025",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
  },
  {
    id: "tr-nov-007",
    type: TransactionType.INCOME,
    amount: "800.00",
    date: new Date("2025-11-18"),
    descriptionAr: "إيجار موقف سيارة إضافي — مالك 5B",
    categoryId: "inc-إيجار المرافق",
    paymentMethod: PaymentMethod.CASH,
  },

  // ── December 2025 ──────────────────────────────────────────────────────────
  {
    id: "tr-dec-001",
    type: TransactionType.INCOME,
    amount: "9800.00",
    date: new Date("2025-12-05"),
    descriptionAr: "اشتراكات الملاك — ديسمبر 2025",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل جزئي — وحدتان متأخرتان",
  },
  {
    id: "tr-dec-002",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2025-12-01"),
    descriptionAr: "نظافة شهرية — ديسمبر 2025",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-dec-003",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2025-12-01"),
    descriptionAr: "حراسة أمنية — ديسمبر 2025",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-dec-004",
    type: TransactionType.EXPENSE,
    amount: "3400.00",
    date: new Date("2025-12-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — ديسمبر 2025",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
    notes: "ارتفاع الاستهلاك بسبب التدفئة في الشتاء",
  },
  {
    id: "tr-dec-005",
    type: TransactionType.EXPENSE,
    amount: "960.00",
    date: new Date("2025-12-10"),
    descriptionAr: "فاتورة مياه مشتركة — ديسمبر 2025",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-dec-006",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    date: new Date("2025-12-15"),
    descriptionAr: "صيانة مصعد — ديسمبر 2025",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
  },
  {
    id: "tr-dec-007",
    type: TransactionType.EXPENSE,
    amount: "350.00",
    date: new Date("2025-12-20"),
    descriptionAr: "طباعة إشعارات وأوراق إدارية",
    categoryId: "exp-إدارة وأعمال ورقية",
    paymentMethod: PaymentMethod.CASH,
    notes: "إشعارات نهاية العام للملاك",
  },
  {
    id: "tr-dec-008",
    type: TransactionType.INCOME,
    amount: "300.00",
    date: new Date("2025-12-28"),
    descriptionAr: "غرامة تأخير — مالك 11A",
    categoryId: "inc-غرامات تأخير",
    paymentMethod: PaymentMethod.CASH,
    notes: "تأخر في سداد اشتراكات أكتوبر ونوفمبر",
  },

  // ── January 2026 ───────────────────────────────────────────────────────────
  {
    id: "tr-jan-001",
    type: TransactionType.INCOME,
    amount: "10500.00",
    date: new Date("2026-01-05"),
    descriptionAr: "اشتراكات الملاك — يناير 2026",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل كامل — 21 وحدة",
  },
  {
    id: "tr-jan-002",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2026-01-01"),
    descriptionAr: "نظافة شهرية — يناير 2026",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-jan-003",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2026-01-01"),
    descriptionAr: "حراسة أمنية — يناير 2026",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-jan-004",
    type: TransactionType.EXPENSE,
    amount: "2650.00",
    date: new Date("2026-01-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — يناير 2026",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
  },
  {
    id: "tr-jan-005",
    type: TransactionType.EXPENSE,
    amount: "880.00",
    date: new Date("2026-01-10"),
    descriptionAr: "فاتورة مياه مشتركة — يناير 2026",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-jan-006",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    date: new Date("2026-01-15"),
    descriptionAr: "صيانة مصعد — يناير 2026",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
  },
  {
    id: "tr-jan-007",
    type: TransactionType.EXPENSE,
    amount: "850.00",
    date: new Date("2026-01-20"),
    descriptionAr: "صيانة ضخة المياه الرئيسية",
    categoryId: "exp-صيانة عامة",
    paymentMethod: PaymentMethod.CASH,
    notes: "استبدال قطعة في ضخة السطح",
  },
  {
    id: "tr-jan-008",
    type: TransactionType.INCOME,
    amount: "200.00",
    date: new Date("2026-01-25"),
    descriptionAr: "غرامة تأخير — مالك 12B",
    categoryId: "inc-غرامات تأخير",
    paymentMethod: PaymentMethod.CASH,
  },

  // ── February 2026 ──────────────────────────────────────────────────────────
  {
    id: "tr-feb-001",
    type: TransactionType.INCOME,
    amount: "9500.00",
    date: new Date("2026-02-05"),
    descriptionAr: "اشتراكات الملاك — فبراير 2026",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل 19 وحدة — وحدتان في انتظار السداد",
  },
  {
    id: "tr-feb-002",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2026-02-01"),
    descriptionAr: "نظافة شهرية — فبراير 2026",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-feb-003",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2026-02-01"),
    descriptionAr: "حراسة أمنية — فبراير 2026",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-feb-004",
    type: TransactionType.EXPENSE,
    amount: "3120.00",
    date: new Date("2026-02-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — فبراير 2026",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
  },
  {
    id: "tr-feb-005",
    type: TransactionType.EXPENSE,
    amount: "920.00",
    date: new Date("2026-02-10"),
    descriptionAr: "فاتورة مياه مشتركة — فبراير 2026",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-feb-006",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    date: new Date("2026-02-15"),
    descriptionAr: "صيانة مصعد — فبراير 2026",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
  },
  {
    id: "tr-feb-007",
    type: TransactionType.EXPENSE,
    amount: "450.00",
    date: new Date("2026-02-08"),
    descriptionAr: "استبدال لمبات LED في الردهة والأدوار",
    categoryId: "exp-صيانة عامة",
    paymentMethod: PaymentMethod.CASH,
    notes: "24 لمبة LED موفرة للطاقة",
  },
  {
    id: "tr-feb-008",
    type: TransactionType.INCOME,
    amount: "1200.00",
    date: new Date("2026-02-22"),
    descriptionAr: "إيجار مولد كهربائي احتياطي",
    categoryId: "inc-إيجار المرافق",
    paymentMethod: PaymentMethod.CASH,
    notes: "إيجار شهري للمولد الاحتياطي",
  },

  // ── March 2026 ─────────────────────────────────────────────────────────────
  {
    id: "tr-mar-001",
    type: TransactionType.INCOME,
    amount: "11000.00",
    date: new Date("2026-03-05"),
    descriptionAr: "اشتراكات الملاك — مارس 2026",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل كامل + سداد متأخرات وحدتين",
  },
  {
    id: "tr-mar-002",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2026-03-01"),
    descriptionAr: "نظافة شهرية — مارس 2026",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-mar-003",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2026-03-01"),
    descriptionAr: "حراسة أمنية — مارس 2026",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-mar-004",
    type: TransactionType.EXPENSE,
    amount: "2980.00",
    date: new Date("2026-03-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — مارس 2026",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
  },
  {
    id: "tr-mar-005",
    type: TransactionType.EXPENSE,
    amount: "860.00",
    date: new Date("2026-03-10"),
    descriptionAr: "فاتورة مياه مشتركة — مارس 2026",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-mar-006",
    type: TransactionType.EXPENSE,
    amount: "1800.00",
    date: new Date("2026-03-15"),
    descriptionAr: "صيانة مصعد — مارس 2026 (صيانة دورية موسعة)",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
    notes: "فحص شامل ربع سنوي وتزييت كامل",
  },
  {
    id: "tr-mar-007",
    type: TransactionType.EXPENSE,
    amount: "3200.00",
    date: new Date("2026-03-12"),
    descriptionAr: "إصلاح تسريب السطح — طوارئ",
    categoryId: "exp-صندوق الطوارئ",
    paymentMethod: PaymentMethod.CASH,
    notes: "تسريب مياه أمطار أسفر عن ضرر في السقف",
  },
  {
    id: "tr-mar-008",
    type: TransactionType.EXPENSE,
    amount: "2500.00",
    date: new Date("2026-03-20"),
    descriptionAr: "دهان وطلاء الردهة الرئيسية",
    categoryId: "exp-صيانة عامة",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "طلاء كامل للردهة والأدوار 1-3",
  },
  {
    id: "tr-mar-009",
    type: TransactionType.INCOME,
    amount: "5000.00",
    date: new Date("2026-03-28"),
    descriptionAr: "تبرع من أحد الملاك لتطوير المبنى",
    categoryId: "inc-تبرعات",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "تبرع كريم من المالك / الدور 8",
  },

  // ── April 2026 (up to the 16th) ────────────────────────────────────────────
  {
    id: "tr-apr-001",
    type: TransactionType.EXPENSE,
    amount: "2200.00",
    date: new Date("2026-04-01"),
    descriptionAr: "نظافة شهرية — أبريل 2026",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-cleaning",
  },
  {
    id: "tr-apr-002",
    type: TransactionType.EXPENSE,
    amount: "3800.00",
    date: new Date("2026-04-01"),
    descriptionAr: "حراسة أمنية — أبريل 2026",
    categoryId: "exp-أمن وحراسة",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-security",
  },
  {
    id: "tr-apr-003",
    type: TransactionType.INCOME,
    amount: "150.00",
    date: new Date("2026-04-03"),
    descriptionAr: "غرامة تأخير — مالك 7A",
    categoryId: "inc-غرامات تأخير",
    paymentMethod: PaymentMethod.CASH,
  },
  {
    id: "tr-apr-004",
    type: TransactionType.INCOME,
    amount: "10500.00",
    date: new Date("2026-04-05"),
    descriptionAr: "اشتراكات الملاك — أبريل 2026",
    categoryId: "inc-اشتراكات شهرية",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-subscriptions",
    notes: "تحصيل 21 وحدة — كامل الشهر",
  },
  {
    id: "tr-apr-005",
    type: TransactionType.EXPENSE,
    amount: "2450.00",
    date: new Date("2026-04-10"),
    descriptionAr: "فاتورة كهرباء مشتركة — أبريل 2026",
    categoryId: "exp-كهرباء",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-electricity",
  },
  {
    id: "tr-apr-006",
    type: TransactionType.EXPENSE,
    amount: "790.00",
    date: new Date("2026-04-10"),
    descriptionAr: "فاتورة مياه مشتركة — أبريل 2026",
    categoryId: "exp-مياه",
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    recurringItemId: "rec-water",
  },
  {
    id: "tr-apr-007",
    type: TransactionType.EXPENSE,
    amount: "1500.00",
    date: new Date("2026-04-15"),
    descriptionAr: "صيانة مصعد — أبريل 2026",
    categoryId: "exp-مصعد",
    paymentMethod: PaymentMethod.CASH,
    recurringItemId: "rec-elevator",
  },
  {
    id: "tr-apr-008",
    type: TransactionType.EXPENSE,
    amount: "620.00",
    date: new Date("2026-04-14"),
    descriptionAr: "شراء أدوات نظافة ومواد تعقيم",
    categoryId: "exp-نظافة",
    paymentMethod: PaymentMethod.CASH,
    notes: "مستلزمات الربع الثاني",
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
