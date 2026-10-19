import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTransactionFilters } from "@/lib/transaction-filters";
import { paymentMethodLabels } from "@/lib/utils";

const MAX_ROWS = 10000;

function csvCell(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV export of the filtered transactions — opens directly in Excel (UTF-8 BOM for Arabic). */
export async function GET(request: NextRequest) {
  try {
    const filters = parseTransactionFilters(new URL(request.url).searchParams);
    if (!filters) {
      return NextResponse.json({ error: "معلمات غير صالحة" }, { status: 400 });
    }

    const transactions = await prisma.transaction.findMany({
      where: filters.where,
      orderBy: filters.orderBy,
      include: { category: true, unit: { select: { code: true } } },
      take: MAX_ROWS,
    });

    const header = ["التاريخ", "النوع", "الوصف", "الفئة", "المبلغ", "طريقة الدفع", "الصندوق", "الوحدة", "ملاحظات", "المرفق"];
    const rows = transactions.map((tx) => [
      tx.date.toISOString().split("T")[0],
      tx.type === "INCOME" ? "إيراد" : "مصروف",
      tx.descriptionAr,
      tx.category.nameAr,
      (tx.type === "INCOME" ? 1 : -1) * Number(tx.amount),
      paymentMethodLabels[tx.paymentMethod] ?? tx.paymentMethod,
      tx.fund === "RESERVE" ? "صندوق الطوارئ" : "الحساب الجاري",
      tx.unit?.code ?? "",
      tx.notes ?? "",
      tx.attachmentUrl ?? "",
    ]);

    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const stamp = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${stamp}.csv"; filename*=UTF-8''${encodeURIComponent(`معاملات-برج-الوليد-${stamp}.csv`)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
