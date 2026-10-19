"use client";

import { useEffect, useState } from "react";

/**
 * Years that have transactions, plus the current year, newest first.
 * Replaces the hardcoded [2025, 2026, 2027] lists.
 */
export function useYears() {
  const current = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([current]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics/yearly")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { yearly: { year: number }[] } | null) => {
        if (cancelled || !data) return;
        const set = new Set([current, ...data.yearly.map((y) => y.year)]);
        setYears(Array.from(set).sort((a, b) => b - a));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [current]);

  return years;
}
