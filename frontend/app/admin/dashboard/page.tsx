import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFundBalances } from "@/lib/funds";
import { getDuesLedger } from "@/lib/dues";
import { arabicMonths, formatAmount } from "@/lib/utils";
import { TrendBadge } from "@/components/states";

export const dynamic = "force-dynamic";

async function monthTotals(year: number, month: number) {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
    _sum: { amount: true },
  });
  const income = Number(rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);
  return { income, expense, net: income - expense };
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const [current, previous, funds, ledger, recurring, lastGenerated, budgetCats, spent, recentLogs] = await Promise.all([
    monthTotals(year, month),
    monthTotals(prevYear, prevMonth),
    getFundBalances(),
    getDuesLedger(year, now),
    prisma.recurringItem.findMany({ where: { isActive: true }, select: { lastGeneratedMonth: true, lastGeneratedYear: true, dayOfMonth: true } }),
    prisma.transaction.findFirst({ where: { recurringItemId: { not: null } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.category.findMany({ where: { type: "EXPENSE", monthlyBudget: { not: null } }, select: { id: true, nameAr: true, monthlyBudget: true } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "EXPENSE", date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
      _sum: { amount: true },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, action: true, summary: true, createdAt: true } }),
  ]);

  const unpaidThisMonth = ledger.units.filter((u) => {
    const m = u.months[month - 1];
    return m && (m.status === "DUE" || m.status === "LATE" || m.status === "PARTIAL");
  });
  const recurringPending = recurring.filter(
    (r) =>
      r.dayOfMonth <= now.getDate() &&
      !(r.lastGeneratedMonth === month && r.lastGeneratedYear === year)
  ).length;
  const overBudget = budgetCats.filter((c) => {
    const actual = Number(spent.find((s) => s.categoryId === c.id)?._sum.amount ?? 0);
    return actual > Number(c.monthlyBudget);
  });

  const alerts: { text: string; href: string; tone: "warning" | "expense" }[] = [];
  if (unpaidThisMonth.length > 0) {
    alerts.push({ text: `${unpaidThisMonth.length} وحدة لم تسدد اشتراك ${arabicMonths[month - 1]}`, href: "/admin/units/collect", tone: "warning" });
  }
  if (ledger.totals.unitsInArrears > 0) {
    alerts.push({ text: `متأخرات مستحقة على ${ledger.totals.unitsInArrears} وحدة بإجمالي ${formatAmount(ledger.totals.arrears)} ج.م`, href: "/admin/units", tone: "expense" });
  }
  if (recurringPending > 0) {
    alerts.push({ text: `${recurringPending} بند متكرر مستحق لم يُنشأ بعد هذا الشهر`, href: "/admin/recurring", tone: "warning" });
  }
  for (const c of overBudget) {
    alerts.push({ text: `تجاوز الميزانية الشهرية: ${c.nameAr}`, href: "/admin/categories", tone: "expense" });
  }

  const actions = [
    { href: "/admin/transactions/new", label: "إضافة معاملة", primary: true },
    { href: "/admin/units/collect", label: "تحصيل الاشتراكات", primary: true },
    { href: "/admin/reserve", label: "صندوق الطوارئ" },
    { href: "/admin/recurring", label: "البنود المتكررة" },
    { href: "/admin/units", label: "الوحدات والملاك" },
    { href: "/admin/categories", label: "الفئات والميزانيات" },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">نظرة عامة</h1>
        <p className="text-sm text-text-muted mt-1">{arabicMonths[month - 1]} {year}</p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="إيرادات الشهر" value={current.income} tone="text-income">
          <TrendBadge current={current.income} previous={previous.income} />
        </StatCard>
        <StatCard label="مصروفات الشهر" value={current.expense} tone="text-expense">
          <TrendBadge current={current.expense} previous={previous.expense} goodWhenUp={false} />
        </StatCard>
        <StatCard label="الحساب الجاري" value={funds.operating} tone="text-primary" />
        <StatCard label="صندوق الطوارئ" value={funds.reserve} tone="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Alerts */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <h2 className="text-sm font-semibold text-text-primary px-4 py-3.5 border-b border-border">يحتاج انتباهك</h2>
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-income">✓ كل شيء محدّث — لا توجد تنبيهات</p>
            ) : (
              <ul className="divide-y divide-border">
                {alerts.map((a, i) => (
                  <li key={i}>
                    <Link href={a.href} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${a.tone === "expense" ? "bg-expense" : "bg-warning"}`} />
                      <span className="flex-1 text-sm text-text-secondary">{a.text}</span>
                      <span className="text-text-muted text-xs">←</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Collection progress */}
          <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">تحصيل {arabicMonths[month - 1]}</h2>
              <span className="text-xs text-text-muted">
                {ledger.totals.units - unpaidThisMonth.length} من {ledger.totals.units} وحدة
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${ledger.totals.units ? ((ledger.totals.units - unpaidThisMonth.length) / ledger.totals.units) * 100 : 0}%` }}
              />
            </div>
            {unpaidThisMonth.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unpaidThisMonth.map((u) => (
                  <span key={u.id} className="text-[11px] px-2 py-0.5 rounded-md bg-expense-bg text-expense font-medium">{u.code}</span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-text-muted mt-3">
              آخر تشغيل للبنود المتكررة:{" "}
              {lastGenerated ? lastGenerated.createdAt.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </section>
        </div>

        <div className="space-y-5">
          {/* Quick actions */}
          <section className="bg-surface border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`text-center px-2 py-3 rounded-xl text-xs font-medium transition-colors ${
                    a.primary
                      ? "bg-primary text-on-primary hover:bg-primary-dark"
                      : "border border-border text-text-secondary hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Recent changes */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">آخر التغييرات</h2>
              <Link href="/audit" className="text-xs text-primary hover:underline">السجل الكامل</Link>
            </div>
            {recentLogs.length === 0 ? (
              <p className="px-4 py-6 text-xs text-text-muted">لا توجد تغييرات بعد</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <li key={log.id} className="px-4 py-2.5">
                    <p className="text-xs text-text-secondary line-clamp-2">{log.summary}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {log.createdAt.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, children }: { label: string; value: number; tone: string; children?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-4">
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      <p className={`text-base sm:text-xl font-bold ${tone}`}>
        {formatAmount(value)}
        <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
      </p>
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
