"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const adminLinks = [
  {
    href: "/admin/dashboard",
    label: "الرئيسية",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
        <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
        <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
        <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      </svg>
    ),
  },
  {
    href: "/admin/transactions/new",
    label: "إضافة",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: "/admin/recurring",
    label: "متكررة",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    href: "/admin/recurring/new",
    label: "بند جديد",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        <polyline points="7 23 3 19 7 15" />
        <circle cx="18" cy="6" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <line x1="18" y1="4" x2="18" y2="8" />
        <line x1="16" y1="6" x2="20" y2="6" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col bg-surface border-l border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary leading-tight">برج الوليد</p>
              <p className="text-[10px] text-primary leading-tight">لوحة الإدارة</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-3 mb-2">القائمة</p>
          {adminLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                }`}
              >
                <span className={active ? "text-primary" : "text-text-muted"}>
                  {link.icon(active)}
                </span>
                <span>{link.label === "إضافة" ? "إضافة معاملة" : link.label === "بند جديد" ? "إضافة بند متكرر" : link.label}</span>
                {active && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border flex flex-col gap-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
            العودة للموقع
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-expense hover:bg-expense-bg transition-colors w-full text-right"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-stretch h-16">
          {adminLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  active ? "text-primary" : "text-text-muted"
                }`}
              >
                <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
                  {link.icon(active)}
                </span>
                <span className={`text-[10px] font-medium leading-none ${active ? "text-primary" : "text-text-muted"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
