"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "recharts";
import Link from "next/link";
import { formatAmount, formatDate, arabicMonths } from "@/lib/utils";

type Summary = {
  allTime: { income: number; expense: number; balance: number };
  currentMonth: { income: number; expense: number; net: number };
};

type MonthlyData = { month: number; income: number; expense: number };

type CategoryData = {
  categoryId: string;
  nameAr: string;
  icon: string | null;
  color: string | null;
  type: string;
  total: number;
  count: number;
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  descriptionAr: string;
  category: { nameAr: string; icon: string | null; color: string | null };
};

type Period = "month" | "3months" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "هذا الشهر",
  "3months": "٣ أشهر",
  year: "هذا العام",
};

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("year");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const getPeriodParams = useCallback(() => {
    switch (period) {
      case "month":
        return { month: currentMonth.toString(), year: currentYear.toString() };
      case "3months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
      }
      case "year":
        return { year: currentYear.toString() };
    }
  }, [period, currentMonth, currentYear]);

  const fetchSummary = useCallback(async () => {
    const params = getPeriodParams();
    const sp = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    );
    const res = await fetch(`/api/transactions/summary?${sp}`);
    if (res.ok) setSummary(await res.json());
  }, [getPeriodParams]);

  const fetchMonthly = useCallback(async () => {
    const res = await fetch(`/api/analytics/monthly?year=${currentYear}`);
    if (res.ok) {
      const data = await res.json();
      setMonthlyData(data.monthly);
    }
  }, [currentYear]);

  const fetchCategories = useCallback(async () => {
    const params = getPeriodParams();
    const sp = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    );
    sp.set("type", "EXPENSE");
    const res = await fetch(`/api/analytics/categories?${sp}`);
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
    }
  }, [getPeriodParams]);

  const fetchRecent = useCallback(async () => {
    const res = await fetch(`/api/transactions?limit=10&page=1`);
    if (res.ok) {
      const data = await res.json();
      setRecentTransactions(data.transactions);
    }
  }, []);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchMonthly(), fetchCategories(), fetchRecent()]);
      setLoading(false);
    }
    fetchAll();
  }, [fetchSummary, fetchMonthly, fetchCategories, fetchRecent]);

  const chartData = monthlyData.map((d) => ({
    name: arabicMonths[d.month - 1],
    إيرادات: d.income,
    مصروفات: d.expense,
  }));

  const totalExpense = categories.reduce((s, c) => s + c.total, 0);
  const pieData = categories.map((c) => ({
    name: `${c.icon || ""} ${c.nameAr}`,
    value: c.total,
    color: c.color || "#3C6864",
  }));

  const periodLabel = period === "month" ? "هذا الشهر" : period === "3months" ? "آخر ٣ أشهر" : "هذا العام";

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
          <div className="flex gap-0.5 bg-surface rounded-xl p-1 border border-border flex-1 sm:flex-none">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  period === p
                    ? "bg-primary text-bg shadow-sm"
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
      ) : (
        <>
          {/* Balance hero card */}
          {summary && (
            <div className="fade-in fade-in-1 relative overflow-hidden bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-5">
              {/* Decorative glow */}
              <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              <p className="text-xs font-medium text-text-muted mb-1">الرصيد الإجمالي</p>
              <p className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 ${
                summary.allTime.balance >= 0 ? "text-primary" : "text-expense"
              }`}>
                {formatAmount(summary.allTime.balance)}
                <span className="text-base font-normal text-text-muted mr-1">ج.م</span>
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
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
          )}

          {/* Period stat cards */}
          {summary && (
            <div className="grid grid-cols-3 gap-3 mb-5 fade-in fade-in-2">
              {[
                { label: `إيرادات ${periodLabel}`, value: summary.currentMonth.income, color: "text-income", bg: "bg-income-bg", border: "border-income/20" },
                { label: `مصروفات ${periodLabel}`, value: summary.currentMonth.expense, color: "text-expense", bg: "bg-expense-bg", border: "border-expense/20" },
                {
                  label: `صافي ${periodLabel}`,
                  value: summary.currentMonth.net,
                  color: summary.currentMonth.net >= 0 ? "text-primary" : "text-expense",
                  bg: summary.currentMonth.net >= 0 ? "bg-primary/5" : "bg-expense-bg",
                  border: summary.currentMonth.net >= 0 ? "border-primary/20" : "border-expense/20",
                  prefix: summary.currentMonth.net >= 0 ? "+" : "",
                },
              ].map((stat, i) => (
                <div key={i} className={`bg-surface border ${stat.border} rounded-xl p-3 sm:p-4`}>
                  <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 leading-tight">{stat.label}</p>
                  <p className={`text-base sm:text-xl font-bold ${stat.color}`}>
                    {stat.prefix}{formatAmount(stat.value)}
                    <span className="text-[10px] sm:text-xs font-normal text-text-muted mr-0.5">ج.م</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 fade-in fade-in-3">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">
                الإيرادات مقابل المصروفات — {currentYear}
              </h2>
              <div className="h-[240px] sm:h-[280px]" dir="ltr">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barCategoryGap="28%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3230" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#3C6864" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#3C6864" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      width={32}
                    />
                    <Tooltip
                      formatter={(value) => [`${formatAmount(Number(value))} ج.م`]}
                      labelStyle={{ fontWeight: "bold", color: "#E0F7F5", fontFamily: "inherit" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #1C3230",
                        background: "#0E1A19",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        color: "#E0F7F5",
                      }}
                      cursor={{ fill: "rgba(45,218,196,0.04)" }}
                    />
                    <Bar dataKey="إيرادات" fill="#34D399" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="مصروفات" fill="#FB7185" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
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

            {/* Pie chart */}
            <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">المصروفات حسب الفئة</h2>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[160px]" dir="ltr">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${formatAmount(Number(value))} ج.م`]}
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #1C3230",
                            background: "#0E1A19",
                            color: "#E0F7F5",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {categories.slice(0, 5).map((cat) => {
                      const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : "0";
                      return (
                        <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#3C6864" }} />
                            <span className="text-text-muted truncate">{cat.icon} {cat.nameAr}</span>
                          </div>
                          <span className="font-semibold text-text-secondary shrink-0 mr-2">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex flex-col items-center justify-center gap-2 text-text-muted">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 10h.01M15 10h.01" />
                    <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
                  </svg>
                  <span className="text-xs">لا توجد بيانات</span>
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
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface-elevated transition-colors"
                  >
                    {/* Type indicator */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "INCOME" ? "bg-income-bg" : "bg-expense-bg"
                    }`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tx.type === "INCOME" ? "#34D399" : "#FB7185"} strokeWidth="2.5" strokeLinecap="round">
                        {tx.type === "INCOME"
                          ? <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>
                          : <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>
                        }
                      </svg>
                    </div>

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

                    <span className={`text-sm font-bold whitespace-nowrap ${
                      tx.type === "INCOME" ? "text-income" : "text-expense"
                    }`}>
                      {tx.type === "INCOME" ? "+" : "−"}{formatAmount(tx.amount)}
                      <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="13" y2="13" />
                </svg>
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
      {/* Balance skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-5">
        <div className="skeleton h-3 w-28 mb-2" />
        <div className="skeleton h-10 w-48 mb-4" />
        <div className="flex gap-4">
          <div className="skeleton h-3 w-36" />
          <div className="skeleton h-3 w-36" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3 sm:p-4">
            <div className="skeleton h-2.5 w-16 mb-2" />
            <div className="skeleton h-6 w-20" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
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

      {/* Transactions skeleton */}
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
