"use client";

import { forwardRef, type ReactNode } from "react";
import type { ReportData } from "@/components/report-view";
import { arabicMonths, paymentMethodLabels } from "@/lib/utils";

export type PdfTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  descriptionAr: string;
  paymentMethod: string;
  fund: "OPERATING" | "RESERVE";
  category: { nameAr: string };
};

// A4 at 96 dpi. Every page has a fixed size so html2canvas captures exactly one sheet.
const PAGE_W = 794;
const PAGE_H = 1123;
const ROW_H = 25;
const ROWS_PER_PAGE = 31;

// Fixed print palette — the PDF is always on white whatever the screen theme
const C = {
  income: "#059669",
  expense: "#E11D48",
  primary: "#0F9D8A",
  reserve: "#B7791F",
  text: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F8FAFB",
};

const font = "var(--font-ibm-plex-arabic), 'IBM Plex Sans Arabic', sans-serif";

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Western digits in the PDF: html2canvas garbles Arabic-Indic digit runs, and "1,250.00" is unambiguous
function money(value: number | string) {
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function longDate(d: Date) {
  return `${d.getDate()} ${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
}

type Section = { kind: "INCOME" | "EXPENSE"; rows: PdfTransaction[]; isFirst: boolean; isLast: boolean; total: number };

/** Off-screen A4 pages: summary first, then every income line, then every expense line. */
export const ReportPdfPages = forwardRef<HTMLDivElement, { data: ReportData; transactions: PdfTransaction[] }>(
  function ReportPdfPages({ data, transactions }, ref) {
    const income = transactions.filter((t) => t.type === "INCOME");
    const expense = transactions.filter((t) => t.type === "EXPENSE");

    const sections: Section[] = [];
    for (const [kind, list, total] of [
      ["INCOME", income, data.income],
      ["EXPENSE", expense, data.expense],
    ] as const) {
      const pages = chunk(list, ROWS_PER_PAGE);
      pages.forEach((rows, i) =>
        sections.push({ kind, rows, isFirst: i === 0, isLast: i === pages.length - 1, total })
      );
    }

    const totalPages = 1 + sections.length;
    const issued = longDate(new Date());

    return (
      <div ref={ref} dir="rtl" style={{ fontFamily: font, color: C.text }}>
        <Page number={1} total={totalPages} period={data.periodLabel} issued={issued}>
          <SummaryPage data={data} incomeCount={income.length} expenseCount={expense.length} issued={issued} />
        </Page>
        {sections.map((section, i) => (
          <Page key={i} number={i + 2} total={totalPages} period={data.periodLabel} issued={issued}>
            <DetailTable section={section} />
          </Page>
        ))}
      </div>
    );
  }
);

function Page({
  number,
  total,
  period,
  issued,
  children,
}: {
  number: number;
  total: number;
  period: string;
  issued: string;
  children: ReactNode;
}) {
  return (
    <div
      data-pdf-page
      style={{
        width: PAGE_W,
        height: PAGE_H,
        padding: "34px 38px 26px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {number > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>اتحاد ملاك برج الوليد</span>
          <span style={{ fontSize: 11, color: C.muted }}>تقرير مالي — {period}</span>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
        <span>صفحة {number} من {total}</span>
        <span>صدر في {issued}</span>
      </div>
    </div>
  );
}

function SummaryPage({
  data,
  incomeCount,
  expenseCount,
  issued,
}: {
  data: ReportData;
  incomeCount: number;
  expenseCount: number;
  issued: string;
}) {
  const maxMonthly = data.monthly ? Math.max(1, ...data.monthly.flatMap((m) => [m.income, m.expense])) : 1;
  return (
    <>
      <div style={{ borderBottom: `2px solid ${C.primary}`, paddingBottom: 14, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, margin: 0 }}>اتحاد ملاك برج الوليد</h1>
          <p style={{ fontSize: 15, color: C.muted, margin: "4px 0 0" }}>تقرير مالي — {data.periodLabel}</p>
        </div>
        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>تاريخ الإصدار: {issued}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "إجمالي الإيرادات", value: data.income, color: C.income, hint: `${incomeCount} معاملة` },
          { label: "إجمالي المصروفات", value: data.expense, color: C.expense, hint: `${expenseCount} معاملة` },
          { label: "صافي الفترة", value: data.net, color: data.net >= 0 ? C.primary : C.expense, hint: data.net >= 0 ? "فائض" : "عجز" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: s.color, margin: "6px 0 2px", lineHeight: "28px" }}>
              <span dir="ltr">{s.value > 0 && s.label === "صافي الفترة" ? "+" : ""}{money(s.value)}</span>{" "}
              <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>ج.م</span>
            </p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{s.hint}</p>
          </div>
        ))}
      </div>

      {data.monthly && (
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>ملخص الأشهر</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}>
                <th style={{ textAlign: "right", padding: "3px 6px 6px", lineHeight: "16px", fontWeight: 500, width: 80 }}>الشهر</th>
                <th style={{ textAlign: "left", padding: "3px 6px 6px", lineHeight: "16px", fontWeight: 500, width: 95 }}>الإيرادات</th>
                <th style={{ textAlign: "left", padding: "3px 6px 6px", lineHeight: "16px", fontWeight: 500, width: 95 }}>المصروفات</th>
                <th style={{ textAlign: "left", padding: "3px 6px 6px", lineHeight: "16px", fontWeight: 500, width: 95 }}>الصافي</th>
                <th style={{ padding: "3px 6px 6px", lineHeight: "16px" }} />
              </tr>
            </thead>
            <tbody>
              {/* Months with no activity yet (e.g. the rest of the current year) are left out */}
              {data.monthly.filter((m) => m.income > 0 || m.expense > 0).map((m) => {
                const net = m.income - m.expense;
                return (
                  <tr key={m.month} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "3px 6px 6px", lineHeight: "16px" }}>{arabicMonths[m.month - 1]}</td>
                    <td style={{ padding: "3px 6px 6px", lineHeight: "16px", textAlign: "left", color: C.income }}>{money(m.income)}</td>
                    <td style={{ padding: "3px 6px 6px", lineHeight: "16px", textAlign: "left", color: C.expense }}>{money(m.expense)}</td>
                    <td style={{ padding: "3px 6px 6px", lineHeight: "16px", textAlign: "left", fontWeight: 600, color: net >= 0 ? C.primary : C.expense, direction: "ltr" }}>{money(net)}</td>
                    <td style={{ padding: "3px 6px 6px", lineHeight: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ height: 4, width: `${(m.income / maxMonthly) * 100}%`, background: C.income, borderRadius: 2 }} />
                        <div style={{ height: 4, width: `${(m.expense / maxMonthly) * 100}%`, background: C.expense, borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <CategoryBreakdown title="الإيرادات حسب الفئة" categories={data.incomeCategories} total={data.income} color={C.income} />
        <CategoryBreakdown title="المصروفات حسب الفئة" categories={data.expenseCategories} total={data.expense} color={C.expense} />
      </div>

      <p style={{ fontSize: 11, color: C.muted, marginTop: 16 }}>
        التفاصيل الكاملة لكل الإيرادات والمصروفات في الصفحات التالية.
      </p>
    </>
  );
}

function CategoryBreakdown({
  title,
  categories,
  total,
  color,
}: {
  title: string;
  categories: ReportData["incomeCategories"];
  total: number;
  color: string;
}) {
  return (
    <div style={{ background: C.soft, borderRadius: 10, padding: 14, border: `1px solid ${C.line}` }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color, margin: "0 0 10px" }}>{title}</h3>
      {categories.length === 0 ? (
        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: "12px 0", margin: 0 }}>لا توجد بيانات</p>
      ) : (
        <>
          {categories.map((cat) => {
            const pct = total > 0 ? (cat.total / total) * 100 : 0;
            return (
              <div key={cat.categoryId} style={{ marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, lineHeight: "18px", marginBottom: 3 }}>
                  <span>{cat.icon} {cat.nameAr} <span style={{ color: C.muted }}>({cat.count})</span></span>
                  <span style={{ display: "flex", gap: 10, direction: "ltr" }}>
                    <span style={{ color: C.muted, width: 42, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                    <b style={{ color, minWidth: 74, textAlign: "right" }}>{money(cat.total)}</b>
                  </span>
                </div>
                <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${C.line}`, paddingTop: 7, marginTop: 4, fontSize: 12, fontWeight: 700 }}>
            <span>الإجمالي</span>
            <span style={{ color }}>{money(total)} ج.م</span>
          </div>
        </>
      )}
    </div>
  );
}

