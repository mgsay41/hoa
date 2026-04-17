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
      <div className="fade-in">
        <div className="mb-6">
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-3.5 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4">
              <div className="skeleton h-3 w-24 mb-2" />
              <div className="skeleton h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex gap-2 mb-3">
                <div className="skeleton h-5 w-14 rounded-full" />
                <div className="skeleton h-5 w-10 rounded-full" />
              </div>
              <div className="skeleton h-5 w-32 mb-2" />
              <div className="skeleton h-7 w-24 mb-3" />
              <div className="skeleton h-3.5 w-40" />
            </div>
          ))}
        </div>
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
  const net = totalMonthlyIncome - totalMonthlyExpense;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">البنود التلقائية المتكررة</h1>
        <p className="text-sm text-text-muted mt-1">معاملات تُنشأ تلقائياً كل شهر</p>
      </div>

      {activeItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface border border-income/20 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 leading-tight">إيرادات شهرية</p>
            <p className="text-base sm:text-lg font-bold text-income">
              +{formatAmount(totalMonthlyIncome)}
              <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
            </p>
          </div>
          <div className="bg-surface border border-expense/20 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 leading-tight">مصروفات شهرية</p>
            <p className="text-base sm:text-lg font-bold text-expense">
              −{formatAmount(totalMonthlyExpense)}
              <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
            </p>
          </div>
          <div className={`bg-surface border rounded-xl p-3 sm:p-4 ${net >= 0 ? "border-primary/20" : "border-expense/20"}`}>
            <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 leading-tight">الصافي الشهري</p>
            <p className={`text-base sm:text-lg font-bold ${net >= 0 ? "text-primary" : "text-expense"}`}>
              {net >= 0 ? "+" : "−"}{formatAmount(Math.abs(net))}
              <span className="text-[10px] font-normal text-text-muted mr-0.5">ج.م</span>
            </p>
          </div>
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">البنود النشطة</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map((item) => (
              <RecurringCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {inactiveItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">البنود المعطلة</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveItems.map((item) => (
              <RecurringCard key={item.id} item={item} inactive />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span className="text-sm">لا توجد بنود متكررة</span>
        </div>
      )}
    </div>
  );
}

function RecurringCard({ item, inactive }: { item: RecurringItem; inactive?: boolean }) {
  const isIncome = item.type === "INCOME";
  return (
    <div className={`bg-surface border rounded-2xl p-4 sm:p-5 transition-opacity ${
      inactive ? "opacity-50 border-border" : isIncome ? "border-income/20" : "border-expense/20"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {inactive && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated text-text-muted border border-border">
            معطل
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          isIncome ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
        }`}>
          {isIncome ? "إيراد" : "مصروف"}
        </span>
        <span className="text-[10px] text-text-muted mr-auto">
          يوم {item.dayOfMonth}
        </span>
      </div>

      <h3 className="font-semibold text-text-primary text-sm mb-2">{item.nameAr}</h3>

      <p className={`text-xl font-bold mb-3 ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "−"}{formatAmount(item.amount)}
        <span className="text-xs font-normal text-text-muted mr-0.5">ج.م</span>
      </p>

      <div className="text-xs text-text-muted">
        {item.category.icon} {item.category.nameAr}
      </div>

      <div className="text-[10px] text-text-muted mt-1.5">
        من {formatDate(item.startDate)}
        {item.endDate && ` حتى ${formatDate(item.endDate)}`}
      </div>

      {item.notes && (
        <p className="text-[10px] text-text-muted mt-2.5 pt-2.5 border-t border-border leading-relaxed">
          {item.notes}
        </p>
      )}
    </div>
  );
}
