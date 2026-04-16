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
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

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
          type,
          amount,
          date,
          descriptionAr,
          categoryId,
          paymentMethod,
          notes: notes || undefined,
          attachmentUrl,
          attachmentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "حدث خطأ أثناء إضافة المعاملة", "error");
        setIsSubmitting(false);
        return;
      }

      toast("تمت إضافة المعاملة بنجاح");

      setAmount("");
      setDescriptionAr("");
      setNotes("");
      setFile(null);
      setCategoryId("");
      setPaymentMethod("CASH");
      setDate(new Date().toISOString().split("T")[0]);
    } catch {
      toast("حدث خطأ غير متوقع", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h1 className="text-2xl font-bold mb-6">إضافة معاملة جديدة</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <label className="block text-sm font-medium mb-2">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              required
            />
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
            <label className="block text-sm font-medium mb-2">الوصف</label>
            <input
              type="text"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="وصف المعاملة"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            >
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">المرفقات</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition file:ml-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary file:px-4 file:py-1 file:cursor-pointer file:text-sm"
            />
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-expense hover:underline text-xs"
                >
                  إزالة
                </button>
              </div>
            )}
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
            {isSubmitting ? "جاري الإضافة..." : "إضافة المعاملة"}
          </button>
        </form>
      </div>
    </div>
  );
}
