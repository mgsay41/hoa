"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/toast";
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
  lastGeneratedMonth: number | null;
  lastGeneratedYear: number | null;
  notes: string | null;
  createdAt: string;
  category: Category;
};

export function RecurringManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/recurring");
      if (!res.ok) return;
      setItems(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/recurring/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) {
        toast("حدث خطأ أثناء تحديث الحالة", "error");
        return;
      }
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast(currentActive ? "تم تعطيل البند" : "تم تفعيل البند");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">إدارة البنود المتكررة</h1>
          <p className="text-sm text-text-muted mt-0.5">تفعيل وتعطيل البنود الشهرية</p>
        </div>
        <a
          href="/admin/recurring/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">إضافة بند</span>
          <span className="sm:hidden">إضافة</span>
        </a>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <div className="skeleton h-5 w-14 rounded-full" />
                    <div className="skeleton h-5 w-10 rounded-full" />
                  </div>
                  <div className="skeleton h-5 w-40 mb-2" />
                  <div className="skeleton h-3.5 w-56" />
                </div>
                <div className="skeleton h-9 w-20 rounded-xl shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span className="text-sm">لا توجد بنود متكررة</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const isIncome = item.type === "INCOME";
            const isToggling = togglingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-surface border rounded-2xl p-4 sm:p-5 transition-opacity ${
                  item.isActive ? (isIncome ? "border-income/20" : "border-expense/20") : "border-border opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isIncome ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
                      }`}>
                        {isIncome ? "إيراد" : "مصروف"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        item.isActive
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-border text-text-muted bg-surface-elevated"
                      }`}>
                        {item.isActive ? "● نشط" : "○ معطل"}
                      </span>
                    </div>

                    {/* Name + Amount */}
                    <div className="flex items-baseline gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-text-primary text-sm">{item.nameAr}</h3>
                      <span className={`font-bold text-base ${isIncome ? "text-income" : "text-expense"}`}>
                        {formatAmount(item.amount)}
                        <span className="text-xs font-normal text-text-muted mr-0.5">ج.م</span>
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>{item.category.icon} {item.category.nameAr}</span>
                      <span>يوم {item.dayOfMonth} من كل شهر</span>
                      <span>منذ {formatDate(item.startDate)}</span>
                      {item.endDate && <span>حتى {formatDate(item.endDate)}</span>}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.notes}</p>
                    )}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(item.id, item.isActive)}
                    disabled={isToggling}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 disabled:opacity-40 ${
                      item.isActive
                        ? "border-expense/40 text-expense hover:bg-expense-bg"
                        : "border-primary/40 text-primary hover:bg-primary/10"
                    }`}
                  >
                    {isToggling ? (
                      <svg className="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : item.isActive ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                      </svg>
                    )}
                    {item.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
