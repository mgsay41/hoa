"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/states";
import { formatAmount, paymentMethodLabels, fundLabels } from "@/lib/utils";

type Change = { from: unknown; to: unknown };

type Log = {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  summary: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_STYLE: Record<Log["action"], { label: string; cls: string }> = {
  CREATE: { label: "إضافة", cls: "bg-income-bg text-income" },
  UPDATE: { label: "تعديل", cls: "bg-warning-bg text-warning" },
  DELETE: { label: "حذف", cls: "bg-expense-bg text-expense" },
};

const ENTITY_LABELS: Record<string, string> = {
  TRANSACTION: "معاملة",
  CATEGORY: "فئة",
  RECURRING: "بند متكرر",
  UNIT: "وحدة",
  FUND_TRANSFER: "صندوق الطوارئ",
};

const FIELD_LABELS: Record<string, string> = {
  amount: "المبلغ",
  date: "التاريخ",
  descriptionAr: "الوصف",
  categoryId: "الفئة",
  paymentMethod: "طريقة الدفع",
  notes: "الملاحظات",
  attachmentUrl: "المرفق",
  attachmentType: "نوع المرفق",
  type: "النوع",
  fund: "الصندوق",
  unitId: "الوحدة",
  periodMonth: "شهر الاشتراك",
  periodYear: "سنة الاشتراك",
  nameAr: "الاسم",
  icon: "الأيقونة",
  color: "اللون",
  monthlyBudget: "الميزانية الشهرية",
  dayOfMonth: "يوم الشهر",
  endDate: "تاريخ النهاية",
  isActive: "الحالة",
  code: "رقم الوحدة",
  floor: "الدور",
  monthlyFee: "الاشتراك الشهري",
  duesStartDate: "بداية الاشتراك",
  lastGeneratedMonth: "آخر شهر مُنشأ",
  lastGeneratedYear: "آخر سنة مُنشأة",
};

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "amount" || field === "monthlyBudget" || field === "monthlyFee") return `${formatAmount(String(value))} ج.م`;
  if (field === "date" || field === "endDate" || field === "duesStartDate") {
    return new Date(String(value)).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  }
  if (field === "paymentMethod") return paymentMethodLabels[String(value)] ?? String(value);
  if (field === "fund") return fundLabels[String(value)] ?? String(value);
  if (field === "type") return value === "INCOME" ? "إيراد" : "مصروف";
  if (field === "isActive") return value ? "نشط" : "معطل";
  if (field === "attachmentUrl") return "مرفق";
  return String(value);
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });
  if (diff < 60) return "الآن";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

function fieldChanges(changes: Log["changes"]): [string, Change][] {
  if (!changes || "before" in changes) return [];
  return Object.entries(changes).filter(
    (entry): entry is [string, Change] => typeof entry[1] === "object" && entry[1] !== null && "to" in entry[1]
  );
}

export function AuditLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState<"" | Log["action"]>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (action) params.set("action", action);
      const res = await fetch(`/api/audit?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages || 1);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">سجل التغييرات</h1>
          <p className="text-sm text-text-muted mt-0.5">كل إضافة أو تعديل أو حذف تقوم به الإدارة يظهر هنا للجميع</p>
        </div>
        <div className="flex gap-0.5 bg-surface rounded-xl p-1 border border-border self-start" role="tablist" aria-label="نوع التغيير">
          {(["", "CREATE", "UPDATE", "DELETE"] as const).map((a) => (
            <button
              key={a || "all"}
              role="tab"
              aria-selected={action === a}
              onClick={() => {
                setLoading(true);
                setPage(1);
                setAction(a);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                action === a ? "bg-primary text-on-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {a ? ACTION_STYLE[a].label : "الكل"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14" />)}</div>
        ) : error ? (
          <ErrorState onRetry={() => { setLoading(true); fetchLogs(); }} />
        ) : logs.length === 0 ? (
          <EmptyState title="لا توجد تغييرات مسجلة بعد" />
        ) : (
          <ol className="divide-y divide-border">
            {logs.map((log) => {
              const fields = fieldChanges(log.changes);
              const style = ACTION_STYLE[log.action];
              return (
                <li key={log.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.cls}`}>{style.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-relaxed">{log.summary}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {ENTITY_LABELS[log.entity] ?? log.entity} • <time dateTime={log.createdAt} title={new Date(log.createdAt).toLocaleString("ar-EG")}>{relativeTime(log.createdAt)}</time>
                      </p>
                      {fields.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {fields.map(([field, c]) => (
                            <li key={field} className="text-[11px] flex flex-wrap items-center gap-1.5">
                              <span className="text-text-muted">{FIELD_LABELS[field] ?? field}:</span>
                              <span className="text-expense line-through decoration-expense/50">{formatValue(field, c.from)}</span>
                              <span className="text-text-muted">←</span>
                              <span className="text-income">{formatValue(field, c.to)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-border">
            <span className="text-xs text-text-muted">صفحة {page} من {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setLoading(true); setPage((p) => p - 1); }}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary disabled:opacity-30"
              >
                السابق
              </button>
              <button
                onClick={() => { setLoading(true); setPage((p) => p + 1); }}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary disabled:opacity-30"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
