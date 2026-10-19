"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";
import { formatAmount, formatDate, arabicMonths, compactAmount } from "@/lib/utils";
import { useTheme } from "@/components/theme";
import { ErrorState, TrendBadge } from "@/components/states";
import { TypeIcon } from "@/components/type-icon";

type Totals = { income: number; expense: number; net: number };

type Summary = {
  allTime: { income: number; expense: number; balance: number };
  currentMonth: Totals;
  previous: Totals;
  funds: { operating: number; reserve: number; total: number };
};

type MonthlyData = { month: number; income: number; expense: number };
type BalancePoint = { year: number; month: number; net: number; balance: number };

type CategoryData = {
  categoryId: string;
  nameAr: string;
  icon: string | null;
  color: string | null;
  type: string;
  total: number;
  count: number;
};

type Budget = {
  categoryId: string;
  nameAr: string;
  icon: string | null;
  budget: number;
  actual: number;
  pct: number;
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  descriptionAr: string;
  category: { nameAr: string; icon: string | null; color: string | null };
};

type Collection = { expected: number; collected: number; arrears: number; unitsInArrears: number; units: number };

type Period = "month" | "3months" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "هذا الشهر",
  "3months": "٣ أشهر",
  year: "هذا العام",
};

const PREVIOUS_LABELS: Record<Period, string> = {
  month: "مقارنة بالشهر السابق",
  "3months": "مقارنة بالأشهر الثلاثة السابقة",
  year: "مقارنة بالعام السابق",
};

