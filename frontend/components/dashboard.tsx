"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

type MonthlyData = {
  month: number;
  income: number;
  expense: number;
};

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
  "3months": "آخر 3 أشهر",
  year: "هذا العام",
};

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
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
    if (res.ok) {
      const data = await res.json();
      setSummary(data);
    }
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
      await Promise.all([
        fetchSummary(),
        fetchMonthly(),
        fetchCategories(),
        fetchRecent(),
      ]);
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
    color: c.color || "#6B7280",
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">لوحة التحكم المالية</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            تحميل التقرير
          </Link>
          <div className="flex gap-1 bg-surface rounded-xl p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
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
          {summary && (
            <>
              <div className="bg-surface rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
                <p className="text-sm text-text-secondary mb-1">
                  الرصيد الحالي (الإجمالي)
                </p>
                <p
                  className={`text-3xl sm:text-4xl font-bold ${
                    summary.allTime.balance >= 0
                      ? "text-primary"
                      : "text-expense"
                  }`}
                >
                  {formatAmount(summary.allTime.balance)} ج.م
                </p>
                <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                  <span>
                    إجمالي الإيرادات:{" "}
                    <span className="text-primary font-medium">
                      {formatAmount(summary.allTime.income)}
                    </span>
                  </span>
                  <span>
                    إجمالي المصروفات:{" "}
                    <span className="text-expense font-medium">
                      {formatAmount(summary.allTime.expense)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <p className="text-sm text-text-secondary mb-1">
                    إيرادات{" "}
                    {period === "month" ? "هذا الشهر" : period === "3months" ? "آخر 3 أشهر" : "هذا العام"}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatAmount(summary.currentMonth.income)} ج.م
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <p className="text-sm text-text-secondary mb-1">
                    مصروفات{" "}
                    {period === "month" ? "هذا الشهر" : period === "3months" ? "آخر 3 أشهر" : "هذا العام"}
                  </p>
                  <p className="text-2xl font-bold text-expense">
                    {formatAmount(summary.currentMonth.expense)} ج.م
                  </p>
                </div>
                <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <p className="text-sm text-text-secondary mb-1">
                    صافي{" "}
                    {period === "month" ? "هذا الشهر" : period === "3months" ? "آخر 3 أشهر" : "هذا العام"}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.currentMonth.net >= 0
                        ? "text-primary"
                        : "text-expense"
                    }`}
                  >
                    {summary.currentMonth.net >= 0 ? "+" : ""}
                    {formatAmount(summary.currentMonth.net)} ج.م
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-semibold mb-4">
                الإيرادات مقابل المصروفات — {currentYear}
              </h2>
              <div className="h-[320px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEF" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      tickFormatter={(v: number) =>
                        `${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        `${formatAmount(Number(value))} ج.م`
                      }
                      labelStyle={{ fontWeight: "bold" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E8EDEF",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "إيرادات" ? "الإيرادات" : "المصروفات"
                      }
                    />
                    <Bar
                      dataKey="إيرادات"
                      fill="#00C2A8"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="مصروفات"
                      fill="#F04E4E"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-semibold mb-4">
                توزيع المصروفات حسب الفئة
              </h2>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[200px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            `${formatAmount(Number(value))} ج.م`
                          }
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8EDEF",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-3">
                    {categories.map((cat) => {
                      const pct =
                        totalExpense > 0
                          ? ((cat.total / totalExpense) * 100).toFixed(1)
                          : "0";
                      return (
                        <div
                          key={cat.categoryId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor: cat.color || "#6B7280",
                              }}
                            />
                            <span className="text-text-secondary">
                              {cat.icon} {cat.nameAr}
                            </span>
                          </div>
                          <span className="font-medium text-text-primary">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-text-muted">
                  لا توجد مصروفات
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-semibold mb-4">آخر المعاملات</h2>
            {recentTransactions.length > 0 ? (
              <div className="space-y-1">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {formatDate(tx.date)}
                      </span>
                      <span className="text-sm text-text-primary truncate">
                        {tx.descriptionAr}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === "INCOME"
                            ? "bg-primary-light text-primary"
                            : "bg-expense-bg text-expense"
                        }`}
                      >
                        {tx.category.icon} {tx.category.nameAr}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold whitespace-nowrap mr-3 ${
                        tx.type === "INCOME" ? "text-primary" : "text-expense"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatAmount(tx.amount)} ج.م
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-muted py-8">
                لا توجد معاملات
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
      <div className="bg-surface rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 animate-pulse">
        <div className="h-4 bg-border rounded w-40 mb-2" />
        <div className="h-10 bg-border rounded w-56 mb-3" />
        <div className="flex gap-4">
          <div className="h-4 bg-border rounded w-32" />
          <div className="h-4 bg-border rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] animate-pulse"
          >
            <div className="h-3 bg-border rounded w-24 mb-2" />
            <div className="h-8 bg-border rounded w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] animate-pulse">
          <div className="h-6 bg-border rounded w-48 mb-4" />
          <div className="h-[320px] bg-border rounded" />
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] animate-pulse">
          <div className="h-6 bg-border rounded w-36 mb-4" />
          <div className="h-[200px] bg-border rounded" />
        </div>
      </div>
      <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] animate-pulse">
        <div className="h-6 bg-border rounded w-32 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-border rounded mb-2" />
        ))}
      </div>
    </>
  );
}