function DetailTable({ section }: { section: Section }) {
  const isIncome = section.kind === "INCOME";
  const color = isIncome ? C.income : C.expense;
  const cell = {
    padding: "0 6px 3px",
    height: ROW_H,
    lineHeight: `${ROW_H - 3}px`,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <>
      <h2 style={{ fontSize: 15, fontWeight: 700, color, margin: "0 0 10px" }}>
        {isIncome ? "تفاصيل الإيرادات" : "تفاصيل المصروفات"}
        {!section.isFirst && <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}> (تابع)</span>}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 }}>
        <colgroup>
          <col style={{ width: 78 }} />
          <col />
          <col style={{ width: 120 }} />
          <col style={{ width: 78 }} />
          <col style={{ width: 92 }} />
        </colgroup>
        <thead>
          <tr style={{ background: C.soft, color: C.muted, borderBottom: `1px solid ${C.line}` }}>
            <th style={{ ...cell, textAlign: "right", fontWeight: 500 }}>التاريخ</th>
            <th style={{ ...cell, textAlign: "right", fontWeight: 500 }}>البيان</th>
            <th style={{ ...cell, textAlign: "right", fontWeight: 500 }}>الفئة</th>
            <th style={{ ...cell, textAlign: "right", fontWeight: 500 }}>الدفع</th>
            <th style={{ ...cell, textAlign: "left", fontWeight: 500 }}>المبلغ (ج.م)</th>
          </tr>
        </thead>
        <tbody>
          {section.rows.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: `1px solid ${C.line}` }}>
              <td style={{ ...cell, color: C.muted }}>{shortDate(tx.date)}</td>
              <td style={cell}>
                {tx.descriptionAr}
                {tx.fund === "RESERVE" && <span style={{ color: C.reserve, fontSize: 10 }}> • صندوق الطوارئ</span>}
              </td>
              <td style={{ ...cell, color: C.muted }}>{tx.category.nameAr}</td>
              <td style={{ ...cell, color: C.muted }}>{paymentMethodLabels[tx.paymentMethod] ?? tx.paymentMethod}</td>
              <td style={{ ...cell, textAlign: "left", fontWeight: 600, color, direction: "ltr" }}>{money(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
        {section.isLast && (
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.text}` }}>
              <td colSpan={4} style={{ ...cell, fontWeight: 700, height: ROW_H + 4 }}>
                {isIncome ? "إجمالي الإيرادات" : "إجمالي المصروفات"}
              </td>
              <td style={{ ...cell, textAlign: "left", fontWeight: 700, color, direction: "ltr" }}>{money(section.total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </>
  );
}
