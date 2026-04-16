"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-expense mb-4">500</h1>
        <p className="text-xl text-text-secondary mb-2">حدث خطأ غير متوقع</p>
        <p className="text-text-muted mb-8">
          نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
