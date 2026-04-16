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

export function RecurringForm({ categories }: RecurringFormProps) {
  const { toast } = useToast();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [nameAr, setNameAr] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
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
          nameAr,
          type,
          amount,
          categoryId,
          dayOfMonth: parseInt(dayOfMonth),
          startDate,
          endDate: endDate || undefined,
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

      setNameAr("");
      setAmount("");
      setCategoryId("");
      setDayOfMonth("1");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setNotes("");
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h1 className="text-2xl font-bold mb-6">إضافة بند متكرر جديد</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2">الاسم</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="اسم البند المتكرر"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">النوع</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("INCOME")}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  type === "INCOME"
                    ? "bg-primary text-white"
                    : "bg-bg text-text-secondary border border-border hover:bg-primary-light"
                }`}
              >
                إيراد
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("EXPENSE")}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  type === "EXPENSE"
                    ? "bg-expense text-white"
                    : "bg-bg text-text-secondary border border-border hover:bg-red-50"
                }`}
              >
                مصروف
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">المبلغ</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                placeholder="0.00"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                ج.م
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الفئة</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
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

          <div>
            <label className="block text-sm font-medium mb-2">يوم الشهر</label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              required
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <span className="text-xs text-text-muted mt-1 block">
              اليوم من كل شهر الذي يتم فيه إنشاء المعاملة (1-28)
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              تاريخ النهاية{" "}
              <span className="text-text-muted">(اختياري)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            />
            <span className="text-xs text-text-muted mt-1 block">
              اتركه فارغاً ليستمر إلى أجل غير مسمى
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition resize-none"
              rows={3}
              placeholder="ملاحظات إضافية (اختياري)"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة البند المتكرر"}
          </button>
        </form>
      </div>
    </div>
  );
}
