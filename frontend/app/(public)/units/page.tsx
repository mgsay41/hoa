import type { Metadata } from "next";
import { UnitsLedger } from "@/components/units-ledger";

export const metadata: Metadata = {
  title: "اشتراكات الوحدات",
  description: "حالة سداد الاشتراكات الشهرية لكل وحدة في البرج والمتأخرات",
};

export default function UnitsPage() {
  return <UnitsLedger />;
}
