"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";

type CategoryWithCount = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
  _count: {
    transactions: number;
    recurring: number;
  };
};

interface AdminCategoriesListProps {
  categories: CategoryWithCount[];
}

export function AdminCategoriesList({ categories: initialCategories }: AdminCategoriesListProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  async function handleDelete(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "حدث خطأ أثناء حذف الفئة", "error");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast("تم حذف الفئة بنجاح");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function renderSection(title: string, items: CategoryWithCount[]) {
    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          {title}
        </h2>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">لا توجد فئات</div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors"
                >
                  {/* Color swatch + icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                    style={{ backgroundColor: (cat.color || "#6B7280") + "20" }}
                  >
                    {cat.icon || "📦"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{cat.nameAr}</p>
                    <p className="text-xs text-text-muted">
                      {cat._count.transactions + cat._count.recurring} معاملة
                    </p>
                  </div>

                  {/* Color dot */}
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-border"
                    style={{ backgroundColor: cat.color || "#6B7280" }}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-expense hover:bg-expense-bg transition-colors disabled:opacity-50"
                    >
                      {deletingId === cat.id ? (
                        <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">إدارة الفئات</h1>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-bg hover:bg-primary-dark transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          فئة جديدة
        </Link>
      </div>

      {renderSection("إيرادات", incomeCategories)}
      {renderSection("مصروفات", expenseCategories)}
    </div>
  );
}
