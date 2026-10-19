import { z } from "zod/v4";

export const unitSchema = z.object({
  code: z.string().trim().min(1, "رقم الوحدة مطلوب").max(10),
  floor: z.number().int().min(0).max(200),
  ownerName: z.string().nullable().optional(),
  monthlyFee: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "الاشتراك يجب أن يكون رقماً موجباً",
    }),
  duesStartDate: z.string().min(1, "تاريخ بدء الاشتراك مطلوب"),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export const collectDuesSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
  date: z.string().min(1, "التاريخ مطلوب"),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "OTHER"]),
  unitIds: z.array(z.string()).min(1, "اختر وحدة واحدة على الأقل"),
});

export const fundTransferSchema = z.object({
  direction: z.enum(["TO_RESERVE", "FROM_RESERVE"]),
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "المبلغ يجب أن يكون رقماً موجباً",
    }),
  date: z.string().min(1, "التاريخ مطلوب"),
  notes: z.string().optional(),
});
