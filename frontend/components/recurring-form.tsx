"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";

type Category = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
};

interface RecurringFormProps {
  categories: Category[];
}

const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-muted text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

export function RecurringForm({ categories }: RecurringFormProps) {
  const { toast } = useToast();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [nameAr, setNameAr] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType: "INCOME" | "EXPENSE") => {
    setType(newType);
    setCategoryId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !amount || !categoryId || !startDate || !dayOfMonth) {
      toast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr, type, amount, categoryId,
          dayOfMonth: parseInt(dayOfMonth),
          startDate, endDate: endDate || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "حدث خطأ أثناء إضافة البند المتكرر", "error");
        setIsSubmitting(false);
        return;
      }
      toast("تمت إضافة البند المتكرر بنجاح");
      setNameAr(""); setAmount(""); setCategoryId(""); setDayOfMonth("1");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(""); setNotes("");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">إضافة بند متكرر جديد</h1>
        <p className="text-sm text-text-muted mt-1">بند يُنشأ تلقائياً كل شهر في يوم محدد</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              الاسم
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className={fieldClass}
              placeholder="مثال: إيجار المولد"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              النوع
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("INCOME")}
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
                onClick={() => handleTypeChange("EXPENSE")}
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

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              المبلغ الشهري
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
                placeholder="0.00"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-xs font-medium bg-surface-elevated px-1.5 py-0.5 rounded-md border border-border">
                ج.م
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              الفئة
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">اختر الفئة</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Day of month */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              يوم الشهر
            </label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className={fieldClass}
              required
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>اليوم {day}</option>
              ))}
            </select>
            <p className="text-[10px] text-text-muted mt-1.5">
              اليوم من كل شهر الذي يتم فيه إنشاء المعاملة (١–٢٨)
            </p>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                تاريخ البداية
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                تاريخ النهاية
                <span className="normal-case font-normal text-text-muted mr-1">(اختياري)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              ملاحظات
              <span className="normal-case font-normal text-text-muted mr-1">(اختياري)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldClass} resize-none`}
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary text-bg hover:bg-primary-dark transition-all duration-200 mt-1 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                جارٍ الإضافة...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة البند المتكرر
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
