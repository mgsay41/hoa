import Link from "next/link";

export default function AdminDashboardPage() {
  const shortcuts = [
    {
      href: "/admin/transactions/new",
      label: "إضافة معاملة",
      desc: "تسجيل إيراد أو مصروف جديد",
      color: "border-primary/20 hover:border-primary/40 hover:bg-primary/5",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-primary">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      href: "/admin/recurring",
      label: "البنود المتكررة",
      desc: "إدارة المدفوعات الشهرية التلقائية",
      color: "border-border hover:border-border-light hover:bg-surface-elevated",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-secondary">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
    },
    {
      href: "/admin/recurring/new",
      label: "إضافة بند متكرر",
      desc: "جدولة معاملة شهرية تلقائية",
      color: "border-border hover:border-border-light hover:bg-surface-elevated",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-secondary">
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          <polyline points="7 23 3 19 7 15" />
          <circle cx="18" cy="6" r="4" />
          <line x1="18" y1="4" x2="18" y2="8" />
          <line x1="16" y1="6" x2="20" y2="6" />
        </svg>
      ),
    },
    {
      href: "/",
      label: "عرض الموقع العام",
      desc: "لوحة التحكم المالية للسكان",
      color: "border-border hover:border-border-light hover:bg-surface-elevated",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-secondary">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">نظرة عامة</h1>
        <p className="text-sm text-text-muted mt-1">مرحباً بك في لوحة إدارة برج الوليد</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-4 p-4 bg-surface border rounded-2xl transition-all duration-200 ${s.color}`}
          >
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{s.label}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-snug">{s.desc}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-text-muted mr-auto shrink-0">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
