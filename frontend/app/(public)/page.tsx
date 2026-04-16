import { Dashboard } from "@/components/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم المالية",
  description: "ملخص مالي شامل — الرصيد الحالي والإيرادات والمصروفات والتحليلات",
};

export default function HomePage() {
  return <Dashboard />;
}
