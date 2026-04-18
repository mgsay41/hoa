import { z } from "zod/v4";

export const categorySchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
