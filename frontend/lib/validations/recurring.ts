import { z } from "zod/v4";

export const createRecurringSchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .string()
    .min(1, "المبلغ مطلوب")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "المبلغ يجب أن يكون رقماً موجباً",
    }),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  dayOfMonth: z
    .number()
    .int()
    .min(1, "يوم الشهر يجب أن يكون بين 1 و 28")
    .max(28, "يوم الشهر يجب أن يكون بين 1 و 28"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
