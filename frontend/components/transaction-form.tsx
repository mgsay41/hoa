"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { paymentMethodLabels } from "@/lib/utils";

type Category = {
  id: string;
  nameAr: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
};

interface TransactionFormProps {
  categories: Category[];
}

const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary placeholder:text-text-muted text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

export function TransactionForm({ categories }: TransactionFormProps) {
  const { toast } = useToast();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType: "INCOME" | "EXPENSE") => {
    setType(newType);
    setCategoryId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !descriptionAr || !date) {
      toast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentType: "IMAGE" | "PDF" | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          toast("حدث خطأ أثناء رفع الملف", "error");
          setIsSubmitting(false);
          return;
        }
        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.url;
        attachmentType = uploadData.type;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, amount, date, descriptionAr, categoryId, paymentMethod,
          notes: notes || undefined, attachmentUrl, attachmentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "حدث خطأ أثناء إضافة المعاملة", "error");
        setIsSubmitting(false);
        return;
      }

      toast("تمت إضافة المعاملة بنجاح");
      setAmount(""); setDescriptionAr(""); setNotes(""); setFile(null);
      setCategoryId(""); setPaymentMethod("CASH");
      setDate(new Date().toISOString().split("T")[0]);
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">إضافة معاملة جديدة</h1>
        <p className="text-sm text-text-muted mt-1">أدخل تفاصيل المعاملة المالية</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              نوع المعاملة
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
              المبلغ
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

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              التاريخ
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
              required
            />
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

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              الوصف
            </label>
            <input
              type="text"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className={fieldClass}
              placeholder="وصف المعاملة"
              required
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={fieldClass}
            >
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              المرفقات
              <span className="normal-case font-normal text-text-muted mr-1">(اختياري)</span>
            </label>
            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-bg border border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors ${file ? "border-primary/40 bg-primary/5" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-muted shrink-0">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="text-sm text-text-muted flex-1 truncate">
                {file ? file.name : "اختر صورة أو PDF"}
              </span>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFile(null); }}
                  className="shrink-0 text-expense hover:text-expense/70 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
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
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-1 flex items-center justify-center gap-2 ${
              type === "INCOME"
                ? "bg-income text-bg hover:bg-income/90"
                : "bg-primary text-bg hover:bg-primary-dark"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                إضافة المعاملة
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
