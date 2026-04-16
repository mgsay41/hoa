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
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-border rounded w-48" />
          <div className="h-40 bg-border rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-border rounded-2xl" />
            <div className="h-64 bg-border rounded-2xl" />
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-16 text-text-muted">
          اختر شهراً أو سنة لعرض التقرير
        </div>
      );
    }

    const isExport = viewMode === "export";

    return (
      <div
        ref={ref}
        dir="rtl"
        className={isExport ? "p-8 bg-white" : ""}
        style={
          isExport
            ? {
                fontFamily: "IBM Plex Sans Arabic, sans-serif",
                width: "800px",
              }
            : undefined
        }
      >
        <div
          className={`border-b-2 border-primary pb-4 mb-6 ${
            isExport ? "" : ""
          }`}
        >
          <h1 className={`font-bold text-primary ${isExport ? "text-2xl" : "text-xl"}`}>
            اتحاد ملاك برج الوليد
          </h1>
          <p
            className={`text-text-secondary mt-1 ${isExport ? "text-lg" : "text-base"}`}
          >
            تقرير مالي — {data.periodLabel}
          </p>
        </div>

        <div
          className={`bg-surface rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6 ${
            isExport ? "p-6 border border-border" : "p-6"
          }`}
        >
          <h2 className="text-lg font-semibold mb-4">ملخص مالي</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                  البيان
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                  المبلغ (ج.م)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-4 font-medium">إجمالي الإيرادات</td>
                <td className="py-3 px-4 text-left font-bold text-primary">
                  {formatAmount(data.income)}
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4 font-medium">إجمالي المصروفات</td>
                <td className="py-3 px-4 text-left font-bold text-expense">
                  {formatAmount(data.expense)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-lg">صافي الرصيد</td>
                <td
                  className={`py-3 px-4 text-left font-bold text-lg ${
                    data.net >= 0 ? "text-primary" : "text-expense"
                  }`}
                >
                  {data.net >= 0 ? "+" : ""}
                  {formatAmount(data.net)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryTable
            title="تفصيل الإيرادات"
            categories={data.incomeCategories}
            total={data.income}
            type="income"
            isExport={isExport}
          />
          <CategoryTable
            title="تفصيل المصروفات"
            categories={data.expenseCategories}
            total={data.expense}
            type="expense"
            isExport={isExport}
          />
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
  isExport,
}: {
  title: string;
  categories: CategoryBreakdown[];
  total: number;
  type: "income" | "expense";
  isExport: boolean;
}) {
  const colorClass = type === "income" ? "text-primary" : "text-expense";

  return (
    <div
      className={`bg-surface rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${
        isExport ? "p-4 border border-border" : "p-5"
      }`}
    >
      <h3 className={`font-semibold mb-3 ${colorClass}`}>{title}</h3>
      {categories.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right py-2 px-3 text-xs font-medium text-text-secondary">
                الفئة
              </th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-secondary">
                العدد
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">
                المبلغ
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-text-secondary">
                النسبة
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const pct =
                total > 0 ? ((cat.total / total) * 100).toFixed(1) : "0";
              return (
                <tr key={cat.categoryId} className="border-b border-border last:border-b-0">
                  <td className="py-2.5 px-3 text-sm">
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.nameAr}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-sm text-center text-text-secondary">
                    {cat.count}
                  </td>
                  <td className={`py-2.5 px-3 text-sm font-medium text-left ${colorClass}`}>
                    {formatAmount(cat.total)}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-text-secondary text-left">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td className="py-2.5 px-3 font-bold text-sm">الإجمالي</td>
              <td className="py-2.5 px-3 text-sm text-center text-text-secondary">
                {categories.reduce((s, c) => s + c.count, 0)}
              </td>
              <td className={`py-2.5 px-3 font-bold text-sm text-left ${colorClass}`}>
                {formatAmount(total)}
              </td>
              <td className="py-2.5 px-3 text-sm text-left">100%</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="text-sm text-text-muted text-center py-4">
          لا توجد بيانات
        </p>
      )}
    </div>
  );
}

export function getPeriodLabel(
  mode: "month" | "year",
  month: number,
  year: number
): string {
  if (mode === "month") {
    return `${arabicMonths[month - 1]} ${year}`;
  }
  return `عام ${year}`;
}
