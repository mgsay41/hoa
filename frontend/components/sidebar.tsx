"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const sidebarLinks = [
  { href: "/admin/dashboard", label: "نظرة عامة", icon: "📊" },
  { href: "/admin/transactions/new", label: "إضافة معاملة", icon: "➕" },
  { href: "/admin/recurring", label: "البنود المتكررة", icon: "🔄" },
  { href: "/admin/recurring/new", label: "إضافة بند متكرر", icon: "➕🔄" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-surface border-l border-border p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            برج الوليد
          </span>
          <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
            إدارة
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-primary-light text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg"
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-8 flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          ← العودة للموقع
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-right"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
