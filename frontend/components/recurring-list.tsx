"use client";

import { useState, useEffect } from "react";
import { formatAmount, formatDate } from "@/lib/utils";

type Category = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
};

type RecurringItem = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  categoryId: string;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  category: Category;
};

export function RecurringList() {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recurring")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-text-secondary">
        جاري التحميل...
      </div>
    );
  }

  const activeItems = items.filter((item) => item.isActive);
  const inactiveItems = items.filter((item) => !item.isActive);

  const totalMonthlyIncome = activeItems
    .filter((i) => i.type === "INCOME")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalMonthlyExpense = activeItems
    .filter((i) => i.type === "EXPENSE")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">بنود تلقائية متكررة</h1>
      <p className="text-text-secondary mb-6">
        المعاملات التي يتم إنشاؤها تلقائياً كل شهر
      </p>

      {activeItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <span className="text-sm text-text-secondary block mb-1">
              إجمالي الإيرادات الشهرية
            </span>
            <span className="text-xl font-bold text-primary">
              +{formatAmount(totalMonthlyIncome)} ج.م
            </span>
          </div>
          <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <span className="text-sm text-text-secondary block mb-1">
              إجمالي المصروفات الشهرية
            </span>
            <span className="text-xl font-bold text-expense">
              -{formatAmount(totalMonthlyExpense)} ج.م
            </span>
          </div>
          <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <span className="text-sm text-text-secondary block mb-1">
              صافي البنود المتكررة
            </span>
            <span
              className={`text-xl font-bold ${
                totalMonthlyIncome - totalMonthlyExpense >= 0
                  ? "text-primary"
                  : "text-expense"
              }`}
            >
              {formatAmount(totalMonthlyIncome - totalMonthlyExpense)} ج.م
            </span>
          </div>
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">البنود النشطة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.type === "INCOME"
                        ? "bg-primary-light text-primary"
                        : "bg-red-50 text-expense"
                    }`}
                  >
                    {item.type === "INCOME" ? "إيراد" : "مصروف"}
                  </span>
                  <span className="text-xs text-text-muted">
                    يوم {item.dayOfMonth}
                  </span>
                </div>

                <h3 className="font-semibold text-text-primary mb-1">
                  {item.nameAr}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-lg font-bold ${
                      item.type === "INCOME"
                        ? "text-primary"
                        : "text-expense"
                    }`}
                  >
                    {item.type === "INCOME" ? "+" : "-"}
                    {formatAmount(item.amount)} ج.م
                  </span>
                </div>

                <div className="text-sm text-text-secondary">
                  {item.category.icon} {item.category.nameAr}
                </div>

                <div className="text-xs text-text-muted mt-2">
                  من {formatDate(item.startDate)}
                  {item.endDate && ` حتى ${formatDate(item.endDate)}`}
                </div>

                {item.notes && (
                  <p className="text-xs text-text-muted mt-2 border-t border-border pt-2">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-secondary">
            بنود معطلة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] opacity-60"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    معطل
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.type === "INCOME"
                        ? "bg-primary-light text-primary"
                        : "bg-red-50 text-expense"
                    }`}
                  >
                    {item.type === "INCOME" ? "إيراد" : "مصروف"}
                  </span>
                </div>

                <h3 className="font-semibold text-text-primary mb-1">
                  {item.nameAr}
                </h3>
                <span className="text-sm font-semibold text-text-secondary">
                  {formatAmount(item.amount)} ج.م
                </span>
                <div className="text-xs text-text-muted mt-2">
                  {item.category.icon} {item.category.nameAr}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          لا توجد بنود متكررة
        </div>
      )}
    </div>
  );
}
