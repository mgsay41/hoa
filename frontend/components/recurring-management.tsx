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

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/recurring");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data);
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
    try {
      const res = await fetch(`/api/recurring/${id}/toggle`, {
        method: "PATCH",
      });

      if (!res.ok) {
        toast("حدث خطأ أثناء تحديث الحالة", "error");
        return;
      }

      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      toast(currentActive ? "تم تعطيل البند" : "تم تفعيل البند");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة البنود المتكررة</h1>
        <a
          href="/admin/recurring/new"
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          إضافة بند جديد
        </a>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          جاري التحميل...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          لا توجد بنود متكررة
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-text-primary">
                      {item.nameAr}
                    </h3>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === "INCOME"
                          ? "bg-primary-light text-primary"
                          : "bg-red-50 text-expense"
                      }`}
                    >
                      {item.type === "INCOME" ? "إيراد" : "مصروف"}
                    </span>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.isActive ? "نشط" : "معطل"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-text-secondary">
                    <span>
                      المبلغ:{" "}
                      <span
                        className={`font-semibold ${
                          item.type === "INCOME"
                            ? "text-primary"
                            : "text-expense"
                        }`}
                      >
                        {formatAmount(item.amount)} ج.م
                      </span>
                    </span>
                    <span>
                      الفئة: {item.category.icon} {item.category.nameAr}
                    </span>
                    <span>يوم {item.dayOfMonth} من كل شهر</span>
                    <span>البداية: {formatDate(item.startDate)}</span>
                    {item.endDate && (
                      <span>النهاية: {formatDate(item.endDate)}</span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-sm text-text-muted mt-2">{item.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(item.id, item.isActive)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    item.isActive
                      ? "border-expense text-expense hover:bg-red-50"
                      : "border-primary text-primary hover:bg-primary-light"
                  }`}
                >
                  {item.isActive ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
