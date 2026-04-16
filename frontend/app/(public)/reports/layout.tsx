import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التقارير المالية",
  description: "تقارير مالية شهرية وسنوية مع إمكانية التصدير PDF",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