function getPeriodParams(period: Period): Record<string, string> {
  const now = new Date();
  switch (period) {
    case "month":
      return { month: String(now.getMonth() + 1), year: String(now.getFullYear()) };
    case "3months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "year":
      return { year: String(now.getFullYear()) };
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  return res.json();
}

export function Dashboard() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [balancePoints, setBalancePoints] = useState<BalancePoint[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<Period>("month");

  const currentYear = new Date().getFullYear();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = getPeriodParams(period);
    const sp = new URLSearchParams(params);
    const catParams = new URLSearchParams({ ...params, type: "EXPENSE" });
    const budgetParams = new URLSearchParams(
      period === "month" ? { month: params.month, year: params.year } : { year: String(currentYear) }
    );
    try {
      const [s, m, b, c, bud, ledger, recent] = await Promise.all([
        getJson<Summary>(`/api/transactions/summary?${sp}`),
        getJson<{ monthly: MonthlyData[] }>(`/api/analytics/monthly?year=${currentYear}`),
        getJson<{ points: BalancePoint[] }>(`/api/analytics/balance`),
        getJson<{ categories: CategoryData[] }>(`/api/analytics/categories?${catParams}`),
        getJson<{ budgets: Budget[] }>(`/api/analytics/budgets?${budgetParams}`),
        getJson<{ totals: Collection }>(`/api/units/ledger?year=${currentYear}`),
        getJson<{ transactions: Transaction[] }>(`/api/transactions?limit=8&page=1`),
      ]);
      setSummary(s);
      setMonthlyData(m.monthly);
      setBalancePoints(b.points);
      setCategories(c.categories);
      setBudgets(bud.budgets);
      setCollection(ledger.totals);
      setRecentTransactions(recent.transactions);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period, currentYear]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const chartData = monthlyData.map((d) => ({
    name: arabicMonths[d.month - 1],
    إيرادات: d.income,
    مصروفات: d.expense,
  }));

  const balanceData = useMemo(
    () =>
      balancePoints.slice(-12).map((p) => ({
        name: `${arabicMonths[p.month - 1]} ${String(p.year).slice(2)}`,
        الرصيد: p.balance,
      })),
    [balancePoints]
  );

  const totalExpense = categories.reduce((s, c) => s + c.total, 0);
  const pieData = categories.map((c) => ({
    name: `${c.icon || ""} ${c.nameAr}`,
    value: c.total,
    color: c.color || colors.fallback,
  }));

  const periodLabel = period === "month" ? "هذا الشهر" : period === "3months" ? "آخر ٣ أشهر" : "هذا العام";
  const tooltipStyle = {
    borderRadius: "12px",
    border: `1px solid ${colors.tooltipBorder}`,
    background: colors.tooltipBg,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    color: colors.tooltipText,
    fontSize: "12px",
  };
  const collectionPct =
    collection && collection.expected > 0 ? Math.min(100, (collection.collected / collection.expected) * 100) : 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">لوحة التحكم المالية</h1>
          <p className="text-sm text-text-muted mt-0.5">اتحاد ملاك برج الوليد</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/reports"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors text-sm font-medium"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">التقارير</span>
          </Link>

          {/* Period selector */}
          <div className="flex gap-0.5 bg-surface rounded-xl p-1 border border-border flex-1 sm:flex-none" role="tablist" aria-label="الفترة">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  period === p
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeletons />
      ) : error || !summary ? (
        <div className="bg-surface border border-border rounded-2xl">
          <ErrorState onRetry={fetchAll} />
        </div>
      ) : (
        <>
          {/* Balance hero card */}
          <div className="fade-in fade-in-1 relative overflow-hidden bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-5">
            <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div>
                <p className="text-xs font-medium text-text-muted mb-1">الرصيد الإجمالي</p>
                <p className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 ${
                  summary.allTime.balance >= 0 ? "text-primary" : "text-expense"
                }`}>
                  {formatAmount(summary.allTime.balance)}
                  <span className="text-base font-normal text-text-muted mr-1">ج.م</span>
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-income shrink-0" />
                    <span className="text-text-muted">إجمالي الإيرادات:</span>
                    <span className="font-semibold text-income">{formatAmount(summary.allTime.income)} ج.م</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-expense shrink-0" />
                    <span className="text-text-muted">إجمالي المصروفات:</span>
                    <span className="font-semibold text-expense">{formatAmount(summary.allTime.expense)} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Fund split */}
              <div className="grid grid-cols-2 gap-3 lg:min-w-[360px]">
                <div className="bg-surface-elevated border border-border rounded-xl p-3">
                  <p className="text-[11px] text-text-muted mb-1">الحساب الجاري</p>
                  <p className="text-base font-bold text-text-primary">
                    {formatAmount(summary.funds.operating)}
                    <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                  </p>
                </div>
                <div className="bg-warning-bg border border-warning/25 rounded-xl p-3">
                  <p className="text-[11px] text-warning mb-1 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    صندوق الطوارئ
                  </p>
                  <p className="text-base font-bold text-text-primary">
                    {formatAmount(summary.funds.reserve)}
                    <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Period stat cards */}
          <div className="grid grid-cols-3 gap-3 mb-5 fade-in fade-in-2">
            {[
              { label: `إيرادات ${periodLabel}`, value: summary.currentMonth.income, prev: summary.previous.income, color: "text-income", border: "border-income/20", goodWhenUp: true },
              { label: `مصروفات ${periodLabel}`, value: summary.currentMonth.expense, prev: summary.previous.expense, color: "text-expense", border: "border-expense/20", goodWhenUp: false },
              {
                label: `صافي ${periodLabel}`,
                value: summary.currentMonth.net,
                prev: summary.previous.net,
                color: summary.currentMonth.net >= 0 ? "text-primary" : "text-expense",
                border: summary.currentMonth.net >= 0 ? "border-primary/20" : "border-expense/20",
                prefix: summary.currentMonth.net >= 0 ? "+" : "",
                goodWhenUp: true,
              },
            ].map((stat, i) => (
              <div key={i} className={`bg-surface border ${stat.border} rounded-xl p-3 sm:p-4`}>
                <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 leading-tight">{stat.label}</p>
                <p className={`text-base sm:text-xl font-bold ${stat.color}`}>
                  {stat.prefix}{formatAmount(stat.value)}
                  <span className="text-[10px] sm:text-xs font-normal text-text-muted mr-0.5">ج.م</span>
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <TrendBadge current={stat.value} previous={stat.prev} goodWhenUp={stat.goodWhenUp} />
                  <span className="text-[10px] text-text-muted hidden sm:inline">{PREVIOUS_LABELS[period]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Dues collection strip */}
          {collection && collection.units > 0 && (
            <Link
              href="/units"
              className="fade-in fade-in-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-surface border border-border rounded-2xl px-4 sm:px-5 py-4 mb-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 sm:w-64 shrink-0">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M10 22v-4h4v4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">تحصيل اشتراكات {currentYear}</p>
                  <p className="text-xs text-text-muted">
                    {collection.unitsInArrears > 0
                      ? `${collection.unitsInArrears} وحدة عليها متأخرات`
                      : "جميع الوحدات مسددة"}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">
                    {formatAmount(collection.collected)} من {formatAmount(collection.expected)} ج.م
                  </span>
                  <span className="font-bold text-primary">{collectionPct.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪</span>
                </div>
                <div className="h-2 rounded-full bg-surface-elevated overflow-hidden" role="progressbar" aria-valuenow={Math.round(collectionPct)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${collectionPct}%` }} />
                </div>
              </div>
            </Link>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 fade-in fade-in-3">
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                الإيرادات مقابل المصروفات — {currentYear}
              </h2>
              <div className="h-[240px]" dir="ltr">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barCategoryGap="28%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: colors.tick }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => compactAmount(v)}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value) => [`${formatAmount(Number(value))} ج.م`]}
                      labelStyle={{ fontWeight: "bold", color: colors.tooltipText, fontFamily: "inherit" }}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: colors.cursor }}
                    />
                    <Bar dataKey="إيرادات" fill={colors.income} radius={[5, 5, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="مصروفات" fill={colors.expense} radius={[5, 5, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="w-3 h-3 rounded-sm bg-income" />
                  الإيرادات
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="w-3 h-3 rounded-sm bg-expense" />
                  المصروفات
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">المصروفات حسب الفئة — {periodLabel}</h2>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[160px]" dir="ltr">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${formatAmount(Number(value))} ج.م`]} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {categories.slice(0, 5).map((cat) => {
                      const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : "0";
                      return (
                        <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || colors.fallback }} />
                            <span className="text-text-secondary truncate">{cat.icon} {cat.nameAr}</span>
                          </div>
                          <span className="font-semibold text-text-secondary shrink-0 mr-2">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex flex-col items-center justify-center gap-2 text-text-muted">
                  <span className="text-xs">لا توجد مصروفات في هذه الفترة</span>
                </div>
              )}
            </div>
          </div>

          {/* Balance trend + budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 fade-in fade-in-3">
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-1">تطور الرصيد</h2>
              <p className="text-xs text-text-muted mb-4">الرصيد التراكمي في نهاية كل شهر — آخر ١٢ شهراً</p>
              {balanceData.length > 1 ? (
                <div className="h-[220px]" dir="ltr">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={balanceData}>
                      <defs>
                        <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => compactAmount(v)} width={40} />
                      <Tooltip
                        formatter={(value) => [`${formatAmount(Number(value))} ج.م`, "الرصيد"]}
                        labelStyle={{ fontWeight: "bold", color: colors.tooltipText }}
                        contentStyle={tooltipStyle}
                      />
                      <Area type="monotone" dataKey="الرصيد" stroke={colors.primary} strokeWidth={2.5} fill="url(#balanceFill)" dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-text-muted">لا توجد بيانات كافية</div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-1">الميزانية مقابل الفعلي</h2>
              <p className="text-xs text-text-muted mb-4">{period === "month" ? "هذا الشهر" : `عام ${currentYear} حتى الآن`}</p>
              {budgets.length > 0 ? (
                <div className="space-y-3.5">
                  {budgets.slice(0, 6).map((b) => {
                    const over = b.actual > b.budget;
                    const warn = !over && b.pct >= 85;
                    return (
                      <div key={b.categoryId}>
                        <div className="flex justify-between items-baseline text-xs mb-1 gap-2">
                          <span className="text-text-secondary truncate">{b.icon} {b.nameAr}</span>
                          <span className={`shrink-0 font-semibold ${over ? "text-expense" : warn ? "text-warning" : "text-text-secondary"}`}>
                            {b.pct.toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                          <div
                            className={`h-full rounded-full ${over ? "bg-expense" : warn ? "bg-warning" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, b.pct)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">
                          {formatAmount(b.actual)} / {formatAmount(b.budget)} ج.م
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-xs text-text-muted text-center">
                  لم يتم تحديد ميزانيات للفئات بعد
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden fade-in fade-in-4">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">آخر المعاملات</h2>
              <Link href="/transactions" className="text-xs text-primary hover:underline">
                عرض الكل
              </Link>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface-elevated transition-colors">
                    <TypeIcon type={tx.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{tx.descriptionAr}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">{formatDate(tx.date)}</span>
                        <span className="text-[10px] text-text-muted">•</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          tx.type === "INCOME" ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
                        }`}>
                          {tx.category.icon} {tx.category.nameAr}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
                      {tx.type === "INCOME" ? "+" : "−"}{formatAmount(tx.amount)}
                      <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
                <span className="text-sm">لا توجد معاملات</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-5">
        <div className="skeleton h-3 w-28 mb-2" />
        <div className="skeleton h-10 w-48 mb-4" />
        <div className="flex gap-4">
          <div className="skeleton h-3 w-36" />
          <div className="skeleton h-3 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3 sm:p-4">
            <div className="skeleton h-2.5 w-16 mb-2" />
            <div className="skeleton h-6 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="skeleton h-4 w-48 mb-4" />
          <div className="skeleton h-[240px]" />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="skeleton h-4 w-36 mb-4" />
          <div className="skeleton h-[160px] rounded-full" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-border">
          <div className="skeleton h-4 w-32" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border last:border-0">
            <div className="skeleton w-8 h-8 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-3.5 w-40 mb-1.5" />
              <div className="skeleton h-2.5 w-24" />
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}
