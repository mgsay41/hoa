"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/4 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center fade-in">
        <p className="text-8xl font-bold text-primary/20 mb-2 leading-none select-none">٤٠٤</p>
        <h1 className="text-xl font-bold text-text-primary mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-text-muted mb-8 max-w-xs mx-auto">
          الصفحة التي تبحث عنها غير متاحة أو تم نقلها
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-bg rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all duration-200"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
