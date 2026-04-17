"use client";

import { forwardRef } from "react";
import { formatAmount, arabicMonths } from "@/lib/utils";

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

type ReportViewProps = {
  data: ReportData | null;
  loading: boolean;
  viewMode?: "page" | "export";
};

export const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(
  function ReportView({ data, loading, viewMode = "page" }, ref) {
    if (loading) {
      return (
        <div className="space-y-5">
          <div className="skeleton h-7 w-48 rounded-xl" />
          <div className="skeleton h-40 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="13" y2="17" />
          </svg>
          <p className="text-sm">اختر شهراً أو سنة لعرض التقرير</p>
        </div>
      );
    }

    const isExport = viewMode === "export";

    if (isExport) {
      /* ─── Export mode: white background for PDF ─── */
      return (
        <div
          ref={ref}
          dir="rtl"
          style={{
            fontFamily: "IBM Plex Sans Arabic, sans-serif",
            width: "800px",
            padding: "32px",
            background: "#ffffff",
            color: "#111827",
          }}
        >
          <div style={{ borderBottom: "2px solid #00C2A8", paddingBottom: "16px", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#00C2A8", margin: 0 }}>
              اتحاد ملاك برج الوليد
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "4px" }}>
              تقرير مالي — {data.periodLabel}
            </p>
          </div>

          {/* Summary table */}
          <div style={{ background: "#F8FAFB", borderRadius: "12px", padding: "20px", marginBottom: "24px", border: "1px solid #E8EDEF" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>ملخص مالي</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E8EDEF" }}>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>البيان</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>المبلغ (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E8EDEF" }}>
                  <td style={{ padding: "10px 12px", fontWeight: "500", fontSize: "13px" }}>إجمالي الإيرادات</td>
                  <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: "700", color: "#00C2A8", fontSize: "13px" }}>{formatAmount(data.income)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #E8EDEF" }}>
                  <td style={{ padding: "10px 12px", fontWeight: "500", fontSize: "13px" }}>إجمالي المصروفات</td>
                  <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: "700", color: "#F04E4E", fontSize: "13px" }}>{formatAmount(data.expense)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "700", fontSize: "15px" }}>صافي الرصيد</td>
                  <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: "700", fontSize: "15px", color: data.net >= 0 ? "#00C2A8" : "#F04E4E" }}>
                    {data.net >= 0 ? "+" : ""}{formatAmount(data.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <ExportCategoryTable title="تفصيل الإيرادات" categories={data.incomeCategories} total={data.income} colorHex="#00C2A8" />
            <ExportCategoryTable title="تفصيل المصروفات" categories={data.expenseCategories} total={data.expense} colorHex="#F04E4E" />
          </div>
        </div>
      );
    }

    /* ─── Page mode: dark theme ─── */
    return (
      <div ref={ref} className="fade-in">
        {/* Report header */}
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-primary/30">
          <div>
            <h2 className="text-base font-bold text-primary">اتحاد ملاك برج الوليد</h2>
            <p className="text-sm text-text-secondary mt-0.5">تقرير مالي — {data.periodLabel}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">الملخص المالي</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-income-bg border border-income/20 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-text-muted mb-1.5">إجمالي الإيرادات</p>
              <p className="text-base sm:text-xl font-bold text-income">
                {formatAmount(data.income)}
                <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
              </p>
            </div>
            <div className="bg-expense-bg border border-expense/20 rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-text-muted mb-1.5">إجمالي المصروفات</p>
              <p className="text-base sm:text-xl font-bold text-expense">
                {formatAmount(data.expense)}
                <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
              </p>
            </div>
            <div className={`border rounded-xl p-3 sm:p-4 ${data.net >= 0 ? "bg-primary/5 border-primary/20" : "bg-expense-bg border-expense/20"}`}>
              <p className="text-[10px] sm:text-xs text-text-muted mb-1.5">صافي الرصيد</p>
              <p className={`text-base sm:text-xl font-bold ${data.net >= 0 ? "text-primary" : "text-expense"}`}>
                {data.net >= 0 ? "+" : ""}{formatAmount(data.net)}
                <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
              </p>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CategoryTable title="تفصيل الإيرادات" categories={data.incomeCategories} total={data.income} type="income" />
          <CategoryTable title="تفصيل المصروفات" categories={data.expenseCategories} total={data.expense} type="expense" />
        </div>
      </div>
    );
  }
);

