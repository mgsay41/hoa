"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-text-secondary mb-2">الصفحة غير موجودة</p>
        <p className="text-text-muted mb-8">
          الصفحة التي تبحث عنها غير متوفرة أو تم نقلها
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
