import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createTransactionSchema,
  getTransactionsQuerySchema,
} from "@/lib/validations/transaction";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const parsed = getTransactionsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "معلمات غير صالحة" },
        { status: 400 }
      );
    }

    const {
      month,
      year,
      type,
      categoryId,
      page = "1",
      limit = "20",
    } = parsed.data;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      where.date = { gte: startDate, lt: endDate };
    } else if (year) {
      const y = parseInt(year);
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
    }

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        descriptionAr: data.descriptionAr,
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod,
        attachmentUrl: data.attachmentUrl || null,
        attachmentType: data.attachmentType || null,
        notes: data.notes || null,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