function CategoryTable({
  title,
  categories,
  total,
  type,
}: {
  title: string;
  categories: CategoryBreakdown[];
  total: number;
  type: "income" | "expense";
}) {
  const colorClass = type === "income" ? "text-income" : "text-expense";
  const borderClass = type === "income" ? "border-income/20" : "border-expense/20";

  return (
    <div className={`bg-surface border ${borderClass} rounded-2xl overflow-hidden`}>
      <div className="px-4 py-3.5 border-b border-border">
        <h3 className={`text-sm font-semibold ${colorClass}`}>{title}</h3>
      </div>
      {categories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right px-4 py-2.5 text-[10px] font-medium text-text-muted">الفئة</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-medium text-text-muted">العدد</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-text-muted">المبلغ</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-medium text-text-muted">النسبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => {
                const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : "0";
                return (
                  <tr key={cat.categoryId} className="hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-primary">
                      <div className="flex items-center gap-2">
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.nameAr}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-center text-text-muted">{cat.count}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold text-left ${colorClass}`}>
                      {formatAmount(cat.total)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-muted text-left">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-elevated">
                <td className="px-4 py-2.5 text-xs font-bold text-text-primary">الإجمالي</td>
                <td className="px-3 py-2.5 text-xs text-center text-text-muted font-medium">
                  {categories.reduce((s, c) => s + c.count, 0)}
                </td>
                <td className={`px-4 py-2.5 text-xs font-bold text-left ${colorClass}`}>
                  {formatAmount(total)}
                </td>
                <td className="px-3 py-2.5 text-xs text-text-muted text-left">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-text-muted text-sm">
          لا توجد بيانات
        </div>
      )}
    </div>
  );
}

function ExportCategoryTable({
  title,
  categories,
  total,
  colorHex,
}: {
  title: string;
  categories: CategoryBreakdown[];
  total: number;
  colorHex: string;
}) {
  return (
    <div style={{ background: "#F8FAFB", borderRadius: "10px", padding: "16px", border: "1px solid #E8EDEF" }}>
      <h3 style={{ fontSize: "13px", fontWeight: "600", color: colorHex, marginBottom: "10px" }}>{title}</h3>
      {categories.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E8EDEF" }}>
              <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "11px", color: "#6B7280" }}>الفئة</th>
              <th style={{ textAlign: "center", padding: "6px 8px", fontSize: "11px", color: "#6B7280" }}>العدد</th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "11px", color: "#6B7280" }}>المبلغ</th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "11px", color: "#6B7280" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : "0";
              return (
                <tr key={cat.categoryId} style={{ borderBottom: "1px solid #E8EDEF" }}>
                  <td style={{ padding: "7px 8px", fontSize: "12px" }}>{cat.icon} {cat.nameAr}</td>
                  <td style={{ padding: "7px 8px", fontSize: "12px", textAlign: "center", color: "#6B7280" }}>{cat.count}</td>
                  <td style={{ padding: "7px 8px", fontSize: "12px", textAlign: "left", fontWeight: "600", color: colorHex }}>{formatAmount(cat.total)}</td>
                  <td style={{ padding: "7px 8px", fontSize: "12px", textAlign: "left", color: "#6B7280" }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #E8EDEF" }}>
              <td style={{ padding: "8px", fontSize: "12px", fontWeight: "700" }}>الإجمالي</td>
              <td style={{ padding: "8px", fontSize: "12px", textAlign: "center", color: "#6B7280" }}>{categories.reduce((s, c) => s + c.count, 0)}</td>
              <td style={{ padding: "8px", fontSize: "12px", fontWeight: "700", textAlign: "left", color: colorHex }}>{formatAmount(total)}</td>
              <td style={{ padding: "8px", fontSize: "12px", textAlign: "left", color: "#6B7280" }}>100%</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>لا توجد بيانات</p>
      )}
    </div>
  );
}

export function getPeriodLabel(mode: "month" | "year", month: number, year: number): string {
  if (mode === "month") return `${arabicMonths[month - 1]} ${year}`;
  return `عام ${year}`;
}
