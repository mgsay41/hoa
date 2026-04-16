export function formatAmount(amount: string | number): string {
  return Number(amount).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export const paymentMethodLabels: Record<string, string> = {
  CASH: "نقدي",
  BANK_TRANSFER: "تحويل بنكي",
  CHECK: "شيك",
  OTHER: "أخرى",
};

export const arabicMonths = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
