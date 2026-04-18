"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/toast";

type CategoryFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      initialData: {
        id: string;
        nameAr: string;
        type: "INCOME" | "EXPENSE";
        icon: string;
        color: string;
      };
    };

const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-muted text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

export function CategoryForm(props: CategoryFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [nameAr, setNameAr] = useState(isEdit ? props.initialData.nameAr : "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    isEdit ? props.initialData.type : "EXPENSE"
  );
  const [icon, setIcon] = useState(isEdit ? props.initialData.icon : "");
  const [color, setColor] = useState(isEdit ? props.initialData.color : "#00C2A8");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim()) {
      toast("يرجى إدخال اسم الفئة", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const body = { nameAr: nameAr.trim(), type, icon: icon || undefined, color: color || undefined };

      if (isEdit) {
        const res = await fetch(`/api/categories/${props.initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error || "حدث خطأ أثناء تحديث الفئة", "error");
          setIsSubmitting(false);
          return;
        }
        toast("تم تحديث الفئة بنجاح");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error || "حدث خطأ أثناء إضافة الفئة", "error");
          setIsSubmitting(false);
          return;
        }
        toast("تمت إضافة الفئة بنجاح");
      }
      router.push("/admin/categories");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          {isEdit ? "تعديل الفئة" : "إضافة فئة جديدة"}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {isEdit ? "عدّل تفاصيل الفئة" : "أدخل تفاصيل الفئة الجديدة"}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Arabic name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              اسم الفئة (بالعربية)
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className={fieldClass}
              placeholder="مثال: تبرع شهري"
              required
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              النوع
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${
                  type === "INCOME"
                    ? "bg-income-bg border-income/40 text-income"
                    : "bg-bg border-border text-text-muted hover:border-income/20 hover:text-income/70"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                إيراد
              </button>
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${
                  type === "EXPENSE"
                    ? "bg-expense-bg border-expense/40 text-expense"
                    : "bg-bg border-border text-text-muted hover:border-expense/20 hover:text-expense/70"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                مصروف
              </button>
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              الأيقونة (إيموجي)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={fieldClass}
              placeholder="🤲"
              maxLength={4}
            />
            {icon && (
              <span className="text-2xl mt-2 inline-block">{icon}</span>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              اللون
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-border cursor-pointer p-1 bg-transparent"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`${fieldClass} flex-1`}
                placeholder="#00C2A8"
                maxLength={7}
              />
            </div>
          </div>

          {isEdit && (
            <Link
              href="/admin/categories"
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-1 flex items-center justify-center gap-2 bg-surface-elevated border border-border text-text-secondary hover:bg-surface hover:border-border-light"
            >
              إلغاء
            </Link>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-1 flex items-center justify-center gap-2 bg-primary text-bg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {isEdit ? "جارٍ التحديث..." : "جارٍ الإضافة..."}
              </>
            ) : (
              isEdit ? "حفظ التعديلات" : "إضافة الفئة"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
