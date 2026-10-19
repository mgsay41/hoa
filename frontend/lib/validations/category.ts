import { z } from "zod/v4";

export const categorySchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  // Empty / null removes the budget
  monthlyBudget: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "الميزانية يجب أن تكون رقماً موجباً",
    })
    .nullable()
    .optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
