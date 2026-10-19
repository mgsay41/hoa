"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  formatAmount,
  formatShortDate,
  paymentMethodLabels,
  arabicMonths,
} from "@/lib/utils";
import { useYears } from "@/lib/use-years";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/states";
import { TypeIcon } from "@/components/type-icon";

export type BrowserCategory = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  descriptionAr: string;
  categoryId: string;
  paymentMethod: string;
  fund: "OPERATING" | "RESERVE";
  periodMonth: number | null;
  periodYear: number | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  notes: string | null;
  category: BrowserCategory;
  unit: { id: string; code: string } | null;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

type Sort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const SORT_LABELS: Record<Sort, string> = {
  date_desc: "الأحدث أولاً",
  date_asc: "الأقدم أولاً",
  amount_desc: "الأعلى مبلغاً",
  amount_asc: "الأقل مبلغاً",
};

const selectClass =
  "w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

export function TransactionsBrowser({
  categories,
  admin = false,
}: {
  categories: BrowserCategory[];
  admin?: boolean;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const years = useYears();
  const now = new Date();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
    type: "" as "" | "INCOME" | "EXPENSE",
    categoryId: "",
    q: "",
    sort: "date_desc" as Sort,
  });

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === searchInput.trim() ? f : { ...f, q: searchInput.trim() })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.month) params.set("month", filters.month);
    if (filters.year) params.set("year", filters.year);
    if (filters.type) params.set("type", filters.type);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.q) params.set("q", filters.q);
    if (filters.sort !== "date_desc") params.set("sort", filters.sort);
    return params;
  }, [filters]);

  const requestId = useRef(0);
  const fetchTransactions = useCallback(
    async (page = 1) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(false);
      try {
        const params = buildParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (id !== requestId.current) return; // a newer request superseded this one
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch {
        if (id === requestId.current) setError(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const visibleCategories = filters.type ? categories.filter((c) => c.type === filters.type) : categories;
  const exportHref = `/api/transactions/export?${buildParams().toString()}`;
  const hasActiveFilters = !!(filters.type || filters.categoryId || filters.q);

  async function handleDelete(tx: Transaction) {
    const ok = await confirm({
      title: "حذف المعاملة؟",
      message: `سيتم حذف «${tx.descriptionAr}» بقيمة ${formatAmount(tx.amount)} ج.م. سيظهر الحذف في سجل التغييرات العام.`,
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(tx.id);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "حدث خطأ أثناء حذف المعاملة", "error");
        return;
      }
      toast("تم حذف المعاملة بنجاح");
      // Refetch so pagination totals stay correct (go back a page if this one is now empty)
      const page = transactions.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      await fetchTransactions(page);
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">سجل المعاملات</h1>
          {!loading && !error && (
            <p className="text-xs text-text-muted mt-0.5">{pagination.total.toLocaleString("ar-EG")} معاملة</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
            title="تصدير المعاملات المعروضة إلى ملف Excel (CSV)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13l3 4M11 13l-3 4M14 17h2" />
            </svg>
            تصدير Excel
          </a>
          {admin && (
            <Link
              href="/admin/transactions/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-dark transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              إضافة
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في الوصف أو الملاحظات أو رقم الوحدة..."
              aria-label="بحث"
              className={`${selectClass} pr-9`}
            />
          </div>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as Sort }))}
            aria-label="الترتيب"
            className={`${selectClass} sm:w-44`}
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FilterField label="السنة">
            <select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} className={selectClass}>
              <option value="">كل السنوات</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="الشهر">
            <select
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
              disabled={!filters.year}
              className={`${selectClass} disabled:opacity-50`}
            >
              <option value="">كل الأشهر</option>
              {arabicMonths.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="النوع">
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as "" | "INCOME" | "EXPENSE", categoryId: "" }))}
              className={selectClass}
            >
              <option value="">الكل</option>
              <option value="INCOME">إيراد</option>
              <option value="EXPENSE">مصروف</option>
            </select>
          </FilterField>
          <FilterField label="الفئة">
            <select value={filters.categoryId} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))} className={selectClass}>
              <option value="">كل الفئات</option>
              {(["INCOME", "EXPENSE"] as const).map((t) => {
                const group = visibleCategories.filter((c) => c.type === t);
                if (group.length === 0) return null;
                return (
                  <optgroup key={t} label={t === "INCOME" ? "إيرادات" : "مصروفات"}>
                    {group.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.nameAr}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </FilterField>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters((f) => ({ ...f, type: "", categoryId: "", q: "" }));
            }}
            className="text-xs text-primary hover:underline"
          >
            مسح عوامل التصفية
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-3.5 w-40 mb-1.5" />
                  <div className="skeleton h-2.5 w-28" />
                </div>
                <div className="skeleton h-4 w-24 shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="تعذر تحميل المعاملات" onRetry={() => fetchTransactions(pagination.page)} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title={filters.q ? `لا توجد نتائج لـ «${filters.q}»` : "لا توجد معاملات لهذه الفترة"}
            hint={filters.month ? "جرّب اختيار «كل الأشهر» أو سنة أخرى" : undefined}
          />
        ) : (
          <>
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const expanded = expandedId === tx.id;
                return (
                  <div key={tx.id}>
                    <button
                      onClick={() => setExpandedId(expanded ? null : tx.id)}
                      aria-expanded={expanded}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition-colors text-right"
                    >
                      <TypeIcon type={tx.type} size="md" />

                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm text-text-primary truncate font-medium">{tx.descriptionAr}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-text-muted">{formatShortDate(tx.date)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            tx.type === "INCOME" ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
                          }`}>
                            {tx.category.icon} {tx.category.nameAr}
                          </span>
                          {tx.fund === "RESERVE" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning-bg text-warning">
                              صندوق الطوارئ
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted hidden sm:inline">
                            {paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod}
                          </span>
                          {tx.attachmentUrl && (
                            <span className="text-[10px] text-text-muted" aria-label="يوجد مرفق">📎</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
                          {tx.type === "INCOME" ? "+" : "−"}{formatAmount(tx.amount)}
                          <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                        </span>
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          className={`text-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-4 py-3 bg-surface-elevated border-t border-border">
                        <div className="flex flex-col gap-2 text-xs">
                          <DetailRow label="طريقة الدفع" value={paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod} />
                          {tx.unit && (
                            <DetailRow
                              label="الوحدة"
                              value={`${tx.unit.code}${tx.periodMonth && tx.periodYear ? ` — اشتراك ${arabicMonths[tx.periodMonth - 1]} ${tx.periodYear}` : ""}`}
                            />
                          )}
                          {tx.notes && <DetailRow label="ملاحظات" value={tx.notes} />}
                          {tx.attachmentUrl && tx.attachmentType === "IMAGE" && (
                            <button
                              onClick={() => setLightboxUrl(tx.attachmentUrl)}
                              className="inline-flex items-center gap-1.5 text-primary hover:underline self-start"
                            >
                              📎 عرض المرفق
                            </button>
                          )}
                          {tx.attachmentUrl && tx.attachmentType === "PDF" && (
                            <a href={tx.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline self-start">
                              📄 فتح المرفق (PDF)
                            </a>
                          )}

                          {admin && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                              <Link
                                href={`/admin/transactions/${tx.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                تعديل
                              </Link>
                              <button
                                onClick={() => handleDelete(tx)}
                                disabled={deletingId === tx.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-expense-bg text-expense hover:bg-expense/20 transition-colors disabled:opacity-50"
                              >
                                {deletingId === tx.id ? "جارٍ الحذف..." : "حذف"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-border">
                <span className="text-xs text-text-muted">
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Portal to <body> so the page's fade-in transform can't trap the fixed overlay */}
      {lightboxUrl && createPortal(
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="عرض المرفق"
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-8 right-0 text-white/80 hover:text-white text-sm"
            >
              ✕ إغلاق
            </button>
            <Image
              src={lightboxUrl}
              alt="المرفق"
              width={1200}
              height={900}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-muted shrink-0">{label}:</span>
      <span className="text-text-secondary">{value}</span>
    </div>
  );
}
