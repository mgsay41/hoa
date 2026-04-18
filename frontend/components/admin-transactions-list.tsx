"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  formatAmount,
  formatShortDate,
  paymentMethodLabels,
  arabicMonths,
} from "@/lib/utils";
import { useToast } from "@/components/toast";

type Category = {
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
  attachmentUrl: string | null;
  attachmentType: string | null;
  notes: string | null;
  category: Category;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

interface AdminTransactionsListProps {
  categories: Category[];
}

export function AdminTransactionsList({ categories }: AdminTransactionsListProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const now = new Date();
  const [filters, setFilters] = useState({
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
    type: "" as "" | "INCOME" | "EXPENSE",
    categoryId: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.month) params.set("month", filters.month);
        if (filters.year) params.set("year", filters.year);
        if (filters.type) params.set("type", filters.type);
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        params.set("page", page.toString());
        params.set("limit", "20");
        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const filteredCategories = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;

  const years = [2025, 2026, 2027];

  async function handleDelete(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه المعاملة؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "حدث خطأ أثناء حذف المعاملة", "error");
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast("تم حذف المعاملة بنجاح");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fade-in">
      <h1 className="text-xl font-bold text-text-primary mb-5">سجل المعاملات</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "السنة",
              content: (
                <select
                  value={filters.year}
                  onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              ),
            },
            {
              label: "الشهر",
              content: (
                <select
                  value={filters.month}
                  onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
                >
                  <option value="">كل الأشهر</option>
                  {arabicMonths.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              ),
            },
            {
              label: "النوع",
              content: (
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      type: e.target.value as "" | "INCOME" | "EXPENSE",
                      categoryId: "",
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
                >
                  <option value="">الكل</option>
                  <option value="INCOME">إيراد</option>
                  <option value="EXPENSE">مصروف</option>
                </select>
              ),
            },
            {
              label: "الفئة",
              content: (
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
                >
                  <option value="">كل الفئات</option>
                  <optgroup label="إيرادات">
                    {(filters.type
                      ? filteredCategories.filter((c) => c.type === "INCOME")
                      : incomeCategories
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.nameAr}</option>
                    ))}
                  </optgroup>
                  <optgroup label="مصروفات">
                    {(filters.type
                      ? filteredCategories.filter((c) => c.type === "EXPENSE")
                      : expenseCategories
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.nameAr}</option>
                    ))}
                  </optgroup>
                </select>
              ),
            },
          ].map(({ label, content }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-text-muted mb-1.5">{label}</label>
              {content}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
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
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="13" y2="13" />
            </svg>
            <span className="text-sm">لا توجد معاملات لهذه الفترة</span>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition-colors text-right"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "INCOME" ? "bg-income-bg" : "bg-expense-bg"
                    }`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke={tx.type === "INCOME" ? "#34D399" : "#FB7185"}
                        strokeWidth="2.5" strokeLinecap="round">
                        {tx.type === "INCOME"
                          ? <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>
                          : <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>
                        }
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm text-text-primary truncate font-medium">
                        {tx.descriptionAr}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-text-muted">{formatShortDate(tx.date)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          tx.type === "INCOME"
                            ? "bg-income-bg text-income"
                            : "bg-expense-bg text-expense"
                        }`}>
                          {tx.category.icon} {tx.category.nameAr}
                        </span>
                        <span className="text-[10px] text-text-muted hidden sm:inline">
                          {paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod}
                        </span>
                        {tx.attachmentUrl && (
                          <span className="text-[10px] text-text-muted">📎</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${
                        tx.type === "INCOME" ? "text-income" : "text-expense"
                      }`}>
                        {tx.type === "INCOME" ? "+" : "−"}{formatAmount(tx.amount)}
                        <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
                      </span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        className={`text-text-muted transition-transform duration-200 ${
                          expandedId === tx.id ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {expandedId === tx.id && (
                    <div className="px-4 py-3 bg-surface-elevated border-t border-border">
                      <div className="flex flex-col gap-2">
                        <div className="sm:hidden flex items-center gap-2 text-xs">
                          <span className="text-text-muted">طريقة الدفع:</span>
                          <span className="text-text-secondary">{paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod}</span>
                        </div>
                        {tx.notes && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-text-muted shrink-0">ملاحظات:</span>
                            <span className="text-text-secondary">{tx.notes}</span>
                          </div>
                        )}
                        {!tx.notes && !tx.attachmentUrl && (
                          <span className="text-xs text-text-muted">لا توجد تفاصيل إضافية</span>
                        )}

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                          <Link
                            href={`/admin/transactions/${tx.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            تعديل
                          </Link>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-expense-bg text-expense hover:bg-expense/20 transition-colors disabled:opacity-50"
                          >
                            {deletingId === tx.id ? (
                              <svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            )}
                            {deletingId === tx.id ? "جارٍ الحذف..." : "حذف"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-border">
                <span className="text-xs text-text-muted">
                  {pagination.total} معاملة — صفحة {pagination.page} من {pagination.totalPages}
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
    </div>
  );
}
