"use client";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md bg-surface rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">تسجيل دخول الإدارة</h1>
        <p className="text-text-secondary text-center mb-8">
          اتحاد ملاك برج الوليد
        </p>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="admin@burjalwaleed.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">كلمة المرور</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors mt-2"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
