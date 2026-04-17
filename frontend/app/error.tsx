"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-expense/4 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center fade-in">
        <p className="text-8xl font-bold text-expense/20 mb-2 leading-none select-none">٥٠٠</p>
        <h1 className="text-xl font-bold text-text-primary mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-text-muted mb-8 max-w-xs mx-auto">
          نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-bg rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all duration-200"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
