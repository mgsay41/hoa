"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ReportView, getPeriodLabel } from "@/components/report-view";
import { arabicMonths } from "@/lib/utils";

type CategoryBreakdown = {
  categoryId: string;
  nameAr: string;
  icon: string | null;
  color: string | null;
  type: string;
  total: number;
  count: number;
};

type ReportData = {
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  incomeCategories: CategoryBreakdown[];
  expenseCategories: CategoryBreakdown[];
};

export default function ReportsPage() {
  const now = new Date();
  const [mode, setMode] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode === "month") {
        params.set("month", selectedMonth.toString());
      }
      params.set("year", selectedYear.toString());

      const [summaryRes, incomeCatRes, expenseCatRes] = await Promise.all([
        fetch(`/api/transactions/summary?${params}`),
        fetch(`/api/analytics/categories?${params}&type=INCOME`),
        fetch(`/api/analytics/categories?${params}&type=EXPENSE`),
      ]);

      if (!summaryRes.ok || !incomeCatRes.ok || !expenseCatRes.ok) {
        throw new Error("Failed to fetch");
      }

      const [summary, incomeData, expenseData] = await Promise.all([
        summaryRes.json(),
        incomeCatRes.json(),
        expenseCatRes.json(),
      ]);

      const periodLabel = getPeriodLabel(mode, selectedMonth, selectedYear);

      setData({
        periodLabel,
        income: summary.currentMonth.income,
        expense: summary.currentMonth.expense,
        net: summary.currentMonth.net,
        incomeCategories: incomeData.categories,
        expenseCategories: expenseData.categories,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!exportRef.current || !data) return;
    setExporting(true);
    try {
      const { exportReportToPDF } = await import("@/lib/export-pdf");
      await exportReportToPDF(exportRef.current, data.periodLabel);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    years.push(y);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">التقارير المالية</h1>
        <button
          onClick={handleExport}
          disabled={exporting || !data}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري التحميل...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              تحميل التقرير PDF
            </>
          )}
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 bg-bg rounded-xl p-1">
            <button
              onClick={() => setMode("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "month"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              تقرير شهري
            </button>
            <button
              onClick={() => setMode("year")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "year"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              تقرير سنوي
            </button>
          </div>

          {mode === "month" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
            >
              {arabicMonths.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-border text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ReportView ref={reportRef} data={data} loading={loading} viewMode="page" />

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
      >
        {!loading && data && (
          <ReportView
            ref={exportRef}
            data={data}
            loading={false}
            viewMode="export"
          />
        )}
      </div>
    </div>
  );
}
