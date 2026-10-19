import { z } from "zod/v4";

const positiveAmount = z
  .string()
  .min(1, "المبلغ مطلوب")
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "المبلغ يجب أن يكون رقماً موجباً",
  });

export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: positiveAmount,
  date: z.string().min(1, "التاريخ مطلوب"),
  descriptionAr: z.string().min(1, "الوصف مطلوب"),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "OTHER"]),
  fund: z.enum(["OPERATING", "RESERVE"]).optional(),
  unitId: z.string().nullable().optional(),
  periodMonth: z.number().int().min(1).max(12).nullable().optional(),
  periodYear: z.number().int().min(2000).max(2100).nullable().optional(),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(["IMAGE", "PDF"]).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: positiveAmount.optional(),
  date: z.string().min(1, "التاريخ مطلوب").optional(),
  descriptionAr: z.string().min(1, "الوصف مطلوب").optional(),
  categoryId: z.string().min(1, "الفئة مطلوبة").optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "OTHER"]).optional(),
  fund: z.enum(["OPERATING", "RESERVE"]).optional(),
  unitId: z.string().nullable().optional(),
  periodMonth: z.number().int().min(1).max(12).nullable().optional(),
  periodYear: z.number().int().min(2000).max(2100).nullable().optional(),
  notes: z.string().nullable().optional(),
  // null clears the attachment
  attachmentUrl: z.string().nullable().optional(),
  attachmentType: z.enum(["IMAGE", "PDF"]).nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const getTransactionsQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  fund: z.enum(["OPERATING", "RESERVE"]).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
