import { z } from "zod/v4";

const positiveAmount = z
  .string()
  .min(1, "المبلغ مطلوب")
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "المبلغ يجب أن يكون رقماً موجباً",
  });

const dayOfMonth = z
  .number()
  .int()
  .min(1, "يوم الشهر يجب أن يكون بين 1 و 28")
  .max(28, "يوم الشهر يجب أن يكون بين 1 و 28");

export const createRecurringSchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: positiveAmount,
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  dayOfMonth,
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;

// Type and start date are fixed once created; changes apply to future months only
export const updateRecurringSchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب").optional(),
  amount: positiveAmount.optional(),
  categoryId: z.string().min(1, "الفئة مطلوبة").optional(),
  dayOfMonth: dayOfMonth.optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
