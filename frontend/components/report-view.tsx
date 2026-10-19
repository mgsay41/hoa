"use client";

import { forwardRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatAmount, arabicMonths, compactAmount } from "@/lib/utils";
import { useTheme } from "@/components/theme";
import { EmptyState } from "@/components/states";

type CategoryBreakdown = {
  categoryId: string;
  nameAr: string;
  icon: string | null;
  color: string | null;
  type: string;
  total: number;
  count: number;
};

export type ReportData = {
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  incomeCategories: CategoryBreakdown[];
  expenseCategories: CategoryBreakdown[];
  /** Only for yearly reports */
  monthly?: { month: number; income: number; expense: number }[];
};

type ReportViewProps = {
  data: ReportData | null;
  loading: boolean;
};

export const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(
  function ReportView({ data, loading }, ref) {
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
      return <EmptyState title="اختر شهراً أو سنة لعرض التقرير" />;
    }

    return (
      <div ref={ref} className="fade-in">
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
            <SummaryTile label="إجمالي الإيرادات" value={data.income} cls="bg-income-bg border-income/20 text-income" />
            <SummaryTile label="إجمالي المصروفات" value={data.expense} cls="bg-expense-bg border-expense/20 text-expense" />
            <SummaryTile
              label="صافي الرصيد"
              value={data.net}
              prefix={data.net >= 0 ? "+" : ""}
              cls={data.net >= 0 ? "bg-primary/5 border-primary/20 text-primary" : "bg-expense-bg border-expense/20 text-expense"}
            />
          </div>
          {(data.income > 0 || data.expense > 0) && (
            <div className="mt-4">
              <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-elevated" aria-hidden>
                <div className="bg-income" style={{ width: `${(data.income / (data.income + data.expense)) * 100}%` }} />
                <div className="bg-expense" style={{ width: `${(data.expense / (data.income + data.expense)) * 100}%` }} />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">
                {data.income > 0
                  ? `المصروفات تمثل ${((data.expense / data.income) * 100).toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪ من الإيرادات`
                  : "لا توجد إيرادات في هذه الفترة"}
              </p>
            </div>
          )}
        </div>

        {data.monthly && <MonthlyChart monthly={data.monthly} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CategoryTable title="تفصيل الإيرادات" categories={data.incomeCategories} total={data.income} type="income" />
          <CategoryTable title="تفصيل المصروفات" categories={data.expenseCategories} total={data.expense} type="expense" />
        </div>
      </div>
    );
  }
);

function SummaryTile({ label, value, cls, prefix = "" }: { label: string; value: number; cls: string; prefix?: string }) {
  const [bg, border, text] = cls.split(" ");
  return (
    <div className={`${bg} border ${border} rounded-xl p-3 sm:p-4`}>
      <p className="text-[10px] sm:text-xs text-text-muted mb-1.5">{label}</p>
      <p className={`text-base sm:text-xl font-bold ${text}`}>
        {prefix}{formatAmount(value)}
        <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
      </p>
    </div>
  );
}

function MonthlyChart({ monthly }: { monthly: NonNullable<ReportData["monthly"]> }) {
  const { colors } = useTheme();
  const chartData = monthly.map((m) => ({ name: arabicMonths[m.month - 1], إيرادات: m.income, مصروفات: m.expense }));
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">الإيرادات والمصروفات حسب الشهر</h3>
      <div className="h-[240px]" dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={3} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => compactAmount(v)} width={36} />
            <Tooltip
              formatter={(value) => [`${formatAmount(Number(value))} ج.م`]}
              contentStyle={{ borderRadius: 12, border: `1px solid ${colors.tooltipBorder}`, background: colors.tooltipBg, color: colors.tooltipText, fontSize: 12 }}
              cursor={{ fill: colors.cursor }}
            />
            <Bar dataKey="إيرادات" fill={colors.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="مصروفات" fill={colors.expense} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
  const barClass = type === "income" ? "bg-income" : "bg-expense";
  const borderClass = type === "income" ? "border-income/20" : "border-expense/20";

  return (
    <div className={`bg-surface border ${borderClass} rounded-2xl overflow-hidden`}>
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${colorClass}`}>{title}</h3>
        <span className={`text-xs font-bold ${colorClass}`}>{formatAmount(total)} ج.م</span>
      </div>
      {categories.length > 0 ? (
        <ul className="divide-y divide-border">
          {categories.map((cat) => {
            const pct = total > 0 ? (cat.total / total) * 100 : 0;
            return (
              <li key={cat.categoryId} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <span className="text-text-primary truncate">
                    {cat.icon && <span className="ml-1">{cat.icon}</span>}
                    {cat.nameAr}
                    <span className="text-text-muted mr-1.5">({cat.count})</span>
                  </span>
                  <span className="shrink-0">
                    <span className={`font-semibold ${colorClass}`}>{formatAmount(cat.total)}</span>
                    <span className="text-text-muted mr-2">{pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                  <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-center py-8 text-text-muted text-sm">لا توجد بيانات</div>
      )}
    </div>
  );
}

export function getPeriodLabel(mode: "month" | "year", month: number, year: number): string {
  if (mode === "month") return `${arabicMonths[month - 1]} ${year}`;
  return `عام ${year}`;
}
