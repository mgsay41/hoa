"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "لوحة التحكم" },
  { href: "/transactions", label: "المعاملات" },
  { href: "/recurring", label: "البنود المتكررة" },
  { href: "/reports", label: "التقارير" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              برج الوليد
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/admin/login"
            className="text-sm text-text-muted hover:text-primary transition-colors"
          >
            دخول الإدارة
          </Link>
        </div>
      </div>
    </nav>
  );
}
