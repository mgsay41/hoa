import { RecurringList } from "@/components/recurring-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "البنود المتكررة",
  description: "قائمة البنود المالية المتكررة التلقائية — اشتراكات وفواتير وصيانة",
};

export default function RecurringPage() {
  return <RecurringList />;
}
