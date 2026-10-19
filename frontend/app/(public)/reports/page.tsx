import { Suspense } from "react";
import { Reports } from "@/components/reports";

export default function ReportsPage() {
  // useSearchParams (shareable report links) needs a Suspense boundary
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <Reports />
    </Suspense>
  );
}
