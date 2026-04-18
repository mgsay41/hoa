"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { signOut } from "@/lib/auth-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header — logo + logout only */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 h-14">
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-expense hover:bg-expense-bg transition-colors"
            aria-label="تسجيل الخروج"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          <span className="text-sm font-bold text-text-primary">
            <span className="text-primary">اطعام</span>
            <span className="text-text-muted font-normal"> | الإدارة</span>
          </span>

          <a
            href="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-colors"
            aria-label="العودة للموقع"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </a>
        </header>

        {/* Extra bottom padding on mobile so content clears the tab bar */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
