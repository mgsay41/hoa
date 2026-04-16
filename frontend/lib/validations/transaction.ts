import { z } from "zod/v4";

export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .string()
    .min(1, "المبلغ مطلوب")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "المبلغ يجب أن يكون رقماً موجباً",
    }),
  date: z.string().min(1, "التاريخ مطلوب"),
  descriptionAr: z.string().min(1, "الوصف مطلوب"),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "OTHER"]),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(["IMAGE", "PDF"]).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const getTransactionsQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
