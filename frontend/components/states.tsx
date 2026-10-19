import type { ReactNode } from "react";

export function ErrorState({
  message = "تعذر تحميل البيانات",
  onRetry,
  compact = false,
}: {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center gap-3 ${compact ? "py-8" : "py-16"}`}
    >
      <span className="w-11 h-11 rounded-2xl bg-expense-bg text-expense flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-medium text-text-primary">{message}</p>
        <p className="text-xs text-text-muted mt-1">تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
  compact = false,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-3 text-text-muted ${compact ? "py-8" : "py-16"}`}>
      {icon ?? (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="13" x2="13" y2="13" />
        </svg>
      )}
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small ▲▼ badge comparing a value with the previous period. */
export function TrendBadge({
  current,
  previous,
  goodWhenUp = true,
}: {
  current: number;
  previous: number;
  goodWhenUp?: boolean;
}) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return <span className="text-[10px] text-text-muted">جديد</span>;
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.5) {
    return <span className="text-[10px] text-text-muted">— بدون تغيير</span>;
  }
  const up = pct > 0;
  const good = up === goodWhenUp;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        good ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
      }`}
      title="مقارنة بالفترة السابقة"
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪
    </span>
  );
}
