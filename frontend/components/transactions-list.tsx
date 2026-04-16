"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatAmount,
  formatShortDate,
  paymentMethodLabels,
  arabicMonths,
} from "@/lib/utils";

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

interface TransactionsListProps {
  categories: Category[];
}

export function TransactionsList({ categories }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [filters, setFilters] = useState({
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
    type: "" as "" | "INCOME" | "EXPENSE",
    categoryId: "",
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (page = 1) => {
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
  }, [filters]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const filteredCategories = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;

  const years = [2025, 2026, 2027];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">سجل المعاملات</h1>

      <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              السنة
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters((f) => ({ ...f, year: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              الشهر
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters((f) => ({ ...f, month: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
            >
              <option value="">كل الأشهر</option>
              {arabicMonths.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              النوع
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  type: e.target.value as "" | "INCOME" | "EXPENSE",
                  categoryId: "",
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
            >
              <option value="">الكل</option>
              <option value="INCOME">إيراد</option>
              <option value="EXPENSE">مصروف</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              الفئة
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, categoryId: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
            >
              <option value="">كل الفئات</option>
              <optgroup label="إيرادات">
                {(filters.type
                  ? filteredCategories.filter((c) => c.type === "INCOME")
                  : incomeCategories
                ).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.nameAr}
                  </option>
                ))}
              </optgroup>
              <optgroup label="مصروفات">
                {(filters.type
                  ? filteredCategories.filter((c) => c.type === "EXPENSE")
                  : expenseCategories
                ).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.nameAr}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري التحميل...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            لا توجد معاملات
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      التاريخ
                    </th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      الوصف
                    </th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      الفئة
                    </th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      طريقة الدفع
                    </th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                      المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td colSpan={5} className="p-0">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === tx.id ? null : tx.id
                            )
                          }
                          className="w-full text-right"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-bg transition-colors cursor-pointer">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <span className="text-sm text-text-secondary whitespace-nowrap">
                                {formatShortDate(tx.date)}
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
                              <span className="text-xs text-text-muted shrink-0">
                                {paymentMethodLabels[tx.paymentMethod] || tx.paymentMethod}
                              </span>
                              {tx.attachmentUrl && (
                                <span className="text-xs text-text-muted shrink-0">
                                  📎
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-sm font-semibold whitespace-nowrap mr-4 ${
                                tx.type === "INCOME"
                                  ? "text-primary"
                                  : "text-expense"
                              }`}
                            >
                              {tx.type === "INCOME" ? "+" : "-"}
                              {formatAmount(tx.amount)} ج.م
                            </span>
                          </div>
                        </button>

                        {expandedId === tx.id && (
                          <div className="px-4 py-3 bg-bg border-b border-border">
                            {(tx.notes || tx.attachmentUrl) ? (
                              <div className="flex flex-col gap-2">
                                {tx.notes && (
                                  <div className="text-sm text-text-secondary">
                                    <span className="font-medium text-text-primary">
                                      ملاحظات:
                                    </span>{" "}
                                    {tx.notes}
                                  </div>
                                )}
                                {tx.attachmentUrl && (
                                  <div>
                                    <a
                                      href={tx.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                      📎 عرض المرفق
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-text-muted">
                                لا توجد ملاحظات أو مرفقات
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-text-secondary">
                  {pagination.total} معاملة — صفحة {pagination.page} من{" "}
                  {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
