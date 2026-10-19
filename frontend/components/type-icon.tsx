export function TypeIcon({ type, size = "sm" }: { type: "INCOME" | "EXPENSE"; size?: "sm" | "md" }) {
  const isIncome = type === "INCOME";
  return (
    <div
      className={`${size === "md" ? "w-9 h-9" : "w-8 h-8"} rounded-xl flex items-center justify-center shrink-0 ${
        isIncome ? "bg-income-bg text-income" : "bg-expense-bg text-expense"
      }`}
      aria-label={isIncome ? "إيراد" : "مصروف"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {isIncome ? (
          <>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </>
        ) : (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </>
        )}
      </svg>
    </div>
  );
}
