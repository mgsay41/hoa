import type { Metadata } from "next";
import { AuditLog } from "@/components/audit-log";

export const metadata: Metadata = {
  title: "سجل التغييرات",
  description: "سجل عام بكل الإضافات والتعديلات والحذف على البيانات المالية",
};

export default function AuditPage() {
  return <AuditLog />;
}
